(() => {
 'use strict';
 const e=window.LovePhotoEditor, data=window.LOVE_SITE_DATA, grid=document.getElementById('photoPageGrid'), exportButton=document.getElementById('exportPhotoChanges');
 if(!e || !data){document.getElementById('photoPageError').textContent='Could not load the editor or configuration. Extract the complete ZIP before opening this page.';return;}
 const previews=new Map();
 function refresh(key){const t=e.targets[key], img=previews.get(key);if(!img)return;const name=t.get();img.hidden=true;if(name){img.onload=()=>img.hidden=false;img.onerror=()=>img.hidden=true;img.src=e.url('assets/images/'+t.folder+'/'+encodeURIComponent(name));}}
 for(const key of Object.keys(e.targets)){
   const title=key==='final'?'Babi’s anniversary letter':key.startsWith('memory-')?data.memories[Number(key.slice(7))].title:'Open when '+data.openWhen[Number(key.slice(7))].label;
   const tile=document.createElement('article');tile.className='editor-tile';const heading=document.createElement('h2');heading.textContent=title;
   const label=document.createElement('label');label.className='editor-preview';const img=document.createElement('img');img.alt=title;img.hidden=true;previews.set(key,img);
   const badge=document.createElement('span');badge.textContent='Click to choose photo';const input=document.createElement('input');input.type='file';input.accept='image/*,.jpg,.jpeg,.png,.webp,.avif';input.setAttribute('aria-label','Upload photo for '+title);input.addEventListener('change',()=>{const f=input.files[0];input.value='';if(f)void e.saveFile(key,f,()=>refresh(key));});
   label.append(img,badge,input);tile.append(heading,label,e.control(key,()=>refresh(key),'Or choose a file'));grid.append(tile);refresh(key);
 }
 exportButton.disabled=false;exportButton.addEventListener('click',e.exportPhotos);
 e.ready.then(()=>Object.keys(e.targets).forEach(refresh));
})();
