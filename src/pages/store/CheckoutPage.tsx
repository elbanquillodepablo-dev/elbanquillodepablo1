import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useSettings } from '@/hooks/queries';
import { createOrder } from '@/services/catalog';
import { errorMessage } from '@/context/ToastContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { CO_DEPARTMENTS } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { orderMessage, whatsappLink } from '@/lib/whatsapp';
import type { CustomerInput } from '@/types';

const EMPTY: CustomerInput = {
  customer_name: '', document_id: '', phone: '', department: '', city: '',
  address: '', neighborhood: '', reference: '', notes: '',
};

export default function CheckoutPage() {
  const cart = useCart();
  const { data: settings } = useSettings();
  const [form, setForm] = useState<CustomerInput>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ code: string; link: string } | null>(null);

  const set = (key: keyof CustomerInput) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\+?\d[\d\s-]{6,}$/.test(form.phone)) {
      setError('Revisa el número de celular.');
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder(form, cart.items);
      const link = whatsappLink(settings?.whatsapp_number ?? '', orderMessage(order.code, cart.items, form, order.total));
      setDone({ code: order.code, link });
      cart.clear();
      window.open(link, '_blank', 'noopener');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-md space-y-4 text-center">
          <CheckCircle2 className="mx-auto size-16 text-volt" />
          <h1 className="text-5xl font-extrabold tracking-tight">¡Golazo!</h1>
          <p className="text-mute">
            Tu pedido <strong className="text-fg">{done.code}</strong> quedó registrado. Te confirmamos disponibilidad, envío y pago por WhatsApp.
          </p>
          <a href={done.link} target="_blank" rel="noreferrer" className="btn h-12 w-full bg-pitch text-fg">
            <MessageCircle className="size-5" /> Abrir WhatsApp
          </a>
          <Link to="/tienda" className="btn-ghost w-full">Seguir comprando</Link>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container-page py-20">
        <EmptyState icon={<ShoppingBag />} title="Tu carrito está vacío">
          <Link to="/tienda" className="btn-primary mt-4">Ir a la tienda</Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="mb-8 text-5xl font-extrabold tracking-tight leading-none">Finalizar pedido</h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate={false}>
          <h2 className="text-2xl font-bold tracking-tight sm:col-span-2">Datos de envío</h2>
          <label className="field sm:col-span-2">Nombre completo *
            <input className="input" required autoComplete="name" value={form.customer_name} onChange={set('customer_name')} />
          </label>
          <label className="field">Cédula
            <input className="input" inputMode="numeric" value={form.document_id} onChange={set('document_id')} />
          </label>
          <label className="field">Celular (WhatsApp) *
            <input className="input" required type="tel" autoComplete="tel" placeholder="300 123 4567" value={form.phone} onChange={set('phone')} />
          </label>
          <label className="field">Departamento
            <select className="input" value={form.department} onChange={set('department')}>
              <option value="">Selecciona…</option>
              {CO_DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="field">Ciudad / municipio *
            <input className="input" required autoComplete="address-level2" value={form.city} onChange={set('city')} />
          </label>
          <label className="field sm:col-span-2">Dirección *
            <input className="input" required autoComplete="street-address" value={form.address} onChange={set('address')} />
          </label>
          <label className="field">Barrio
            <input className="input" value={form.neighborhood} onChange={set('neighborhood')} />
          </label>
          <label className="field">Punto de referencia
            <input className="input" value={form.reference} onChange={set('reference')} />
          </label>
          <label className="field sm:col-span-2">Notas
            <textarea className="input" rows={3} value={form.notes} onChange={set('notes')} />
          </label>
          {error && <p role="alert" className="rounded-xl bg-card/10 p-3 text-sm font-semibold text-card sm:col-span-2">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-volt h-14 text-base sm:col-span-2">
            <MessageCircle className="size-5" /> {submitting ? 'Enviando…' : 'Confirmar pedido por WhatsApp'}
          </button>
          <p className="text-xs text-mute sm:col-span-2">
            No cobramos nada en línea: confirmamos disponibilidad, valor del envío y medio de pago por WhatsApp.
          </p>
        </form>

        <aside className="h-fit space-y-4 rounded-2xl bg-surface p-5 ring-1 ring-line lg:sticky lg:top-28">
          <h2 className="text-2xl font-bold tracking-tight">Resumen</h2>
          <ul className="divide-y divide-line">
            {cart.items.map((i) => (
              <li key={i.key} className="flex gap-3 py-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                  {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-bold leading-tight">{i.name}</p>
                  <p className="text-xs text-mute">Talla {i.size} · x{i.quantity}{(i.customName || i.customNumber) && ` · ${i.customName ?? ''} ${i.customNumber ?? ''}`}</p>
                </div>
                <p className="text-sm font-extrabold">{formatPrice(i.price * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-semibold text-mute">Subtotal</span>
            <span className="text-2xl font-black">{formatPrice(cart.subtotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
