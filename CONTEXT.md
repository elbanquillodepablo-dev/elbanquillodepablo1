# 🏟️ El Banquillo de Pablo — CONTEXT.md

> **Documento maestro del proyecto.** Si abres este repo en otro computador, con otra persona o con otra IA, empieza por aquí: explica qué es, cómo está hecho, cómo funciona, qué falta y cómo se opera.
>
> Última actualización: **2026-10-12**

---

## 1. Qué es

Tienda online de **camisetas de fútbol** (clubes, selecciones, retro) para Colombia.
- El **cliente** navega el catálogo, guarda favoritos, arma un carrito y envía su pedido. El pedido **se guarda en la base de datos** y **se abre WhatsApp** con el resumen para cerrar la venta (pago y envío se confirman por chat, no hay cobro en línea).
- El **administrador** entra a `/admin`, sube productos y fotos, crea equipaciones completas de un equipo en un clic (local, visitante, tercera…), gestiona categorías, pedidos y ajustes de la tienda.

Referencia de inspiración: https://eltoldodeldeporte-tiendaoficial.netlify.app

---

## 2. Branding

| Elemento | Valor |
|---|---|
| Nombre | **El Banquillo de Pablo** |
| Concepto | El banquillo/dugout: donde esperan los titulares. Tono futbolero, cercano y colombiano ("Vístete de titular", "Golazo", "Fuera de juego"). |
| Estilo | **Oscuro premium** (inspirado en la referencia El Toldo del Deporte: fondo casi negro, tarjetas grafito redondeadas de 22 px, titulares gruesos con tracking apretado) |
| Logo | **Escudo de club oscuro** con borde lima degradado; adentro, el techo del banquillo (arco lima), el banco con patas y el balón. Wordmark "EL BANQUILLO" + "DE PABLO" espaciado en lima. Archivos: `src/components/brand/Logo.tsx` (componente), `public/logo.svg` (lockup completo), `public/favicon.svg`, `public/og.svg` (redes sociales). |

### Paleta (tokens en `src/index.css` → `@theme`)
| Token | Hex | Uso |
|---|---|---|
| `ink` | `#060706` | Lo más profundo: footer, sidebar admin, barras con vidrio |
| `bg` | `#0b0d0c` | Fondo de página (nunca negro puro) |
| `surface` / `surface-2` / `surface-3` | `#131614` / `#1b1f1d` / `#252a27` | Tarjetas, inputs, hover |
| `line` / `line-strong` | blanco 9 % / 18 % | Bordes y divisores |
| `fg` | `#f3f2ed` | Texto principal (17:1 de contraste) |
| `mute` | `#8f9792` | Texto secundario (6.4:1, cumple AA) |
| `volt` | `#cff04a` | **Único acento**: CTA, foco, badges, eyebrows |
| `pitch` / `pitch-2` | `#17452c` / `#1d5636` | Verde césped: bloque destacado de categorías |
| `card` | `#f05252` | Tarjeta roja: descuentos, errores, eliminar |

### Tipografía
- **Geist** (titulares 800 con tracking -0.04em y textos): moderna y legible. No se usa Inter, por recomendación de la skill de diseño.
- **Big Shoulders Display**: solo para la marca (wordmark) y la banda de equipos, con estilo de letrero de estadio.
- Cifras con `tabular-nums` (clase `tabular`) para que los precios no "bailen".

### Patrones de UI (skills ui-ux-pro-max + design-taste-frontend)
- Header flotante tipo píldora con vidrio al hacer scroll; **barra inferior en móvil** (4 destinos con icono + texto, respeta safe-area).
- Hero asimétrico (texto izquierda / collage bento derecha), banda marquee de equipos, categorías en **bento grid**, bloque "El titular de la temporada", lista de beneficios con divisores (sin tarjetas iguales en fila).
- Entradas escalonadas (`.stagger` + `--i`), skeletons con shimmer, estados vacíos y de error con reintento.
- Botones ≥ 44 px, foco visible lima, `prefers-reduced-motion` respetado y sin emojis en la UI (solo iconos SVG de Lucide).

