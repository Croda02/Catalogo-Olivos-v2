const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const files=[
 'store.js','app.js','admin.js','admin-insights.js','decision-engine.js',
 'decision-ui.js','whatsapp-messages.js','whatsapp-settings.js','product-detail.js',
 'premium.js','catalog-cloud.js','admin-gate.js','catalog-extras.js','sw.js'
];
for(const file of files){
 test(file+' parses as JavaScript',()=>{
   const src=fs.readFileSync(path.join(root,file),'utf8');
   assert.doesNotThrow(()=>new vm.Script(src,{filename:file}));
 });
}
for(const page of ['index.html','admin.html']){
 test(page+' references existing local scripts',()=>{
   const src=fs.readFileSync(path.join(root,page),'utf8');
   const matches=[...src.matchAll(/<script[^>]+src="\/([^"]+\.js)"/g)];
   assert(matches.length>=2,'At least two local scripts expected');
   matches.forEach(m=>assert(fs.existsSync(path.join(root,m[1])),'Missing '+m[1]));
 });
}
