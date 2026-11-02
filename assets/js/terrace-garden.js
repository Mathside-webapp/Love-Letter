import * as THREE from '../vendor/three/three.module.min.js';
import { GLTFLoader } from '../vendor/three/loaders/GLTFLoader.js';

// Original Blender assets, with repeatable, deliberately uneven planting.
export function createGarden(world, onLoad) {
  let seed=7429;
  const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const loader=new THREE.TextureLoader();
  function material(name,repeat,bump=.05){
    const map=loader.load(`assets/images/garden/${name}.webp`,onLoad);map.colorSpace=THREE.SRGBColorSpace;
    const height=loader.load(`assets/images/garden/${name}-height.webp`,onLoad);
    for(const t of [map,height]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=4}
    return new THREE.MeshStandardMaterial({map,bumpMap:height,bumpScale:bump,roughness:.96});
  }
  const earth=material('meadow',40,.025),stone=material('weathered-rock',1,.045);
  function add(g,m,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;world.add(o);return o}
  function elevation(x,z){const edge=THREE.MathUtils.smoothstep(Math.hypot(x,z),15,65);return -.52+edge*(2.5+Math.sin(x*.12)*2+Math.cos(z*.16)*1.6)}
  const terrain=new THREE.PlaneGeometry(180,180,140,140),pos=terrain.attributes.position;
  for(let i=0;i<pos.count;i++)pos.setZ(i,elevation(pos.getX(i),-pos.getY(i)));
  terrain.computeVertexNormals();const ground=add(terrain,earth,0,0,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  for(let i=0;i<23;i++){
    const z=5.8+i*.92,x=Math.sin(i*.24)*2.3;
    const slab=add(new THREE.CylinderGeometry(.69,.73,.13,7),stone,x,elevation(x,z)+.08,z);slab.scale.set(1.55,1,1);slab.rotation.y=random();
  }
  for(let i=0;i<3;i++)add(new THREE.BoxGeometry(3.2,.14,.7),stone,0,-.12-i*.13,5.15+i*.56);
  const gltf=new GLTFLoader();let loaded=0;
  const plantings=[[-12,-8,1],[-17,-14,1.15],[-9,-19,.9],[9,-16,1.2],[16,-10,.95],[20,3,1.05],[-19,5,1.1],[14,18,.85]];
  const placements={};
  for(let variant=0;variant<2;variant++)placements[`tree-${variant}`]=plantings.filter((p,i)=>i%2===variant).map(([x,z,s])=>({x,z,s,angle:random()*6}));
  // Small groups of half-buried stones, not a field of identical boulders.
  for(let v=0;v<3;v++){
    placements[`rock-${v}`]=[];
    for(const [cx,cz] of [[-9,-5],[10,-6],[-12,10],[15,5]])for(let i=0;i<3;i++)placements[`rock-${v}`].push({x:cx+(random()-.5)*3,z:cz+(random()-.5)*2,s:.2+random()*.65,angle:random()*6,buried:.12});
    placements[`grass-${v}`]=[];
    for(let i=0;i<650;i++){
      let x,z;do{x=(random()-.5)*43;z=(random()-.5)*43}while((Math.abs(x)<7.4&&Math.abs(z)<5.7)||(z>5&&z<28&&Math.abs(x-Math.sin((z-5.8)/.92*.24)*2.3)<1.15));
      placements[`grass-${v}`].push({x,z,s:.45+random()*.65,angle:random()*6});
    }
  }
  for(const [name,instances] of Object.entries(placements))gltf.load(`assets/models/garden/garden-${name}.glb`,asset=>{
    asset.scene.updateMatrixWorld(true);
    asset.scene.traverse(source=>{
      if(!source.isMesh)return;
      const geometry=source.geometry.clone().applyMatrix4(source.matrixWorld);
      const material=source.material;material.side=THREE.DoubleSide;
      if(material.map)material.map.anisotropy=4;
      if(name.startsWith('tree')&&material.name.includes('bark')){material.bumpMap=material.map;material.bumpScale=.06}
      if(name.startsWith('rock')){material.bumpMap=material.map;material.bumpScale=.035}
      const mesh=new THREE.InstancedMesh(geometry,material,instances.length),dummy=new THREE.Object3D();
      instances.forEach((p,i)=>{dummy.position.set(p.x,elevation(p.x,p.z)-(p.buried||0),p.z);dummy.rotation.set(0,p.angle,0);dummy.scale.setScalar(p.s);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix)});
      mesh.castShadow=!name.startsWith('grass');mesh.receiveShadow=true;world.add(mesh);
    });
    document.querySelector('#terrace').dataset.gardenModels=String(++loaded);onLoad();
  },undefined,()=>console.warn(`Garden asset unavailable: ${name}`));
}
