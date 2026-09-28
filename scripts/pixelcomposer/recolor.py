"""Hue-rotate every color value in a .pxc (plain ints, gradient keys, palettes)."""
import json,sys,colorsys,os
from pxc import load,save
def rot(c,deg):
    c=int(c); a=(c>>24)&255; b=(c>>16)&255; g=(c>>8)&255; r=c&255
    h,l,s=colorsys.rgb_to_hls(r/255,g/255,b/255)
    r,g,b=colorsys.hls_to_rgb((h+deg/360)%1,l,s)
    return (a<<24)|(round(b*255)<<16)|(round(g*255)<<8)|round(r*255)
def is_col(v): return isinstance(v,(int,float)) and not isinstance(v,bool) and 4278190080<=v<=4294967295 and v==int(v)
def fix(v,deg):
    if is_col(v): return rot(v,deg)
    if isinstance(v,list) and v and all(is_col(x) for x in v): return [rot(x,deg) for x in v]
    if isinstance(v,str) and '"keys"' in v:
        g=json.loads(v)
        for k in g["keys"]:
            if is_col(k["value"]): k["value"]=float(rot(k["value"],deg))
        return json.dumps(g)
    return v
src,dst,deg=sys.argv[1],sys.argv[2],float(sys.argv[3])
h,j=load(src); n=0
for node in j["nodes"]:
    if node["type"]=="Node_Export": continue
    for i in node["inputs"]:
        if "r" in i and "d" in i["r"]:
            new=fix(i["r"]["d"],deg)
            if new!=i["r"]["d"]: i["r"]["d"]=new; n+=1
    # retarget export path
for node in j["nodes"]:
    if node["type"]=="Node_Export":
        name=os.path.splitext(os.path.basename(dst))[0]
        os.makedirs(f"out_{name}",exist_ok=True)
        node["inputs"][1]["r"]["d"]=os.path.abspath(f"out_{name}/{name}.png")
save(dst,h,j); print("changed",n,"values ->",dst)
