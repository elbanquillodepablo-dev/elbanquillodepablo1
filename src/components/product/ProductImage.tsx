import { useState } from 'react';
import { publicImageUrl } from '@/lib/supabase';
import { cn } from '@/lib/format';
import type { ProductImage as TImage, KitType } from '@/types';

interface Props {
  image?: TImage | null;
  alt: string;
  kit?: KitType;
  /** "card" usa la miniatura; "full" deja que el navegador elija con srcset */
  variant?: 'card' | 'full';
  priority?: boolean;
  className?: string;
}

const KIT_COLORS: Partial<Record<KitType, [string, string]>> = {
  local: ['#f5f3ee', '#0c1410'],
  visitante: ['#0c1410', '#d4ff3a'],
  tercera: ['#14532d', '#f5f3ee'],
  portero: ['#d4ff3a', '#0c1410'],
  retro: ['#e9e6dd', '#14532d'],
};

/** Imagen optimizada: srcset (thumb 640w / full 1600w), lazy-load, sin saltos de layout y fondo mientras carga. */
export function ProductImage({ image, alt, kit = 'local', variant = 'card', priority = false, className }: Props) {
  const [loaded, setLoaded] = useState(false);
  const full = publicImageUrl(image?.path);
  const thumb = publicImageUrl(image?.thumb_path) ?? full;

  if (!full) return <JerseyPlaceholder kit={kit} className={className} />;

  return (
    <img
      src={variant === 'card' ? thumb! : full}
      srcSet={thumb && thumb !== full ? `${thumb} 640w, ${full} 1600w` : undefined}
      sizes={variant === 'card' ? '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw' : '(min-width: 1024px) 50vw, 100vw'}
      width={image?.width ?? undefined}
      height={image?.height ?? undefined}
      alt={image?.alt || alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      // React 18 aún no conoce la prop camelCase; el atributo HTML sí funciona
      {...{ fetchpriority: priority ? 'high' : 'auto' }}
      onLoad={() => setLoaded(true)}
      className={cn('h-full w-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
    />
  );
}

/** Silueta de camiseta para productos sin foto todavía */
export function JerseyPlaceholder({ kit = 'local', className }: { kit?: KitType; className?: string }) {
  const [body, accent] = KIT_COLORS[kit] ?? ['#f5f3ee', '#0c1410'];
  return (
    <div className={cn('grid h-full w-full place-items-center bg-chalk-2', className)}>
      <svg viewBox="0 0 120 120" className="w-3/5 drop-shadow-sm" aria-hidden="true">
        <path
          d="M42 14 L24 22 L8 42 L22 54 L30 46 L30 106 L90 106 L90 46 L98 54 L112 42 L96 22 L78 14 C74 22 66 26 60 26 C54 26 46 22 42 14 Z"
          fill={body}
          stroke={accent}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M42 14 C46 22 54 26 60 26 C66 26 74 22 78 14" fill="none" stroke={accent} strokeWidth="4" />
        <circle cx="74" cy="44" r="5" fill={accent} opacity=".85" />
      </svg>
    </div>
  );
}
