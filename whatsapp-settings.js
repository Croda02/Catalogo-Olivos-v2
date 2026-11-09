/* Configuración de WhatsApp con previsualización y validación. */
(function(){
'use strict';
const S=window.CasaStore,M=window.CasaMessages;
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const original=renderSettings;
renderSettings=function(){
 original();
 const form=$('#businessForm');
 if(!form)return;
 const merchant=S.load().business;
 const wrap=document.createElement('section');
 wrap.className='wa-settings full';
 wrap.innerHTML=`<div class="wa-settings-heading"><span class="eyebrow">Atención comercial</span><h3>Mensajes de WhatsApp</h3><p>Personaliza el primer mensaje que el cliente tendrá preparado al abrir WhatsApp. No se envía automáticamente: el cliente debe confirmarlo.</p></div>
 <div class="wa-settings-grid">
  <div class="wa-templates">
   <label for="waTemplateGeneral">Consulta general</label><textarea id="waTemplateGeneral" rows="3" maxlength="900">${esc(M.templateFor(merchant,'general'))}</textarea>
   <label for="waTemplateProduct">Consulta por producto</label><textarea id="waTemplateProduct" rows="4" maxlength="900">${esc(M.templateFor(merchant,'product'))}</textarea>
   <label for="waTemplateOrder">Consulta de pedido completo</label><textarea id="waTemplateOrder" rows="5" maxlength="900">${esc(M.templateFor(merchant,'order'))}</textarea>
   <p class="wa-variable-note"><strong>Variables permitidas:</strong> ${M.keys.map(k=>'<code>{'+k+'}</code>').join(' ')}</p>
   <p id="waSettingsError" class="wa-settings-error" role="alert" hidden></p>
  </div>
  <aside class="wa-preview"><strong>Vista previa</strong><small>Se actualizará con un producto de ejemplo de este catálogo.</small>
    <div class="wa-preview-tabs"><button type="button" data-wa-preview="general" class="active">General</button><button type="button" data-wa-preview="product">Producto</button><button type="button" data-wa-preview="order">Pedido</button></div>
    <div class="wa-message-preview" id="waMessagePreview" aria-live="polite"></div>
    <button type="button" id="waRestoreDefaults" class="wa-restore">Restaurar textos predeterminados</button>
  </aside>
 </div>`;
 const phoneField=form.querySelector('[name=whatsapp]')?.closest('.field');
 if(phoneField){phoneField.classList.add('wa-number-field');phoneField.querySelector('label').textContent='Número de WhatsApp con lada';wrap.insertBefore(phoneField,wrap.querySelector('.wa-settings-grid'));}
  const submit=form.querySelector('.full > button[type=submit], .full > button.btn-dark');
 if(submit&&submit.parentElement)submit.parentElement.before(wrap);else form.appendChild(wrap);
 let active='product';
 const fields={general:$('#waTemplateGeneral'),product:$('#waTemplateProduct'),order:$('#waTemplateOrder')};
 function preview(){
   const p=S.load().products.find(x=>x.active)||{name:'Producto de ejemplo',price:200,variants:[]};
   const business={...S.load().business,name:form.querySelector('[name=name]').value,whatsapp:form.querySelector('[name=whatsapp]').value,whatsappTemplates:Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value]))};
   const data={...S.load(),business};
   const v=M.build(data,active,active==='general'?[]:[{productId:p.id,qty:2,variant:p.variants?.[0]||''}]);
   $('#waMessagePreview').textContent=v.ok?v.text:v.error;
   const phone=M.normalizePhone(business.whatsapp);
   $('#waSettingsError').hidden=!!phone;
   if(!phone)$('#waSettingsError').textContent='Introduce un número válido con lada. Para México puedes escribir diez dígitos o +52.';
 }
 for(const [k,t] of Object.entries(fields))t.addEventListener('input',preview);
 form.querySelector('[name=whatsapp]').addEventListener('input',preview);
 form.querySelector('[name=name]').addEventListener('input',preview);
 wrap.querySelectorAll('[data-wa-preview]').forEach(b=>b.onclick=()=>{active=b.dataset.waPreview;wrap.querySelectorAll('[data-wa-preview]').forEach(x=>x.classList.toggle('active',x===b));preview()});
 $('#waRestoreDefaults').onclick=()=>{for(const [k,t] of Object.entries(fields))t.value=M.templates[k];preview()};
 form.onsubmit=event=>{
  event.preventDefault();
  const fd=new FormData(form);
  const whatsapp=String(fd.get('whatsapp')||'').trim();
  const phone=M.normalizePhone(whatsapp);
  const error=$('#waSettingsError');
  if(!phone){error.textContent='Configura un número válido antes de guardar.';error.hidden=false;return;}
  for(const [key,field] of Object.entries(fields)){
   const result=M.validateTemplate(field.value);
   if(!result.ok){error.textContent='Mensaje '+key+': '+result.error;error.hidden=false;field.focus();return;}
  }
  try{
   S.updateBusiness({
    name:String(fd.get('name')||'').trim().slice(0,90),
    tagline:String(fd.get('tagline')||'').trim().slice(0,120),
    whatsapp,
    whatsappTemplates:Object.fromEntries(Object.entries(fields).map(([k,field])=>[k,field.value.trim()]))
   });
   refresh();
   toast('WhatsApp y mensajes guardados en esta demostración');
  }catch(err){error.textContent=err.message;error.hidden=false;}
 };
 preview();
};
render();
})();