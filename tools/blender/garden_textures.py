"""Original, seeded surface maps; no downloaded or third-party inputs."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

OUT=Path(__file__).resolve().parents[2]/'assets'/'images'/'garden'
OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(291)
def noise(size,grid):
    a=Image.fromarray(np.uint8(rng.random((grid,grid))*255))
    return np.asarray(a.resize((size,size),Image.Resampling.BICUBIC)).astype(float)/255
def save(name,base,kind):
    s=1024 if kind=='ground' else 512
    n=sum(noise(s,g)*w for g,w in [(4,.30),(13,.25),(41,.2),(128,.15),(s,.1)])
    rgb=np.zeros((s,s,3))
    for c,v in enumerate(base):rgb[:,:,c]=v+(n-.5)*85
    if kind=='bark':
        x,y=np.meshgrid(np.arange(s),np.arange(s));flow=x+8*np.sin(y*.015)+3*np.sin(y*.045)
        ridges=np.sin(flow*.24)+.45*np.sin(flow*.81)
        rgb+=ridges[:,:,None]*11
    if kind=='stone':
        seams=np.abs(noise(s,9)-.48)<.016
        rgb[seams]*=.75
        lichen=(noise(s,26)>.68)&(noise(s,80)>.45)
        rgb[lichen]=rgb[lichen]*.6+np.array([99,110,59])*.4
    image=Image.fromarray(np.uint8(np.clip(rgb,0,255)))
    if kind=='ground':
        draw=ImageDraw.Draw(image)
        for i in range(95000):
            x,y=rng.integers(0,s,2);v=int(rng.integers(-18,22));length=int(rng.integers(3,15))
            draw.line((x,y,x+int(rng.integers(-5,6)),y-length),fill=(55+v,69+v,36+v),width=1)
        for i in range(1400):
            x,y=rng.integers(0,s,2);v=int(rng.integers(45,100));draw.ellipse((x,y,x+2,y+1),fill=(v,v-5,v-18))
    image.save(OUT/(name+'.webp'),quality=88)
    image.convert('L').save(OUT/(name+'-height.webp'),quality=88)
save('meadow',(61,70,43),'ground')
save('weathered-rock',(112,109,97),'stone')
save('oak-bark',(94,77,57),'bark')
# Leaf veins are drawn in the same UV coordinates as the curved leaf mesh.
s=256
arr=np.zeros((s,s,3),dtype=np.uint8)
for y in range(s):
    for x in range(s):
        n=rng.integers(-7,8);edge=abs(x-128)/128
        arr[y,x]=(58+n-int(edge*12),88+n-int(edge*14),31+n)
leaf=Image.fromarray(arr);d=ImageDraw.Draw(leaf)
d.line((128,0,128,256),fill=(125,136,65),width=2)
for y in range(25,250,25):
    for side in [-1,1]:d.line((128,y,128+side*115,y-48),fill=(83,112,43),width=1)
leaf.save(OUT/'leaf-veins.webp',quality=92)
