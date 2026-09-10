from pathlib import Path
import json
from xml.etree import ElementTree
root=Path(__file__).resolve().parents[1]
out=root/'assets/placeholder'
palette={'o':'#182337','w':'#fff1d2','b':'#69c9ff','g':'#8ddd91','p':'#c29bff','r':'#f17f83','y':'#ffd36e','d':'#537052'}
patterns={
'player':('b',['...oooo...','..obbbbo..','..owowwo..','...owwo...','..obbbbo..','.obbbbboo.','..obbbbo..','..oo..oo..']),
'creature-striker':('b',['..o....o..','.obo..obo.','.obboobbo.','..obbbbo..','.obwowbo..','.obbbboo..','..obbbbo..','...o..o...']),
'creature-healer':('g',['....gg....','...gggg...','....gg....','..oooooo..','.oggggggo.','.ogwowggo.','..oggggo..','...oooo...']),
'creature-aoe':('p',['..oo..oo..','.oppooppo.','.oppppppo.','opwpppwppo','oppppppppo','.oppppppo.','..oppppo..','...oooo...']),
'enemy-basic':('r',['..........','...oooo...','..orrrro..','.orrrrrro.','.orwowrro.','.orrrrrro.','..oooooo..','..........']),
'enemy-armored':('r',['..oooooo..','.orrrrrro.','orooooooro','orowwoworo','orooooooro','.orrrrrro.','..oo..oo..','..........']),
'enemy-ranged':('r',['....oo....','...orro...','..orwrro..','.orrorrro.','..orrrro..','...orro...','....oo....','..........']),
'boss':('r',['.oo....oo.','orro..orro','orrrrrrrro','orwrrrw r o'.replace(' ',''), 'orrrrrrrro','.orooorro.','..orrrro..','...oooo...']),
'gold':('y',['...yyyy...','..ywwwyy..','.ywyoyyyy.','.ywyoyyyy.','.ywyoyyyy.','..yyyyyy..','...yyyy...','..........']),
'heart':('r',['..........','.rrr..rrr.','rrrrrrrrrr','rrrrrrrrrr','.rrrrrrrr.','..rrrrrr..','...rrrr...','....rr....']),
'heal':('g',['...gggg...','...gggg...','.gggggggg.','.gggggggg.','...gggg...','...gggg...','..........','..........']),
'crosshair':('b',['....bb....','..bbbbbb..','.bb.bb.bb.','.b..bb..b.','bbbbbbbbbb','.b..bb..b.','.bb.bb.bb.','..bbbbbb..']),
'auto-target':('y',['....yy....','...yyyy...','..yy..yy..','.yy.yy.yy.','.yy.yy.yy.','..yy..yy..','...yyyy...','....yy....']),
'lock':('w',['...oooo...','..owwwwo..','..ow..wo..','.oooooooo.','.owwwwwwo.','.owwowwwo.','.owwwwwwo.','.oooooooo.']),
'node-complete':('g',['...gggg...','..gggggg..','.gggggggg.','.gggggwgg.','.ggwgwggg.','..ggwggg..','...gggg...','..........']),
'node-open':('y',['...yyyy...','..y....y..','.y......y.','.y..yy..y.','.y..yy..y.','..y....y..','...yyyy...','..........']),
'projectile-player':('b',['..........','..........','....bb....','..bbwwbb..','....bb....','..........','..........','..........']),
'projectile-enemy':('r',['..........','....rr....','...rrrr...','..rrwwrr..','...rrrr...','....rr....','..........','..........']),
'impact':('y',['y...y....y','.y..y...y.','..y.y.yy..','...yyyy...','yyyywwyyyy','...yyyy...','..y.y..y..','.y..y...y.']),
'grass-tile':('d',['dddddddddd','ddgddddddd','dddddddgdd','dddddddddd','dddddddddd','dgdddddddd','ddddddgddd','dddddddddd']),
'path-tile':('y',['yyyyyyyyyy','yyyywyyyyy','yyyyyyyyyy','yyyyyyyyyy','yywyyyyyyy','yyyyyyyyyy','yyyyyyywyy','yyyyyyyyyy'])}
manifest={}
for name,(color,rows) in patterns.items():
    cells=''.join(f'<rect x="{x+3}" y="{y+4}" width="1" height="1" fill="{palette[c]}"/>' for y,row in enumerate(rows) for x,c in enumerate(row) if c!='.')
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges"><title>{name}</title>{cells}</svg>'
    if name.endswith('-tile'):
        svg=svg.replace('<title>',f'<rect width="16" height="16" fill="{palette[color]}"/><title>')
    ElementTree.fromstring(svg)
    (out/f'{name}.svg').write_text(svg)
    manifest[name]={'path':f'assets/placeholder/{name}.svg','width':16,'height':16}
(root/'assets/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
cards=''.join(f'<article><img src="assets/placeholder/{n}.svg"><span>{n}</span></article>' for n in patterns)
(root/'asset-preview.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>ScollMonsters assets</title><style>body{background:#101827;color:#fff1d2;font:16px system-ui;margin:40px}h1{margin-bottom:8px}p{color:#a8b7cb}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}article{background:#202d41;border:1px solid #34455f;border-radius:12px;padding:22px;display:flex;align-items:center;flex-direction:column;gap:12px}img{width:96px;height:96px;image-rendering:pixelated}span{font-size:13px}</style><h1>ScollMonsters / starter assets</h1><p>Original geometric placeholders · 16 × 16 SVG · scale in whole-number multiples</p><main>'''+cards+'</main></html>')
print(f'Created and XML-validated {len(manifest)} SVG assets, manifest, and preview.')
