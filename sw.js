/* Public-offline cache only. Private/API/auth content MUST remain network-only. */
const CACHE='casa-olivo-public-v11';
const ASSETS=[
 '/', '/index.html','/styles.css','/premium.css','/detail-insights.css','/decision-center.css','/whatsapp-settings.css','/decision-engine.js','/decision-ui.js','/premium.js','/product-detail.js','/admin-insights.js','/store.js','/app.js','/admin.js','/whatsapp-messages.js','/whatsapp-settings.js','/manifest.webmanifest','/icon.svg',
 '/hero.jpg','/mug.jpg','/candle.jpg','/candle-alt.jpg','/candle-large.jpg','/blanket.jpg','/diffuser.jpg','/tote.jpg','/stone.jpg','/desk.jpg'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(/^\/(?:api|auth|operator|admin)(?:\/|\.|$)/.test(url.pathname))return;
 if(req.headers.has('authorization')||req.credentials==='include')return;
 const path=url.pathname;
 const publicAsset=ASSETS.includes(path);
 if(!publicAsset)return;
 event.respondWith(fetch(req).then(response=>{
  const policy=response.headers.get('cache-control')||'';
  if(response.ok&&response.type==='basic'&&!/private|no-store/i.test(policy)){
   const copy=response.clone();
   caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
  }
  return response;
 }).catch(()=>caches.match(req).then(cached=>cached||Response.error())));
});
