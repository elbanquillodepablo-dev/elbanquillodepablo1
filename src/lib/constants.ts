import type { Audience, KitType, OrderStatus, ProductVersion } from '@/types';

export const KIT_LABELS: Record<KitType, string> = {
  local: 'Local',
  visitante: 'Visitante',
  tercera: 'Tercera',
  cuarta: 'Cuarta',
  portero: 'Portero',
  entrenamiento: 'Entrenamiento',
  retro: 'Retro',
  especial: 'Edición especial',
};

export const VERSION_LABELS: Record<ProductVersion, string> = {
  fan: 'Versión fan',
  jugador: 'Versión jugador',
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  adulto: 'Adulto',
  nino: 'Niño',
  mujer: 'Mujer',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const ADULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
export const KID_SIZES = ['4', '6', '8', '10', '12', '14', '16'];

export const SORT_OPTIONS = [
  { value: 'destacados', label: 'Destacados' },
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio-asc', label: 'Precio: menor a mayor' },
  { value: 'precio-desc', label: 'Precio: mayor a menor' },
  { value: 'az', label: 'A – Z' },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

export const CO_DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas',
  'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía',
  'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander',
  'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre',
  'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada',
];
