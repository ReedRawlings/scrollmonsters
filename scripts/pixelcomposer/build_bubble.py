"""Build Bubble_Burst.pxc: a bubble grows, pops, and sends a 2:1 iso shockwave + droplets along the ground.
Base project settings come from Dust_Burst.pxc; its nodes are replaced with a new graph built from templates."""
import json, copy, random, string, os, sys
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
from pxc import load, save
ROOT=os.path.abspath(os.path.join(HERE,"..",".."))
EX=os.path.join(ROOT,"assets","fx","pixelcomposer")+"/"
SHEETS=os.path.join(ROOT,"assets","fx","sheets")+"/"
W,H,FR=96,96,32                 # 30 fps source; sheet takes every other frame -> 16 frames @15fps
GX,GY=48,48                     # ground anchor (ring / shadow center)
POP=18                          # bubble visible 0..17, pop flash 18..19, ring+droplets 18..31
def abgr(hx,a=255): r,g,b=int(hx[1:3],16),int(hx[3:5],16),int(hx[5:7],16); return (a<<24)|(b<<16)|(g<<8)|r
DEEP,MID,CYAN,WHITE="#5d6b79","#78949b","#c2b5c4","#ffffff"
def key(f,v): return [[0,f],v,[0,1],[0,0],0,0,True,0,16777215]
def anim(inp,keys): inp["anim"]=True; inp["r"]=[key(f,v) for f,v in keys]
def nid(p): return p+''.join(random.choices(string.ascii_letters,k=20))

h,j=load(EX+"Dust_Burst.pxc")
old={n["type"]:n for n in j["nodes"]}
T=lambda f: json.load(open(os.path.join(HERE,"templates",f)))
nodes=[]
def add(n,name,x,y):
    n=copy.deepcopy(n); n["id"]=nid("cb"); n["name"]=name; n["iname"]=name.replace(" ","_")
    n["x"],n["y"]=x,y; n.pop("group",None); n.pop("ictx",None); nodes.append(n); return n
def link(dst,i,src,oi=0): dst["inputs"][i]["from_node"]=src["id"]; dst["inputs"][i]["from_index"]=oi

def shape(name,kind,color,x,y,circle_keys=None,inner=None,dim=(W,H)):
    s=add(T("shape_node.json"),name,x,y); si=s["inputs"]
    si[0]["r"]["d"]=list(dim); si[2]["r"]["d"]=kind; si[15]["r"]["d"]=0 if circle_keys else 2; si[6]["r"]["d"]=False; si[10]["r"]["d"]=color
    if inner is not None:
        if isinstance(inner,list): anim(si[5],inner)
        else: si[5]["r"]["d"]=inner
    if circle_keys:   # [(frame, cx, cy, rx, ry)] in px -> set every positioning mode consistently
        dw,dh=dim
        anim(si[3], [(f,[cx/dw,cy/dh,rx/dw,ry/dh,0,0]) for f,cx,cy,rx,ry in circle_keys])
        anim(si[16],[(f,[cx/dw,cy/dh]) for f,cx,cy,rx,ry in circle_keys])
        anim(si[17],[(f,[rx/dw,ry/dh]) for f,cx,cy,rx,ry in circle_keys])
        anim(si[32],[(f,[(cx-rx)/dw,(cy-ry)/dh]) for f,cx,cy,rx,ry in circle_keys])
        anim(si[33],[(f,[(cx+rx)/dw,(cy+ry)/dh]) for f,cx,cy,rx,ry in circle_keys])
    return s

