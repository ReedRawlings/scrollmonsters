"""Turn a rich Pixel Composer example into a game-ready, transparent, palette-correct effect sheet.

    retarget("/path/Icicle.pxc", "Frost_Spikes", fx_root=last_blend_fg, palette="Apollo", anchor=(32, 60))

Works on a copy of the source project (the source is never written). It:
  - re-roots the graph on the effect branch, so the baked-in background nodes drop out and the sheet is transparent;
  - remaps every colour to the target palette: Posterize / Color Adjust palettes get the whole palette, gradients,
    outlines, shadows and other colours go to the nearest palette colour (Lab). Pure black/white are left alone: they are
    masks and highlights, and the final Posterize snaps visible white to the palette's lightest colour;
  - adds Render Spritesheet + Export nodes and writes the sheet JSON (same contract as fxlib.finish).
Size, frame count and fps are the example's own; re-timing keyframed graphs blind is risky. `step=2` exports every other frame.
Needs templates/node_input_labels_en.json (python3 extract_labels.py).
"""
import json, math, os
from pxc import load, save
from fxlib import Project, HERE, EX, SHEETS, abgr, write_meta

LABELS = os.path.join(HERE, "templates", "node_input_labels_en.json")


def unabgr(v):
    v = int(v)
    return v & 255, (v >> 8) & 255, (v >> 16) & 255


def hexs(rgb):
    return "#%02x%02x%02x" % tuple(rgb)


def lab(rgb):
    def lin(c):
        c /= 255
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = map(lin, rgb)
    x, y, z = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def nearest(rgb, pal_rgb):
    l = lab(rgb)
    return min(range(len(pal_rgb)), key=lambda k: math.dist(l, lab(pal_rgb[k])))


def load_palette(name):
    return [l.strip().lstrip("#") for l in open(os.path.join(HERE, "palettes", name + ".hex")) if l.strip()]


# ------------------------------------------------------------------ choosing the effect branch
def last_blend_fg(j, N):
    """Project_Output <- Posterize <- Blend(background, effect): returns the effect (that Blend's second input)."""
    n = N[[n for n in j["nodes"] if n["type"] == "Node_Project_Output"][0]["inputs"][0]["from_node"]]
    while n["type"] != "Node_Blend":
        n = N[n["inputs"][0]["from_node"]]
    return N[n["inputs"][1]["from_node"]]


def upstream(N, root):
    keep, stack = set(), [root["id"]]
    while stack:
        nid = stack.pop()
        if nid in keep or nid not in N: continue
        keep.add(nid)
        stack += [i["from_node"] for i in N[nid]["inputs"] if isinstance(i, dict) and i.get("from_node")]
        if N[nid].get("group"): stack.append(N[nid]["group"])
    return keep


# ------------------------------------------------------------------ recolouring
def recolor(j, labels, pal, overrides):
    """Remap every colour in the project. Returns {source hex: target hex} for the report."""
    pal_abgr = [abgr("#" + h) for h in pal]; pal_rgb = [unabgr(c) for c in pal_abgr]
    seen = {}

    def mapc(v):
        v = int(v); rgb = unabgr(v)
        if rgb in ((0, 0, 0), (255, 255, 255)): return v
        src = hexs(rgb)
        dst = overrides.get(src) or hexs(pal_rgb[nearest(rgb, pal_rgb)])
        seen[src] = dst
        return (v & 0xff000000) | (abgr(dst) & 0x00ffffff)

    isc = lambda x: isinstance(x, int) and not isinstance(x, bool) and x >= 2 ** 31
    for n in j["nodes"]:
        lab_in = labels.get(n["type"], {}).get("inputs", [])
        for k, i in enumerate(n["inputs"]):
            if not (isinstance(i, dict) and isinstance(i.get("r"), dict) and "d" in i["r"]): continue
            d, name = i["r"]["d"], lab_in[k]["name"] if k < len(lab_in) else ""
            if isinstance(d, list) and d and all(isc(x) for x in d):
                full = (n["type"] == "Node_Posterize" and name == "Palette") or (n["type"] == "Node_Color_adjust" and name == "Color")
                i["r"]["d"] = list(pal_abgr) if full else [mapc(x) for x in d]
            elif isinstance(d, str) and d.startswith('{"keys"'):
                g = json.loads(d); new = [float(mapc(kk["value"])) for kk in g["keys"]]
                if new != [kk["value"] for kk in g["keys"]]:
                    for kk, v in zip(g["keys"], new): kk["value"] = v
                    i["r"]["d"] = json.dumps(g, separators=(",", ":"))
            elif isc(d) and "Color" in name and "BG" not in name:
                i["r"]["d"] = mapc(d)
    j["attributes"]["palette"] = list(pal_abgr)
    return seen


