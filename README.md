# Casa Olivo — catálogo digital (demostración comercial)

Versión estática publicada en Vercel. Muestra catálogo, fichas enriquecidas, selección de artículos, favoritos, panel de gestión ilustrativo y un Centro de Decisiones con cálculos y diagnósticos transparentes.

## Qué funciona en esta versión

- Galería con varias imágenes y descripción extendida, opciones, detalles y precio.
- Selección de productos y consulta por WhatsApp.
- **Configuración → WhatsApp:** teléfono, plantilla de consulta general, consulta de producto y consulta de pedido, con vista previa y variables.
- Validación del teléfono y placeholders antes de guardar.
- Gestión de productos, costos ilustrativos, inventario e información de promociones en el navegador.
- Diagnóstico de completitud de fichas y simulación de margen; las métricas son **locales**, nunca se presentan como ventas confirmadas.
- No requiere un servidor Node para servir archivos HTML/CSS/JS; Vercel despliega la rama `main`.

## Plantillas WhatsApp

Variables permitidas: `{tienda}`, `{producto}`, `{variante}`, `{cantidad}`, `{precio}`, `{subtotal}`, `{lista_productos}`.

Ejemplo de consulta por producto:

```text
Hola, me interesa {producto}, opción {variante}, cantidad {cantidad}. ¿Tienen disponible? Total de referencia: {subtotal}.
```

Las plantillas se guardan en `localStorage` de este navegador y NO se propagan a otros visitantes. Para activar una plantilla de un cliente real se necesita guardar la configuración en una base de datos central por organización y servirla desde una API pública que solo exponga los campos comerciales apropiados. No se debe afirmar que el comerciante puede gestionar el catálogo en vivo hasta que este backend esté conectado.

Un enlace `wa.me` prepara el mensaje en el dispositivo del comprador; **el comprador debe pulsar Enviar**. Esta aplicación no envía mensajes por sí sola ni confirma pedidos o ventas.

## Pruebas

```bash
node --test tests/whatsapp.test.cjs
```

El workflow `.github/workflows/catalog-checks.yml` ejecuta estas pruebas en pull requests y al actualizar `main`. Las pruebas de navegador, accesibilidad, imágenes, flujo de pedidos, permisos de backend y recuperación de datos deben realizarse antes de contratar usuarios reales.

## Seguridad y comercialización

**No apto aún como SaaS productivo:** `/admin` NO tiene autenticación; el catálogo NO tiene persistencia central ni separación multiempresa; las cuotas tampoco se aplican desde un servidor; los eventos de visitantes no llegan al panel del dueño. No introducir costos, clientes, contraseñas ni datos comerciales confidenciales aquí.

Para la fase SaaS usar autenticación de usuarios, organizaciones aisladas, controles RLS/servidor, cuotas y planes gestionados por operador, pagos y webhooks, almacenamiento y analítica central, copias de seguridad, pruebas de restauración y cumplimiento de privacidad. Ver [SAAS_SECURITY_ARCHITECTURE.md](./SAAS_SECURITY_ARCHITECTURE.md).

**Estado comercial honesto:** apto para presentaciones y validación de interés con prospectos; no apto todavía para incorporar negocios con una promesa de autogestión segura, analítica consolidada o pago recurrente.

## Enlaces

- Catálogo de muestra: `https://catalogo-olivos-v2.vercel.app/`
- Panel de demostración: `https://catalogo-olivos-v2.vercel.app/admin`

La tienda Casa Olivo, los productos y las fotografías son ilustrativos; sustituirlos por material autorizado y verificado antes de publicar un catálogo comercial real.
