import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgePercent, CalendarClock, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminTitle } from './AdminLayout';
import { Spinner } from '@/components/ui/EmptyState';
import { errorMessage, useToast } from '@/context/ToastContext';
import { useProducts } from '@/hooks/queries';
import { deletePromotion, listPromotions, savePromotion, type PromotionInput } from '@/services/commerce';
import { formatDate, formatPrice } from '@/lib/format';
import type { Promotion } from '@/types';
import type { Product } from '@/types';

const localValue = (date: Date) => {
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
};
const blank = (): PromotionInput => ({
  title: '', description: '', discount_percent: 10,
  starts_at: localValue(new Date()), ends_at: localValue(new Date(Date.now() + 7 * 86400_000)),
  is_active: true, product_ids: [],
});

export default function PromotionsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: promotions = [], isLoading, error } = useQuery({ queryKey: ['promotions'], queryFn: listPromotions });
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const [form, setForm] = useState<PromotionInput>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    const selected = promotions.find((p) => p.id === editingId);
    if (selected) setForm({
      title: selected.title, description: selected.description ?? '', discount_percent: selected.discount_percent,
      starts_at: localValue(new Date(selected.starts_at)), ends_at: localValue(new Date(selected.ends_at)),
      is_active: selected.is_active, product_ids: (selected.products ?? []).map((p) => p.product_id),
    });
  }, [editingId, promotions]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (new Date(form.ends_at) <= new Date(form.starts_at)) { toast('La fecha de cierre debe ser posterior al inicio.', 'error'); return; }
    setSaving(true);
    try {
      await savePromotion({ ...form, starts_at: new Date(form.starts_at).toISOString(), ends_at: new Date(form.ends_at).toISOString() }, editingId ?? undefined);
      await Promise.all([qc.invalidateQueries({ queryKey: ['promotions'] }), qc.invalidateQueries({ queryKey: ['products'] })]);
      toast(editingId ? 'Promoción actualizada' : 'Promoción creada');
      setEditingId(null); setForm(blank());
    } catch (e) { toast(errorMessage(e), 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (promotion: Promotion) => {
    if (!window.confirm(`¿Eliminar la promoción “${promotion.title}”?`)) return;
    try { await deletePromotion(promotion.id); await qc.invalidateQueries({ queryKey: ['promotions'] }); toast('Promoción eliminada'); }
    catch (e) { toast(errorMessage(e), 'error'); }
  };

  return <>
    <AdminTitle title="Promociones" />
    <p className="-mt-5 mb-6 max-w-2xl text-sm leading-relaxed text-mute">Crea descuentos porcentuales para productos seleccionados. Se activan y terminan en las fechas indicadas; si coinciden varias, se aplica la de mayor descuento. El precio queda reservado por dos horas al agregar al carrito.</p>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)]">
      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-surface p-5 ring-1 ring-line">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold">{editingId ? 'Editar promoción' : 'Nueva promoción'}</h2>{editingId && <button type="button" className="btn-ghost" onClick={() => { setEditingId(null); setForm(blank()); }}>Cancelar edición</button>}</div>
        <label className="field">Nombre de la promoción<input required maxLength={100} className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ej. Descuento de temporada" /></label>
        <label className="field">Descripción para la tienda<textarea rows={2} className="input" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Opcional" /></label>
        <label className="field">Descuento (%)
          <input required type="number" min="1" max="90" className="input" value={form.discount_percent} onChange={(e) => setForm((f) => ({ ...f, discount_percent: Number(e.target.value) }))} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field">Empieza<input required type="datetime-local" className="input" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} /></label>
          <label className="field">Termina<input required type="datetime-local" className="input" value={form.ends_at} onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))} /></label>
        </div>
        <fieldset className="space-y-2">
          <legend className="field mb-2">Productos incluidos</legend>
          {productsLoading ? <Spinner /> : products.length === 0 ? <p className="text-sm text-mute">Crea productos antes de configurar descuentos.</p> :
            <div className="max-h-56 space-y-1 overflow-auto rounded-xl bg-bg p-2">
              {products.map((product: Product) => <label key={product.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-surface-2">
                <input type="checkbox" className="size-4 accent-volt" checked={form.product_ids.includes(product.id)} onChange={(e) => setForm((f) => ({ ...f, product_ids: e.target.checked ? [...new Set([...f.product_ids, product.id])] : f.product_ids.filter((id) => id !== product.id) }))} />
                <span className="min-w-0 flex-1 truncate">{product.name}</span><span className="text-mute">{formatPrice(product.original_price ?? product.price)}</span>
              </label>)}
            </div>}
        </fieldset>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-4 accent-volt" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />Promoción habilitada dentro de su vigencia</label>
        <button className="btn-primary w-full" disabled={saving || productsLoading}><Plus className="size-4"/>{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear promoción'}</button>
      </form>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-extrabold"><CalendarClock className="size-5 text-volt"/> Promociones registradas</h2>
        {isLoading ? <Spinner /> : error ? <p role="alert" className="rounded-xl bg-card/10 p-4 text-sm text-card">{errorMessage(error)}</p> : promotions.length === 0 ? <p className="rounded-2xl bg-surface p-6 text-sm text-mute ring-1 ring-line">Todavía no hay promociones.</p> : promotions.map((p) => {
          const now = Date.now();
          const status = !p.is_active ? 'Pausada' : now < Date.parse(p.starts_at) ? 'Programada' : now >= Date.parse(p.ends_at) ? 'Terminada' : 'Activa';
          return <article key={p.id} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
            <div className="flex items-start justify-between gap-3"><div><span className="chip bg-volt text-ink"><BadgePercent className="size-3.5"/>{p.discount_percent}% · {status}</span><h3 className="mt-3 text-lg font-extrabold">{p.title}</h3></div><div className="flex gap-1"><button className="btn-ghost size-11 p-0" aria-label={`Editar ${p.title}`} onClick={() => setEditingId(p.id)}><Pencil className="size-4"/></button><button className="btn-ghost size-11 p-0 text-card" aria-label={`Eliminar ${p.title}`} onClick={() => remove(p)}><Trash2 className="size-4"/></button></div></div>
            {p.description && <p className="mt-1 text-sm text-mute">{p.description}</p>}
            <p className="mt-3 text-xs text-mute">{(p.products ?? []).length} productos · {formatDate(p.starts_at)} — {formatDate(p.ends_at)}</p>
          </article>;
        })}
      </section>
    </div>
  </>;
}
