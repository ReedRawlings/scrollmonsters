import json,sys,copy,random,string,math,os
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
from pxc import load,save
ROOT=os.path.abspath(os.path.join(HERE,"..",".."))
EX=os.path.join(ROOT,"assets","fx","pixelcomposer")+"/"
SRC=EX+"Dust_Trail.pxc"
RAMP=["#e4a672","#c28569","#b86f50","#733e39","#3e2731"]
def abgr(hx): r,g,b=int(hx[1:3],16),int(hx[3:5],16),int(hx[5:7],16); return float((255<<24)|(b<<16)|(g<<8)|r)
def key(f,v): return [[0,f],v,[0,1],[0,0],0,0,True,0,16777215]
def build(out,W,H,p0,p1):
    h,j=load(SRC)
    N=lambda t:[n for n in j["nodes"] if n["type"]==t]
    j["attributes"]["surface_dimension"]=[W,H]; N("Node_Blend")[0]["inputs"][7]["r"]["d"]=[W,H]
    P=N("Node_Particle")[0]["inputs"]
    def sv(i,v): P[i]["r"]["d"]=v
    tail=P[3]["r"][0][1][4:]
    P[3]["r"]=[key(0,[p0[0]/W,p0[1]/H,0.02,0.03]+tail), key(27,[p1[0]/W,p1[1]/H,0.02,0.03]+tail)]
    travel=math.degrees(math.atan2(-(p1[1]-p0[1]),p1[0]-p0[0])); back=(travel+180)%360
    sv(6,[0,round(back-50,1),round(back+50,1),0,0])
    sv(15,False); sv(8,[0,0,0,0,0])
    sc=P[10]["r"]["d"]; sv(10,[round(sc[0]*0.7,3),round(sc[1]*0.7,3)]+sc[2:]); sv(2,[3,4])
    ca=N("Node_Cache_Array")[0]; src_id=ca["inputs"][0]["from_node"]
    t=copy.deepcopy(json.load(open("transform_node.json")))
    t["id"]="claudeIso"+''.join(random.choices(string.ascii_letters,k=20)); t["name"]="Iso Squash"; t["iname"]="Iso_Squash"
    t["x"],t["y"]=ca["x"],ca["y"]-128
    ti=t["inputs"]; ti[0]["from_node"]=src_id; ti[0]["from_index"]=0
    ti[2]["r"]["d"]=[W/2,H/2]; ti[3]["r"]["d"]=[0.5,0.5]; ti[4]["r"]["d"]=True; ti[6]["r"]["d"]=[1,0.5]
    ca["inputs"][0]["from_node"]=t["id"]; ca["inputs"][0]["from_index"]=0
    j["nodes"].append(t)
    cz=N("Node_Colorize")[0]; g=json.loads(cz["inputs"][1]["r"]["d"])
    g["keys"]=[{"time":i/(len(RAMP)-1),"value":abgr(c)} for i,c in enumerate(RAMP)]
    cz["inputs"][1]["r"]["d"]=json.dumps(g)
    save(out,h,j); load(out)
    print(f"{out.split('/')[-1]:20s} {W}x{H}  path {p0}->{p1}  travel {travel:6.1f}°  kick {back-50:.0f}°–{back+50:.0f}°")
if __name__=="__main__":
    D=EX
    build(D+"Dust_Trail_E.pxc", 192, 64,(16,32),(176,32))
    build(D+"Dust_Trail_NE.pxc",192,112,(16,96),(176,16))
    build(D+"Dust_Trail_N.pxc",  64,128,(32,112),(32,16))
    build(D+"Dust_Trail_S.pxc",  64,128,(32,16),(32,112))
