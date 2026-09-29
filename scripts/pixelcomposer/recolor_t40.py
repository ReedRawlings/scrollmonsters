"""Move an Endesga-32 .pxc onto the Toasted40 + white palette, keeping any hand edits in the file.
Known Endesga colors use the hand-picked map below; anything else snaps to the nearest Toasted40W color.
The Posterize palette is replaced with Toasted40W. The original is backed up to output/pixelcomposer-backups/.
Run: python3 recolor_t40.py Bubble_Burst Heart_Spin ...   (names in assets/fx/pixelcomposer/)"""
import os, sys, json, shutil, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pxc import load, save
from fxlib import EX, ROOT, abgr, palette

MAP = {  # Endesga 32 -> Toasted40
    "#181425": "#1c080c", "#a22633": "#84333e", "#e43b44": "#cd5151", "#f6757a": "#d46e76", "#733e39": "#5f2525",
    "#ead4aa": "#ffe6d1", "#b55088": "#9a4e66", "#68386c": "#53414f", "#fee761": "#f7b750", "#feae34": "#d1952e",
    "#f77622": "#e17e53", "#8b9bb4": "#78949b", "#c0cbdc": "#c2b5c4", "#3a4466": "#5d6b79",
    "#124e89": "#5d6b79", "#0099db": "#78949b", "#2ce8f5": "#c2b5c4",
}
T40 = palette("Toasted40W")
rgb = lambda v: ((v & 255), (v >> 8) & 255, (v >> 16) & 255)
EXPLICIT = {abgr(k) & 0xFFFFFF: abgr(v) & 0xFFFFFF for k, v in MAP.items()}


def snap(v):
    v = int(v); a = v & 0xFF000000; col = v & 0xFFFFFF
    if col in EXPLICIT: return a | EXPLICIT[col]
    r, g, b = rgb(col)
    best = min(T40, key=lambda p: sum((x - y) ** 2 for x, y in zip(rgb(p), (r, g, b))))
    return a | (best & 0xFFFFFF)


def is_col(v): return isinstance(v, (int, float)) and not isinstance(v, bool) and 0xFF000000 <= v <= 0xFFFFFFFF and v == int(v)


def walk(v):
    if is_col(v): return type(v)(snap(v))
    if isinstance(v, list): return [walk(x) for x in v]
    if isinstance(v, str) and '"keys"' in v:
        g = json.loads(v)
        for k in g["keys"]:
            if is_col(k["value"]): k["value"] = float(snap(k["value"]))
        return json.dumps(g)
    return v


def recolor(name):
    src = EX + name + ".pxc"
    bak = os.path.join(ROOT, "output", "pixelcomposer-backups", f"{name}_endesga_{time.strftime('%Y%m%d-%H%M%S')}.pxc")
    os.makedirs(os.path.dirname(bak), exist_ok=True); shutil.copy2(src, bak)
    h, j = load(src); n = 0
    for node in j["nodes"]:
        if node["type"] == "Node_Export": continue
        for k, i in enumerate(node["inputs"]):
            if not isinstance(i, dict) or "r" not in i: continue
            if node["type"] == "Node_Posterize" and k == 1:
                i["r"]["d"] = T40; n += 1; continue
            if i.get("anim") and isinstance(i["r"], list):
                for key in i["r"]:
                    new = walk(key[1])
                    if new != key[1]: key[1] = new; n += 1
            elif isinstance(i["r"], dict) and "d" in i["r"]:
                new = walk(i["r"]["d"])
                if new != i["r"]["d"]: i["r"]["d"] = new; n += 1
    save(src, h, j)
    print(f"{name:16s} {n} values recolored | backup {os.path.relpath(bak, ROOT)}")


if __name__ == "__main__":
    for nm in sys.argv[1:]: recolor(nm)
