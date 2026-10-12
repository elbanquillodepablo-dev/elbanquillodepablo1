// Netlify Edge Function → reutiliza el handler estándar de /api
import handler from '../../api/sitemap.ts';

export default handler;
export const config = { path: '/sitemap.xml' };