### Tono de microcopy
Futbolero sin exagerar: "Banquillo vacío", "Fuera de juego" (404), "¡Golazo!" (pedido enviado), "Vestuario" (login admin).

---

## 3. Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | **React 18 + TypeScript (strict) + Vite 6** |
| Estilos | **Tailwind CSS v4** (tokens con `@theme`, sin archivo de config) |
| Routing | React Router 6 (data router, rutas con *lazy loading*) |
| Datos/caché | **TanStack Query 5** (caché, reintentos, invalidación) |
| Backend | **Supabase**: Postgres + Auth + Storage + RLS |
| Iconos | lucide-react |
| Deploy | **Netlify** (`netlify.toml` + Edge Functions en `netlify/edge-functions/`). También está listo para Vercel (`vercel.json`). |

### Supabase
| Dato | Valor |
|---|---|
| Proyecto | `elbanquillodepablo-dev's Project` |
| Project ref | `uymvinfxlwqzzwyditsv` |
| URL | `https://uymvinfxlwqzzwyditsv.supabase.co` |
| Región | us-west-2 |
| Llaves | En `.env.local` (no se sube a git). Usa **solo** la *publishable key*. **Nunca** pongas la `secret`/`service_role` en el frontend. |

---

## 4. Arquitectura y buenas prácticas

```
src/
├── main.tsx              # Providers: QueryClient → Toast → Auth → Favoritos → Carrito
├── App.tsx               # Rutas (store + admin con code-splitting)
├── index.css             # Design tokens + componentes base (.btn-*, .input, .chip…)
├── types/                # Tipos de dominio (espejo del esquema SQL)
├── lib/                  # Utilidades puras: supabase client, formato COP, WhatsApp, optimizador de imágenes
├── services/             # Capa de acceso a datos (único lugar que habla con Supabase)
├── hooks/                # React Query hooks + utilidades (debounce, localStorage)
├── context/              # Estado global: Auth, Carrito, Favoritos, Toasts
├── components/           # UI reutilizable (brand, layout, product, admin, ui)
└── pages/
    ├── store/            # Inicio, Tienda, Producto, Favoritos, Checkout, 404
    └── admin/            # Login, Layout+guard, Resumen, Productos, Formulario, Crear equipaciones, Categorías, Pedidos, Ajustes
supabase/
├── migrations/0001_init.sql   # Esquema completo (aplicado)
└── seed.sql                   # Datos iniciales (aplicado)
```

**Principios aplicados**
- **Separación de capas**: Páginas → hooks (React Query) → services → Supabase. La UI nunca arma queries.
- **Seguridad en la base de datos (RLS)**, no en el frontend. El frontend solo oculta botones; quien decide es Postgres.
- **Precios calculados en el servidor**: `create_order()` ignora cualquier precio enviado por el cliente.
- **Estado en la URL** para filtros del catálogo (compartibles, botón atrás funciona).
- **Code-splitting**: el panel admin y páginas secundarias se cargan bajo demanda.
- **Accesibilidad**: foco visible, `aria-*`, "saltar al contenido", `prefers-reduced-motion`, contraste alto.
- **Responsive mobile-first** (probado en 375 px).
- **TypeScript estricto**, sin `any`.
- Llaves de React Query centralizadas en `hooks/queries.ts` (`qk`).

---

## 5. Base de datos

### Tablas (`public`)
| Tabla | Propósito | Campos clave |
|---|---|---|
| `categories` | Clubes, Selecciones, Retro, Edición especial… | `name`, `slug`, `sort_order`, `is_active` |
| `products` | Cada camiseta = equipo + temporada + equipación + versión + público | `team`, `season`, `kit_type`, `version`, `audience`, `price` (COP entero), `compare_at_price`, `sizes[]`, `is_featured`, `is_active` |
| `product_images` | Fotos (varias por producto, ordenadas) | `path` (1600 px), `thumb_path` (640 px), `width`, `height`, `position` |
| `orders` | Pedidos de clientes | datos de envío, `items` (jsonb), `subtotal`, `status`, `code` (BP-XXXXXX) |
| `admins` | Usuarios con acceso al panel | `user_id` → `auth.users` |
| `store_settings` | 1 sola fila: WhatsApp, textos del inicio, horario, redes | `whatsapp_number`, `hero_title`… |

