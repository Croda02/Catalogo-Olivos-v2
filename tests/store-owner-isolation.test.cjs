const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {join}=require('node:path');
const vm=require('node:vm');

function store(){
  const publicCache=new Map(),ownerCache=new Map();
  const localStorage={getItem:k=>publicCache.get(k)??null,setItem:(k,v)=>publicCache.set(k,v),removeItem:k=>publicCache.delete(k)};
  const sessionStorage={getItem:k=>ownerCache.get(k)??null,setItem:(k,v)=>ownerCache.set(k,v),removeItem:k=>ownerCache.delete(k)};
  let authorized=false, publishedAttempts=0;
  const window={
    dispatchEvent(){},
    CasaRemote:{isOwner:()=>authorized,queueAdminSave:()=>{publishedAttempts++;return Promise.resolve(true)}}
  };
  vm.runInNewContext(readFileSync(join(__dirname,'..','store.js'),'utf8'),{
    window,localStorage,sessionStorage,CustomEvent:class CustomEvent{},
    document:{referrer:''},location:{search:''},
    URLSearchParams,Intl,Date,Math,Set,Map,Number,Object,Array,String,RegExp,JSON
  },{filename:'store.js'});
  return {S:window.CasaStore,publicCache,ownerCache,setOwner:v=>{authorized=v},attempts:()=>publishedAttempts};
}

test('private owner fields stay in tab session, never shared buyer local storage',()=>{
  const {S,publicCache,ownerCache,setOwner,attempts}=store();
  S.load();
  setOwner(true);
  S.applyCloud({
    business:{name:'Casa Olivo',whatsapp:'2288564889',accent:'#31472d'},
    categories:['Tazas'],
    products:[{id:'test-taza',name:'Taza',price:120,image:'/mug.jpg',active:true}],
    promotions:[]
  },{
    products:{'test-taza':{costPrice:54,stockQty:5}},
    business:{targetMargin:32}
  },[]);
  assert.equal(S.load().products[0].costPrice,54);
  assert.equal(S.load().products[0].stockQty,5);
  assert.equal(S.load().business.targetMargin,32);
  assert(!String(publicCache.get(S.KEY)||'').includes('test-taza'));
  assert(String([...ownerCache.values()].join('')).includes('test-taza'));

  S.updateProduct({...S.load().products[0],price:125});
  assert.equal(attempts(),1);
  assert.equal(S.load().products[0].price,125);
  assert(!String(publicCache.get(S.KEY)||'').includes('test-taza'));

  setOwner(false);
  assert.notEqual(S.load().products[0].id,'test-taza');
  S.forgetPrivate();
  assert.equal([...ownerCache.keys()].some(k=>k.includes('owner')),false);
});

test('buyer remote synchronization only writes published product fields',()=>{
  const {S,publicCache}=store();
  S.applyCloud({
    business:{name:'Casa Olivo',whatsapp:'2288564889'},
    categories:['Tazas'],
    products:[{id:'test-taza',name:'Taza',price:125,image:'/mug.jpg',active:true}],
    promotions:[]
  },null,null);
  assert.equal(S.load().products[0].price,125);
  assert.equal(S.load().products[0].costPrice,undefined);
  assert(!String(publicCache.get(S.KEY)).includes('costPrice'));
});
