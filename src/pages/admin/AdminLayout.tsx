import { useState, type ReactNode } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ExternalLink, LayoutDashboard, LogOut, Menu, Package, Settings, Shirt, Tags, Layers, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/brand/Logo';
import { Spinner } from '@/components/ui/EmptyState';
import { cn } from '@/lib/format';

const NAV = [
  { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/admin/productos', label: 'Productos', icon: Shirt },
  { to: '/admin/kit', label: 'Crear equipaciones', icon: Layers },
  { to: '/admin/categorias', label: 'Categorías', icon: Tags },
  { to: '/admin/pedidos', label: 'Pedidos', icon: Package },
  { to: '/admin/ajustes', label: 'Ajustes', icon: Settings },
];

/** Protege todas las rutas /admin/*: requiere sesión y estar en la tabla admins. */
export function RequireAdmin() {
  const { session, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Verificando acceso…" />;
  if (!session) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Sin permisos</h1>
          <p className="text-mute">Tu usuario ({session.user.email}) no es administrador.</p>
          <button onClick={signOut} className="btn-primary">Cerrar sesión</button>
        </div>
      </div>
    );
  }
  return <AdminLayout />;
}

function AdminLayout() {
  const { session, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Administración">
      <Link to="/admin" className="mb-6 px-2"><Logo /></Link>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition',
              isActive ? 'bg-volt text-ink' : 'text-fg/75 hover:bg-bg/10 hover:text-fg')
          }
        >
          <Icon className="size-[18px]" /> {label}
        </NavLink>
      ))}
      <div className="mt-auto space-y-1 border-t border-line pt-4">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-fg/75 hover:bg-bg/10">
          <ExternalLink className="size-[18px]" /> Ver tienda
        </a>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-fg/75 hover:bg-bg/10">
          <LogOut className="size-[18px]" /> Salir
        </button>
        <p className="truncate px-3 pt-2 text-xs text-fg/40">{session?.user.email}</p>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="stadium-glow sticky top-0 hidden h-dvh bg-ink lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-4 lg:hidden">
        <Logo className="scale-90 origin-left" />
        <button onClick={() => setOpen(true)} aria-label="Abrir menú" className="text-fg"><Menu className="size-6" /></button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setOpen(false)} />
          <aside className="stadium-glow absolute inset-y-0 left-0 w-72 bg-ink">
            <button onClick={() => setOpen(false)} aria-label="Cerrar menú" className="absolute right-3 top-4 text-fg"><X className="size-6" /></button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="min-w-0 p-4 sm:p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminTitle({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-4xl font-extrabold tracking-tight leading-none sm:text-5xl">{title}</h1>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