### Enums
- `kit_type`: local, visitante, tercera, cuarta, portero, entrenamiento, retro, especial
- `product_version`: fan, jugador
- `audience`: adulto, nino, mujer
- `order_status`: pendiente, confirmado, enviado, entregado, cancelado

### Funciones
- `is_admin()`: ¿el usuario actual está en `admins`? Se usa en las políticas.
- `create_order(p_customer jsonb, p_items jsonb)`: valida datos, verifica que el producto esté activo y la talla exista, **calcula el precio desde la BD**, genera el código y guarda el pedido. Única forma en que un visitante puede escribir en `orders`. Desde la migración 0002 además:
  - exige `accept_privacy = true` (autorización Ley 1581) y guarda `orders.privacy_accepted_at`;
  - rechaza si el campo trampa `website` viene lleno (bots);
  - **anti-spam**: máximo 5 pedidos por celular por hora y 60 en total por hora.
- `grant_admin_on_signup()` (trigger en `auth.users`): si el correo que se registra está en `admin_emails`, lo vuelve admin automáticamente. Admin configurado: **elbanquillodepablo@gmail.com**.

### Reglas de seguridad (RLS)
| Recurso | Público (anon) | Admin |
|---|---|---|
| Productos / categorías / imágenes | Leer solo los **activos** | CRUD completo |
| Pedidos | Solo crear vía `create_order()` | Leer, cambiar estado, borrar |
| Ajustes | Leer | Editar |
| Storage `products` | Ver imágenes por URL pública | Subir, reemplazar, borrar |

> El asesor de seguridad de Supabase muestra 2 avisos "SECURITY DEFINER ejecutable por anon" en `create_order` e `is_admin`. **Es intencional**: la primera es el endpoint público de pedidos (con validación interna) y la segunda solo responde por el propio usuario.

`admin_emails` tiene RLS sin políticas a propósito: nadie la lee ni la escribe desde la API.

**Verificado (2026-10-12):** sin consentimiento → rechazado; honeypot lleno → rechazado; el 6.º pedido del mismo celular en una hora → bloqueado.
**Verificado antes:** anon ve los 3 productos; anon recibe `[]` en pedidos; anon **no** puede crear productos (error RLS 42501); un pedido con `unit_price: 1` se cobró a precio real ($379.800 por 2 unidades).

---

## 6. Imágenes: optimización automática ⚡

Archivo: `src/lib/imageOptimizer.ts`, usado por `src/services/images.ts`.

Cuando el admin sube una foto (desde PC o **celular**), **antes de subirla**, en el navegador:
1. Corrige la orientación EXIF (fotos de celular giradas).
2. Reduce a **1600 px** máx. (grande) y crea una **miniatura de 640 px** con reescalado por pasos (más nítido).
3. Convierte a **WebP** (calidad 0.82 / 0.78). Si el navegador no puede, usa JPEG.
4. Elimina metadatos (GPS, modelo de cámara).
5. Sube ambos archivos con nombre único y **caché de 1 año** en el CDN.

Resultado típico: **foto de 4–8 MB → ~200–350 KB + miniatura ~40 KB** (≈ 90–95 % menos), sin pérdida visible. El panel muestra el ahorro después de cada subida.

En la tienda (`ProductImage.tsx`): `srcset` (640w/1600w) + `sizes`, `loading="lazy"`, `decoding="async"`, `width/height` (sin saltos de layout), prioridad alta solo para las primeras imágenes y fundido al cargar. Productos sin foto muestran una silueta de camiseta con los colores de la equipación.

> HEIC (iPhone): Safari lo convierte bien; en Chrome/Windows puede fallar. En ese caso, configurar el iPhone en *Ajustes → Cámara → Formatos → Más compatible* o exportar como JPG.

---

## 7. Rutas

