const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

const source=readFileSync(join(__dirname,'..','catalog-cloud.js'),'utf8');

function boot(overrides={}){
  const posted=[];
  const userEmail=overrides.email||'contacto@jcroda.com.mx';
  const mock={
    auth:{getUser:async()=>({data:{user:{email:userEmail}},error:null})},
    from(table){
      return {
        insert:row=>{posted.push({table,row});return Promise.resolve({error:null});},
        select:()=>({
          eq:()=>({
            maybeSingle:async()=>({data:table==='catalog_owners'?{email:userEmail}:null,error:null})
          })
        })
      };
    }
  };
  const state={
    business:{name:'Prueba',tagline:'Ejemplo',whatsapp:'5512345678',targetMargin:40,whatsappTemplates:{general:'Hola'}},
    categories:['Hogar'],
    products:[{id:'a',name:'Taza',price:120,costPrice:54,stockQty:7,active:true,image:'/mug.jpg'}],
    promotions:[],
    analytics:[{type:'fake'}],
    accounts:[{email:'guest@example.com'}],
    guestFavorites:['a']
  };
  const w={supabase:{createClient:()=>mock},CasaStore:{load:()=>state}};
  const context={window:w,document:{getElementById:()=>null},URL,Set,crypto:{randomUUID:()=>'uuid'},location:{origin:'https://catalogo-olivos-v2.vercel.app'},console};
  vm.runInNewContext(source,context,{filename:'catalog-cloud.js'});
  return {remote:w.CasaRemote,state,posted,mock};
}

test('public projection never includes costs, stock, profiles or analytics',()=>{
  const {remote,state}=boot();
  const pub=remote.stateToPublished(state);
  assert.equal(pub.business.name,'Prueba');
  assert.equal(pub.business.targetMargin,undefined);
  assert.equal(pub.products[0].costPrice,undefined);
  assert.equal(pub.products[0].stockQty,undefined);
  assert.equal(pub.accounts,undefined);
  assert.equal(pub.analytics,undefined);
  assert.equal(pub.products.length,1);
});

test('private projection retains owner-only stock and cost',()=>{
  const {remote,state}=boot();
  const priv=remote.stateToPrivate(state);
  assert.equal(priv.products.a.costPrice,54);
  assert.equal(priv.products.a.stockQty,7);
  assert.equal(priv.business.targetMargin,40);
});

test('unauthorized email cannot activate merchant role',async()=>{
  const {remote}=boot({email:'stranger@example.com'});
  assert.equal(await remote.authorize(),false);
  assert.equal(remote.isOwner(),false);
});

test('analytics only accepts approved anonymous event types',async()=>{
  const {remote,posted}=boot();
  remote.track('catalog_open',{sessionId:'abcdefghij',source:'QR',customerEmail:'private@example.com'});
  remote.track('sale',{sessionId:'abcdefghij',amount:300});
  await Promise.resolve();
  assert.equal(posted.length,1);
  assert.equal(posted[0].row.event_type,'catalog_open');
  assert.equal(posted[0].row.customerEmail,undefined);
  assert.equal(posted[0].row.session_id,'abcdefghij');
});
