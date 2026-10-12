import { useEffect, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { qk, useSettings } from '@/hooks/queries';
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
  { key: 'shipping_note', label: 'Nota de envíos', textarea: true },
  { key: 'hours', label: 'Horario' },
  { key: 'city', label: 'Ciudad / ubicación' },
  { key: 'instagram_url', label: 'Instagram (URL)' },
  { key: 'tiktok_url', label: 'TikTok (URL)' },
];

export default function SettingsPage() {
  const { data, isLoading } = useSettings();
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
      <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-2xl bg-white p-5 ring-1 ring-ink/10 sm:p-6">
        {FIELDS.map(({ key, label, hint, textarea }) => (
          <label key={key} className="field">{label}
            {textarea ? (
              <textarea className="input" rows={2} value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            ) : (
              <input className="input" value={(form[key] as string) ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            )}
            {hint && <span className="text-xs font-medium text-mute">{hint}</span>}
          </label>
        ))}
        <button disabled={saving} className="btn-primary"><Save className="size-4" /> {saving ? 'Guardando…' : 'Guardar'}</button>
      </form>
    </>
  );
}
