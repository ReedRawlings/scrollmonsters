"""Render approved first-pass layouts with props wrapping across the loop join."""
from pathlib import Path
import importlib.util
from PIL import Image
root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('previews',root/'map-previews/build_previews.py')
p=importlib.util.module_from_spec(spec);spec.loader.exec_module(p)
p.ROOT=root/'assets/scenery'
original_tile=p.tile
def wrapped_tile(im,sheet,x,y,dx,dy,w=1,h=1):
 original_tile(im,sheet,x,y,dx,dy,w,h)
 if dy<0: original_tile(im,sheet,x,y,dx,dy+im.height,w,h)
 if dy+h*16>im.height: original_tile(im,sheet,x,y,dx,dy-im.height,w,h)
p.tile=wrapped_tile
for args in [('01-open-meadow',17,0,4,13,.45,False),('02-forest-corridor',25,11,5,12,.95,False),('03-rocky-trail',39,11,4,13,.8,True)]:
 im=p.build(*args)
 im.save(p.ROOT/(args[0]+'.png'))

# Two additional low-density biomes, retaining the same tile scale and lane width.
import random
base=root/'assets/Ninja Adventure - Asset Pack/Backgrounds/Tilesets'
floor=Image.open(base/'TilesetFloor.png').convert('RGBA')
nature=Image.open(base/'TilesetNature.png').convert('RGBA')
preview=root/'map-previews/pass-03';preview.mkdir(exist_ok=True)
for rocky,name in [(False,'04-desert-path'),(True,'05-stone-path')]:
 rng=random.Random(81 if rocky else 47);im=Image.new('RGBA',(288,704));offset=11 if rocky else 0;row=14 if rocky else 0
 def stamp(sheet,x,y,dx,dy,w=1,h=1):
  art=sheet.crop((x*16,y*16,(x+w)*16,(y+h)*16))
  for py in [dy,dy-704,dy+704]:
   if py<704 and py+h*16>0:im.alpha_composite(art,(dx,py))
 for y in range(44):
  for x in range(18):
   tx,ty=(offset,row+5) if x<4 or x>13 else (offset if x==4 else offset+2 if x==13 else offset+1,row+1)
   stamp(floor,tx,ty,x*16,y*16)
   if (x<4 or x>13) and rng.random()<.13:stamp(floor,offset+rng.choice([1,2,3]),row+5,x*16,y*16)
 for side in [0,1]:
  for y in range(2,44,6):
   if rocky:
    sx,sy,w,h=rng.choice([(15,14,2,2),(17,17,1,1),(15,16,2,2),(17,14,4,3)])
    x=0 if side==0 else 18-w
    stamp(nature,sx,sy,x*16,y*16,w,h)
   else:
    sx,sy,w,h=rng.choice([(15,10,2,2),(17,13,1,1),(15,12,2,2)])
    x=0 if side==0 else 18-w
    stamp(nature,sx,sy,x*16,y*16,w,h)
 im.save(root/'assets/scenery'/f'{name}.png')
 im.resize((864,2112),Image.Resampling.NEAREST).save(preview/f'{name}.png')
