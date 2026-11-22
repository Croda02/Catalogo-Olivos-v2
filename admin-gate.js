/* Owner-only bootstrap. Merchant modules are loaded only after a server-authorized Supabase session. */
(function(){
  'use strict';
  const gate=document.getElementById('ownerGate');
  const shell=document.querySelector('.admin-shell');
  const message=document.getElementById('ownerGateMessage');
  const send=document.getElementById('sendOwnerLink');
  const verify=document.getElementById('verifyOwnerLink');
  const paste=document.getElementById('ownerLinkInput');
  function notice(s,bad){
    if(message){message.textContent=s;message.style.color=bad?'#a33e36':'#31593b';}
  }
  function loadScript(src){
    return new Promise(function(resolve,reject){
      const s=document.createElement('script');
      s.src=src;s.onload=resolve;s.onerror=function(){reject(new Error('No se pudo cargar '+src));};
      document.body.appendChild(s);
    });
  }
  async function activate(){
    await window.CasaRemote.initOwner();
    gate.hidden=true;
    shell.hidden=false;
    for(const src of ['/admin.js','/admin-insights.js','/decision-engine.js','/decision-ui.js','/whatsapp-messages.js','/whatsapp-settings.js']){
      await loadScript(src);
    }
    const top=document.querySelector('.admin-user');
    if(top){
      const btn=document.createElement('button');
      btn.type='button';btn.className='btn btn-outline';btn.style.marginLeft='12px';
      btn.textContent='Cerrar sesión';
      btn.addEventListener('click',async function(){await window.CasaRemote.signOut();location.reload();});
      top.appendChild(btn);
    }
    window.addEventListener('casaolivo:state',function(e){
      if(e.detail && e.detail.reason==='cloud' && typeof refresh==='function')refresh();
    });
  }
  send.addEventListener('click',async function(){
    send.disabled=true;notice('Solicitando acceso…',false);
    try{
      await window.CasaRemote.sendOwnerLink();
      notice('Revisa el correo autorizado. Abre el enlace para iniciar sesión. Si no regresa al panel, cópialo y pégalo abajo.',false);
    }catch(e){notice('No se pudo enviar el enlace: '+e.message,true);}
    finally{send.disabled=false;}
  });
  verify.addEventListener('click',async function(){
    verify.disabled=true;
    try{
      await window.CasaRemote.verifyPastedLink(paste.value);
      paste.value='';
      notice('Sesión verificada. Cargando panel…',false);
      await activate();
    }catch(e){notice(e.message,true);}
    finally{verify.disabled=false;}
  });
  (async function(){
    notice('Comprobando tu sesión segura…',false);
    try{
      if(await window.CasaRemote.authorize()){ await activate(); return;}
      notice('Accede desde el correo autorizado para administrar el catálogo.',false);
    }catch(e){notice('No se pudo verificar la sesión: '+e.message,true);}
  })();
})();
