/* Centro de decisiones para el comercio. Funciona con datos locales; no implica ventas reales. */
(function(){
 'use strict';
 const D=window.CasaDecision,S=window.CasaStore;
 const e=x=>String(x??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
 const money=x=>S.money(x);
 const signed=x=>x==null?'No configurado':x.toFixed(1)+'%';
 const freshness='<p class="decision-disclaimer">Los diagnósticos de fichas y márgenes se calculan con los productos guardados en este navegador. Las señales de navegación no representan a todos los visitantes. No hay ventas verificadas ni sincronización entre dispositivos. No registres datos comerciales sensibles en esta demo pública.</p>';
 const tip=(severity)=>severity==='alta'?'Atención prioritaria':severity==='media'?'Mejora recomendada':'Revisar';
 const get=()=>{const s=S.load();const goal=Number(s.business.targetMargin)||30;return {state:s,traffic:S.insights(days),data:D.audit(s,S.insights(days),goal),goal};};
 const issueMarkup=(it)=>'<article class="decision-task"><div class="decision-task-symbol '+e(it.priority)+'">'+(it.priority==='alta'?'!':'↗')+'</div><div class="decision-task-content"><small>'+tip(it.priority)+'</small><strong>'+e(it.title)+'</strong><p>'+e(it.why)+'</p></div><button type="button" data-decision-action="'+e(it.kind)+'" '+(it.productId?'data-product="'+e(it.productId)+'"':'')+'>'+e(it.action)+' <span>→</span></button></article>';
 const feedback=(n)=>{const x=$('#decisionToast');if(x){x.textContent=n;x.hidden=false;setTimeout(()=>{if(x.isConnected)x.hidden=true},3400)}};
 const bindActions=root=>{
  root.querySelectorAll('[data-decision-action]').forEach(b=>b.onclick=()=>{
   const k=b.dataset.decisionAction,id=b.dataset.product;
   if(id){openProductEditor(id);return;}
   if(k==='campaigns'){navTo('promotions');return;}
   if(k==='search'||k==='funnel'){navTo('analytics');return;}
   navTo('decisions');
   const target=document.querySelector('.decision-cost-table');
   target?.scrollIntoView({behavior:'smooth',block:'start'});
  });
 };
 const headline=(a)=>'<div class="decision-hero"><div><span class="decision-hero-kicker">INTELIGENCIA COMERCIAL · DEMOSTRACIÓN</span><h1>Qué conviene hacer hoy</h1><p>Menos números sueltos. Diagnóstico de tu catálogo, márgenes orientativos y acciones concretas para vender mejor.</p></div><div class="decision-hero-score"><strong>'+a.avgQuality+'<span>/100</span></strong><small>Calidad media de fichas</small></div></div>';
 const metric=(label,num,desc)=>'<div class="decision-metric"><small>'+e(label)+'</small><strong>'+e(num)+'</strong><span>'+e(desc)+'</span></div>';
 function renderDecisions(){
   const {state:st,data:a,goal,traffic}=get();
   state=st;
   const usable=a.products.slice().sort((x,y)=>(x.margin??100)-(y.margin??100)||x.quality-y.quality);
   const rows=usable.map(({product:p,quality,stock,margin,price})=>{
    const marginText=margin==null?'<span class="decision-muted">Costo no registrado</span>':'<strong class="'+(margin<goal?'decision-negative':'decision-positive')+'">'+signed(margin)+'</strong>';
    return '<tr data-decision-product="'+e(p.id)+'"><td><div class="decision-product"><img src="'+e(p.image)+'" alt=""><span><strong>'+e(p.name)+'</strong><small>'+e(p.sku)+' · Calidad de ficha '+quality+'/100</small></span></div></td><td>'+money(price)+'</td><td>'+(stock==null?'Sin dato':stock+' unidades')+'</td><td>'+marginText+'</td><td><button class="decision-save" data-edit-product="'+e(p.id)+'">Editar producto →</button></td></tr>';
   }).join('');
   const openIssues=a.issues.slice(0,6);
   $('#adminContent').innerHTML=
    '<div class="decision-wrap">'+headline(a)+
    '<div class="decision-metrics">'+
    metric('Productos evaluados',String(a.total),'Fichas activas')+
    metric('Costos registrados',String(a.total-a.counts.missingCost)+' / '+a.total,'Necesarios para evaluar márgenes')+
    metric('Promociones por revisar',String(a.counts.expiredPromos),'Activas con vigencia vencida')+
    metric('Márgenes bajo la meta',String(a.counts.lowMargin),'Solo entre productos con costo')+
    '</div>'+freshness+
    '<div class="decision-section-title"><div><span class="eyebrow">Acciones prioritarias</span><h2>El siguiente movimiento</h2><p>Recomendaciones basadas en datos configurados y reglas explícitas. No son predicciones automáticas de ventas.</p></div><span class="decision-counter">'+a.issues.length+' alertas</span></div>'+
    '<div class="decision-task-list">'+(openIssues.length?openIssues.map(issueMarkup).join(''):'<div class="decision-empty">No hay alertas prioritarias con la información disponible. Mantén actualizado el catálogo y revisa nuevos datos.</div>')+'</div>'+
    '<div class="decision-two-col"><section class="decision-panel"><div class="decision-panel-head"><div><span class="eyebrow">Rentabilidad</span><h3>Evalúa antes de hacer una oferta</h3></div></div><p>Simula un descuento y comprueba el margen bruto simplificado. El cálculo no incluye impuestos, envío, comisiones ni otros gastos.</p>'+
    '<label class="decision-field">Producto<select id="decisionSimProduct">'+a.products.map(({product:p})=>'<option value="'+e(p.id)+'">'+e(p.name)+'</option>').join('')+'</select></label>'+
    '<label class="decision-field">Descuento propuesto <strong id="decisionDiscountLabel">15%</strong><input id="decisionDiscount" type="range" min="0" max="60" step="1" value="15"></label>'+
    '<div id="decisionSimResult"></div><button class="decision-outline" id="decisionEditSim">Editar costo de este producto →</button></section>'+
    '<section class="decision-panel"><div class="decision-panel-head"><div><span class="eyebrow">Diagnóstico</span><h3>¿Por qué esta prioridad?</h3></div></div>'+
    '<div class="decision-explain"><div><strong>Contenido del producto</strong><p>Fotos, descripción amplia, beneficios, ficha técnica, precio y disponibilidad.</p></div><div><strong>Rentabilidad</strong><p>Comparación entre precio vigente, costo unitario y margen objetivo configurable.</p></div><div><strong>Señales de interés</strong><p>Solo se generan alertas de comportamiento al alcanzar muestras mínimas en este dispositivo.</p></div></div>'+
    '<div class="decision-goal"><label for="decisionMarginTarget">Margen bruto objetivo (%)</label><input type="number" id="decisionMarginTarget" min="1" max="90" step="1" value="'+goal+'"><button id="saveDecisionTarget">Guardar meta</button></div></section></div>'+
    '<div class="decision-section-title"><div><span class="eyebrow">Control de márgenes</span><h2>Costos y existencias por producto</h2><p>Consulta el estado de cada producto. Para cambiar precios, costos o existencias, entra a Productos y edita su ficha una sola vez.</p></div></div>'+
    '<div class="decision-cost-table"><table class="data-table"><thead><tr><th>Producto</th><th>Precio vigente</th><th>Existencias registradas</th><th>Margen estimado</th><th>Acción</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<div class="decision-bottom"><p>El valor de la herramienta no está en acumular gráficas, sino en ayudarte a mejorar la información, evitar descuentos perjudiciales y decidir qué productos revisar. Para estadísticas globales y ventas verificadas se requiere backend y registro de transacciones.</p><button id="decisionSeeAnalytics" class="decision-outline">Ver actividad del catálogo →</button></div><div id="decisionToast" class="decision-toast" role="status" hidden></div></div>';
   const root=$('#adminContent');
   bindActions(root);
   $('#decisionSimProduct').onchange=renderSimulation;$('#decisionDiscount').oninput=renderSimulation;
   $('#decisionEditSim').onclick=()=>openProductEditor($('#decisionSimProduct').value);
   function renderSimulation(){
      const p=st.products.find(x=>x.id===$('#decisionSimProduct').value);if(!p)return;
      const d=Number($('#decisionDiscount').value);$('#decisionDiscountLabel').textContent=d+'%';
      const sim=D.simulate(p,d,goal);
      const c=sim.cost==null?'<span class="decision-muted">Costo sin registrar</span>':money(sim.cost);
      const m=sim.margin==null?'<span class="decision-muted">Configura el costo para evaluar rentabilidad</span>':'<strong class="'+(sim.meetsTarget?'decision-positive':'decision-negative')+'">'+signed(sim.margin)+'</strong>';
      $('#decisionSimResult').innerHTML='<div class="decision-sim-grid"><div><small>Precio simulado</small><strong>'+money(sim.price)+'</strong></div><div><small>Costo unitario</small><strong>'+c+'</strong></div><div><small>Margen simplificado</small>'+m+'</div></div>'+(sim.cost==null?'<p class="decision-sim-alert">Sin costo no es posible determinar si el descuento es conveniente.</p>':sim.margin<0?'<p class="decision-sim-alert">El precio queda por debajo del costo registrado.</p>':sim.margin<goal?'<p class="decision-sim-alert">Este descuento queda por debajo de tu meta de '+goal+'% de margen.</p>':'<p class="decision-sim-ok">Supera la meta de margen configurada, antes de otros gastos.</p>');
   }
   renderSimulation();
   $('#saveDecisionTarget').onclick=()=>{const n=Number($('#decisionMarginTarget').value);if(!Number.isFinite(n)||n<1||n>90){feedback('Indica un porcentaje entre 1 y 90');return;}S.updateBusiness({targetMargin:n});renderDecisions();feedback('Meta actualizada')};
   root.querySelectorAll('[data-edit-product]').forEach(btn=>btn.onclick=()=>openProductEditor(btn.dataset.editProduct));
   $('#decisionSeeAnalytics').onclick=()=>navTo('analytics');
 }
 const originalRender=render;
 render=function(){if(view==='decisions')return renderDecisions();return originalRender()};
 const oldDashboard=renderDashboard;
 renderDashboard=function(){oldDashboard();
   const {data:a}=get();const root=$('#adminContent');const first=root.firstElementChild;
   const prompt=document.createElement('section');prompt.className='decision-dashboard-spotlight';
   prompt.innerHTML='<div><small>OPORTUNIDADES DEL CATÁLOGO</small><strong>'+a.issues.length+' asuntos para revisar</strong><span>Calidad de fichas '+a.avgQuality+'/100 · '+a.counts.missingCost+' costos sin capturar · '+a.counts.expiredPromos+' promociones vencidas</span></div><button id="openDecisionCenter">Abrir centro de decisiones →</button>';
   root.insertBefore(prompt,first);
   $('#openDecisionCenter').onclick=()=>navTo('decisions');
 };
 window.CasaDecisionUI={renderDecisions};
 render();
})();
