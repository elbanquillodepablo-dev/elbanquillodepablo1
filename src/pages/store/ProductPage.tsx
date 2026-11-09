import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Heart, MessageCircle, Ruler, ShoppingBag } from 'lucide-react';
import { useProduct, useProducts, useSettings } from '@/hooks/queries';
import { ProductImage } from '@/components/product/ProductImage';
import { ProductGrid } from '@/components/product/ProductCard';
import { EmptyState, Spinner } from '@/components/ui/EmptyState';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/context/ToastContext';
import { AUDIENCE_LABELS, KIT_LABELS, VERSION_LABELS } from '@/lib/constants';
import { cn, discountPercent, formatPrice } from '@/lib/format';
import { publicImageUrl } from '@/lib/supabase';
import { productInquiryMessage, whatsappLink } from '@/lib/whatsapp';
import { absoluteUrl, SITE_NAME, useSeo } from '@/lib/seo';
import type { Product } from '@/types';
import { getInventoryAvailability } from '@/services/commerce';

/** schema.org Product + BreadcrumbList para resultados enriquecidos en Google */
function productJsonLd(p: Product) {
  const url = absoluteUrl(`/producto/${p.slug}`);
  const images = p.images.map((i) => publicImageUrl(i.path)).filter(Boolean);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description ?? `${p.name} – ${KIT_LABELS[p.kit_type]} ${p.season ?? ''}`.trim(),
      sku: p.slug,
      ...(images.length ? { image: images } : {}),
      brand: { '@type': 'Brand', name: p.team },
      category: 'Camisetas de fútbol',
      size: p.sizes,
      offers: {
        '@type': 'Offer',
        url,
        price: p.price,
        priceCurrency: 'COP',
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: SITE_NAME },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CO' },
        },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Tienda', item: absoluteUrl('/tienda') },
        { '@type': 'ListItem', position: 3, name: p.name, item: url },
      ],
    },
  ];
}

