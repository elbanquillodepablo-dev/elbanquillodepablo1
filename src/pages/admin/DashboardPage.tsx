import { Link } from 'react-router-dom';
import { ImageOff, Layers, Package, Plus, Shirt } from 'lucide-react';
import { useOrders, useProducts } from '@/hooks/queries';
import { formatDate, formatPrice } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { AdminTitle } from './AdminLayout';

export default function DashboardPage() {
  const { data: products = [] } = useProducts({ includeInactive: true });
  const { data: orders = [] } = useOrders();

  const pending = orders.filter((o) => o.status === 'pendiente');
  const noImages = products.filter((p) => p.images.length === 0);
  const stats = [
    { label: 'Productos activos', value: products.filter((p) => p.is_active).length, icon: Shirt },
    { label: 'Pedidos pendientes', value: pending.length, icon: Package },
    { label: 'Sin fotos', value: noImages.length, icon: ImageOff },
    { label: 'Pedidos totales', value: orders.length, icon: Layers },
  ];

  return (
    <>
      <AdminTitle title="Resumen">
        <Link to="/admin/kit" className="btn-ghost"><Layers className="size-4" /> Crear equipaciones</Link>
        <Link to="/admin/productos/nuevo" className="btn-primary"><Plus className="size-4" /> Nuevo producto</Link>
      </AdminTitle>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-surface p-5 ring-1 ring-line">
            <Icon className="size-5 text-volt" />
            <p className="font-display mt-3 text-5xl font-black">{value}</p>
            <p className="text-sm font-semibold text-mute">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-surface p-5 ring-1 ring-line">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">Últimos pedidos</h2>
          {orders.length === 0 ? <p className="text-sm text-mute">Aún no hay pedidos.</p> : (
            <ul className="divide-y divide-line">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-bold">{o.code} · {o.customer_name}</p>
                    <p className="text-xs text-mute">{formatDate(o.created_at)} · {o.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold">{formatPrice(o.subtotal)}</p>
                    <p className="text-xs text-mute">{ORDER_STATUS_LABELS[o.status]}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/pedidos" className="mt-3 inline-block text-sm font-bold text-volt">Ver todos →</Link>
        </section>

        <section className="rounded-2xl bg-surface p-5 ring-1 ring-line">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">Productos sin fotos</h2>
          {noImages.length === 0 ? <p className="text-sm text-mute">Todos los productos tienen fotos.</p> : (
            <ul className="divide-y divide-line">
              {noImages.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-bold">{p.name}</span>
                  <Link to={`/admin/productos/${p.id}`} className="font-bold text-volt">Subir fotos</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