# ------------------------------------------------------------------ the whole pipeline
def audit(j, pal):
    """Every palette list must be the target palette, every other colour in it (pure black/white aside)."""
    ok = {abgr("#" + h) for h in pal} | {0xff000000, 0xffffffff}
    bad = []
    for n in j["nodes"]:
        for k, i in enumerate(n["inputs"]):
            if not (isinstance(i, dict) and isinstance(i.get("r"), dict)): continue
            d = i["r"].get("d")
            vals = ([int(x["value"]) for x in json.loads(d)["keys"]] if isinstance(d, str) and d.startswith('{"keys"')
                    else d if isinstance(d, list) and d and all(isinstance(x, int) and not isinstance(x, bool) and x >= 2 ** 31 for x in d) else [])
            bad += [(n["name"], k, hexs(unabgr(v))) for v in vals if v not in ok]
    return bad


def retarget(src, name, fx_root=last_blend_fg, palette="Apollo", anchor=None, loop=False, step=1, notes="", extra_meta=None, overrides=None):
    if not os.path.exists(LABELS): raise SystemExit("run `python3 extract_labels.py` first (node_input_labels_en.json is missing)")
    labels = json.load(open(LABELS)); pal = load_palette(palette)
    h, j = load(src); before = {n["id"]: n for n in json.loads(json.dumps(j["nodes"]))}
    N = {n["id"]: n for n in j["nodes"]}
    root = fx_root(j, N); out = [n for n in j["nodes"] if n["type"] == "Node_Project_Output"][0]
    keep = upstream(N, root) | {out["id"]}
    dropped = sorted(n["name"] for n in j["nodes"] if n["id"] not in keep)
    j["nodes"] = [n for n in j["nodes"] if n["id"] in keep]
    out["inputs"][0]["from_node"] = root["id"]; out["inputs"][0]["from_index"] = 0

    mapping = recolor(j, labels, pal, overrides or {})

    W, H = j["attributes"]["surface_dimension"]; FR = j["animator"]["frames_total"]; fps = j["animator"]["framerate"]
    P = Project(W, H, FR, pal=palette, fps=fps)   # only borrows the Render Spritesheet / Export templates from fxlib's base project
    ss = P.add(P.old["Node_Render_Sprite_Sheet"], "Render Spritesheet", root.get("x", 0) + 192, root.get("y", 0))
    P.link(ss, 0, root); ss["inputs"][2]["r"]["d"] = step; ss["inputs"][11]["r"]["d"] = False; ss["inputs"][3]["r"]["d"] = 0
    e = P.add(P.exp, "Export Sheet", root.get("x", 0) + 384, root.get("y", 0))
    P.link(e, 0, ss); e["inputs"][1]["r"]["d"] = SHEETS + name + ".png"
    j["nodes"] += [ss, e]
    if isinstance(j.get("timelines"), dict): j["timelines"]["contents"] = []
    j["previewNode"] = j["inspectingNode"] = root["id"]
    path = EX + name + ".pxc"; save(path, h, j)

    h2, j2 = load(path); ids = {n["id"] for n in j2["nodes"]}
    dangling = [(n["name"], k) for n in j2["nodes"] for k, i in enumerate(n["inputs"]) if isinstance(i, dict) and i.get("from_node") and i["from_node"] not in ids]
    changed = [(n["name"], k) for n in j2["nodes"] if n["id"] in before for k, i in enumerate(n["inputs"])
               if json.dumps(i.get("r"), sort_keys=True) != json.dumps(before[n["id"]]["inputs"][k].get("r"), sort_keys=True)]
    print(f"{name}: {W}x{H} {FR}f @{fps}fps | {len(before)} -> {len(ids)} nodes | dropped: {', '.join(dropped)}")
    print(f"  dangling links: {dangling} | colours outside {palette}: {audit(j2, pal)} | settings changed: {len(changed)}")
    print("  colour map:", ", ".join(f"{a}->{b}" for a, b in sorted(mapping.items())))
    frames = -(-FR // step)
    write_meta(name, W, H, frames, fps // step if fps % step == 0 else fps / step, loop, anchor or (W // 2, H // 2), palette, notes, extra_meta)
    return path
