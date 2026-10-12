import type { ReactNode } from 'react';

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-ink/15 px-6 py-14 text-center">
      {icon && <div className="grid size-14 place-items-center rounded-full bg-chalk-2 text-pitch">{icon}</div>}
      <h3 className="text-2xl font-extrabold uppercase">{title}</h3>
      {children && <div className="text-sm text-mute">{children}</div>}
    </div>
  );
}

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-mute">
      <span className="size-5 animate-spin rounded-full border-2 border-pitch border-t-transparent" />
      {label}
    </div>
  );
}
