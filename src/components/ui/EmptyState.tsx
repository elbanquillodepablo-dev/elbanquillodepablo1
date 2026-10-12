import type { ReactNode } from 'react';

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="panel mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-volt ring-1 ring-line">{icon}</div>}
      <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
      {children && <div className="max-w-[40ch] text-sm leading-relaxed text-mute">{children}</div>}
    </div>
  );
}

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-20 text-sm font-medium text-mute">
      <span className="size-5 animate-spin rounded-full border-2 border-volt border-t-transparent" />
      {label}
    </div>
  );
}
