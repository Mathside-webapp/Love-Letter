/* Local-only editor: never requests network, never saves data remotely. */
(() => {
'use strict';
const source=window.LOVE_SITE_DATA;
const root=document.getElementById('editorPanels');
if(!source){root.textContent='Cannot find assets/js/config.js. Keep the editor inside the website folder.';return;}
const doc=JSON.parse(JSON.stringify(source));
// Files are held only in this editor tab. No server, account or upload is used.
const selectedFiles=new Map();
const previewURLs=[];
const mediaFolder={memories:'memories',reasons:'reasons',gifts:'gifts',openWhen:'letters',final:'letters'};
const extensions=/\.(jpg|jpeg|png|webp|avif)$/i;
const audioExtensions=/\.(mp3|m4a|ogg|wav)$/i;
const safeName=(file,section,index,key,extra=0)=>{
  const ext=(file.name.match(/\.([a-z0-9]+)$/i)?.[1]||'jpg').toLowerCase();
  const stem=file.name.replace(/\.[^.]+$/,'').normalize('NFKD').replace(/[^a-z0-9 -]/gi,'').trim().replace(/[ _]+/g,'-').toLowerCase().slice(0,38)||'photo';
  return `${section}-${index+1}-${key}${extra?'-'+extra:''}-${stem}.${ext}`;
};
function showSelectedPreview(holder,files,existingFolder){
  holder.replaceChildren();
  files.forEach(file=>{
    const tile=el('div','selected-tile');
    const img=document.createElement(file.name.match(audioExtensions)?'span':'img');
    if(img.tagName==='IMG'){const url=URL.createObjectURL(file);previewURLs.push(url);img.src=url;img.alt=file.name;}
    else img.textContent='♫';
    const tag=el('small','',file.name);tile.append(img,tag);holder.append(tile);
  });
  if(!files.length && existingFolder){holder.append(el('small','','Current image: '+existingFolder));}
}

const $=(s,r=document)=>r.querySelector(s);
const el=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;};
const definitions={
 basics:{title:'Welcome & names',intro:'These words appear on the first screen, in your greeting, and in the special moon message.',fields:[
   ['girlfriendName','Nickname (Babi)','text'],['yourName','Your name or nickname','text'],['anniversaryDate','Anniversary date (YYYY-MM-DD)','date'],['introLine','Opening envelope greeting','text'],['heroMessage','Hero subtitle','text'],['openingNote','A note before the story','long'],['moonWish','Secret moon wish','long'],['allStarsSurprise','Secret after all eight stars','long']]},
 memories:{title:'Photo timeline',intro:'Choose a photo directly on each memory. The first two photos ALSO appear in the floating Polaroids at the top of Our Story. Your photo moves together with its frame. You can add up to 8 memory cards.',fields:[['date','Small date / category','text'],['title','Memory title','text'],['message','What happened / why it matters','long'],['image','Main photo filename (memories/)','text'],['extraImages','Extra gallery photos (one filename per line)','lines'],['caption','Photo caption','text']],add:true,max:8},
 reasons:{title:'Eight glowing stars',intro:'Each star can reveal a different reason AND an optional photo. The heart has eight stars, so keep exactly eight entries.',fields:[['title','Little title','text'],['message','Your reason / mini memory','long'],['image','Photo filename (reasons/)','text'],['caption','Photo description','text']]},
 gifts:{title:'Three different surprises',intro:'Each gift opens a DIFFERENT activity: a promise jar, date roulette and copyable coupons. Write each idea on a new line.',fields:[['title','Gift title','text'],['subtitle','Short description','text'],['image','Optional photo filename (gifts/)','text'],['promises','Promise ideas (one per line)','lines'],['dateIdeas','Date ideas (one per line)','lines'],['coupons','Love coupons (one per line)','lines']]},
 openWhen:{title:'Open When... letters',intro:'Write several paragraphs using an empty line between paragraphs. You can attach a photo and an optional voice recording for every letter.',fields:[['label','Envelope label, e.g. You Miss Me','text'],['title','Title inside the letter','text'],['stamp','Little envelope stamp','text'],['message','Your letter (separate paragraphs with an empty line)','paragraphs'],['image','Photo filename (letters/)','text'],['audio','Optional voice filename (audio/)','text'],['signoff','Optional custom signature','text']],add:true,max:12},
 final:{title:'Your anniversary letter',intro:'This is the last surprise she opens. Give it your most personal words.',fields:[['finalPhoto','Optional photo filename (letters/)','text'],['finalLetter','The final letter (one paragraph separated by an empty line)','paragraphs']]}
};
function renderField(record,key,label,type,section,index){
 const wrap=el('div','group');const lab=el('label','',label);const id='ed-'+Math.random().toString(36).slice(2);
 lab.htmlFor=id;let inp;
 if(['long','lines','paragraphs'].includes(type)){inp=document.createElement('textarea');inp.rows=type==='paragraphs'?7:3;}else{inp=document.createElement('input');inp.type=type==='date'?'date':'text';}
 inp.id=id;const old=record[key];inp.value=Array.isArray(old)?old.join(type==='paragraphs'?'\n\n':'\n'):(old??'');
 inp.addEventListener('input',()=>{ record[key]=type==='lines'?inp.value.split(/\n/).map(v=>v.trim()).filter(Boolean):type==='paragraphs'?inp.value.split(/\n\s*\n/).map(v=>v.trim()).filter(Boolean):inp.value;});
 wrap.append(lab,inp);
 // A real photo picker, not merely a text box asking for a filename.
 const isMedia=['image','finalPhoto','audio','extraImages'].includes(key);
 if(isMedia){
   const mediaRow=el('div','media-tools');
   const isAudio=key==='audio';const multi=key==='extraImages';
   const pick=el('label','media-picker',isAudio?'♫ Choose voice recording':multi?'＋ Choose gallery photos':'＋ Choose photo from device');
   const choose=document.createElement('input');choose.type='file';choose.className='media-file-input';
   choose.accept=isAudio?'audio/mpeg,audio/mp4,audio/ogg,audio/wav,.mp3,.m4a,.ogg,.wav':'image/jpeg,image/png,image/webp,image/avif,.jpg,.jpeg,.png,.webp,.avif';
   choose.multiple=multi;choose.setAttribute('aria-label',isAudio?'Choose recording':multi?'Choose gallery photos':'Choose photo');
   pick.append(choose);mediaRow.append(pick);
   const folder=isAudio?'audio':mediaFolder[section];
   const preview=el('div','selected-preview');
   if(!folder){pick.remove();}
   if(folder){choose.addEventListener('change',()=>{
     const chosen=[...choose.files];if(!chosen.length)return;
     const permitted=isAudio?audioExtensions:extensions;
     if(chosen.some(f=>!permitted.test(f.name))){
       alert(isAudio?'Choose MP3, M4A, OGG or WAV.':'Choose JPG, PNG, WebP or AVIF. Convert HEIC photos to JPG first.');return;
     }
     if(chosen.some(f=>f.size>25*1024*1024)){alert('Please choose photos or recordings smaller than 25 MB each.');return;}
     const names=[];
     chosen.forEach((file,i)=>{const filename=safeName(file,section,index,key,multi?i+1:0);selectedFiles.set(`assets/${isAudio?'audio':'images/'+folder}/${filename}`,file);names.push(filename);});
     if(multi){record[key]=names;inp.value=names.join('\n');}
     else{record[key]=names[0];inp.value=names[0];}
     showSelectedPreview(preview,chosen);
     const tip=$('#selectionStatus');if(tip)tip.textContent=`✓ ${selectedFiles.size} file(s) chosen. Download the personalized ZIP to include them.`;
     $('#status').textContent='Photo chosen! It is now connected to its chapter. Download the personalized ZIP when you finish editing.';
   });}
   wrap.append(mediaRow,preview);
   if(inp.value && !multi){const folderPath=isAudio?'../assets/audio/':`../assets/images/${folder}/`;
     const current=el('small','existing-media','Current file: '+inp.value);
     preview.append(current);
     if(!isAudio){const img=document.createElement('img');img.className='existing-media-preview';img.alt='Current photo';img.src=folderPath+encodeURIComponent(inp.value);img.onerror=()=>img.remove();preview.append(img);}
   }
   wrap.append(el('small','photo-tip',multi?'You may choose several images at once.':isAudio?'Optional voice recording.':'JPG, PNG, WebP or AVIF. The selected photo is included when you download the ZIP.'));
 }

 return wrap;
}
function blankItem(section){
 if(section==='memories')return {date:'A NEW MEMORY',title:'A special day',message:'',image:'',extraImages:[],caption:''};
 if(section==='openWhen')return {label:'You need a hug',title:'When you need a hug, Babi',stamp:'A LITTLE HUG',message:['Hi, Babi,'],image:'',audio:'',signoff:''};
 return {};
}
function renderPanel(name){
 const def=definitions[name];const panel=el('section','panel');panel.dataset.panel=name;const heading=el('h2','panel-title',def.title);panel.append(heading,el('p','intro',def.intro));
 const list=el('div','cards');panel.append(list);
 const entries=()=>name==='basics'||name==='final'?[doc]:doc[name];
 function cards(){list.replaceChildren();entries().forEach((item,index)=>{
  const card=el('div',name==='basics'||name==='final'?'basic':'edit-card');
  if(!['basics','final'].includes(name))card.append(el('h3','',`${String(index+1).padStart(2,'0')} · ${item.title||item.label||item.date||'Card'}`));
  def.fields.forEach(([key,label,type])=>{
   if(name==='gifts'&&!Object.prototype.hasOwnProperty.call(item,key))return;
   card.append(renderField(item,key,label,type,name,index));
  });
  if(def.add){const remove=el('button','danger','Remove this item');remove.type='button';remove.addEventListener('click',()=>{if(entries().length<=1){alert('Keep at least one item.');return;}doc[name].splice(index,1);cards();});card.append(remove);}
  list.append(card);
 });}
 cards();
 if(def.add){const bar=el('div','editor-actions');const add=el('button','action secondary',`+ Add another ${name==='openWhen'?'letter':'memory'}`);add.type='button';add.addEventListener('click',()=>{if(doc[name].length>=def.max){alert(`Maximum: ${def.max}`);return;}doc[name].push(blankItem(name));cards();});bar.append(add);panel.append(bar);}
 return panel;
}
Object.keys(definitions).forEach(n=>root.append(renderPanel(n)));
function activate(name){document.querySelectorAll('.panel').forEach(n=>n.classList.toggle('active',n.dataset.panel===name));document.querySelectorAll('.tab').forEach(n=>n.setAttribute('aria-selected',String(n.dataset.tab===name)));}
activate('basics');document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{activate(b.dataset.tab);window.scrollTo({top:0,behavior:'smooth'});}));
$('#downloadConfig').addEventListener('click',()=>{
 const output='/* Created locally with tools/personalize.html. Replace assets/js/config.js with this file. */\nwindow.LOVE_SITE_DATA = '+JSON.stringify(doc,null,2)+';\n';
 const url=URL.createObjectURL(new Blob([output],{type:'text/javascript;charset=utf-8'}));
 const anchor=el('a');anchor.href=url;anchor.download='config.js';document.body.append(anchor);anchor.click();anchor.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),2000);
 $('#status').textContent='Downloaded config.js. For chosen photos, use the Personalized ZIP button instead—it includes both images and config.';
});

