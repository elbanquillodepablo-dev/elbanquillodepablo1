import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import { useProductsByIds } from '@/hooks/queries';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';

export default function FavoritesPage() {
  const { ids } = useFavorites();
  const { data = [], isLoading } = useProductsByIds(ids);

  return (
    <div className="container-page py-10">
      <p className="eyebrow">Tu lista</p>
      <h1 className="mb-8 text-5xl font-extrabold tracking-tight leading-none sm:text-6xl">Favoritos</h1>
      {ids.length === 0 ? (
        <EmptyState icon={<Heart />} title="Aún no hay favoritos">
          Toca el corazón en cualquier camiseta para guardarla aquí.
          <div className="mt-4"><Link to="/tienda" className="btn-primary">Explorar la tienda</Link></div>
        </EmptyState>
      ) : isLoading ? (
        <ProductGridSkeleton count={Math.min(ids.length, 8)} />
      ) : (
        <ProductGrid products={data} />
      )}
    </div>
  );
}
