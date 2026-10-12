import { supabase } from '@/lib/supabase';
import type { Product, ProductInput } from '@/types';
import type { SortOption } from '@/lib/constants';

const SELECT = '*, images:product_images(*), category:categories(id,name,slug)';

export interface ProductFilters {
  search?: string;
  category?: string; // slug
  kit?: string;
  audience?: string;
  version?: string;
  sort?: SortOption;
  featured?: boolean;
  includeInactive?: boolean; // solo admin
}

function sortImages(p: Product): Product {
  return { ...p, images: [...(p.images ?? [])].sort((a, b) => a.position - b.position) };
}

export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let query = supabase.from('products').select(SELECT);

  if (!filters.includeInactive) query = query.eq('is_active', true);
  if (filters.featured) query = query.eq('is_featured', true);
  if (filters.kit) query = query.eq('kit_type', filters.kit);
  if (filters.audience) query = query.eq('audience', filters.audience);
  if (filters.version) query = query.eq('version', filters.version);
  if (filters.category) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', filters.category).maybeSingle();
    if (!cat) return [];
    query = query.eq('category_id', cat.id);
  }
  if (filters.search?.trim()) {
    // quita caracteres que rompen la sintaxis del filtro or()
    const term = filters.search.trim().replace(/[%,()*]/g, ' ');
    query = query.or(`name.ilike.%${term}%,team.ilike.%${term}%,season.ilike.%${term}%,league.ilike.%${term}%`);
  }

  switch (filters.sort) {
    case 'precio-asc': query = query.order('price', { ascending: true }); break;
    case 'precio-desc': query = query.order('price', { ascending: false }); break;
    case 'az': query = query.order('name', { ascending: true }); break;
    case 'recientes': query = query.order('created_at', { ascending: false }); break;
    default:
      query = query.order('is_featured', { ascending: false }).order('sort_order').order('created_at', { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Product[]).map(sortImages);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(SELECT).eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data ? sortImages(data as Product) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase.from('products').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? sortImages(data as Product) : null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase.from('products').select(SELECT).in('id', ids).eq('is_active', true);
  if (error) throw error;
  return (data as Product[]).map(sortImages);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data, error } = await supabase.from('products').insert(input).select(SELECT).single();
  if (error) throw error;
  return data as Product;
}

export async function createProducts(inputs: ProductInput[]): Promise<Product[]> {
  const { data, error } = await supabase.from('products').insert(inputs).select(SELECT);
  if (error) throw error;
  return data as Product[];
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const { data, error } = await supabase.from('products').update(input).eq('id', id).select(SELECT).single();
  if (error) throw error;
  return data as Product;
}

export async function deleteProduct(product: Product): Promise<void> {
  const paths = product.images.flatMap((i) => [i.path, i.thumb_path].filter(Boolean) as string[]);
  if (paths.length) await supabase.storage.from('products').remove(paths);
  const { error } = await supabase.from('products').delete().eq('id', product.id);
  if (error) throw error;
}
