import { supabase } from '@/lib/supabase';
import type { Category, Order, OrderStatus, StoreSettings } from '@/types';

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
export async function listOrders(status?: OrderStatus): Promise<Order[]> {
  let q = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data as Order[];
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const { error } = await supabase.rpc('update_order_status', { p_order_id: id, p_status: status });
  if (error) throw error;
}
