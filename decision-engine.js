/* Motor de decisiones verificable. Reglas transparentes: no predice ventas. */
(function(){
 'use strict';
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const isMoney=n=>finite(n)&&n>=0;
 const costOf=p=>p.costPrice===''||p.costPrice==null?null:(isMoney(Number(p.costPrice))?Number(p.costPrice):null);
 const activePrice=p=>finite(Number(p.salePrice))&&Number(p.salePrice)>0&&Number(p.salePrice)<Number(p.price)?Number(p.salePrice):Number(p.price)||0;
 const margin=(price,cost)=>price>0&&cost!=null?(price-cost)/price*100:null;
 const metrics=p=>{
   const photos=[...new Set([p.image,...(Array.isArray(p.gallery)?p.gallery:[])].filter(Boolean))];
   const desc=String(p.longDescription||p.description||'').trim();
   const features=Array.isArray(p.features)?p.features.filter(Boolean):[];
   const specs=p.specs&&typeof p.specs==='object'?Object.entries(p.specs).filter(([k,v])=>k&&v):[];
   let points=(photos.length>=3?25:photos.length>=2?17:photos.length?8:0)+(desc.length>=180?25:desc.length>=90?17:desc.length?7:0)+(features.length>=3?20:features.length>=1?10:0)+(specs.length>=3?20:specs.length>=1?10:0)+(Number(p.price)>0&&p.availability?10:0);
   return {photos:photos.length,descriptionLength:desc.length,features:features.length,specs:specs.length,quality:points,cost:costOf(p),price:activePrice(p),margin:margin(activePrice(p),costOf(p)),stock:typeof p.stockQty==='number'&&Number.isInteger(p.stockQty)&&p.stockQty>=0?p.stockQty:null};
 };
 function audit(state,traffic,targetMargin=30){
   const products=(state.products||[]).filter(p=>p.active!==false);
   const today=new Date().toISOString().slice(0,10);
   const issues=[],details=[],count={missingCost:0,missingStock:0,lowMargin:0,expiredPromos:0,incomplete:0};
   const push=(priority,kind,title,why,action,productId=null,weight=1)=>issues.push({id:kind+'-'+(productId||issues.length),priority,kind,title,why,action,productId,weight});
   for(const p of products){
     const m=metrics(p);details.push({product:p,...m});
     if(m.cost==null)count.missingCost++;
     if(m.stock==null)count.missingStock++;
     if(m.quality<85)count.incomplete++;
     if(m.cost!=null&&m.margin!=null&&m.margin<targetMargin){count.lowMargin++;push(m.margin<0?'alta':'media','margin','Margen objetivo no alcanzado: '+p.name,'Precio '+m.price+' MXN; costo '+m.cost+' MXN. Margen estimado '+m.margin.toFixed(1)+'% frente a meta '+targetMargin+'%.','Editar precio o costos',p.id,5);}
     if(m.stock!=null&&m.stock<=3&&p.availability==='Disponible')push('alta','stock','Revisar existencias de '+p.name,'El inventario registrado es '+m.stock+' y el artículo aparece disponible.','Actualizar inventario',p.id,5);
     if(m.quality<85)push('media','detail','Completar ficha: '+p.name,'Calidad de información '+m.quality+'/100 · '+m.photos+' fotos · '+m.features+' beneficios · '+m.specs+' características técnicas.','Completar producto',p.id,3);
     const signals=traffic?.products?.[p.id];if(signals&&signals.views>=12&&signals.adds/signals.views<.10)push('media','interest','Interés sin selección: '+p.name,signals.views+' vistas y '+signals.adds+' artículos añadidos en este navegador. Revisar oferta, imágenes y precio.','Revisar ficha',p.id,3);
   }
   const stale=(state.promotions||[]).filter(x=>x.active&&x.end&&x.end<today);
   count.expiredPromos=stale.length;
   if(stale.length)push('alta','campaigns',stale.length+' promociones vencidas siguen marcadas como activas','Revisa fechas, mensaje comercial y productos asociados para evitar campañas inconsistentes.','Revisar promociones',null,5);
   if(count.missingCost)push('alta','costs',count.missingCost+' productos sin costo registrado','Sin costo unitario no puedes saber si los descuentos son rentables. Carga primero los costos de compra o producción.','Configurar costos',null,4);
   if(count.missingStock)push('media','inventory',count.missingStock+' productos sin cantidad de inventario','El estado disponible no indica cuántas unidades puedes comprometer. El registro de existencias es opcional, pero facilita detectar faltantes.','Completar existencias',null,2);
   if(traffic?.noResultQueries?.length>=2)push('media','search','Búsquedas sin resultado detectadas',traffic.noResultQueries.length+' búsquedas sin coincidencias en este navegador. Analiza los términos en Estadísticas.','Ver búsquedas',null,3);
   if(traffic?.selectedCount>=5&&traffic.sentCount/traffic.selectedCount<.3)push('media','funnel','Interés detenido antes de WhatsApp',traffic.selectedCount+' sesiones prepararon selección y '+traffic.sentCount+' iniciaron pedido en este navegador. Revisa la claridad del siguiente paso.','Ver embudo',null,4);
   issues.sort((a,b)=>(b.priority==='alta'?2:b.priority==='media'?1:0)-(a.priority==='alta'?2:a.priority==='media'?1:0)||b.weight-a.weight);
   return {products:details,issues,counts:count,avgQuality:details.length?Math.round(details.reduce((n,x)=>n+x.quality,0)/details.length):0,targetMargin:Math.max(0,Math.min(90,Number(targetMargin)||30)),total:details.length,coverage:details.length?Math.round((details.length-count.missingCost)/details.length*100):0};
 }
 function simulate(product,discount=0,targetMargin=30){
   const cost=costOf(product),base=Number(product.price)||0,rate=Math.min(95,Math.max(0,Number(discount)||0)),price=Math.max(0,Math.round(base*(1-rate/100)*100)/100),m=margin(price,cost);
   return {base,discount:rate,price,cost,contribution:cost==null?null:price-cost,margin:m,meetsTarget:m!=null&&m>=targetMargin,breakEven:cost!=null&&cost<=base?(1-cost/base)*100:null};
 }
 window.CasaDecision={metrics,audit,simulate,costOf,activePrice,margin};
})();
