/* Insights comerciales: etiquetas honestas para una demo cuyo almacenamiento es local. */
(function(){
 const escape=s=>String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
 let showDemo=false;
 const N=(n)=>Number(n||0).toLocaleString('es-MX');
 const fmt=(n)=>Number.isFinite(n)?n.toFixed(1)+'%':'—';
 const topList=(obj,max=6)=>Object.entries(obj||{}).sort((a,b)=>b[1]-a[1]).slice(0,max);
 const viewData=()=>S.insights(days,{includeDemo:showDemo});
 const kpi2=(title,val,subtitle)=>'<div class="insight-kpi"><small>'+title+'</small><strong>'+val+'</strong><span>'+subtitle+'</span></div>';
 const header=(title,description)=>titleRow(title,description,`<div class="insight-controls"><select id="daysSelect" aria-label="Periodo"><option value="7">7 días</option><option value="30">30 días</option><option value="90">90 días</option></select><label class="insight-toggle"><input type="checkbox" id="demoSwitch" ${showDemo?'checked':''}> Incluir datos simulados</label></div>`);
 function wireControls(renderFn){$('#daysSelect').value=String(days);$('#daysSelect').onchange=e=>{days=Number(e.target.value);renderFn()};$('#demoSwitch').onchange=e=>{showDemo=e.target.checked;renderFn()}}
 const note=`<section class="insight-warning"><strong>Entorno de demostración · datos almacenados en este navegador</strong><p>Estas cifras NO son resultados globales ni ventas verificadas. Los eventos históricos de ejemplo están excluidos por defecto. Cada visitante almacena sus propios eventos en su dispositivo y no existe consolidación entre usuarios. Un clic en WhatsApp solo indica intención; no confirma mensaje enviado, pedido recibido ni venta.</p></section>`;
 const funnel=m=>`<div class="insight-funnel">${[['Visitas en este navegador',m.visits],['Sesiones que vieron productos',m.viewedCount],['Sesiones con artículos añadidos',m.selectedCount],['Sesiones con intención de pedido',m.sentCount]].map(([x,n],i)=>`<div class="insight-funnel-row"><span>${escape(x)}</span><div class="insight-funnel-bar"><i style="width:${m.visits?Math.min(100,n/m.visits*100):0}%"></i></div><strong>${N(n)}</strong></div>`).join('')}</div>`;
 function recommendations(m){
  const list=[];
  if(!m.visits)list.push('Todavía no hay visitas registradas en este navegador durante el periodo. Comparte el enlace del catálogo para comenzar a comprobar el flujo.');
  if(m.visits>0&&m.viewedCount/m.visits<.45)list.push('Pocas sesiones abren fichas: revisa el inicio, las fotografías y la visibilidad del botón de detalles.');
  if(m.viewedCount>=5&&m.selectedCount/m.viewedCount<.15)list.push('Hay exploración sin selección: mejora especificaciones, fotografías y claridad de precios de los productos más vistos.');
  if(m.selectedCount>=3&&m.sentCount/m.selectedCount<.3)list.push('Muchos usuarios preparan pedidos sin abrir WhatsApp: simplifica el texto y comprueba el número comercial.');
  if(m.noResultQueries.length)list.push('Hay búsquedas sin resultados: agrega sinónimos, categorías o productos correspondientes.');
  if(!list.length)list.push('Revisa las fichas más visitadas, identifica consultas recurrentes y actualiza las imágenes y variantes que generen mayor interés.');
  return '<ul class="recommendation-list">'+list.map(t=>'<li>'+escape(t)+'</li>').join('')+'</ul>';
 }
 renderDashboard=function(){
   const m=viewData(),d=Object.values(m.daily);const top=Object.entries(m.products).sort((a,b)=>b[1].views-a[1].views).slice(0,5);
   $('#adminContent').innerHTML=header('Resumen comercial','Señales de interés y puntos de fricción que puedes mejorar.')+note+
    '<div class="insight-kpis">'+
    kpi2('Sesiones registradas',N(m.visits),'Solo en este dispositivo')+
    kpi2('Vistas de producto',N(m.views),'Fichas abiertas')+
    kpi2('Productos añadidos',N(m.selectedCount),'Sesiones con selección')+
    kpi2('Intenciones de pedido',N(m.sentCount),'Aperturas iniciadas de WhatsApp')+
    kpi2('Tasa de intención',fmt(m.rate),'Sesiones con intento / sesiones registradas')+
    '</div>'+
    '<div class="insight-grid"><section class="panel"><div class="panel-head"><h3>Del interés al pedido</h3></div>'+funnel(m)+'</section>'+
    '<section class="panel"><div class="panel-head"><h3>Qué conviene mejorar</h3></div>'+recommendations(m)+'</section></div>'+
    '<div class="insight-grid"><section class="panel"><div class="panel-head"><h3>Visitas locales por día</h3></div>'+barChart(d.map(x=>x.visits))+'</section><section class="panel"><div class="panel-head"><h3>Productos que atraen</h3></div><div class="rank-list">'+(top.length?top.map(([id,x],i)=>{const p=prod(id);return p?'<div class="rank-item"><b>'+(i+1)+'</b><img src="'+escape(p.image)+'" alt=""><div><strong>'+escape(p.name)+'</strong><small>'+N(x.adds)+' añadidos · '+N(x.contacts)+' clics de contacto</small></div><b>'+N(x.views)+'</b></div>':''}).join(''):'<p class="insight-muted">Sin vistas registradas todavía.</p>')+'</div></section></div>';
   wireControls(renderDashboard);
 };
 renderAnalytics=function(){
   const m=viewData();const rows=state.products.map(p=>({p,x:m.products[p.id]||{views:0,adds:0,contacts:0,favorites:0}})).sort((a,b)=>b.x.views-a.x.views);
   $('#adminContent').innerHTML=header('Analítica comercial','Identifica qué productos interesan y dónde se detienen las consultas.')+note+
   '<div class="insight-kpis">'+kpi2('Sesiones',N(m.visits),'Aperturas locales')+kpi2('Intenciones de pedido',N(m.sentCount),'No son ventas')+kpi2('Consultas por WhatsApp',N(m.whatsappClicks),'Clics vinculados a productos')+kpi2('Búsquedas',N(m.searchCount),'Términos buscados')+'</div>'+
   '<section class="panel insight-table-panel"><div class="panel-head"><h3>Rendimiento por producto</h3><span>Solo eventos del navegador actual</span></div><div class="insight-table-scroll"><table class="data-table"><thead><tr><th>Producto</th><th>Vistas</th><th>Añadidos</th><th>Contactos</th><th>Guardados*</th><th>Interés por vista</th></tr></thead><tbody>'+rows.map(({p,x})=>'<tr><td><div class="product-cell"><img src="'+escape(p.image)+'" alt=""><div><strong>'+escape(p.name)+'</strong><small>'+escape(p.category)+'</small></div></div></td><td>'+N(x.views)+'</td><td>'+N(x.adds)+'</td><td>'+N(x.contacts)+'</td><td>'+N(x.favorites)+'</td><td>'+(x.views?fmt(x.adds/x.views*100):'—')+'</td></tr>').join('')+'</tbody></table></div><small class="insight-muted">* Guardados representa activaciones de favoritos, no personas únicas. La tasa por vista es orientativa, no tasa de compra.</small></section>'+
   '<div class="insight-grid"><section class="panel"><h3>Fuentes registradas</h3>'+(Object.keys(m.sources).length?topList(m.sources,8).map(([k,v])=>'<div class="insight-pair"><span>'+escape(k)+'</span><strong>'+N(v)+'</strong></div>').join(''):'<p class="insight-muted">Sin fuentes registradas.</p>')+'<p class="insight-muted">Para distinguir campañas utiliza ?src=instagram, ?src=facebook o ?src=qr en el enlace.</p></section>'+
   '<section class="panel"><h3>Lo que buscan</h3>'+(Object.keys(m.searches).length?topList(m.searches,8).map(([k,v])=>'<div class="insight-pair"><span>'+escape(k)+'</span><strong>'+N(v)+'</strong></div>').join(''):'<p class="insight-muted">Aún no hay búsquedas.</p>')+'<h4>Búsquedas sin resultados</h4>'+(m.noResultQueries.length?'<p>'+m.noResultQueries.slice(0,8).map(escape).join(', ')+'</p>':'<p class="insight-muted">No se han registrado búsquedas sin resultados.</p>')+'</section></div>'+
   '<section class="panel"><h3>Recomendaciones accionables</h3>'+recommendations(m)+'</section>';
   wireControls(renderAnalytics);
 };
 // Extiende el editor original sin modificar los atributos preexistentes ni el guardado de precios.
 const originalEditor=openProductEditor;
 openProductEditor=function(id=null){
   originalEditor(id);
   const p=id?prod(id):null,form=$('#productForm'),grid=form?.querySelector('.form-grid');
   if(!form||!grid)return;
   const block=document.createElement('div');block.className='full enriched-editor';
   const specs=p&&p.specs&&typeof p.specs==='object'?Object.entries(p.specs).map(([k,v])=>k+': '+v).join('\n'):'';
   block.innerHTML='<div class="editor-section-title"><strong>Información comercial e inventario</strong><small>Registra costo y existencias aquí. Se usarán para análisis; no aparecen en la ficha pública.</small></div>'+ 
   '<div class="field"><label>Costo unitario (MXN, opcional)</label><input name="costPrice" type="number" step="0.01" min="0" placeholder="Sin dato" value="'+escape(p?.costPrice??'')+'"></div>'+
   '<div class="field"><label>Existencias (unidades, opcional)</label><input name="stockQty" type="number" step="1" min="0" placeholder="Sin dato" value="'+escape(p?.stockQty??'')+'"></div>'+
   '<div class="editor-section-title"><strong>Ficha de producto ampliada</strong><small>Lo que el cliente necesita saber antes de decidir.</small></div>'+
   '<div class="field"><label>Frase de beneficio</label><input name="headline" placeholder="Ej. Tu pausa favorita empieza aquí" value="'+escape(p?.headline||'')+'"></div>'+
   '<div class="field"><label>Descripción completa</label><textarea rows="5" name="longDescription" placeholder="Describe usos, beneficios y por qué destaca...">'+escape(p?.longDescription||'')+'</textarea></div>'+
   '<div class="field"><label>Galería de imágenes (una URL por línea)</label><textarea name="gallery" rows="4" placeholder="/mug.jpg\n/hero.jpg">'+escape((p?.gallery||[p?.image||'/mug.jpg']).join('\n'))+'</textarea><small>Usa imágenes del catálogo o URL HTTPS accesibles. La primera imagen principal también aparece en la galería.</small></div>'+
   '<div class="field"><label>Beneficios o características (una por línea)</label><textarea name="features" rows="4" placeholder="Diseño cómodo\nAcabado natural">'+escape((p?.features||[]).join('\n'))+'</textarea></div>'+
   '<div class="field"><label>Ficha técnica (Campo: valor por línea)</label><textarea name="specs" rows="4" placeholder="Material: Cerámica\nColor: Olivo">'+escape(specs)+'</textarea></div>';
   grid.appendChild(block);
   const originalSubmit=form.onsubmit;
   form.onsubmit=e=>{
     const fd=new FormData(form);
     const lines=v=>String(v||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
     const specs={};for(const l of lines(fd.get('specs'))){const i=l.indexOf(':');if(i>0)specs[l.slice(0,i).trim()]=l.slice(i+1).trim()}
     const gallery=lines(fd.get('gallery')).filter(url=>url.startsWith('/')||url.startsWith('https://')).slice(0,8);
     const rawCost=String(fd.get('costPrice')??'').trim(),rawStock=String(fd.get('stockQty')??'').trim();
     const costPrice=rawCost===''?null:Number(rawCost),stockQty=rawStock===''?null:Number(rawStock);
     if(costPrice!==null&&(!Number.isFinite(costPrice)||costPrice<0)){e.preventDefault();alert('El costo debe ser un número igual o mayor que cero');return;}
     if(stockQty!==null&&(!Number.isInteger(stockQty)||stockQty<0)){e.preventDefault();alert('Las existencias deben ser unidades enteras iguales o mayores que cero');return;}
     const extras={headline:String(fd.get('headline')||'').trim(),longDescription:String(fd.get('longDescription')||'').trim(),gallery,features:lines(fd.get('features')).slice(0,12),specs,costPrice,stockQty};
     const currentId=id||S.slugify(fd.get('name'))||'';
     originalSubmit(e);
     const latest=S.load().products.find(p=>p.id===currentId);
     if(latest){S.updateProduct({...latest,...extras});refresh()}
   };
 };
})();
