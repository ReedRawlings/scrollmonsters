"""Builder for rich head-on battle effects: new graphs composed from the technique nodes in the Pixel Composer
"Complex" examples (noise, displace, gradients, threshold, colorize, particles), finished in the Apollo palette.

    R = Rich(64, 64, 32)                                    # canvas, frames (30 fps)
    n = R.node("Noise_Simplex", "Flame Noise", {"Scale": [0.3, 0.3], "Seed": 1234})
    o = R.node("Offset", "Rise", {"Y Offset": [(0, 0), (31, -1.5)]}, inputs={"Surface In": n})
    R.finish(top, "Flame_Burst", anchor=(32, 63), notes="...")

Settings are set by their label name (looked up in templates/node_input_labels_en.json, first slot with that name,
or "Name#2" for the second). A list of (frame, value) tuples keyframes the setting. Everything not given is reset to
Pixel Composer's default, so a node only does what the builder says.
"""
import json, os
from fxlib import Project, HERE, abgr, palette, anim

COMPLEX = "/Applications/PixelComposerExamples/Complex/"
LABELS = json.load(open(os.path.join(HERE, "templates", "node_input_labels_en.json")))

# where to borrow each node type from (first node of that type in the file)
SOURCES = {
    "Noise_Simplex": "Lava-Floor", "Noise_Aniso": "Fire-Tornado", "Blur_Directional": "Fire-Tornado",
    "Displace": "Fire-Tornado", "Offset": "Lava-Floor", "Gradient": "Lava-Floor", "Level": "Lava-Floor",
    "Threshold": "Fire-Tornado", "Colorize": "Fire-Tornado", "Particle": "Lava-Floor", "Blend": "Fire-Tornado",
    "Blur": "Black-Hole", "Bloom": "Lava-Floor", "Color_adjust": "Fire-Tornado", "Polar": "Fire-Tornado",
    "Line_2Points": "Spark-Bolt", "MK_Sparkle": "Spark-Bolt", "Shape": "Black-Hole", "Curve": "Fire-Tornado",
    "Path": "Fire-Tornado", "Line": "Fire-Tornado", "Outline": "Spark-Bolt", "Transform": "Spark-Bolt",
}
_cache = {}


def _example(name):
    if name not in _cache:
        from pxc import load
        _cache[name] = load(COMPLEX + name + "_121092.pxc")[1]
    return _cache[name]


def ramp(stops):
    """[(time, '#hex'), ...] -> gradient string."""
    return json.dumps({"keys": [{"time": float(t), "value": float(abgr(c))} for t, c in stops], "type": 0}, separators=(",", ":"))


BLEND = {"normal": 0, "multiply": 3, "add": 8, "screen": 9, "max": 11, "subtract": 22}


