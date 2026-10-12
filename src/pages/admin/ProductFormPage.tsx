import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ExternalLink, Save } from 'lucide-react';
import { qk, useCategories, useProductById } from '@/hooks/queries';
import { createProduct, updateProduct } from '@/services/products';
import { errorMessage, useToast } from '@/context/ToastContext';
import { ImageManager } from '@/components/admin/ImageManager';
import { Spinner } from '@/components/ui/EmptyState';
import { ADULT_SIZES, AUDIENCE_LABELS, KID_SIZES, KIT_LABELS, VERSION_LABELS } from '@/lib/constants';
import { cn, slugify } from '@/lib/format';
import type { ProductInput } from '@/types';
import { AdminTitle } from './AdminLayout';

const EMPTY: ProductInput = {
  name: '', slug: '', team: '', league: '', season: '2026/27',
  kit_type: 'local', version: 'fan', audience: 'adulto', category_id: null,
  price: 0, compare_at_price: null, description: '', sizes: ['S', 'M', 'L', 'XL'],
  is_featured: false, is_active: true, sort_order: 0,
};

export const autoName = (p: Pick<ProductInput, 'team' | 'kit_type' | 'season' | 'version' | 'audience'>) =>
  [
    p.team,
    KIT_LABELS[p.kit_type],
    p.season,
    p.version === 'jugador' ? '(Jugador)' : '',
    p.audience === 'nino' ? 'Niño' : p.audience === 'mujer' ? 'Mujer' : '',
  ].filter(Boolean).join(' ');

