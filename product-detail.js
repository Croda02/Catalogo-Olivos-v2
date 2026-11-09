/* Ficha de producto Casa Olivo — catálogo demostrativo con galería y detalles editables */
(function(){
 const $=s=>document.querySelector(s);
 const esc=str=>String(str??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
 const safeImage=url=>typeof url==='string'&&(/^(\/[^/]|https:\/\/)/).test(url)?url:'/mug.jpg';
 openProduct=function(id){
   state=S.load();
   const p=productById(id);if(!p)return;
   activeProduct=p; selectedVariant=(p.variants||[])[0]||''; selectedQty=1;
   S.record('product_view',{productId:p.id});
   const photos=[...new Set([p.image,...(p.gallery||[])].filter(Boolean))].slice(0,8).map(safeImage);
   const features=Array.isArray(p.features)?p.features:[];
   const specs=p.specs&&typeof p.specs==='object'&&!Array.isArray(p.specs)?Object.entries(p.specs):[];
   const related=state.products.filter(x=>x.active&&x.id!==p.id&&x.category===p.category&&x.availability!=='Oculto').slice(0,3);
   const old=p.salePrice&&p.salePrice<p.price;
   $('#modalRoot').innerHTML=`<div class="overlay detail-overlay" id="modalOverlay"><section class="modal product-detail" role="dialog" aria-modal="true" aria-labelledby="detailTitle">
      <button class="modal-close" id="closeModal" aria-label="Cerrar ficha de producto">✕</button>
      <div class="detail-layout">
        <div class="detail-gallery">
          <div class="detail-main-image"><img id="detailMainPhoto" src="${esc(photos[0]||'/mug.jpg')}" alt="${esc(p.name)}: fotografía principal"><button class="detail-zoom" id="detailZoom" aria-label="Ampliar fotografía">⌕ Ampliar</button><span class="detail-photo-count" id="detailPhotoCount">1 / ${photos.length}</span></div>
          <div class="detail-thumbnails" role="group" aria-label="Fotografías del producto">${photos.map((src,i)=>`<button type="button" class="detail-thumb ${i===0?'active':''}" data-photo="${i}" aria-label="Mostrar fotografía ${i+1}" aria-pressed="${i===0?'true':'false'}"><img src="${esc(src)}" alt="Vista ${i+1} de ${esc(p.name)}" loading="lazy"></button>`).join('')}</div>
          <p class="detail-disclaimer">Fotografías ilustrativas de demostración. Confirma materiales, medidas y existencias antes de comprar.</p>
        </div>
        <div class="detail-content">
          <nav class="detail-breadcrumb" aria-label="Ubicación">Casa Olivo <span>/</span> ${esc(p.category)}</nav>
          <span class="eyebrow">${esc(p.category)} · ${esc(p.sku||'Colección')}</span>
          <h2 id="detailTitle">${esc(p.name)}</h2>
          <p class="detail-headline">${esc(p.headline||p.description||'Conoce esta pieza')}</p>
          <div class="detail-price-line"><strong class="detail-price">${S.money(p.salePrice||p.price)}</strong>${old?`<del>${S.money(p.price)}</del><span class="detail-save">Ahorras ${S.money(p.price-p.salePrice)}</span>`:''}</div>
          <span class="detail-stock"><i class="${p.availability==='Agotado'?'out':''}"></i>${esc(p.availability)}</span>
          <p class="detail-description">${esc(p.longDescription||p.description||'Consulta los detalles de este artículo.')}</p>
          ${features.length?`<div class="detail-features"><strong>Lo que hace especial a esta pieza</strong><ul>${features.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
          ${(p.variants||[]).length?`<div class="detail-field-label"><strong>Elige una opción</strong><span id="selectedVariantLabel">${esc(selectedVariant)}</span></div><div class="variant-row detail-variants">${p.variants.map((v,i)=>`<button type="button" class="variant-btn ${i===0?'active':''}" data-variant="${esc(v)}" aria-pressed="${i===0}">${esc(v)}</button>`).join('')}</div>`:''}
          <div class="detail-buy-row"><div class="detail-qty"><span>Cantidad</span><div class="stepper"><button id="minusQty" aria-label="Disminuir cantidad">−</button><strong id="qtyValue">1</strong><button id="plusQty" aria-label="Aumentar cantidad">+</button></div></div><button class="btn btn-dark detail-primary" id="modalAdd" ${p.availability==='Agotado'?'disabled':''}>${p.availability==='Agotado'?'Producto agotado':'Añadir al pedido · '+S.money(p.salePrice||p.price)}</button></div>
          <div class="detail-secondary-actions"><button class="btn btn-outline" id="modalWa" ${p.availability==='Agotado'?'disabled':''}>Consultar este producto por WhatsApp</button><button class="btn btn-soft" id="modalFav">${favorites().includes(p.id)?'♥ Guardado':'♡ Guardar'}</button></div>
          <p class="detail-checkout-note">Sin pago en línea: el comercio confirmará disponibilidad, envío y precio final por WhatsApp.</p>
          <details class="detail-specs" open><summary>Características y detalles <span>＋</span></summary><dl>${specs.length?specs.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join(''):'<div><dt>Información</dt><dd>Solicita las especificaciones al negocio.</dd></div>'}</dl></details>
          ${related.length?`<div class="detail-related"><strong>También te puede gustar</strong><div>${related.map(x=>`<button class="detail-related-item" data-related="${esc(x.id)}"><img src="${esc(safeImage(x.image))}" alt=""><span>${esc(x.name)}<small>${S.money(x.salePrice||x.price)}</small></span></button>`).join('')}</div></div>`:''}
        </div>
      </div>
    </section></div>`;
   let selected=0;
   const drawPhoto=i=>{selected=(i+photos.length)%photos.length;const img=$('#detailMainPhoto');img.src=photos[selected];img.alt=`${p.name}: fotografía ${selected+1}`;$('#detailPhotoCount').textContent=`${selected+1} / ${photos.length}`;document.querySelectorAll('[data-photo]').forEach((b,j)=>{b.classList.toggle('active',j===selected);b.setAttribute('aria-pressed',String(j===selected))});S.record('gallery_view',{productId:p.id,photoIndex:selected})};
   document.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>drawPhoto(+b.dataset.photo));
   $('#detailZoom').onclick=()=>{const z=document.createElement('div');z.className='detail-image-lightbox';z.innerHTML=`<button aria-label="Cerrar imagen">✕</button><img alt="${esc(p.name)}" src="${esc(photos[selected])}">`;z.onclick=()=>z.remove();document.body.appendChild(z)};
   $('#closeModal').onclick=closeModal;
   $('#modalOverlay').onclick=e=>{if(e.target.id==='modalOverlay')closeModal()};
   document.querySelectorAll('[data-variant]').forEach(b=>b.onclick=()=>{selectedVariant=b.dataset.variant;$('#selectedVariantLabel').textContent=selectedVariant;document.querySelectorAll('[data-variant]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))})});
   $('#minusQty').onclick=()=>{$('#qtyValue').textContent=selectedQty=Math.max(1,selectedQty-1);updatePrice()};
   $('#plusQty').onclick=()=>{$('#qtyValue').textContent=selectedQty=Math.min(99,selectedQty+1);updatePrice()};
   const updatePrice=()=>{const b=$('#modalAdd');if(!b.disabled)b.textContent='Añadir al pedido · '+S.money((p.salePrice||p.price)*selectedQty)};
   $('#modalAdd').onclick=()=>{if(p.availability==='Agotado')return;S.addSelection(p.id,selectedQty,selectedVariant);state=S.load();renderHeader();toast('Producto agregado al pedido');closeModal();openDrawer('selection')};
   $('#modalWa').onclick=()=>{if(p.availability!=='Agotado')sendWhatsApp([{productId:p.id,qty:selectedQty,variant:selectedVariant}],p.id)};
   $('#modalFav').onclick=()=>{S.toggleFavorite(p.id);state=S.load();renderHeader();$('#modalFav').textContent=favorites().includes(p.id)?'♥ Guardado':'♡ Guardar';toast(favorites().includes(p.id)?'Guardado en favoritos':'Quitado de favoritos')};
   document.querySelectorAll('[data-related]').forEach(b=>b.onclick=()=>openProduct(b.dataset.related));
   window.__detailKeydown=e=>{if(!$('#modalOverlay'))return;if(e.key==='Escape'){document.querySelector('.detail-image-lightbox')?.remove();if(!document.querySelector('.detail-image-lightbox'))closeModal()}if(e.key==='ArrowRight')drawPhoto(selected+1);if(e.key==='ArrowLeft')drawPhoto(selected-1)};
   document.removeEventListener('keydown',window.__detailPreviousKeydown);document.addEventListener('keydown',window.__detailKeydown);window.__detailPreviousKeydown=window.__detailKeydown;
   $('#closeModal').focus();
 };
})();
