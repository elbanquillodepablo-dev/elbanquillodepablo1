// Netlify Edge Function: inyecta título, Open Graph y JSON-LD en /producto/:slug
// para que WhatsApp, Facebook y Google vean la foto y el precio.
import handler from '../../api/product-meta.ts';

export default handler;
export const config = { path: '/producto/*' };
