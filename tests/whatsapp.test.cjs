const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const memory=new Map();
const window={dispatchEvent(){},addEventListener(){}};
const localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)};
const sessionStorage={getItem:k=>memory.get('session-'+k)||null,setItem:(k,v)=>memory.set('session-'+k,v)};
const context={window,localStorage,sessionStorage,CustomEvent:class CustomEvent{},document:{referrer:''},location:{search:''},URLSearchParams:class URLSearchParams{get(){return null;}},BroadcastChannel:undefined,Intl,Date,Math,Set,Map,Number,Object,Array,String,RegExp,JSON};
vm.runInNewContext(fs.readFileSync('store.js','utf8'),context,{filename:'store.js'});
vm.runInNewContext(fs.readFileSync('whatsapp-messages.js','utf8'),context,{filename:'whatsapp-messages.js'});
const S=window.CasaStore,M=window.CasaMessages;
test('las plantillas iniciales crean un mensaje claro de producto',()=>{
 const result=M.build(S.load(),'product',[{productId:'taza-olivo',qty:2,variant:'Olivo'}]);
 assert.equal(result.ok,true);
 assert.match(result.text,/Taza Olivo/);
 assert.match(result.text,/378/);
 assert.ok(result.url.startsWith('https://wa.me/522288564889?text='));
});
test('el comercio puede guardar textos propios y conservarlos',()=>{
 S.updateBusiness({whatsappTemplates:{product:'Me interesa {producto}, {cantidad} unidades: {subtotal}',general:'¿Pueden ayudarme en {tienda}?',order:'Quiero pedir:\n{lista_productos}\nTotal {subtotal}'}});
 assert.equal(S.load().business.whatsappTemplates.product,'Me interesa {producto}, {cantidad} unidades: {subtotal}');
 const result=M.build(S.load(),'product',[{productId:'taza-olivo',qty:3,variant:'Arena'}]);
 assert.equal(result.text,'Me interesa Taza Olivo, 3 unidades: $567.');
});
test('pedido completo incluye todos los artículos',()=>{
 const result=M.build(S.load(),'order',[{productId:'taza-olivo',qty:2},{productId:'vela-serenidad',qty:1,variant:'Lavanda'}]);
 assert.equal(result.ok,true);
 assert.match(result.text,/Taza Olivo/);
 assert.match(result.text,/Vela Serenidad/);
 assert.match(result.text,/607/);
});
test('productos agotados no se envían al WhatsApp',()=>{
 const result=M.build(S.load(),'product',[{productId:'taza-campo',qty:1}]);
 assert.equal(result.ok,false);
});
test('rechaza variables no permitidas y mensajes excesivos',()=>{
 assert.equal(M.validateTemplate('Hola {inseguro}').ok,false);
 assert.equal(M.validateTemplate('a'.repeat(901)).ok,false);
 assert.throws(()=>S.updateBusiness({whatsappTemplates:{general:'Hola {clave}'}}));
});
test('normaliza México y rechaza números inválidos',()=>{
 assert.equal(M.normalizePhone('228 856 4889'),'522288564889');
 assert.equal(M.normalizePhone('+52 228 856 4889'),'522288564889');
 assert.equal(M.normalizePhone('número privado'),null);
});
test('los límites no se pueden alterar desde configuración del comercio',()=>{
 S.updateBusiness({catalogLimit:900000,name:'Casa prueba'});
 assert.equal(Object.hasOwn(S.load().business,'catalogLimit'),false);
 assert.equal(S.load().business.name,'Casa prueba');
});
