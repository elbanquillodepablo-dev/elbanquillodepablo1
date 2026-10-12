import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Home, LayoutGrid, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useCategories } from '@/hooks/queries';
import { cn } from '@/lib/format';

export function Header() {
  const { count, open } = useCart();
  const { ids } = useFavorites();
  const { data: categories = [] } = useCategories();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [term, setTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/tienda${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ''}`);
  };

  const activeCategory = new URLSearchParams(location.search).get('categoria');
  const pill = (active: boolean) =>
    cn('rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200',
      active ? 'bg-surface-3 text-fg' : 'text-mute hover:text-fg');

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5">
        <div
          className={cn(
            'mx-auto flex h-16 max-w-[1400px] items-center gap-3 rounded-[22px] px-3 ring-1 transition-colors duration-300 sm:px-4',
            scrolled
              ? 'bg-ink/75 ring-line backdrop-blur-xl shadow-[inset_0_1px_0_rgb(255_255_255/0.05)]'
              : 'bg-transparent ring-transparent',
          )}
        >
          <Link to="/" aria-label="El Banquillo de Pablo, inicio" className="shrink-0 rounded-xl">
            <Logo />
          </Link>

          <nav className="ml-4 hidden items-center gap-1 rounded-full bg-surface/70 p-1 ring-1 ring-line lg:flex" aria-label="Principal">
            <NavLink to="/" end className={({ isActive }) => pill(isActive)}>Inicio</NavLink>
            <NavLink to="/tienda" className={({ isActive }) => pill(isActive && !activeCategory)}>Camisetas</NavLink>
            {categories.slice(0, 3).map((c) => (
              <Link key={c.id} to={`/tienda?categoria=${c.slug}`} className={pill(activeCategory === c.slug)}>{c.name}</Link>
            ))}
          </nav>

          <form onSubmit={onSearch} role="search" className="ml-auto hidden w-full max-w-xs md:block">
            <label className="relative block">
              <span className="sr-only">Buscar camisetas</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Equipo, temporada, liga…"
                className="input h-11 rounded-full bg-surface pl-11" />
            </label>
          </form>

          <div className="ml-auto flex items-center gap-1 md:ml-1">
            <IconLink to="/favoritos" label={`Favoritos (${ids.length})`} badge={ids.length} className="hidden sm:grid">
              <Heart className="size-5" />
            </IconLink>
            <button onClick={open} aria-label={`Carrito (${count})`} className="relative hidden size-11 place-items-center rounded-full hover:bg-surface-2 sm:grid">
              <ShoppingBag className="size-5" />
              {count > 0 && <Badge>{count}</Badge>}
            </button>
            <button className="grid size-11 place-items-center rounded-full hover:bg-surface-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
              <Menu className="size-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Barra inferior móvil: máximo 5 destinos, icono + texto */}
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[22px] bg-ink/85 p-1.5 ring-1 ring-line backdrop-blur-xl sm:hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }} aria-label="Navegación móvil">
        <BottomItem to="/" label="Inicio" end><Home className="size-5" /></BottomItem>
        <BottomItem to="/tienda" label="Tienda"><LayoutGrid className="size-5" /></BottomItem>
        <BottomItem to="/favoritos" label="Favoritos" badge={ids.length}><Heart className="size-5" /></BottomItem>
        <button onClick={open} className="flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium text-mute">
          <span className="relative"><ShoppingBag className="size-5" />{count > 0 && <Badge>{count}</Badge>}</span>
          Carrito
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm animate-fade-up flex-col gap-8 overflow-y-auto bg-bg p-5 ring-1 ring-line">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" className="grid size-11 place-items-center rounded-full hover:bg-surface-2">
                <X className="size-6" />
              </button>
            </div>
            <form onSubmit={onSearch} role="search">
              <label className="relative block">
                <span className="sr-only">Buscar</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-mute" />
                <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar camisetas…" className="input rounded-full pl-11" />
              </label>
            </form>
            <nav className="flex flex-col" aria-label="Categorías">
              <Link to="/tienda" className="border-b border-line py-4 text-2xl font-bold tracking-tight">Todas las camisetas</Link>
              {categories.map((c, i) => (
                <Link key={c.id} to={`/tienda?categoria=${c.slug}`} style={{ '--i': i } as CSSProperties}
                  className="stagger flex items-baseline justify-between border-b border-line py-4 text-2xl font-bold tracking-tight">
                  {c.name}
                  <span className="tabular text-sm font-medium text-mute">{String(i + 1).padStart(2, '0')}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function IconLink({ to, label, badge, children, className }: { to: string; label: string; badge?: number; children: ReactNode; className?: string }) {
  return (
    <Link to={to} aria-label={label} className={cn('relative size-11 place-items-center rounded-full hover:bg-surface-2', className)}>
      {children}
      {!!badge && <Badge>{badge}</Badge>}
    </Link>
  );
}

function BottomItem({ to, label, end, badge, children }: { to: string; label: string; end?: boolean; badge?: number; children: ReactNode }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) => cn('flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium transition-colors', isActive ? 'bg-surface-2 text-fg' : 'text-mute')}>
      <span className="relative">{children}{!!badge && <Badge>{badge}</Badge>}</span>
      {label}
    </NavLink>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="tabular absolute -right-2 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-volt px-1 text-[10px] font-bold text-ink">
      {children}
    </span>
  );
}
