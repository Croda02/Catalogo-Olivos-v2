const S = window.CasaStore;
let state = S.load();
let currentCategory = 'Todos';
let currentFilter = 'all';
let currentSearch = '';
let currentSort = 'featured';
let activeProduct = null;
let selectedVariant = '';
let selectedQty = 1;
let activeSince = Date.now();

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = str => String(str ?? '').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
const productById = id => state.products.find(p=>p.id===id);
const activeProducts = () => state.products.filter(p=>p.active);
const account = () => state.accounts.find(a=>a.id===state.currentAccount);
const favorites = () => state.currentAccount ? (state.favorites[state.currentAccount]||[]) : (state.guestFavorites||[]);

function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),2200); }
function sync(){ state=S.load(); renderHeader(); renderCategories(); renderPromos(); renderProducts(); }

function renderHeader(){
  $('#brandName').textContent=state.business.name;
  $('#brandTagline').textContent=state.business.tagline;
  const a=account(); $('#accountLabel').textContent=a?`Hola, ${a.name.split(' ')[0]}`:'Mi cuenta';
  $('#favCount').textContent=favorites().length;
  $('#selectionCount').textContent=state.selection.reduce((n,i)=>n+i.qty,0);
  window.dispatchEvent(new CustomEvent('casaolivo:cartchange'));
  const total=state.selection.reduce((n,i)=>n+(Number(i.qty)||0),0);
  const mobile=$('#mobileCartCount'); if(mobile) mobile.textContent=total;
}

function renderCategories(){
  const all=['Todos',...state.categories];
  $('#categoryNav').innerHTML=all.map(c=>`<button class="${c===currentCategory?'active':''}" data-category="${esc(c)}">${esc(c)}</button>`).join('');
  const icons={'Decoración':'✦','Textiles':'⌁','Aromas':'♨','Cocina y mesa':'◡','Accesorios':'◇','Regalos':'🎁'};
  $('#categoryCircles').innerHTML=state.categories.map(c=>`<button class="cat-circle ${c===currentCategory?'active':''}" data-category="${esc(c)}"><span class="cat-icon">${icons[c]||'✧'}</span><span>${esc(c)}</span></button>`).join('');
  $$('[data-category]').forEach(b=>b.onclick=()=>{currentCategory=b.dataset.category; currentSearch=''; $('#searchInput').value=''; renderCategories(); renderProducts(); document.querySelector('#products').scrollIntoView({behavior:'smooth',block:'start'});});
}

function renderPromos(){
  const today=new Date().toISOString().slice(0,10);
  const promos=state.promotions.filter(p=>p.active&&(!p.start||p.start<=today)&&(!p.end||p.end>=today)).slice(0,2);
  if(!promos.length){$('#promoStrip').innerHTML=''; return;}
  $('#promoStrip').innerHTML=promos.map((p,i)=>`<article class="promo-card ${i?'secondary':''}"><div><small>${esc(p.badge||'PROMOCIÓN')}</small><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><button class="btn ${i?'btn-outline':'btn-soft'}" data-promo="${p.id}">Ver productos →</button></div></article>`).join('');
  $$('[data-promo]').forEach(btn=>btn.onclick=()=>{
    const p=state.promotions.find(x=>x.id===btn.dataset.promo); if(!p)return;
    currentCategory='Todos'; currentFilter='all'; currentSearch='';
    renderProducts(p.productIds); document.querySelector('#products').scrollIntoView({behavior:'smooth'});
    S.record('promotion_view',{promotionId:p.id});
  });
}

