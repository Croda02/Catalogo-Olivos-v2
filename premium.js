/* UI enhancements only: existing store remains the source of truth. */
(function(){
  'use strict';
  const paths={
    bag:'<path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    user:'<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20v-2a6.5 6.5 0 0 1 13 0v2"/>',
    heart:'<path d="M20.8 8.1c0 4.1-8.8 10-8.8 10s-8.8-5.9-8.8-10a5 5 0 0 1 8.8-3.2 5 5 0 0 1 8.8 3.2Z"/>',
    message:'<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>',
    home:'<path d="m3 10 9-7 9 7v10H3V10Z"/><path d="M9 20v-7h6v7"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
  };
  document.querySelectorAll('.ui-icon[data-icon]').forEach(el=>{
    const content=paths[el.dataset.icon];
    if(content) el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" '+(el.dataset.icon==='message'?'class="whatsapp-icon-svg"':'')+'>'+content+'</svg>';
  });
  const floating=document.getElementById('floatingCart');
  const count=document.getElementById('floatingCartCount');
  function refresh(){
    if(!floating||!window.CasaStore)return;
    const cart=window.CasaStore.load().selection||[];
    const quantity=cart.reduce((s,item)=>s+(Number(item.qty)||0),0);
    count.textContent=quantity+' '+(quantity===1?'producto':'productos');
    floating.classList.toggle('hidden',quantity===0);
  }
  document.getElementById('floatingCartBtn')?.addEventListener('click',()=>document.getElementById('selectionBtn')?.click());
  window.addEventListener('casaolivo:cartchange',refresh);
  window.addEventListener('casaolivo:state',refresh);
  refresh();
})();
