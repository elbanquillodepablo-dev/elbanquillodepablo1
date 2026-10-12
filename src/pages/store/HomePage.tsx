import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, MessageCircle, PackageCheck, Ruler, Truck, WifiOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCategories, useProducts, useSettings } from '@/hooks/queries';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductCard';
import { ProductImage } from '@/components/product/ProductImage';
import { KIT_LABELS, VERSION_LABELS } from '@/lib/constants';
import { cn, formatPrice } from '@/lib/format';
import { whatsappLink } from '@/lib/whatsapp';
import type { Product } from '@/types';

export default function HomePage() {
  const { data: settings } = useSettings();
  const { data: categories = [] } = useCategories();
  const featured = useProducts({ featured: true });
  const all = useProducts();
  const products = all.data ?? [];
  const spotlight = featured.data?.[0] ?? products[0];
  const collage = [spotlight, ...products.filter((p) => p.id !== spotlight?.id)].filter(Boolean).slice(0, 3) as Product[];
  const teams = Array.from(new Set(products.map((p) => p.team)));

  return (
    <>
      {/* HERO — split asimétrico: texto a la izquierda, collage a la derecha */}
      <section className="stadium-glow -mt-[76px] pt-[76px]">
        <div className="container-page grid items-center gap-12 pb-16 pt-10 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
          <div className="animate-fade-up space-y-7">
            <p className="eyebrow">Temporada 2026/27</p>
            <h1 className="max-w-[12ch] text-[clamp(2.75rem,7vw,5.75rem)] font-extrabold leading-[0.92] tracking-[-0.05em]">
              {settings?.hero_title ?? 'Vístete de titular'}<span className="text-volt">.</span>
            </h1>
            <p className="max-w-[46ch] text-lg leading-relaxed text-mute">
              {settings?.hero_subtitle ?? 'Camisetas de clubes y selecciones. Local, visitante y tercera.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/tienda" className="btn-volt h-13 px-7 text-base">
                Explorar camisetas <ArrowRight className="size-4" />
              </Link>
              {settings && (
                <a href={whatsappLink(settings.whatsapp_number, 'Hola, quiero asesoría para elegir mi camiseta.')}
                  target="_blank" rel="noreferrer" className="btn-ghost h-13 px-6 text-base">
                  <MessageCircle className="size-4" /> Asesoría por WhatsApp
                </a>
              )}
            </div>
          </div>

          <HeroCollage products={collage} loading={all.isLoading} />
        </div>
      </section>

      {/* MARQUEE de equipos */}
      {teams.length > 0 && <TeamMarquee teams={teams} />}

      {/* CATEGORÍAS — bento */}
      {categories.length > 0 && (
        <section className="container-page pt-20">
          <SectionHeader eyebrow="Convocatoria" title="Compra por categoría" />
          <div className="grid auto-rows-[180px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                to={`/tienda?categoria=${c.slug}`}
                style={{ '--i': i } as CSSProperties}
                className={cn(
                  'stagger group relative flex flex-col justify-end overflow-hidden rounded-[22px] p-5 ring-1 ring-line transition-colors duration-300',
                  i === 0 ? 'col-span-2 row-span-2 bg-pitch hover:bg-pitch-2 md:p-8' : 'bg-surface hover:bg-surface-2',
                  i === 3 && 'col-span-2',
                )}
              >
                <span className="tabular absolute right-5 top-4 text-sm font-medium text-fg/40">{String(i + 1).padStart(2, '0')}</span>
                <ArrowUpRight className="absolute right-5 top-12 size-5 text-volt opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                <h3 className={cn('font-bold tracking-tight', i === 0 ? 'text-4xl md:text-6xl' : 'text-2xl md:text-3xl')}>{c.name}</h3>
                {c.description && <p className={cn('mt-1 text-sm text-fg/60', i !== 0 && 'line-clamp-1')}>{c.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* EL TITULAR DE LA TEMPORADA — spotlight */}
      {spotlight && (
        <section className="container-page pt-24">
          <div className="panel grid overflow-hidden md:grid-cols-2">
            <Link to={`/producto/${spotlight.slug}`} className="relative aspect-[4/5] bg-surface-2 md:aspect-auto md:min-h-[520px]">
              <ProductImage image={spotlight.images[0]} alt={spotlight.name} kit={spotlight.kit_type} variant="full" />
            </Link>
            <div className="flex flex-col justify-center gap-6 p-7 md:p-12">
              <p className="eyebrow">El titular de la temporada</p>
              <h2 className="text-4xl font-extrabold leading-[0.95] tracking-[-0.04em] md:text-5xl">{spotlight.name}</h2>
              {spotlight.description && <p className="max-w-[48ch] leading-relaxed text-mute">{spotlight.description}</p>}
              <dl className="grid grid-cols-3 border-y border-line py-5 text-sm">
                <div><dt className="text-mute">Equipación</dt><dd className="mt-1 font-semibold">{KIT_LABELS[spotlight.kit_type]}</dd></div>
                <div><dt className="text-mute">Versión</dt><dd className="mt-1 font-semibold">{VERSION_LABELS[spotlight.version].replace('Versión ', '')}</dd></div>
                <div><dt className="text-mute">Tallas</dt><dd className="mt-1 font-semibold">{spotlight.sizes.join(' · ')}</dd></div>
              </dl>
              <div className="flex flex-wrap items-center gap-5">
                <span className="tabular text-3xl font-bold tracking-tight">{formatPrice(spotlight.price)}</span>
                <Link to={`/producto/${spotlight.slug}`} className="btn-primary">Ver camiseta <ArrowRight className="size-4" /></Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CATÁLOGO */}
      <section className="container-page pt-24">
        <SectionHeader eyebrow="Catálogo" title="Todas las camisetas, en un solo lugar." link="/tienda" />
        {all.isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : all.isError ? (
          <EmptyState icon={<WifiOff />} title="Sin conexión con el estadio">
            No pudimos cargar las camisetas. Revisa tu conexión e inténtalo de nuevo.
            <div className="mt-4"><button onClick={() => all.refetch()} className="btn-ghost">Reintentar</button></div>
          </EmptyState>
        ) : (
          <ProductGrid products={products.slice(0, 8)} />
        )}
      </section>

      {/* CONFIANZA — lista con divisores, no tarjetas */}
      <section className="container-page pt-24">
        <div className="grid divide-y divide-line border-y border-line md:grid-cols-[1fr_1fr_1fr] md:divide-x md:divide-y-0">
          {[
            { icon: Truck, title: 'Envíos a toda Colombia', text: 'Coordinamos transportadora y tiempos contigo por WhatsApp.' },
            { icon: Ruler, title: 'Fan o jugador', text: 'Corte regular o ajustado. Te asesoramos con la talla antes de pagar.' },
            { icon: PackageCheck, title: 'Confirmas antes de pagar', text: 'Verificamos disponibilidad, precio final y envío. Sin sorpresas.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 py-7 md:px-8 md:first:pl-0">
              <Icon className="mt-0.5 size-6 shrink-0 text-volt" strokeWidth={1.75} />
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-mute">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function HeroCollage({ products, loading }: { products: Product[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid h-[460px] grid-cols-[1.4fr_1fr] grid-rows-2 gap-3 md:h-[560px]">
        <div className="skeleton row-span-2 rounded-[22px]" />
        <div className="skeleton rounded-[22px]" />
        <div className="skeleton rounded-[22px]" />
      </div>
    );
  }
  if (!products.length) return null;
  const [main, ...rest] = products;
  return (
    <div className="grid h-[460px] grid-cols-[1.4fr_1fr] grid-rows-2 gap-3 md:h-[560px]">
      <CollageTile product={main} className={cn(rest.length ? 'row-span-2' : 'col-span-2 row-span-2')} priority index={0} />
      {rest.map((p, i) => <CollageTile key={p.id} product={p} className={rest.length === 1 ? 'row-span-2' : ''} index={i + 1} />)}
    </div>
  );
}

function CollageTile({ product, className, priority = false, index }: { product: Product; className?: string; priority?: boolean; index: number }) {
  return (
    <Link to={`/producto/${product.slug}`} style={{ '--i': index * 2 } as CSSProperties}
      className={cn('stagger group relative overflow-hidden rounded-[22px] bg-surface ring-1 ring-line', className)}>
      <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]">
        <ProductImage image={product.images[0]} alt={product.name} kit={product.kit_type} variant="full" priority={priority} />
      </div>
      <div className="absolute inset-x-2.5 bottom-2.5 flex items-center justify-between gap-3 rounded-2xl bg-ink/70 px-3.5 py-2.5 ring-1 ring-line backdrop-blur-md">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-volt">{KIT_LABELS[product.kit_type]}</p>
          <p className="truncate text-sm font-semibold">{product.team}</p>
        </div>
        <p className="tabular shrink-0 text-sm font-semibold">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}

function TeamMarquee({ teams }: { teams: string[] }) {
  // se repite para que el bucle sea continuo
  const items = Array.from({ length: Math.max(2, Math.ceil(12 / teams.length)) }, () => teams).flat();
  return (
    <div className="overflow-hidden border-y border-line bg-ink py-5" aria-hidden="true">
      <div className="flex w-max animate-marquee gap-10 pr-10">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-10 font-brand text-3xl font-black uppercase tracking-tight text-fg/80">
            {t}<span className="size-2 rounded-full bg-volt" />
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, link }: { eyebrow: string; title: string; link?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div className="space-y-2">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="max-w-[18ch] text-3xl font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-5xl">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="hidden shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium text-mute ring-1 ring-line transition hover:text-fg hover:ring-line-strong sm:flex">
          Ver todo <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
