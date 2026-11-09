import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, MessageCircle, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/hooks/queries';
import { errorMessage } from '@/context/ToastContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/format';
import { cartTicketMessage, whatsappLink } from '@/lib/whatsapp';
import { useSeo } from '@/lib/seo';

export default function CheckoutPage() {
  const cart = useCart();
  const { data: settings } = useSettings();
  const [name, setName] = useState('');
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ code: string; link: string; expiresAt: string } | null>(null);
  useSeo({ title: 'Continuar por WhatsApp', path: '/checkout', noindex: true });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (!acceptPrivacy) { setError('Debes aceptar la política de tratamiento de datos.'); return; }
    setSubmitting(true);
    try {
      const ticket = await cart.createTicket(name, acceptPrivacy);
      const message = cartTicketMessage(ticket.code, ticket.customer_name, ticket.items, ticket.total);
      const link = whatsappLink(settings?.whatsapp_number ?? '', message);
      setDone({ code: ticket.code, link, expiresAt: ticket.expires_at });
      cart.clear(false);
    } catch (e) { setError(errorMessage(e)); }
    finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-lg space-y-5 text-center">
        <CheckCircle2 className="mx-auto size-16 text-volt" />
        <h1 className="text-5xl font-extrabold tracking-tight">¡Tu carrito está listo!</h1>
        <p className="text-mute">Tu ticket <strong className="text-fg">{done.code}</strong> quedó registrado. Abre WhatsApp y envía el mensaje para que podamos atenderte. La reserva vence a las {new Date(done.expiresAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}.</p>
        <a href={done.link} target="_blank" rel="noreferrer" className="btn h-12 w-full bg-pitch text-fg"><MessageCircle className="size-5"/>Abrir WhatsApp</a>
        <p className="text-xs text-mute">El mensaje no se envía automáticamente. No hay pago en línea; el administrador confirma el pedido contigo.</p>
        <Link to="/tienda" className="btn-ghost w-full">Seguir comprando</Link>
      </div>
    </div>
  );

  if (!cart.ready || cart.items.length === 0) return (
    <div className="container-page py-20">
      <EmptyState icon={<ShoppingBag />} title="Tu carrito está vacío">
        Agrega unidades disponibles para crear una reserva y consultar por WhatsApp.
        <div className="mt-4"><Link to="/tienda" className="btn-primary">Ir a la tienda</Link></div>
      </EmptyState>
    </div>
  );

  return <div className="container-page py-10">
    <h1 className="mb-3 text-5xl font-extrabold tracking-tight leading-none">Continuar por WhatsApp</h1>
    <p className="mb-8 max-w-2xl text-sm leading-relaxed text-mute">Deja tu nombre para identificar el ticket. No necesitas crear una cuenta ni registrar dirección, celular o datos de pago aquí.</p>
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <form onSubmit={onSubmit} className="grid content-start gap-4">
        <label className="field">¿Cómo te llamas? *
          <input className="input" required maxLength={120} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-surface p-4 text-sm leading-relaxed text-fg/85 ring-1 ring-line">
          <input type="checkbox" required className="mt-0.5 size-5 shrink-0 accent-volt" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} />
          <span>Autorizo a El Banquillo de Pablo a usar mi nombre para gestionar esta consulta, según la <Link to="/privacidad" target="_blank" className="font-semibold text-volt underline underline-offset-2">política de tratamiento de datos</Link>.</span>
        </label>
        {error && <p role="alert" className="rounded-xl bg-card/10 p-3 text-sm font-semibold text-card">{error}</p>}
        <button type="submit" disabled={submitting || cart.isSyncing} className="btn-volt h-14 text-base disabled:opacity-50">
          <MessageCircle className="size-5" /> {submitting ? 'Creando ticket…' : cart.isSyncing ? 'Guardando reserva…' : 'Crear ticket y continuar'}
        </button>
        <ul className="space-y-2 text-xs leading-relaxed text-mute">
          <li className="flex gap-2"><Lock className="size-4 shrink-0 text-volt"/>Conexión cifrada. No te pedimos tarjetas ni contraseñas.</li>
          <li className="flex gap-2"><ShieldCheck className="size-4 shrink-0 text-volt"/>El inventario se reserva hasta el vencimiento indicado; la venta solo queda confirmada cuando la administra el equipo.</li>
        </ul>
      </form>
      <aside className="h-fit space-y-4 rounded-2xl bg-surface p-5 ring-1 ring-line lg:sticky lg:top-28">
        <h2 className="text-2xl font-bold tracking-tight">Resumen del ticket</h2>
        <ul className="divide-y divide-line">{cart.items.map((item) => <li key={item.key} className="flex gap-3 py-3">
          <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover"/>}</div>
          <div className="min-w-0 flex-1 text-sm"><p className="font-bold leading-tight">{item.name}</p><p className="text-xs text-mute">Talla {item.size} · x{item.quantity}{(item.customName || item.customNumber) && ` · ${item.customName ?? ''} ${item.customNumber ?? ''}`}</p></div>
          <p className="text-sm font-extrabold">{formatPrice(item.price * item.quantity)}</p>
        </li>)}</ul>
        <div className="flex items-baseline justify-between border-t border-line pt-4"><span className="font-semibold text-mute">Total cotizado</span><span className="text-2xl font-black">{formatPrice(cart.subtotal)}</span></div>
        {cart.expiresAt && <p className="text-xs text-mute">Esta reserva vence a las {new Date(cart.expiresAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}.</p>}
      </aside>
    </div>
  </div>;
}
