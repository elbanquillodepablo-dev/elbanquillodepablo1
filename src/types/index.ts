// Tipos de dominio — reflejan el esquema de supabase/migrations/0001_init.sql

export type KitType =
  | 'local' | 'visitante' | 'tercera' | 'cuarta'
  | 'portero' | 'entrenamiento' | 'retro' | 'especial';
export type ProductVersion = 'fan' | 'jugador';
export type Audience = 'adulto' | 'nino' | 'mujer';
export type OrderStatus = 'pendiente' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado';
export type StaffRole = 'admin' | 'operario';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  path: string;
  thumb_path: string | null;
  alt: string | null;
  width: number | null;
  height: number | null;
  position: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  team: string;
  league: string | null;
  season: string | null;
  kit_type: KitType;
  version: ProductVersion;
  audience: Audience;
  category_id: string | null;
  price: number;
  compare_at_price: number | null;
  description: string | null;
  sizes: string[];
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null;
  /** Precio y promo vigentes que calcula Supabase para la tienda. */
  original_price?: number | null;
  promotion_title?: string | null;
}

/** Campos editables desde el admin */
export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'images' | 'category' | 'original_price' | 'promotion_title'>;

export interface InventoryAvailability {
  size: string;
  stock_on_hand: number;
  available: number;
}

export interface CartTicketItem {
  product_id: string | null;
  product_name: string;
  size: string;
  quantity: number;
  unit_price: number;
  custom_name: string | null;
  custom_number: string | null;
}

export interface CartTicket {
  id: string;
  code: string;
  customer_name: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  expires_at: string;
  confirmed_at: string | null;
  created_at: string;
  items: CartTicketItem[];
  total: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount_percent: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  products?: { product_id: string }[];
}

export interface OrderItem {
  product_id: string;
  name: string;
  size: string;
  quantity: number;
  unit_price: number;
  custom_name: string | null;
  custom_number: string | null;
}

export interface Order {
  id: string;
  code: string;
  customer_name: string;
  document_id: string | null;
  phone: string;
  department: string | null;
  city: string;
  address: string;
  neighborhood: string | null;
  reference: string | null;
  notes: string | null;
  items: OrderItem[];
  subtotal: number;
  status: OrderStatus;
  created_at: string;
}

export interface CustomerInput {
  customer_name: string;
  document_id: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  neighborhood: string;
  reference: string;
  notes: string;
  /** Autorización de tratamiento de datos (Ley 1581 de 2012) */
  accept_privacy: boolean;
  /** Honeypot anti-bots: debe ir vacío */
  website: string;
}

export interface StoreSettings {
  reservation_schedule_enabled: boolean;
  business_days: number[];
  opens_at: string;
  closes_at: string;
  id: number;
  store_name: string;
  whatsapp_number: string;
  instagram_url: string | null;
  tiktok_url: string | null;
  city: string | null;
  hours: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  home_collection: 'featured' | 'new' | 'promotions';
  hero_product_id: string | null;
  hero_button_label: string;
  shipping_note: string | null;
}

export interface CartItem {
  key: string; // productId|size|name|number
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  size: string;
  quantity: number;
  customName?: string;
  customNumber?: string;
}