export default function ProductPage() {
  const { slug = '' } = useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: inventory = [], isLoading: inventoryLoading, isError: inventoryError, refetch: reloadInventory } = useQuery({
    queryKey: ['inventory-availability', product?.id],
    queryFn: () => getInventoryAvailability(product!.id),
    enabled: !!product,
  });
  const { data: settings } = useSettings();
  const related = useProducts({ search: product?.team });
  const cart = useCart();
  const favs = useFavorites();
  const toast = useToast();

  const [active, setActive] = useState(0);
  const [size, setSize] = useState('');
  const [customize, setCustomize] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    setActive(0);
    setSize('');
    setCustomize(false);
    setCustomName('');
    setCustomNumber('');
  }, [slug]);

  useSeo({
    title: product?.name ?? 'Camiseta de fútbol',
    description: product
      ? `${product.name} – ${KIT_LABELS[product.kit_type]}, ${VERSION_LABELS[product.version].toLowerCase()}. ${formatPrice(product.price)}. Tallas ${product.sizes.join(', ')}. Envíos a toda Colombia, pedido por WhatsApp.`
      : undefined,
    path: `/producto/${slug}`,
    image: publicImageUrl(product?.images[0]?.path),
    type: 'product',
    noindex: !isLoading && !product,
    jsonLd: product ? productJsonLd(product) : undefined,
  });

  if (isLoading) return <Spinner />;
  if (!product) {
    return (
      <div className="container-page py-20">
        <EmptyState title="Camiseta no encontrada">
          <Link to="/tienda" className="btn-primary mt-4">Volver a la tienda</Link>
        </EmptyState>
      </div>
    );
  }

  const originalPrice = product.original_price ?? product.compare_at_price;
  const off = discountPercent(product.price, originalPrice);
  const isFav = favs.has(product.id);

  const addToCart = () => {
    if (!size) {
      setSizeError(true);
      return;
    }
    if ((inventory.find((item) => item.size === size)?.available ?? 0) < 1) {
      setSizeError(true);
      toast('Esa talla no tiene unidades disponibles en este momento.', 'error');
      return;
    }
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: publicImageUrl(product.images[0]?.thumb_path ?? product.images[0]?.path),
      size,
      customName: customize ? customName.trim().toUpperCase() || undefined : undefined,
      customNumber: customize ? customNumber.trim() || undefined : undefined,
    });
  };

  return (
    <div className="container-page py-8">
      <Link to="/tienda" className="mb-6 inline-flex items-center gap-1 text-sm font-bold text-mute hover:text-fg">
        <ChevronLeft className="size-4" /> Volver a la tienda
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        {/* Galería */}
        <div className="space-y-3 lg:sticky lg:top-28 lg:self-start">
          <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-surface-2">
            <ProductImage key={active} image={product.images[active]} alt={product.name} kit={product.kit_type} variant="full" priority />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActive(i)}
                  aria-label={`Ver foto ${i + 1}`}
                  className={cn('size-20 shrink-0 overflow-hidden rounded-xl ring-2 transition', i === active ? 'ring-volt' : 'ring-transparent opacity-70 hover:opacity-100')}
                >
                  <ProductImage image={img} alt="" kit={product.kit_type} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="chip bg-volt text-ink">{KIT_LABELS[product.kit_type]}</span>
              <span className="chip bg-surface-2 text-fg">{VERSION_LABELS[product.version]}</span>
              <span className="chip bg-surface-2 text-fg">{AUDIENCE_LABELS[product.audience]}</span>
            </div>
            <p className="text-sm font-bold uppercase tracking-wider text-mute">
              {[product.team, product.league, product.season].filter(Boolean).join(' · ')}
            </p>
            <h1 className="text-5xl font-extrabold tracking-tight leading-[0.9] sm:text-6xl">{product.name}</h1>
            <p className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold">{formatPrice(product.price)}</span>
              {off && (
                <>
                  <span className="text-lg text-mute line-through">{formatPrice(originalPrice!)}</span>
                  <span className="chip bg-card text-white">-{off}%</span>
                </>
              )}
            </p>
            {product.promotion_title && <p className="text-sm font-bold text-volt">{product.promotion_title}</p>}
          </div>

          {product.description && <p className="leading-relaxed text-fg/80">{product.description}</p>}

          {/* Tallas */}
          <fieldset>
            <legend className="mb-2 flex w-full items-center justify-between text-sm font-bold tracking-tight tracking-wider">
              Talla {size && <span className="text-volt">· {size}</span>}
              <span className="flex items-center gap-1 text-xs font-semibold normal-case tracking-normal text-mute">
                <Ruler className="size-3.5" /> {product.version === 'jugador' ? 'Corte ajustado: considera una talla más' : 'Corte regular'}
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={inventoryLoading || (inventory.find((item) => item.size === s)?.available ?? 0) < 1}
                  onClick={() => { setSize(s); setSizeError(false); }}
                  aria-pressed={size === s}
                  className={cn(
                    'h-12 min-w-14 rounded-xl px-4 text-sm font-extrabold ring-1 transition',
                    size === s ? 'bg-volt text-ink ring-volt' : 'bg-surface ring-line hover:ring-line-strong',
                    (inventoryLoading || (inventory.find((item) => item.size === s)?.available ?? 0) < 1) && 'cursor-not-allowed opacity-40 line-through',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {inventoryLoading ? <p className="mt-2 text-sm text-mute" role="status">Consultando disponibilidad…</p> : inventoryError ? <p className="mt-2 text-sm" role="alert">No pudimos consultar las tallas. <button onClick={() => reloadInventory()} className="text-volt underline">Reintentar</button></p> : <p className="mt-2 text-sm text-mute">{inventory.some((item) => item.available > 0) ? 'Elige tu talla. Las tallas tachadas están agotadas.' : 'Esta camiseta está agotada por ahora.'}</p>}
            {size && <p className="mt-2 text-xs text-mute">Unidades disponibles para {size}: {inventory.find((item) => item.size === size)?.available ?? 0}</p>}
            {sizeError && <p className="mt-2 text-sm font-semibold text-card" role="alert">Elige una talla para continuar.</p>}
          </fieldset>

          {/* Personalización */}
          <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-bold">
              <input type="checkbox" checked={customize} onChange={(e) => setCustomize(e.target.checked)} className="size-5 accent-volt" />
              Personalizar con nombre y número
            </label>
            {customize && (
              <div className="mt-4 grid grid-cols-[1fr_96px] gap-3">
                <label className="field">Nombre
                  <input className="input uppercase" maxLength={20} value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="PABLO" />
                </label>
                <label className="field">Número
                  <input className="input" inputMode="numeric" maxLength={3} value={customNumber} onChange={(e) => setCustomNumber(e.target.value.replace(/\D/g, ''))} placeholder="10" />
                </label>
                <p className="col-span-2 text-xs text-mute">El costo de personalización se confirma por WhatsApp.</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={addToCart} disabled={!cart.ready || cart.isSyncing || inventoryLoading || inventoryError || !inventory.some((item) => item.available > 0)} className="btn-primary h-14 flex-1 text-base">
              <ShoppingBag className="size-5" /> {cart.isSyncing ? 'Reservando…' : 'Agregar al carrito'}
            </button>
            <button
              onClick={() => favs.toggle(product.id)}
              aria-pressed={isFav}
              aria-label={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              className="grid size-14 place-items-center rounded-full ring-1 ring-line hover:bg-surface-2"
            >
              <Heart className={cn('size-5', isFav && 'fill-card text-card')} />
            </button>
          </div>
          <p className="text-sm text-mute">Sin crear cuenta ni pagar en línea. Agrega tus camisetas y continúa por WhatsApp desde el carrito.</p>
          {settings && (
            <a
              href={whatsappLink(settings.whatsapp_number, productInquiryMessage(product.name, window.location.href, size))}
              target="_blank"
              rel="noreferrer"
              className="btn h-12 w-full bg-pitch text-fg hover:bg-pitch-2"
            >
              <MessageCircle className="size-5" /> Preguntar por WhatsApp
            </a>
          )}
          {settings?.shipping_note && <p className="text-xs text-mute">{settings.shipping_note}</p>}
        </div>
      </div>

      {/* Relacionados: otras equipaciones del mismo equipo */}
      {(related.data?.filter((p) => p.id !== product.id).length ?? 0) > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight">Más de {product.team}</h2>
          <ProductGrid products={related.data!.filter((p) => p.id !== product.id).slice(0, 4)} />
        </section>
      )}
    </div>
  );
}
