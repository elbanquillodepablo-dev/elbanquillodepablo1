import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { Spinner } from '@/components/ui/EmptyState';
import HomePage from '@/pages/store/HomePage';

// Code-splitting: el panel admin no se descarga para los clientes de la tienda
const CatalogPage = lazy(() => import('@/pages/store/CatalogPage'));
const ProductPage = lazy(() => import('@/pages/store/ProductPage'));
const FavoritesPage = lazy(() => import('@/pages/store/FavoritesPage'));
const CheckoutPage = lazy(() => import('@/pages/store/CheckoutPage'));
const NotFoundPage = lazy(() => import('@/pages/store/NotFoundPage'));
const PrivacyPage = lazy(() => import('@/pages/store/PrivacyPage'));
const TermsPage = lazy(() => import('@/pages/store/TermsPage'));

const RequireAdmin = lazy(() => import('@/pages/admin/AdminLayout').then((m) => ({ default: m.RequireAdmin })));
const AdminOnly = lazy(() => import('@/pages/admin/AdminLayout').then((m) => ({ default: m.AdminOnly })));
const LoginPage = lazy(() => import('@/pages/admin/LoginPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const ProductsPage = lazy(() => import('@/pages/admin/ProductsPage'));
const ProductFormPage = lazy(() => import('@/pages/admin/ProductFormPage'));
const KitBuilderPage = lazy(() => import('@/pages/admin/KitBuilderPage'));
const CategoriesPage = lazy(() => import('@/pages/admin/CategoriesPage'));
const OrdersPage = lazy(() => import('@/pages/admin/OrdersPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const InventoryPage = lazy(() => import('@/pages/admin/InventoryPage'));
const PromotionsPage = lazy(() => import('@/pages/admin/PromotionsPage'));
const StaffPage = lazy(() => import('@/pages/admin/StaffPage'));
const CartTicketsPage = lazy(() => import('@/pages/admin/CartTicketsPage'));

const s = (el: ReactNode) => <Suspense fallback={<Spinner />}>{el}</Suspense>;

const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/tienda', element: s(<CatalogPage />) },
      { path: '/producto/:slug', element: s(<ProductPage />) },
      { path: '/favoritos', element: s(<FavoritesPage />) },
      { path: '/checkout', element: s(<CheckoutPage />) },
      { path: '/privacidad', element: s(<PrivacyPage />) },
      { path: '/terminos', element: s(<TermsPage />) },
      { path: '*', element: s(<NotFoundPage />) },
    ],
  },
  { path: '/admin/login', element: s(<LoginPage />) },
  {
    path: '/admin',
    element: s(<RequireAdmin />),
    children: [
      { index: true, element: s(<DashboardPage />) },
      { path: 'productos', element: s(<AdminOnly><ProductsPage /></AdminOnly>) },
      { path: 'productos/nuevo', element: s(<AdminOnly><ProductFormPage /></AdminOnly>) },
      { path: 'productos/:id', element: s(<AdminOnly><ProductFormPage /></AdminOnly>) },
      { path: 'kit', element: s(<AdminOnly><KitBuilderPage /></AdminOnly>) },
      { path: 'categorias', element: s(<AdminOnly><CategoriesPage /></AdminOnly>) },
      { path: 'inventario', element: s(<InventoryPage />) },
      { path: 'promociones', element: s(<AdminOnly><PromotionsPage /></AdminOnly>) },
      { path: 'pedidos', element: s(<OrdersPage />) },
      { path: 'consultas', element: s(<CartTicketsPage />) },
      { path: 'equipo', element: s(<AdminOnly><StaffPage /></AdminOnly>) },
      { path: 'ajustes', element: s(<AdminOnly><SettingsPage /></AdminOnly>) },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
