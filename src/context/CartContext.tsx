import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { CartItem } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (item: Omit<CartItem, 'key' | 'quantity'>, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const itemKey = (i: Pick<CartItem, 'productId' | 'size' | 'customName' | 'customNumber'>) =>
  [i.productId, i.size, i.customName ?? '', i.customNumber ?? ''].join('|');

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>('bp-cart', []);
  const [isOpen, setOpen] = useState(false);

  const add = useCallback<CartContextValue['add']>((item, quantity = 1) => {
    const key = itemKey(item);
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) return prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i));
      return [...prev, { ...item, key, quantity }];
    });
    setOpen(true);
  }, [setItems]);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, quantity: Math.min(20, quantity) } : i)),
    );
  }, [setItems]);

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), [setItems]);
  const clear = useCallback(() => setItems([]), [setItems]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    add, setQuantity, remove, clear,
  }), [items, isOpen, add, setQuantity, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
