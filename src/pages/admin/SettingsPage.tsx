import { useEffect, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { qk, useProducts, useSettings } from '@/hooks/queries';
import { updateSettings } from '@/services/catalog';
import { errorMessage, useToast } from '@/context/ToastContext';
import { Spinner } from '@/components/ui/EmptyState';
import type { StoreSettings } from '@/types';
import { AdminTitle } from './AdminLayout';

type Field = { key: keyof StoreSettings; label: string; hint?: string; textarea?: boolean };

const FIELDS: Field[] = [
  { key: 'store_name', label: 'Nombre de la tienda' },
  { key: 'whatsapp_number', label: 'WhatsApp (con indicativo, sin +)', hint: 'Ej. 573001234567 — aquí llegan los pedidos' },
  { key: 'hero_title', label: 'Título del inicio' },
  { key: 'hero_subtitle', label: 'Subtítulo del inicio', textarea: true },
  { key: 'hero_button_label', label: 'Texto del botón principal', hint: 'Máximo 40 caracteres. Abre la camiseta elegida o el catálogo.' },
  { key: 'shipping_note', label: 'Nota de envíos', textarea: true },
  { key: 'hours', label: 'Horario visible en la tienda', hint: 'Opcional. Déjalo vacío para ocultarlo. Este texto no cambia el vencimiento de las reservas.' },
  { key: 'city', label: 'Ciudad / ubicación' },
  { key: 'instagram_url', label: 'Instagram (URL)' },
  { key: 'tiktok_url', label: 'TikTok (URL)' },
];

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
  const { data: products = [] } = useProducts();
  const [form, setForm] = useState<Partial<StoreSettings>>({});
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => { if (data) setForm(data); }, [data]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id: _id, ...rest } = form as StoreSettings;
      await updateSettings({ ...rest, whatsapp_number: (rest.whatsapp_number ?? '').replace(/\D/g, '') });
      qc.invalidateQueries({ queryKey: qk.settings });
      toast('Ajustes guardados');
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <>
      <AdminTitle title="Ajustes" />
      <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-2xl bg-surface p-5 ring-1 ring-line sm:p-6">
        <fieldset className="mb-6 space-y-4 border-b border-line pb-6">
          <legend className="mb-3 text-xl font-semibold">Portada de la tienda</legend>
          <p className="text-sm text-mute">Elige qué ve primero el cliente. Los descuentos se calculan desde Promociones; las novedades usan la fecha de creación.</p>
          <label className="field">Selección del inicio<select className="input" value={form.home_collection ?? 'featured'} onChange={(e) => setForm({ ...form, home_collection: e.target.value as StoreSettings['home_collection'] })}>
            <option value="featured">Camisetas destacadas</option><option value="new">Nuevas referencias</option><option value="promotions">Descuentos vigentes</option>
          </select></label>
          <label className="field">Camiseta principal<select className="input" value={form.hero_product_id ?? ''} onChange={(e) => setForm({ ...form, hero_product_id: e.target.value || null })}>
            <option value="">Automática según la selección</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></label>
          <a href="/" target="_blank" rel="noreferrer" className="inline-block text-sm text-volt underline">Ver la tienda</a>
        </fieldset>
        <fieldset className="space-y-4 border-b border-line pb-6 mb-6">
          <legend className="mb-3 text-xl font-semibold">Horario y reservas</legend>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.reservation_schedule_enabled ?? false} onChange={(e) => setForm({ ...form, reservation_schedule_enabled: e.target.checked })} />Usar horario de atención para las reservas</label>
          <p className="text-sm text-mute">Durante la atención: dos horas desde el último cambio. Fuera de horario: hasta la próxima apertura más dos horas. Zona horaria: Colombia.</p>
          <div className="flex flex-wrap gap-3">{['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((day, i) => <label key={day} className="flex min-h-11 items-center gap-2 rounded-lg bg-surface-2 px-3 text-sm"><input type="checkbox" checked={(form.business_days ?? []).includes(i)} onChange={(e) => setForm({ ...form, business_days: e.target.checked ? [...(form.business_days ?? []), i] : (form.business_days ?? []).filter((d) => d !== i) })} />{day}</label>)}</div>
          <div className="grid grid-cols-2 gap-4"><label className="field">Apertura<input required type="time" className="input" value={form.opens_at?.slice(0,5) ?? '09:00'} onChange={(e) => setForm({ ...form, opens_at: e.target.value })} /></label><label className="field">Cierre<input required type="time" className="input" value={form.closes_at?.slice(0,5) ?? '19:00'} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} /></label></div>
          <p className="text-xs text-mute">El cierre debe ser posterior a la apertura, dentro del mismo día. Los cambios de horario se aplican a las reservas nuevas o modificadas.</p>
        </fieldset>
        {FIELDS.map(({ key, label, hint, textarea }) => (
          <label key={key} className="field">{label}
            {textarea ? (
              <textarea className="input" rows={2} value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            ) : (
              <input className="input" maxLength={key === 'hero_button_label' ? 40 : undefined} required={key === 'hero_button_label'} value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            )}
            {hint && <span className="text-xs font-medium text-mute">{hint}</span>}
          </label>
        ))}
        <button disabled={saving} className="btn-primary"><Save className="size-4" /> {saving ? 'Guardando…' : 'Guardar'}</button>
      </form>
    </>
  );
}
