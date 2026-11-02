import * as THREE from '../vendor/three/three.module.min.js';
import { GLTFLoader } from '../vendor/three/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from '../vendor/three/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from '../vendor/three/controls/OrbitControls.js';
import { createGarden } from './terrace-garden.js';

// A real, locally served WebGL scene. Existing HTML remains the fallback.
const host = document.querySelector('#terrace');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'low-power'});
} catch (error) {
  console.info('Using the illustrated version: WebGL unavailable.');
}
if (renderer) initialize();

function initialize() {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Geometry and lights are static: camera movement can reuse shadow maps.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  host.append(renderer.domElement);
  renderer.domElement.tabIndex=0;
  renderer.domElement.setAttribute('aria-label','Explore the terrace. Drag to orbit, scroll to zoom, right drag or arrow keys to pan. Plus and minus zoom. R resets the view.');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1c2439');
  scene.fog = new THREE.FogExp2('#1c2439', .018);
  const camera = new THREE.PerspectiveCamera(48,1,.05,300);
  const world = new THREE.Group(); scene.add(world);
  createGarden(world);
  const mat = (color, roughness=.7, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
  const stone=mat('#ad9c87'), dark=mat('#342a27'), brass=mat('#b99a59',.28,.7), wood=mat('#76523b'), linen=mat('#e1c9b5'), rose=mat('#a96272');
  function mesh(geometry,material,x,y,z,parent=world){
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  const box=(w,h,d,m,x,y,z,parent)=>mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.12),m,x,y,z,parent);
  const cylinder=(r,h,m,x,y,z,parent)=>mesh(new THREE.CylinderGeometry(r,r,h,32),m,x,y,z,parent);
  scene.add(new THREE.HemisphereLight('#b7cbff','#64503d',.9));
  const moonlight=new THREE.DirectionalLight('#c2d4ff',3);moonlight.position.set(-9,14,-6);scene.add(moonlight);
  moonlight.castShadow=true;moonlight.shadow.mapSize.set(2048,2048);
  Object.assign(moonlight.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:.5,far:45});
  moonlight.shadow.bias=-.0003;moonlight.shadow.normalBias=.025;
  moonlight.shadow.radius=3;
  const warm=new THREE.SpotLight('#ffd59c',110,30,Math.PI/3,.6,1.5);warm.position.set(2,7,3);warm.target.position.set(0,0,0);warm.castShadow=true;warm.shadow.mapSize.set(1024,1024);warm.shadow.bias=-.0002;scene.add(warm,warm.target);
  // Subtle material grain catches the light without a texture download.
  function grain(base,woodgrain=false){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const context=canvas.getContext('2d');context.fillStyle=base;context.fillRect(0,0,256,256);
    let seed=19;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
    for(let i=0;i<16000;i++){context.fillStyle=`rgba(${random()>.5?'255,255,255':'30,20,10'},${random()*.09})`;context.fillRect(random()*256,random()*256,woodgrain?25:1,1)}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;return texture;
  }
  // Long wood fibres, knots and uneven pores instead of a flat brown surface.
  const woodCanvas=document.createElement('canvas');woodCanvas.width=woodCanvas.height=512;
  const wc=woodCanvas.getContext('2d');const pixels=wc.createImageData(512,512);
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const knot=Math.sin(y*.013)*7+Math.sin(y*.037)*2;
    const fibre=Math.sin((x+knot)*1.8)*5+Math.sin((x+knot)*.19)*9;
    const noise=Math.sin(x*127.1+y*311.7)*3;const i=(y*512+x)*4;
    pixels.data[i]=126+fibre+noise;pixels.data[i+1]=86+fibre*.7+noise;pixels.data[i+2]=57+fibre*.5;pixels.data[i+3]=255;
  }
  wc.putImageData(pixels,0,0);
  wood.map=new THREE.CanvasTexture(woodCanvas);wood.map.colorSpace=THREE.SRGBColorSpace;
  wood.color.set('#ffffff');wood.bumpMap=wood.map;wood.bumpScale=.025;wood.roughness=.76;
  linen.map=grain('#eee1d0');linen.bumpMap=linen.map;linen.bumpScale=.018;
  const stoneTexture=grain('#d2c1ad');
  const weaveCanvas=document.createElement('canvas');weaveCanvas.width=weaveCanvas.height=256;
  const weave=weaveCanvas.getContext('2d');weave.fillStyle='#c3aa8b';weave.fillRect(0,0,256,256);
  for(let i=0;i<256;i+=4){weave.fillStyle=i%8?'#a58d72':'#dec6a7';weave.fillRect(i,0,2,256);weave.fillStyle='#ead8bc55';weave.fillRect(0,i,256,2)}
  const weaveMap=new THREE.CanvasTexture(weaveCanvas);weaveMap.wrapS=weaveMap.wrapT=THREE.RepeatWrapping;weaveMap.repeat.set(5,5);weaveMap.colorSpace=THREE.SRGBColorSpace;
  linen.map=weaveMap;linen.bumpMap=weaveMap;linen.bumpScale=.012;
  rose.map=weaveMap;rose.bumpMap=weaveMap;rose.bumpScale=.012;
  brass.bumpMap=grain('#93846a');brass.bumpScale=.008;

  // Limestone terrace with individually jointed slabs.
  box(14,.4,10,stone,0,-.25,0);
  for(let x=-6;x<=6;x+=2)for(let z=-4;z<=4;z+=2){
    const slab=mat(new THREE.Color('#c0b09c').offsetHSL(0,0,((x+z+12)%5)*.008));
    slab.map=stoneTexture;slab.bumpMap=stoneTexture;slab.bumpScale=.035;slab.roughness=.92;
    box(1.98,.035,1.98,slab,x,-.025,z);
  }
  box(14,.15,.22,brass,0,1.65,-4.8);
  for(let x=-6.8;x<7;x+=.55)box(.055,1.65,.055,dark,x,.8,-4.8);
  for(const x of [-6.8,6.8]){
    box(.22,.15,9.6,brass,x,1.65,0);
    for(let z=-4.8;z<5;z+=.55)box(.055,1.65,.055,dark,x,.8,z);
  }
  // Architectural frame and slatted pergola.
  for(const x of [-6,6])for(const z of [-4,4])box(.22,5,.22,wood,x,2.5,z);
  for(let x=-6;x<=6;x+=.7)box(.12,.18,8.4,wood,x,5,0);
  for(const z of [-4,4])box(12.5,.28,.25,wood,0,4.85,z);
  for(const x of [-6,6])for(const z of [-4,4]){
    box(.26,.32,.26,brass,x,.17,z);
    for(const y of [.22,4.75]){const bolt=mesh(new THREE.SphereGeometry(.035,10,8),brass,x,y,z+.125);bolt.scale.z=.35}
    const brace=box(.14,1.15,.14,wood,x+(x<0?.38:-.38),4.35,z);brace.rotation.z=x<0?-.7:.7;
  }
  // A low sofa, seams and soft cushions.
  box(4,.4,1.5,wood,3,.45,-2.8);box(4,.55,.25,wood,3,1,-3.45);
  for(let i=0;i<3;i++){
    box(1.24,.3,1.28,linen,1.7+i*1.3,.8,-2.7);
    const cushion=box(1.2,.8,.25,i===1?rose:linen,1.7+i*1.3,1.22,-3.18);cushion.rotation.x=-.15;
    for(const z of [-3.26,-2.14])box(1.17,.012,.012,linen,1.7+i*1.3,.91,z);
    for(const x of [1.12+i*1.3,2.28+i*1.3])box(.012,.012,1.12,linen,x,.91,-2.7);
  }
  for(const x of [.85,5.15])box(.24,.8,1.6,wood,x,.8,-2.8);
  // Matching armchair with a timber frame and piped upholstered cushions.
  for(const x of [-2.5,-1.4])for(const z of [.25,1.35])box(.09,.65,.09,wood,x,.325,z);
  box(1.35,.20,1.35,wood,-1.95,.62,.8);box(1.14,.25,1.15,linen,-1.95,.83,.8);
  const chairBack=box(1.2,.9,.25,rose,-1.95,1.3,1.35);chairBack.rotation.x=.12;
  for(const x of [-2.58,-1.32])box(.12,.13,1.4,wood,x,1.05,.8);
  for(const z of [.27,1.33])box(1.06,.014,.014,linen,-1.95,.95,z);
  for(const x of [-2.48,-1.42])box(.014,.014,1.06,linen,x,.95,.8);
  // Recessed fasteners and seams give the joinery a visible construction.
  for(const x of [.85,5.15,-2.58,-1.32])for(const z of (x>0?[-3.35,-2.25]:[.25,1.35])){
    const screw=cylinder(.024,.007,brass,x,x>0?1.205:1.12,z);
    box(.028,.003,.004,dark,screw.position.x,screw.position.y+.005,z);
  }
  // Woven rug and writing table.
  const rug=mat('#96846d');rug.map=weaveMap;rug.bumpMap=weaveMap;rug.bumpScale=.025;
  box(5,.025,3.4,rug,1,.015,.1);
  for(const z of [-1.54,1.74])box(4.9,.006,.08,linen,1,.031,z);
  for(let i=0;i<65;i++)for(const z of [-1.67,1.87]){const fringe=box(.015,.012,.2,linen,-1.45+i*.075,.02,z);fringe.rotation.y=Math.sin(i)*.12}
  cylinder(1.35,.16,wood,1,1.05,0);
  const tableRim=mesh(new THREE.TorusGeometry(1.32,.025,8,96),wood,1,1.115,0);tableRim.rotation.x=Math.PI/2;
  cylinder(1.29,.025,brass,1,.96,0);
  for(const x of [.2,1.8])for(const z of [-.65,.65])box(.09,1,.09,brass,x,.5,z);
  const clickable=[];
  function chapter(object,panel){object.userData.panel=panel;clickable.push(object);return object}
  // The same floral paper and personal words as the final letter panel.
  const paperMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',transparent:true,alphaTest:.08,roughness:.92,side:THREE.DoubleSide});
  const letter=chapter(mesh(new THREE.PlaneGeometry(.95,1.02),paperMaterial,.95,1.134,.2),'forever');letter.rotation.x=-Math.PI/2;
  const paperImage=new Image();paperImage.src='assets/images/sprites/letter-card.webp';
  paperImage.onload=()=>{
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=820;
    const ctx=canvas.getContext('2d');ctx.drawImage(paperImage,56,0,paperImage.width-56,paperImage.height,0,0,768,820);
    const data=window.LOVE_SITE_DATA||{};ctx.textAlign='center';ctx.fillStyle='#87576b';
    ctx.font='italic 40px Georgia';ctx.fillText((data.finalLetter?.[0]||'My dearest Babi,').slice(0,45),384,320,560);
    ctx.font='italic 25px Georgia';const words=(data.finalLetter?.[1]||'Every little moment with you means the world to me.').split(/\s+/);
    let line='',row=0;for(const word of words){const next=line+word+' ';if(ctx.measureText(next).width>510&&line){ctx.fillText(line.trim(),384,390+row*38);row++;line='';if(row===3)break}line+=word+' '}
    if(row<3)ctx.fillText(line.trim(),384,390+row*38);
    ctx.font='italic 31px Georgia';ctx.fillText('Always yours ♡',384,565);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());paperMaterial.map=texture;paperMaterial.needsUpdate=true;requestRender();
  };
  const penGroup=new THREE.Group();penGroup.position.set(1.6,1.155,.1);penGroup.rotation.x=Math.PI/2;penGroup.rotation.z=-.35;world.add(penGroup);
  cylinder(.022,.57,mat('#253039',.28,.35),0,0,0,penGroup);
  for(const y of [-.25,.20,.27])cylinder(.024,.018,brass,0,y,0,penGroup);
  mesh(new THREE.ConeGeometry(.02,.11,20),brass,0,.335,0,penGroup);
  box(.012,.18,.012,brass,.026,-.16,0,penGroup);
  // Lanterns have glass, metal frames, wax and warm emissive flames.
  const fallbackProps=new THREE.Group();world.add(fallbackProps);
  const originalChildren=new Set(world.children);
  for(const [x,z] of [[5,-1],[-5,-3]]){
    const y=3.1;
    box(.35,.04,.35,brass,x,y+.02,z);
    for(const dx of [-.16,.16])for(const dz of [-.16,.16])box(.025,.6,.025,brass,x+dx,y+.32,z+dz);
    box(.38,.06,.38,brass,x,y+.64,z);
    cylinder(.09,.28,mat('#fff0cc'),x,y+.2,z);
    const flame=mesh(new THREE.SphereGeometry(.055,12,8),new THREE.MeshBasicMaterial({color:'#ffe4a6'}),x,y+.4,z);flame.scale.y=2;
    const light=new THREE.PointLight('#ffb966',3,4,2);light.position.set(x,y+.5,z);scene.add(light);
  }
  for(const child of [...world.children])if(!originalChildren.has(child))fallbackProps.add(child);
  for(const [x,z] of [[5,-1],[-5,-3]]){
    for(let y=3.98;y<4.96;y+=.055){const link=mesh(new THREE.TorusGeometry(.035,.006,6,12),brass,x,y,z);link.rotation.y=Math.round(y/.055)%2?Math.PI/2:0}
    box(.16,.04,.16,brass,x,4.97,z);
  }
  // Weighted brass lamp, fluted ceramic body, fabric shade and warm bulb.
  cylinder(.22,.055,brass,.25,1.16,-.55);
  cylinder(.07,.35,brass,.25,1.36,-.55);
  const ceramic=mat('#9c7c69',.42);ceramic.map=grain('#d2bd9f');ceramic.bumpMap=ceramic.map;ceramic.bumpScale=.015;
  const lampBody=mesh(new THREE.SphereGeometry(.16,32,20),ceramic,.25,1.36,-.55);lampBody.scale.y=1.15;
  for(let i=0;i<24;i++){
    const a=i/24*Math.PI*2;
    const flute=mesh(new THREE.SphereGeometry(.015,6,12),ceramic,.25+Math.cos(a)*.145,1.36,-.55+Math.sin(a)*.145);flute.scale.y=8;
  }
  const shadeMat=linen.clone();shadeMat.side=THREE.DoubleSide;shadeMat.emissive=new THREE.Color('#a46f37');shadeMat.emissiveIntensity=.18;
  mesh(new THREE.CylinderGeometry(.19,.34,.38,64,1,true),shadeMat,.25,1.78,-.55);
  for(const [y,r] of [[1.59,.34],[1.97,.19]]){const rim=mesh(new THREE.TorusGeometry(r,.01,8,64),linen,.25,y,-.55);rim.rotation.x=Math.PI/2}
  mesh(new THREE.SphereGeometry(.055,16,12),new THREE.MeshBasicMaterial({color:'#ffe5ae'}),.25,1.7,-.55);
  const lampLight=new THREE.PointLight('#ffcb89',5,5,2);lampLight.position.set(.25,1.65,-.55);scene.add(lampLight);
  const assets=new GLTFLoader();let modelsLoaded=0;
  function prepareModel(root){renderer.shadowMap.needsUpdate=true;root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){if(m.name.includes('Leaf')){m.side=THREE.DoubleSide;m.roughness=.75}if(m.name.includes('terracotta')){m.map=grain('#caa98c');m.bumpMap=m.map;m.bumpScale=.025}if(m.name.includes('glass')){m.depthWrite=false;o.castShadow=false}}})}
  assets.load('assets/models/terrace-fern.glb',gltf=>{prepareModel(gltf.scene);for(const [x,z] of [[-5.6,-3.6],[5.6,-3.6],[5.6,3.4]]){const plant=gltf.scene.clone();plant.position.set(x,0,z);world.add(plant)}host.dataset.models=String(++modelsLoaded);requestRender()},undefined,()=>console.warn('Plant model could not load.'));
  assets.load('assets/models/terrace-lantern.glb',gltf=>{prepareModel(gltf.scene);for(const [x,y,z] of [[5,3.1,-1],[-5,3.1,-3]]){const lantern=gltf.scene.clone();lantern.position.set(x,y,z);world.add(lantern)}fallbackProps.visible=false;host.dataset.models=String(++modelsLoaded);requestRender()},undefined,()=>console.warn('Using simplified lanterns.'));
  // Gifts and letters have physical places on a side console.
  box(2.5,.10,.85,wood,-3,1.05,-3.9);
  for(const x of [-4,-2])for(const z of [-4.2,-3.6])box(.07,1.05,.07,brass,x,.52,z);
  for(let i=0;i<3;i++){
    const x=-3.8+i*.65, h=.30+i%2*.12;
    const gift=chapter(box(.46,h,.44,mat(['#9e6577','#c0a074','#897392'][i]),x,1.10+h/2,-3.9),'surprises');
    gift.material.map=grain('#dfcebc');gift.material.bumpMap=gift.material.map;gift.material.bumpScale=.015;
    chapter(box(.49,.045,.47,linen,x,1.10+h,-3.9),'surprises');
    chapter(box(.07,h+.06,.455,brass,x,1.10+h/2,-3.9),'surprises');
    for(const sign of [-1,1]){const bow=mesh(new THREE.TorusGeometry(.08,.012,6,20),brass,x+sign*.07,1.15+h,-3.9);bow.rotation.x=Math.PI/2;bow.scale.y=.6;chapter(bow,'surprises')}
  }
  const envelopeTexture=new THREE.TextureLoader().load('assets/images/sprites/letter-sealed.webp',()=>requestRender());envelopeTexture.colorSpace=THREE.SRGBColorSpace;
  const envelopes=chapter(mesh(new THREE.PlaneGeometry(.85,.52),new THREE.MeshStandardMaterial({map:envelopeTexture,transparent:true,alphaTest:.1,side:THREE.DoubleSide,roughness:.9}),2.1,.98,-2.5),'letters');envelopes.rotation.x=-Math.PI/2;
  const starShape=new THREE.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.PI/2,r=i%2?.07:.16;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?starShape.lineTo(x,y):starShape.moveTo(x,y)}starShape.closePath();
  for(let i=0;i<5;i++){const x=1.3+i*.8,y=2.6+Math.sin(i)*.15;chapter(mesh(new THREE.ExtrudeGeometry(starShape,{depth:.035,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:2}),brass,x,y,-3.9),'reasons');box(.008,4.8-y,.008,brass,x,(4.8+y)/2,-3.9)}
  // Framed memories stand on a gallery wall inside the terrace.
  const plaster=mat('#b6a18c');plaster.map=grain('#d1c6b7');plaster.bumpMap=plaster.map;plaster.bumpScale=.045;
  box(.18,3.6,6,plaster,-6,1.8,0);
  for(const y of [.12,1.05,3.5])box(.09,.09,6,wood,-5.86,y,0);
  for(let z=-2.9;z<3;z+=.58)box(.07,.9,.04,wood,-5.86,.57,z);
  const loader=new THREE.TextureLoader();
  const pictures=['hero-desktop.webp','our-story.webp','why-i-love-you.webp'];
  pictures.forEach((name,i)=>{
    const z=-2+i*2;
    box(.12,1.65,1.5,brass,-5.86,2.25,z);
    box(.14,1.5,1.35,linen,-5.79,2.25,z);
    const tex=loader.load(`assets/images/backgrounds/${name}`,()=>requestRender());tex.colorSpace=THREE.SRGBColorSpace;
    const photo=chapter(mesh(new THREE.PlaneGeometry(1.16,1.3),new THREE.MeshStandardMaterial({map:tex,roughness:.55}),-5.70,2.25,z),'story');
    photo.rotation.y=Math.PI/2;
  });
  // Distant mountains and a moon establish depth beyond the balcony.
  const hills=new THREE.PlaneGeometry(150,70,120,56);
  const hp=hills.attributes.position;
  for(let i=0;i<hp.count;i++){
    const x=hp.getX(i),z=hp.getY(i),ramp=THREE.MathUtils.smoothstep(z,-35,-10);
    const ridge=5+3*Math.sin(x*.12+z*.08)+2*Math.sin(x*.31-z*.19)+.8*Math.sin(x*.87+z*.43);
    hp.setZ(i,Math.max(0,ridge)*ramp);
  }
  hills.computeVertexNormals();
  const landscape=mesh(hills,mat('#29374a'),0,-3,-55);landscape.rotation.x=-Math.PI/2;landscape.castShadow=false;
  mesh(new THREE.SphereGeometry(1.6,32,24),new THREE.MeshBasicMaterial({color:'#f3dfba'}),-7,12,-35);
  const starPositions=[];for(let i=0;i<260;i++){const a=i*2.399;starPositions.push(Math.sin(a)*55,8+(i%39),-20-Math.cos(a)*20)}
  const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:'#ffe7c0',size:.055})));

  const views=[
    {p:[10,7,12],t:[0,1,0],label:'A place for just the two of us.'},
    {p:[.3,3.3,5],t:[-5.7,2.2,-.1],label:'Our stories — select a framed photo to read them.'},
    {p:[2.2,3.1,2.5],t:[.95,1.14,.15],label:'A letter, just for you.'},
    {p:[12,16,15],t:[0,0,0],label:'Our own little corner of the world.'}
  ];
  let view=0, dragging=false, frame=0, visible=true, transitioning=false;
  const target=new THREE.Vector3(),destination=new THREE.Vector3();
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.minDistance=.35;controls.maxDistance=100;controls.maxPolarAngle=Math.PI-.01;
  controls.enableDamping=false;controls.zoomSpeed=.8;controls.panSpeed=.8;
  controls.listenToKeyEvents(renderer.domElement);
  controls.addEventListener('change',requestRender);
  controls.addEventListener('start',()=>{transitioning=false;document.querySelector('.hero-content').classList.add('scene-detail');document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'));document.querySelector('#terraceStatus').textContent='Explore at your own pace. Choose a view to return.'});
  function setDestination(){const v=views[view];destination.fromArray(v.p);target.fromArray(v.t);if(innerWidth<700){destination.sub(target).multiplyScalar(1.35).add(target)}}
  function choose(index){view=index;setDestination();transitioning=true;document.querySelectorAll('[data-view]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===view)));document.querySelector('#terraceStatus').textContent=views[view].label;document.querySelector('#terraceLetter').hidden=view!==2;document.querySelector('.hero-content').classList.toggle('scene-detail',view!==0);if(reduced.matches){camera.position.copy(destination);controls.target.copy(target);controls.update();transitioning=false}requestRender()}
  renderer.domElement.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r'){e.preventDefault();choose(0)}if(['+','=','-'].includes(e.key)){e.preventDefault();transitioning=false;camera.position.sub(controls.target).multiplyScalar(e.key==='-'?1.15:.87).clampLength(.35,100).add(controls.target);controls.update();requestRender()}});
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.view))));
  document.querySelector('#terraceLetter').addEventListener('click',()=>document.querySelector('#openFinalLetter').click());
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let startX=0,startY=0;
  function pick(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(clickable,false)[0]?.object.userData.panel}
  function openChapter(panel){const section=document.getElementById(panel);if(!section)return;location.hash=panel;section.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});section.setAttribute('tabindex','-1');section.focus({preventScroll:true})}
  document.querySelectorAll('.terrace-chapters a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();openChapter(a.hash.slice(1))}));
  let moved=false,pointerCount=0;
  renderer.domElement.addEventListener('pointerdown',e=>{pointerCount++;moved=pointerCount>1;dragging=true;startX=e.clientX;startY=e.clientY});
  renderer.domElement.addEventListener('pointerup',e=>{if(!moved&&pointerCount===1&&e.button===0&&Math.hypot(e.clientX-startX,e.clientY-startY)<6){const panel=pick(e);if(panel)openChapter(panel)}pointerCount=Math.max(0,pointerCount-1)});
  renderer.domElement.addEventListener('pointermove',e=>{if(dragging)return;const panel=pick(e);renderer.domElement.style.cursor=panel?'pointer':'grab';document.querySelectorAll('.terrace-chapters a').forEach(a=>a.classList.toggle('scene-hover',a.hash==='#'+panel))});
  renderer.domElement.addEventListener('pointermove',e=>{if(dragging&&Math.hypot(e.clientX-startX,e.clientY-startY)>6)moved=true});
  for(const event of ['pointerup','pointercancel'])renderer.domElement.addEventListener(event,()=>{dragging=false;if(event==='pointercancel'){moved=true;pointerCount=0}});
  function resize(){const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();requestRender()}
  function render(){frame=0;if(!visible||document.hidden)return;if(transitioning){camera.position.lerp(destination,.09);controls.target.lerp(target,.09);controls.update();if(camera.position.distanceTo(destination)<.005&&controls.target.distanceTo(target)<.005)transitioning=false;else requestRender()}renderer.render(scene,camera)}
  function requestRender(){if(!frame)frame=requestAnimationFrame(render)}
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestRender()}).observe(host);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestRender()});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.documentElement.classList.remove('terrace-ready');document.querySelector('.terrace-tools').hidden=true;host.hidden=true});
  document.documentElement.classList.add('terrace-ready');document.querySelector('.terrace-tools').hidden=false;
  setDestination();camera.position.copy(destination);controls.target.copy(target);controls.update();resize();
}
