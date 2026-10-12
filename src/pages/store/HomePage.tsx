import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, ShieldCheck, Truck, Shirt } from 'lucide-react';
import { useCategories, useProducts, useSettings } from '@/hooks/queries';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductCard';
import { ProductImage } from '@/components/product/ProductImage';
import { KIT_LABELS } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { whatsappLink } from '@/lib/whatsapp';

export default function HomePage() {
  const { data: settings } = useSettings();
  const { data: categories = [] } = useCategories();
  const featured = useProducts({ featured: true });
  const latest = useProducts({ sort: 'recientes' });
  const hero = featured.data?.[0] ?? latest.data?.[0];

  return (
    <>
      {/* HERO */}
      <section className="pitch-lines relative overflow-hidden bg-ink text-chalk">
        <div className="container-page grid items-center gap-10 py-14 md:grid-cols-2 md:py-20">
          <div className="animate-fade-up space-y-6">
            <span className="chip bg-volt text-ink">Temporada 2026/27</span>
            <h1 className="text-[clamp(3rem,9vw,6.5rem)] font-black uppercase leading-[0.85]">
              {settings?.hero_title ?? 'Vístete de titular'}
            </h1>
            <p className="max-w-md text-base text-chalk/75 md:text-lg">
              {settings?.hero_subtitle ?? 'Camisetas de clubes y selecciones. Local, visitante y tercera.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/tienda" className="btn-volt h-12 px-7 text-base">
                Ver la tienda <ArrowRight className="size-4" />
              </Link>
              {settings && (
                <a href={whatsappLink(settings.whatsapp_number, '¡Hola! Quiero asesoría para elegir mi camiseta.')} target="_blank" rel="noreferrer" className="btn h-12 px-6 text-chalk ring-1 ring-chalk/25 hover:bg-chalk/10">
                  <MessageCircle className="size-4" /> Asesoría
                </a>
              )}
            </div>
          </div>

          {hero && (
            <Link to={`/producto/${hero.slug}`} className="group relative mx-auto w-full max-w-sm md:max-w-md">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-volt/10 blur-2xl" aria-hidden="true" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-ink-3 ring-1 ring-chalk/10">
                <ProductImage image={hero.images[0]} alt={hero.name} kit={hero.kit_type} variant="full" priority />
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-2xl bg-ink/80 p-3 backdrop-blur">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-volt">{KIT_LABELS[hero.kit_type]}</p>
                    <p className="font-bold leading-tight">{hero.name}</p>
                  </div>
                  <p className="font-display text-2xl font-black">{formatPrice(hero.price)}</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="border-b border-ink/10 bg-chalk">
        <div className="container-page grid grid-cols-1 gap-4 py-6 sm:grid-cols-3">
          {[
            { icon: Truck, title: 'Envíos a toda Colombia', text: 'Coordinamos tu envío por WhatsApp.' },
            { icon: Shirt, title: 'Fan y jugador', text: 'Elige corte holgado o ajustado.' },
            { icon: ShieldCheck, title: 'Compra segura', text: 'Confirmamos todo antes de pagar.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-pitch text-volt"><Icon className="size-5" /></span>
              <div>
                <p className="text-sm font-extrabold">{title}</p>
                <p className="text-xs text-mute">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORÍAS */}
      {categories.length > 0 && (
        <section className="container-page pt-16">
          <SectionTitle eyebrow="Convocatoria" title="Elige tu once" />
          <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                to={`/tienda?categoria=${c.slug}`}
                className="group relative flex min-h-40 w-64 shrink-0 snap-start flex-col justify-end overflow-hidden rounded-2xl bg-pitch p-5 text-chalk transition hover:bg-pitch-2 sm:w-auto"
              >
                <span className="font-display absolute -right-2 -top-6 text-[7rem] font-black leading-none text-chalk/10">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-3xl font-black uppercase">{c.name}</h3>
                <p className="text-sm text-chalk/70">{c.description}</p>
                <ArrowRight className="mt-3 size-5 text-volt transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* DESTACADOS */}
      <section className="container-page pt-16">
        <SectionTitle eyebrow="Titulares" title="Lo más pedido" link="/tienda" />
        {featured.isLoading ? <ProductGridSkeleton count={4} /> : <ProductGrid products={(featured.data?.length ? featured.data : latest.data ?? []).slice(0, 8)} />}
      </section>

      {/* NOVEDADES */}
      <section className="container-page pt-16">
        <SectionTitle eyebrow="Recién llegadas" title="Nuevas en el banquillo" link="/tienda?orden=recientes" />
        {latest.isLoading ? <ProductGridSkeleton count={4} /> : <ProductGrid products={(latest.data ?? []).slice(0, 8)} />}
      </section>
    </>
  );
}

function SectionTitle({ eyebrow, title, link }: { eyebrow: string; title: string; link?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-pitch">{eyebrow}</p>
        <h2 className="text-4xl font-black uppercase leading-none sm:text-5xl">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="flex shrink-0 items-center gap-1 text-sm font-bold hover:text-pitch">
          Ver todo <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
