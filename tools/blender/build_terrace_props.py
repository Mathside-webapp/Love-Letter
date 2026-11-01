"""Author original terrace props in Blender; export portable, metre-scale GLBs.
Run: blender -b -t 2 --python tools/blender/build_terrace_props.py
No external asset downloads or paid generation. Seeded, reproducible geometry.
"""
import bpy
import math
import random
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets' / 'models'
OUT.mkdir(parents=True, exist_ok=True)
random.seed(144)

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

def material(name, color, roughness=.7, metallic=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    return m

def finish(obj, name, mat):
    obj.name = name
    obj.data.materials.append(mat)
    return obj

def cylinder(name, radius, depth, location, mat, r2=None):
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=radius, radius2=r2 if r2 is not None else radius, depth=depth, location=location)
    obj=finish(bpy.context.object,name,mat)
    for p in obj.data.polygons: p.use_smooth=True
    bevel=obj.modifiers.new('Soft manufactured edges','BEVEL');bevel.width=.008;bevel.segments=2
    return obj

def cube(name, dims, location, mat, bevel=.015):
    bpy.ops.mesh.primitive_cube_add(size=1,location=location)
    obj=finish(bpy.context.object,name,mat);obj.dimensions=dims
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=obj.modifiers.new('Edge bevel','BEVEL');mod.width=bevel;mod.segments=3
    return obj

def tube(name, points, radius, mat):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.bevel_depth=radius;curve.bevel_resolution=2;curve.resolution_u=8
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points):p.co=(*co,1)
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
    return obj

def export(name):
    # Convert curves and bake modifiers so the web model matches Blender.
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.convert(target='MESH')
    for obj in bpy.context.selected_objects:
        bpy.context.view_layer.objects.active=obj
        for mod in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
    # Consolidate by material to avoid hundreds of draw calls per plant.
    bpy.ops.object.select_all(action='SELECT')
    bpy.context.view_layer.objects.active=bpy.context.selected_objects[0]
    bpy.ops.object.join()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'tools' / 'blender' / (name+'.blend')),compress=True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',export_yup=True,export_materials='EXPORT')
    print(name, 'triangles',sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH'))

clear()
clay=material('Weathered terracotta',(0.43,.22,.13),.92)
soil=material('Dark granular soil',(.075,.045,.025),1)
stemmat=material('Fern stems',(.13,.22,.055),.84)
leaves=[material('Leaf green '+str(i),(.08+i*.014,.18+i*.024,.035+i*.009),.64) for i in range(5)]
veinmat=material('Leaf veins',(.22,.31,.09),.82)
cylinder('Tapered planter',.29,.65,(0,0,.325),clay,.42)
for z in [.04,.60,.65]:
    bpy.ops.mesh.primitive_torus_add(major_radius=.30 if z<.1 else .42,minor_radius=.025,major_segments=48,minor_segments=8,location=(0,0,z))
    finish(bpy.context.object,'Rolled ceramic rim',clay)
cylinder('Visible soil',.39,.03,(0,0,.635),soil)
for i in range(34):
    a=random.random()*math.tau;r=random.random()*.36
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=random.uniform(.012,.027),location=(math.cos(a)*r,math.sin(a)*r,.66))
    finish(bpy.context.object,'Soil granule',soil)
# Arcing fern fronds, each with pairs of thin curved leaflets and a central vein.
for frond in range(22):
    angle=frond*2.39996
    direction=Vector((math.cos(angle),math.sin(angle),0))
    side=Vector((-math.sin(angle),math.cos(angle),0))
    reach=random.uniform(.45,.9);height=random.uniform(.55,1.05)
    def center(t):return direction*(reach*t*t)+Vector((0,0,.66+height*math.sin(t*1.9)))
    tube('Curved fern rachis',[center(i/16) for i in range(17)],.008,stemmat)
    for level in range(2,12):
        t=level/12
        root=center(t)
        for sign in [-1,1]:
            length=.24*math.sin(t*math.pi)*random.uniform(.8,1.15)
            axis=side*sign*.9+direction*.35
            vertices=[];faces=[]
            for j in range(9):
                u=j/8;middle=root+axis*(length*u)+Vector((0,0,.055*math.sin(u*math.pi)-.035*u*u))
                width=.035*math.sin(math.pi*u)**.8
                for s in [-1,0,1]:
                    point=middle+direction*(width*s)+Vector((0,0,-abs(s)*.012*math.sin(math.pi*u)))
                    vertices.append(point)
            for j in range(8):
                for k in range(2):
                    n=j*3+k;faces.append((n,n+1,n+4,n+3))
            mesh=bpy.data.meshes.new('Leaflet mesh');mesh.from_pydata(vertices,[],faces);mesh.update()
            obj=bpy.data.objects.new('Veined fern leaflet',mesh);bpy.context.collection.objects.link(obj);mesh.materials.append(leaves[(frond+level)%5])
            for p in mesh.polygons:p.use_smooth=True
            tube('Leaf midrib',[vertices[j*3+1] for j in range(9)],.0017,veinmat)
export('terrace-fern')

clear()
metal=material('Aged brass',(.39,.27,.12),.34,.78)
wax=material('Ivory candle wax',(.92,.84,.64),.85)
wickmat=material('Charred wick',(.025,.015,.01),1)
glass=material('Lantern glass',(.8,.89,.93),.12)
glass.diffuse_color=(.8,.89,.93,.12)
glass.node_tree.nodes.get('Principled BSDF').inputs['Alpha'].default_value=.12
glass.surface_render_method='DITHERED'
cube('Weighted lantern base',(.38,.38,.05),(0,0,.025),metal)
cube('Raised plinth',(.32,.32,.025),(0,0,.061),metal)
for x in [-.165,.165]:
    for y in [-.165,.165]:cube('Beveled frame post',(.026,.026,.50),(x,y,.31),metal,.005)
for y in [-.166,.166]:cube('Glass pane',(.30,.004,.46),(0,y,.31),glass,.001)
for x in [-.166,.166]:cube('Glass pane',(.004,.30,.46),(x,0,.31),glass,.001)
cube('Roof lip',(.40,.40,.035),(0,0,.58),metal)
bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=.282,radius2=.11,depth=.14,rotation=(0,0,math.pi/4),location=(0,0,.665))
finish(bpy.context.object,'Sloping vented roof',metal)
cylinder('Top cap',.07,.055,(0,0,.76),metal)
points=[(.075*math.cos(a*math.pi/16),0,.81+.075*math.sin(a*math.pi/16)) for a in range(33)]
tube('Carrying handle',points,.009,metal)
cylinder('Candle body',.082,.25,(0,0,.20),wax)
cylinder('Wick',.006,.034,(0,0,.342),wickmat)
flame=material('Warm candle flame',(1,.54,.13),.4)
bsdf=flame.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Emission Color'].default_value=(1,.48,.08,1);bsdf.inputs['Emission Strength'].default_value=4
bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=1,location=(0,0,.382))
obj=finish(bpy.context.object,'Flame',flame);obj.scale=(.022,.022,.055)
export('terrace-lantern')
