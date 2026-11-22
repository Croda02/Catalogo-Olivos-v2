/* Casa Olivo: one-store remote persistence. The publishable key is intentionally public;
   ownership is enforced by Supabase Auth + PostgreSQL RLS, never by this file. */
(function () {
  'use strict';
  const SUPABASE_URL = 'https://eastlkfmoorylghapieq.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_M8aIchebg6apd8fIROKuXA_vEGzKqg4';
  const STORE_ID = 'casa-olivo';
  const OWNER_EMAIL = 'contacto@jcroda.com.mx';
  const PRODUCT_PUBLIC_FIELDS = ['id','name','sku','category','description','price','salePrice','image','active','availability','featured','isNew','bestSeller','tags','variants','headline','longDescription','features','specs','gallery'];
  const BUSINESS_PUBLIC_FIELDS = ['name','tagline','whatsapp','whatsappTemplates','accent','instagram','catalogUrl','logo','heroEyebrow','heroTitle','heroEmphasis','heroDescription','heroImage'];
  const TRACK_TYPES = new Set(['catalog_open','product_view','whatsapp_click','selection_add','search','search_no_results','favorite_toggle','active_seconds']);
  const client = window.supabase && window.supabase.createClient
    ? window.supabase.createClient(SUPABASE_URL, PUBLISHABLE_KEY, {auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}})
    : null;
  let owner = false;
  let lastWrite = Promise.resolve();
  let lastError = null;

  function pick(obj, fields) {
    const out = {};
    fields.forEach(function (key) { if (obj && Object.prototype.hasOwnProperty.call(obj,key)) out[key]=obj[key]; });
    return out;
  }
  function stateToPublished(state) {
    return {
      business: pick(state.business, BUSINESS_PUBLIC_FIELDS),
      categories: (state.categories || []).slice(0,100),
      products: (state.products || []).map(function(p){return pick(p,PRODUCT_PUBLIC_FIELDS);}),
      promotions: (state.promotions || []).map(function(p){
        return pick(p,['id','name','description','badge','active','start','end','productIds']);
      })
    };
  }
  function stateToPrivate(state) {
    const costs = {};
    (state.products || []).forEach(function (p) {
      costs[p.id] = {costPrice:p.costPrice==null?null:Number(p.costPrice),stockQty:p.stockQty==null?null:Number(p.stockQty)};
    });
    return {products:costs,business:{targetMargin:Number(state.business.targetMargin)||30}};
  }
  function status(message, error) {
    const el = document.getElementById('cloudStatus');
    if (el) {
      el.textContent = message;
      el.style.color = error ? '#a13d32' : '#31593b';
    }
  }
  function mustClient() {
    if (!client) throw new Error('No se pudo cargar la conexión segura. Comprueba tu conexión a Internet.');
    return client;
  }
  async function fetchPublic() {
    const {data,error} = await mustClient().from('catalog_published').select('data').eq('id',STORE_ID).single();
    if (error) throw error;
    return data.data;
  }
  async function initPublic() {
    try {
      const published = await fetchPublic();
      window.CasaStore.applyCloud(published, null, null);
      return true;
    } catch (error) {
      console.error('No se pudo actualizar el catálogo',error);
      const el=document.getElementById('cloudWarning');
      if(el) {el.hidden=false;el.textContent='Catálogo temporalmente sin conexión. El contenido mostrado es una muestra local; confirma la información por WhatsApp.';}
      return false;
    }
  }
  async function authorize() {
    const api=mustClient();
    const {data,error} = await api.auth.getUser();
    if (error || !data || !data.user) return false;
    const email = String(data.user.email || '').toLowerCase();
    if (email !== OWNER_EMAIL) return false;
    const result = await api.from('catalog_owners').select('email').eq('email',email).maybeSingle();
    owner = !result.error && !!result.data;
    return owner;
  }
  async function initOwner() {
    if(!await authorize()) throw new Error('No tienes autorización para gestionar este catálogo.');
    const published=await fetchPublic();
    const privResult=await client.from('catalog_private').select('data').eq('id',STORE_ID).single();
    if(privResult.error)throw privResult.error;
    const eventsResult=await client.from('catalog_events').select('event_type,product_id,session_id,source,query,seconds,created_at').order('created_at',{ascending:false}).limit(5000);
    if(eventsResult.error)throw eventsResult.error;
    const events=(eventsResult.data || []).map(function(e){
      return {type:e.event_type,productId:e.product_id,sessionId:e.session_id,source:e.source,query:e.query,seconds:e.seconds,ts:e.created_at};
    });
    window.CasaStore.applyCloud(published,privResult.data.data,events);
    status('Conectado · Los cambios se publican para todos los visitantes');
  }
  function queueAdminSave() {
    if (!owner) return Promise.reject(new Error('Inicia sesión como propietario antes de guardar.'));
    const snapshot = window.CasaStore.load();
    const pub = stateToPublished(snapshot);
    const priv = stateToPrivate(snapshot);
    status('Publicando cambios…');
    lastWrite = lastWrite.catch(function(){ /* allow retry after a failed request */ }).then(async function(){
      const pubResult=await client.from('catalog_published').update({data:pub,updated_at:new Date().toISOString()}).eq('id',STORE_ID).select('id').single();
      if (pubResult.error) throw pubResult.error;
      const privResult=await client.from('catalog_private').update({data:priv,updated_at:new Date().toISOString()}).eq('id',STORE_ID).select('id').single();
      if (privResult.error) throw privResult.error;
      lastError=null;
      status('Publicado · Visible para todos los visitantes');
      return true;
    }).catch(function(e){
      lastError=e;
      status('Error al publicar: '+e.message+'. Conserva esta ventana y vuelve a guardar.',true);
      throw e;
    });
    lastWrite.catch(function(){});
    return lastWrite;
  }
  function track(type,payload) {
    if(!TRACK_TYPES.has(type) || !client) return;
    const info = payload || {};
    let sid = String(info.sessionId || '');
    if(sid.length < 8 || sid.length > 100)return;
    const row = {
      event_type:type,session_id:sid,product_id:info.productId?String(info.productId).slice(0,120):null,
      source:info.source?String(info.source).slice(0,120):null,
      query:info.query?String(info.query).slice(0,120):null,
      seconds:type==='active_seconds'?Math.max(0,Math.min(7200,Math.round(Number(info.seconds)||0))):null
    };
    client.from('catalog_events').insert(row).then(function(result){
      if(result.error) console.warn('Interacción no registrada',result.error.message);
    });
  }
  async function uploadImage(file) {
    if(!owner)throw new Error('Inicia sesión para subir imágenes.');
    if(!file || !['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))throw new Error('Selecciona una imagen JPG, PNG, WebP o AVIF.');
    if(file.size > 5*1024*1024)throw new Error('La imagen debe pesar menos de 5 MB.');
    const extension = { 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif' }[file.type];
    const path = 'products/'+crypto.randomUUID()+'.'+extension;
    const result = await client.storage.from('catalog-media').upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});
    if(result.error)throw result.error;
    return client.storage.from('catalog-media').getPublicUrl(path).data.publicUrl;
  }
  async function sendOwnerLink() {
    const result=await mustClient().auth.signInWithOtp({
      email:OWNER_EMAIL,
      options:{emailRedirectTo:location.origin+'/admin',shouldCreateUser:true}
    });
    if(result.error)throw result.error;
    return true;
  }
  async function verifyPastedLink(link) {
    const url=new URL(String(link).trim());
    if(url.hostname !== new URL(SUPABASE_URL).hostname)throw new Error('Utiliza el enlace de Supabase recibido por correo.');
    const token=url.searchParams.get('token') || url.searchParams.get('token_hash');
    if(!token)throw new Error('No se encontró un token válido en el enlace.');
    const kind=url.searchParams.get('type');
    const primary=kind==='email'?'email':'magiclink';
    let result=await mustClient().auth.verifyOtp({token_hash:token,type:primary});
    if(result.error && primary==='magiclink'){
      result=await mustClient().auth.verifyOtp({token_hash:token,type:'email'});
    }
    if(result.error)throw result.error;
    return true;
  }
  async function signOut() {
    owner=false;
    if(window.CasaStore && window.CasaStore.forgetPrivate)window.CasaStore.forgetPrivate();
    return mustClient().auth.signOut();
  }
  window.CasaRemote={
    client:client,ownerEmail:OWNER_EMAIL,initPublic:initPublic,initOwner:initOwner,
    authorize:authorize,sendOwnerLink:sendOwnerLink,verifyPastedLink:verifyPastedLink,
    queueAdminSave:queueAdminSave,flush:function(){return lastWrite;},
    track:track,uploadImage:uploadImage,signOut:signOut,
    isOwner:function(){return owner;},lastError:function(){return lastError;},
    stateToPublished:stateToPublished,stateToPrivate:stateToPrivate
  };
})();
