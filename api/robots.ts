import { siteOrigin } from './_shared.ts';

export const config = { runtime: 'edge' };

/** /robots.txt con la URL del sitemap según el dominio real (vercel.app o propio). */
export default function handler(req: Request): Response {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /checkout',
    'Disallow: /favoritos',
    'Disallow: /api/',
    '',
    `Sitemap: ${siteOrigin(req)}/sitemap.xml`,
    '',
  ].join('\n');
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' },
  });
}
