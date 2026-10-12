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
| Logo | `src/components/brand/Logo.tsx` y `public/favicon.svg`: arco del techo del banquillo (lima), banco con patas (tiza) y balón. Wordmark "EL BANQUILLO" + "DE PABLO" espaciado. |
| Imagen social | `public/og.svg` |

### Paleta (tokens en `src/index.css` → `@theme`)
| Token | Hex | Uso |
|---|---|---|
| `ink` | `#0c1410` | Noche de estadio: fondos oscuros, texto principal |
| `pitch` | `#14532d` | Verde césped: acentos, enlaces |
| `chalk` | `#f5f3ee` | Cal de la cancha: fondo principal |
| `volt` | `#d4ff3a` | Lima "marcador": CTA, badges, foco |
| `card` | `#e5484d` | Tarjeta roja: descuentos, errores, eliminar |
| `mute` | `#6b7a72` | Texto secundario |

### Tipografía
- **Big Shoulders Display** (titulares, en MAYÚSCULAS): estilo letrero de estadio.
- **Manrope** (texto y UI).

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
| Deploy sugerido | Netlify (`netlify.toml` listo) o Vercel |

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
- `create_order(p_customer jsonb, p_items jsonb)`: valida datos, verifica que el producto esté activo y la talla exista, **calcula el precio desde la BD**, genera el código y guarda el pedido. Única forma en que un visitante puede escribir en `orders`.

### Reglas de seguridad (RLS)
| Recurso | Público (anon) | Admin |
|---|---|---|
| Productos / categorías / imágenes | Leer solo los **activos** | CRUD completo |
| Pedidos | Solo crear vía `create_order()` | Leer, cambiar estado, borrar |
| Ajustes | Leer | Editar |
| Storage `products` | Ver imágenes por URL pública | Subir, reemplazar, borrar |

> El asesor de seguridad de Supabase muestra 2 avisos "SECURITY DEFINER ejecutable por anon" en `create_order` e `is_admin`. **Es intencional**: la primera es el endpoint público de pedidos (con validación interna) y la segunda solo responde por el propio usuario.

**Verificado (2026-10-12):** anon ve los 3 productos; anon recibe `[]` en pedidos; anon **no** puede crear productos (error RLS 42501); un pedido con `unit_price: 1` se cobró a precio real ($379.800 por 2 unidades).

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
| `/checkout` | Datos de envío → guarda el pedido → abre WhatsApp |

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

### Primer acceso (una sola vez)
1. Supabase → **Authentication → Users → Add user → Create new user**: tu correo + contraseña (marca *Auto Confirm User*).
2. Dale permisos de admin. En **SQL Editor** ejecuta:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'TU_CORREO@ejemplo.com';
   ```
   (o pídeselo a Claude con el correo).
3. Recomendado: **Authentication → Providers → Email → desactivar "Allow new users to sign up"**. Así nadie más puede crear cuentas.
4. Entra a `/admin/login`.
5. Ve a **Ajustes** y pon el **número de WhatsApp real** (ej. `573001234567`). ⚠️ Hoy está el de ejemplo `573000000000`.

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

### Deploy en Netlify
1. *Add new site → Import from GitHub* → este repo.
2. Build `npm run build`, publish `dist` (ya en `netlify.toml`).
3. *Environment variables*: `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. En Supabase → **Authentication → URL Configuration**: agrega la URL del sitio en *Site URL / Redirect URLs*.

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

### ⏳ Pendiente (dueño de la tienda)
- [ ] Crear usuario admin en Supabase y darle permisos (ver §8)
- [ ] Desactivar registros públicos en Supabase Auth
- [ ] Poner el WhatsApp real en Ajustes
- [ ] Subir fotos reales de las camisetas de Real Madrid
- [ ] Deploy en Netlify + variables de entorno

### 💡 Ideas próximas
- [ ] Cupones de descuento (tabla `coupons` + validación en `create_order`)
- [ ] Inventario por talla (stock)
- [ ] Reseñas de clientes
- [ ] Página "Guía de tallas"
- [ ] SEO: sitemap, JSON-LD de productos, prerender
- [ ] Notificación al admin por pedido nuevo (Edge Function → email/Telegram)
- [ ] Costo de personalización configurable
- [ ] Tests (Vitest + Testing Library) y CI en GitHub Actions

---

## 11. Bitácora de decisiones
| Fecha | Decisión | Por qué |
|---|---|---|
| 2026-10-12 | Vite + React SPA (no Next.js) | Simple de desplegar en Netlify, igual que la referencia; no requiere servidor |
| 2026-10-12 | Pedido = guardar en BD **y** abrir WhatsApp | Queda registro para el admin y la venta se cierra por chat, que es lo habitual en Colombia |
| 2026-10-12 | Optimizar imágenes en el navegador | Gratis (las transformaciones de Supabase son de pago), ahorra almacenamiento y ancho de banda |
| 2026-10-12 | Precio en COP como entero | Sin decimales en pesos; evita errores de redondeo |
| 2026-10-12 | Favoritos y carrito en `localStorage` | No exige cuenta al cliente |

---

## 12. Herramientas / skills usadas para construirlo
- **Claude Code**, con el MCP de Supabase conectado a la cuenta del proyecto: migraciones, seed, asesor de seguridad y pruebas RLS.
- Navegador integrado de Claude para revisar el diseño en escritorio y móvil.
- Para continuar con IA: abre el repo, pide *"lee CONTEXT.md"* y sigue con la sección 10.

> ⚠️ Nota de red: desde la red de la oficina, las conexiones a `*.supabase.co` a veces se interceptan (error de certificado / redirección). Si la tienda no carga datos en local, prueba con otra red o los datos del celular. En producción (Netlify) no aplica.
