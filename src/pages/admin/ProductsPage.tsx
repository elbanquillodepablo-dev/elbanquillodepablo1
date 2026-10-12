import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useProducts } from '@/hooks/queries';
import { qk } from '@/hooks/queries';
import { deleteProduct, updateProduct } from '@/services/products';
import { errorMessage, useToast } from '@/context/ToastContext';
import { ProductImage } from '@/components/product/ProductImage';
import { Spinner } from '@/components/ui/EmptyState';
import { KIT_LABELS } from '@/lib/constants';
import { cn, formatPrice } from '@/lib/format';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product } from '@/types';
import { AdminTitle } from './AdminLayout';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const { data: products = [], isLoading } = useProducts({ includeInactive: true, search: debounced, sort: 'recientes' });
  const qc = useQueryClient();
  const toast = useToast();

  const toggle = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Product> }) => updateProduct(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.products }),
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  const remove = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.products });
      toast('Producto eliminado');
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  });

  return (
    <>
      <AdminTitle title="Productos">
        <Link to="/admin/kit" className="btn-ghost">Crear equipaciones</Link>
        <Link to="/admin/productos/nuevo" className="btn-primary"><Plus className="size-4" /> Nuevo</Link>
      </AdminTitle>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto o equipo…" className="input mb-5 max-w-sm" aria-label="Buscar" />

      {isLoading ? <Spinner /> : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10">
          <ul className="divide-y divide-ink/10">
            {products.map((p) => (
              <li key={p.id} className={cn('flex items-center gap-4 p-3 sm:p-4', !p.is_active && 'opacity-55')}>
                <div className="size-16 shrink-0 overflow-hidden rounded-xl bg-chalk-2">
                  <ProductImage image={p.images[0]} alt={p.name} kit={p.kit_type} />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/productos/${p.id}`} className="font-bold hover:text-pitch">{p.name}</Link>
                  <p className="text-xs text-mute">
                    {KIT_LABELS[p.kit_type]} · {p.version} · {p.images.length} foto{p.images.length !== 1 && 's'} · {p.category?.name ?? 'Sin categoría'}
                  </p>
                </div>
                <p className="hidden font-extrabold sm:block">{formatPrice(p.price)}</p>
                <div className="flex items-center gap-1">
                  <IconBtn label={p.is_featured ? 'Quitar de destacados' : 'Destacar'} onClick={() => toggle.mutate({ id: p.id, patch: { is_featured: !p.is_featured } })}>
                    <Star className={cn('size-4', p.is_featured && 'fill-volt text-ink')} />
                  </IconBtn>
                  <IconBtn label={p.is_active ? 'Ocultar de la tienda' : 'Publicar'} onClick={() => toggle.mutate({ id: p.id, patch: { is_active: !p.is_active } })}>
                    {p.is_active ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </IconBtn>
                  <Link to={`/admin/productos/${p.id}`} aria-label="Editar" title="Editar" className="grid size-9 place-items-center rounded-full hover:bg-ink/5">
                    <Pencil className="size-4" />
                  </Link>
                  <IconBtn label="Eliminar" onClick={() => confirm(`¿Eliminar "${p.name}" y sus fotos? No se puede deshacer.`) && remove.mutate(p)}>
                    <Trash2 className="size-4 text-card" />
                  </IconBtn>
                </div>
              </li>
            ))}
            {products.length === 0 && <li className="p-8 text-center text-sm text-mute">No hay productos.</li>}
          </ul>
        </div>
      )}
    </>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="grid size-9 place-items-center rounded-full hover:bg-ink/5">
      {children}
    </button>
  );
}