function renderProducts(onlyIds=null){
  let list=activeProducts().filter(p=>p.availability!=='Oculto');
  if(onlyIds) list=list.filter(p=>onlyIds.includes(p.id));
  if(currentCategory!=='Todos') list=list.filter(p=>p.category===currentCategory);
  if(currentFilter==='featured') list=list.filter(p=>p.featured);
  if(currentFilter==='sale') list=list.filter(p=>p.salePrice);
  if(currentSearch){
    const q=currentSearch.toLowerCase();
    list=list.filter(p=>[p.name,p.category,p.description,...(p.tags||[])].join(' ').toLowerCase().includes(q));
  }
  if(currentSort==='price-asc') list.sort((a,b)=>(a.salePrice||a.price)-(b.salePrice||b.price));
  if(currentSort==='price-desc') list.sort((a,b)=>(b.salePrice||b.price)-(a.salePrice||a.price));
  if(currentSort==='name') list.sort((a,b)=>a.name.localeCompare(b.name));
  if(currentSort==='featured') list.sort((a,b)=>(b.featured-a.featured)||(b.bestSeller-a.bestSeller));
  $('#productsTitle').textContent = currentSearch ? `Resultados para “${currentSearch}”` : currentCategory!=='Todos' ? currentCategory : currentFilter==='sale'?'Ofertas':currentFilter==='featured'?'Productos destacados':'Todos los productos';
  $('#productGrid').innerHTML=list.map(cardHTML).join('');
  $('#emptyProducts').classList.toggle('hidden',!!list.length);
  wireProductCards();
}

function cardHTML(p){
  const fav=favorites().includes(p.id);
  const badge=p.salePrice?'<span class="tag-badge sale">Oferta</span>':p.isNew?'<span class="tag-badge">Nuevo</span>':p.bestSeller?'<span class="tag-badge">Favorito</span>':'';
  return `<article class="product-card" data-product-card="${p.id}">
    <div class="product-img-wrap">${badge}<button class="favorite-heart ${fav?'active':''}" data-fav="${p.id}" aria-label="${fav?'Quitar de favoritos':'Guardar favorito'}">${fav?'♥':'♡'}</button><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></div>
    <div class="product-body"><small>${esc(p.category)}</small><h3>${esc(p.name)}</h3>
      <div class="price-line"><span class="price ${p.salePrice?'sale':''}">${S.money(p.salePrice||p.price)}</span>${p.salePrice?`<span class="old-price">${S.money(p.price)}</span>`:''}</div>
      <span class="availability" data-state="${esc(p.availability)}">${esc(p.availability)}</span>
      <div class="product-actions"><button class="add-selection" data-add="${p.id}" ${p.availability==='Agotado'?'disabled':''}>${p.availability==='Agotado'?'Agotado':'Agregar al pedido'}</button><button class="quick-view" data-view="${p.id}" aria-label="Ver detalles de ${esc(p.name)}">↗</button></div>
    </div></article>`;
}

