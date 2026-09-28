import zlib,json,struct,sys
def load(p):
    d=open(p,"rb").read()
    i=d.index(b'META'); m=struct.unpack("<I",d[i+4:i+8])[0]
    return d[:i+8+m], json.loads(zlib.decompress(d[i+8+m:]).rstrip(b'\x00'))
def save(p,head,j):
    raw=json.dumps(j,separators=(',',':')).encode()+b'\x00'
    open(p,"wb").write(head+zlib.compress(raw))
