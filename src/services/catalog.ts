import { supabase } from '@/lib/supabase';
import type { Category, CustomerInput, Order, OrderStatus, StoreSettings, CartItem } from '@/types';

// ---------- Categorías ----------
export async function listCategories(includeInactive = false): Promise<Category[]> {
  let q = supabase.from('categories').select('*').order('sort_order').order('name');
  if (!includeInactive) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return data as Category[];
}

export async function upsertCategory(input: Partial<Category> & Pick<Category, 'name' | 'slug'>): Promise<void> {
  const { error } = await supabase.from('categories').upsert(input);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Ajustes ----------
export async function getSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data as StoreSettings;
}

export async function updateSettings(input: Partial<StoreSettings>): Promise<void> {
  const { error } = await supabase.from('store_settings').update(input).eq('id', 1);
  if (error) throw error;
}

// ---------- Pedidos ----------
export async function createOrder(customer: CustomerInput, items: CartItem[]) {
  const { data, error } = await supabase.rpc('create_order', {
    p_customer: customer,
    p_items: items.map((i) => ({
      product_id: i.productId,
      size: i.size,
      quantity: i.quantity,
      custom_name: i.customName ?? '',
      custom_number: i.customNumber ?? '',
    })),
  });
  if (error) throw error;
  const row = (data as { order_id: string; order_code: string; order_total: number }[])[0];
  return { id: row.order_id, code: row.order_code, total: row.order_total };
}

export async function listOrders(status?: OrderStatus): Promise<Order[]> {
  let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data as Order[];
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}
