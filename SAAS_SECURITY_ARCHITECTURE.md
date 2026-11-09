# Arquitectura objetivo: catálogo multiempresa y panel del operador

**Estado:** diseño de seguridad para la siguiente fase; **NO implementado** en la demo estática. El catálogo actual usa `localStorage` y la ruta `/admin` no proporciona autenticación: nunca almacenar datos empresariales confidenciales o usuarios reales allí. Este documento no implica cumplimiento ni certificación de seguridad.

## Separación de responsabilidades

Tres interfaces, servidas desde el mismo producto si existe control de acceso server-side:

1. **Catálogo público** `/t/{slug}`: productos publicados de un comercio, imágenes públicas optimizadas y enlace para consultar/pedir. Nunca incluir costo unitario, información de clientes, configuraciones de cuotas ni datos internos en su API.
2. **Comercio** `/app`: usuarios autorizados de una organización administran productos, costos, existencias, promociones y resumen comercial de **su propia organización**. Pueden ver el nombre del plan comercial en facturación si se decide, pero **no** modificar cuota o condiciones. El formulario de Productos es el único lugar que modifica precio, costo y existencias.
3. **Operador** `/operator`: acceso de personal interno autorizado para clientes, licencias, paquetes, límites, salud del servicio, cobros y auditoría. No debe ser una ruta estática con un `isAdmin` en JS. Debe requerir autorización real de backend en cada operación.

## Modelo de datos mínimo

- `users`: identificadores del proveedor de identidad, estado de autenticación. No almacenar contraseñas propias.
- `organizations`: id UUID, slug único, nombre público, status, created_at, billing_contact.
- `organization_members`: (organization_id, user_id, role: owner|manager|staff), con una relación de membresía única.
- `plans`: id interno, nombre, productos máximos, almacenamiento máximo, tiendas/sucursales máximas, funciones habilitadas, precio, moneda, versión; solo el operador modifica esta tabla.
- `subscriptions`: organization_id, plan_id, status, current_period_end, provider_customer_id, provider_subscription_id, external_price_id. Un cobro fallido no debe borrar contenido.
- `entitlements`: overrides internos opcionales (organization_id, feature, limit, expires_at, reason), con registro de autor.
- `products`: id, organization_id obligatorio, datos públicos (nombre, precio, estado) y privados (costo, stock), created_by, updated_at, version.
- `product_images`: organization_id, product_id, object_key, position, visibility. El prefijo del objeto incluye el ID de tenant; el servidor autoriza subidas y controla el MIME/tamaño.
- `analytics_events`: organization_id, event_type, occurred_at, anonymous_session_id, product_id opcional, source, deduplication_key; retención limitada y consentimiento/privacidad según aplique.
- `orders`: pedido iniciado y su estado; los ingresos reales requieren confirmación explícita y registro de cobro. Un clic a WhatsApp no es una venta.
- `operator_audit_log`: actor, acción, tenant afectado, datos mínimos anteriores/posteriores, timestamp; append-only.

## Autorización imprescindible

- Cada lectura/escritura privada usa sesión autenticada verificada en servidor.
- Las consultas de empresa comprueban membresía activa y `organization_id` desde el contexto autorizado, **nunca** confían en un `tenantId` escrito por el cliente.
- Row Level Security (RLS) como defensa en profundidad en PostgreSQL; políticas explícitas por tabla y pruebas cross-tenant. La identidad del operador requiere privilegio separado, nunca un campo de `localStorage` ni un parámetro `role=admin`.
- Ninguna clave de servicio, secreto de cobro ni token privilegiado se expone en JavaScript público. Secretos solo en entorno de servidor con acceso mínimo.
- Operador: autenticación multifactor, reautenticación para cambios financieros, lista de autorizados, auditoría y acceso mínimo por función.
- Roles del comercio: propietario (gestiona equipo), manager (catálogo/ventas) y staff (acceso reducido). Negar por defecto toda acción no autorizada.
- La capa de API y la base de datos rechazan editar planes, suscripciones, cuotas y `organization_id` desde sesiones de comercio, incluso si se manipula HTTP.

## Cuotas y licenciamiento

