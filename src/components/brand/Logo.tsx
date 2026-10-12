import { cn } from '@/lib/format';

/** Isotipo: el techo del banquillo (arco), el banco y el balón. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#0c1410" />
      <path d="M12 38V31a20 20 0 0 1 40 0v7" fill="none" stroke="#d4ff3a" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M17 41h30" stroke="#f5f3ee" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M21 41v9M43 41v9" stroke="#f5f3ee" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="29" r="4" fill="#d4ff3a" />
    </svg>
  );
}

export function Logo({ className, inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-10 shrink-0" />
      <span className="flex flex-col leading-[0.85]">
        <span className={cn('font-display text-[22px] font-black uppercase tracking-tight', inverted ? 'text-chalk' : 'text-ink')}>
          El Banquillo
        </span>
        <span className={cn('font-display text-[13px] font-extrabold uppercase tracking-[0.28em]', inverted ? 'text-volt' : 'text-pitch')}>
          de Pablo
        </span>
      </span>
    </span>
  );
}
