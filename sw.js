const CACHE='casa-olivo-flat-v4';
const ASSETS=[
  '/', '/index.html','/admin.html','/styles.css','/store.js','/app.js','/admin.js','/manifest.webmanifest','/icon.svg',
  '/hero.jpg','/mug.jpg','/candle.jpg','/candle-alt.jpg','/candle-large.jpg','/blanket.jpg','/diffuser.jpg','/tote.jpg','/stone.jpg','/desk.jpg'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(fetch(event.request).then(response=>{
    const copy=response.clone();
    caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
    return response;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match('/index.html'))));
});
