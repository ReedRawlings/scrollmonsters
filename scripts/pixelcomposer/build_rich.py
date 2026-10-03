"""Rich head-on ability effects (Apollo palette, 64x64, transparent, 30 fps) for a Pokemon / Dragon Quest Monsters
style battle view where the enemy faces the camera. The 3:2 top-down ground rule does not apply: motion runs along
the screen axes (rises from the ground line, falls from the sky). Anchor is bottom-centre, the enemy's feet.
New effects are new graphs built with richlib from the Complex examples' techniques; `frost` is only a recolour.
Run: python3 build_rich.py flame [...]"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from retarget import retarget
import math
from richlib import Rich, ramp, hold
from fxlib import abgr

COMPLEX = "/Applications/PixelComposerExamples/Complex/"


def frost():   # Icicle: ice spikes erupt and shatter
    # hand-picked so the ice ramp keeps four steps (nearest-colour gave a plum shadow and a green dark stop)
    ice = {"#181425": "#172038", "#193c3e": "#253a5e", "#124e89": "#3c5e8b", "#0099db": "#4f8fba", "#2ce8f5": "#a4dddb"}
    return retarget(COMPLEX + "Icicle_121092.pxc", "Frost_Spikes", anchor=(32, 60), loop=False, overrides=ice,
                    notes="Ice spikes erupt from the bottom edge. Apollo palette, transparent. Anchor is bottom-centre.")


FIRE = ramp([(0.0, "#752438"), (0.22, "#a53030"), (0.4, "#cf573c"), (0.55, "#da863e"), (0.7, "#de9e41"),
             (0.85, "#e8c170"), (1.0, "#ebede9")])
SMOKE = ramp([(0.0, "#241527"), (0.35, "#341c27"), (0.6, "#4d2b32"), (1.0, "#7a4841")])
EMBER = ramp([(0.0, "#ebede9"), (0.5, "#e8c170"), (1.0, "#de9e41")])


def flame():   # Flame Burst: fire erupts from the ground under the target, engulfs it, breaks into embers and smoke
    W, H, FR = 64, 64, 32
    R = Rich(W, H, FR)
    up = lambda dist: [(0, 0), (FR - 1, dist)]   # Offset scroll: negative Y moves the texture up

    # flame body: rising noise, wobbled sideways by rising streak noise (Fire-Tornado's displace trick, turned upright)
    n = R.node("Noise_Simplex", "Flame Noise", {"Scale": [0.3, 0.18], "Iteration": 3, "Seed": 51723, "Level In": [0.15, 0.85]})
    n = R.node("Offset", "Flame Rise", {"X Offset": 0, "Y Offset": up(-1.5)}, {"Surface In": n})
    a = R.node("Noise_Aniso", "Tongue Noise", {"X Amount": 3, "Y Amount": 6, "Seed": 20817})
    a = R.node("Blur_Directional", "Tongue Streaks", {"Strength": 4, "Direction": 90}, {"Surface In": a})
    a = R.node("Offset", "Tongue Rise", {"X Offset": 0, "Y Offset": up(-1)}, {"Surface In": a})
    body = R.node("Displace", "Flame Lick", {"Position": [0.3, 0], "Strength": 1}, {"Surface In": n, "Displace Map": a})

    # envelope: a tall soft ellipse sitting on the ground line that swells, then lifts off and shrinks away
    env = R.node("Gradient", "Flame Envelope", {
        "Gradient": ramp([(0, "#ffffff"), (1, "#000000")]), "Type": 1, "Shape": [0.55, 1], "Scale": 1, "Shift": 0,
        "Radius": [(0, 0.02), (4, 0.42), (9, 0.55), (17, 0.52), (24, 0.3), (29, 0.0)],
        "Center": [(0, [0.5, 1.0]), (4, [0.5, 0.9]), (17, [0.5, 0.82]), (29, [0.5, 0.5])]})
    heat = R.mix(body, env, "multiply", name="Heat")

    # ignition flash on the ground at the start
    flash = R.node("Gradient", "Ground Flash", {
        "Gradient": ramp([(0, "#ffffff"), (1, "#000000")]), "Type": 1, "Shape": [1, 0.45], "Scale": 1, "Shift": 0,
        "Center": [0.5, 0.95], "Radius": [(0, 0.0), (2, 0.34), (7, 0.0)]})
    heat = R.mix(heat, flash, "add", name="Heat + Flash")

    heat = R.node("Level", "Heat Boost", {"White in": [0, 0.75], "White out": [0, 1]}, {"Surface In": heat})
    fire = R.node("Threshold", "Flame Cut", {"Brightness": True, "Apply to Alpha": 2, "Multiply": True, "Threshold": 0.22}, {"Surface In": heat})
    fire = R.node("Colorize", "Flame Ramp", {"Gradient": FIRE}, {"Surface In": fire})

    # smoke: a slower, coarser noise in a wider ellipse that rises after the peak
    sm = R.node("Noise_Simplex", "Smoke Noise", {"Scale": [0.22, 0.22], "Iteration": 2, "Seed": 7741, "Level In": [0.2, 0.8]})
    sm = R.node("Offset", "Smoke Rise", {"X Offset": 0, "Y Offset": up(-0.7)}, {"Surface In": sm})
    senv = R.node("Gradient", "Smoke Envelope", {
        "Gradient": ramp([(0, "#ffffff"), (1, "#000000")]), "Type": 1, "Shape": [0.8, 1], "Scale": 1, "Shift": 0,
        "Radius": [(10, 0.0), (20, 0.36), (31, 0.44)], "Center": [(10, [0.5, 0.62]), (31, [0.5, 0.18])]})
    smoke = R.mix(sm, senv, "multiply", name="Smoke Body")
    smoke = R.node("Threshold", "Smoke Cut", {"Brightness": True, "Apply to Alpha": 2, "Multiply": True, "Threshold": 0.18}, {"Surface In": smoke})
    smoke = R.node("Colorize", "Smoke Ramp", {"Gradient": SMOKE}, {"Surface In": smoke})

    # embers: single pixels streaming up off the flame while it burns
    emb = R.node("Particle", "Embers", {
        "Spawn": True, "Spawn Type": 0, "Spawn Delay": 1, "Spawn Area": [0.5, 0.78, 0.2, 0.12, 0, 0], "Spawn Source": 0,
        "Spawn Amount": [(0, [0, 0]), (3, [2, 3]), (16, [1, 2]), (22, [0, 0])],
        "Lifespan": [8, 18], "Initial Direction": [0, 75, 105, 0, 0], "Speed": [0.8, 2.2], "Size": [1, 1],
        "Gravity": [0, 0], "Color on Spawn": EMBER, "Alpha": [1, 1], "Seed": 31337, "Loop": False})

    top = R.mix(R.empty(), smoke, "normal", [(0, 0), (11, 0), (16, 1), (26, 1), (31, 0)], name="Smoke Layer")
    top = R.mix(top, fire, name="Flame Layer")
    top = R.mix(top, emb, name="Ember Layer")
    print("  colours outside Apollo:", R.audit())
    return R.finish(top, "Flame_Burst", anchor=(32, 63), notes=(
        "Head-on battle FX: fire erupts from the ground line under the target, engulfs it, then lifts off into "
        "embers and smoke. Apollo palette, transparent, 30 fps, play once. Anchor is bottom-centre (enemy's feet)."))


ELEC = ramp([(0.0, "#172038"), (0.2, "#253a5e"), (0.4, "#3c5e8b"), (0.6, "#4f8fba"), (0.78, "#73bed3"),
             (0.9, "#a4dddb"), (1.0, "#ebede9")])
VOID = ramp([(0.0, "#1e1d39"), (0.25, "#402751"), (0.45, "#7a367b"), (0.62, "#a23e8c"), (0.78, "#c65197"),
             (0.9, "#df84a5"), (1.0, "#ebede9")])


def thunder():   # Thunder Strike: sky flickers, a jagged bolt drops onto the target, sparks, impact flash, crackling afterglow
    W, H, FR = 64, 64, 28
    R = Rich(W, H, FR)
    top, foot = [0.47, -0.05], [0.5, 0.9]
    on_bolt = lambda y: [top[0] + (foot[0] - top[0]) * (y - top[1]) / (foot[1] - top[1]), y]   # bolt's centre line
    seed = [(4, 4100), (22, 4145)]          # re-rolls the zigzag ~2x a frame, so the bolt crackles while it holds
    draw = [(3, [0, 0]), (5, [0, 1])]
    zig = (4, 5, seed)

    # one glow field for everything: sky flash where the bolt starts, the bolt's own halo, the impact at the feet.
    # Broken up by the same crackle noise, then cut and coloured, so bolt, sky and ground read as one lit shape.
    sky = R.glow("Sky Flash", [0.48, -0.04], hold((0, 0.0), (1, 0.16), (2, 0.06), (3, 0.2), (4, 0.26), (8, 0.14), (12, 0.0)), (1, 0.6))
    hit = R.glow("Impact Glow", foot, [(5, 0.0), (7, 0.3), (10, 0.24), (14, 0.18), (16, 0.1), (17, 0.16), (19, 0.08), (23, 0.0)], (1, 0.55))
    light = R.line("Bolt Light", top, foot, [(3, 4), (6, 12), (11, 8), (17, 0)], "#ffffff", draw, zig)
    light = R.node("Blur", "Bolt Halo", {"Size": 3}, {"Surface In": light})
    crk = R.node("Noise_Simplex", "Crackle Noise", {"Scale": [0.5, 0.5], "Iteration": 3, "Seed": 9021, "Level In": [0.3, 0.75]})
    crk = R.node("Offset", "Crackle Jitter", {"X Offset": [(0, 0), (FR - 1, 2.3)], "Y Offset": [(0, 0), (FR - 1, -1.7)]}, {"Surface In": crk})
    field = R.mix(R.mix(sky, hit, "add", name="Sky + Impact"), light, "add", name="+ Bolt Halo")
    field = R.mix(field, crk, "multiply", name="Crackle Field")
    field = R.node("Level", "Field Boost", {"White in": [0, 0.55]}, {"Surface In": field})
    field = R.cutcolor(field, ELEC, 0.24, "Glow")

    # the bolt itself on top: light band + white-hot core (no outline: the halo carries it into the glow)
    mid = R.line("Bolt Band", top, foot, [(3, 2), (6, 6), (11, 4), (16, 0)], "#73bed3", draw, zig)
    core = R.line("Bolt Core", top, foot, [(3, 1), (6, 3), (11, 2), (15, 0)], "#ebede9", draw, zig)
    bolt = R.stack([(mid, None), (core, None)])
    # forks start on the bolt's centre line, gone before it is
    for i, (y, b, sd) in enumerate([(0.3, (0.24, 0.56), 611), (0.48, (0.8, 0.68), 733), (0.64, (0.3, 0.86), 857)]):
        f = R.line(f"Fork {i + 1}", on_bolt(y), list(b), [(4, 2), (6, 3), (9, 2), (12, 0)], "#a4dddb",
                   [(4 + i * 0.5, [0, 0]), (6 + i * 0.5, [0, 1])], (2, 4, [(4, sd), (14, sd + 20)]))
        bolt = R.mix(bolt, f, name=f"Fork {i + 1} Layer")

    sparks = R.particles("Sparks", [0.5, 0.88, 0.06, 0.03], hold((0, [0, 0]), (6, [14, 18]), (7, [3, 5]), (8, [0, 0])),
                         (5, 14), (15, 165), (2, 4.5), ["#ebede9", "#a4dddb", "#73bed3"], 2718, gravity=0.25)
    out = R.stack([(R.empty(), None), (field, None), (bolt, None), (sparks, None)])
    print("  colours outside Apollo:", R.audit())
    return R.finish(out, "Thunder_Strike", anchor=(32, 58), notes=(
        "Head-on battle FX: the sky flickers, a jagged bolt drops onto the target at frame 5, forks and sparks fly, "
        "then an impact glow crackles out. Apollo palette, transparent, 30 fps, play once. Anchor is the strike point "
        "(enemy's feet). Hit frame 5."), extra_meta={"hit_frame": 5})


def web():   # Web Snare: silk threads shoot in from the edges, the spiral spins in, then the web snaps tight around the target
    W, H, FR = 64, 64, 30
    R = Rich(W, H, FR)
    C = (0.5, 0.48)
    angles = [i * 45 + j for i, j in enumerate([8, -6, 5, -9, 4, -5, 9, -4])]      # slightly uneven, like a real web
    reach = [0.5, 0.46, 0.52, 0.47, 0.5, 0.45, 0.53, 0.48]
    pt = lambda k, r: [C[0] + r * math.cos(math.radians(angles[k % 8])), C[1] - r * math.sin(math.radians(angles[k % 8]))]
    TIGHT = [(18, 1.0), (21, 0.68), (22, 0.74), (23, 0.71)]                            # snap in, small rebound

    def tighten(p, start):
        """Point keys: free until frame 18, then pulled toward the centre with the TIGHT curve."""
        return [(start, p)] + [(f, [C[0] + (p[0] - C[0]) * k, C[1] + (p[1] - C[1]) * k]) for f, k in TIGHT]

    layers = [(R.empty(), None)]
    for k in range(8):   # spokes fly in from the edges to the centre
        a = 0.6 * k
        layers.append((R.line(f"Spoke {k + 1}", tighten(pt(k, reach[k]), 0), tighten(list(C), 0), 1, "#c7cfcc",
                              [(a, [0, 0]), (a + 3, [0, 1])], crisp=True), None))
    turns, n = 3.5, 28   # capture spiral, outside in, one segment per spoke gap
    r = lambda i: 0.4 - i * (0.32 / n)
    for i in range(n):
        f0 = 6 + i * 0.36
        layers.append((R.line(f"Spiral {i + 1}", tighten(pt(i, r(i) * reach[i % 8] / 0.5), 0), tighten(pt(i + 1, r(i + 1) * reach[(i + 1) % 8] / 0.5), 0),
                              1, "#ebede9" if i % 3 == 0 else "#c7cfcc", [(f0, [0, 0]), (f0 + 1, [0, 1])], crisp=True), None))
    webg = R.stack(layers)
    webg = R.node("Outline", "Web Edge", {"Width": 1, "Color": abgr("#202e37"), "Position": 1, "Anti-aliasing": False}, {"Surface In": webg})
    # a glint runs over the threads as the web snaps tight
    glint = R.glow("Snap Glint", C, [(20, 0.0), (22, 0.3), (25, 0.0)], (1, 1))
    glint = R.cutcolor(glint, ramp([(0, "#a8b5b2"), (0.6, "#ebede9"), (1, "#ebede9")]), 0.5, "Glint")
    out = R.mix(R.mix(R.empty(), webg, opacity=[(0, 1), (25, 1), (29, 0)], name="Web Layer"), glint, opacity=0.6, name="Glint Layer")
    print("  colours outside Apollo:", R.audit())
    return R.finish(out, "Web_Snare", anchor=(32, 31), notes=(
        "Head-on battle FX: silk threads shoot in from the edges, the capture spiral spins in toward the centre, then "
        "the whole web snaps tight around the target (frame 21) and fades. Apollo palette, transparent, 30 fps, play "
        "once. Anchor is the web centre: place it on the enemy's body. Hit frame 21."), extra_meta={"hit_frame": 21})


def void():   # Void Orb: a dark orb opens in front of the target, swirls and pulls debris in, then collapses into a burst
    W, H, FR = 64, 64, 32
    R = Rich(W, H, FR)
    C = [0.5, 0.5]

    # swirl: streaky noise scrolled and wrapped into polar coordinates (Black-Hole's trick), masked to a ring
    sw = R.node("Noise_Simplex", "Swirl Noise", {"Scale": [0.79, 0.222], "Iteration": 2, "Seed": 64021, "Level In": [0.1, 0.9]})
    sw = R.node("Offset", "Swirl Flow", {"X Offset": [(0, 0), (FR - 1, 2)], "Y Offset": [(0, 0), (FR - 1, 1)]}, {"Surface In": sw})
    sw = R.node("Polar", "Swirl Wrap", {"Swap Axis": True, "Center": C, "Angle": [(0, 0), (FR - 1, -540)]}, {"Surface In": sw})
    ring = R.glow("Swirl Ring", C, [(0, 0.0), (8, 0.44), (22, 0.4), (26, 0.0)], (1, 1),
                  stops=((0, "#000000"), (0.3, "#ffffff"), (0.55, "#ffffff"), (1, "#000000")))
    field = R.mix(sw, ring, "multiply", name="Swirl Field")
    burst = R.glow("Collapse Flash", C, hold((0, 0.0), (25, 0.05), (26, 0.36), (28, 0.2), (31, 0.0)))
    field = R.mix(field, burst, "add", name="Swirl + Flash")
    field = R.node("Level", "Swirl Boost", {"White in": [0, 0.7]}, {"Surface In": field})
    field = R.cutcolor(field, VOID, 0.22, "Swirl")

    # the orb: a living vortex inside a hot rim, breathing while it is open, then collapsing to nothing
    rad = [(2, 0.01), (9, 10), (13, 11), (17, 9.5), (21, 11), (25, 0.01)]
    disc = lambda name, col, grow=0: R.shape(name, "Ellipse", col, [(f, 32, 32, r + grow, r + grow) for f, r in rad])
    core = disc("Orb Core", "#090a14")
    # inner vortex: finer noise spinning the other way, black at the centre and brighter toward the rim
    iv = R.node("Noise_Simplex", "Vortex Noise", {"Scale": [0.6, 0.3], "Iteration": 2, "Seed": 27183, "Level In": [0.15, 0.85]})
    iv = R.node("Offset", "Vortex Flow", {"X Offset": [(0, 0), (FR - 1, -3)], "Y Offset": [(0, 0), (FR - 1, 0.5)]}, {"Surface In": iv})
    iv = R.node("Polar", "Vortex Wrap", {"Swap Axis": True, "Center": C, "Angle": [(0, 0), (FR - 1, 720)]}, {"Surface In": iv})
    # fades to nothing at the orb's edge on its own (radius keyed with the orb: px / 64), dim at the centre
    depth = R.glow("Vortex Depth", C, [(f, (r + 1) / 64) for f, r in rad],
                   stops=((0, "#202020"), (0.35, "#808080"), (0.75, "#ffffff"), (0.9, "#ffffff"), (1, "#000000")))
    iv = R.mix(iv, depth, "multiply", name="Vortex Field")
    iv = R.cutcolor(iv, ramp([(0, "#402751"), (0.4, "#7a367b"), (0.7, "#a23e8c"), (1, "#c65197")]), 0.15, "Vortex")
    inner = R.mix(core, iv, name="Vortex In Orb")
    rim = R.shape("Orb Rim", "Donut", "#df84a5", [(f, 32, 32, r + 1, r + 1) for f, r in rad], inner=0.14)
    pin = R.shape("Singularity", "Ellipse", "#ebede9", [(0, 32, 32, 1, 1)])
    pin_on = hold((0, 0), (6, 1), (8, 0), (10, 1), (13, 0), (14, 1), (18, 0), (20, 1), (23, 0))
    # debris: pulled in from a ring around the orb while it is open
    debris = R.particles("Debris", [0.5, 0.5, 0.46, 0.46], hold((0, [0, 0]), (3, [1, 2]), (21, [0, 0])), (10, 16), (0, 360),
                         (-1.6, -1.0), ["#df84a5", "#c65197", "#a4dddb"], 1618, border=True, from_center=True)
    # collapse: a ring of light snaps outward and sparks fly
    shock = R.shape("Shock Ring", "Donut", "#df84a5", [(25, 32, 32, 2, 2), (31, 32, 32, 30, 30)], inner=0.12)
    sparks = R.particles("Burst Sparks", [0.5, 0.5, 0.03, 0.03], hold((0, [0, 0]), (25, [16, 20]), (26, [0, 0])), (5, 10), (0, 360),
                         (2, 4), ["#ebede9", "#df84a5"], 3141, from_center=True)
    out = R.stack([(R.empty(), None), (field, None), (debris, None), (inner, R_show(2, 25)), (rim, R_show(2, 25)), (pin, pin_on),
                   (shock, [(0, 0), (24, 0), (25, 1), (29, 1), (31, 0)]), (sparks, None)])
    print("  colours outside Apollo:", R.audit())
    return R.finish(out, "Void_Orb", anchor=(32, 32), notes=(
        "Head-on battle FX: a dark orb opens in front of the target, swirls and pulls debris inward, then collapses "
        "(frame 25) into a flash and a ring of light. Apollo palette, transparent, 30 fps, play once. Anchor is the "
        "orb centre: place it on the enemy's body. Hit frame 25."), extra_meta={"hit_frame": 25})


def R_show(on, off):
    from fxlib import show
    return show(on, off)


if __name__ == "__main__":
    for a in sys.argv[1:] or ["flame"]:
        globals()[a]()
