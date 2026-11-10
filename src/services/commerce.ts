import { supabase, publicImageUrl } from '@/lib/supabase';
import type { CartTicket, InventoryAvailability, Promotion } from '@/types';

export async function getInventoryAvailability(productId: string): Promise<InventoryAvailability[]> {
  const { data, error } = await supabase.rpc('get_guest_inventory', { p_product_id: productId });
  if (error) throw error;
  return (data ?? []) as InventoryAvailability[];
}

export interface InventoryRow extends InventoryAvailability {
  product_id: string;
  product_name: string;
  updated_at: string;
}

export async function listInventory(): Promise<InventoryRow[]> {
  const { data: products, error: productsError } = await supabase.from('products').select('id,name,sizes').eq('is_active', true).order('name');
  if (productsError) throw productsError;
  const productRows = (products ?? []) as { id: string; name: string; sizes: string[] }[];
  if (!productRows.length) return [];
  const nameById = new Map(productRows.map((product) => [product.id, product.name]));
  const validVariants = new Set(productRows.flatMap((product) => product.sizes.map((size) => `${product.id}:${size}`)));
  const { data, error } = await supabase.from('product_inventory')
    .select('product_id,size,stock_on_hand,updated_at').in('product_id', productRows.map((product) => product.id))
    .order('product_id').order('size');
  if (error) throw error;
  const rows = ((data ?? []) as { product_id: string; size: string; stock_on_hand: number; updated_at: string }[])
    .filter((row) => validVariants.has(`${row.product_id}:${row.size}`));
  const productIds = [...new Set(rows.map((row) => row.product_id))];
  const availabilities = await Promise.all(productIds.map(async (id) => [id, await getInventoryAvailability(id)] as const));
  const availableByVariant = new Map<string, number>();
  availabilities.forEach(([id, sizes]) => sizes.forEach((size: InventoryAvailability) => availableByVariant.set(`${id}:${size.size}`, size.available)));
  return rows.map((row) => ({
    product_id: row.product_id,
    product_name: nameById.get(row.product_id) ?? 'Producto',
    size: row.size,
    stock_on_hand: row.stock_on_hand,
    updated_at: row.updated_at,
    available: availableByVariant.get(`${row.product_id}:${row.size}`) ?? 0,
  }));
}

/** One statement: PostgreSQL rolls back every row if any stock constraint fails. */
export async function saveInventoryBatch(changes: { product_id: string; size: string; stock_on_hand: number }[]): Promise<void> {
  if (!changes.length) return;
  if (changes.some((row) => !Number.isInteger(row.stock_on_hand) || row.stock_on_hand < 0 || row.stock_on_hand > 10000)) {
    throw new Error('Todas las cantidades deben ser números enteros entre 0 y 10.000.');
  }
  const { error } = await supabase.from('product_inventory').upsert(changes, { onConflict: 'product_id,size' });
  if (error) throw error;
}

export async function listCartTickets(): Promise<CartTicket[]> {
  const { data, error } = await supabase.from('cart_tickets')
    .select('id,code,customer_name,status,expires_at,confirmed_at,created_at,items:cart_ticket_items(product_id,product_name,size,quantity,unit_price,custom_name,custom_number)')
    .order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const items = row.items as CartTicket['items'];
    return { ...row, items, total: items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0) } as CartTicket;
  });
}

export async function resolveCartTicket(id: string, action: 'confirm' | 'cancel'): Promise<void> {
  const { error } = await supabase.rpc(action === 'confirm' ? 'confirm_cart_ticket' : 'cancel_cart_ticket', { p_ticket_id: id });
  if (error) throw error;
}

export interface PromotionInput {
  title: string;
  description: string;
  discount_percent: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  product_ids: string[];
}

export async function listPromotions(): Promise<Promotion[]> {
  const { data, error } = await supabase.from('promotions')
    .select('*, products:promotion_products(product_id)').order('starts_at', { ascending: false });
  if (error) throw error;
  return data as Promotion[];
}

export async function savePromotion(input: PromotionInput, id?: string): Promise<void> {
  if (!input.product_ids.length) throw new Error('Selecciona al menos un producto para la promoción.');
  const { data: promotion, error } = id
    ? await supabase.from('promotions').update({
        title: input.title, description: input.description || null, discount_percent: input.discount_percent,
        starts_at: input.starts_at, ends_at: input.ends_at, is_active: input.is_active,
      }).eq('id', id).select('id').single()
    : await supabase.from('promotions').insert({
        title: input.title, description: input.description || null, discount_percent: input.discount_percent,
        starts_at: input.starts_at, ends_at: input.ends_at, is_active: input.is_active,
      }).select('id').single();
  if (error) throw error;
  const { error: deleteError } = await supabase.from('promotion_products').delete().eq('promotion_id', promotion.id);
  if (deleteError) throw deleteError;
  const { error: insertError } = await supabase.from('promotion_products').insert(input.product_ids.map((product_id) => ({ promotion_id: promotion.id, product_id })));
  if (insertError) throw insertError;
}

export async function deletePromotion(id: string): Promise<void> {
  const { error } = await supabase.from('promotions').delete().eq('id', id);
  if (error) throw error;
}

export async function setCartReservation(token: string, items: { product_id: string; size: string; quantity: number; custom_name?: string; custom_number?: string }[]) {
  const { data, error } = await supabase.rpc('reserve_guest_cart', { p_token: token, p_items: items });
  if (error) throw error;
  return data as { expires_at: string };
}

export async function getReservedCart(token: string) {
  const { data, error } = await supabase.rpc('get_guest_cart', { p_token: token });
  if (error) throw error;
  const result = data as {
    items: { product_id: string; size: string; quantity: number; name: string; unit_price: number; slug: string; image_path: string | null; custom_name: string | null; custom_number: string | null }[];
    expires_at: string | null;
    expired: boolean;
  };
  return {
    ...result,
    items: result.items.map((item) => ({
      key: `${item.product_id}|${item.size}|${item.custom_name ?? ''}|${item.custom_number ?? ''}`, productId: item.product_id, size: item.size,
      quantity: item.quantity, name: item.name, price: item.unit_price, slug: item.slug,
      image: publicImageUrl(item.image_path),
      customName: item.custom_name ?? undefined, customNumber: item.custom_number ?? undefined,
    })),
  };
}

export async function createCartTicket(token: string, name: string, acceptPrivacy: boolean) {
  const { data, error } = await supabase.rpc('create_guest_ticket', { p_token: token, p_customer_name: name, p_accept_privacy: acceptPrivacy });
  if (error) throw error;
  return data as { id: string; code: string; customer_name: string; expires_at: string; items: { name: string; size: string; quantity: number; unit_price: number; custom_name: string | null; custom_number: string | null }[]; total: number };
}

export function newCartToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
