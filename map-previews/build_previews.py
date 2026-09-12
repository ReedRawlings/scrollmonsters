from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import random
ROOT=Path(__file__).resolve().parent
ASSETS=ROOT.parent/'assets/Ninja Adventure - Asset Pack/Backgrounds/Tilesets'
SHEETS={n:Image.open(ASSETS/(n+'.png')).convert('RGBA') for n in ['TilesetFloor','TilesetFloorDetail','TilesetNature']}
W,H=18,44

def tile(im,sheet,x,y,dx,dy,w=1,h=1):
    crop=SHEETS[sheet].crop((x*16,y*16,(x+w)*16,(y+h)*16))
    im.alpha_composite(crop,(int(dx),int(dy)))

def build(name,seed,offset,left,right,density,rocky=False):
 r=random.Random(seed); im=Image.new('RGBA',(W*16,H*16)); floor='TilesetFloor'; nature='TilesetNature'
 for y in range(H):
  for x in range(W):
   if x==left: tx,ty=offset,8
   elif x==right: tx,ty=offset+2,8
   elif left<x<right: tx,ty=offset+1,8
   else: tx,ty=offset,12
   tile(im,floor,tx,ty,x*16,y*16)
   if x<left or x>right:
    if r.random()<.22: tile(im,floor,offset+r.choice([1,2,3,4]),12,x*16,y*16)
   elif left<x<right and r.random()<.035:
    tile(im,'TilesetFloorDetail',r.choice([1,3,15]),0,x*16,y*16)
 # Ground accents cluster at the verge; the middle stays quiet.
 for y in range(1,H-1):
  for x in range(W):
   if x<left or x>right:
    if r.random()<.13: tile(im,'TilesetFloorDetail',r.choice([0,1,2,3,4,6,7]),2,x*16,y*16)
    if r.random()<.08: tile(im,nature,r.choice([0,1,2,3,4,6,7,8]),10,x*16,y*16)
 # Entire multi-tile objects are sorted from north to south for sensible overlap.
 objects=[]
 for side in [0,1]:
  for y in range(-1,H,3):
   if r.random()>density: continue
   if rocky and r.random()<.65: sx,sy,sw,sh=r.choice([(15,10,2,2),(15,14,2,2),(17,10,4,3)])
   else: sx,sy,sw,sh=r.choice([(0,0,2,2),(2,0,2,2),(6,0,2,2),(4,2,4,3)])
   lo,hi=(0,left-sw) if side==0 else (right+1,W-sw)
   if hi<lo: sx,sy,sw,sh=0,0,2,2;lo,hi=(0,left-2) if side==0 else (right+1,W-2)
   x=r.randint(lo,max(lo,hi));objects.append((y*16+r.randint(0,10),x*16,sx,sy,sw,sh))
 for y,x,sx,sy,sw,sh in sorted(objects): tile(im,nature,sx,sy,x,y,sw,sh)
 # Small verge landmarks provide a cadence through the long strip.
 for y in [7,18,30,39]:
  side=r.choice([left-1,right+1]);tile(im,nature,0 if not rocky else 17,8 if not rocky else 13,side*16,y*16,2 if not rocky else 1,2 if not rocky else 1)
 im=im.convert('RGB'); im.resize((W*48,H*48),Image.Resampling.NEAREST).save(ROOT/(name+'.png'))
 return im
if __name__ == '__main__':
 variants=[('01-open-meadow',17,0,4,13,.45,False),('02-forest-corridor',25,11,5,12,.95,False),('03-rocky-trail',39,11,4,13,.8,True)]
 ims=[build(*v) for v in variants]
 board=Image.new('RGB',(3*576+80,1490),'#141d21');d=ImageDraw.Draw(board)
 for i,(im,v) in enumerate(zip(ims,variants)):
  x=20+i*596;d.text((x,16),v[0].replace('-',' ').upper(),fill='#ebeadf');board.paste(im.resize((576,1408),Image.Resampling.NEAREST),(x,48))
 board.save(ROOT/'comparison.png')
