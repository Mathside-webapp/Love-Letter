"""Original web garden assets. Run garden_textures.py, then Blender -b --python this file."""
import bpy, math, random, json, hashlib
from pathlib import Path
from mathutils import Vector, noise
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'assets'/'models'/'garden';OUT.mkdir(parents=True,exist_ok=True)
random.seed(835)
records=[]
def material(name,texture,color=(1,1,1),roughness=.9):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Roughness'].default_value=roughness
    if texture:
        tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'assets'/'images'/'garden'/texture));m.node_tree.links.new(tex.outputs['Color'],p.inputs['Base Color'])
    else:p.inputs['Base Color'].default_value=(*color,1)
    return m
bark=material('Oak bark','oak-bark.webp')
leaf=material('Veined leaves','leaf-veins.webp',roughness=.77);leaf.use_backface_culling=False
stone=material('Weathered mineral rock','weathered-rock.webp')
grassm=material('Grass blade',(None),(.18,.25,.065))
dry=material('Dry grass tips',None,(.29,.27,.12))
def clear():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
class Mesh:
    def __init__(self):self.v=[];self.f=[];self.uv=[]
    def vertex(self,p,uv):self.v.append(tuple(p));self.uv.append(uv);return len(self.v)-1
    def object(self,name,mat):
        data=bpy.data.meshes.new(name);data.from_pydata(self.v,[],self.f);data.update();data.materials.append(mat)
        uv=data.uv_layers.new()
        for poly in data.polygons:
            poly.use_smooth=True
            for loop in poly.loop_indices:uv.data[loop].uv=self.uv[data.loops[loop].vertex_index]
        obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);return obj
def tube(data,points,radius,sides=8):
    start=len(data.v)
    for i,p in enumerate(points):
        tangent=(points[min(i+1,len(points)-1)]-points[max(0,i-1)]).normalized()
        axis=tangent.cross(Vector((0,1,0))).normalized();other=tangent.cross(axis)
        for s in range(sides+1):
            a=s/sides*math.tau;r=radius*(1-i/(len(points)-1)*.94)*(1+.08*math.sin(s*3))
            data.vertex(p+(axis*math.cos(a)+other*math.sin(a))*r,(s/sides,i*.37))
    for i in range(len(points)-1):
        for s in range(sides):
            a=start+i*(sides+1)+s;data.f.append((a,a+1,a+sides+2,a+sides+1))
def blade(data,origin,axis,length,width,bend,segments=6):
    side=axis.cross(Vector((0,0,1)))
    if side.length<.01:side=Vector((1,0,0))
    side.normalize();start=len(data.v)
    for i in range(segments+1):
        t=i/segments;center=origin+axis*length*t+Vector((0,0,bend*math.sin(t*math.pi)-length*.18*t*t))
        w=width*math.sin(math.pi*t)**.8
        for s in [-1,0,1]:data.vertex(center+side*w*s+Vector((0,0,-abs(s)*w*.22)),((s+1)/2,t))
    for i in range(segments):
        for s in range(2):
            a=start+i*3+s;data.f.append((a,a+1,a+4,a+3))
def export(name):
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH'];triangles=0
    for o in objects:o.data.calc_loop_triangles();triangles+=len(o.data.loop_triangles)
    path=OUT/(name+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',export_yup=True,export_image_format='AUTO')
    records.append({'file':name+'.glb','triangles':triangles,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
for variant in range(2):
    clear();trunk=Mesh();foliage=Mesh();height=5.6+variant*.9
    tube(trunk,[Vector((.12*math.sin(t*.8),.09*math.sin(t),t*height/10)) for t in range(11)],.29,12)
    for b in range(14):
        a=b*2.399;root=Vector((0,0,1.7+b*.25));reach=random.uniform(1.8,3.0)*(1-b*.025)
        tip=Vector((math.cos(a)*reach,math.sin(a)*reach,root.z+1.5+random.random()))
        points=[root.lerp(tip,t/7)+Vector((0,0,.22*math.sin(t/7*math.pi))) for t in range(8)]
        tube(trunk,points,.105*(1-b*.035))
        for twig in range(8):
            base=points[2+twig%6];ang=a+(1 if twig%2 else -1)*random.uniform(.5,1.7)
            end=base+Vector((math.cos(ang),math.sin(ang),random.uniform(.4,1.1)))*random.uniform(.6,1.2)
            tube(trunk,[base.lerp(end,t/4) for t in range(5)],.024,6)
            for j in range(64):
                t=random.uniform(.15,1.15);origin=base.lerp(end,t)+Vector((random.uniform(-.4,.4),random.uniform(-.4,.4),random.uniform(-.2,.3)))
                angle=random.random()*math.tau;axis=Vector((math.cos(angle),math.sin(angle),random.uniform(-.35,.6))).normalized()
                blade(foliage,origin,axis,random.uniform(.18,.35),random.uniform(.055,.09),random.uniform(.01,.05),4)
    trunk.object('Continuous tapered trunk and fine branches',bark);foliage.object('Curled leaves with midrib and vein texture',leaf);export('garden-tree-'+str(variant))
for variant in range(3):
    clear();bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4,radius=1)
    obj=bpy.context.object;obj.name='Eroded stone with mineral texture';obj.data.materials.append(stone)
    for v in obj.data.vertices:
        p=v.co.copy();n=noise.fractal(p*2.1+Vector((variant*7,0,0)),1,2,4)
        v.co*=1+n*.19;v.co.x*=1.0+variant*.16;v.co.y*=.72;v.co.z*=.55
        v.co.z=max(v.co.z,-.32)+.32
    for p in obj.data.polygons:p.use_smooth=True
    bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.uv.sphere_project();bpy.ops.object.mode_set(mode='OBJECT');export('garden-rock-'+str(variant))
for variant in range(3):
    clear();data=Mesh()
    for i in range(44):
        a=random.random()*math.tau;r=random.random()*.11;origin=Vector((math.cos(a)*r,math.sin(a)*r,0));length=random.uniform(.17,.42)
        direction=Vector((math.cos(a)*random.uniform(.15,.65),math.sin(a)*random.uniform(.15,.65),1)).normalized()
        blade(data,origin,direction,length,random.uniform(.004,.009),.025,5)
    data.object('Fine arcing grass blades',grassm if variant<2 else dry);export('garden-grass-'+str(variant))
(OUT/'provenance.json').write_text(json.dumps({'origin':'Original project assets, no third-party inputs','authoringTool':bpy.app.version_string,'source':'tools/blender/build_garden.py','textures':'tools/blender/garden_textures.py','units':'metres','models':records},indent=2)+'\n')
