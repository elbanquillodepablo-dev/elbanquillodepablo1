# Revisión de seguridad — 2026-11-09

Revisión acotada del código, permisos y dependencias. No es una certificación ni una prueba de intrusión. No se enviaron correos ni se crearon datos de prueba en producción.

## Corregido

1. **Disponibilidad / permisos:** las políticas públicas llamaban is_admin sin permiso y rompían el catálogo. Ahora anon solo ve productos/categorías activos e imágenes asociadas; las funciones administrativas siguen restringidas. Migración 20261109181616_storefront_access_and_campaign.sql:1.
2. **Dependencias, moderado:** avisos de React Router y Vite corregidos con versiones 7.18.5 y 6.4.5; npm audit reporta cero vulnerabilidades conocidas. La actualización mayor de Router pasó compilación y navegación pública/login.
3. **Superficie antigua:** create_order ya no se usa en checkout; se retiró el cliente y su ejecución para anon/authenticated. Los pedidos históricos permanecen. Checkout usa reservas y tickets.
4. **Validación:** api/admin/staff.ts:39 valida tamaño y forma del JSON y tipos de correo/ID; src/pages/admin/LoginPage.tsx:13 limita la redirección interna; src/lib/imageOptimizer.ts:38 restringe formatos y tamaño de entrada.

## Comprobado

- Búsqueda de patrones de claves secretas Supabase, tokens GitHub, claves privadas y conexiones con contraseña en 90 archivos versionados; búsqueda de claves/tokens en 15 commits: sin coincidencias. Esto no descarta todos los tipos posibles de secreto ni revisa forks o historial remoto borrado.
- .env.local ignorado; solo .env.example versionado. La clave publicable del navegador es pública por diseño. SUPABASE_SECRET_KEY se usa exclusivamente en api/admin/staff.ts y nunca debe llevar prefijo VITE_. No se inspeccionó el valor privado en Vercel.
- Lecturas con rol anon: 3 productos activos, 4 categorías, 0 productos ocultos, 0 administradores y 0 tickets. Sin permiso para is_admin, confirm_cart_ticket ni create_order. deactivate_staff no es ejecutable por authenticated.
- La API valida el token con getUser y consulta rol admin activo antes de administrar personal. No confía en user_metadata.
- CSP, nosniff, bloqueo de frames y política de referentes están definidos en vercel.json. Falta confirmar encabezados de la versión final desplegada.

## Pendientes

5. **Moderado — abuso de reservas:** supabase/migrations/0003_inventory_carts_staff_promotions.sql:316 permite reservas invitadas con token aleatorio y límites por carrito, pero no verifica CAPTCHA ni limita por persona/IP. Un bot podría crear varios tokens y retener existencias. La solución requiere una barrera verificada en servidor antes de reservar y restringir el RPC directo; no basta con ocultar botones. No se simuló abuso contra producción.
6. **Moderado — contraseñas filtradas:** el asesor de Supabase informa protección desactivada. Activarla en Auth si el plan lo permite: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Elegir una contraseña nueva que no se haya compartido en el chat.
7. **Verificación pendiente:** guardar cambios con una sesión administrativa real, subir una foto real y completar una venta controlada. No se realizaron escrituras de prueba sobre productos/clientes reales.

Las advertencias del asesor sobre funciones SECURITY DEFINER públicas requieren revisión por función: las cinco RPC del carrito/precios/inventario son intencionales para compras sin cuenta; las RPC internas verifican rol. Las tablas privadas sin políticas bloquean lectura directa deliberadamente. Referencia: https://supabase.com/docs/guides/database/postgres/row-level-security .
