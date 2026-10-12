import { siteOrigin, supabaseGet } from './_shared.ts';

export const config = { runtime: 'edge' };

interface Row { slug: string; updated_at?: string }

/** /sitemap.xml dinámico: inicio, tienda, categorías, productos activos y páginas legales. */
export default async function handler(req: Request): Promise<Response> {
  const origin = siteOrigin(req);
  const [products, categories] = await Promise.all([
    supabaseGet<Row[]>('products?select=slug,updated_at&is_active=eq.true&order=updated_at.desc').catch(() => []),
    supabaseGet<Row[]>('categories?select=slug&is_active=eq.true').catch(() => []),
  ]);

  const url = (loc: string, priority: string, lastmod?: string) =>
    `  <url><loc>${origin}${loc}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}<priority>${priority}</priority></url>`;

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    url('/', '1.0'),
    url('/tienda', '0.9'),
    ...categories.map((c) => url(`/tienda?categoria=${encodeURIComponent(c.slug)}`.replace(/&/g, '&amp;'), '0.8')),
    ...products.map((p) => url(`/producto/${encodeURIComponent(p.slug)}`, '0.8', p.updated_at)),
    url('/terminos', '0.3'),
    url('/privacidad', '0.3'),
    '</urlset>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