# --- bubble growth with slight wobble: (frame, rx, ry) ---
grow=[(0,2,2),(4,9,8),(8,15,16),(12,20,19),(14,23,24),(16,25,21),(17,27,20),(POP,27,20)]
bub=lambda f,rx,ry:(f,GX,GY,rx,ry)                    # fixed center: grows evenly outward
# (ground shadow removed at user's request)
fill  = shape("Bubble Fill","Ellipse",abgr(MID),0,320,[bub(*g) for g in grow])
rim   = shape("Bubble Rim","Donut",abgr(CYAN),0,480,[bub(*g) for g in grow],inner=0.12)
hl    = shape("Highlight","Ellipse",abgr(WHITE),0,640,[(f,GX-0.4*rx,GY-0.45*ry,max(1,0.2*rx),max(1,0.2*ry)) for f,rx,ry in grow])
BCY=GY            # bubble center (fixed)
flash = shape("Pop Flash","Donut",abgr(WHITE),0,800,[(0,GX,BCY,0,0),(POP-1,GX,BCY,0,0),(POP,GX,BCY,28,21),(POP+1,GX,BCY,31,24),(POP+2,GX,BCY,0,0)],inner=0.25)
# --- small bubbles: blink in around the pop point, swell, float up a little, pop out (staggered) ---
# (offset_x, offset_y, radius, start_frame) relative to the big bubble's center at the pop
MINIS=[(-14,-6,4,POP),(12,-10,5,POP+1),(-6,10,3,POP+2),(16,6,4,POP+3),(-18,4,3,POP+5),(4,-16,4,POP+6)]
minis=[]
for k,(dx,dy,r,f0) in enumerate(MINIS):
    cx,cy=GX+dx,BCY+dy
    keys=[(0,cx,cy,0,0),(f0-1,cx,cy,0,0),(f0,cx,cy,r-1,r-1),(f0+2,cx,cy-1,r,r),(f0+4,cx,cy-2,r+1,r+1),(f0+5,cx,cy-2,0,0)]
    minis.append(shape(f"Small Bubble {k+1}","Donut",abgr(CYAN),192,960+160*k,keys,inner=0.4))
# --- stack layers; per-layer visibility via animated Blend opacity ---
def vis(on,off,a=1.0): return [(0,a if on==0 else 0.0)] + ([(on-1,0.0),(on,a)] if on>0 else []) + ([(off,a),(off+1,0.0)] if off is not None else [])
layers=[(fill,vis(0,POP-1,0.35)),(rim,vis(0,POP-1)),(hl,vis(0,POP-1)),
        ]+[(m,None) for m in minis]
cur=flash
for k,(layer,v) in enumerate(layers):
    b=add(old["Node_Blend"],f"Blend {k+1}",576,160*k); bi=b["inputs"]
    for i in bi:
        if isinstance(i,dict) and "from_node" in i: i.pop("from_node"); i.pop("from_index",None)
    link(b,0,cur); link(b,1,layer); bi[2]["r"]["d"]=0; bi[7]["r"]["d"]=[W,H]
    if v: anim(bi[3],v)
    else: bi[3]["r"]["d"]=1
    cur=b

post=add(old["Node_Posterize"],"Posterize",768,480)
from fxlib import palette; post["inputs"][1]["r"]["d"]=palette("Toasted40W")   # base project still carries Endesga
for i in post["inputs"]:
    if isinstance(i,dict) and "from_node" in i: i.pop("from_node"); i.pop("from_index",None)
link(post,0,cur)
ss=add(old["Node_Render_Sprite_Sheet"],"Render Spritesheet",960,480)
for i in ss["inputs"]:
    if isinstance(i,dict) and "from_node" in i: i.pop("from_node"); i.pop("from_index",None)
link(ss,0,post)
ex=add([n for n in j["nodes"] if n["type"]=="Node_Export"][0],"Export Sheet",1152,480); ei=ex["inputs"]
link(ex,0,ss); ei[1]["r"]["d"]=SHEETS+"Bubble_Burst.png"

j["nodes"]=nodes
if isinstance(j.get("timelines"),dict): j["timelines"]["contents"]=[]   # drop refs to removed nodes
j["attributes"]["surface_dimension"]=[W,H]; j["animator"]["frames_total"]=FR
j["previewNode"]=post["id"]; j["inspectingNode"]=post["id"]
out=sys.argv[1] if len(sys.argv)>1 else EX+"Bubble_Burst.pxc"
save(out,h,j)
# verify: reload, every link resolves, ids unique
h2,j2=load(out); ids={n["id"] for n in j2["nodes"]}
bad=[(n["name"],k) for n in j2["nodes"] for k,i in enumerate(n["inputs"]) if isinstance(i,dict) and "from_node" in i and i["from_node"] not in ids]
print(f"saved {out} | {len(j2['nodes'])} nodes | unique ids: {len(ids)==len(j2['nodes'])} | dangling links: {bad}")
json.dump({"image":"Bubble_Burst.png","frame_width":W,"frame_height":H,"frame_count":FR//2,"layout":"horizontal strip, no spacing",
  "fps":15,"duration_s":round(FR/2/15,3),"loop":False,"anchor":{"x":GX,"y":GY,"from":"top-left of each frame","what":"bubble center"},
  "flip_horizontally_for":None,"notes":"bubble grows sheet frames 0-8, pops at frame 9 (flash), small bubbles blink in and pop around it 9-15",
  "smoothing":"none (nearest neighbor)"},open(SHEETS+"Bubble_Burst.json","w"),indent=2)
