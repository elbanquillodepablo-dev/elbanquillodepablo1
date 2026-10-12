import { useQuery } from '@tanstack/react-query';
import { getProductById, getProductBySlug, getProductsByIds, listProducts, type ProductFilters } from '@/services/products';
import { getSettings, listCategories, listOrders } from '@/services/catalog';
import type { OrderStatus } from '@/types';

/** Llaves centralizadas: invalidar es predecible (queryClient.invalidateQueries({ queryKey: qk.products })) */
export const qk = {
  products: ['products'] as const,
  productList: (f: ProductFilters) => ['products', 'list', f] as const,
  product: (slug: string) => ['products', 'slug', slug] as const,
  productId: (id: string) => ['products', 'id', id] as const,
  productIds: (ids: string[]) => ['products', 'ids', ids] as const,
  categories: (all = false) => ['categories', all] as const,
  settings: ['settings'] as const,
  orders: (status?: OrderStatus) => ['orders', status ?? 'all'] as const,
};

export const useProducts = (filters: ProductFilters = {}) =>
  useQuery({ queryKey: qk.productList(filters), queryFn: () => listProducts(filters) });

export const useProduct = (slug: string) =>
  useQuery({ queryKey: qk.product(slug), queryFn: () => getProductBySlug(slug), enabled: !!slug });

export const useProductById = (id: string | undefined) =>
  useQuery({ queryKey: qk.productId(id ?? ''), queryFn: () => getProductById(id!), enabled: !!id });

export const useProductsByIds = (ids: string[]) =>
  useQuery({ queryKey: qk.productIds(ids), queryFn: () => getProductsByIds(ids) });

export const useCategories = (includeInactive = false) =>
  useQuery({ queryKey: qk.categories(includeInactive), queryFn: () => listCategories(includeInactive), staleTime: 5 * 60_000 });

export const useSettings = () =>
  useQuery({ queryKey: qk.settings, queryFn: getSettings, staleTime: 10 * 60_000 });

export const useOrders = (status?: OrderStatus) =>
  useQuery({ queryKey: qk.orders(status), queryFn: () => listOrders(status) });