### Tienda
| Ruta | Página |
|---|---|
| `/` | Inicio: hero, beneficios, categorías, destacados, novedades |
| `/tienda` | Catálogo con búsqueda y filtros: `?q=`, `?categoria=`, `?tipo=local`, `?publico=nino`, `?version=jugador`, `?orden=precio-asc` |
| `/producto/:slug` | Detalle: galería, tallas, personalización nombre/número, carrito, favorito, consulta por WhatsApp, "Más de [equipo]" |
| `/favoritos` | Favoritos (guardados en el navegador) |
| `/checkout` | Datos de envío + autorización de datos → guarda el pedido → abre WhatsApp |
| `/terminos` | Cómo comprar seguro, envíos, cambios, garantía, retracto (Ley 1480) |
| `/privacidad` | Política de tratamiento de datos (Ley 1581 / Decreto 1377) |
| `/sitemap.xml`, `/robots.txt` | Generados por Edge Functions (`api/` reutilizado por `netlify/edge-functions/`) |

### Admin
| Ruta | Página |
|---|---|
| `/admin/login` | Ingreso ("Vestuario") |
| `/admin` | Resumen: métricas, últimos pedidos, productos sin foto |
| `/admin/productos` | Lista: buscar, destacar ⭐, ocultar/publicar 👁, editar, eliminar |
| `/admin/productos/nuevo` y `/admin/productos/:id` | Formulario + gestor de fotos |
| `/admin/kit` | **Crear equipaciones**: un equipo → varias camisetas de una vez |
| `/admin/categorias` | CRUD de categorías y orden |
| `/admin/pedidos` | Pedidos por estado, contacto directo por WhatsApp |
| `/admin/ajustes` | WhatsApp de la tienda, textos del inicio, horario, redes |

---

## 8. Manual del administrador 📋

### Cuenta admin
- Correo admin: **elbanquillodepablo@gmail.com** (está en `admin_emails`; al crearse queda como admin solo).
- Entrada: **`https://TU-DOMINIO/admin/login`**.
- WhatsApp oficial configurado: **+57 320 571 6302** (`573205716302`).

### Primer acceso (una sola vez)
1. Supabase → **Authentication → Users → Add user → Create new user** → correo `elbanquillodepablo@gmail.com`, una contraseña **fuerte** (12+ caracteres, con símbolos) y marca **Auto Confirm User**.
2. Listo: el trigger la vuelve admin automáticamente.
3. **Authentication → Sign In / Providers → Email → desactiva "Allow new users to sign up"** para que nadie más pueda crear cuentas.
4. **Authentication → URL Configuration** → *Site URL* = la URL de Vercel.
5. Entra a `/admin/login`.

Para agregar otro admin: `insert into public.admin_emails (email) values ('otro@correo.com');` y después creas el usuario.

### Crear "Real Madrid local, visitante y tercera" (lo más rápido)
1. **Crear equipaciones** → escribe `Real Madrid`, liga `LaLiga`, temporada `2026/27`, categoría `Clubes`.
2. Marca **Local, Visitante, Tercera** (y si quieres **Versión jugador** y/o **Niño**).
3. Ajusta precios (fan / jugador / descuento niño). A la derecha ves la vista previa.
4. **Crear N productos**. Debajo aparece cada camiseta con su zona de fotos: arrastra o toca **Subir fotos**. La primera foto es la portada.

### Un producto suelto
**Productos → Nuevo** → completa los datos → **Crear y subir fotos** → sube las fotos.

### Gestionar
- ⭐ = aparece en "Lo más pedido" del inicio. 👁 = visible u oculta en la tienda (ocultar es mejor que borrar).
- Fotos: flechas para reordenar y papelera para borrar.
- **Pedidos**: llegan como *Pendiente*. Al confirmar por WhatsApp cámbialos a *Confirmado → Enviado → Entregado*.

---

## 9. Desarrollo local

```bash
npm install
cp .env.example .env.local   # y llenar URL + publishable key
npm run dev                  # http://localhost:5173
npm run typecheck
npm run build                # genera dist/
```

