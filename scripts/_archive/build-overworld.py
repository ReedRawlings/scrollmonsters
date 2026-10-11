from PIL import Image,ImageDraw
from pathlib import Path
import random
root=Path(__file__).resolve().parent.parent
sheet=Image.open(root/'assets/PUNY_WORLD_v1/punyworld-overworld-tileset.png').convert('RGBA')
im=Image.new('RGBA',(256,160));r=random.Random(57)
def tile(x,y,px,py,w=1,h=1):im.alpha_composite(sheet.crop((x*16,y*16,(x+w)*16,(y+h)*16)),(px,py))
for y in range(10):
 for x in range(16):tile(r.choice([0,1,2]),0,x*16,y*16)
# Narrow connected route, colored from the source sheet's path interior.
d=ImageDraw.Draw(im);sand=sheet.getpixel((8*16+8,24));d.line([(25,117),(233,117),(233,37),(25,37)],fill=sand,width=7)
for x,y in [(0,0),(64,0),(144,0),(208,0),(0,128),(80,128),(160,128)]:tile(0,7,x,y,3,2)
for x,y in [(16,60),(180,60),(96,76)]:tile(0,4,x,y,3,3)
tile(6,10,120,48,3,3)
# Settlements on the route, leaving room for stage-number markers below.
for i,x in enumerate([25,77,129,181,233]):
 tile(4+i,26,x-8,98)
 tile(7+i,33,x-8,18)
im.save(root/'assets/scenery/overworld.png')
