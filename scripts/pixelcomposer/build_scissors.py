"""Build Scissor_Snip.pxc: scissors pop in open, slowly close around the pivot, snip (spark), and vanish.
Each half (blade + edge + handle) is drawn pointing right from the pivot, then rotated about the pivot by a keyframed Transform."""
import json, copy, random, string, os, sys
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
from pxc import load, save
ROOT=os.path.abspath(os.path.join(HERE,"..",".."))
EX=os.path.join(ROOT,"assets","fx","pixelcomposer")+"/"
SHEETS=os.path.join(ROOT,"assets","fx","sheets")+"/"
W,H,FR=64,64,32; PX,PY=32,32          # pivot = canvas center = anchor
BASE=45                                  # scissors point up-right
def abgr(hx): r,g,b=int(hx[1:3],16),int(hx[3:5],16),int(hx[5:7],16); return (255<<24)|(b<<16)|(g<<8)|r
STEEL,EDGE,CRIMSON,RED,SCREW,SPARK,INK="#8b9bb4","#c0cbdc","#a22633","#e43b44","#3a4466","#ffffff","#181425"
def key(f,v): return [[0,f],v,[0,1],[0,0],0,0,True,0,16777215]
def anim(inp,keys): inp["anim"]=True; inp["r"]=[key(f,v) for f,v in keys]
def nid(p): return p+''.join(random.choices(string.ascii_letters,k=20))
h,j=load(EX+"Dust_Burst.pxc")
old={n["type"]:n for n in j["nodes"]}
T=lambda f: json.load(open(os.path.join(HERE,"templates",f)))
nodes=[]
def unlink(n):
    for i in n["inputs"]:
        if isinstance(i,dict) and "from_node" in i: i.pop("from_node"); i.pop("from_index",None)
    return n
def add(n,name,x,y):
    n=unlink(copy.deepcopy(n)); n["id"]=nid("cs"); n["name"]=name; n["iname"]=name.replace(" ","_")
    n["x"],n["y"]=x,y; n.pop("group",None); n.pop("ictx",None); nodes.append(n); return n
def link(dst,i,src,oi=0): dst["inputs"][i]["from_node"]=src["id"]; dst["inputs"][i]["from_index"]=oi
def shape(name,kind,color,x,y,cx,cy,rx,ry,inner=None,sides=None,keys=None):
    s=add(T("shape_node.json"),name,x,y); si=s["inputs"]
    si[0]["r"]["d"]=[W,H]; si[2]["r"]["d"]=kind; si[15]["r"]["d"]=0; si[6]["r"]["d"]=False; si[10]["r"]["d"]=abgr(color)
    if inner is not None: si[5]["r"]["d"]=inner
    if sides is not None: si[4]["r"]["d"]=sides
    if keys: anim(si[3],[(f,[a/W,b/H,c/W,d/H,0,0]) for f,a,b,c,d in keys])
    else: si[3]["r"]["d"]=[cx/W,cy/H,rx/W,ry/H,0,0]
    return s
def blend(name,bg,fg,x,y,opacity=None):
    b=add(old["Node_Blend"],name,x,y); bi=b["inputs"]; link(b,0,bg); link(b,1,fg); bi[2]["r"]["d"]=0; bi[7]["r"]["d"]=[W,H]
    if isinstance(opacity,list): anim(bi[3],opacity)
    else: bi[3]["r"]["d"]=1
    return b

# --- motion: half-spread angle (open -> closed, easing in), overall scale (pop in / shudder / vanish) ---
SPREAD=[(0,25),(5,25),(9,24),(13,21),(16,16),(19,10),(21,4),(22,0),(31,0)]
SCALE =[(0,0.6),(2,0.9),(4,1.0),(21,1.0),(22,1.10),(24,1.0),(27,1.0),(29,0.5),(30,0.15),(31,0.0)]

