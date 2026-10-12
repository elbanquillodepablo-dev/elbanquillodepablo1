import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AtSign, Clock, MapPin, MessageCircle } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useSettings } from '@/hooks/queries';
import { whatsappLink } from '@/lib/whatsapp';

export function Footer() {
  const { data: s } = useSettings();

  return (
    <footer className="mt-28 border-t border-line bg-ink pb-24 sm:pb-0">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.6fr_1fr_1fr]">
        <div className="space-y-5">
          <Logo />
          <p className="max-w-sm leading-relaxed text-mute">
            Camisetas de fútbol para los que viven el partido desde el calentamiento. Clubes, selecciones y clásicos retro.
          </p>
          {s && (
            <a href={whatsappLink(s.whatsapp_number, 'Hola, quiero información sobre las camisetas.')} target="_blank" rel="noreferrer" className="btn-volt">
              <MessageCircle className="size-4" /> Escríbenos por WhatsApp
            </a>
          )}
        </div>

        <FooterCol title="Tienda">
          <li><Link to="/tienda" className="hover:text-fg">Todas las camisetas</Link></li>
          <li><Link to="/tienda?tipo=local" className="hover:text-fg">Equipación local</Link></li>
          <li><Link to="/tienda?tipo=visitante" className="hover:text-fg">Equipación visitante</Link></li>
          <li><Link to="/tienda?publico=nino" className="hover:text-fg">Niños</Link></li>
          <li><Link to="/favoritos" className="hover:text-fg">Mis favoritos</Link></li>
        </FooterCol>

        <FooterCol title="Atención">
          {s?.hours && <li className="flex gap-2.5"><Clock className="mt-0.5 size-4 shrink-0 text-volt" /> {s.hours}</li>}
          {s?.city && <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-volt" /> {s.city}</li>}
          {s?.instagram_url && (
            <li><a href={s.instagram_url} target="_blank" rel="noreferrer" className="flex gap-2.5 hover:text-fg"><AtSign className="mt-0.5 size-4 text-volt" /> Instagram</a></li>
          )}
        </FooterCol>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-mute sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} El Banquillo de Pablo · Precios en pesos colombianos</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal">
            <Link to="/terminos" className="hover:text-fg">Términos y compra segura</Link>
            <Link to="/privacidad" className="hover:text-fg">Tratamiento de datos</Link>
            <a href="https://www.sic.gov.co" target="_blank" rel="noreferrer" className="hover:text-fg">SIC</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-fg">{title}</h3>
      <ul className="space-y-3 text-sm text-mute">{children}</ul>
    </div>
  );
}
