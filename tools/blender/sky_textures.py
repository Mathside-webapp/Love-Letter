"""Seeded original lunar, cloud and alpine surface maps (not astronomical scans)."""
from pathlib import Path
import numpy as np
from PIL import Image
OUT=Path(__file__).resolve().parents[2]/'assets'/'images'/'sky'
OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(438)
def noise(w,h,gx,gy):
    return np.asarray(Image.fromarray(np.uint8(rng.random((gy,gx))*255)).resize((w,h),Image.Resampling.BICUBIC)).astype(float)/255
w,h=1024,512
y,x=np.mgrid[0:h,0:w]
fine=noise(w,h,128,64)
maria=noise(w,h,12,6)
moon=160+noise(w,h,48,24)*34+fine*20-(maria<.39)*(30+( .39-maria)*90)
height=noise(w,h,64,32)*.08
for i in range(900):
    cx,cy=rng.uniform(0,w),rng.uniform(0,h);r=rng.uniform(1.2,13) if i<850 else rng.uniform(12,35)
    dx=np.minimum(np.abs(x-cx),w-np.abs(x-cx));dist=np.sqrt((dx*np.cos((cy/h-.5)*np.pi))**2+(y-cy)**2)/r
    bowl=np.maximum(0,1-dist*dist)
    rim=np.exp(-((dist-1)/.10)**2)
    moon+=rim*21-bowl*24+bowl*(x-cx)/r*13
    height+=rim*.12-bowl*.08
Image.fromarray(np.uint8(np.clip(moon,0,255))).convert('RGB').save(OUT/'moon-albedo.webp',quality=92)
Image.fromarray(np.uint8(np.clip(height*180+90,0,255))).save(OUT/'moon-height.webp',quality=90)
# Fractal cloud density with feathered boundaries and internally shaded lobes.
w=h=512;y,x=np.mgrid[0:h,0:w]
n=sum(noise(w,h,g,g)*a for g,a in [(5,.5),(12,.25),(28,.14),(64,.07),(128,.04)])
edge=np.clip(1-((x-256)/255)**2-((y-256)/245)**2,0,1)**1.5
alpha=np.clip((n-.34)*3,0,1)*edge
rgb=np.stack([np.clip(85+n*100,0,255),np.clip(96+n*104,0,255),np.clip(121+n*110,0,255),alpha*210],axis=2)
Image.fromarray(np.uint8(rgb),'RGBA').save(OUT/'cloud-bank.webp',quality=90)
w=h=1024;y,x=np.mgrid[0:h,0:w]
n=sum(noise(w,h,g,g)*a for g,a in [(6,.35),(22,.3),(70,.2),(256,.1),(1024,.05)])
strata=np.sin(y*.14+noise(w,h,10,10)*12)*5
rgb=np.stack([75+n*60+strata,77+n*58+strata,78+n*55+strata],axis=2)
Image.fromarray(np.uint8(np.clip(rgb,0,255))).save(OUT/'mountain-rock.webp',quality=88)
Image.fromarray(np.uint8(n*255)).save(OUT/'mountain-height.webp',quality=88)
