import { cn } from '@/lib/format';

/** Banco visto de frente: tres respaldos, un asiento continuo y dos apoyos. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="El Banquillo de Pablo">
      <rect x="3" y="3" width="58" height="58" rx="14" fill="#cff04a" />
      <g fill="#17452c">
        <rect x="14" y="17" width="10" height="19" rx="3" />
        <rect x="27" y="17" width="10" height="19" rx="3" />
        <rect x="40" y="17" width="10" height="19" rx="3" />
        <path d="M12 39h40v6H12zM17 44h6v7h-6zM41 44h6v7h-6z" />
      </g>
    </svg>
  );
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 sm:gap-3', className)}>
      <LogoMark className="size-10 shrink-0 sm:size-12" />
      {!compact && (
        <span className="flex flex-col gap-1 leading-none" aria-hidden="true">
          <span className="font-brand text-[22px] font-black uppercase tracking-[-0.015em] text-fg sm:text-[26px]">El Banquillo</span>
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-volt">de Pablo</span>
        </span>
      )}
    </span>
  );
}
