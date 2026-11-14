/* Progressive enhancement only: never collects data or changes quotation values. */
(()=>{'use strict';
 const root=document.documentElement, button=document.querySelector('.mobile-menu-toggle'),nav=document.getElementById('site-navigation'),mobile=matchMedia('(max-width:860px)');
 if(!button||!nav)return;
 root.classList.add('mobile-enhanced');
 const setMenu=open=>{nav.classList.toggle('is-open',open);button.setAttribute('aria-expanded',String(open));};
 button.addEventListener('click',()=>setMenu(button.getAttribute('aria-expanded')!=='true'));
 nav.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){setMenu(false);button.focus();}});
 document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))setMenu(false);});
 const onResize=()=>{setMenu(false);root.classList.remove('is-editing');};
 if(mobile.addEventListener)mobile.addEventListener('change',onResize);else mobile.addListener(onResize);
 // Expandable detail defaults on phones only; users can always open it.
 if(mobile.matches)document.querySelectorAll('.mobile-service-note,.mobile-result-details').forEach(d=>d.open=false);
 // Keep the contact bar away from the keyboard and editable fields.
 const editable=e=>e&&e.matches('input:not([type=checkbox]):not([type=radio]):not([type=button]),textarea,select');
 document.addEventListener('focusin',e=>{if(mobile.matches&&editable(e.target))root.classList.add('is-editing');});
 document.addEventListener('focusout',()=>setTimeout(()=>{if(!editable(document.activeElement))root.classList.remove('is-editing');},0));

 if('serviceWorker' in navigator && location.protocol === 'https:'){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});},{once:true});
 }
})();
