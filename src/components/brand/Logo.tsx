import { useId } from 'react';
import { cn } from '@/lib/format';

/**
 * Isotipo: escudo de club oscuro. Dentro, el techo del banquillo (arco lima),
 * el banco y el balón. El borde superior lleva un brillo sutil.
 */
export function LogoMark({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="El Banquillo de Pablo">
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d221f" />
          <stop offset="1" stopColor="#0a0c0b" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cff04a" />
          <stop offset="1" stopColor="#cff04a" stopOpacity=".35" />
        </linearGradient>
      </defs>
      <path d="M32 3.5 56.5 11v19.5C56.5 45 46.5 54.8 32 60.5 17.5 54.8 7.5 45 7.5 30.5V11Z"
        fill={`url(#${id}-fill)`} stroke={`url(#${id}-edge)`} strokeWidth="2" strokeLinejoin="round" />
      <path d="M18.5 39v-7a13.5 13.5 0 0 1 27 0v7" fill="none" stroke="#cff04a" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M20.5 42h23" stroke="#f3f2ed" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M23.5 42v6.5M40.5 42v6.5" stroke="#f3f2ed" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="31" r="3.4" fill="#f3f2ed" />
      <path d="M26 15.5h12" stroke="#f3f2ed" strokeOpacity=".22" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-10 shrink-0" />
      {!compact && (
        <span className="flex flex-col leading-[0.82]" aria-hidden="true">
          <span className="font-brand text-[21px] font-black uppercase tracking-tight text-fg">El Banquillo</span>
          <span className="font-brand text-[12px] font-extrabold uppercase tracking-[0.34em] text-volt">de Pablo</span>
        </span>
      )}
    </span>
  );
}
