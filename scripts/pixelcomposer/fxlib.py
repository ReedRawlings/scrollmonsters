"""Shared helpers for building Pixel Composer effects from node templates.

    P = Project(48, 32, 12)                       # canvas W x H, frame count (authored at 15 fps)
    a = P.shape("Ring", "Donut", "#53414f", [(0, cx, cy, rx, ry)], inner=0.12)
    b = P.shape("Dot", "Ellipse", "#f7b750", [(0, x, y, 0, 0), (4, x, y, 3, 2)])   # keyframed
    top = P.stack([(a, None), (b, [(0, 0.0), (3, 0.0), (4, 1.0)])])                # (layer, opacity keys)
    P.finish(top, "Effect_Name", loop=False, anchor=(24, 16), notes="...")

Positions/sizes are pixels: (frame, center_x, center_y, half_width, half_height). Shapes use Area positioning
(mode 0). Opacity keys animate the Blend that puts a layer on top of everything below it.
"""
import json, copy, random, string, os
from pxc import load, save

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
EX = os.path.join(ROOT, "assets", "fx", "pixelcomposer") + "/"
SHEETS = os.path.join(ROOT, "assets", "fx", "sheets") + "/"
BASE = EX + "Dust_Burst.pxc"   # borrows project settings + Blend/Posterize/Spritesheet/Export nodes


def abgr(hx):
    r, g, b = int(hx[1:3], 16), int(hx[3:5], 16), int(hx[5:7], 16)
    return (255 << 24) | (b << 16) | (g << 8) | r


def palette(name="Toasted40"):
    path = os.path.join(HERE, "palettes", name + ".hex")
    return [abgr("#" + l.strip().lstrip("#")) for l in open(path) if l.strip()]


def write_meta(name, W, H, FR, fps, loop, anchor, pal, notes="", extra_meta=None):
    """Sheet JSON next to the PNG: the output contract the game loads."""
    meta = {"image": name + ".png", "frame_width": W, "frame_height": H, "frame_count": FR,
            "layout": "horizontal strip, no spacing", "fps": fps, "duration_s": round(FR / fps, 3), "loop": loop,
            "anchor": {"x": anchor[0], "y": anchor[1], "from": "top-left of each frame"}, "palette": pal,
            "notes": notes, "smoothing": "none (nearest neighbor)"}
    meta.update(extra_meta or {})
    json.dump(meta, open(SHEETS + name + ".json", "w"), indent=2)


def key(f, v):
    return [[0, f], v, [0, 1], [0, 0], 0, 0, True, 0, 16777215]


def anim(inp, keys):
    inp["anim"] = True
    inp["r"] = [key(f, v) for f, v in keys]


def template(name):
    return json.load(open(os.path.join(HERE, "templates", name)))


def show(on, off=None, level=1.0):
    """Opacity keys: hidden before frame `on`, `level` from `on` through `off`, hidden after `off`."""
    k = [(0, level if on == 0 else 0.0)]
    if on > 0:
        k += [(on - 1, 0.0), (on, level)]
    if off is not None:
        k += [(off, level), (off + 1, 0.0)]
    return k


