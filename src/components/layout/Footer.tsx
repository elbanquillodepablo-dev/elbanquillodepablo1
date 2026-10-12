import { Link } from 'react-router-dom';
import { AtSign, MessageCircle, Clock, MapPin } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useSettings } from '@/hooks/queries';
import { whatsappLink } from '@/lib/whatsapp';

export function Footer() {
  const { data: s } = useSettings();

  return (
    <footer className="pitch-lines mt-24 bg-ink text-chalk">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo inverted />
          <p className="max-w-sm text-sm text-chalk/70">
            Camisetas de fútbol para los que viven el partido desde el primer minuto. Clubes, selecciones y clásicos retro.
          </p>
          {s && (
            <a href={whatsappLink(s.whatsapp_number, '¡Hola! Quiero información sobre las camisetas.')} target="_blank" rel="noreferrer" className="btn-volt">
              <MessageCircle className="size-4" /> Escríbenos por WhatsApp
            </a>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-lg font-extrabold uppercase text-volt">Tienda</h3>
          <ul className="space-y-2 text-sm text-chalk/80">
            <li><Link to="/tienda" className="hover:text-volt">Todas las camisetas</Link></li>
            <li><Link to="/tienda?tipo=local" className="hover:text-volt">Equipación local</Link></li>
            <li><Link to="/tienda?tipo=visitante" className="hover:text-volt">Equipación visitante</Link></li>
            <li><Link to="/tienda?publico=nino" className="hover:text-volt">Niños</Link></li>
            <li><Link to="/favoritos" className="hover:text-volt">Mis favoritos</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-extrabold uppercase text-volt">Atención</h3>
          <ul className="space-y-3 text-sm text-chalk/80">
            {s?.hours && <li className="flex gap-2"><Clock className="size-4 shrink-0 text-volt" /> {s.hours}</li>}
            {s?.city && <li className="flex gap-2"><MapPin className="size-4 shrink-0 text-volt" /> {s.city}</li>}
            {s?.instagram_url && (
              <li>
                <a href={s.instagram_url} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-volt">
                  <AtSign className="size-4 text-volt" /> Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-chalk/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-chalk/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} El Banquillo de Pablo. Precios en COP.</p>
          <p>{s?.shipping_note}</p>
        </div>
      </div>
    </footer>
  );
}