El frontend **solo muestra estados y mensajes útiles**; la validación de recursos se realiza de forma atómica en servidor.

Flujo al crear un producto:
1. Verificar sesión y membresía del comercio.
2. Resolver en backend la suscripción vigente y el límite efectivo (plan + override autorizado).
3. Dentro de una transacción, bloquear la fila del tenant (`SELECT ... FOR UPDATE`) o usar un contador atómico y comprobar el número total de productos **incluidos inactivos si cuentan para el plan**.
4. Rechazar con HTTP 403/409 y código estandarizado `PLAN_PRODUCT_LIMIT` si excede. La API no acepta `catalogLimit` del comercio.
5. Crear con `organization_id` derivado del contexto autenticado, registrar evento de auditoría y finalizar transacción.

Definir por producto: activo/inactivo, archivado, borrado, y si cada estado consume cuota; impedir eludir el límite con cambios de estado o peticiones concurrentes.

Cuotas de archivos: validar antes y después de subir, controlar tamaño agregado y MIME real, limpieza de huérfanos y cuotas atómicas; imágenes con URL firmada de duración limitada si no son públicas.

## Pagos

Integrar un procesador compatible con México y el caso de uso. La fuente de verdad para facturación es el servidor y el estado validado mediante eventos autenticados del proveedor. El webhook debe verificar firma, tolerar reintentos, ser idempotente y procesar eventos fuera de orden.

Estados recomendados: trialing, active, past_due, canceled, suspended. Aplicar periodos de gracia y avisos antes de restricciones. El operador puede reasignar planes con motivo y auditoría, pero no editar el precio de una transacción pagada.

## Seguridad operativa y mantenimiento

- Validar inputs y schemas en servidor; límite de tamaño, paginación, filtrado seguro, escape HTML y CSP.
- Límite de solicitudes por IP, usuario y organización para login, escrituras y enlaces públicos.
- Copias de seguridad automáticas cifradas, prueba periódica de restauración y política de retención.
- Logs con IDs de correlación y sin tokens ni datos personales innecesarios.
- Migraciones versionadas, entorno staging, rollback y pruebas automáticas de aislamiento.
- No guardar paneles privados en caché pública ni en service worker; usar `Cache-Control: private, no-store` para respuestas sensibles.
- Política de privacidad, minimización de datos, consentimiento donde corresponda y procedimientos para atender solicitudes sobre datos personales según normativa aplicable.

## Panel de operador propuesto

Pantallas: **Visión general** (negocios activos, prueba, cobros vencidos, fallos), **Negocios** (cada tenant con plan, cuota, dominio, vigencia, actividad y soporte), **Planes** (límites, funciones, precios y versiones), **Facturación** (suscripciones/eventos del procesador), **Operación** (errores, uso de almacenamiento, despliegues y backups), **Auditoría** (cambios de plan, acceso del personal y soporte).

Evitar acceso directo a costo/preferencias de un comercio por defecto. Si soporte necesita inspeccionar datos, exigir justificación, duración acotada y registro de auditoría.

## Criterios para poder vender como SaaS

1. Dos negocios con productos de nombres similares no pueden leer, modificar, borrar ni contar cuota del otro mediante API directa o URLs manipuladas.
2. Simular 10 solicitudes simultáneas de alta cuando queda un solo espacio: **solo una** puede completarse.
3. Comercio y usuario anónimo reciben 403 en cualquier endpoint de operador, aun forzando headers o roles.
4. Cambios de cuota solo por cuenta operador autorizada; nunca desde la consola del navegador.
5. Webhook duplicado o desordenado no duplica cobros ni cambia planes incorrectamente.
6. Fallo de conexión o interrupción durante un cambio no produce un producto parcial ni corrompe el contador.
7. Restaurar backup verificado en entorno de ensayo; pruebas E2E móvil/escritorio y WCAG básico antes de activar cobros.
8. Analítica del negocio combina exclusivamente eventos válidos de su tenant y distingue clics/intenciones de pedidos y ventas confirmadas.

**Decisión técnica:** no construir ni publicar un «panel operador» simulado que parezca seguro. Primero autenticación y base de datos multi-tenant, luego la interfaz y la conexión de cobros.