function wireProductCards(){
  $$('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation(); S.toggleFavorite(b.dataset.fav); state=S.load(); renderHeader(); renderProducts(); toast(favorites().includes(b.dataset.fav)?'Guardado en favoritos':'Quitado de favoritos');});
  $('[data-add]').forEach(b=>b.onclick=e=>{e.stopPropagation(); const p=productById(b.dataset.add); if(!p||p.availability==='Agotado')return; if((p.variants||[]).length>1){openProduct(p.id);return;} S.addSelection(p.id,1,p.variants?.[0]||''); state=S.load(); renderHeader(); toast(`${p.name} agregado a tu pedido`);});
  $$('[data-view]').forEach(b=>b.onclick=()=>openProduct(b.dataset.view));
  $$('[data-product-card]').forEach(c=>c.ondblclick=()=>openProduct(c.dataset.productCard));
}

function openProduct(id){
  state=S.load(); const p=productById(id); if(!p)return; activeProduct=p; selectedVariant=p.variants?.[0]||''; selectedQty=1; S.record('product_view',{productId:p.id});
  const fav=favorites().includes(p.id);
  $('#modalRoot').innerHTML=`<div class="overlay" id="modalOverlay"><div class="modal"><button class="modal-close" id="closeModal">✕</button>
    <div class="product-modal-grid"><div class="product-modal-media"><img src="${esc(p.id==='vela-serenidad'?'/candle-large.jpg':p.image)}" alt="${esc(p.name)}"></div>
    <div class="product-modal-info"><span class="eyebrow">${esc(p.category)}</span><h2>${esc(p.name)}</h2>
    <p>${esc(p.description)}</p><div class="detail-pills"><span>✓ ${esc(p.availability)}</span><span>✓ Consulta por WhatsApp</span>${p.isNew?'<span>Nuevo</span>':''}</div>
    <div class="price-line"><span class="price ${p.salePrice?'sale':''}" style="font-size:1.7rem">${S.money(p.salePrice||p.price)}</span>${p.salePrice?`<span class="old-price">${S.money(p.price)}</span>`:''}</div>
    ${(p.variants||[]).length?`<strong style="font-size:.78rem">Opciones</strong><div class="variant-row">${p.variants.map((v,i)=>`<button class="variant-btn ${i===0?'active':''}" data-variant="${esc(v)}">${esc(v)}</button>`).join('')}</div>`:''}
    <div class="quantity-row"><strong>Cantidad</strong><div class="stepper"><button id="minusQty">−</button><span id="qtyValue">1</span><button id="plusQty">+</button></div></div>
    <div class="product-modal-actions"><button class="btn btn-dark" id="modalAdd" ${p.availability==='Agotado'?'disabled':''}>Agregar al pedido</button><button class="btn wa-btn" id="modalWa">◉ Pedir por WhatsApp</button><button class="btn btn-outline" id="modalFav">${fav?'♥ Quitar de favoritos':'♡ Guardar en favoritos'}</button></div>
    </div></div></div></div>`;
  $('#closeModal').onclick=closeModal; $('#modalOverlay').onclick=e=>{if(e.target.id==='modalOverlay')closeModal();};
  $$('[data-variant]').forEach((b,i)=>b.onclick=()=>{selectedVariant=b.dataset.variant; $$('[data-variant]').forEach(x=>x.classList.remove('active'));b.classList.add('active');});
  $('#minusQty').onclick=()=>{$('#qtyValue').textContent=selectedQty=Math.max(1,selectedQty-1)}; $('#plusQty').onclick=()=>{$('#qtyValue').textContent=++selectedQty};
  $('#modalAdd').onclick=()=>{if(p.availability==='Agotado')return;S.addSelection(p.id,selectedQty,selectedVariant);state=S.load();renderHeader();toast('Agregado a tu pedido');closeModal();openDrawer('selection');};
  $('#modalFav').onclick=()=>{S.toggleFavorite(p.id);state=S.load();renderHeader();closeModal();openProduct(p.id)};
  $('#modalWa').onclick=()=>sendWhatsApp([{productId:p.id,qty:selectedQty,variant:selectedVariant}],p.id);
}
function closeModal(){ $('#modalRoot').innerHTML=''; activeProduct=null; }

function openDrawer(type){
  state=S.load(); let body='';
  if(type==='selection'){
    const items=state.selection.map(i=>({...i,product:productById(i.productId)})).filter(i=>i.product);
    body=`<div class="drawer-backdrop" id="drawerBackdrop"></div><aside class="drawer"><div class="drawer-head"><h2>Revisa tu pedido</h2><button id="drawerClose">✕</button></div>
      ${items.length?items.map(i=>`<div class="drawer-item"><img src="${i.product.image}"><div><h4>${esc(i.product.name)}</h4><small>${esc(i.variant||'Sin variante')}</small><div class="cart-stepper"><button data-qty-minus="${esc(i.productId)}" data-variant="${esc(i.variant)}" aria-label="Quitar una unidad">−</button><strong>${i.qty}</strong><button data-qty-plus="${esc(i.productId)}" data-variant="${esc(i.variant)}" aria-label="Agregar una unidad">+</button></div><div class="price-line"><span class="price">${S.money((i.product.salePrice||i.product.price)*i.qty)}</span></div></div><button class="mini-btn" data-remove-select="${i.productId}" data-variant="${esc(i.variant)}">Quitar</button></div>`).join(''):'<div class="empty-state"><h3>Tu pedido está vacío</h3><p>Explora los productos y añade los que más te gusten.</p></div>'}
      ${items.length?`<div class="drawer-total"><span>Subtotal estimado</span><span>${S.money(items.reduce((n,i)=>n+(i.product.salePrice||i.product.price)*i.qty,0))}</span></div><div class="drawer-actions"><p class="checkout-note">El negocio confirmará existencias, envío y total final antes de cobrarte.</p><button class="btn btn-dark" id="sendSelection">Continuar a WhatsApp →</button><button class="btn btn-outline" id="clearSelection">Vaciar pedido</button></div>`:''}
      </aside>`;
  }
  if(type==='favorites'){
    const items=favorites().map(productById).filter(Boolean);
    body=`<div class="drawer-backdrop" id="drawerBackdrop"></div><aside class="drawer"><div class="drawer-head"><h2>Favoritos</h2><button id="drawerClose">✕</button></div>
      ${items.length?items.map(p=>`<div class="drawer-item"><img src="${p.image}"><div><h4>${esc(p.name)}</h4><small>${esc(p.category)}</small><div class="price-line"><span class="price">${S.money(p.salePrice||p.price)}</span></div></div><button class="mini-btn" data-view-fav="${p.id}">Ver</button></div>`).join(''):'<div class="empty-state"><h3>Aún no guardas favoritos</h3><p>Toca el corazón de un producto para guardarlo aquí.</p></div>'}
      </aside>`;
  }
  if(type==='account'){
    const a=account();
    body=`<div class="drawer-backdrop" id="drawerBackdrop"></div><aside class="drawer"><div class="drawer-head"><h2>Mi cuenta</h2><button id="drawerClose">✕</button></div>
      ${a?`<div class="account-card"><span class="eyebrow">Cuenta activa</span><h3 style="font-family:'Playfair Display';font-size:1.6rem;margin:8px 0 3px">Hola, ${esc(a.name)}</h3><p style="color:var(--muted);margin:0">${esc(a.email)}</p></div><p>Con tu cuenta puedes conservar favoritos y preparar tu selección en este dispositivo.</p><div class="drawer-actions"><button class="btn btn-soft" id="accountFavorites">Ver mis favoritos</button><button class="btn btn-outline" id="logoutBtn">Cerrar sesión</button></div>`:`<div class="account-card"><strong>Cuenta de cliente</strong><p style="margin-bottom:0;color:var(--muted)">En esta demo no pedimos contraseña. En producción se conecta con un acceso seguro.</p></div><form class="account-form" id="accountForm"><div class="field"><label>Nombre</label><input name="name" required placeholder="Tu nombre"></div><div class="field"><label>Correo</label><input name="email" type="email" required placeholder="correo@ejemplo.com"></div><button class="btn btn-dark">Crear / entrar a mi cuenta</button></form>`}
      </aside>`;
  }
  $('#drawerRoot').innerHTML=body;
  $('#drawerClose').onclick=closeDrawer; $('#drawerBackdrop').onclick=closeDrawer;
  $$('[data-remove-select]').forEach(b=>b.onclick=()=>{const items=state.selection.filter(x=>!(x.productId===b.dataset.removeSelect&&x.variant===b.dataset.variant));S.setSelection(items);state=S.load();renderHeader();openDrawer('selection');});
  $$('[data-view-fav]').forEach(b=>b.onclick=()=>{closeDrawer();openProduct(b.dataset.viewFav)});
  $('[data-qty-minus],[data-qty-plus]').forEach(b=>b.onclick=()=>{const items=S.load().selection;const i=items.find(x=>x.productId===b.dataset.qtyMinus||x.productId===b.dataset.qtyPlus ? x.productId===(b.dataset.qtyMinus||b.dataset.qtyPlus)&&x.variant===b.dataset.variant:false);if(!i)return;i.qty+=b.hasAttribute('data-qty-plus')?1:-1;S.setSelection(items.filter(x=>x.qty>0));state=S.load();renderHeader();openDrawer('selection');});
  $('#sendSelection') && ($('#sendSelection').onclick=()=>sendWhatsApp(state.selection));
  $('#clearSelection') && ($('#clearSelection').onclick=()=>{S.setSelection([]);state=S.load();renderHeader();openDrawer('selection');});
  $('#accountForm') && ($('#accountForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);S.createAccount(fd.get('name'),fd.get('email'));state=S.load();renderHeader();openDrawer('account');toast('Cuenta creada en esta demo');});
  $('#logoutBtn') && ($('#logoutBtn').onclick=()=>{S.logout();state=S.load();renderHeader();openDrawer('account');toast('Sesión cerrada');});
  $('#accountFavorites') && ($('#accountFavorites').onclick=()=>openDrawer('favorites'));
}
function closeDrawer(){ $('#drawerRoot').innerHTML=''; }

function sendWhatsApp(items,productId=null){
  state=S.load();
  if(!items?.length && productId){items=[{productId,qty:1,variant:''}]}
  const lines=(items||[]).filter(i=>productById(i.productId)?.availability!=='Agotado').map(i=>{const p=productById(i.productId);return p?`• ${p.name}${i.variant?` — ${i.variant}`:''} · Cant. ${i.qty||1} · ${S.money((p.salePrice||p.price)*(i.qty||1))}`:''}).filter(Boolean);
  if(!lines.length){openDrawer('selection');toast('Agrega productos disponibles para continuar');return;}
  const subtotal=(items||[]).reduce((n,i)=>{const p=productById(i.productId);return n+(p&&p.availability!=='Agotado'?(p.salePrice||p.price)*(i.qty||1):0)},0);
  const text=`Hola, quiero solicitar este pedido de ${state.business.name}:\n\n${lines.join('\n')}\n\nSubtotal estimado: ${S.money(subtotal)}\n\n¿Me confirman disponibilidad, entrega y total final?`;
  (items||[]).forEach(i=>S.record('whatsapp_click',{productId:i.productId}));
  let phone=String(state.business.whatsapp||'').replace(/\D/g,'');
  if(phone.length===10)phone='52'+phone;
  if(phone.length<11){toast('El negocio debe configurar un número de WhatsApp válido');return;}
  S.record('order_intent',{items:lines.length,subtotal});
  const url=`https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url,'_blank','noopener');
}

function bindGlobal(){
  $('#searchInput').addEventListener('input',e=>{currentSearch=e.target.value.trim(); currentCategory='Todos'; renderCategories(); renderProducts(); clearTimeout(window.__searchTimer); window.__searchTimer=setTimeout(()=>{if(currentSearch)S.record('search',{query:currentSearch})},600);});
  $('#sortSelect').onchange=e=>{currentSort=e.target.value;renderProducts()};
  $$('[data-filter]').forEach(b=>b.onclick=()=>{$$('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentFilter=b.dataset.filter;renderProducts();});
  $('#clearFiltersBtn').onclick=()=>{currentCategory='Todos';currentSearch='';currentFilter='all';$('#searchInput').value='';$$('[data-filter]').forEach(x=>x.classList.toggle('active',x.dataset.filter==='all'));renderCategories();renderProducts();};
  $('#accountBtn').onclick=()=>openDrawer('account'); $('#favoritesBtn').onclick=()=>openDrawer('favorites'); $('#selectionBtn').onclick=()=>openDrawer('selection');
  $('#headerWhatsApp').onclick=()=>state.selection.length?openDrawer('selection'):$('#products').scrollIntoView({behavior:'smooth'});
  $('#mobileFavBtn').onclick=()=>openDrawer('favorites'); $('#mobileSelectionBtn').onclick=()=>openDrawer('selection'); $('#mobileWhatsappBtn').onclick=()=>state.selection.length?openDrawer('selection'):$('#products').scrollIntoView({behavior:'smooth'});
  $('[data-scroll-top]').onclick=()=>scrollTo({top:0,behavior:'smooth'}); $('[data-open-categories]').onclick=()=>$('#categoryCircles').scrollIntoView({behavior:'smooth'}); $$('[data-scroll-products]').forEach(b=>b.onclick=()=>$('#products').scrollIntoView({behavior:'smooth'}));
  $('#mobileMenuBtn').onclick=()=>$('#categoryNav').scrollIntoView({behavior:'smooth'});
}

function trackActive(){
  const flush=()=>{ if(document.visibilityState==='visible' && activeSince){ const sec=Math.round((Date.now()-activeSince)/1000); if(sec>2) S.record('active_seconds',{seconds:sec}); activeSince=Date.now(); } };
  setInterval(flush,30000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){flush();activeSince=0}else activeSince=Date.now()});
  window.addEventListener('pagehide',flush);
}

if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js').catch(()=>{});}
S.record('catalog_open');
renderHeader();renderCategories();renderPromos();renderProducts();bindGlobal();trackActive();
S.channel && (S.channel.onmessage=()=>sync());
window.addEventListener('storage',e=>{if(e.key===S.KEY)sync()});