// Build a standard (STORE) ZIP archive in the browser; no CDN/dependency needed.
// ZIP contains assets/js/config.js AND the files chosen in the editor.
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
function offerDownload(blob,name){const a=el('a');const url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);}
const exportButton=$('#downloadBundle');
if(exportButton) exportButton.addEventListener('click',async()=>{
  exportButton.disabled=true;const previous=exportButton.textContent;exportButton.textContent='Preparing your ZIP…';
  try{
    const config='/* Personalized locally for Babi. */\nwindow.LOVE_SITE_DATA = '+JSON.stringify(doc,null,2)+';\n';
    const entries=[{name:'assets/js/config.js',bytes:encode.encode(config)}];
    for(const [name,file] of selectedFiles)entries.push({name,bytes:new Uint8Array(await file.arrayBuffer())});
    const help='PERSONALIZED FILES FOR BABI\n\n1. Unzip this file.\n2. Copy the assets/ folder into your To Babi With Love website folder.\n3. Choose Replace / Merge when prompted.\n4. Open index.html. Refresh if necessary.\n\nThe first two photos in the Memories editor appear in the big decorative Polaroids AND the timeline.\nIMPORTANT: Photos or audio already referenced in config.js but NOT selected in the editor are not included in this ZIP. Keep those original files in their current folders.\n';
    entries.push({name:'HOW_TO_INSTALL.txt',bytes:encode.encode(help)});
    offerDownload(makeZip(entries),'Babi_Personalized_Photos_And_Config.zip');
    $('#status').textContent=`Downloaded a ZIP containing config.js and ${selectedFiles.size} newly selected media file(s). Unzip it into your website folder and merge assets/.`;
  }catch(err){console.error(err);$('#status').textContent='Export failed: '+err.message;}
  finally{exportButton.disabled=false;exportButton.textContent=previous;}
});
})();
