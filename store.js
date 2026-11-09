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

  const SAMPLE_DETAILS={"taza-olivo":{"headline":"Un pequeño ritual para empezar bien el día","longDescription":"Una taza de cerámica de inspiración mediterránea, con acabado cálido y detalles botánicos. Su silueta invita a disfrutar el café de la mañana o un té al terminar la tarde. Combínala con textiles neutros para crear un rincón tranquilo.","features":["Acabado cerámico de inspiración artesanal","Decoración botánica en tonos olivo","Asa amplia y cómoda","Pensada para bebidas calientes"],"specs":{"Material":"Cerámica","Color":"Crema / olivo","Presentación":"1 pieza","Cuidado":"Lavado suave recomendado"},"gallery":["/mug.jpg","/hero.jpg","/stone.jpg"]},"vela-serenidad":{"headline":"El aroma que convierte una pausa en un momento especial","longDescription":"Una vela decorativa con atmósfera mediterránea. Ideal para una tarde de lectura, una sobremesa o para regalar un instante de calma. Selecciona el aroma que mejor acompañe tu espacio.","features":["Envase decorativo de acabado suave","Tres opciones aromáticas","Presentación lista para ambientar","Ideal para regalar"],"specs":{"Tipo":"Vela aromática","Aromas":"Higo y olivo, lavanda, cítricos","Presentación":"1 pieza","Uso":"Interior; no dejar encendida sin supervisión"},"gallery":["/candle.jpg","/candle-alt.jpg","/candle-large.jpg","/hero.jpg"]},"manta-natural":{"headline":"Textura, calidez y un toque natural","longDescription":"Manta decorativa de tejido visualmente rico, diseñada para sumar una capa acogedora al sofá o a los pies de la cama. Su combinación de tonos neutros se integra con espacios contemporáneos y cálidos.","features":["Tejido con textura visible","Bordes con flecos","Colores fáciles de combinar","Para sofá, cama o sillón"],"specs":{"Categoría":"Textil decorativo","Acabado":"Tejido texturizado","Colores":"Natural / arena","Cuidados":"Consultar instrucciones de lavado"},"gallery":["/blanket.jpg","/hero.jpg","/desk.jpg"]},"difusor-mediterraneo":{"headline":"Un ambiente agradable desde que entras","longDescription":"Difusor de varillas de estética refinada, ideal para ambientar entradas, recámaras o espacios de trabajo. Su envase de vidrio añade un detalle decorativo discreto mientras las varillas difunden el aroma.","features":["Difusión mediante varillas","Envase decorativo de vidrio","Opciones aromáticas","Ideal para espacios interiores"],"specs":{"Tipo":"Difusor de varillas","Aromas":"Mediterráneo / lavanda","Presentación":"Frasco y varillas","Precaución":"Mantener lejos de niños y mascotas"},"gallery":["/diffuser.jpg","/hero.jpg","/desk.jpg"]},"tote-olivo":{"headline":"Una bolsa que también es parte de tu estilo","longDescription":"Bolsa de lona natural con asas verde olivo, inspirada en la sencillez del diseño mediterráneo. Perfecta para llevar tus objetos cotidianos con un aspecto cuidado y versátil.","features":["Asas amplias","Diseño ligero para uso diario","Estética botánica","Combinación neutra y verde olivo"],"specs":{"Tipo":"Bolsa tote","Color":"Natural / olivo","Material":"Textil tipo lona","Uso":"Accesorio de diario"},"gallery":["/tote.jpg","/hero.jpg","/desk.jpg"]},"vela-campo":{"headline":"Un toque fresco de naturaleza","longDescription":"Una vela de inspiración botánica con notas verdes que acompaña los momentos de descanso. Su estética minimalista combina con piezas en piedra, madera y textiles naturales.","features":["Aroma de inspiración herbal","Envase decorativo","Estilo minimalista","Opción de regalo"],"specs":{"Tipo":"Vela aromática","Fragancia":"Campo de olivos","Presentación":"1 pieza","Uso":"Interior; no dejar encendida sin supervisión"},"gallery":["/candle-large.jpg","/candle.jpg","/hero.jpg"]},"set-mesa-olivo":{"headline":"La mesa también merece detalles especiales","longDescription":"Un conjunto decorativo para transformar una comida sencilla en una mesa acogedora. Inspiración en tonos tierra, cerámica y fibras naturales, para combinar sin esfuerzo.","features":["Estética natural y contemporánea","Conjunto decorativo de mesa","Combina con textiles neutros","Ideal para regalar"],"specs":{"Categoría":"Accesorios de mesa","Estilo":"Mediterráneo","Presentación":"Set de muestra","Disponibilidad":"Sobre pedido"},"gallery":["/stone.jpg","/hero.jpg","/desk.jpg"]},"bolsa-lino":{"headline":"Ligereza para acompañarte todos los días","longDescription":"Una bolsa de estilo natural, fácil de combinar en salidas cotidianas y pequeños recados. Su imagen sobria permite usarla con prendas y accesorios variados.","features":["Diseño versátil","Acabado visual natural","Uso cotidiano","Disponible en dos tonos"],"specs":{"Tipo":"Bolsa de tela","Tonos":"Natural / verde olivo","Uso":"Diario","Cuidado":"Limpieza suave"},"gallery":["/tote.jpg","/desk.jpg","/hero.jpg"]},"manta-arena":{"headline":"Suavidad visual para espacios serenos","longDescription":"Una manta decorativa de tonos arena que completa sillones y recámaras con una textura sutil. Aporta profundidad a ambientes de madera, piedra y lino.","features":["Tonos neutros","Decoración versátil","Textura atractiva","Para sofá o cama"],"specs":{"Categoría":"Textil decorativo","Color":"Arena","Presentación":"1 pieza","Cuidado":"Consultar instrucciones de lavado"},"gallery":["/blanket.jpg","/desk.jpg","/hero.jpg"]},"taza-campo":{"headline":"Cerámica con carácter natural","longDescription":"Taza de inspiración orgánica y acabado sobrio, pensada para esos momentos tranquilos con tu bebida favorita. Consulta su próxima disponibilidad.","features":["Acabado de estética artesanal","Tono piedra","Asa cómoda","Diseño atemporal"],"specs":{"Material":"Cerámica","Color":"Piedra","Presentación":"1 pieza","Disponibilidad":"Agotado"},"gallery":["/mug.jpg","/stone.jpg","/hero.jpg"]}};
  const decorateProduct=p=>p&&SAMPLE_DETAILS[p.id]?{...SAMPLE_DETAILS[p.id],...p,gallery:Array.isArray(p.gallery)&&p.gallery.length?p.gallery:SAMPLE_DETAILS[p.id].gallery,features:Array.isArray(p.features)&&p.features.length?p.features:SAMPLE_DETAILS[p.id].features,specs:p.specs&&Object.keys(p.specs).length?p.specs:SAMPLE_DETAILS[p.id].specs}:p;

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
      business:{name:'Casa Olivo',tagline:'Hogar que inspira',whatsapp:'2288564889',accent:'#31472d',instagram:'@casaolivo',catalogUrl:'https://casa-olivo-demo.vercel.app'},
      categories:['Decoración','Textiles','Aromas','Cocina y mesa','Accesorios','Regalos'],
      products:products.map(decorateProduct),
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
      state.products=(state.products||[]).map(decorateProduct);
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
    if(idx>=0) s.products[idx]=decorateProduct({...s.products[idx],...product});
    else{
      // No se aplican cuotas comerciales desde el navegador. En SaaS deben validarse en servidor.
      s.products.unshift(decorateProduct({...product,id:product.id||slugify(product.name)||uid('prod')}));
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

  function insights(days=30,{includeDemo=false}={}){
    const s=load(),since=Date.now()-days*86400000;
    const events=(s.analytics||[]).filter(e=>new Date(e.ts).getTime()>=since&&(includeDemo||!String(e.sessionId||'').startsWith('seed_')));
    const unique=type=>new Set(events.filter(e=>e.type===type).map(e=>e.sessionId)).size;
    const count=type=>events.filter(e=>e.type===type).length;
    const sessions=new Set(events.filter(e=>e.type==='catalog_open').map(e=>e.sessionId));
    const daily={};for(let i=days-1;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);daily[d.toISOString().slice(0,10)]={visits:0,productViews:0,intents:0};}
    const products={};const searches={};const sources={};const viewed=new Set();const selected=new Set();const sent=new Set();
    for(const e of events){
      const k=e.ts.slice(0,10);
      if(e.type==='catalog_open'){if(daily[k])daily[k].visits++;sources[e.source||'Directo']=(sources[e.source||'Directo']||0)+1;}
      if(e.type==='product_view'){viewed.add(e.sessionId);if(daily[k])daily[k].productViews++;}
      if(e.type==='selection_add')selected.add(e.sessionId);
      if(e.type==='order_intent'){sent.add(e.sessionId);if(daily[k])daily[k].intents++;}
      if(e.type==='search'&&e.query){const term=String(e.query).toLowerCase().trim();if(term)searches[term]=(searches[term]||0)+1;}
      if(e.productId){const p=products[e.productId]||(products[e.productId]={views:0,adds:0,contacts:0,favorites:0});if(e.type==='product_view')p.views++;if(e.type==='selection_add')p.adds++;if(e.type==='whatsapp_click')p.contacts++;if(e.type==='favorite_toggle')p.favorites++;}
    }
    const visits=sessions.size,viewedCount=[...viewed].filter(x=>sessions.has(x)).length,selectedCount=[...selected].filter(x=>sessions.has(x)).length,sentCount=[...sent].filter(x=>sessions.has(x)).length;
    const noResult=events.filter(e=>e.type==='search_no_results');
    const abandoned=Math.max(0,selectedCount-sentCount);
    return {days,includeDemo,visits,views:count('product_view'),viewedCount,selectedCount,sentCount,whatsappClicks:count('whatsapp_click'),searchCount:count('search'),noResultQueries:noResult.map(e=>e.query).filter(Boolean),abandoned,rate:visits?sentCount/visits*100:0,products,sources,searches,daily,events,seedExcluded:(s.analytics||[]).filter(e=>String(e.sessionId||'').startsWith('seed_')).length,localOnly:true};
  }
  window.CasaStore={insights,KEY,money,slugify,uid,load,save,reset,record,sessionId,updateProduct,deleteProduct,updatePromotion,deletePromotion,updateBusiness,createAccount,logout,toggleFavorite,addSelection,setSelection,stats,channel};
})();