### Deploy en Netlify (principal)
1. Netlify → **Add new site → Import an existing project → GitHub** → `elbanquillodepablo-dev/elbanquillodepablo1`.
2. Build y publish salen de `netlify.toml` (`npm run build` → `dist`, Node 22).
3. **Site configuration → Environment variables** (antes de desplegar, porque Vite las incrusta al compilar):
   | Variable | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://uymvinfxlwqzzwyditsv.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | la *publishable key* (`sb_publishable_…`) |
   | `VITE_SITE_URL` | la URL final, ej. `https://elbanquillodepablo.netlify.app` |
4. **Deploys → Trigger deploy → Clear cache and deploy site**.
5. Supabase → *Authentication → URL Configuration* → *Site URL* = la URL de Netlify.
6. Google Search Console → enviar `https://TU-SITIO/sitemap.xml`.

Qué hace la configuración de Netlify:
- `[[redirects]] /* → /index.html 200`: SPA.
- Edge Functions (`netlify/edge-functions/`): `/sitemap.xml`, `/robots.txt` y `/producto/*`, con la vista previa del producto en el HTML para WhatsApp y Google. Reutilizan los handlers estándar de `api/` (Request → Response); `api/_shared.ts#env()` lee variables en Netlify (Deno) y en Node.
- Cabeceras de seguridad (CSP, HSTS…) y caché inmutable de `/assets/*`: las mismas que en Vercel.

> **Build:** `npm run build` ejecuta `typecheck` (app + `vite.config.ts` con `tsconfig.node.json` + `api/`) y luego `vite build`. El error `Cannot find module 'node:url'` se resolvió con `@types/node` y un tsconfig separado para `vite.config.ts`.

### Deploy en Vercel (alternativo)
1. vercel.com → **Add New → Project → Import** `elbanquillodepablo-dev/elbanquillodepablo1`.
2. Framework: **Vite** (lo detecta solo; `vercel.json` ya trae build, rutas y cabeceras).
3. **Environment Variables** (Production + Preview):
   | Variable | Valor |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://uymvinfxlwqzzwyditsv.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | la *publishable key* (`sb_publishable_…`) |
   | `VITE_SITE_URL` | la URL final, ej. `https://elbanquillodepablo.vercel.app` o tu dominio |
4. **Deploy**. Luego en Supabase → *Authentication → URL Configuration* pon esa URL como *Site URL*.
5. **Google Search Console**: agrega la propiedad (URL), verifica y envía `https://TU-DOMINIO/sitemap.xml`.
6. Si cambias de dominio: actualiza `VITE_SITE_URL` y vuelve a desplegar.

