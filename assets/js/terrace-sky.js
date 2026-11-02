import * as THREE from '../vendor/three/three.module.min.js';

export function createAtmosphere(scene,onLoad) {
  let seed=813;
  const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const loader=new THREE.TextureLoader();
  function texture(name,color=true){const t=loader.load(`assets/images/sky/${name}.webp`,onLoad);if(color)t.colorSpace=THREE.SRGBColorSpace;return t}
  // A continuous 360-degree atmospheric gradient, rather than a flat backdrop.
  const sky=new THREE.Mesh(new THREE.SphereGeometry(230,48,24),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    vertexShader:'varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec3 direction;
      void main(){float h=normalize(direction).y;
        vec3 horizon=vec3(.012,.018,.038),zenith=vec3(.003,.007,.023);
        vec3 c=mix(horizon,zenith,pow(clamp(h,0.,1.),.42));
        c+=vec3(.003,.002,.003)*exp(-pow((h-.03)*7.,2.));
        gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  }));sky.name='Atmospheric night sky';sky.renderOrder=-10;scene.add(sky);

  // Original crater/maria texture, with physical relief and a soft phase edge.
  const moonMap=texture('moon-albedo'),moonHeight=texture('moon-height',false);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(3.3,64,40),new THREE.MeshStandardMaterial({map:moonMap,bumpMap:moonHeight,bumpScale:.065,roughness:1,emissive:'#a4afc0',emissiveMap:moonMap,emissiveIntensity:.65,fog:false}));
  moon.position.set(-43,46,-103);moon.name='Cratered moon';scene.add(moon);
  function glow(){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(245,249,255,1)');g.addColorStop(.12,'rgba(225,238,255,.9)');g.addColorStop(.3,'rgba(160,188,236,.3)');g.addColorStop(1,'rgba(100,145,220,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
  const softGlow=glow();const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:softGlow,color:'#9eb9ed',transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));halo.position.copy(moon.position);halo.scale.set(17,17,1);scene.add(halo);

  const positions=[],starColors=[];
  for(let i=0;i<1900;i++){
    const a=random()*Math.PI*2,y=.06+random()*.94,r=Math.sqrt(1-y*y),radius=185;
    positions.push(Math.cos(a)*r*radius,y*radius,Math.sin(a)*r*radius);
    const brightness=.45+Math.pow(random(),3)*.55,c=new THREE.Color().setRGB(brightness*.91,brightness*.95,brightness);starColors.push(c.r,c.g,c.b);
  }
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));starGeo.setAttribute('color',new THREE.Float32BufferAttribute(starColors,3));
  const starTime={value:0};
  const starMaterial=new THREE.PointsMaterial({map:softGlow,size:.85,vertexColors:true,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
  starMaterial.onBeforeCompile=shader=>{
    shader.uniforms.starTime=starTime;
    shader.vertexShader='varying float starPhase;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n starPhase=position.x*3.17+position.y*1.41;');
    shader.fragmentShader='uniform float starTime; varying float starPhase;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb*=.72+.28*sin(starTime*(.55+.2*sin(starPhase))+starPhase);');
  };
  const stars=new THREE.Points(starGeo,starMaterial);stars.name='Distant star field';scene.add(stars);

  const clouds=[],cloudMap=texture('cloud-bank');
  for(let i=0;i<11;i++){
    const a=i/11*Math.PI*2+.2,r=108+random()*20,y=49+random()*15;
    const c=new THREE.Mesh(new THREE.PlaneGeometry(35+random()*28,10+random()*13),new THREE.MeshBasicMaterial({map:cloudMap,transparent:true,opacity:.28+random()*.2,depthWrite:false,side:THREE.DoubleSide,color:'#8e9fb8',fog:false}));
    c.userData={angle:a,radius:r,height:y};c.position.set(Math.cos(a)*r,y,Math.sin(a)*r);c.lookAt(0,8,0);c.name='Layered moonlit cloud';scene.add(c);clouds.push(c);
  }
  const tailPositions=[],tailColors=[];
  for(let i=0;i<30;i++){const t=i/29;tailPositions.push(-t*9,t*4.5,0);tailColors.push((1-t)**2,(1-t)**2,(1-t)**1.5)}
  const tailGeo=new THREE.BufferGeometry();tailGeo.setAttribute('position',new THREE.Float32BufferAttribute(tailPositions,3));tailGeo.setAttribute('color',new THREE.Float32BufferAttribute(tailColors,3));
  const meteor=new THREE.Group();meteor.name='Occasional shooting star';
  const tail=new THREE.Line(tailGeo,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));meteor.add(tail);
  const head=new THREE.Sprite(new THREE.SpriteMaterial({map:softGlow,color:'#dceaff',transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));head.scale.set(.7,.7,1);meteor.add(head);scene.add(meteor);
  function update(seconds,motion=true){
    starTime.value=seconds;
    for(const c of clouds){const d=c.userData,a=d.angle+seconds*.00065;c.position.set(Math.cos(a)*d.radius,d.height,Math.sin(a)*d.radius);c.lookAt(0,8,0)}
    const phase=seconds%24-7;meteor.visible=motion&&phase>=0&&phase<1.35;
    if(meteor.visible){meteor.position.set(-35+phase*24,58-phase*12,-108);const opacity=Math.sin(phase/1.35*Math.PI);tail.material.opacity=opacity;head.material.opacity=opacity}
  }
  update(0,false);
  return {update,meteor,clouds,moon,stars};
}
