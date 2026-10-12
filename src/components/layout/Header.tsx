import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Menu, Search, ShoppingBag, X } from 'lucide-react';
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
  const [term, setTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/tienda${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ''}`);
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn('text-sm font-bold transition hover:text-pitch', isActive ? 'text-pitch' : 'text-ink');

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-chalk/85 backdrop-blur-lg">
      <div className="bg-ink py-1.5 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-volt">
        Envíos a toda Colombia · Pedidos por WhatsApp
      </div>
      <div className="container-page flex h-16 items-center gap-4">
        <button className="-ml-2 grid size-10 place-items-center lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Abrir menú">
          <Menu className="size-6" />
        </button>

        <Link to="/" aria-label="El Banquillo de Pablo — inicio" className="shrink-0">
          <Logo />
        </Link>

        <nav className="ml-6 hidden items-center gap-6 lg:flex" aria-label="Principal">
          <NavLink to="/tienda" end className={navClass}>Tienda</NavLink>
          {categories.slice(0, 4).map((c) => (
            <NavLink key={c.id} to={`/tienda?categoria=${c.slug}`} className={() => navClass({ isActive: location.search.includes(`categoria=${c.slug}`) })}>
              {c.name}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={onSearch} role="search" className="ml-auto hidden max-w-xs flex-1 md:block">
          <label className="relative block">
            <span className="sr-only">Buscar camisetas</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Busca equipo, temporada…"
              className="input h-10 rounded-full pl-10"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link to="/favoritos" className="relative grid size-10 place-items-center rounded-full hover:bg-ink/5" aria-label={`Favoritos (${ids.length})`}>
            <Heart className="size-5" />
            {ids.length > 0 && <Badge>{ids.length}</Badge>}
          </Link>
          <button onClick={open} className="relative grid size-10 place-items-center rounded-full hover:bg-ink/5" aria-label={`Carrito (${count})`}>
            <ShoppingBag className="size-5" />
            {count > 0 && <Badge>{count}</Badge>}
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm animate-fade-up flex-col gap-6 bg-chalk p-5">
            <div className="flex items-center justify-between">
              <Logo />
              <button onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" className="grid size-10 place-items-center">
                <X className="size-6" />
              </button>
            </div>
            <form onSubmit={onSearch} role="search">
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Buscar camisetas…" className="input rounded-full" />
            </form>
            <nav className="flex flex-col gap-1 text-2xl" aria-label="Móvil">
              <Link to="/tienda" className="font-display py-2 font-extrabold uppercase">Toda la tienda</Link>
              {categories.map((c) => (
                <Link key={c.id} to={`/tienda?categoria=${c.slug}`} className="font-display py-2 font-extrabold uppercase">
                  {c.name}
                </Link>
              ))}
              <Link to="/favoritos" className="font-display py-2 font-extrabold uppercase">Favoritos</Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-volt px-1 text-[11px] font-extrabold text-ink ring-2 ring-chalk">
      {children}
    </span>
  );
}
