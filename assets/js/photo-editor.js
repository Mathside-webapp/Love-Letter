/* Personal photo editing is local until the exported files are published. */
(() => {
  'use strict';
  const standalone = /(?:^|\/)edit-photos\.html$/i.test(location.pathname);
  const enabled = standalone || !!document.getElementById('photoPageGrid') || new URLSearchParams(location.search).get('edit') === '1';
  const records = new Map(), urls = new Map();
  const data = window.LOVE_SITE_DATA;
  if (!data) { console.error('Missing configuration'); return; }
  const encoder = new TextEncoder();
  const targets = {
    'final': {folder:'letters', get:()=>data.finalPhoto, set:v=>data.finalPhoto=v},
  };
  (data.memories||[]).forEach((m,i)=>targets['memory-'+i]={folder:'memories',get:()=>m.image,set:v=>m.image=v});
  (data.openWhen||[]).forEach((m,i)=>targets['letter-'+i]={folder:'letters',get:()=>m.image,set:v=>m.image=v});
  const status = (s) => { const el=document.getElementById('photoEditStatus'); if(el) el.textContent=s; };
  let db;
  function openDB(){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Storage did not respond')),1800);const req=indexedDB.open('love-letter-photo-drafts-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('photos',{keyPath:'key'});req.onsuccess=()=>{clearTimeout(timer);resolve(req.result);};req.onerror=()=>{clearTimeout(timer);reject(req.error);};req.onblocked=()=>{clearTimeout(timer);reject(new Error('Storage blocked'));};});}
  function readAll(){return new Promise((resolve,reject)=>{const req=db.transaction('photos').objectStore('photos').getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  function write(record){return new Promise((resolve,reject)=>{const tx=db.transaction('photos','readwrite');tx.objectStore('photos').put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
  function apply(record){const t=targets[record.key];if(!t)return;const old=records.get(record.key);if(old){const k=old.path;URL.revokeObjectURL(urls.get(k));urls.delete(k);} records.set(record.key,record);urls.set(record.path,URL.createObjectURL(record.blob));t.set(record.name);}
  const ready=enabled?(async()=>{try{db=await openDB();for(const r of await Promise.race([readAll(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Storage read timed out')),1800))]))if(!records.has(r.key))apply(r);}catch(e){console.warn('Local photo storage unavailable',e);}})():Promise.resolve();
  const mimeExt={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'};
  function validate(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve();};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Cannot read this image. Try JPG, PNG or WebP.'));};img.src=url;});}
  async function saveFile(key,file,onSaved){
    if(!file||!enabled||!targets[key])return;
    try{
      status('Reading photo…');
      const ext=mimeExt[file.type]||(/\.(jpe?g|png|webp|avif)$/i.exec(file.name)||[])[1]?.toLowerCase();
      if(!ext)throw new Error('Choose a JPG, PNG, WebP or AVIF image. For HEIC, export as JPEG first.');
      if(file.size>25*1024*1024)throw new Error('Choose an image smaller than 25 MB.');
      await validate(file);
      const name=`personal-${key}-${Date.now()}.${ext}`,path=`assets/images/${targets[key].folder}/${name}`;
      const record={key,name,path,blob:file};
      apply(record); // Never block the immediate preview on browser storage.
      status('Photo selected. Export ZIP to keep your changes.');
      try{onSaved?.();}catch(e){console.warn(e);}
      document.dispatchEvent(new CustomEvent('love-photo-changed',{detail:{key}}));
      if(db)try{await Promise.race([write(record),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Storage write timed out')),1800))]);status('Photo saved locally. Export when ready.');}catch(e){console.warn(e);}
    }catch(e){status(e.message);alert(e.message);}
  }
  function control(key,onSaved,label='Choose photo'){
    const wrap=document.createElement('label');wrap.className='photo-native-control';
    const title=document.createElement('span');title.textContent=label;
    const input=document.createElement('input');input.type='file';input.accept='image/*,.jpg,.jpeg,.png,.webp,.avif';input.setAttribute('aria-label',label);
    input.addEventListener('change',()=>{const file=input.files?.[0];input.value='';if(file)void saveFile(key,file,onSaved);});
    wrap.append(title,input);return wrap;
  }
  function pick(key,onSaved){
    if(!enabled||!targets[key])return;
    const wrap=control(key,onSaved),input=wrap.querySelector('input');
    // Modal dialogs make the rest of the document inert. Put the picker inside the active dialog.
    const host=document.querySelector('dialog[open]')||document.body;
    wrap.classList.add('photo-picker-temp');host.append(wrap);
    input.addEventListener('change',()=>wrap.remove(),{once:true});input.addEventListener('cancel',()=>wrap.remove(),{once:true});
    try{input.click();}catch(e){wrap.classList.remove('photo-picker-temp');status('Use the Choose File control to select your photo.');}
  }
function u16(x){const a=new Uint8Array(2);new DataView(a.buffer).setUint16(0,x,true);return a;}
function u32(x){const a=new Uint8Array(4);new DataView(a.buffer).setUint32(0,x>>>0,true);return a;}
const encode=new TextEncoder();
const crctable=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);crctable[n]=c>>>0;}
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=crctable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function makeZip(entries){
 const local=[],central=[];let offset=0;
 for(const {name,bytes} of entries){
   const path=encode.encode(name);const checksum=crc32(bytes);const length=bytes.length;
   const lh=[u32(0x04034b50),u16(20),u16(2048),u16(0),u16(0),u16(0),u32(checksum),u32(length),u32(length),u16(path.length),u16(0),path,bytes];
   const ch=[u32(0x02014b50),u16(20),u16(20),u16(2048),u16(0),u16(0),u16(0),u32(checksum),u32(length),u32(length),u16(path.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),path];
   local.push(...lh);central.push(...ch);offset+=30+path.length+length;
 }
 const centralSize=central.reduce((a,b)=>a+b.length,0),start=offset;
 const trailer=[u32(0x06054b50),u16(0),u16(0),u16(entries.length),u16(entries.length),u32(centralSize),u32(start),u16(0)];
 return new Blob([...local,...central,...trailer],{type:'application/zip'});
}
  async function exportPhotos(){const button=document.getElementById('exportPhotoChanges');button.disabled=true;try{await ready;const entries=[{name:'assets/js/config.js',bytes:encoder.encode('/* Personalized photos for Babi. */\nwindow.LOVE_SITE_DATA = '+JSON.stringify(data,null,2)+';\n')}];for(const record of records.values())entries.push({name:record.path,bytes:new Uint8Array(await record.blob.arrayBuffer())});entries.push({name:'PHOTO-UPDATE.txt',bytes:encoder.encode('Merge the assets folder into your website folder, replacing config.js. Upload the same files to GitHub Pages for Babi to see the changes. Keep any previously published photos not included here. Refresh after deployment.')});const url=URL.createObjectURL(makeZip(entries)),a=document.createElement('a');a.href=url;a.download='Babi-Photo-Update.zip';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);status('Exported '+records.size+' selected photo(s). Merge the assets folder and publish it.');}catch(e){status('Export failed: '+e.message);}finally{button.disabled=false;}}
  function mount(){
    if(!enabled)return;document.documentElement.classList.add('photo-edit-mode');
    const bar=document.createElement('aside');bar.className='photo-edit-toolbar';bar.innerHTML='<div><strong>Photo editing mode</strong><span id="photoEditStatus" role="status">Choose a photo directly or open the photo manager.</span></div><button type="button" id="managePhotos">Manage photos</button><button type="button" id="exportPhotoChanges">Download photo updates ZIP</button><a href="index.html">Exit editing</a>';document.body.append(bar);
    document.getElementById('exportPhotoChanges').addEventListener('click',exportPhotos);
    const manager=document.createElement('dialog');manager.className='photo-manager';manager.setAttribute('aria-label','Manage personal photos');
    const heading=document.createElement('h2');heading.textContent='Manage personal photos';
    const desc=document.createElement('p');desc.textContent='Select the images below. Your decorative letter and scenery will not change.';
    const close=document.createElement('button');close.type='button';close.textContent='Close';close.addEventListener('click',()=>manager.close());
    const grid=document.createElement('div');grid.className='photo-manager-grid';
    const previews=new Map();
    function refresh(key){const img=previews.get(key),t=targets[key];if(!img||!t)return;const name=t.get();img.hidden=!name;if(name){img.onerror=()=>img.hidden=true;img.onload=()=>img.hidden=false;img.src=urls.get('assets/images/'+t.folder+'/'+name)||'assets/images/'+t.folder+'/'+encodeURIComponent(name);}}
    for(const key of Object.keys(targets)){
      const title=key==='final'?"Babi’s anniversary letter":key.startsWith('memory-')?(data.memories[Number(key.slice(7))].title||key):('Open when '+data.openWhen[Number(key.slice(7))].label);
      const row=document.createElement('div');row.className='photo-manager-row';const img=document.createElement('img');img.alt=title;img.hidden=true;previews.set(key,img);row.append(img,control(key,()=>refresh(key),title));grid.append(row);
    }
    manager.append(heading,desc,grid,close);document.body.append(manager);
    document.getElementById('managePhotos').addEventListener('click',()=>{Object.keys(targets).forEach(refresh);manager.showModal();});
  }
  window.LovePhotoEditor={enabled,ready,pick,mount,control,saveFile,exportPhotos,targets,records,url:(path)=>urls.get(path)||path};
})();
