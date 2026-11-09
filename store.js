(function(){
  const KEY='casa_olivo_demo_v4';
  const SESSION='casa_olivo_session_v1';
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('casa-olivo-demo') : null;

  const money = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n||0);
  const slugify = s => (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  const uid = (p='id') => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;

  function seedAnalytics(products){
    const events=[];
    const now=new Date();
    const sources=['WhatsApp','Instagram','Facebook','Directo','QR'];
    for(let day=29; day>=0; day--){
      const d=new Date(now); d.setDate(now.getDate()-day); d.setHours(10,0,0,0);
      const opens=32 + ((day*17)%26) + (29-day);
      for(let i=0;i<opens;i++){
        const date=new Date(d.getTime()+i*420000);
        const sid=`seed_${day}_${i}`;
        const source=sources[(i+day)%sources.length];
        events.push({id:uid('e'),type:'catalog_open',ts:date.toISOString(),sessionId:sid,source});
        const views=1+((i+day)%5);
        for(let v=0;v<views;v++){
          const p=products[(i*3+v+day)%products.length];
          events.push({id:uid('e'),type:'product_view',ts:new Date(date.getTime()+60000*(v+1)).toISOString(),sessionId:sid,productId:p.id,source});
        }
        if((i+day)%4===0){
          const p=products[(i+day)%products.length];
          events.push({id:uid('e'),type:'whatsapp_click',ts:new Date(date.getTime()+360000).toISOString(),sessionId:sid,productId:p.id,source});
        }
        events.push({id:uid('e'),type:'active_seconds',ts:new Date(date.getTime()+420000).toISOString(),sessionId:sid,seconds:80+((i*13+day*7)%170),source});
      }
    }
    return events.slice(-5200);
  }

  function initialState(){
    const products=[
      {id:'taza-olivo',name:'Taza Olivo',sku:'TAZ-001',category:'Cocina y mesa',description:'Taza de cerámica artesanal con ilustración botánica. Una pieza cálida para café, té o infusiones.',price:189,salePrice:null,image:'/mug.jpg',active:true,availability:'Disponible',featured:true,isNew:true,bestSeller:true,tags:['artesanal','cerámica'],variants:['Olivo','Arena']},
      {id:'vela-serenidad',name:'Vela Serenidad',sku:'VEL-001',category:'Aromas',description:'Vela artesanal con aroma suave a higo y olivo. Pensada para crear espacios tranquilos y acogedores.',price:289,salePrice:229,image:'/candle.jpg',active:true,availability:'Disponible',featured:true,isNew:false,bestSeller:true,tags:['vela','aroma','oferta'],variants:['Higo y olivo','Lavanda','Cítricos']},
      {id:'manta-natural',name:'Manta Trenzado Natural',sku:'MAN-001',category:'Textiles',description:'Manta tejida en tonos naturales. Textura suave, ideal para sofá, cama o sillón de lectura.',price:459,salePrice:null,image:'/blanket.jpg',active:true,availability:'Disponible',featured:true,isNew:false,bestSeller:false,tags:['textil','hogar'],variants:['Natural','Arena']},
      {id:'difusor-mediterraneo',name:'Difusor Mediterráneo',sku:'DIF-001',category:'Aromas',description:'Difusor de varillas con notas herbales y cítricas. Aroma constante y elegante para cualquier habitación.',price:329,salePrice:269,image:'/diffuser.jpg',active:true,availability:'Disponible',featured:true,isNew:true,bestSeller:false,tags:['difusor','aroma','oferta'],variants:['Mediterráneo','Lavanda']},
      {id:'tote-olivo',name:'Tote Olivo',sku:'TOT-001',category:'Accesorios',description:'Bolsa de lino natural con ilustración botánica. Ligera, resistente y pensada para el día a día.',price:249,salePrice:null,image:'/tote.jpg',active:true,availability:'Disponible',featured:true,isNew:true,bestSeller:false,tags:['bolsa','lino'],variants:['Natural']},
      {id:'vela-campo',name:'Vela Campo de Olivos',sku:'VEL-002',category:'Aromas',description:'Aroma verde y fresco con notas de hoja de olivo, madera clara y hierbas secas.',price:289,salePrice:199,image:'/candle-large.jpg',active:true,availability:'Pocas piezas',featured:false,isNew:false,bestSeller:true,tags:['vela','oferta'],variants:['Campo de olivos']},
      {id:'set-mesa-olivo',name:'Set Mesa Olivo',sku:'SET-001',category:'Cocina y mesa',description:'Set decorativo para mesa con textura mineral y tonos neutros. Ideal para recibir o regalar.',price:389,salePrice:null,image:'/stone.jpg',active:true,availability:'Sobre pedido',featured:false,isNew:true,bestSeller:false,tags:['mesa','regalo'],variants:['Set 4 piezas']},
      {id:'bolsa-lino',name:'Bolsa de Lino Natural',sku:'BOL-002',category:'Accesorios',description:'Bolsa ligera con acabado natural, pensada para mercado, playa o uso diario.',price:219,salePrice:null,image:'/tote.jpg',active:true,availability:'Disponible',featured:false,isNew:false,bestSeller:false,tags:['bolsa','lino'],variants:['Natural','Verde olivo']},
      {id:'manta-arena',name:'Manta Arena',sku:'MAN-002',category:'Textiles',description:'Manta ligera en color arena con caída suave y estética minimalista.',price:399,salePrice:349,image:'/blanket.jpg',active:true,availability:'Disponible',featured:false,isNew:true,bestSeller:false,tags:['textil','oferta'],variants:['Arena']},
      {id:'taza-campo',name:'Taza Campo',sku:'TAZ-002',category:'Cocina y mesa',description:'Cerámica en tono piedra con acabado mate y asa amplia.',price:179,salePrice:null,image:'/mug.jpg',active:true,availability:'Agotado',featured:false,isNew:false,bestSeller:false,tags:['cerámica'],variants:['Piedra']}
    ];
    return {
      version:5,
      business:{name:'Casa Olivo',tagline:'Hogar que inspira',whatsapp:'2288564889',catalogLimit:60,accent:'#31472d',instagram:'@casaolivo',catalogUrl:'https://casa-olivo-demo.vercel.app'},
      categories:['Decoración','Textiles','Aromas','Cocina y mesa','Accesorios','Regalos'],
      products,
      promotions:[
        {id:'promo-hogar',name:'Hogar en armonía',description:'Hasta 30% en velas, aromas y textiles seleccionados.',badge:'OFERTA DE TEMPORADA',active:true,start:'2026-09-01',end:'2026-09-15',productIds:['vela-serenidad','difusor-mediterraneo','manta-arena']},
        {id:'promo-nuevos',name:'Nuevos favoritos',description:'Descubre las piezas más recientes de Casa Olivo.',badge:'NUEVA COLECCIÓN',active:true,start:'2026-09-01',end:'2026-10-01',productIds:['taza-olivo','tote-olivo','set-mesa-olivo']}
      ],
      accounts:[{id:'acc_demo',name:'Valentina',email:'valentina@demo.mx',createdAt:new Date().toISOString()}],
      currentAccount:null,
      favorites:{acc_demo:['vela-serenidad','taza-olivo']},
      guestFavorites:[],
      selection:[],
      analytics:seedAnalytics(products),
      settings:{showAccounts:true,showFavorites:true,showAnalytics:true}
    };
  }

  function load(){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw){ const s=initialState(); localStorage.setItem(KEY,JSON.stringify(s)); return s; }
      const state=JSON.parse(raw);
      // Correct the decimal-place issue in untouched demo prices from v4.
      // Preserve edited prices, custom products and merchant configuration.
      if(state.version===4 && state.business?.name==='Casa Olivo'){
        const original={
          'taza-olivo':[18990,null], 'vela-serenidad':[28990,22990],
          'manta-natural':[45990,null], 'difusor-mediterraneo':[32990,26990],
          'tote-olivo':[24990,null], 'vela-campo':[28990,19990],
          'set-mesa-olivo':[38990,null], 'bolsa-lino':[21990,null],
          'manta-arena':[39990,34990], 'taza-campo':[17990,null]
        };
        for(const p of state.products||[]){
          const prices=original[p.id];
          if(prices && p.price===prices[0] && (p.salePrice??null)===prices[1]){
            p.price=Math.round(p.price/100);
            if(p.salePrice!=null)p.salePrice=Math.round(p.salePrice/100);
          }
        }
        state.version=5;
        localStorage.setItem(KEY,JSON.stringify(state));
      }
      return state;
    }catch(e){ const s=initialState(); localStorage.setItem(KEY,JSON.stringify(s)); return s; }
  }

  function save(state, reason='update'){
    localStorage.setItem(KEY,JSON.stringify(state));
    if(channel) channel.postMessage({type:'state',reason,ts:Date.now()});
    window.dispatchEvent(new CustomEvent('casaolivo:state',{detail:{reason}}));
  }

  function sessionId(){
    let id=sessionStorage.getItem(SESSION);
    if(!id){id=uid('s'); sessionStorage.setItem(SESSION,id);}
    return id;
  }

  function record(type,payload={}){
    const s=load();
    const q=new URLSearchParams(location.search);
    const source=payload.source || q.get('src') || document.referrer && new URL(document.referrer).hostname || 'Directo';
    s.analytics.push({id:uid('e'),type,ts:new Date().toISOString(),sessionId:sessionId(),source,...payload});
    if(s.analytics.length>7000) s.analytics=s.analytics.slice(-7000);
    save(s,'analytics');
  }

  function reset(){ const s=initialState(); save(s,'reset'); return s; }

  function updateProduct(product){
    const s=load();
    const idx=s.products.findIndex(p=>p.id===product.id);
    if(idx>=0) s.products[idx]={...s.products[idx],...product};
    else{
      if(s.products.length>=s.business.catalogLimit) throw new Error('Has llegado al límite de productos del catálogo.');
      s.products.unshift({...product,id:product.id||slugify(product.name)||uid('prod')});
    }
    save(s,'product'); return s;
  }
  function deleteProduct(id){ const s=load(); s.products=s.products.filter(p=>p.id!==id); save(s,'product-delete'); return s; }
  function updatePromotion(promo){ const s=load(); const i=s.promotions.findIndex(p=>p.id===promo.id); if(i>=0)s.promotions[i]={...s.promotions[i],...promo}; else s.promotions.unshift({...promo,id:promo.id||uid('promo')}); save(s,'promotion'); return s; }
  function deletePromotion(id){const s=load();s.promotions=s.promotions.filter(p=>p.id!==id);save(s,'promotion-delete');return s;}
  function updateBusiness(patch){ const s=load(); s.business={...s.business,...patch}; save(s,'business'); return s; }

  function createAccount(name,email){ const s=load(); let a=s.accounts.find(x=>x.email.toLowerCase()===email.toLowerCase()); if(!a){a={id:uid('acc'),name,email,createdAt:new Date().toISOString()}; s.accounts.push(a);} s.currentAccount=a.id; if(!s.favorites[a.id])s.favorites[a.id]=[]; save(s,'account'); return a; }
  function logout(){const s=load();s.currentAccount=null;save(s,'logout');}
  function toggleFavorite(productId){ const s=load(); const list=s.currentAccount?(s.favorites[s.currentAccount]||[]):s.guestFavorites; const i=list.indexOf(productId); if(i>=0)list.splice(i,1); else list.push(productId); if(s.currentAccount)s.favorites[s.currentAccount]=list; else s.guestFavorites=list; save(s,'favorite'); record('favorite_toggle',{productId}); return list; }
  function addSelection(productId,qty=1,variant=''){ const s=load(); const item=s.selection.find(x=>x.productId===productId&&x.variant===variant); if(item)item.qty+=qty; else s.selection.push({productId,qty,variant}); save(s,'selection'); record('selection_add',{productId}); return s.selection; }
  function setSelection(items){ const s=load(); s.selection=items; save(s,'selection'); return items; }

  function stats(days=30){
    const s=load(); const since=Date.now()-days*86400000; const ev=s.analytics.filter(e=>new Date(e.ts).getTime()>=since);
    const count=t=>ev.filter(e=>e.type===t).length;
    const active=ev.filter(e=>e.type==='active_seconds').reduce((a,e)=>a+(e.seconds||0),0);
    const sessions=new Set(ev.filter(e=>e.type==='catalog_open').map(e=>e.sessionId));
    const avg=sessions.size?Math.round(active/sessions.size):0;
    const byDay={};
    for(let i=days-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);byDay[d.toISOString().slice(0,10)]={opens:0,whatsapp:0,views:0};}
    ev.forEach(e=>{const k=e.ts.slice(0,10);if(byDay[k]){if(e.type==='catalog_open')byDay[k].opens++;if(e.type==='whatsapp_click')byDay[k].whatsapp++;if(e.type==='product_view')byDay[k].views++;}});
    const prod={}; ev.filter(e=>e.productId).forEach(e=>{prod[e.productId]=prod[e.productId]||{views:0,whatsapp:0,favorites:0};if(e.type==='product_view')prod[e.productId].views++;if(e.type==='whatsapp_click')prod[e.productId].whatsapp++;if(e.type==='favorite_toggle')prod[e.productId].favorites++;});
    const sources={}; ev.filter(e=>e.type==='catalog_open').forEach(e=>sources[e.source]=(sources[e.source]||0)+1);
    return {opens:count('catalog_open'),views:count('product_view'),whatsapp:count('whatsapp_click'),searches:count('search'),avgSeconds:avg,byDay,productStats:prod,sources,events:ev};
  }

  window.CasaStore={KEY,money,slugify,uid,load,save,reset,record,sessionId,updateProduct,deleteProduct,updatePromotion,deletePromotion,updateBusiness,createAccount,logout,toggleFavorite,addSelection,setSelection,stats,channel};
})();
