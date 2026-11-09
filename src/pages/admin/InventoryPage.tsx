import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Warehouse } from 'lucide-react';
import { AdminTitle } from './AdminLayout';
import { Spinner } from '@/components/ui/EmptyState';
import { errorMessage, useToast } from '@/context/ToastContext';
import { listInventory, saveInventory } from '@/services/commerce';
import { formatDate } from '@/lib/format';

export default function InventoryPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ['inventory'], queryFn: listInventory });
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setValues(Object.fromEntries(rows.map((row) => [`${row.product_id}:${row.size}`, String(row.stock_on_hand)])));
  }, [rows]);

  const change = async (productId: string, size: string) => {
    const key = `${productId}:${size}`;
    setSaving(key);
    try {
      await saveInventory(productId, size, Number(values[key]));
      await qc.invalidateQueries({ queryKey: ['inventory'] });
      toast('Existencias guardadas');
    } catch (e) { toast(errorMessage(e), 'error'); }
    finally { setSaving(null); }
  };

  return <>
    <AdminTitle title="Inventario" />
    <p className="-mt-5 mb-6 max-w-2xl text-sm leading-relaxed text-mute">Registra las unidades físicas de cada talla. Las reservas activas se restan automáticamente de las unidades disponibles. El inventario existente parte en cero.</p>
    {isLoading ? <Spinner /> : error ? <p role="alert" className="rounded-xl bg-card/10 p-4 text-sm text-card">{errorMessage(error)}</p> : rows.length === 0 ? (
      <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-line"><Warehouse className="mx-auto mb-3 size-8 text-volt"/><p className="font-bold">Aún no hay tallas para cargar.</p><p className="mt-1 text-sm text-mute">Crea productos para que aparezcan aquí.</p></div>
    ) : <div className="space-y-3">
      {rows.map((row) => {
        const key = `${row.product_id}:${row.size}`;
        return <section key={key} className="grid items-center gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line sm:grid-cols-[1fr_120px_auto]">
          <div><p className="font-bold">{row.product_name}</p><p className="text-xs text-mute">Talla {row.size} · disponibles ahora: <strong className="text-fg">{row.available}</strong> · stock físico: {row.stock_on_hand} · actualizado {formatDate(row.updated_at)}</p></div>
          <label className="field">Unidades
            <input className="input h-11" type="number" min="0" max="10000" step="1" value={values[key] ?? ''} onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))} />
          </label>
          <button className="btn-secondary h-11" disabled={saving === key || Number(values[key]) === row.stock_on_hand} onClick={() => change(row.product_id, row.size)}><Save className="size-4"/>{saving === key ? 'Guardando…' : 'Guardar'}</button>
        </section>;
      })}
    </div>}
  </>;
}
