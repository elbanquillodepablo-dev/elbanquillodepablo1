import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { Product } from '@/types';
import { KIT_LABELS, VERSION_LABELS } from '@/lib/constants';
import { cn, discountPercent, formatPrice } from '@/lib/format';
import { useFavorites } from '@/context/FavoritesContext';
import { ProductImage } from './ProductImage';

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { has, toggle } = useFavorites();
  const fav = has(product.id);
  const off = discountPercent(product.price, product.compare_at_price);

  return (
    <article className="group relative">
      <Link to={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-chalk-2">
          <div className="h-full w-full transition duration-500 group-hover:scale-[1.04]">
            <ProductImage image={product.images[0]} alt={product.name} kit={product.kit_type} priority={priority} />
          </div>
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            <span className="chip bg-ink/90 text-chalk backdrop-blur">{KIT_LABELS[product.kit_type]}</span>
            {off && <span className="chip bg-card text-white">-{off}%</span>}
          </div>
        </div>
        <div className="mt-3 space-y-0.5 px-0.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-mute">
            {product.team}
            {product.season ? ` · ${product.season}` : ''}
          </p>
          <h3 className="font-sans text-[15px] font-bold leading-snug text-ink line-clamp-2">{product.name}</h3>
          <p className="text-xs text-mute">{VERSION_LABELS[product.version]}</p>
          <p className="flex items-baseline gap-2 pt-1">
            <span className="text-base font-extrabold">{formatPrice(product.price)}</span>
            {off && <span className="text-xs text-mute line-through">{formatPrice(product.compare_at_price!)}</span>}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggle(product.id)}
        aria-pressed={fav}
        aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        className="absolute right-2.5 top-2.5 grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-110"
      >
        <Heart className={cn('size-[18px] transition', fav ? 'fill-card text-card' : 'text-ink')} />
      </button>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] rounded-2xl bg-chalk-2" />
          <div className="mt-3 h-3 w-1/2 rounded bg-chalk-2" />
          <div className="mt-2 h-4 w-4/5 rounded bg-chalk-2" />
          <div className="mt-2 h-4 w-1/3 rounded bg-chalk-2" />
        </div>
      ))}
    </div>
  );
}
