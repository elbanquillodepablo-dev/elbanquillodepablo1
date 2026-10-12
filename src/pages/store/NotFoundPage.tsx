import { Link } from 'react-router-dom';
import { useSeo } from '@/lib/seo';

export default function NotFoundPage() {
  useSeo({ title: 'Página no encontrada', noindex: true });
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div className="space-y-4">
        <p className="font-display text-[8rem] font-black leading-none text-volt">404</p>
        <h1 className="text-4xl font-extrabold tracking-tight">Fuera de juego</h1>
        <p className="text-mute">Esta página no está en la convocatoria.</p>
        <Link to="/" className="btn-primary">Volver al inicio</Link>
      </div>
    </div>
  );
}