def half(tag,handle_dy,with_extras,y0):
    # blade: long oval from the pivot to the tip; light edge along one side; handle ring behind the pivot
    body=shape(f"{tag} Blade","Ellipse",STEEL,0,y0,PX+12,PY,13,2.5)
    edge=shape(f"{tag} Blade Edge","Ellipse",EDGE,0,y0+160,PX+11,PY-1,11,1)
    ring=shape(f"{tag} Handle","Donut",CRIMSON,0,y0+320,PX-10,PY+handle_dy,5,4,inner=0.45)
    cur=blend(f"{tag} +edge",body,edge,192,y0)
    cur=blend(f"{tag} +handle",cur,ring,192,y0+160)
    sheen=shape(f"{tag} Sheen","Ellipse",SPARK,96,y0,0,0,0,0,
                keys=[(0,PX+3,PY-1,0,0),(15,PX+3,PY-1,0,0),(16,PX+4,PY-1,3,1),(18,PX+10,PY-1,4,1.5),(20,PX+16,PY-1,4,1.5),(22,PX+22,PY-1,3,1),(23,PX+24,PY-1,0,0)])
    cur=blend(f"{tag} +sheen",cur,sheen,288,y0)
    if with_extras:
        screw=shape("Pivot Screw","Ellipse",SCREW,0,y0+480,PX,PY,2,2)
        cur=blend(f"{tag} +screw",cur,screw,192,y0+320)
        spark=shape("Snip Spark","Star",SPARK,0,y0+640,0,0,0,0,inner=0.35,sides=4,
                    keys=[(0,PX+20,PY,0,0),(21,PX+20,PY,0,0),(22,PX+20,PY,5,5),(23,PX+20,PY,9,9),(24,PX+20,PY,11,11),(25,PX+20,PY,7,7),(26,PX+20,PY,3,3),(27,PX+20,PY,0,0)])
        cur=blend(f"{tag} +spark",cur,spark,192,y0+480)
        glint=shape("Snip Glint","Star",SPARK,0,y0+800,0,0,0,0,inner=0.3,sides=4,
                    keys=[(0,PX+20,PY,0,0),(22,PX+20,PY,0,0),(23,PX+20,PY,3,3),(24,PX+20,PY,7,7),(26,PX+20,PY,5,5),(27,PX+20,PY,0,0)])
        glint["inputs"][7]["r"]["d"]=45
        cur=blend(f"{tag} +glint",cur,glint,192,y0+640)
    return cur

def rotate(tag,src,sign,y0):
    t=add(T("transform_node.json"),f"{tag} Rotate",384,y0); ti=t["inputs"]; link(t,0,src)
    ti[2]["r"]["d"]=[PX,PY]; ti[3]["r"]["d"]=[PX/W,PY/H]; ti[4]["r"]["d"]=True
    anim(ti[5],[(f,BASE+sign*a) for f,a in SPREAD])
    anim(ti[6],[(f,[s,s]) for f,s in SCALE])
    return t

A=rotate("Half A",half("Half A",+3,True,0),+1,0)
B=rotate("Half B",half("Half B",-3,False,1280),-1,1280)
both=blend("Both Halves",B,A,576,640)
ol=add(T("outline_node.json"),"Outline",768,640); oi=ol["inputs"]; link(ol,0,both)
oi[1]["r"]["d"]=1; oi[2]["r"]["d"]=abgr(INK); oi[5]["r"]["d"]=1; oi[6]["r"]["d"]=0
post=add(old["Node_Posterize"],"Posterize",960,640); link(post,0,ol)
ss=add(old["Node_Render_Sprite_Sheet"],"Render Spritesheet",1152,640); link(ss,0,post)
ex=add([n for n in j["nodes"] if n["type"]=="Node_Export"][0],"Export Sheet",1344,640); link(ex,0,ss)
ex["inputs"][1]["r"]["d"]=SHEETS+"Scissor_Snip.png"

j["nodes"]=nodes
if isinstance(j.get("timelines"),dict): j["timelines"]["contents"]=[]
j["attributes"]["surface_dimension"]=[W,H]; j["animator"]["frames_total"]=FR
j["previewNode"]=post["id"]; j["inspectingNode"]=post["id"]
out=sys.argv[1] if len(sys.argv)>1 else EX+"Scissor_Snip.pxc"
save(out,h,j)
h2,j2=load(out); ids={n["id"] for n in j2["nodes"]}
bad=[(n["name"],k) for n in j2["nodes"] for k,i in enumerate(n["inputs"]) if isinstance(i,dict) and "from_node" in i and i["from_node"] not in ids]
print(f"saved {out} | {len(j2['nodes'])} nodes | unique ids: {len(ids)==len(j2['nodes'])} | dangling links: {bad}")
if out.startswith(EX):
    json.dump({"image":"Scissor_Snip.png","frame_width":W,"frame_height":H,"frame_count":FR//2,"layout":"horizontal strip, no spacing",
      "fps":15,"duration_s":round(FR/2/15,3),"loop":False,"anchor":{"x":PX,"y":PY,"from":"top-left of each frame","what":"scissor pivot"},
      "flip_horizontally_for":None,"notes":"pops in open (sheet 0-2), slow close with blade sheen (3-11), snip + star spark (11-13), vanishes (13-15)",
      "smoothing":"none (nearest neighbor)"},open(SHEETS+"Scissor_Snip.json","w"),indent=2)
