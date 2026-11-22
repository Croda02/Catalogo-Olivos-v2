/* Independent store merchandising tools: cover/identity and category administration. */
(function(){
  'use strict';
  const S=window.CasaStore;
  const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const previous=renderSettings;
  const msg=error=>toast('No se pudo publicar: '+(error?.message||'error de conexión'));
  const validUrl=value=>!value || value.startsWith('/') || /^https:\/\//i.test(value);
  renderSettings=function(){
    previous();
    const root=document.getElementById('adminContent');
    const current=S.load();
    const b=current.business;
    const section=document.createElement('section');
    section.className='catalog-extras';
    section.innerHTML=`
      <form class="settings-card" id="catalogAppearanceForm">
        <div class="catalog-section-heading"><div><span class="eyebrow">Identidad visual</span><h3>Personaliza la portada</h3><p>Estos textos e imágenes aparecen en la tienda pública.</p></div><button class="btn btn-dark" type="submit">Publicar portada</button></div>
        <div class="catalog-extra-grid">
          <div class="field"><label>Mensaje superior</label><input name="heroEyebrow" maxlength="90" value="${esc(b.heroEyebrow||'Una casa, infinitas historias')}"></div>
          <div class="field"><label>Título principal</label><input name="heroTitle" maxlength="65" value="${esc(b.heroTitle||'Lo cotidiano')}" required></div>
          <div class="field"><label>Palabra o frase destacada</label><input name="heroEmphasis" maxlength="65" value="${esc(b.heroEmphasis||'extraordinario.')}" required></div>
          <div class="field full"><label>Descripción de portada</label><textarea name="heroDescription" rows="3" maxlength="350" required>${esc(b.heroDescription||'Objetos que transforman momentos sencillos en pequeños rituales.')}</textarea></div>
          <div class="field"><label>Imagen de portada (URL)</label><input name="heroImage" value="${esc(b.heroImage||'/hero.jpg')}"><input type="file" id="coverImageFile" accept="image/jpeg,image/png,image/webp,image/avif"><small>También puedes subir tu propia fotografía, máximo 5 MB.</small></div>
          <div class="field"><label>Logotipo (URL opcional)</label><input name="logo" placeholder="Sin logotipo se muestra el símbolo de la plantilla" value="${esc(b.logo||'')}"><input type="file" id="coverLogoFile" accept="image/jpeg,image/png,image/webp,image/avif"><small>Ideal: imagen PNG o WebP con fondo transparente.</small></div>
        </div>
        <div class="catalog-image-preview"><img id="coverImagePreview" src="${esc(b.heroImage||'/hero.jpg')}" alt="Vista previa de portada"><span id="coverUploadStatus" role="status"></span></div>
      </form>
      <section class="settings-card" id="catalogCategoryManager">
        <div class="catalog-section-heading"><div><span class="eyebrow">Organización</span><h3>Categorías</h3><p>Agrega categorías, cámbiales el nombre o elimina las que ya no uses.</p></div></div>
        <form class="catalog-add-category" id="catalogAddCategory"><input name="category" maxlength="60" placeholder="Nombre de la nueva categoría" required><button class="btn btn-dark" type="submit">Agregar categoría</button></form>
        <div class="catalog-category-list" id="catalogCategoryList"></div>
      </section>`;
    root.appendChild(section);
    const hero=section.querySelector('#catalogAppearanceForm');
    const preview=section.querySelector('#coverImagePreview');
    const status=section.querySelector('#coverUploadStatus');
    const upload=(fileInput,field)=>{
      fileInput.addEventListener('change',async()=>{
        if(!fileInput.files?.length)return;
        fileInput.disabled=true;status.textContent='Subiendo imagen…';
        try{
          const url=await window.CasaRemote.uploadImage(fileInput.files[0]);
          hero.elements[field].value=url;
          if(field==='heroImage')preview.src=url;
          status.textContent='Imagen cargada. Pulsa Publicar portada para guardar.';
        }catch(error){status.textContent=error.message;}
        finally{fileInput.disabled=false;fileInput.value='';}
      });
    };
    upload(section.querySelector('#coverImageFile'),'heroImage');
    upload(section.querySelector('#coverLogoFile'),'logo');
    hero.addEventListener('submit',async event=>{
      event.preventDefault();
      const data=Object.fromEntries(new FormData(hero));
      if(!validUrl(data.heroImage)||!validUrl(data.logo)){status.textContent='Usa rutas del catálogo o enlaces seguros HTTPS.';return;}
      const submit=hero.querySelector('button[type=submit]');
      submit.disabled=true;
      try{
        S.updateBusiness({
          heroEyebrow:String(data.heroEyebrow).trim(),heroTitle:String(data.heroTitle).trim(),
          heroEmphasis:String(data.heroEmphasis).trim(),heroDescription:String(data.heroDescription).trim(),
          heroImage:String(data.heroImage).trim(),logo:String(data.logo).trim()
        });
        await window.CasaRemote.flush();
        toast('Portada publicada');
        refresh();
      }catch(error){msg(error);}
      finally{submit.disabled=false;}
    });
    const list=section.querySelector('#catalogCategoryList');
    async function persist(next){
      S.save(next,'categories');
      await window.CasaRemote.flush();
      refresh();toast('Categorías publicadas');
    }
    function categoryRows(){
      const st=S.load();
      list.innerHTML=st.categories.map((name,index)=>{
        const count=st.products.filter(p=>p.category===name).length;
        return '<div class="catalog-category-row"><input data-cat-input="'+index+'" value="'+esc(name)+'" aria-label="Nombre de categoría"><small>'+count+' producto(s)</small><button class="btn btn-outline" type="button" data-cat-rename="'+index+'">Guardar</button><button class="btn btn-outline" type="button" data-cat-delete="'+index+'" '+(count?'disabled title="Reasigna los productos primero"':'')+'>Eliminar</button></div>';
      }).join('') || '<p>No hay categorías. Agrega la primera.</p>';
      list.querySelectorAll('[data-cat-rename]').forEach(btn=>btn.addEventListener('click',async()=>{
        const index=Number(btn.dataset.catRename),next=S.load(),old=next.categories[index];
        const proposed=list.querySelector('[data-cat-input="'+index+'"]').value.trim();
        if(!proposed || proposed.length>60){toast('Nombre de categoría no válido');return;}
        if(next.categories.some((c,i)=>i!==index && c.toLocaleLowerCase('es')===proposed.toLocaleLowerCase('es'))){toast('Esa categoría ya existe');return;}
        next.categories[index]=proposed;
        next.products.forEach(p=>{if(p.category===old)p.category=proposed;});
        btn.disabled=true;
        try{await persist(next)}catch(error){msg(error);btn.disabled=false;}
      }));
      list.querySelectorAll('[data-cat-delete]').forEach(btn=>btn.addEventListener('click',async()=>{
        const index=Number(btn.dataset.catDelete),next=S.load();
        const name=next.categories[index];
        if(next.products.some(p=>p.category===name)){toast('Primero reasigna los productos de esta categoría');return;}
        next.categories.splice(index,1);
        btn.disabled=true;
        try{await persist(next)}catch(error){msg(error);btn.disabled=false;}
      }));
    }
    categoryRows();
    const form=section.querySelector('#catalogAddCategory');
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      const name=form.elements.category.value.trim(),next=S.load();
      if(!name||next.categories.length>=40){toast('Revisa el nombre o el límite de 40 categorías');return;}
      if(next.categories.some(c=>c.toLocaleLowerCase('es')===name.toLocaleLowerCase('es'))){toast('La categoría ya existe');return;}
      next.categories.push(name);
      const btn=form.querySelector('button');btn.disabled=true;
      try{await persist(next)}catch(error){msg(error);btn.disabled=false;}
    });
  };
  render();
})();