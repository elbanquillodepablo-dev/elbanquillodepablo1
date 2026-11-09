# PRD: carrito reservado, equipo y promociones

## Objetivo y decisiones confirmadas

Una persona puede consultar sin cuenta, reservar unidades por talla durante dos horas desde su último cambio, y pedir atención por WhatsApp mediante un ticket con código. No se cobra en línea ni se manda WhatsApp automáticamente.

- Inventario inicial: cero unidades por talla; el equipo carga las cantidades reales antes de vender.
- Una reserva vence dos horas después del último cambio y deja de descontar inventario automáticamente.
- El ticket conserva la reserva dos horas. Solo un administrador confirma la venta y descuenta las unidades definitivamente; cancelar o vencer libera la reserva.
- Checkout pide solo el nombre y autorización de tratamiento de datos; el usuario decide si envía el texto prellenado por WhatsApp.
- Promociones: descuento porcentual aplicado a productos seleccionados dentro de una fecha de inicio y cierre. No se acumulan; si hay más de una activa, se aplica el mayor descuento.
- El panel permite crear, editar, pausar y eliminar promociones/descuentos; no programa publicaciones de redes sociales.
- Administrador: gestiona productos, precios, fotos, existencias, promociones, ajustes y accesos del equipo. Operario: gestiona existencias, pedidos y tickets; no puede confirmar ventas ni cambiar precios.

## Recorrido

```mermaid
sequenceDiagram
    actor Cliente
    participant Tienda
    participant DB as Supabase
    participant Admin as Panel
    Cliente->>Tienda: Agrega talla y cantidad
    Tienda->>DB: Reserva unidades y guarda vencimiento
    Cliente->>Tienda: Escribe su nombre y crea ticket
    Tienda->>DB: Guarda productos, talla, precio y código
    Tienda-->>Cliente: Muestra texto listo para WhatsApp
    Admin->>DB: Revisa y confirma o cancela el ticket
    DB-->>Admin: Confirma venta y descuenta stock, o libera reserva
```

## Criterios de aceptación

1. La base calcula disponibilidad transaccionalmente y evita reservar una misma última unidad dos veces.
2. Cambiar una talla o cantidad reinicia las dos horas; vencimientos se aplican aunque el navegador esté cerrado.
3. El panel permite registrar unidades por talla y conserva historial con usuario y hora.
4. Cada ticket guarda nombre, líneas, talla, cantidad, precio cotizado, estado y expiración; el código es único.
5. WhatsApp abre un texto que el cliente envía manualmente. No se realiza pago ni envío automático.
6. Solo administrador confirma la venta; operario puede cancelar tickets y actualizar estados de pedidos.
7. Los descuentos muestran precio regular y precio promocional; el servidor cotiza el mismo valor que ve el cliente.
8. Roles se validan en base de datos/servidor. La clave privada requerida por la API de invitaciones nunca llega al navegador.

## Estado actual

- Código de estas funciones está publicado en `main` (commit `c6e0daa`). GitHub reportó el despliegue Vercel como completado.
- **Base de producción actualizada:** migraciones `20261109174615_inventory_carts_staff_promotions` y `20261109174813_restrict_staff_functions_and_index_foreign_keys` aplicadas al proyecto Supabase del negocio. Hay 15 variantes de talla creadas con inventario total en cero; faltan las cantidades reales.
- El usuario indica que agregó `SUPABASE_SECRET_KEY` en Vercel. No pudimos leer ni confirmar el valor desde la integración disponible, que está conectada a otra cuenta; no se intentó recuperar el secreto.
- La única base del proyecto sigue siendo Supabase `uymvinfxlwqzzwyditsv` (`us-west-2`); ya tiene productos y categorías, pero no cantidades reales por talla.
- Correo confirmado para el primer administrador: `elbanquillodepablo@gmail.com`; figura en `admin_emails`, pero aún no existe un usuario en `admins`. Invitar desde Supabase Auth; al aceptar, el trigger concede el rol inicial. No guardar contraseñas en el repositorio ni en documentación.
- Inicialmente los usuarios internos tienen dos roles: `admin` y `operario`. Cualquier admin activo puede invitar y desactivar ambos roles; la API evita desactivar al último admin activo.
- Promociones se activan según sus fechas; no hay integración para publicar contenido en redes sociales.

## Fuera de alcance

- Cuenta obligatoria para clientes, pagos en línea, automatización de WhatsApp o publicación en redes.
- Tarifas de personalización de camisetas; se siguen confirmando por WhatsApp como hoy.

## Horarios y refinamiento visual (2026-11-09)

El administrador puede configurar días y una franja diaria de atención en Ajustes. Durante la atención las reservas duran dos horas; fuera del horario configurado vencen dos horas después de la siguiente apertura. La regla está desactivada hasta que el administrador confirme el horario real. Las reservas existentes conservan su vencimiento hasta que se modifiquen. Horario visible opcional e independiente. Migración business_reservations aplicada.

Se refinó la legibilidad del logo, la tipografía del inicio, el ritmo de texto y el movimiento reducido. El pie incluye Creado por Zenubit. Compilación y detector Impeccable correctos; revisión visual en navegador pendiente.
