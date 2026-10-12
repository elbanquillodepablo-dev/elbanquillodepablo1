import type { ReactNode } from 'react';
import { useSeo } from '@/lib/seo';

export const CONTACT_EMAIL = 'elbanquillodepablo@gmail.com';

/** Plantilla para páginas legales: lectura cómoda (≈70 caracteres por línea). */
export function LegalLayout({ title, description, path, updated, children }: {
  title: string; description: string; path: string; updated: string; children: ReactNode;
}) {
  useSeo({ title, description, path });
  return (
    <article className="container-page py-12">
      <header className="mb-10 max-w-3xl space-y-3">
        <p className="eyebrow">Información legal</p>
        <h1 className="text-4xl font-extrabold leading-[0.95] tracking-[-0.04em] sm:text-5xl">{title}</h1>
        <p className="text-sm text-mute">Última actualización: {updated}</p>
      </header>
      <div className="legal max-w-[70ch] space-y-8 leading-relaxed text-fg/85">{children}</div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold tracking-tight text-fg">{title}</h2>
      {children}
    </section>
  );
}
