import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Warehouse } from 'lucide-react';
import { AdminTitle } from './AdminLayout';
import { Spinner } from '@/components/ui/EmptyState';
import { errorMessage, useToast } from '@/context/ToastContext';
import { listInventory, saveInventory, type InventoryRow } from '@/services/commerce';

export default function InventoryPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: rows = [], isLoading, error, refetch } = useQuery({ queryKey: ['inventory'], queryFn: listInventory });
  // Only edits live here: refreshing one row must not erase other unsaved changes.
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const groups = new Map<string, InventoryRow[]>();
  rows.filter((row) => row.product_name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).forEach((row) => {
    groups.set(row.product_id, [...(groups.get(row.product_id) ?? []), row]);
  });
  const change = async (row: InventoryRow) => {
    const key = `${row.product_id}:${row.size}`;
    const value = values[key];
    if (!value?.trim()) { toast('Escribe una cantidad. Usa 0 si está agotada.', 'error'); return; }
    setSaving(key);
    try {
      await saveInventory(row.product_id, row.size, Number(value));
      setValues((current) => { const next = { ...current }; delete next[key]; return next; });
      await Promise.all([qc.invalidateQueries({ queryKey: ['inventory'] }), qc.invalidateQueries({ queryKey: ['inventory-availability'] })]);
      toast(`Talla ${row.size}: existencias guardadas`);
    } catch (e) { toast(errorMessage(e), 'error'); }
    finally { setSaving(null); }
  };
  return <>
    <AdminTitle title="Inventario" />
    <p className="-mt-5 mb-6 max-w-2xl text-sm leading-relaxed text-mute">Escribe cuántas unidades tienes físicamente y guarda cada talla. Disponibles = unidades físicas menos las reservadas. Usa 0 para marcar una talla agotada.</p>
    <label className="field mb-6 max-w-md">Buscar camiseta<input className="input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre del producto…" /></label>
    {isLoading ? <Spinner /> : error ? <div role="alert"><p className="text-card">{errorMessage(error)}</p><button onClick={() => refetch()} className="btn-secondary mt-3">Reintentar</button></div> : rows.length === 0 ? (
      <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-line"><Warehouse className="mx-auto mb-3 size-8 text-volt"/><p className="font-bold">Aún no hay tallas para cargar.</p><p className="mt-1 text-sm text-mute">Crea productos para que aparezcan aquí.</p></div>
    ) : groups.size === 0 ? <p className="text-mute">No encontramos camisetas con ese nombre.</p> : <div className="space-y-6">
      {[...groups].map(([id, variants]) => <section key={id} className="rounded-2xl bg-surface p-4 ring-1 ring-line sm:p-6">
        <h2 className="mb-4 text-xl font-bold">{variants[0].product_name}</h2>
        <div className="space-y-4">{variants.map((row) => {
          const key = `${row.product_id}:${row.size}`;
          const value = values[key] ?? String(row.stock_on_hand);
          const changed = value.trim() !== '' && Number(value) !== row.stock_on_hand;
          return <div key={key} className="grid grid-cols-[minmax(0,1fr)_76px_auto] items-end gap-3">
            <div className="self-center"><p className="font-semibold">Talla {row.size}</p><p className="text-sm text-mute">{row.available} disponibles · {Math.max(0, row.stock_on_hand - row.available)} reservadas</p></div>
            <label className="field text-sm">Unidades<input aria-label={`${row.product_name}, talla ${row.size}: unidades físicas`} disabled={saving !== null} className="input h-11" type="number" min="0" max="10000" step="1" inputMode="numeric" value={value} onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))} /></label>
            <button aria-label={`Guardar talla ${row.size} de ${row.product_name}`} className="btn-secondary h-11 px-3" disabled={saving !== null || !changed} onClick={() => change(row)}><Save className="hidden size-4 sm:block"/><span>{saving === key ? 'Guardando…' : 'Guardar'}</span></button>
          </div>;
        })}</div>
      </section>)}
    </div>}
  </>;
}
