import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock3, TicketCheck, X } from 'lucide-react';
import { AdminTitle } from './AdminLayout';
import { Spinner } from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';
import { errorMessage, useToast } from '@/context/ToastContext';
import { formatDate, formatPrice, cn } from '@/lib/format';
import { listCartTickets, resolveCartTicket } from '@/services/commerce';

export default function CartTicketsPage() {
  const { role } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const { data: tickets = [], isLoading, error } = useQuery({ queryKey: ['cart-tickets'], queryFn: listCartTickets, refetchInterval: 30000 });

  const resolve = async (id: string, action: 'confirm' | 'cancel') => {
    if (!window.confirm(action === 'confirm' ? '¿Confirmar esta venta? Se descontarán sus unidades del inventario.' : '¿Cancelar este ticket? Las unidades reservadas quedarán disponibles.')) return;
    setBusy(id);
    try {
      await resolveCartTicket(id, action);
      await Promise.all([qc.invalidateQueries({ queryKey: ['cart-tickets'] }), qc.invalidateQueries({ queryKey: ['inventory'] }), qc.invalidateQueries({ queryKey: ['inventory-availability'] })]);
      toast(action === 'confirm' ? 'Venta confirmada; unidades descontadas del inventario' : 'Ticket cancelado; unidades liberadas');
    } catch (e) { toast(errorMessage(e), 'error'); }
    finally { setBusy(null); }
  };

  return <>
    <AdminTitle title="Tickets de WhatsApp" />
    <p className="-mt-5 mb-6 max-w-2xl text-sm leading-relaxed text-mute">Aquí gestionas las consultas y ventas por WhatsApp. Confirmar venta descuenta el stock; cancelar o dejar vencer libera las unidades. El ticket se registra antes de abrir WhatsApp: no garantiza que el cliente haya enviado el mensaje.</p>
    {isLoading ? <Spinner /> : error ? <p role="alert" className="rounded-xl bg-card/10 p-4 text-sm text-card">{errorMessage(error)}</p> : tickets.length === 0 ? <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-line"><TicketCheck className="mx-auto mb-3 size-9 text-volt"/><p className="font-bold">Todavía no hay consultas.</p><p className="mt-1 text-sm text-mute">Los carritos enviados por WhatsApp aparecerán aquí.</p></div> : <div className="space-y-4">
      {tickets.map((ticket) => {
        const expired = ticket.status === 'pending' && Date.parse(ticket.expires_at) <= now;
        const status = expired ? 'Vencido' : ticket.status === 'pending' ? 'Pendiente' : ticket.status === 'confirmed' ? 'Confirmado' : 'Cancelado';
        return <article key={ticket.id} className="rounded-2xl bg-surface p-5 ring-1 ring-line">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="font-display text-2xl font-black">{ticket.code}</p><p className="text-xs text-mute">Creado {formatDate(ticket.created_at)} · vence {formatDate(ticket.expires_at)}</p></div>
            <span className={cn('chip', expired ? 'bg-card text-white' : ticket.status === 'pending' ? 'bg-volt text-ink' : ticket.status === 'confirmed' ? 'bg-pitch text-fg' : 'bg-surface-2 text-fg')}>{status}</span>
          </header>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
            <div><p className="font-bold">{ticket.customer_name}</p>
              <ul className="mt-2 space-y-1 text-sm">{ticket.items.map((item, i) => <li key={`${item.product_id}-${item.size}-${i}`} className="flex justify-between gap-4"><span>{item.quantity} × {item.product_name} · talla {item.size}{(item.custom_name || item.custom_number) ? ` · ${item.custom_name ?? ''} ${item.custom_number ?? ''}` : ''}</span><span className="font-semibold">{formatPrice(item.unit_price * item.quantity)}</span></li>)}</ul>
              <p className="mt-3 flex justify-between border-t border-line pt-2 font-extrabold"><span>Total cotizado</span><span>{formatPrice(ticket.total)}</span></p>
            </div>
            {ticket.status === 'pending' && !expired && <div className="flex flex-wrap items-stretch gap-3 md:flex-col">
              {role === 'admin' && <button className="btn-primary h-11" disabled={busy === ticket.id} onClick={() => resolve(ticket.id, 'confirm')}><Check className="size-4"/>{busy === ticket.id ? 'Guardando…' : 'Confirmar venta'}</button>}
              <button className="btn-secondary h-11" disabled={busy !== null} onClick={() => resolve(ticket.id, 'cancel')}><X className="size-4"/>Cancelar ticket</button>
            </div>}
          </div>
          {expired && <p className="mt-3 flex items-center gap-2 text-xs text-card"><Clock3 className="size-4"/>La reserva ya se liberó automáticamente.</p>}
        </article>;
      })}
    </div>}
  </>;
}
