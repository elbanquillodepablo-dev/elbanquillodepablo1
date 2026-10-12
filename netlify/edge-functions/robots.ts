// Netlify Edge Function → reutiliza el handler estándar de /api
import handler from '../../api/robots.ts';

export default handler;
export const config = { path: '/robots.txt' };
