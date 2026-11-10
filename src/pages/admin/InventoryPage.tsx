import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Warehouse } from 'lucide-react';
import { AdminTitle } from './AdminLayout';
import { Spinner } from '@/components/ui/EmptyState';
import { errorMessage, useToast } from '@/context/ToastContext';
import { listInventory, saveInventoryBatch, type InventoryRow } from '@/services/commerce';

export default function InventoryPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data: rows = [], isLoading, error, refetch } = useQuery({ queryKey: ['inventory'], queryFn: listInventory });
  // Only edits live here: refreshing one row must not erase other unsaved changes.
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const groups = new Map<string, InventoryRow[]>();
  rows.filter((row) => row.product_name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).forEach((row) => {
    groups.set(row.product_id, [...(groups.get(row.product_id) ?? []), row]);
  });
  const changedRows = rows.filter((row) => {
    const value = values[row.product_id + ':' + row.size];
    return value !== undefined && (value.trim() === '' || Number(value) !== row.stock_on_hand);
  });
  const totals = rows.reduce((sum, row) => ({ physical: sum.physical + row.stock_on_hand, available: sum.available + row.available }), { physical: 0, available: 0 });
  const change = async () => {
    if (changedRows.some((row) => !values[row.product_id + ':' + row.size]?.trim())) {
      toast('Completa las cantidades vacías. Usa 0 para una talla agotada.', 'error'); return;
    }
    setSaving(true);
    try {
      await saveInventoryBatch(changedRows.map((row) => ({ product_id: row.product_id, size: row.size, stock_on_hand: Number(values[row.product_id + ':' + row.size]) })));
      setValues({});
      await Promise.all([qc.invalidateQueries({ queryKey: ['inventory'] }), qc.invalidateQueries({ queryKey: ['inventory-availability'] })]);
      toast('Todos los cambios de inventario se guardaron');
    } catch (e) { toast(errorMessage(e), 'error'); }
    finally { setSaving(false); }
  };

  return <>
    <AdminTitle title="Inventario" />
    <p className="-mt-5 mb-6 max-w-2xl text-sm leading-relaxed text-mute">Edita las tallas que necesites y pulsa Guardar cambios una sola vez. Usa 0 para una talla agotada. Las reservas se descuentan automáticamente de las unidades disponibles.</p>
    {!isLoading && !error && <div className="mb-6 flex flex-wrap gap-4 text-sm"><p>Existencias: <strong>{totals.physical}</strong></p><p>Reservadas: <strong>{Math.max(0, totals.physical - totals.available)}</strong></p><p>Disponibles: <strong className="text-volt">{totals.available}</strong></p></div>}
    <div className="sticky top-0 z-10 mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-4 ring-1 ring-line">
      <p className="text-sm" role="status">{changedRows.length ? `${changedRows.length} tallas con cambios sin guardar (incluye las ocultas por el filtro)` : 'Sin cambios pendientes'}</p>
      <button className="btn-primary" disabled={saving || !changedRows.length || !!error} onClick={change}><Save className="size-4"/>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
    </div>
    <label className="field mb-6 max-w-md">Buscar camiseta<input className="input" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre del producto…" /></label>
    {isLoading ? <Spinner /> : error ? <div role="alert"><p className="text-card">{errorMessage(error)}</p><button onClick={() => refetch()} className="btn-secondary mt-3">Reintentar</button></div> : rows.length === 0 ? (
      <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-line"><Warehouse className="mx-auto mb-3 size-8 text-volt"/><p className="font-bold">Aún no hay tallas para cargar.</p><p className="mt-1 text-sm text-mute">Crea productos para que aparezcan aquí.</p></div>
    ) : groups.size === 0 ? <p className="text-mute">No encontramos camisetas con ese nombre.</p> : <div className="space-y-6">
      {[...groups].map(([id, variants]) => <section key={id} className="rounded-2xl bg-surface p-4 ring-1 ring-line sm:p-6">
        <h2 className="mb-4 text-xl font-bold">{variants[0].product_name}</h2>
        <div className="space-y-4">{variants.map((row) => {
          const key = `${row.product_id}:${row.size}`;
          const value = values[key] ?? String(row.stock_on_hand);
          return <div key={key} className="grid grid-cols-[minmax(0,1fr)_100px] items-end gap-3">
            <div className="self-center"><p className="font-semibold">Talla {row.size}</p><p className="text-sm text-mute">{row.stock_on_hand} físicas · {Math.max(0, row.stock_on_hand - row.available)} reservadas</p><p className="text-sm font-semibold text-volt">{row.available} disponibles</p></div>
            <label className="field text-sm">Stock físico<input aria-label={`${row.product_name}, talla ${row.size}: unidades físicas`} disabled={saving} className="input h-11" type="number" min="0" max="10000" step="1" inputMode="numeric" value={value} onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))} /></label>
          </div>;
        })}</div>
      </section>)}
    </div>}
  </>;
}
