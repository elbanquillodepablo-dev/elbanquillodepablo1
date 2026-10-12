import { useEffect } from 'react';

export const SITE_NAME = 'El Banquillo de Pablo';
export const DEFAULT_DESCRIPTION =
  'Tienda virtual de camisetas de fútbol en Colombia: clubes, selecciones y retro. Local, visitante y tercera equipación, versión fan y jugador. Envíos a todo el país y pedido por WhatsApp.';

/** URL pública del sitio (VITE_SITE_URL en Vercel); en local usa el origen actual. */
export const siteUrl = () =>
  ((import.meta.env.VITE_SITE_URL as string | undefined) || window.location.origin).replace(/\/$/, '');

export const absoluteUrl = (path: string) => (/^https?:/.test(path) ? path : `${siteUrl()}${path.startsWith('/') ? '' : '/'}${path}`);

interface SeoOptions {
  title?: string;
  description?: string;
  path?: string;           // ruta canónica (sin query de filtros)
  image?: string | null;
  type?: 'website' | 'product';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/** Título, descripción, canonical, Open Graph, Twitter y JSON-LD por página. */
export function useSeo({ title, description = DEFAULT_DESCRIPTION, path, image, type = 'website', noindex = false, jsonLd }: SeoOptions) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} · Camisetas de fútbol en Colombia`;
  const canonical = absoluteUrl(path ?? window.location.pathname);
  const img = absoluteUrl(image || '/og.png');
  const ld = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    document.title = fullTitle;
    // quita el JSON-LD que inyecta el servidor (api/product-meta) para no duplicarlo
    document.head.querySelectorAll('script[type="application/ld+json"]:not([data-seo])').forEach((n) => n.remove());
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setCanonical(canonical);
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:type', type === 'product' ? 'product' : 'website');
    setMeta('property', 'og:image', img);
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', img);

    let script: HTMLScriptElement | null = null;
    if (ld) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seo = 'page';
      script.textContent = ld;
      document.head.appendChild(script);
    }
    return () => {
      script?.remove();
    };
  }, [fullTitle, description, canonical, img, type, noindex, ld]);
}

/** Datos estructurados de la tienda (se usan en el inicio). */
export function storeJsonLd(whatsapp?: string) {
  const url = siteUrl();
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name: SITE_NAME,
      url,
      logo: `${url}/logo.svg`,
      image: `${url}/og.png`,
      description: DEFAULT_DESCRIPTION,
      address: { '@type': 'PostalAddress', addressCountry: 'CO' },
      areaServed: 'CO',
      currenciesAccepted: 'COP',
      ...(whatsapp ? { telephone: `+${whatsapp}` } : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url,
      inLanguage: 'es-CO',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${url}/tienda?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ];
}
