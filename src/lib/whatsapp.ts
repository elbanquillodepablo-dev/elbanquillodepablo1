import type { CartItem, CustomerInput } from '@/types';
import { formatPrice } from './format';

export function whatsappLink(number: string, message: string): string {
  const clean = number.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export function productInquiryMessage(productName: string, url: string, size?: string): string {
  return `¡Hola! Me interesa la camiseta *${productName}*${size ? ` en talla *${size}*` : ''}.\n${url}`;
}

export function orderMessage(code: string, items: CartItem[], customer: CustomerInput, total: number): string {
  const lines = items.map((i) => {
    const custom = i.customName || i.customNumber ? ` · Personalizada: ${i.customName ?? ''} ${i.customNumber ?? ''}`.trimEnd() : '';
    return `• ${i.quantity} × ${i.name} (talla ${i.size})${custom} — ${formatPrice(i.price * i.quantity)}`;
  });
  return [
    `¡Hola! Quiero confirmar mi pedido *${code}*`,
    '',
    ...lines,
    '',
    `*Subtotal:* ${formatPrice(total)}`,
    '',
    `*Envío a:* ${customer.customer_name}`,
    `${customer.address}${customer.neighborhood ? `, ${customer.neighborhood}` : ''}`,
    `${customer.city}${customer.department ? `, ${customer.department}` : ''}`,
    `Tel: ${customer.phone}`,
  ].join('\n');
}

export function cartTicketMessage(
  code: string,
  customerName: string,
  items: { name: string; size: string; quantity: number; unit_price: number; custom_name?: string | null; custom_number?: string | null }[],
  total: number,
): string {
  const lines = items.map((item) => {
    const custom = item.custom_name || item.custom_number ? ` · Personalizada: ${item.custom_name ?? ''} ${item.custom_number ?? ''}`.trimEnd() : '';
    return `• ${item.quantity} × ${item.name} (talla ${item.size})${custom} — ${formatPrice(item.unit_price * item.quantity)}`;
  });
  return [
    `¡Hola! Soy ${customerName} y quiero continuar con mi carrito ${code}.`,
    '', ...lines, '', `*Total cotizado:* ${formatPrice(total)}`,
    'La reserva se mantiene hasta el vencimiento indicado en la tienda.',
  ].join('\n');
}
