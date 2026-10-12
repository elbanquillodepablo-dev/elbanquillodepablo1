// Utilidades compartidas por las funciones serverless de Vercel (carpeta /api).
// Usan solo la llave pública: la seguridad la sigue garantizando RLS en Supabase.

declare const process: { env: Record<string, string | undefined> };

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

export function siteOrigin(req: Request): string {
  return (process.env.VITE_SITE_URL || new URL(req.url).origin).replace(/\/$/, '');
}

export async function supabaseGet<T>(pathAndQuery: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return (await res.json()) as T;
}

export const publicImage = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/products/${path}`;

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** JSON dentro de <script>: evita cerrar la etiqueta con "</script>" */
export const safeJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
