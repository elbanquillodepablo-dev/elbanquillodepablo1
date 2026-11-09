import { useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, UserRoundX, Users } from 'lucide-react';
import { AdminTitle } from './AdminLayout';
import { Spinner } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { errorMessage, useToast } from '@/context/ToastContext';
import type { StaffRole } from '@/types';
import { formatDate } from '@/lib/format';

interface StaffMember { user_id: string; role: StaffRole; is_active: boolean; created_at: string; email: string }
interface TeamResponse { staff: StaffMember[] }

async function callStaffApi(token: string, method: 'GET' | 'POST', payload?: unknown): Promise<TeamResponse | { message: string }> {
  const response = await fetch('/api/admin/staff', {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(method === 'POST' ? { 'Content-Type': 'application/json' } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify(payload) } : {}),
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`El servicio de equipo no está disponible (HTTP ${response.status}). Inténtalo de nuevo en unos momentos.`);
  }
  const body = await response.json() as TeamResponse & { error?: string; message?: string };
  if (!response.ok) throw new Error(body.error || 'No se pudo completar la solicitud.');
  return body;
}

export default function StaffPage() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('operario');
  const [saving, setSaving] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['staff', session?.user.id],
    queryFn: async () => await callStaffApi(session!.access_token, 'GET') as TeamResponse,
    enabled: !!session,
  });

  const invite = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const result = await callStaffApi(session!.access_token, 'POST', { action: 'invite', email, role });
      toast('message' in result ? result.message : 'Invitación enviada');
      setEmail(''); await qc.invalidateQueries({ queryKey: ['staff'] });
    } catch (e) { toast(errorMessage(e), 'error'); }
    finally { setSaving(false); }
  };

  const deactivate = async (member: StaffMember) => {
    if (!window.confirm(`¿Quitar el acceso de ${member.email}?`)) return;
    setSaving(true);
    try {
      await callStaffApi(session!.access_token, 'POST', { action: 'deactivate', user_id: member.user_id });
      await qc.invalidateQueries({ queryKey: ['staff'] }); toast('Acceso desactivado');
    } catch (e) { toast(errorMessage(e), 'error'); }
    finally { setSaving(false); }
  };

  return <>
    <AdminTitle title="Equipo y accesos" />
    <p className="-mt-5 mb-6 max-w-2xl text-sm leading-relaxed text-mute">Invita personas usando su correo. Supabase les enviará un enlace para establecer el acceso. Los administradores gestionan productos, precios, fotos, promociones y ajustes; los operarios gestionan existencias, pedidos y tickets.</p>
    <div className="grid gap-6 xl:grid-cols-[minmax(300px,.7fr)_minmax(0,1.3fr)]">
      <form onSubmit={invite} className="h-fit space-y-4 rounded-2xl bg-surface p-5 ring-1 ring-line">
        <h2 className="text-xl font-extrabold">Invitar a alguien</h2>
        <label className="field">Correo electrónico<input required className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="field">Rol
          <select className="input" value={role} onChange={(e) => setRole(e.target.value as StaffRole)}>
            <option value="operario">Operario</option><option value="admin">Administrador</option>
          </select>
        </label>
        <button className="btn-primary w-full" disabled={saving}><UserPlus className="size-4"/>{saving ? 'Enviando…' : 'Enviar invitación'}</button>
        <p className="text-xs leading-relaxed text-mute">El enlace de invitación depende de que el correo de Supabase Auth esté configurado. La persona define su propia contraseña al aceptar.</p>
      </form>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-extrabold"><Users className="size-5 text-volt"/> Personas con acceso</h2>
        {isLoading ? <Spinner /> : error ? <p role="alert" className="rounded-xl bg-card/10 p-4 text-sm text-card">{errorMessage(error)}</p> : !data?.staff.length ? <p className="rounded-2xl bg-surface p-6 text-sm text-mute ring-1 ring-line">Todavía no hay personas en el equipo.</p> : data.staff.map((member) => <article key={member.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line">
          <div className="min-w-0"><p className="truncate font-bold">{member.email || 'Cuenta sin correo visible'}</p><p className="mt-1 text-xs text-mute">{member.role === 'admin' ? 'Administrador' : 'Operario'} · {member.is_active ? 'Acceso activo' : 'Acceso desactivado'} · agregado {formatDate(member.created_at)}</p></div>
          {member.is_active && member.user_id !== session?.user.id && <button className="btn-ghost h-11 text-card" disabled={saving} onClick={() => deactivate(member)}><UserRoundX className="size-4"/>Quitar acceso</button>}
        </article>)}
      </section>
    </div>
  </>;
}
