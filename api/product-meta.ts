import { escapeHtml, publicImage, safeJson, siteOrigin, supabaseGet } from './_shared.ts';

export const config = { runtime: 'edge' };

interface ProductRow {
  name: string;
  slug: string;
  team: string;
  season: string | null;
  kit_type: string;
  description: string | null;
  price: number;
  sizes: string[];
  images: { path: string; position: number }[];
}

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/**
 * /producto/:slug → devuelve el index.html de la SPA con título, descripción,
 * Open Graph y JSON-LD del producto ya incluidos. Así WhatsApp, Facebook y Google
 * ven la foto, el nombre y el precio sin ejecutar JavaScript.
 */
export default async function handler(req: Request): Promise<Response> {
  const origin = siteOrigin(req);
  // Vercel: /api/product-meta?slug=x · Netlify: /producto/x
  const reqUrl = new URL(req.url);
  const slug = reqUrl.searchParams.get('slug') ?? decodeURIComponent(reqUrl.pathname.split('/').filter(Boolean).pop() ?? '');
  const htmlRes = await fetch(`${reqUrl.origin}/index.html`);
  let html = await htmlRes.text();

  const rows = await supabaseGet<ProductRow[]>(
    `products?select=name,slug,team,season,kit_type,description,price,sizes,images:product_images(path,position)&slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&limit=1`,
  ).catch(() => null); // null = Supabase no respondió: servimos la SPA normal
  const p = rows?.[0];

  if (p) {
    const url = `${origin}/producto/${p.slug}`;
    const images = [...p.images].sort((a, b) => a.position - b.position).map((i) => publicImage(i.path));
    const image = images[0] ?? `${origin}/og.png`;
    const title = `${p.name} | El Banquillo de Pablo`;
    const description = `${p.name}. ${cop.format(p.price)}. Tallas ${p.sizes.join(', ')}. Envíos a toda Colombia, pedido por WhatsApp.`;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.description ?? description,
      sku: p.slug,
      ...(images.length ? { image: images } : {}),
      brand: { '@type': 'Brand', name: p.team },
      offers: {
        '@type': 'Offer', url, price: p.price, priceCurrency: 'COP',
        availability: 'https://schema.org/InStock', itemCondition: 'https://schema.org/NewCondition',
      },
    };

    const head = [
      `<title>${escapeHtml(title)}</title>`,
      `<meta name="description" content="${escapeHtml(description)}" />`,
      `<link rel="canonical" href="${escapeHtml(url)}" />`,
      `<meta property="og:type" content="product" />`,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
      `<meta property="og:url" content="${escapeHtml(url)}" />`,
      `<meta property="og:image" content="${escapeHtml(image)}" />`,
      `<meta property="product:price:amount" content="${p.price}" />`,
      `<meta property="product:price:currency" content="COP" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<script type="application/ld+json">${safeJson(jsonLd)}</script>`,
    ].join('\n    ');

    html = html
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta name="description"[^>]*>/, '')
      .replace(/<meta property="og:(title|description|image|type|url)"[^>]*>/g, '')
      .replace('</head>', `    ${head}\n  </head>`);
  }

  return new Response(html, {
    status: rows && !p ? 404 : 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
