# Casa Olivo · Catálogo digital independiente

Producto de demostración comercial de **un solo negocio**, desplegado sobre el repositorio original. No hay planes, suscripciones, registros obligatorios, administración multiempresa ni facturación SaaS.

**Abrir:** [Catálogo público](https://catalogo-olivos-v2.vercel.app/) · [Panel del negocio](https://catalogo-olivos-v2.vercel.app/admin)

## Qué permite hacer

### Comprador
- Explorar productos por categoría, texto, orden y promociones.
- Ver fotografías, galería, descripción extensa, ficha técnica, variantes y disponibilidad.
- Guardar favoritos **sin registrarse** y armar una selección con cantidades. Se guardan localmente en el navegador del comprador, no se sincronizan entre dispositivos.
- Preparar una consulta o pedido en WhatsApp con artículos, variantes, cantidades y subtotal; el comprador debe pulsar **Enviar**. La aplicación no cobra ni confirma pedidos.
- Usar el catálogo en móvil y escritorio.

### Propietario
- Ingresar al panel privado mediante correo con enlace de un solo uso y sesión de Supabase Auth.
- Agregar, editar, ocultar, destacar o eliminar productos; configurar precios y variantes.
- Subir fotografías JPG/PNG/WebP/AVIF al almacenamiento compartido (máx. 5 MB por archivo) y administrar galería hasta ocho imágenes por ficha.
- Administrar promociones, mensajes de WhatsApp y datos de contacto, color de marca e Instagram.
- Personalizar título, descripción y fotografías de portada, cargar un logotipo y agregar, renombrar o eliminar categorías (sin eliminar categorías con productos asignados).
- Registrar costo unitario y existencias **solo visibles al propietario** para diagnóstico comercial.
- Consultar interacciones anónimas del catálogo en todos los dispositivos: visitas, fichas vistas, búsqueda, selección y clics a WhatsApp. Una interacción **no equivale a una venta**.

## Instalación actual

- **GitHub:** repositorio `Croda02/Catalogo-Olivos-v2`, rama `main`.
- **Vercel:** proyecto `catalogo-olivos-v2`; publica al actualizar la rama.
- **Supabase:** proyecto `eastlkfmoorylghapieq`, una única tienda `casa-olivo`.
- **Persistencia:** tablas `catalog_published` (datos visibles), `catalog_private` (costos, inventario y metas), `catalog_owners` (lista de correos autorizados) y `catalog_events` (analítica anónima).
- **Imágenes subidas:** bucket público `catalog-media`, pero solo propietario puede subir o borrar. Los ejemplos del repositorio son imágenes ilustrativas.
- **Seguridad:** todas las tablas del catálogo tienen RLS. Los visitantes solo leen los datos publicados y agregan eventos anónimos permitidos; no tienen acceso a costos, existencias ni correos autorizados. Ninguna clave de servicio está embebida en el sitio.

La clave `sb_publishable_` del cliente es pública por diseño. La protección de los datos corresponde a autenticación y políticas RLS.

## Primer acceso al panel

1. Abre **[Panel del negocio](https://catalogo-olivos-v2.vercel.app/admin)**.
2. Selecciona **Enviar enlace de acceso**. El correo autorizado para esta instalación es `contacto@jcroda.com.mx`.
3. Abre el enlace que llegue a ese buzón. Supabase autentica la sesión; la base de datos valida que el correo esté en la lista de propietarios.
4. Si el correo se abre en una página distinta al panel, copia la **dirección del enlace recibido**, despliega «¿El enlace del correo no te devuelve aquí?» y pégala para completar la verificación sin salir del catálogo.
5. En **Productos**, modifica una ficha y guarda. Comprueba la publicación desde un navegador o teléfono diferente.

**Configuración opcional recomendada:** En Supabase → Authentication → URL Configuration, establece `https://catalogo-olivos-v2.vercel.app` como Site URL y agrega la redirección `https://catalogo-olivos-v2.vercel.app/**`. De este modo el correo podrá volver directamente al panel. El proveedor de correo predeterminado de Supabase tiene restricciones de envío; para uso comercial continuo conviene configurar SMTP propio. No se han verificado todavía la recepción del primer correo ni un inicio de sesión real del propietario.

## Verificar antes de presentarlo a un cliente

- Confirmar que el correo de acceso llega y el panel puede guardar/leer cambios desde dos dispositivos.
- Sustituir fotografías, descripciones, precios, promociones y el número de WhatsApp de ejemplo por los datos autorizados del negocio.
- Probar en móvil la selección de productos, favoritos, enlace de WhatsApp y disponibilidad.
- No introducir información de compradores: esta versión no gestiona pagos, cuentas de clientes, ventas confirmadas ni seguimiento de pedidos fuera de WhatsApp.
- Se muestran resultados de comportamiento medidos, nunca facturación inventada. Sin consentimiento de seguimiento, políticas de privacidad adecuadas y análisis del tráfico no se deben hacer promesas de precisión absoluta de las métricas.

## Pruebas automatizadas

```bash
node --test tests/*.test.cjs
```

GitHub Actions ejecuta pruebas de WhatsApp, separación de campos privados, propietario autorizado y tipos de eventos. El despliegue Vercel se comprueba aparte.

## Notas de mantenimiento

La carpeta y el documento `SAAS_SECURITY_ARCHITECTURE.md` son antecedentes de una idea multiempresa anterior y **no representan este alcance comercial**. La versión actual pertenece a un solo establecimiento. Para replicarla a otra empresa se debe configurar otro proyecto o un aislamiento seguro, reautorizar al nuevo propietario y reemplazar todos los datos del negocio. No reutilices el correo del propietario actual en instalaciones ajenas.

**Estado:** backend y despliegue configurados; falta la verificación manual del correo autorizado, un recorrido completo en navegador y la personalización final de datos comerciales antes de afirmar que puede entregarse a un cliente real.
