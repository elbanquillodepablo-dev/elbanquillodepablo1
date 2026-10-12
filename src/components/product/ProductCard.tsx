import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Product } from '@/types';
import { KIT_LABELS, VERSION_LABELS } from '@/lib/constants';
import { cn, discountPercent, formatPrice } from '@/lib/format';
import { useFavorites } from '@/context/FavoritesContext';
import { ProductImage } from './ProductImage';

export function ProductCard({ product, priority = false, index = 0 }: { product: Product; priority?: boolean; index?: number }) {
  const { has, toggle } = useFavorites();
  const fav = has(product.id);
  const off = discountPercent(product.price, product.compare_at_price);

  return (
    <article className="stagger group relative" style={{ '--i': index % 12 } as CSSProperties}>
      <Link to={`/producto/${product.slug}`} className="block rounded-[22px]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-surface ring-1 ring-line">
          <div className="h-full w-full transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]">
            <ProductImage image={product.images[0]} alt={product.name} kit={product.kit_type} priority={priority} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/60 to-transparent" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="chip bg-ink/70 text-fg ring-1 ring-line backdrop-blur">{KIT_LABELS[product.kit_type]}</span>
            {off && <span className="chip bg-card text-white">-{off}%</span>}
          </div>
        </div>
        <div className="mt-3.5 space-y-1 px-1">
          <p className="text-xs font-medium text-mute">
            {product.team}{product.season ? ` · ${product.season}` : ''}
          </p>
          <h3 className="font-sans text-[15px] font-semibold leading-snug tracking-tight text-fg line-clamp-2">{product.name}</h3>
          <div className="flex items-baseline justify-between gap-2 pt-0.5">
            <p className="tabular flex items-baseline gap-2">
              <span className="font-semibold">{formatPrice(product.price)}</span>
              {off && <span className="text-xs text-mute line-through">{formatPrice(product.compare_at_price!)}</span>}
            </p>
            <span className="text-[11px] text-mute">{VERSION_LABELS[product.version].replace('Versión ', '')}</span>
          </div>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggle(product.id)}
        aria-pressed={fav}
        aria-label={fav ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
        className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-ink/60 ring-1 ring-line backdrop-blur transition duration-200 hover:bg-ink/80 active:scale-95"
      >
        <Heart className={cn('size-[18px] transition-colors', fav ? 'fill-card text-card' : 'text-fg')} />
      </button>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} index={i} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4" aria-busy="true" aria-label="Cargando camisetas">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skeleton aspect-[4/5] rounded-[22px]" />
          <div className="skeleton mt-3.5 h-3 w-1/2 rounded-full" />
          <div className="skeleton mt-2.5 h-4 w-4/5 rounded-full" />
          <div className="skeleton mt-2.5 h-4 w-1/3 rounded-full" />
        </div>
      ))}
    </div>
  );
}
