import { Link } from 'react-router-dom';
import { Layers, Package, Plus, Shirt, Warehouse } from 'lucide-react';
import { useProducts } from '@/hooks/queries';
import { formatDate, formatPrice } from '@/lib/format';
import { useQuery } from '@tanstack/react-query';
import { listCartTickets, listInventory } from '@/services/commerce';
import { AdminTitle } from './AdminLayout';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const { data: products = [] } = useProducts({ includeInactive: true });
  const { data: orders = [], isLoading: ticketsLoading, error: ticketsError } = useQuery({ queryKey: ['cart-tickets'], queryFn: listCartTickets, refetchInterval: 30000 });
  const { data: inventory = [], isLoading: stockLoading, error: stockError } = useQuery({ queryKey: ['inventory'], queryFn: listInventory, refetchInterval: 30000 });

  const pending = orders.filter((o) => o.status === 'pending' && Date.parse(o.expires_at) > Date.now());
  const noImages = products.filter((p) => p.images.length === 0);
  const stats = [
    { label: 'Productos activos', value: products.filter((p) => p.is_active).length, icon: Shirt },
    { label: 'Tickets pendientes (recientes)', value: ticketsError ? '—' : ticketsLoading ? '…' : pending.length, icon: Package },
    { label: 'Unidades disponibles', value: stockError ? '—' : stockLoading ? '…' : inventory.reduce((sum, row) => sum + row.available, 0), icon: Warehouse },
    { label: 'Ventas confirmadas (últimos 200)', value: ticketsError ? '—' : ticketsLoading ? '…' : orders.filter((o) => o.status === 'confirmed').length, icon: Layers },
  ];

  return (
    <>
      <AdminTitle title="Resumen">
        {isAdmin && <Link to="/admin/productos/nuevo" className="btn-primary"><Plus className="size-4" /> Nuevo producto</Link>}
      </AdminTitle>

      <section className="mb-8 space-y-3" aria-label="Acciones frecuentes">
        <h2 className="text-xl font-bold">¿Qué necesitas hacer?</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/consultas" className="btn-primary">Atender tickets de WhatsApp</Link>
          <Link to="/admin/inventario" className="btn-secondary">Actualizar existencias</Link>
          {isAdmin && <Link to="/admin/ajustes" className="btn-secondary">Cambiar la portada</Link>}
        </div>
        <p className="text-sm text-mute">Revisa el ticket con el cliente. Confirma la venta cuando esté acordada; cancelar libera las unidades.</p>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-surface p-5 ring-1 ring-line">
            <Icon className="size-5 text-volt" />
            <p className="font-display mt-3 text-5xl font-black">{value}</p>
            <p className="text-sm font-semibold text-mute">{label}</p>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-mute">Tickets y ventas calculados sobre los últimos 200 tickets. {stockError && 'No pudimos consultar el inventario.'}</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-surface p-5 ring-1 ring-line">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">Tickets recientes</h2>
          {ticketsError ? <p role="alert" className="text-card">No pudimos cargar los tickets. Vuelve a intentarlo desde Tickets de WhatsApp.</p> : ticketsLoading ? <p>Cargando tickets…</p> : orders.length === 0 ? <p className="text-sm text-mute">Aún no hay tickets.</p> : (
            <ul className="divide-y divide-line">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-bold">{o.code} · {o.customer_name}</p>
                    <p className="text-xs text-mute">{formatDate(o.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold">{formatPrice(o.total)}</p>
                    <p className="text-xs text-mute">{o.status === 'confirmed' ? 'Venta confirmada' : o.status === 'cancelled' ? 'Cancelado' : Date.parse(o.expires_at) <= Date.now() ? 'Vencido' : 'Pendiente'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/admin/consultas" className="mt-3 inline-block text-sm font-bold text-volt">Ver todos →</Link>
        </section>

        <section className="rounded-2xl bg-surface p-5 ring-1 ring-line">
          <h2 className="mb-4 text-2xl font-bold tracking-tight">Productos sin fotos</h2>
          {noImages.length === 0 ? <p className="text-sm text-mute">Todos los productos tienen fotos.</p> : (
            <ul className="divide-y divide-line">
              {noImages.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-bold">{p.name}</span>
                  {isAdmin && <Link to={`/admin/productos/${p.id}`} className="font-bold text-volt">Subir fotos</Link>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
