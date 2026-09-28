"""Build the heart-missile sprite set: Heart_Spin (coin-flip loop), Heart_Pip (trail piece), Heart_Impact (small burst).
All authored at 15 fps, one source frame per sheet frame."""
import json, copy, random, string, os, sys, math
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
from pxc import load, save
ROOT=os.path.abspath(os.path.join(HERE,"..",".."))
EX=os.path.join(ROOT,"assets","fx","pixelcomposer")+"/"
SHEETS=os.path.join(ROOT,"assets","fx","sheets")+"/"
def abgr(hx): r,g,b=int(hx[1:3],16),int(hx[3:5],16),int(hx[5:7],16); return (255<<24)|(b<<16)|(g<<8)|r
INK,DARK,RED,PINK,WHITE,MAROON="#181425","#a22633","#e43b44","#f6757a","#ffffff","#733e39"
def key(f,v): return [[0,f],v,[0,1],[0,0],0,0,True,0,16777215]
def anim(inp,keys): inp["anim"]=True; inp["r"]=[key(f,v) for f,v in keys]
T=lambda f: json.load(open(os.path.join(HERE,"templates",f)))

class Project:
    def __init__(s,W,H,FR):
        s.W,s.H,s.FR=W,H,FR
        s.h,s.j=load(EX+"Dust_Burst.pxc"); s.old={n["type"]:n for n in s.j["nodes"]}
        s.exp=[n for n in s.j["nodes"] if n["type"]=="Node_Export"][0]; s.nodes=[]
    def add(s,n,name,x,y):
        n=copy.deepcopy(n)
        for i in n["inputs"]:
            if isinstance(i,dict) and "from_node" in i: i.pop("from_node"); i.pop("from_index",None)
        n["id"]="ch"+''.join(random.choices(string.ascii_letters,k=20)); n["name"]=name; n["iname"]=name.replace(" ","_")
        n["x"],n["y"]=x,y; n.pop("group",None); n.pop("ictx",None); s.nodes.append(n); return n
    @staticmethod
    def link(d,i,src): d["inputs"][i]["from_node"]=src["id"]; d["inputs"][i]["from_index"]=0
    def shape(s,name,kind,color,keys,y,inner=None):
        """keys: [(frame,cx,cy,rx,ry)] px; a single tuple = static"""
        n=s.add(T("shape_node.json"),name,0,y); I=n["inputs"]
        I[0]["r"]["d"]=[s.W,s.H]; I[2]["r"]["d"]=kind; I[15]["r"]["d"]=0; I[6]["r"]["d"]=False; I[10]["r"]["d"]=abgr(color)
        if inner is not None: I[5]["r"]["d"]=inner
        v=lambda a,b,c,d:[a/s.W,b/s.H,c/s.W,d/s.H,0,0]
        if len(keys)==1: I[3]["r"]["d"]=v(*keys[0][1:])
        else: anim(I[3],[(k[0],v(*k[1:])) for k in keys])
        return n
    def blend(s,bg,fg,y,opacity=None):
        b=s.add(s.old["Node_Blend"],"Blend",192,y); I=b["inputs"]; s.link(b,0,bg); s.link(b,1,fg)
        I[2]["r"]["d"]=0; I[7]["r"]["d"]=[s.W,s.H]
        if opacity: anim(I[3],opacity)
        else: I[3]["r"]["d"]=1
        return b
    def stack(s,layers):
        cur=layers[0][0]
        for k,(lay,op) in enumerate(layers[1:]): cur=s.blend(cur,lay,160*k,op)
        return cur
    def finish(s,src,name,outline=True,loop=False,anchor=None,notes=""):
        cur=src
        if outline:
            o=s.add(T("outline_node.json"),"Outline",576,0); I=o["inputs"]; s.link(o,0,cur)
            I[1]["r"]["d"]=1; I[2]["r"]["d"]=abgr(INK); I[5]["r"]["d"]=1; I[6]["r"]["d"]=0; cur=o
        p=s.add(s.old["Node_Posterize"],"Posterize",768,0); s.link(p,0,cur)
        ss=s.add(s.old["Node_Render_Sprite_Sheet"],"Render Spritesheet",960,0); s.link(ss,0,p)
        ss["inputs"][2]["r"]["d"]=1; ss["inputs"][11]["r"]["d"]=False; ss["inputs"][3]["r"]["d"]=0
        e=s.add(s.exp,"Export Sheet",1152,0); s.link(e,0,ss); e["inputs"][1]["r"]["d"]=SHEETS+f"{name}.png"
        j=s.j; j["nodes"]=s.nodes
        if isinstance(j.get("timelines"),dict): j["timelines"]["contents"]=[]
        j["attributes"]["surface_dimension"]=[s.W,s.H]; j["animator"]["frames_total"]=s.FR; j["animator"]["framerate"]=15
        j["previewNode"]=p["id"]; j["inspectingNode"]=p["id"]
        out=EX+name+".pxc"; save(out,s.h,j)
        h2,j2=load(out); ids={n["id"] for n in j2["nodes"]}
        bad=[(n["name"],k) for n in j2["nodes"] for k,i in enumerate(n["inputs"]) if isinstance(i,dict) and "from_node" in i and i["from_node"] not in ids]
        print(f"{name:13s} {s.W}x{s.H} {s.FR}f | {len(ids)} nodes | dangling: {bad}")
        ax,ay=anchor or (s.W//2,s.H//2)
        json.dump({"image":name+".png","frame_width":s.W,"frame_height":s.H,"frame_count":s.FR,"layout":"horizontal strip, no spacing",
          "fps":15,"duration_s":round(s.FR/15,3),"loop":loop,"anchor":{"x":ax,"y":ay,"from":"top-left of each frame"},
          "flip_horizontally_for":None,"notes":notes,"smoothing":"none (nearest neighbor)"},open(SHEETS+f"{name}.json","w"),indent=2)

YEL,ORA,FLAME="#fee761","#feae34","#f77622"
CREME,PURPLE,PLUM="#ead4aa","#b55088","#68386c"
def heart_spin():
    P=Project(32,32,12); C=16; R=12
    th=[2*math.pi*f/12 for f in range(12)]
    sx=[max(0.1,abs(math.cos(t))) for t in th]
    front_on=[1.0 if math.cos(t)>=0 else 0.0 for t in th]
    # face shading: dark rim bottom-right, lit face nudged up-left, pink lobe, white specular
    f_rim =P.shape("Front Rim","Heart",DARK,[(0,C,C,R,R-0.5)],0)
    f_face=P.shape("Front Face","Heart",RED,[(0,C-0.8,C-1,R-1.2,R-1.8)],160)
    f_lobe=P.shape("Front Lobe","Ellipse",PINK,[(0,C-5,C-4,3.2,2.6)],320)
    f_spec=P.shape("Specular","Ellipse",WHITE,[(0,C-6,C-5.5,1.3,1.1)],480)
    b_rim =P.shape("Back Rim","Heart",MAROON,[(0,C,C,R,R-0.5)],640)
    b_face=P.shape("Back Face","Heart",DARK,[(0,C+0.8,C-1,R-1.2,R-1.8)],800)
    b_lobe=P.shape("Back Lobe","Ellipse",RED,[(0,C+5,C-4,3,2.4)],960)
    face=P.blend(P.stack([(b_rim,None),(b_face,None),(b_lobe,None)]),
                 P.stack([(f_rim,None),(f_face,None),(f_lobe,None),(f_spec,None)]),1120,
                 [(f,front_on[f]) for f in range(12)])
    side=P.shape("Thickness","Heart",MAROON,[(0,C,C,R,R-0.5)],1280)
    def flip(src,name,dx):
        t=P.add(T("transform_node.json"),name,384,0); I=t["inputs"]; P.link(t,0,src)
        I[3]["r"]["d"]=[0.5,0.5]; I[4]["r"]["d"]=True
        anim(I[2],[(f,[C+dx[f],C]) for f in range(12)])
        anim(I[6],[(f,[round(sx[f],3),1]) for f in range(12)])
        return t
    # thickness slides out from behind the face as it turns (opposite side of the turn)
    # extrude: stack copies at evenly spaced offsets so the band is continuous and attached to the face
    N,DEPTH=6,2.6
    steps=[flip(side,f"Thickness {k}",[-DEPTH*math.sin(t)*k/N for t in th]) for k in range(1,N+1)]
    band=P.stack([(st,None) for st in steps])
    face_t=flip(face,"Coin Flip",[0.0]*12)
    P.finish(P.blend(band,face_t,1440),"Heart_Spin",loop=True,
             notes="3D coin-flip loop, heart ~24px: front 0-3 & 9-11, back 4-8; thickness band shows at the edge frames (3, 9); 0.8 s per turn")

def heart_pip():
    P=Project(16,16,6); C=8
    core=P.shape("Hot Core","Ellipse",CREME,[(0,C,C,2.5,2.5),(1,C,C,1.5,1.5),(2,C,C,0,0)],0)
    layers=[(core,None)]
    # (angle deg, distance px, color, start frame, peak radius): scattered flame blobs
    for k,(ang,dist,col,f0,r) in enumerate([(200,5,PINK,0,2.2),(150,6,PURPLE,0,2.0),(250,4,PINK,1,1.8),(100,5,RED,1,1.6),(310,4,PLUM,2,1.4)]):
        a=math.radians(ang); px=lambda t: C+dist*t*math.cos(a); py=lambda t: C-dist*t*math.sin(a)
        ks=[(0,C,C,0,0)] if f0>0 else []
        ks+=[(f0,px(0.2),py(0.2),r*0.7,r*0.7),(f0+1,px(0.55),py(0.55),r,r),(f0+2,px(0.85),py(0.85),r*0.6,r*0.6),(f0+3,px(1.0),py(1.0),0,0)]
        layers.append((P.shape(f"Flame {k+1}","Ellipse",col,[k_ for k_ in ks if k_[0]<=5],160*(k+1)),None))
    P.finish(P.stack(layers),"Heart_Pip",outline=False,
             notes="heart-exhaust flicker: creme core + 5 scattered blobs (pink/purple/red/plum); spawn along the path every few frames")

def heart_impact():
    P=Project(32,32,8); C=16
    flash=P.shape("Core Flash","Ellipse",WHITE,[(0,C,C,3,3),(1,C,C,5,5),(2,C,C,4,4),(3,C,C,0,0)],0)
    puffs=[]
    for k,(dx,dy,col,f0) in enumerate([(-3,-2,PINK,1),(3,1,RED,1),(0,4,PINK,2),(-2,-5,RED,2)]):
        puffs.append(P.shape(f"Puff {k+1}","Ellipse",col,
            [(0,C+dx,C+dy,0,0),(f0-1,C+dx,C+dy,0,0),(f0,C+dx,C+dy,2.5,2.5),(f0+2,C+dx*1.4,C+dy*1.4,4,4),(f0+4,C+dx*1.6,C+dy*1.6,2,2),(f0+5,C+dx*1.6,C+dy*1.6,0,0)],160*(k+1)))
    hearts=[]
    for k in range(5):
        a=math.radians(-90+72*k); ks=[(0,C,C,0,0)]
        for f,dist,r in [(1,4,2.5),(3,9,2.2),(5,12,1.6),(6,13,1.0),(7,13,0)]:
            ks.append((f,C+dist*math.cos(a),C+dist*math.sin(a),r,r*0.9))
        hearts.append(P.shape(f"Mini Heart {k+1}","Heart",RED,ks,800+160*k))
    P.finish(P.stack([(flash,None)]+[(p,None) for p in puffs]+[(h,None) for h in hearts]),"Heart_Impact",
             notes="small burst at the impact point: flash, pink/red puffs, 5 mini hearts thrown outward")

if __name__=="__main__":
    which=sys.argv[1:] or ["spin","pip","impact"]
    for w in which: {"spin":heart_spin,"pip":heart_pip,"impact":heart_impact}[w]()
