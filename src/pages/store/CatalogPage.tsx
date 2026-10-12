import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useCategories, useProducts } from '@/hooks/queries';
import { ProductGrid, ProductGridSkeleton } from '@/components/product/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { AUDIENCE_LABELS, KIT_LABELS, SORT_OPTIONS, VERSION_LABELS, type SortOption } from '@/lib/constants';
import { cn } from '@/lib/format';
import { useDebounce } from '@/hooks/useDebounce';
import { useSeo } from '@/lib/seo';

/** Los filtros viven en la URL: se pueden compartir y el botón "atrás" funciona. */
export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const { data: categories = [] } = useCategories();
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const debounced = useDebounce(search, 300);

  const filters = {
    search: params.get('q') ?? '',
    category: params.get('categoria') ?? '',
    kit: params.get('tipo') ?? '',
    audience: params.get('publico') ?? '',
    version: params.get('version') ?? '',
    sort: (params.get('orden') as SortOption) ?? 'destacados',
  };
  const { data: products = [], isLoading, isError } = useProducts(filters);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // texto -> URL (con debounce)
  const urlQuery = params.get('q') ?? '';
  const lastPushed = useRef(urlQuery);
  useEffect(() => {
    if (debounced !== urlQuery) {
      lastPushed.current = debounced;
      setParam('q', debounced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  // URL -> texto, solo si cambió desde fuera (p. ej. buscador del header)
  useEffect(() => {
    if (urlQuery !== lastPushed.current) {
      lastPushed.current = urlQuery;
      setSearch(urlQuery);
    }
  }, [urlQuery]);

  const activeCount = ['categoria', 'tipo', 'publico', 'version'].filter((k) => params.get(k)).length;
  const categoryName = categories.find((c) => c.slug === filters.category)?.name;
  const kitName = filters.kit ? KIT_LABELS[filters.kit as keyof typeof KIT_LABELS] : '';

  // canonical solo con la categoría: búsquedas y orden no generan páginas duplicadas
  useSeo({
    title: categoryName ? `Camisetas ${categoryName}` : kitName ? `Camisetas ${kitName.toLowerCase()}` : 'Tienda de camisetas de fútbol',
    description: `${categoryName ? `Camisetas de ${categoryName.toLowerCase()}` : 'Todas las camisetas de fútbol'}: local, visitante y tercera, versión fan y jugador, adulto y niño. Envíos a toda Colombia.`,
    path: filters.category ? `/tienda?categoria=${filters.category}` : '/tienda',
    noindex: !!(filters.search || filters.audience || filters.version),
  });

  return (
    <div className="container-page py-10">
      <header className="mb-8">
        <p className="eyebrow">Tienda</p>
        <h1 className="text-5xl font-extrabold tracking-tight leading-none sm:text-6xl">{categoryName ?? 'Todas las camisetas'}</h1>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por equipo, liga, temporada…"
          className="input max-w-sm flex-1 rounded-full"
          aria-label="Buscar"
        />
        <button onClick={() => setShowFilters((v) => !v)} className="btn-ghost" aria-expanded={showFilters}>
          <SlidersHorizontal className="size-4" /> Filtros {activeCount > 0 && <span className="rounded-full bg-volt px-1.5 text-xs">{activeCount}</span>}
        </button>
        <select value={filters.sort} onChange={(e) => setParam('orden', e.target.value === 'destacados' ? '' : e.target.value)} className="input w-auto rounded-full" aria-label="Ordenar">
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {activeCount > 0 && (
          <button onClick={() => setParams(filters.search ? { q: filters.search } : {}, { replace: true })} className="flex items-center gap-1 text-sm font-bold text-card">
            <X className="size-4" /> Limpiar
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mb-8 grid animate-fade-up gap-6 rounded-2xl bg-surface p-5 ring-1 ring-line md:grid-cols-4">
          <FilterGroup label="Categoría" value={filters.category} onChange={(v) => setParam('categoria', v)}
            options={categories.map((c) => ({ value: c.slug, label: c.name }))} />
          <FilterGroup label="Equipación" value={filters.kit} onChange={(v) => setParam('tipo', v)}
            options={Object.entries(KIT_LABELS).map(([value, label]) => ({ value, label }))} />
          <FilterGroup label="Público" value={filters.audience} onChange={(v) => setParam('publico', v)}
            options={Object.entries(AUDIENCE_LABELS).map(([value, label]) => ({ value, label }))} />
          <FilterGroup label="Versión" value={filters.version} onChange={(v) => setParam('version', v)}
            options={Object.entries(VERSION_LABELS).map(([value, label]) => ({ value, label }))} />
        </div>
      )}

      {isLoading ? (
        <ProductGridSkeleton />
      ) : isError ? (
        <EmptyState title="Fuera de juego">No pudimos cargar el catálogo. Intenta de nuevo en un momento.</EmptyState>
      ) : products.length === 0 ? (
        <EmptyState icon={<SearchX />} title="Sin resultados">Prueba con otro equipo o quita algunos filtros.</EmptyState>
      ) : (
        <>
          <p className="mb-4 text-sm text-mute">{products.length} camiseta{products.length !== 1 && 's'}</p>
          <ProductGrid products={products} />
        </>
      )}
    </div>
  );
}

function FilterGroup({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold tracking-tight tracking-wider text-mute">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(value === o.value ? '' : o.value)}
            aria-pressed={value === o.value}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition',
              value === o.value ? 'bg-volt text-fg ring-volt' : 'ring-line hover:ring-line-strong',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
