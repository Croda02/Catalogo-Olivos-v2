/* Plantillas WhatsApp: solo compone mensajes, nunca envía de forma automática. */
(function(){
  'use strict';
  const templates=Object.freeze({
    general:'Hola, vi el catálogo de {tienda} y quisiera hacer una consulta.',
    product:'Hola, vi {producto} en el catálogo de {tienda}. Me interesa la opción {variante}, cantidad {cantidad}, precio estimado {subtotal}. ¿Podrían confirmarme disponibilidad y entrega?',
    order:'Hola, quiero consultar este pedido en {tienda}:\n\n{lista_productos}\n\nSubtotal estimado: {subtotal}\n\n¿Me confirman disponibilidad y entrega?'
  });
  const keys=['tienda','producto','variante','cantidad','precio','subtotal','lista_productos'];
  const clean=value=>String(value??'').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g,'').slice(0,1200);
  function validateTemplate(value){
    if(typeof value!=='string'||!value.trim()||value.length>900)return {ok:false,error:'Escribe un texto de 1 a 900 caracteres.'};
    const variables=[...value.matchAll(/\{([^{}]+)\}/g)].map(x=>x[1]);
    const unknown=variables.filter(x=>!keys.includes(x));
    if(unknown.length)return {ok:false,error:'Variable no reconocida: {'+unknown[0]+'}'};
    if(/[{}]/.test(value.replace(/\{(?:tienda|producto|variante|cantidad|precio|subtotal|lista_productos)\}/g,'')))return {ok:false,error:'Revisa las llaves de las variables.'};
    return {ok:true,error:null};
  }
  function interpolate(template,context={}){
    return String(template||'').replace(/\{(tienda|producto|variante|cantidad|precio|subtotal|lista_productos)\}/g,(_,key)=>clean(context[key]??''));
  }
  function templateFor(business,type){
    const custom=business?.whatsappTemplates?.[type];
    return validateTemplate(custom).ok?custom:templates[type]||templates.general;
  }
  function normalizePhone(phone){
    const raw=String(phone||'').trim();
    if(!/^\+?[\d\s().-]+$/.test(raw))return null;
    let digits=raw.replace(/\D/g,'');
    if(digits.length===10)digits='52'+digits;
    if(!/^[1-9]\d{10,14}$/.test(digits))return null;
    return digits;
  }
  function build(state,type,items=[]){
    const business=state?.business||{}, phone=normalizePhone(business.whatsapp);
    if(!phone)return {ok:false,error:'Configura un número de WhatsApp válido con código de país.'};
    const productMap=new Map((state.products||[]).map(p=>[p.id,p]));
    const valid=[];
    for(const item of items){
      const p=productMap.get(item.productId);
      if(!p||p.active===false||p.availability==='Agotado'||p.availability==='Oculto')continue;
      const qty=Math.max(1,Math.min(99,Math.floor(Number(item.qty)||1)));
      const price=Number(p.salePrice)>0?Number(p.salePrice):Number(p.price)||0;
      valid.push({p,qty,variant:String(item.variant||''),amount:price*qty});
    }
    if(type!=='general'&&!valid.length)return {ok:false,error:'Selecciona productos disponibles para continuar.'};
    const subtotal=valid.reduce((n,i)=>n+i.amount,0),money=window.CasaStore.money;
    const first=valid[0];
    const context={
      tienda:clean(business.name||'la tienda'),
      producto:first?.p.name||'',
      variante:first?.variant||'Sin variante',
      cantidad:String(first?.qty||1),
      precio:first?money(first.amount/first.qty):'',
      subtotal:money(subtotal),
      lista_productos:valid.map(x=>'• '+clean(x.p.name)+(x.variant?' — '+clean(x.variant):'')+' · '+x.qty+' × '+money(x.amount/x.qty)+' = '+money(x.amount)).join('\n')
    };
    const text=interpolate(templateFor(business,type),context).trim();
    if(!text)return {ok:false,error:'El mensaje configurado está vacío.'};
    if(text.length>5000)return {ok:false,error:'El mensaje del pedido es demasiado largo. Reduce los productos o el texto.'};
    return {ok:true,text,url:'https://wa.me/'+phone+'?text='+encodeURIComponent(text),subtotal,items:valid,context};
  }
  window.CasaMessages={templates,keys,interpolate,templateFor,normalizePhone,validateTemplate,build};
})();