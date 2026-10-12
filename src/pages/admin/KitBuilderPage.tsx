import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Layers, Sparkles } from 'lucide-react';
import { qk, useCategories } from '@/hooks/queries';
import { createProducts, getProductById } from '@/services/products';
import { errorMessage, useToast } from '@/context/ToastContext';
import { ImageManager } from '@/components/admin/ImageManager';
import { AUDIENCE_LABELS, KIT_LABELS, VERSION_LABELS } from '@/lib/constants';
import { cn, formatPrice, slugify } from '@/lib/format';
import type { Audience, KitType, Product, ProductInput, ProductVersion } from '@/types';
import { AdminTitle } from './AdminLayout';
import { autoName } from './ProductFormPage';

/**
 * "Crear equipaciones": escribe el equipo una vez y genera de golpe
 * local + visitante + tercera (y las combinaciones fan/jugador, adulto/niño que marques).
 */
export default function KitBuilderPage() {
  const { data: categories = [] } = useCategories(true);
  const qc = useQueryClient();
  const toast = useToast();

  const [team, setTeam] = useState('');
  const [league, setLeague] = useState('');
  const [season, setSeason] = useState('2026/27');
  const [categoryId, setCategoryId] = useState('');
  const [kits, setKits] = useState<KitType[]>(['local', 'visitante', 'tercera']);
  const [versions, setVersions] = useState<ProductVersion[]>(['fan']);
  const [audiences, setAudiences] = useState<Audience[]>(['adulto']);
  const [prices, setPrices] = useState<Record<ProductVersion, number>>({ fan: 189900, jugador: 239900 });
  const [kidDiscount, setKidDiscount] = useState(30000);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Product[]>([]);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const drafts: ProductInput[] = kits.flatMap((kit_type) =>
    versions.flatMap((version) =>
      audiences.map((audience) => {
        const base = { team: team.trim(), kit_type, season, version, audience };
        const name = autoName(base);
        const price = Math.max(0, prices[version] - (audience === 'nino' ? kidDiscount : 0));
        return {
          ...base,
          name,
          slug: slugify(name),
          league: league || null,
          season: season || null,
          category_id: categoryId || null,
          price,
          compare_at_price: null,
          description: null,
          sizes: audience === 'nino' ? ['6', '8', '10', '12', '14'] : ['S', 'M', 'L', 'XL', 'XXL'],
          is_featured: false,
          is_active: true,
          sort_order: 0,
        };
      }),
    ),
  );

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!team.trim() || drafts.length === 0) return;
    setSaving(true);
    try {
      const rows = await createProducts(drafts);
      setCreated(rows);
      qc.invalidateQueries({ queryKey: qk.products });
      toast(`${rows.length} productos creados. Sube las fotos de cada uno 👇`);
    } catch (err) {
      const msg = errorMessage(err);
      toast(msg.includes('duplicate') ? 'Alguna de esas equipaciones ya existe' : msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const refresh = async (id: string) => {
    const fresh = await getProductById(id);
    if (fresh) setCreated((list) => list.map((p) => (p.id === id ? fresh : p)));
    qc.invalidateQueries({ queryKey: qk.products });
  };

  return (
    <>
      <AdminTitle title="Crear equipaciones" />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6 rounded-2xl bg-white p-5 ring-1 ring-ink/10 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field sm:col-span-2">Equipo *
              <input className="input text-lg" required value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Ej. Real Madrid, Colombia, Atlético Nacional…" />
            </label>
            <label className="field">Liga / Torneo
              <input className="input" value={league} onChange={(e) => setLeague(e.target.value)} placeholder="LaLiga" />
            </label>
            <label className="field">Temporada
              <input className="input" value={season} onChange={(e) => setSeason(e.target.value)} />
            </label>
            <label className="field sm:col-span-2">Categoría
              <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>

          <ChipGroup label="Equipaciones" options={KIT_LABELS} selected={kits} onToggle={(v) => setKits(toggle(kits, v))} />
          <ChipGroup label="Versiones" options={VERSION_LABELS} selected={versions} onToggle={(v) => setVersions(toggle(versions, v))} />
          <ChipGroup label="Público" options={AUDIENCE_LABELS} selected={audiences} onToggle={(v) => setAudiences(toggle(audiences, v))} />

          <div className="grid gap-4 sm:grid-cols-3">
            {versions.map((v) => (
              <label key={v} className="field">Precio {VERSION_LABELS[v].toLowerCase()}
                <input className="input" type="number" step={100} value={prices[v]} onChange={(e) => setPrices({ ...prices, [v]: Number(e.target.value) })} />
              </label>
            ))}
            {audiences.includes('nino') && (
              <label className="field">Descuento niño
                <input className="input" type="number" step={100} value={kidDiscount} onChange={(e) => setKidDiscount(Number(e.target.value))} />
              </label>
            )}
          </div>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl bg-ink p-5 text-chalk lg:sticky lg:top-6">
          <h2 className="flex items-center gap-2 text-2xl font-extrabold uppercase"><Sparkles className="size-5 text-volt" /> Vista previa</h2>
          <p className="text-sm text-chalk/60">Se crearán <strong className="text-volt">{drafts.length}</strong> productos:</p>
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {team.trim() ? drafts.map((d) => (
              <li key={d.slug} className="flex justify-between gap-3 rounded-lg bg-chalk/5 px-3 py-2">
                <span>{d.name}</span>
                <span className="shrink-0 font-bold text-volt">{formatPrice(d.price)}</span>
              </li>
            )) : <li className="text-chalk/50">Escribe el equipo…</li>}
          </ul>
          <button disabled={saving || !team.trim() || !drafts.length} className="btn-volt h-12 w-full">
            <Layers className="size-4" /> {saving ? 'Creando…' : `Crear ${drafts.length} productos`}
          </button>
        </aside>
      </form>

      {created.length > 0 && (
        <section className="mt-10 space-y-6">
          <h2 className="text-3xl font-black uppercase">Ahora, las fotos</h2>
          {created.map((p) => (
            <div key={p.id} className="rounded-2xl bg-white p-5 ring-1 ring-ink/10">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-sans text-lg font-extrabold">{p.name}</h3>
                <Link to={`/admin/productos/${p.id}`} className="text-sm font-bold text-pitch">Editar detalles →</Link>
              </div>
              <ImageManager productId={p.id} productName={p.name} images={p.images ?? []} onChange={() => refresh(p.id)} />
            </div>
          ))}
        </section>
      )}
    </>
  );
}

function ChipGroup<T extends string>({ label, options, selected, onToggle }: {
  label: string; options: Record<T, string>; selected: T[]; onToggle: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {(Object.entries(options) as [T, string][]).map(([v, l]) => (
          <button key={v} type="button" onClick={() => onToggle(v)} aria-pressed={selected.includes(v)}
            className={cn('rounded-full px-3.5 py-2 text-sm font-bold ring-1 transition', selected.includes(v) ? 'bg-ink text-volt ring-ink' : 'ring-ink/15 hover:ring-ink/40')}>
            {l}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
