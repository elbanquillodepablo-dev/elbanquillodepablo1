import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env.local y llénalo.',
  );
}

/** Cliente único de Supabase (singleton). Usa solo la llave pública: la seguridad la da RLS. */
export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const PRODUCTS_BUCKET = 'products';

/** URL pública de un archivo del bucket de productos */
export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from(PRODUCTS_BUCKET).getPublicUrl(path).data.publicUrl;
}