class Project:
    def __init__(s, W, H, FR, pal="Toasted40W", fps=15):
        s.W, s.H, s.FR, s.pal, s.fps = W, H, FR, pal, fps
        s.h, s.j = load(BASE)
        s.old = {n["type"]: n for n in s.j["nodes"]}
        s.exp = [n for n in s.j["nodes"] if n["type"] == "Node_Export"][0]
        s.nodes = []
        s._y = 0

    def add(s, n, name, x, y):
        n = copy.deepcopy(n)
        for i in n["inputs"]:
            if isinstance(i, dict) and "from_node" in i:
                i.pop("from_node"); i.pop("from_index", None)
        n["id"] = "fx" + "".join(random.choices(string.ascii_letters, k=20))
        n["name"] = name; n["iname"] = name.replace(" ", "_")
        n["x"], n["y"] = x, y
        n.pop("group", None); n.pop("ictx", None)
        s.nodes.append(n)
        return n

    @staticmethod
    def link(d, i, src):
        d["inputs"][i]["from_node"] = src["id"]; d["inputs"][i]["from_index"] = 0

    def shape(s, name, kind, color, keys, inner=None, sides=None, rotation=None):
        n = s.add(template("shape_node.json"), name, 0, s._y); s._y += 160
        I = n["inputs"]
        I[0]["r"]["d"] = [s.W, s.H]; I[2]["r"]["d"] = kind; I[15]["r"]["d"] = 0
        I[6]["r"]["d"] = False; I[10]["r"]["d"] = abgr(color)
        if inner is not None: I[5]["r"]["d"] = inner
        if sides is not None: I[4]["r"]["d"] = sides
        if rotation is not None: I[19]["r"]["d"] = rotation   # slot 19 "Shape Rotation" (slot 7 does not rotate area shapes)
        v = lambda a, b, c, d: [a / s.W, b / s.H, c / s.W, d / s.H, 0, 0]
        if len(keys) == 1: I[3]["r"]["d"] = v(*keys[0][1:])
        else: anim(I[3], [(k[0], v(*k[1:])) for k in keys])
        return n

    def empty(s):
        """Transparent bottom layer (a zero-size shape off-canvas), so every visible layer can have its own opacity."""
        return s.shape("Empty Base", "Ellipse", "#ffffff", [(0, -8, -8, 0.01, 0.01)])

    def blend(s, bg, fg, opacity=None):
        b = s.add(s.old["Node_Blend"], "Blend", 192, s._y); s._y += 40
        I = b["inputs"]; s.link(b, 0, bg); s.link(b, 1, fg)
        I[2]["r"]["d"] = 0; I[7]["r"]["d"] = [s.W, s.H]
        if opacity: anim(I[3], opacity)
        else: I[3]["r"]["d"] = 1
        return b

    def stack(s, layers):
        """layers[0] is the bottom (always drawn); the rest are blended on top with optional opacity keys."""
        cur = layers[0][0]
        for lay, op in layers[1:]:
            cur = s.blend(cur, lay, op)
        return cur

    def finish(s, src, name, outline=None, loop=False, anchor=None, notes="", extra_meta=None):
        cur = src
        if outline:
            o = s.add(template("outline_node.json"), "Outline", 576, 0); I = o["inputs"]; s.link(o, 0, cur)
            I[1]["r"]["d"] = 1; I[2]["r"]["d"] = abgr(outline); I[5]["r"]["d"] = 1; I[6]["r"]["d"] = 0; cur = o
        p = s.add(s.old["Node_Posterize"], "Posterize", 768, 0); s.link(p, 0, cur)
        p["inputs"][1]["r"]["d"] = palette(s.pal); p["inputs"][2]["r"]["d"] = True
        ss = s.add(s.old["Node_Render_Sprite_Sheet"], "Render Spritesheet", 960, 0); s.link(ss, 0, p)
        ss["inputs"][2]["r"]["d"] = 1; ss["inputs"][11]["r"]["d"] = False; ss["inputs"][3]["r"]["d"] = 0
        e = s.add(s.exp, "Export Sheet", 1152, 0); s.link(e, 0, ss)
        e["inputs"][1]["r"]["d"] = SHEETS + name + ".png"
        j = s.j; j["nodes"] = s.nodes
        if isinstance(j.get("timelines"), dict): j["timelines"]["contents"] = []
        j["attributes"]["surface_dimension"] = [s.W, s.H]
        j["animator"]["frames_total"] = s.FR; j["animator"]["framerate"] = s.fps
        j["previewNode"] = p["id"]; j["inspectingNode"] = p["id"]
        out = EX + name + ".pxc"; save(out, s.h, j)
        h2, j2 = load(out); ids = {n["id"] for n in j2["nodes"]}
        bad = [(n["name"], k) for n in j2["nodes"] for k, i in enumerate(n["inputs"])
               if isinstance(i, dict) and "from_node" in i and i["from_node"] not in ids]
        print(f"{name:16s} {s.W}x{s.H} {s.FR}f | {len(ids)} nodes | dangling links: {bad}")
        write_meta(name, s.W, s.H, s.FR, s.fps, loop, anchor or (s.W // 2, s.H // 2),
                   "Toasted40 + white" if s.pal == "Toasted40W" else s.pal, notes, extra_meta)
        return out
