from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import random
ROOT=Path(__file__).resolve().parent
ASSETS=ROOT.parent.parent/'assets/Ninja Adventure - Asset Pack/Backgrounds/Tilesets'
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
   elif left<x<right and r.random()<.11:
    tile(im,'TilesetFloorDetail',r.choice([0,1,2,3,4,5,6,7,8,11,12]),0,x*16,y*16)
 # Ground accents cluster at the verge; the middle stays quiet.
 for y in range(1,H-1):
  for x in range(W):
   if x<left or x>right:
    if r.random()<.20: tile(im,'TilesetFloorDetail',r.choice([0,1,2,3,4,6,7]),2,x*16,y*16)
    if r.random()<.08: tile(im,nature,r.choice([0,1,2,3,4,6,7,8]),10,x*16,y*16)
 # Entire multi-tile objects are sorted from north to south for sensible overlap.
 objects=[]
 for side in [0,1]:
  for y in range(-1,H,3):
   if r.random()>density: continue
   if rocky and r.random()<.65: sx,sy,sw,sh=r.choice([(17,13,1,1),(15,10,2,2)])
   else: sx,sy,sw,sh=r.choice([(0,0,2,2),(2,0,2,2),(6,0,2,2),(4,2,4,3)])
   lo,hi=(0,left-sw) if side==0 else (right+1,W-sw)
   if hi<lo: sx,sy,sw,sh=0,0,2,2;lo,hi=(0,left-2) if side==0 else (right+1,W-2)
   x=r.randint(lo,max(lo,hi));objects.append((y*16+r.randint(0,10),x*16,sx,sy,sw,sh))
 for y,x,sx,sy,sw,sh in sorted(objects): tile(im,nature,sx,sy,x,y,sw,sh)
 # Mixed leaf, flower and twig pockets close to the grass/dirt boundary.
 for y in [4,12,23,34,40]:
  side=r.choice([left,right])
  for j in range(3):
   tile(im,'TilesetFloorDetail',r.choice([0,1,2,3,4,5,6,7]),2,side*16+r.randint(-6,6),y*16+j*10)
 # Proposed breakable brown rocks: alternating one-tile and two-tile sprites.
 # Keep rocks off the exact central axis, as in the current spawn lanes.
 for i,y in enumerate([5,11,17,24,31,38]):
  small=i%2==0
  sx,sy,sw,sh=(17,13,1,1) if small else (15,10,2,2)
  x=left+1 if i%3 else right-sw
  tile(im,nature,sx,sy,x*16,y*16,sw,sh)
 im=im.convert('RGB'); im.resize((W*48,H*48),Image.Resampling.NEAREST).save(ROOT/(name+'.png'))
 return im
variants=[('01-meadow-details',17,0,4,13,.45,False),('02-forest-details',25,11,5,12,.85,False),('03-brown-rock-trail',39,11,4,13,.8,True)]
ims=[build(*v) for v in variants]
board=Image.new('RGB',(3*576+80,1490),'#141d21');d=ImageDraw.Draw(board)
for i,(im,v) in enumerate(zip(ims,variants)):
 x=20+i*596;d.text((x,16),v[0].replace('-',' ').upper(),fill='#ebeadf');board.paste(im.resize((576,1408),Image.Resampling.NEAREST),(x,48))
board.save(ROOT/'comparison.png')

# Review board at proposed in-game sprite sizes, with enlarged art for inspection.
font_path='/System/Library/Fonts/Helvetica.ttc'
f=ImageFont.truetype(font_path,22);title=ImageFont.truetype(font_path,30)
plate=Image.new('RGBA',(1000,580),'#172329');d=ImageDraw.Draw(plate)
d.text((32,24),'BROWN ROCKS / proposed gameplay sizes',font=title,fill='#f3e9ce')
for i,(label,sx,sy,sw,hp) in enumerate([('SMALL',17,13,1,8),('MEDIUM',15,10,2,15)]):
 x=40+i*480
 d.text((x,90),label,font=title,fill='#efd19d')
 art=SHEETS['TilesetNature'].crop((sx*16,sy*16,(sx+sw)*16,(sy+sw)*16))
 plate.alpha_composite(art.resize((sw*32,sw*32),Image.Resampling.NEAREST),(x+36,180-sw*16))
 plate.alpha_composite(art.resize((sw*80,sw*80),Image.Resampling.NEAREST),(x+225,125))
 d.text((x,300),f'{sw*32} x {sw*32} px sprite / {hp} HP',font=f,fill='#ffffff')
 d.text((x,340),f'{(hp+1)//2} hits at 2 damage per shot',font=f,fill='#c6d4ca')
 d.text((x,377),f'{(hp+4)//5} hits at 5 damage per shot',font=f,fill='#c6d4ca')
d.text((32,455),'Left: proposed game size. Right: enlarged art.',font=f,fill='#afc0be')
d.text((32,490),'Rock Breaker required; critical hits and upgrades change hit count.',font=f,fill='#afc0be')
d.text((32,525),'Balance proposal for review; current game remains at 15 HP per rock.',font=f,fill='#afc0be')
plate.convert('RGB').save(ROOT/'rock-size-study.png')
