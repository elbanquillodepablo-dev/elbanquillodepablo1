import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';

export function CartDrawer() {
  const { items, isOpen, close, setQuantity, remove, subtotal } = useCart();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrito">
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={close} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-fade-up flex-col bg-bg shadow-2xl">
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-2xl font-extrabold tracking-tight">Tu carrito</h2>
          <button onClick={close} aria-label="Cerrar carrito" className="grid size-10 place-items-center rounded-full hover:bg-surface-2">
            <X className="size-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 items-center p-5">
            <EmptyState icon={<ShoppingBag />} title="Banquillo vacío">
              Aún no has convocado ninguna camiseta.
              <div className="mt-4"><Link to="/tienda" onClick={close} className="btn-primary">Ver la tienda</Link></div>
            </EmptyState>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((i) => (
                <li key={i.key} className="flex gap-4 py-4">
                  <Link to={`/producto/${i.slug}`} onClick={close} className="size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                    {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="font-bold leading-tight line-clamp-2">{i.name}</p>
                    <p className="text-xs text-mute">
                      Talla {i.size}
                      {(i.customName || i.customNumber) && ` · ${i.customName ?? ''} ${i.customNumber ?? ''}`}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full ring-1 ring-line">
                        <button onClick={() => setQuantity(i.key, i.quantity - 1)} aria-label="Menos" className="grid size-8 place-items-center"><Minus className="size-3.5" /></button>
                        <span className="w-6 text-center text-sm font-bold">{i.quantity}</span>
                        <button onClick={() => setQuantity(i.key, i.quantity + 1)} aria-label="Más" className="grid size-8 place-items-center"><Plus className="size-3.5" /></button>
                      </div>
                      <p className="font-extrabold">{formatPrice(i.price * i.quantity)}</p>
                    </div>
                  </div>
                  <button onClick={() => remove(i.key)} aria-label={`Quitar ${i.name}`} className="self-start text-mute hover:text-card">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
            <footer className="space-y-3 border-t border-line p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-mute">Subtotal</span>
                <span className="text-2xl font-black">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-mute">El envío se confirma por WhatsApp según tu ciudad.</p>
              <Link to="/checkout" onClick={close} className="btn-volt w-full">Finalizar pedido</Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