export default function ProductFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: categories = [] } = useCategories(true);
  const { data: product, isLoading, refetch } = useProductById(id);

  const [form, setForm] = useState<ProductInput>(EMPTY);
  const [nameTouched, setNameTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!product) return;
    const { id: _id, created_at: _c, updated_at: _u, images: _i, category: _cat, ...rest } = product;
    setForm(rest);
    setNameTouched(true);
  }, [product]);

  // el nombre se arma solo hasta que el admin lo edite a mano
  useEffect(() => {
    if (nameTouched) return;
    setForm((f) => ({ ...f, name: autoName(f) }));
  }, [form.team, form.kit_type, form.season, form.version, form.audience, nameTouched]);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const toggleSize = (s: string) =>
    set('sizes', form.sizes.includes(s) ? form.sizes.filter((x) => x !== s) : [...form.sizes, s]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.sizes.length) return toast('Selecciona al menos una talla', 'error');
    setSaving(true);
    const payload: ProductInput = {
      ...form,
      slug: form.slug || slugify(form.name),
      league: form.league || null,
      season: form.season || null,
      description: form.description || null,
      compare_at_price: form.compare_at_price || null,
    };
    try {
      if (isNew) {
        const created = await createProduct(payload);
        toast('Producto creado. Ahora sube las fotos 📸');
        navigate(`/admin/productos/${created.id}`, { replace: true });
      } else {
        await updateProduct(id!, payload);
        toast('Cambios guardados');
        refetch();
      }
      qc.invalidateQueries({ queryKey: qk.products });
    } catch (err) {
      const msg = errorMessage(err);
      toast(msg.includes('duplicate') ? 'Ya existe un producto con ese slug/nombre' : msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && isLoading) return <Spinner />;

  const sizeOptions = form.audience === 'nino' ? KID_SIZES : ADULT_SIZES;

  return (
    <>
      <Link to="/admin/productos" className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-mute hover:text-ink">
        <ChevronLeft className="size-4" /> Productos
      </Link>
      <AdminTitle title={isNew ? 'Nuevo producto' : 'Editar producto'}>
        {product && (
          <a href={`/producto/${product.slug}`} target="_blank" rel="noreferrer" className="btn-ghost">
            <ExternalLink className="size-4" /> Ver en tienda
          </a>
        )}
      </AdminTitle>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <form onSubmit={onSubmit} className="space-y-6 rounded-2xl bg-white p-5 ring-1 ring-ink/10 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">Equipo *
              <input className="input" required value={form.team} onChange={(e) => set('team', e.target.value)} placeholder="Real Madrid" />
            </label>
            <label className="field">Liga / Torneo
              <input className="input" value={form.league ?? ''} onChange={(e) => set('league', e.target.value)} placeholder="LaLiga" />
            </label>
            <label className="field">Temporada
              <input className="input" value={form.season ?? ''} onChange={(e) => set('season', e.target.value)} placeholder="2026/27" />
            </label>
            <label className="field">Categoría
              <select className="input" value={form.category_id ?? ''} onChange={(e) => set('category_id', e.target.value || null)}>
                <option value="">Sin categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <Select label="Equipación" value={form.kit_type} options={KIT_LABELS} onChange={(v) => set('kit_type', v)} />
            <Select label="Versión" value={form.version} options={VERSION_LABELS} onChange={(v) => set('version', v)} />
            <Select label="Público" value={form.audience} options={AUDIENCE_LABELS}
              onChange={(v) => { set('audience', v); set('sizes', v === 'nino' ? ['6', '8', '10', '12'] : ['S', 'M', 'L', 'XL']); }} />
            <label className="field">Orden (menor = primero)
              <input className="input" type="number" value={form.sort_order} onChange={(e) => set('sort_order', Number(e.target.value))} />
            </label>
          </div>

          <label className="field">Nombre del producto *
            <input className="input" required value={form.name} onChange={(e) => { setNameTouched(true); set('name', e.target.value); }} />
            <span className="text-xs font-medium text-mute">Se genera solo con equipo + equipación + temporada. Puedes editarlo.</span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">Precio (COP) *
              <input className="input" type="number" min={0} step={100} required value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} placeholder="189900" />
            </label>
            <label className="field">Precio antes (opcional, para mostrar descuento)
              <input className="input" type="number" min={0} step={100} value={form.compare_at_price ?? ''} onChange={(e) => set('compare_at_price', e.target.value ? Number(e.target.value) : null)} />
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Tallas disponibles *</legend>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...sizeOptions, ...form.sizes])).map((s) => (
                <button key={s} type="button" onClick={() => toggleSize(s)} aria-pressed={form.sizes.includes(s)}
                  className={cn('h-10 min-w-12 rounded-lg px-3 text-sm font-bold ring-1', form.sizes.includes(s) ? 'bg-ink text-volt ring-ink' : 'ring-ink/15')}>
                  {s}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="field">Descripción
            <textarea className="input" rows={4} value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </label>

          <div className="flex flex-wrap gap-6">
            <Check label="Visible en la tienda" checked={form.is_active} onChange={(v) => set('is_active', v)} />
            <Check label="Destacado en inicio" checked={form.is_featured} onChange={(v) => set('is_featured', v)} />
          </div>

          <button disabled={saving} className="btn-primary h-12 w-full sm:w-auto">
            <Save className="size-4" /> {saving ? 'Guardando…' : isNew ? 'Crear y subir fotos' : 'Guardar cambios'}
          </button>
        </form>

        <section className="h-fit rounded-2xl bg-white p-5 ring-1 ring-ink/10 sm:p-6">
          <h2 className="mb-4 text-2xl font-extrabold uppercase">Fotos</h2>
          {product ? (
            <ImageManager productId={product.id} productName={product.name} images={product.images}
              onChange={() => { refetch(); qc.invalidateQueries({ queryKey: qk.products }); }} />
          ) : (
            <p className="text-sm text-mute">Guarda el producto primero para poder subir fotos.</p>
          )}
        </section>
      </div>
    </>
  );
}

function Select<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: Record<T, string>; onChange: (v: T) => void;
}) {
  return (
    <label className="field">{label}
      <select className="input" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {(Object.entries(options) as [T, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
      <input type="checkbox" className="size-5 accent-pitch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
