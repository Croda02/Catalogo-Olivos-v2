/* UI enhancements only: existing store remains the source of truth. */
(function(){
  'use strict';
  const paths={
    bag:'<path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
    user:'<circle cx="12" cy="8" r="3.5"/><path d="M5.5 20v-2a6.5 6.5 0 0 1 13 0v2"/>',
    heart:'<path d="M20.8 8.1c0 4.1-8.8 10-8.8 10s-8.8-5.9-8.8-10a5 5 0 0 1 8.8-3.2 5 5 0 0 1 8.8 3.2Z"/>',
    message:'<path d="M20 11.5a8 8 0 0 1-8 8 9 9 0 0 1-3.7-.8L4 20l1.3-4.3a8 8 0 1 1 14.7-4.2Z"/><path d="M9 10.1c.8 1.8 2.1 3.1 4 4"/>',
    home:'<path d="m3 10 9-7 9 7v10H3V10Z"/><path d="M9 20v-7h6v7"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'
  };
  document.querySelectorAll('.ui-icon[data-icon]').forEach(el=>{
    const content=paths[el.dataset.icon];
    if(content) el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+content+'</svg>';
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
