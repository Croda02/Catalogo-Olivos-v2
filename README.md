# Casa Olivo — versión plana para GitHub + Vercel

Esta versión NO usa carpetas. Todos los archivos, incluidas las imágenes, van en la raíz del repositorio.

## Cómo subir a GitHub desde el navegador
1. Descomprime este ZIP en tu computadora.
2. En GitHub abre tu repositorio.
3. Pulsa **Add file → Upload files**.
4. Selecciona TODOS los archivos descomprimidos al mismo tiempo y súbelos.
5. Confirma el commit.

La raíz del repositorio debe verse así:

- index.html
- admin.html
- styles.css
- store.js
- app.js
- admin.js
- manifest.webmanifest
- sw.js
- vercel.json
- icon.svg
- hero.jpg
- mug.jpg
- candle.jpg
- candle-alt.jpg
- candle-large.jpg
- blanket.jpg
- diffuser.jpg
- tote.jpg
- stone.jpg
- desk.jpg

No debe existir una carpeta `assets`.

## Vercel
Importa el repositorio como proyecto estático. No requiere Build Command.

- Catálogo: `/`
- Panel: `/admin` (o `/admin.html`)

## Importante si ya habías desplegado la versión anterior
Esta edición usa una nueva clave de almacenamiento y una nueva caché para evitar que el navegador conserve rutas viejas `/assets/...`.
Aun así, después del nuevo deploy conviene hacer una recarga fuerte: Ctrl+F5.
