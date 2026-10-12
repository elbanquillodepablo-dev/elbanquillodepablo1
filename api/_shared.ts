// Utilidades compartidas por las funciones de servidor (Request -> Response estándar).
// Se usan en Netlify Edge Functions (netlify/edge-functions) y en Vercel (api/).
// Usan solo la llave pública: la seguridad la sigue garantizando RLS en Supabase.

type EnvHost = {
  Netlify?: { env: { get(key: string): string | undefined } };
  process?: { env: Record<string, string | undefined> };
};

/** Lee variables de entorno en Netlify (Deno) o Vercel/Node */
export function env(key: string): string {
  const g = globalThis as unknown as EnvHost;
  return g.Netlify?.env.get(key) ?? g.process?.env[key] ?? '';
}

export function siteOrigin(req: Request): string {
  return (env('VITE_SITE_URL') || new URL(req.url).origin).replace(/\/$/, '');
}

export async function supabaseGet<T>(pathAndQuery: string): Promise<T> {
  const key = env('VITE_SUPABASE_PUBLISHABLE_KEY');
  const res = await fetch(`${env('VITE_SUPABASE_URL')}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}`);
  return (await res.json()) as T;
}

export const publicImage = (path: string) => `${env('VITE_SUPABASE_URL')}/storage/v1/object/public/products/${path}`;

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** JSON dentro de <script>: evita cerrar la etiqueta con "</script>" */
export const safeJson = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
