import { createClient } from '@supabase/supabase-js';

type StaffRole = 'admin' | 'operario';
type StaffRow = { user_id: string; role: StaffRole; is_active: boolean; created_at: string };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) return json({ error: 'Origen inválido' }, 403);

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return json({ error: 'Inicia sesión para gestionar el equipo.' }, 401);
  if (!url || !key) return json({ error: 'Falta configurar el acceso administrativo a Supabase en Vercel.' }, 503);

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return json({ error: 'La sesión venció. Inicia sesión de nuevo.' }, 401);

  const { data: actor, error: actorError } = await supabase.from('admins')
    .select('user_id, role, is_active').eq('user_id', authData.user.id).maybeSingle();
  if (actorError || !actor?.is_active || actor.role !== 'admin') return json({ error: 'Solo administradores pueden gestionar el equipo.' }, 403);

  if (req.method === 'GET') {
    const { data: staff, error } = await supabase.from('admins')
      .select('user_id, role, is_active, created_at').order('created_at', { ascending: true });
    if (error) return json({ error: 'No se pudo cargar el equipo.' }, 500);
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return json({ error: 'No se pudieron cargar los correos del equipo.' }, 500);
    const byId = new Map(users.users.map((user) => [user.id, user.email ?? '']));
    return json({ staff: (staff as StaffRow[]).map((member) => ({ ...member, email: byId.get(member.user_id) ?? '' })) });
  }

  const contentLength = Number(req.headers.get('content-length') ?? 0);
  if (contentLength > 4096) return json({ error: 'Solicitud demasiado grande' }, 413);
  let body: { action?: string; email?: string; role?: string; user_id?: string };
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 4096) return json({ error: 'Solicitud demasiado grande' }, 413);
    body = JSON.parse(raw) as typeof body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Solicitud inválida' }, 400);
  } catch { return json({ error: 'Solicitud inválida' }, 400); }

  if (body.action === 'invite') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = body.role;
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Escribe un correo válido.' }, 400);
    if (email === authData.user.email?.toLowerCase()) return json({ error: 'Usa otro correo para invitar a una persona distinta.' }, 400);
    if (role !== 'admin' && role !== 'operario') return json({ error: 'Selecciona un rol válido.' }, 400);

    const { error: inviteError } = await supabase.from('staff_invites').upsert({
      email, role, invited_by: authData.user.id, expires_at: new Date(Date.now() + 7 * 86400_000).toISOString(),
    }, { onConflict: 'email' });
    if (inviteError) return json({ error: 'No se pudo preparar la invitación.' }, 500);

    const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return json({ error: 'No se pudo revisar la cuenta invitada.' }, 500);
    const existing = list.users.find((user) => user.email?.toLowerCase() === email);
    if (existing) {
      const { error } = await supabase.from('admins').upsert({ user_id: existing.id, role, is_active: true }, { onConflict: 'user_id' });
      await supabase.from('staff_invites').delete().eq('email', email);
      if (error) return json({ error: 'La cuenta existe, pero no se pudo asignar el rol.' }, 500);
      return json({ message: 'La cuenta ya existía y ahora tiene acceso al panel.' });
    }

    const site = 'https://elbanquillodepablo.vercel.app';
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo: `${site}/admin/activar` });
    if (error) {
      await supabase.from('staff_invites').delete().eq('email', email);
      return json({ error: 'Supabase no pudo enviar la invitación. Revisa el correo o la configuración de Auth.' }, 400);
    }
    return json({ message: 'Invitación enviada. Cuando la persona acepte, podrá entrar con el rol asignado.' });
  }

  if (body.action === 'deactivate') {
    const id = typeof body.user_id === 'string' ? body.user_id : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return json({ error: 'Usuario inválido.' }, 400);
    if (id === authData.user.id) return json({ error: 'No puedes quitarte tu propio acceso.' }, 400);
    const { data: member, error } = await supabase.from('admins').select('role,is_active').eq('user_id', id).maybeSingle();
    if (error || !member) return json({ error: 'No se encontró esa persona.' }, 404);
    const { error: updateError } = await supabase.rpc('deactivate_staff', { p_actor_id: authData.user.id, p_user_id: id });
    if (updateError) return json({ error: updateError.message || 'No se pudo quitar el acceso.' }, 400);
    return json({ message: 'Acceso desactivado.' });
  }

  return json({ error: 'Acción no válida.' }, 400);
}

// Explicit Web Handler: a bare default function receives Node req/res in Vercel.
export default {
  async fetch(req: Request): Promise<Response> {
    try {
      return await handler(req);
    } catch {
      return json({ error: 'No se pudo conectar con el servicio de equipo. Inténtalo de nuevo en unos momentos.' }, 500);
    }
  },
};
