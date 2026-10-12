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
    `¡Hola! Quiero confirmar mi pedido *${code}* 🏟️`,
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