class Rich(Project):
    def __init__(s, W, H, FR, fps=30):
        super().__init__(W, H, FR, pal="Apollo", fps=fps)
        s._x = 0

    def slot(s, n, label):
        name, nth = (label.split("#") + ["1"])[:2]
        hits = [k for k, i in enumerate(LABELS[n["type"]]["inputs"]) if i["name"] == name]
        if len(hits) < int(nth): raise KeyError(f"{n['type']} has no setting {label!r}")
        return hits[int(nth) - 1]

    def node(s, kind, name, values=None, inputs=None, src=None):
        ex = _example(src or SOURCES[kind])
        base = next(n for n in ex["nodes"] if n["type"] == "Node_" + kind)
        n = s.add(base, name, s._x, s._y); s._y += 120
        n.pop("renamedManual", None)
        # Borrowed nodes carry the example's own tweaks (a Level with White out 0.83 washed out the first Flame_Burst),
        # so every setting not given here goes back to Pixel Composer's default.
        given = {s.slot(n, l) for l in list(values or {}) + list(inputs or {})}
        for k, inp in enumerate(n["inputs"]):
            if k not in given and isinstance(inp, dict) and "def_val" in inp and not inp.get("attri", {}).get("use_project_dimension"):
                inp.pop("anim", None); inp["r"] = {"d": inp["def_val"]}
        for label, v in (values or {}).items():
            inp = n["inputs"][s.slot(n, label)]
            if isinstance(v, list) and v and isinstance(v[0], tuple): anim(inp, v)
            else:
                inp.pop("anim", None); inp["r"] = {"d": v}
        for label, srcnode in (inputs or {}).items():
            s.link(n, s.slot(n, label), srcnode)
        if "Constant dimension" in [i["name"] for i in LABELS[n["type"]]["inputs"]]:
            n["inputs"][s.slot(n, "Constant dimension")]["r"] = {"d": [s.W, s.H]}
        return n

    def mix(s, bg, fg, mode="normal", opacity=1, name="Blend"):
        return s.node("Blend", name, {"Blend mode": BLEND[mode], "Opacity": opacity, "Output dimension": 0},
                      {"Background": bg, "Foreground": fg})

    def audit(s):
        """Every colour set in the graph must be in Apollo (neutral greys, black and white are masks and are allowed)."""
        ok = set(palette("Apollo")) | {0xff000000, 0xffffffff}
        bad = []
        for n in s.nodes:
            for k, i in enumerate(n["inputs"]):
                d = i.get("r", {}).get("d") if isinstance(i, dict) and isinstance(i.get("r"), dict) else None
                if isinstance(d, str) and d.startswith('{"keys"'):
                    grey = lambda v: (v & 255) == ((v >> 8) & 255) == ((v >> 16) & 255)
                    bad += [(n["name"], k, hex(int(x["value"]))) for x in json.loads(d)["keys"] if int(x["value"]) not in ok and not grey(int(x["value"]))]
        return bad

    # ------------------------------------------------------------------ building blocks
    def glow(s, name, center, radius, shape=(1, 1), stops=((0, "#ffffff"), (1, "#000000"))):
        """Soft circular gradient (white core, black edge). center/radius: value or [(frame, v)] in canvas fractions."""
        return s.node("Gradient", name, {"Gradient": ramp(stops), "Type": 1, "Shape": list(shape), "Center": center, "Radius": radius})

    def line(s, name, p0, p1, width, color, rng=None, wiggle=None, crisp=False):
        """Straight (or wiggled) line between two points in canvas fractions; width [(frame, px)] or px.
        rng keys the drawn part, e.g. [(4, [0, 0]), (6, [0, 1])] draws it from p0 to p1. wiggle = (amp px, freq, seed or seed keys)."""
        wv = (lambda w: [w, w]) if not isinstance(width, list) else None
        v = {"Data Type": 3, "Start Point": p0, "End Point": p1, "Color over Length": ramp([(0, color)]), "Segment": 32,
             "Width": wv(width) if wv else [(f, [w, w]) for f, w in width], "1px Mode": crisp,
             "Background": 0,
             "Start Cap": 0 if crisp else 1, "End Cap": 0 if crisp else 1, "End Cap#2": 0 if crisp else 1}
        if rng: v["Range"] = rng
        if wiggle:
            amp, freq, seed = wiggle
            v.update({"Use Wiggle": True, "Amplitude": [amp, amp], "Frequency": freq, "Detail": 4, "Wiggle Seed": seed})
        return s.node("Line", name, v, src="Spark-Bolt")

    def particles(s, name, area, amount, life, direction, speed, colors, seed, border=False, from_center=False,
                  gravity=0, sprite=None):
        """Pixel particles. area [cx, cy, hw, hh] fractions (ellipse); amount [(frame, [min, max])] per frame;
        direction (min_deg, max_deg), 0 = right, 90 = up; gravity pulls down (px/frame^2)."""
        v = {"Spawn": True, "Spawn Type": 0, "Spawn Delay": 1, "Spawn Area": list(area) + [1, 0], "Spawn Source": 1 if border else 0,
             "Spawn Amount": amount, "Lifespan": list(life), "Initial Direction": [0, direction[0], direction[1], 0, 0],
             "Speed": list(speed), "Size": [1, 1], "Gravity": [gravity, gravity], "Gravity Direction": -90,
             "Directed From Center": from_center, "Color on Spawn": ramp([(i / max(1, len(colors) - 1), c) for i, c in enumerate(colors)]),
             "Seed": seed, "Loop": False}
        return s.node("Particle", name, v, inputs={"Particle Sprite": sprite} if sprite else None)

    def cutcolor(s, field, stops, cut=0.2, name="Field"):
        """Brightness field -> transparent below `cut` -> colour ramp (the flame technique)."""
        f = s.node("Threshold", name + " Cut", {"Brightness": True, "Threshold": cut, "Apply to Alpha": 2, "Multiply": True}, {"Surface In": field})
        return s.node("Colorize", name + " Ramp", {"Gradient": stops}, {"Surface In": f})


def hold(*keys):
    """Step keys: [(frame, v), ...] -> holds each value until the next key (Pixel Composer interpolates linearly)."""
    out = []
    for i, (f, v) in enumerate(keys):
        if i and f - 1 > keys[i - 1][0]: out.append((f - 1, keys[i - 1][1]))
        out.append((f, v))
    return out