### Qué hace `vercel.json` / `api/`
- SPA: cualquier ruta sirve `index.html`.
- `/producto/:slug` → `api/product-meta.ts`: devuelve el HTML con título, descripción, foto, precio y JSON-LD del producto, para que **WhatsApp, Facebook y Google** muestren la vista previa correcta sin ejecutar JS.
- `/sitemap.xml` y `/robots.txt` dinámicos (`api/sitemap.ts`, `api/robots.ts`).
- Cabeceras de seguridad: HSTS, CSP estricta (solo este sitio, Google Fonts y el proyecto Supabase), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`. ⚠️ Si cambias de proyecto Supabase, actualiza el dominio en la CSP.
- Caché de 1 año para `/assets/*`.

### Imágenes de marca
`npm run images` regenera `og.png`, `apple-touch-icon.png` e `icon-512.png` desde los SVG (usa `sharp`).

### Repositorio
`https://github.com/elbanquillodepablo-dev/elbanquillodepablo1` (rama `main`).

---

## 10. Estado y tareas

### ✅ Hecho
- [x] Proyecto Supabase conectado
- [x] Esquema, RLS, storage, `create_order` (migración `init_schema`)
- [x] Seed: 4 categorías + Real Madrid 2026/27 (local, visitante, tercera)
- [x] Tienda completa responsive (inicio, catálogo con filtros, detalle, favoritos, carrito, checkout por WhatsApp)
- [x] Panel admin (login, guard, resumen, productos, crear equipaciones, fotos, categorías, pedidos, ajustes)
- [x] Optimización de imágenes WebP + miniaturas
- [x] Branding: logo, favicon, OG, paleta, tipografía
- [x] Build de producción OK; seguridad RLS verificada
- [x] Rediseño oscuro premium + logo escudo (skills ui-ux-pro-max y design-taste-frontend), basado en la referencia
- [x] WhatsApp oficial +57 320 571 6302 y admin automático para elbanquillodepablo@gmail.com
- [x] SEO: meta y canonical por página, Open Graph/Twitter, JSON-LD (Store, WebSite+SearchAction, Product, BreadcrumbList), sitemap y robots dinámicos, vistas previas de producto renderizadas en el servidor, og.png, manifest
- [x] Seguridad: cabeceras (CSP/HSTS…), consentimiento Ley 1581, honeypot, límite de pedidos, páginas de términos y privacidad, avisos anti-fraude
- [x] Configuración de Vercel (`vercel.json` + `api/`)

### ⏳ Pendiente (dueño de la tienda)
- [ ] Crear el usuario `elbanquillodepablo@gmail.com` en Supabase con contraseña fuerte (§8)
- [ ] Desactivar registros públicos en Supabase Auth
- [ ] Deploy en Netlify + variables de entorno (§9)
- [ ] Site URL en Supabase Auth + Google Search Console con el sitemap
- [ ] Subir fotos reales de las camisetas
- [ ] (Recomendado) Completar en `/privacidad` el NIT o cédula del responsable si se formaliza el negocio
- [ ] (Recomendado) Dominio propio, ej. `elbanquillodepablo.com`, y Google Business Profile

### 💡 Ideas próximas
- [ ] Cupones de descuento (tabla `coupons` + validación en `create_order`)
- [ ] Inventario por talla (stock)
- [ ] Reseñas de clientes
- [ ] Página "Guía de tallas"
- [ ] SEO: blog / guías ("cómo saber mi talla", "diferencia fan vs jugador") para tráfico orgánico
- [ ] Notificación al admin por pedido nuevo (Edge Function → email/Telegram)
- [ ] Costo de personalización configurable
- [ ] Tests (Vitest + Testing Library) y CI en GitHub Actions

---

## 11. Bitácora de decisiones
| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-10-12 | Vite + React SPA (no Next.js) | Simple de desplegar; no requiere servidor |
| 2026-10-12 | Funciones edge con handlers estándar (`api/`) para meta de producto, sitemap y robots | SEO y vistas previas en WhatsApp sin migrar a SSR; el mismo código sirve en Netlify y en Vercel |
| 2026-10-12 | Hosting final: **Netlify** | Elección del dueño |
| 2026-10-12 | Admin por lista `admin_emails` + trigger | Claude no crea cuentas ni maneja contraseñas; el dueño crea el usuario y queda admin solo |
| 2026-10-12 | Pedido = guardar en BD **y** abrir WhatsApp | Queda registro para el admin y la venta se cierra por chat, que es lo habitual en Colombia |
| 2026-10-12 | Optimizar imágenes en el navegador | Gratis (las transformaciones de Supabase son de pago), ahorra almacenamiento y ancho de banda |
| 2026-10-12 | Precio en COP como entero | Sin decimales en pesos; evita errores de redondeo |
| 2026-10-12 | Favoritos y carrito en `localStorage` | No exige cuenta al cliente |

---

## 12. Herramientas / skills usadas para construirlo
- **Claude Code**, con el MCP de Supabase conectado a la cuenta del proyecto: migraciones, seed, asesor de seguridad y pruebas RLS.
- Navegador integrado de Claude para revisar el diseño en escritorio y móvil.
- Para continuar con IA: abre el repo, pide *"lee CONTEXT.md"* y sigue con la sección 10.

> ⚠️ **Nota de red (2026-10-12):** desde la red de la oficina, las conexiones HTTPS a `*.supabase.co` se interceptan con un certificado no confiable y a veces redirigen a `147.45.69.3`. Afecta al navegador y a Node. **No** se debe desactivar la verificación TLS para saltarlo. Prueba con otra red (datos del celular) y consúltalo con TI. Los clientes en producción (Vercel) no se ven afectados.
