import * as THREE from '../vendor/three/three.module.min.js';

// Seeded geometry keeps the garden stable between visits. Repeated leaves and
// grass share GPU buffers rather than creating thousands of draw calls.
export function createGarden(world) {
  let seed=7429;
  const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  function surface(base,kind) {
    const c=document.createElement('canvas');c.width=c.height=512;
    const ctx=c.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,512,512);
    for(let i=0;i<26000;i++){
      ctx.fillStyle=`rgba(${random()>.5?'231,215,170':'24,32,20'},${random()*.28})`;
      ctx.fillRect(random()*512,random()*512,kind==='bark'?1:1+random()*4,kind==='bark'?12+random()*50:1+random()*3);
    }
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
    map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(kind==='earth'?14:2,kind==='earth'?14:2);
    return new THREE.MeshStandardMaterial({map,bumpMap:map,bumpScale:kind==='bark'?.12:.07,roughness:.95});
  }
  const earth=surface('#46503a','earth'), rock=surface('#7d8275','rock'), bark=surface('#665044','bark'), path=surface('#a3987e','rock');
  function add(g,m,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;world.add(o);return o}
  const terrain=new THREE.PlaneGeometry(180,180,100,100),pos=terrain.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getY(i),edge=THREE.MathUtils.smoothstep(Math.hypot(x,z),15,65);
    pos.setZ(i,edge*(2.5+Math.sin(x*.12)*2+Math.cos(z*.16)*1.6));
  }
  terrain.computeVertexNormals();const ground=add(terrain,earth,0,-.52,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  // Stepping stones connect the open front of the terrace to a winding garden.
  for(let i=0;i<23;i++){
    const z=5.8+i*.92,x=Math.sin(i*.24)*2.3;
    const stone=add(new THREE.CylinderGeometry(.69,.73,.13,7),path,x,-.43,z);stone.scale.set(1.55,1,1);stone.rotation.y=random();
  }
  for(let i=0;i<3;i++)add(new THREE.BoxGeometry(3.2,.14, .7),path,0,-.12-i*.13,5.15+i*.56);
  const rockGeo=new THREE.IcosahedronGeometry(1,1);
  for(let i=0;i<75;i++){
    const a=random()*Math.PI*2,r=10+random()*22,x=Math.cos(a)*r,z=Math.sin(a)*r;
    const o=add(rockGeo,rock,x,-.35,z);o.scale.set(.25+random()*.8,.18+random()*.5,.3+random()*.8);o.rotation.set(random(),random(),random());
  }
  // Individually tapered, bent grass blades with varying height and colour.
  const blade=new THREE.BufferGeometry();blade.setAttribute('position',new THREE.Float32BufferAttribute([-.035,0,0,.035,0,0,.018,.3,.035,-.018,.3,.035,0,.58,.12],3));blade.setIndex([0,1,2,0,2,3,3,2,4]);blade.computeVertexNormals();
  const grassMat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1,side:THREE.DoubleSide});
  const grass=new THREE.InstancedMesh(blade,grassMat,36000),dummy=new THREE.Object3D();
  for(let i=0;i<36000;i++){
    let x,z;do{x=(random()-.5)*65;z=(random()-.5)*65}while((Math.abs(x)<7.6&&Math.abs(z)<5.7)||(z>5&&z<28&&Math.abs(x-Math.sin((z-5.8)/.92*.24)*2.3)<1.2));
    dummy.position.set(x,-.49,z);dummy.rotation.set(random()*.25,random()*Math.PI*2,random()*.3);dummy.scale.set(1+random(),.3+random()*.6,1);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);grass.setColorAt(i,new THREE.Color().setHSL(.19+random()*.08,.25+random()*.2,.22+random()*.2));
  }
  grass.receiveShadow=true;world.add(grass);
  // Branching trees: bark-covered tapered limbs and thousands of small leaves.
  const leafGeo=new THREE.SphereGeometry(1,5,3),leafMat=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.85});
  const leaves=new THREE.InstancedMesh(leafGeo,leafMat,4800);let leafIndex=0;
  function branch(a,b,r1,r2){const delta=b.clone().sub(a);const o=add(new THREE.CylinderGeometry(r2,r1,delta.length(),9),bark,...a.clone().add(b).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())}
  for(let t=0;t<12;t++){
    const angle=t/12*Math.PI*2,radius=18+random()*11,x=Math.cos(angle)*radius,z=Math.sin(angle)*radius,h=4+random()*3;
    branch(new THREE.Vector3(x,-.5,z),new THREE.Vector3(x+.25,h,z),.32,.09);
    for(let b=0;b<5;b++){
      const a=b*2.4+t,tip=new THREE.Vector3(x+Math.cos(a)*2.1,h-.4+random()*1.8,z+Math.sin(a)*2.1);
      branch(new THREE.Vector3(x,h*.58,z),tip,.13,.025);
      for(let l=0;l<80;l++){
        const az=random()*Math.PI*2,el=random()*Math.PI,rad=Math.cbrt(random())*1.8;
        dummy.position.set(tip.x+Math.cos(az)*Math.sin(el)*rad,tip.y+Math.cos(el)*rad*.7,tip.z+Math.sin(az)*Math.sin(el)*rad);
        dummy.rotation.set(random()*2,random()*6,random()*2);dummy.scale.set(.25+random()*.18,.035,.13+random()*.1);dummy.updateMatrix();leaves.setMatrixAt(leafIndex,dummy.matrix);
        leaves.setColorAt(leafIndex++,new THREE.Color().setHSL(t%3===0?.94:.25,.22+random()*.25,t%3===0?.45+random()*.15:.18+random()*.17));
      }
    }
  }
  leaves.castShadow=true;leaves.receiveShadow=true;world.add(leaves);
  // Low lavender beds frame the terrace without obscuring its views.
  const stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.012,.018,.65,4),new THREE.MeshStandardMaterial({color:'#677c43',roughness:1}),240);
  const flowers=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.07,1),new THREE.MeshStandardMaterial({color:'#aa83b5',roughness:.9}),240);
  for(let i=0;i<240;i++){
    const side=i%2?1:-1,x=side*(7.6+random()*1.6),z=-4.8+random()*10;
    dummy.position.set(x,-.16,z);dummy.rotation.set(0,random()*6,random()*.18);dummy.scale.set(1,1,1);dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);
    dummy.position.y=.18;dummy.scale.set(.75,2.3,.75);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);
  }
  world.add(stems,flowers);
}
