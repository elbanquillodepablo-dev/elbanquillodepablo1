import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { useOrders } from '@/hooks/queries';
import { updateOrderStatus } from '@/services/catalog';
import { errorMessage, useToast } from '@/context/ToastContext';
import { Spinner } from '@/components/ui/EmptyState';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { cn, formatDate, formatPrice } from '@/lib/format';
import { whatsappLink } from '@/lib/whatsapp';
import type { OrderStatus } from '@/types';
import { AdminTitle } from './AdminLayout';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pendiente: 'bg-volt text-ink',
  confirmado: 'bg-pitch text-fg',
  enviado: 'bg-surface-2 text-fg ring-1 ring-line',
  entregado: 'bg-surface-2 text-fg',
  cancelado: 'bg-card text-white',
};

export default function OrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | ''>('');
  const { data: orders = [], isLoading } = useOrders(filter || undefined);
  const qc = useQueryClient();
  const toast = useToast();

  const changeStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status);
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast(`Pedido ${ORDER_STATUS_LABELS[status].toLowerCase()}`);
    } catch (e) {
      toast(errorMessage(e), 'error');
    }
  };

  return (
    <>
      <AdminTitle title="Pedidos" />
      <div className="mb-5 flex flex-wrap gap-2">
        {(['', ...Object.keys(ORDER_STATUS_LABELS)] as (OrderStatus | '')[]).map((s) => (
          <button key={s || 'all'} onClick={() => setFilter(s)} aria-pressed={filter === s}
            className={cn('rounded-full px-3.5 py-1.5 text-sm font-bold ring-1', filter === s ? 'bg-volt text-fg ring-volt' : 'ring-line')}>
            {s ? ORDER_STATUS_LABELS[s] : 'Todos'}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : orders.length === 0 ? (
        <p className="rounded-2xl bg-surface p-8 text-center text-sm text-mute ring-1 ring-line">No hay pedidos.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <article key={o.id} className="rounded-2xl bg-surface p-5 ring-1 ring-line">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-black">{o.code}</p>
                  <p className="text-xs text-mute">{formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('chip', STATUS_STYLES[o.status])}>{ORDER_STATUS_LABELS[o.status]}</span>
                  <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)} className="input h-9 w-auto" aria-label="Cambiar estado">
                    {Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </header>
              <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <p className="font-bold">{o.customer_name}{o.document_id && <span className="font-normal text-mute"> · CC {o.document_id}</span>}</p>
                  <p>{o.address}{o.neighborhood && `, ${o.neighborhood}`}</p>
                  <p>{o.city}{o.department && `, ${o.department}`}</p>
                  {o.reference && <p className="text-mute">Ref: {o.reference}</p>}
                  {o.notes && <p className="mt-1 rounded-lg bg-bg p-2 text-xs">{o.notes}</p>}
                  <a href={whatsappLink(o.phone.startsWith('57') || o.phone.startsWith('+') ? o.phone : `57${o.phone}`, `¡Hola ${o.customer_name.split(' ')[0]}! Te escribimos de El Banquillo de Pablo por tu pedido ${o.code}.`)}
                    target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-bold text-volt">
                    <MessageCircle className="size-4" /> {o.phone}
                  </a>
                </div>
                <ul className="space-y-1">
                  {o.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between gap-3">
                      <span>{i.quantity} × {i.name} <span className="text-mute">({i.size}{i.custom_name || i.custom_number ? ` · ${i.custom_name ?? ''} ${i.custom_number ?? ''}` : ''})</span></span>
                      <span className="font-bold">{formatPrice(i.unit_price * i.quantity)}</span>
                    </li>
                  ))}
                  <li className="flex justify-between border-t border-line pt-2 font-extrabold">
                    <span>Subtotal</span><span>{formatPrice(o.subtotal)}</span>
                  </li>
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
