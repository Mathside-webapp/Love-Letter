import * as THREE from '../vendor/three/three.module.min.js';

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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1c2439');
  scene.fog = new THREE.FogExp2('#1c2439', .018);
  const camera = new THREE.PerspectiveCamera(48,1,.1,150);
  const world = new THREE.Group(); scene.add(world);
  const mat = (color, roughness=.7, metalness=0) => new THREE.MeshStandardMaterial({color,roughness,metalness});
  const stone=mat('#ad9c87'), dark=mat('#342a27'), brass=mat('#b99a59',.28,.7), wood=mat('#76523b'), linen=mat('#e1c9b5'), rose=mat('#a96272');
  function mesh(geometry,material,x,y,z,parent=world){
    const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
  }
  const box=(w,h,d,m,x,y,z,parent)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
  const cylinder=(r,h,m,x,y,z,parent)=>mesh(new THREE.CylinderGeometry(r,r,h,32),m,x,y,z,parent);
  scene.add(new THREE.HemisphereLight('#b7cbff','#64503d',1.25));
  const moonlight=new THREE.DirectionalLight('#c2d4ff',3);moonlight.position.set(-9,14,-6);scene.add(moonlight);
  const warm=new THREE.SpotLight('#ffd59c',110,30,Math.PI/3,.6,1.5);warm.position.set(2,7,3);warm.target.position.set(0,0,0);warm.castShadow=true;warm.shadow.mapSize.set(1024,1024);warm.shadow.bias=-.0002;scene.add(warm,warm.target);
  // Subtle material grain catches the light without a texture download.
  function grain(base,woodgrain=false){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=256;
    const context=canvas.getContext('2d');context.fillStyle=base;context.fillRect(0,0,256,256);
    let seed=19;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
    for(let i=0;i<16000;i++){context.fillStyle=`rgba(${random()>.5?'255,255,255':'30,20,10'},${random()*.09})`;context.fillRect(random()*256,random()*256,woodgrain?25:1,1)}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;return texture;
  }
  wood.map=grain('#b39173',true);linen.map=grain('#eee1d0');

  // Limestone terrace with individually jointed slabs.
  box(14,.4,10,stone,0,-.25,0);
  for(let x=-6;x<=6;x+=2)for(let z=-4;z<=4;z+=2){
    const slab=mat(new THREE.Color('#c0b09c').offsetHSL(0,0,((x+z+12)%5)*.008));
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
  // A low sofa, seams and soft cushions.
  box(4,.4,1.5,wood,3,.45,-2.8);box(4,.55,.25,wood,3,1,-3.45);
  for(let i=0;i<3;i++){
    box(1.24,.3,1.28,linen,1.7+i*1.3,.8,-2.7);
    const cushion=box(1.2,.8,.25,i===1?rose:linen,1.7+i*1.3,1.22,-3.18);cushion.rotation.x=-.15;
  }
  for(const x of [.85,5.15])box(.24,.8,1.6,wood,x,.8,-2.8);
  // Woven rug and writing table.
  box(5,.025,3.4,mat('#82716c'),1,.015,.1);
  for(let i=0;i<40;i++)box(4.9,.004,.018,mat(i%2?'#a69484':'#78675e'),1,.032,-1.5+i*.08);
  cylinder(1.35,.16,wood,1,1.05,0);
  for(const x of [.2,1.8])for(const z of [-.65,.65])box(.09,1,.09,brass,x,.5,z);
  const letter=box(.88,.016,.64,mat('#fff2d9'),.9,1.15,.15);letter.rotation.y=-.15;
  // Ink lines on the actual paper surface.
  for(let i=0;i<7;i++)box(.58-i%3*.05,.003,.007,mat('#8f6d60'),.9,1.161,-.04+i*.055);
  const seal=cylinder(.09,.022,rose,1.15,1.17,.32);seal.rotation.y=.2;
  const pen=box(.025,.025,.7,brass,1.6,1.15,.1);pen.rotation.y=-.35;
  // Lanterns have glass, metal frames, wax and warm emissive flames.
  for(const [x,z] of [[-.3,-.35],[5,-1],[-5,-3]]){
    const y=x===-.3?1.15:0;
    box(.35,.04,.35,brass,x,y+.02,z);
    for(const dx of [-.16,.16])for(const dz of [-.16,.16])box(.025,.6,.025,brass,x+dx,y+.32,z+dz);
    box(.38,.06,.38,brass,x,y+.64,z);
    cylinder(.09,.28,mat('#fff0cc'),x,y+.2,z);
    const flame=mesh(new THREE.SphereGeometry(.055,12,8),new THREE.MeshBasicMaterial({color:'#ffe4a6'}),x,y+.4,z);flame.scale.y=2;
    const light=new THREE.PointLight('#ffb966',3,4,2);light.position.set(x,y+.5,z);scene.add(light);
  }
  // Potted foliage, with leaves built as shaded volumes rather than billboards.
  for(const [x,z] of [[-5.6,-3.6],[5.6,-3.6],[5.6,3.4]]){
    cylinder(.42,.7,mat('#a17762'),x,.35,z);
    for(let i=0;i<15;i++){
      const a=i*2.4, y=.85+(i%5)*.22;
      const leaf=mesh(new THREE.SphereGeometry(.3,12,8),mat(i%2?'#667f60':'#8b9b71'),x+Math.sin(a)*.4,y,z+Math.cos(a)*.4);
      leaf.scale.set(.45,1.5,.7);leaf.rotation.z=Math.sin(a)*.65;
    }
  }
  // Framed memories stand on a gallery wall inside the terrace.
  box(.18,3.6,6,mat('#a99380'),-6,1.8,0);
  const loader=new THREE.TextureLoader();
  const pictures=['hero-desktop.webp','our-story.webp','why-i-love-you.webp'];
  pictures.forEach((name,i)=>{
    const z=-2+i*2;
    box(.12,1.65,1.5,brass,-5.86,2.25,z);
    box(.14,1.5,1.35,linen,-5.79,2.25,z);
    const tex=loader.load(`assets/images/backgrounds/${name}`,()=>requestRender());tex.colorSpace=THREE.SRGBColorSpace;
    const photo=mesh(new THREE.PlaneGeometry(1.16,1.3),new THREE.MeshStandardMaterial({map:tex,roughness:.55}),-5.70,2.25,z);
    photo.rotation.y=Math.PI/2;
  });
  // Distant mountains and a moon establish depth beyond the balcony.
  for(let i=0;i<16;i++){
    const peak=mesh(new THREE.SphereGeometry(1,24,16),mat(i%2?'#303b50':'#273449'),-48+i*6,-5,-24-(i%3)*5);
    peak.scale.set(8+(i%3),7+(i%4)*2,5);peak.rotation.z=Math.sin(i)*.2;
  }
  mesh(new THREE.SphereGeometry(1.6,32,24),new THREE.MeshBasicMaterial({color:'#f3dfba'}),-7,12,-35);
  const starPositions=[];for(let i=0;i<260;i++){const a=i*2.399;starPositions.push(Math.sin(a)*55,8+(i%39),-20-Math.cos(a)*20)}
  const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:'#ffe7c0',size:.055})));

  const views=[
    {p:[10,7,12],t:[0,1,0],label:'A place for just the two of us.'},
    {p:[.3,3.3,5],t:[-5.7,2.2,-.1],label:'Every memory deserves a place.'},
    {p:[3.5,4.3,4.4],t:[.8,1.1,0],label:'Some words are only for you.'},
    {p:[12,16,15],t:[0,0,0],label:'Our own little corner of the world.'}
  ];
  let view=0, dragging=false, previousX=0, yaw=0, frame=0, visible=true;
  const target=new THREE.Vector3(),destination=new THREE.Vector3(),look=new THREE.Vector3();
  function setDestination(){const v=views[view];destination.fromArray(v.p);target.fromArray(v.t);if(innerWidth<700){destination.sub(target).multiplyScalar(1.35).add(target)}const offset=destination.clone().sub(target).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);destination.copy(target).add(offset)}
  function choose(index){view=index;yaw=0;setDestination();document.querySelectorAll('[data-view]').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===view)));document.querySelector('#terraceStatus').textContent=views[view].label;document.querySelector('#terraceLetter').hidden=view!==2;document.querySelector('.hero-content').classList.toggle('scene-detail',view!==0);if(reduced.matches){camera.position.copy(destination);look.copy(target)}requestRender()}
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>choose(Number(b.dataset.view))));
  document.querySelector('#terraceLetter').addEventListener('click',()=>document.querySelector('#openFinalLetter').click());
  renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;previousX=e.clientX;renderer.domElement.setPointerCapture(e.pointerId)});
  renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;yaw=THREE.MathUtils.clamp(yaw+(e.clientX-previousX)*.004,-.7,.7);previousX=e.clientX;setDestination();requestRender()});
  for(const event of ['pointerup','pointercancel'])renderer.domElement.addEventListener(event,()=>dragging=false);
  function resize(){const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();setDestination();requestRender()}
  function render(){frame=0;if(!visible||document.hidden)return;camera.position.lerp(destination,reduced.matches?1:.065);look.lerp(target,reduced.matches?1:.065);camera.lookAt(look);renderer.render(scene,camera);if(camera.position.distanceTo(destination)>.005||look.distanceTo(target)>.005)requestRender()}
  function requestRender(){if(!frame)frame=requestAnimationFrame(render)}
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestRender()}).observe(host);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestRender()});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();document.documentElement.classList.remove('terrace-ready');document.querySelector('.terrace-tools').hidden=true;host.hidden=true});
  document.documentElement.classList.add('terrace-ready');document.querySelector('.terrace-tools').hidden=false;
  setDestination();camera.position.copy(destination);look.copy(target);resize();
}
