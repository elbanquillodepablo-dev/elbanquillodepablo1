import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CartItem } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { errorMessage, useToast } from '@/context/ToastContext';
import { createCartTicket, getReservedCart, newCartToken, setCartReservation } from '@/services/commerce';

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  isSyncing: boolean;
  expiresAt: string | null;
  expiredNotice: boolean;
  ready: boolean;
  open: () => void;
  close: () => void;
  add: (item: Omit<CartItem, 'key' | 'quantity'>, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: (releaseReservation?: boolean) => void;
  createTicket: (name: string, acceptPrivacy: boolean) => Promise<Awaited<ReturnType<typeof createCartTicket>>>;
}

const CartContext = createContext<CartContextValue | null>(null);

const itemKey = (i: Pick<CartItem, 'productId' | 'size' | 'customName' | 'customNumber'>) =>
  [i.productId, i.size, i.customName ?? '', i.customNumber ?? ''].join('|');

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>('bp-cart', []);
  const [isOpen, setOpen] = useState(false);
  const [isSyncing, setSyncing] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [expiredNotice, setExpiredNotice] = useState(false);
  const [ready, setReady] = useState(false);
  const itemsRef = useRef(items);
  const tokenRef = useRef('');
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const initializationRef = useRef<Promise<void>>(Promise.resolve());
  const toast = useToast();

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    let active = true;
    let finish!: () => void;
    initializationRef.current = new Promise<void>((resolve) => { finish = resolve; });
    const initialize = async () => {
      try {
        tokenRef.current = localStorage.getItem('bp-cart-token') ?? '';
        if (!tokenRef.current) {
          itemsRef.current = [];
          setItems([]);
          return;
        }
        const cart = await getReservedCart(tokenRef.current);
        if (!active) return;
        if (cart.expired) {
          itemsRef.current = [];
          setItems([]);
          setExpiredNotice(true);
          setExpiresAt(null);
        } else {
          itemsRef.current = cart.items;
          setItems(cart.items);
          setExpiresAt(cart.items.length ? cart.expires_at : null);
        }
      } catch {
        if (!active) return;
        itemsRef.current = [];
        setItems([]);
        setExpiresAt(null);
      } finally {
        if (active) setReady(true);
        finish();
      }
    };
    void initialize();
    return () => { active = false; finish(); };
  }, [setItems]);

  useEffect(() => {
    if (!expiresAt || items.length === 0) return;
    const delay = Date.parse(expiresAt) - Date.now();
    if (delay <= 0) {
      itemsRef.current = [];
      setItems([]);
      setExpiresAt(null);
      setExpiredNotice(true);
      return;
    }
    const timer = window.setTimeout(() => {
      itemsRef.current = [];
      setItems([]);
      setExpiresAt(null);
      setExpiredNotice(true);
      toast('Tu reserva venció: se vació el carrito y se liberaron las unidades.', 'error');
    }, delay);
    return () => window.clearTimeout(timer);
  }, [expiresAt, items.length, setItems, toast]);

  const token = useCallback(() => {
    if (!tokenRef.current) {
      tokenRef.current = newCartToken();
      try { localStorage.setItem('bp-cart-token', tokenRef.current); } catch { /* el token se mantiene en memoria */ }
    }
    return tokenRef.current;
  }, []);

  const mutate = useCallback((transform: (current: CartItem[]) => CartItem[], rotateToken = false) => {
    setExpiredNotice(false);
    setSyncing(true);
    queueRef.current = queueRef.current.then(() => initializationRef.current).then(async () => {
      const next = transform(itemsRef.current);
      try {
        const currentToken = token();
        const reservation = await setCartReservation(currentToken, next.map((item) => ({
          product_id: item.productId, size: item.size, quantity: item.quantity,
          custom_name: item.customName ?? '', custom_number: item.customNumber ?? '',
        })));
        const canonical = next.length ? await getReservedCart(currentToken) : null;
        const confirmedItems = canonical?.items ?? [];
        itemsRef.current = confirmedItems;
        setItems(confirmedItems);
        setExpiresAt(confirmedItems.length ? reservation.expires_at : null);
        if (rotateToken) {
          tokenRef.current = newCartToken();
          try { localStorage.setItem('bp-cart-token', tokenRef.current); } catch { /* el token se mantiene en memoria */ }
        }
      } catch (e) {
        toast(errorMessage(e), 'error');
      } finally {
        setSyncing(false);
      }
    });
  }, [setItems, toast, token]);

  const add = useCallback<CartContextValue['add']>((item, quantity = 1) => {
    const key = itemKey(item);
    mutate((current) => {
      const existing = current.find((i) => i.key === key);
      if (existing) return current.map((i) => (i.key === key ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i));
      return [...current, { ...item, key, quantity: Math.min(20, quantity) }];
    });
    setOpen(true);
  }, [mutate]);

  const setQuantity = useCallback((key: string, quantity: number) => {
    mutate((current) => quantity <= 0
      ? current.filter((i) => i.key !== key)
      : current.map((i) => (i.key === key ? { ...i, quantity: Math.min(20, quantity) } : i)));
  }, [mutate]);
  const remove = useCallback((key: string) => mutate((current) => current.filter((i) => i.key !== key)), [mutate]);
  const clear = useCallback((releaseReservation = true) => {
    if (releaseReservation) mutate(() => [], true);
    else {
      itemsRef.current = [];
      setItems([]);
      setExpiresAt(null);
      tokenRef.current = newCartToken();
      try { localStorage.setItem('bp-cart-token', tokenRef.current); } catch { /* el token se mantiene en memoria */ }
    }
  }, [mutate, setItems]);

  const submitTicket = useCallback(async (name: string, acceptPrivacy: boolean) => {
    await initializationRef.current;
    await queueRef.current;
    if (!itemsRef.current.length) throw new Error('El carrito está vacío.');
    if (!tokenRef.current) throw new Error('No encontramos la reserva del carrito. Vuelve a seleccionar los productos.');
    return createCartTicket(tokenRef.current, name, acceptPrivacy);
  }, []);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
    isOpen, isSyncing, expiresAt, expiredNotice, ready,
    open: () => setOpen(true), close: () => setOpen(false),
    add, setQuantity, remove, clear, createTicket: submitTicket,
  }), [items, isOpen, isSyncing, expiresAt, expiredNotice, ready, add, setQuantity, remove, clear, submitTicket]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
