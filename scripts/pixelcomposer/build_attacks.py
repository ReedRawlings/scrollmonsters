"""Creature attack FX for the top-down survivors map (Apollo palette). Each function writes
assets/fx/attacks/<Name>.pxc and its JSON; the project's Export node writes the PNG beside them, and
`python3 scripts/build-ui-assets.py --manifest-only` hands every exported sheet to the game (survivor-attack-fx.js).

The examples to learn from are the Pixel Composer Complex projects in /Applications/PixelComposerExamples/Complex.
Each layers several distinct elements, and each element has its own pipeline:
- Fire-Tornado: one crafted flame piece (gradient x noise, displaced by streaks, wrapped with Polar, shaped by a Curve)
  is cached and repeated along a Path with scale and colour over copy, plus lines drawn along paths.
- Rocket-Thrust: a crafted sprite (noise wrapped onto a 3D cylinder) is fed to particles with size, alpha and colour
  over lifetime; the rocket body is built separately from UV-mapped gradients, outline and shadow; bloom on top.
- Lava-Floor: cellular crust plates (invert, threshold, smear) over a separate displaced molten layer, rim light from
  convolution edges, burst particles.
- Spark-Bolt: a path drawn in with Trim Path, a textured line along it, a head that follows the path, sparks, sparkle
  sprite particles, camera shake.
Read their wiring before building (dump the nodes in dataflow order), and copy working sub-graphs with
`Rich.borrow_tree` instead of approximating them. Don't make one noise field and tweak it across near-identical nodes.
House rules and every lesson so far: assets/fx/MAKING_EFFECTS.md.

Conventions:
- One sheet per attack, covering every phase (wind-up through hit, ignite plus loop). The game indexes it by progress
  or loops it, so phases don't need separate functions or files.
- Author at the size it appears on screen and show it at a whole-number scale, normally 1x (`px` in the JSON).
  `visible_w` is the base gameplay width in sheet pixels. Never author a sheet expecting the game to enlarge it.
- 3/4 top-down view: anything on the ground is a 3:2 ellipse; height goes straight up the screen.
- Helpers here: looped() keys a value so frames from an intro onward loop seamlessly; black() is the opaque base a
  field of transparent copies needs before a multiply; cross_slam's every() repeats keys in each section of a sheet.
- A Dimension with use_project_dimension is a multiple of the canvas ([1, 1] = the canvas). Pixels there made an
  80x80 sheet render 6400x6400 and freeze Pixel Composer; fxlib.finish now refuses to save that.
- Gradient facts (read from the app's shader): circular prog = length(uv_offset / Shape) / (Radius * sqrt 2), so a
  ground ellipse of half-width rx px on a W-wide canvas is Radius = rx / (W * sqrt 2) with Shape [1, 2/3 * W/H] and
  Uniform ratio off.

Run: python3 build_attacks.py [mole_rumble]
"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from richlib import Rich, ramp, hold
from fxlib import ROOT, abgr, show

OUT = os.path.join(ROOT, "assets", "fx", "attacks") + "/"
os.makedirs(OUT, exist_ok=True)
S2 = math.sqrt(2)

HOT = ramp([(0.0, "#884b2b"), (0.3, "#be772b"), (0.55, "#de9e41"), (0.78, "#e8c170"), (1.0, "#ebede9")])
WHITE_TO_BLACK = ((0, "#ffffff"), (1, "#000000"))


def grad(R, name, center, radius, stops=WHITE_TO_BLACK, kind=1, shape=(1, 1)):
    """Gradient field. kind 0 linear, 1 circular, 2 radial (angular). center in canvas fractions."""
    return R.node("Gradient", name, {"Gradient": ramp(stops), "Type": kind, "Shape": list(shape), "Center": center,
                                     "Radius": radius, "Scale": 1, "Shift": 0, "Uniform ratio": False})


def ground(R, rx):
    """(Radius, Shape) for a 3:2 ground ellipse rx px wide on this canvas."""
    return rx / (R.W * S2), (1, 2 / 3 * R.W / R.H)


def particles(R, name, area, amount, life, direction, speed, colors, seed, gravity=0, border=False):
    """Pixel particles. area [cx, cy, hw, hh] canvas fractions (ellipse); direction (min_deg, max_deg), 90 = up."""
    v = {"Spawn": True, "Spawn Type": 0, "Spawn Delay": 1, "Spawn Area": list(area) + [1, 0],
         "Spawn Source": 1 if border else 0, "Spawn Amount": amount, "Lifespan": list(life),
         "Initial Direction": [0, direction[0], direction[1], 0, 0], "Speed": list(speed), "Size": [1, 1],
         "Gravity": [gravity, gravity], "Gravity Direction": -90,
         "Color on Spawn": ramp([(i / max(1, len(colors) - 1), c) for i, c in enumerate(colors)]),
         "Seed": seed, "Loop": False}
    return R.node("Particle", name, v)


def crack_lines(R, cx, cy, rx, color, width, rng_for, name, n=7, seed=7):
    """n jagged cracks from the centre out to an uneven 3:2 rim. The same seed always gives the same cracks, so several
    layers (dark crack, hot core, light mask) line up exactly."""
    layers = []
    for k in range(n):
        a = k * 360 / n + ((seed * (k + 3) * 37) % 29 - 14)
        r = rx * (0.72 + ((seed * (k + 5) * 53) % 23) / 100)
        start = [(cx + 3 * math.cos(math.radians(a))) / R.W, (cy - 2 * math.sin(math.radians(a))) / R.H]
        end = [(cx + r * math.cos(math.radians(a))) / R.W, (cy - r * 2 / 3 * math.sin(math.radians(a))) / R.H]
        layers.append(R.line(f"{name} {k + 1}", start, end, width, color, rng_for(k), (1.6, 4, 3100 + k * 17), crisp=(width == 1)))
    return layers


def mole_rumble():
    """The whole mole attack in one sheet, indexed by wind-up progress (not played): cracks spread across a 3:2 ellipse,
    the ground darkens, light leaks up through the cracks, pebbles hop and dust trickles up around the edge. Every crack
    reaches the edge on the last frame, which is when the strike hits; the game then fades that frame out.
    Elements: drawn cracks; a heat glow seen only through a blurred copy of the same cracks; crisp hot crack cores late
    in the wind-up; the ground darkening; hopping pebbles and rising dust. Shown at 2x (px 2)."""
    W, H, FR = 96, 64, 20
    R = Rich(W, H, FR, fps=20, out=OUT)
    P = lambda p: p * (FR - 1)                        # wind-up progress 0..1 -> frame
    cx, cy, rx = 48, 32, 32
    ry = rx * 2 / 3

    shade = R.shape("Ground Shade", "Ellipse", "#4d2b32", [(0, cx, cy, rx * 0.9, ry * 0.9)])

    grow = lambda k: [(P(k * 0.046), [0, 0.05]), (FR - 1 - (6 - k) * 0.4, [0, 1])]   # all reach the edge by the hit
    dark = crack_lines(R, cx, cy, rx, "#341c27", [(0, 1), (P(0.46), 2), (FR - 1, 2)], grow, "Crack")
    hot = crack_lines(R, cx, cy, rx, "#de9e41", 1, grow, "Crack Glow")
    mask = R.empty()
    for i, l in enumerate(crack_lines(R, cx, cy, rx, "#ffffff", 3, grow, "Crack Mask")):
        mask = R.mix(mask, l, "add", name=f"Mask {i + 1}")
    mask = R.node("Blur", "Crack Mask Soft", {"Size": 1}, {"Surface In": mask})
    rad, shp = ground(R, rx * 0.9)
    swell = grad(R, "Heat Swell", [0.5, 0.5], [(0, 0.0), (P(0.385), rad * 0.4), (P(0.77), rad * 0.9), (FR - 1, rad * 1.1)], shape=shp)
    leak = R.cutcolor(R.mix(swell, mask, "multiply", name="Leak Field"), HOT, 0.3, "Leak")

    pebbles = particles(R, "Pebbles", [0.5, 0.5, 0.25, 0.25], hold((0, [0, 0]), (4, [0, 1]), (10, [1, 2]), (16, [2, 3])),
                        (6, 10), (70, 110), (0.6, 1.5), ["#c09473", "#ad7757", "#7a4841"], 61403, gravity=0.25)
    trickle = particles(R, "Dust Trickle", [0.5, 0.5, rx / W, ry / H], hold((0, [0, 1]), (12, [1, 2]), (17, [2, 2])),
                        (6, 12), (85, 95), (0.2, 0.5), ["#a8b5b2", "#819796"], 22871, border=True)

    layers = [(R.empty(), None), (shade, [(0, 0.0), (FR - 1, 0.45)])]
    layers += [(l, None) for l in dark]
    layers += [(leak, None)] + [(l, [(0, 0), (P(0.54), 0), (P(0.77), 1), (FR - 1, 1)]) for l in hot]
    layers += [(trickle, None), (pebbles, None)]
    out = R.stack(layers)
    print("  colours outside Apollo:", R.audit())
    return R.finish(out, "Mole_Rumble", anchor=(48, 32), notes=(
        "The whole mole attack on the ground under the target: cracks spread across a 3:2 ellipse, the ground "
        "darkens, light leaks through the cracks, pebbles hop, dust trickles up around the edge. Indexed by "
        "wind-up progress (frame = progress * 19), not played, so it fits any wind-up length; the cracks reach the "
        "edge on the last frame = the hit, then the game fades that frame out. Ground ellipse is 64x43 px "
        "(visible_w 64), shown at 2x. Anchor = strike centre. Apollo."),
        extra_meta={"visible_w": 64, "px": 2, "indexed_by_progress": True})


FIRE = ramp([(0.0, "#752438"), (0.22, "#a53030"), (0.4, "#cf573c"), (0.55, "#da863e"), (0.7, "#de9e41"),
             (0.85, "#e8c170"), (1.0, "#ebede9")])
EMBER = ["#ebede9", "#e8c170", "#de9e41"]


def looped(FR, start, period):
    """Keys for a value that changes by `delta` every `period` frames, counted from `start`, so the frames from
    `start` on loop seamlessly (frame start + period would equal frame start). Returns f(value_at_start, delta)."""
    return lambda v, delta: [(0, v - delta * start / period), (FR - 1, v + delta * (FR - 1 - start) / period)]


def black(R):
    """Opaque black canvas: the base for a field built from transparent copies, so multiplying with it stays dark."""
    return R.node("Gradient", "Black", {"Gradient": ramp([(0, "#000000"), (1, "#000000")])})


def fire_patch():
    """Salamander fire patch, one sheet: frames 0-7 ignite (the spit splashes, droplets fly, the bed cracks open, flames
    grow), frames 8-31 a seamless 2 s loop the game repeats until the patch runs out, then fades.
    Elements: a ragged scorch stain; Lava-Floor's crust plates over its displaced molten layer (borrowed whole), cracking
    open from the centre during the ignite and cut to a ragged 3:2 ellipse; flame tongues = one crafted teardrop sprite
    repeated in a back row, a front row and a taller core, wobbled by streak noise and multiplied with a rising fire
    texture, so every tongue samples a different part of the texture and they flicker out of step; embers; the splash
    flash and droplets. Every looping part moves a whole tile (or a whole turn) per 24 frames. Shown at 1x."""
    W, H, FR, LS, LP = 80, 80, 32, 8, 24
    R = Rich(W, H, FR, fps=12, out=OUT)
    loop = looped(FR, LS, LP)
    cx, cy = 40, 54
    C = [cx / W, cy / H]

    # scorch: the burnt ground under everything, a ragged 3:2 stain that spreads during the ignite
    rad, shp = ground(R, 38)
    sc = grad(R, "Scorch Field", C, [(0, 0.02), (5, rad)], shape=shp)
    scn = R.node("Noise_Simplex", "Scorch Noise", {"Scale": [0.35, 0.35], "Iteration": 3, "Seed": 4471, "Level Out": [0.5, 1]})
    scorch = R.cutcolor(R.mix(sc, scn, "multiply", name="Scorch Ragged"), ramp([(0, "#4d2b32"), (0.45, "#341c27"), (1, "#241527")]), 0.2, "Scorch")

    # burning bed: Lava-Floor's crust + molten layers, re-timed: the cracks open over the ignite, the melt flows one
    # tile per loop. Recoloured to charred plates with hot edges and a molten glow between them.
    bed, made = R.borrow_tree("Lava-Floor", "gSS9CL1", prefix="Bed ", frames=FR)
    M = lambda p: next(v for k, v in made.items() if k.startswith(p))
    crack = M("gSS8t92")
    R.set(crack, "Center", C); R.set(crack, "Shape", [1, 2 / 3])
    R.set(crack, "Shift", [(1, 0.8), (7, -0.02)]); R.set(crack, "Scale", [(1, 2.6), (7, 4.32)])
    R.set(M("gSS9I11"), "X Offset", loop(0, 1))
    R.set(M("gSS99N1"), "Gradient", ramp([(0, "#de9e41"), (0.25, "#cf573c"), (0.5, "#a53030"), (0.75, "#602c2c"), (1, "#341c27")]))
    R.set(M("gSS9Gr1"), "Gradient", ramp([(0, "#cf573c"), (0.5, "#de9e41"), (0.85, "#e8c170"), (1, "#ebede9")]))
    R.set(bed, "Blend", abgr("#e8c170"))
    rad, shp = ground(R, 34)
    bm = grad(R, "Bed Field", C, [(1, 0.0), (6, rad)], shape=shp)
    bmn = R.node("Noise_Simplex", "Bed Edge Noise", {"Scale": [0.5, 0.5], "Iteration": 2, "Seed": 8812, "Level Out": [0.55, 1]})
    bmask = R.node("Threshold", "Bed Mask", {"Brightness": True, "Threshold": 0.22}, {"Surface In": R.mix(bm, bmn, "multiply", name="Bed Ragged")})
    bed = R.node("Blend", "Bed Cut", {"Blend mode": 0, "Opacity": 1, "Output dimension": 0},
                 {"Background": R.empty(), "Foreground": bed, "Mask": bmask})

    # flame tongues: one teardrop sprite (14x26, hottest at its base), repeated around the 3:2 ellipse
    tongue = R.dim(R.node("Gradient", "Tongue Sprite", {"Gradient": ramp(WHITE_TO_BLACK), "Type": 1, "Shape": [0.55, 1],
                                                         "Center": [0.5, 0.74], "Radius": 0.53, "Scale": 1, "Shift": 0,
                                                         "Uniform ratio": False}), 14, 26)
    grow = lambda s: [(0, 0.0), (2, 0.0), (5, s * 0.7), (LS, s)]

    def row(name, n, angles, radius, scale, seed, start=0):
        r = R.node("Repeat", name, {"Pattern": 2, "Amount": n, "Angle Range": list(angles), "Start Rotation": start,
                                    "Radius": radius, "Circular Ratio": 2 / 3, "Start Position": [cx, cy],
                                    "Anchor": [0.5, 0.9], "Uniform Scale": True, "Scale X": grow(scale),
                                    "Random Scale": [0.85, 1.1, 0.85, 1.15], "Random Rotation": [0, -8, 8, 0, 0, 0],
                                    "Seed": seed, "Blend Mode": 2, "Sort Y": True, "Output Dimension Type": 1},
                   {"Surface In": tongue})
        return R.px(r, "Radius", "Start Position")
    env = black(R)
    for name, n, ang, rr, sc_, sd, st in [("Back Tongues", 4, (30, 190), 25, 0.8, 1201, 0),
                                          ("Front Tongues", 4, (210, 370), 27, 1.0, 1307, 0),
                                          ("Core Tongues", 3, (0, 360), 9, 1.3, 1409, 30)]:
        env = R.mix(env, row(name, n, ang, rr, sc_, sd, st), "max", name=name + " Layer")
    lick = R.node("Noise_Simplex", "Lick Noise", {"Scale": [0.6, 0.15], "Iteration": 2, "Seed": 20817, "Tile": True})
    lick = R.node("Offset", "Lick Rise", {"X Offset": 0, "Y Offset": loop(0, -2)}, {"Surface In": lick})
    env = R.node("Displace", "Tongue Lick", {"Position": [0.15, 0], "Strength": 1}, {"Surface In": env, "Displace Map": lick})
    tex = R.node("Noise_Simplex", "Fire Texture", {"Scale": [0.35, 0.22], "Iteration": 3, "Seed": 51723, "Tile": True, "Level In": [0.15, 0.85]})
    tex = R.node("Offset", "Fire Rise", {"X Offset": 0, "Y Offset": loop(0, -1)}, {"Surface In": tex})
    heat = R.node("Level", "Heat Boost", {"White in": [0, 0.7]}, {"Surface In": R.mix(tex, env, "multiply", name="Heat")})
    flames = R.cutcolor(heat, FIRE, 0.2, "Flame")

    embers = R.particles("Embers", [0.5, 50 / H, 0.3, 0.12], hold((0, [0, 0]), (4, [0, 1])), (8, 16), (75, 105), (0.5, 1.2), EMBER, 31337)

    # the spit landing: a flash and droplets thrown up and falling back (a hard splash ring read as a selection circle)
    flash = R.shape("Splash Flash", "Ellipse", "#ebede9", [(0, cx, cy, 7, 5), (2, cx, cy, 2, 1.5)])
    drops = R.particles("Droplets", [0.5, cy / H, 0.03, 0.02], hold((0, [12, 14]), (1, [0, 0])), (5, 9), (20, 160), (1.5, 3.2),
                        ["#ebede9", "#e8c170", "#de9e41", "#cf573c"], 7341, gravity=0.35)

    out = R.stack([(R.empty(), None), (scorch, None), (bed, None),
                   (flash, [(0, 1), (1, 1), (2, 0)]), (flames, None), (embers, None), (drops, None)])
    print("  colours outside Apollo:", R.audit())
    return R.finish(out, "Fire_Patch", loop=True, anchor=(cx, cy), notes=(
        "Salamander fire patch on the ground: frames 0-7 ignite (splash, droplets, the bed cracks open, flames grow), "
        "frames 8-31 loop seamlessly (play 0-7 once, then repeat 8-31). Ground ellipse 72x48 px (visible_w 72), shown "
        "at 1x. Anchor = patch centre on the ground. Apollo."),
        extra_meta={"visible_w": 72, "px": 1, "ignite": [0, LS - 1], "loop_frames": [LS, FR - 1]})


def silk_web():
    """Spider web, one sheet: frames 0-9 land (the glob splats, eight spokes shoot out to a 3:2 rim, the capture spiral
    winds in from the rim to the hub), frames 10-25 a seamless 16-frame loop (a glint sweeps round the silk, dew
    beads), frames 26-33 the snap for Tension Trap (spokes recoil, the spiral unravels, shreds fly, the rest fades).
    Elements: spokes drawn in along their own lines (Spark-Bolt's draw-in); the spiral as one Path through every spoke
    crossing with a line drawn along it; a shadow of both, offset down so the web hangs just above the ground; the silk
    wad at the hub; a radial gradient turning once per loop, seen only through the silk; dew beads; shreds and a burst.
    Shown at 1x."""
    W, H, FR, LS, LP, SN = 96, 72, 34, 10, 16, 26
    R = Rich(W, H, FR, fps=12, out=OUT)
    loop = looped(FR, LS, LP)
    cx, cy, rx = 48, 36, 42
    ry = rx * 2 / 3
    F = lambda x, y: [x / W, y / H]
    jit = [3, -5, 4, -2, 6, -4, 2, -6]                       # spokes are not quite even
    reach = [1.0, 0.93, 0.98, 0.95, 1.0, 0.94, 0.97, 0.92]
    ang = [k * 45 + jit[k] for k in range(8)]
    at = lambda k, f: (cx + rx * f * math.cos(math.radians(ang[k])), cy - ry * f * math.sin(math.radians(ang[k])))

    # spokes: hub to rim, each shot out over 2 frames, staggered; on the snap they spring back into the hub
    silk = R.empty()
    for k in range(8):
        d0 = 1 + k * 0.25
        rng = [(0, [0, 0]), (d0, [0, 0]), (d0 + 2, [0, 1]), (SN, [0, 1]), (SN + 2, [0, 0.25])]
        sp = R.line(f"Spoke {k + 1}", F(cx, cy), F(*at(k, reach[k])), 1, [(0, "#c7cfcc"), (1, "#a8b5b2")],
                    rng, crisp=True)
        silk = R.mix(silk, sp, name=f"Spoke {k + 1} Layer")

    # capture spiral: one path through every spoke crossing, four turns from the rim in to the hub, each stretch
    # between two spokes sagging toward the hub like real silk; wound in from the outside; on the snap it unravels
    pts = []
    rad = lambda i: reach[i % 8] * (0.9 - 0.66 * i / 32)
    for i in range(33):
        pts.append(at(i % 8, rad(i)))
        if i < 32:
            a0, a1 = ang[i % 8], ang[(i + 1) % 8] + (360 if (i + 1) % 8 == 0 else 0)
            am, rm = math.radians((a0 + a1) / 2), (rad(i) + rad(i + 1)) / 2 * 0.88
            pts.append((cx + rx * rm * math.cos(am), cy - ry * rm * math.sin(am)))
    spath = R.path("Spiral Path", pts)
    spiral = path_line(R, "Spiral", spath, 1, [(0, "#a8b5b2"), (1, "#c7cfcc")],
                       [(0, [0, 0]), (3, [0, 0]), (9, [0, 1]), (SN, [0, 1]), (SN + 2, [0.75, 1])], crisp=True)
    silk = R.mix(silk, spiral, name="Spiral Layer")

    # shadow: the same silk, dark, 2 px lower, faint
    shadow = R.node("Offset", "Shadow Drop", {"X Offset": 0, "Y Offset": 2 / H}, {"Surface In": silk})
    shadow = R.node("Colorize", "Shadow Colour", {"Gradient": ramp([(0, "#151d28"), (1, "#151d28")])}, {"Surface In": shadow})

    # glint: an angular gradient with one bright wedge, turning once per loop, seen only through the silk
    sweep = R.node("Gradient", "Glint Sweep", {"Gradient": ramp([(0, "#000000"), (0.06, "#ffffff"), (0.18, "#000000"), (1, "#000000")]),
                                               "Type": 2, "Center": [cx / W, cy / H], "Angle": loop(0, -360)})
    glint = R.cutcolor(R.mix(R.mix(black(R), silk, name="Silk On Black"), sweep, "multiply", name="Glint Field"), ramp([(0, "#73bed3"), (0.5, "#a4dddb"), (1, "#ebede9")]), 0.25, "Glint")

    # hub: the glob splats wide, then settles into a lumpy wad; it bursts on the snap
    hub = R.shape("Hub Wad", "Ellipse", "#a8b5b2", [(0, cx, cy, 7, 5), (2, cx, cy, 4, 3), (SN, cx, cy, 4, 3), (SN + 1, cx, cy, 5, 3.5), (FR - 1, cx, cy, 3, 2)])
    hub_hi = R.shape("Hub Light", "Ellipse", "#ebede9", [(0, cx - 1, cy - 1, 5, 3), (2, cx - 1, cy - 1, 2, 1.5), (FR - 1, cx - 1, cy - 1, 1.5, 1)])
    knot = R.shape("Hub Knot", "Ellipse", "#c7cfcc", [(0, cx + 2, cy + 1, 0.1, 0.1), (2, cx + 2, cy + 1, 2, 1.5), (FR - 1, cx + 2, cy + 1, 1.5, 1)])

    # dew beads on the spiral, where it crosses a spoke (two spokes per bead apart so they spread out)
    dew = []
    for i, j in enumerate([3, 12, 17, 22, 30]):
        x, y = pts[j]
        dew.append((R.shape(f"Dew {i + 1}", "Ellipse", "#73bed3", [(0, x, y, 1.2, 1.2)]), [(0, 0), (8, 0), (10, 1), (SN, 1), (SN + 1, 0)]))
        dew.append((R.shape(f"Dew {i + 1} Light", "Ellipse", "#ebede9", [(0, x - 0.5, y - 0.5, 0.6, 0.6)]), [(0, 0), (9, 0), (10, 1), (SN, 1), (SN + 1, 0)]))

    # snap: shreds thrown out from the hub, a small burst ring at the hub
    shreds = R.particles("Silk Shreds", [cx / W, cy / H, 0.04, 0.03], hold((0, [0, 0]), (SN, [18, 22]), (SN + 1, [6, 8]), (SN + 2, [0, 0])),
                         (4, 7), (0, 360), (1.5, 3.2), ["#ebede9", "#c7cfcc", "#a8b5b2"], 5521, from_center=True)
    R.set(shreds, "Size", [1, 2])
    snap_ring = R.shape("Snap Burst", "Donut", "#ebede9", [(SN, cx, cy, 3, 2), (SN + 2, cx, cy, 12, 8)], inner=0.2)

    on = [(0, 1), (SN + 2, 1), (FR - 1, 0)]                  # the whole web fades after the snap
    layers = [(R.empty(), None), (shadow, [(0, 0.3), (SN + 2, 0.3), (FR - 1, 0)]), (silk, on), (glint, [(0, 0), (9, 0), (10, 1), (SN, 1), (SN + 1, 0)])]
    layers += dew + [(hub, on), (knot, on), (hub_hi, on), (snap_ring, [(0, 0), (SN - 1, 0), (SN, 1), (SN + 1, 1), (SN + 3, 0)]), (shreds, None)]
    out = R.stack(layers)
    print("  colours outside Apollo:", R.audit())
    return R.finish(out, "Silk_Web", loop=True, anchor=(cx, cy), notes=(
        "Spider web on the ground: frames 0-9 land (splat, spokes shoot out, the spiral winds in), frames 10-25 loop "
        "seamlessly (glint sweeping round, dew), frames 26-33 the snap for Tension Trap (spokes recoil, shreds, fade). "
        "Play 0-9 once, repeat 10-25, play 26-33 only when the web bursts; otherwise fade the loop out. Web ellipse "
        "84x56 px (visible_w 84), shown at 1x. Anchor = hub. Apollo."),
        extra_meta={"visible_w": 84, "px": 1, "land": [0, LS - 1], "loop_frames": [LS, LS + LP - 1], "snap": [SN, FR - 1]})


STONE = ["#c7cfcc", "#819796", "#577277", "#394a50"]
DUST = ["#d7b594", "#c09473", "#ad7757"]


def cross_slam():
    """Bear cross slam, one sheet of three 10-frame pieces the game places along the cross as its front passes:
    frames 0-9 a 48 px piece of a horizontal arm, 10-19 a piece of a vertical arm (its own frames because rocks rise
    up the screen whichever way the arm runs), 20-29 the centre where the paw lands. Each piece: a crack opens along
    the arm with green light seen through it; rock shards erupt out of it one after another, catch a glint, then
    shatter into falling grit; dust puffs up. The shard is Icicle's crafted shard (a line along a path, textured with a
    faceted gradient and a sweeping shine, two outlines) borrowed whole and recoloured to stone, staggered by a Delay
    and laid out by a Repeat per piece. The left/up arms are the same pieces flipped. Shown at 1x, 20 fps."""
    W, H, FR, N = 48, 72, 30, 10
    R = Rich(W, H, FR, fps=20, out=OUT)
    gx, gy = 24, 46                                          # ground point under the piece (anchor)
    F = lambda x, y: [x / W, y / H]
    SECT = (0, 10, 20)
    every = lambda rel: sorted((s + f, v) for s in SECT for f, v in rel)   # the same keys in all three pieces

    # the shard: Icicle's, re-drawn at this size (a 17 px shard and a 10 px one leaning the other way)
    shard, made = R.borrow_tree("Icicle", "gSHBDJ1", prefix="Shard ", frames=FR)
    M = lambda p: next(v for k, v in made.items() if k.startswith(p))
    for pid, (b, t) in [("gSHAfW0", ((22, 47), (27, 30))), ("gSHAvl9", ((27, 48), (21, 38)))]:
        p = M(pid)
        for slot, (x, y) in zip((4, 5), (b, t)):
            p["inputs"][slot].pop("anim", None); p["inputs"][slot]["r"] = {"d": [x / W, y / H, 0, 0, 0, 0, 0]}
    line = M("gSHAfe0")
    R.set(line, "Range", every([(0, [0, 0]), (2, [0, 1])]))
    R.set(line, "Width", every([(0, [2, 2]), (2, [6, 6])]))
    R.set(M("gSHBDX1"), "Scale", every([(1, 1.26), (4, 0.0)]))
    # Icicle's facet texture (gradient + half-plane + shine) washed out to white at this size: colour the shard along
    # its length instead, base dark to tip light, and give it a solid dark outline
    line["inputs"][R.slot(line, "Texture")].pop("from_node")
    for pid in ("gSHAuZ9", "gSHAst8", "gSHAhJ1", "gSHAsr8", "gSHAsO7", "gSHB7N1", "gSHArC7", "gSHAs77"):
        R.nodes.remove(M(pid))
    R.set(line, "Color over Length", ramp([(0, "#394a50"), (0.45, "#577277"), (0.8, "#819796"), (1, "#c7cfcc")]))
    R.set(line, "Span Color over Path", True)
    R.set(M("gSHB0W1"), "Color", abgr("#202e37")); R.set(M("gSHB0W1"), "Blend", False)
    R.set(shard, "Color", abgr("#c7cfcc"))
    shard = R.mix(R.empty(), shard, opacity=every(hold((0, 1), (5, 0))), name="Shard Shatter")   # gone when it breaks
    stagger = R.node("Delay", "Shard Stagger", {"Frames": [0, 1, 2]}, {"Surface": shard})

    def shards(name, values, seed):
        v = {"Anchor": [gx / W, gy / H], "Random Scale": [0.75, 1.05, 0.8, 1.1], "Random Rotation": [0, -10, 10, 0, 0, 0],
             "Array Select": 0, "Sort Y": True, "Seed": seed, "Output Dimension Type": 1}
        v.update(values)
        r = R.node("Repeat", name, v, {"Surface In": stagger})
        return R.px(r, *[l for l in ("Start Position", "Shift Position", "Radius") if l in values])

    def crack(name, p0, p1, s, seed, width=2):
        """Dark crack opening along p0-p1 in one frame, over a wider green light that dies after the eruption."""
        rng = [(s, [0, 0]), (s + 1, [0, 1])]
        glow = R.line(name + " Light", F(*p0), F(*p1), 3, "#75a743", rng, (1.5, 5, seed))
        dark = R.line(name, F(*p0), F(*p1), width, "#341c27", rng, (1.5, 5, seed))
        return [(glow, [(0, 0), (s, 1), (s + 2, 1), (s + 3, 0)]), (dark, [(0, 0), (s, 1), (s + 6, 1), (s + N - 1, 0)])]

    def puffs(name, s, area, seed):
        dust = R.particles(name + " Dust", area, hold((0, [0, 0]), (s + 1, [3, 4]), (s + 3, [0, 0])), (5, 8), (70, 110), (0.3, 0.8), DUST, seed)
        grit_area = [area[0], area[1] - 8 / H, area[2], area[3]]
        grit = R.particles(name + " Grit", grit_area, hold((0, [0, 0]), (s + 5, [8, 10]), (s + 6, [0, 0])), (3, 4), (30, 150), (1, 2.5), STONE, seed + 7, gravity=0.35)
        return [(dust, None), (grit, None)]

    show = lambda s: [(0, 0)] + ([(s - 1, 0)] if s else []) + [(s, 1), (s + N - 1, 1)] + ([(s + N, 0)] if s + N < FR else [])

    # horizontal arm piece: crack along the middle, five shards across
    h = crack("Crack Across", (0, gy), (W, gy), 0, 811)
    h.append((shards("Shards Across", {"Pattern": 0, "Amount": 5, "Start Position": [4, gy], "Shift Position": [10, 0],
                                       "Random Position": [-1, 1, -4, 4]}, 2207), show(0)))
    h += puffs("Across", 0, [0.5, gy / H, 20 / W, 4 / H], 3301)

    # vertical arm piece: crack down the middle, five shards along it
    v = crack("Crack Down", (gx, gy - 26), (gx, H), 10, 911)
    v.append((shards("Shards Down", {"Pattern": 0, "Amount": 5, "Start Position": [gx, gy - 22], "Shift Position": [0, 11],
                                     "Random Position": [-4, 4, -1, 1]}, 2311), show(10)))
    v += puffs("Down", 10, [0.5, gy / H, 5 / W, 22 / H], 3407)

    # centre: a crater, four short cracks, a ring of shards (a dust ring read as a selection circle)
    s = 20
    crater = R.shape("Crater", "Ellipse", "#241527", [(s, gx, gy, 2, 1.5), (s + 1, gx, gy, 9, 6)])
    rim = R.shape("Crater Rim", "Donut", "#4d2b32", [(s, gx, gy, 2, 1.5), (s + 1, gx, gy, 10, 7)], inner=0.18)
    c = [(crater, [(0, 0), (s - 1, 0), (s, 1), (s + 6, 1), (s + N - 1, 0)]), (rim, [(0, 0), (s - 1, 0), (s, 1), (s + 6, 1), (s + N - 1, 0)])]
    for i, a in enumerate((25, 155, 205, 335)):
        end = (gx + 22 * math.cos(math.radians(a)), gy - 22 * 2 / 3 * math.sin(math.radians(a)))
        c += crack(f"Crack {i + 1}", (gx, gy), end, s, 1013 + i * 31)
    c.append((shards("Shards Ring", {"Pattern": 2, "Amount": 6, "Start Position": [gx, gy], "Radius": 11, "Circular Ratio": 2 / 3,
                                     "Angle Range": [0, 360], "Start Rotation": 15}, 2423), show(20)))
    c += puffs("Centre", s, [0.5, gy / H, 12 / W, 8 / H], 3511)

    out = R.stack([(R.empty(), None)] + c[:2] + h + v + c[2:])
    print("  colours outside Apollo:", R.audit())
    return R.finish(out, "Cross_Slam", anchor=(gx, gy), notes=(
        "Bear cross slam in three 10-frame pieces, each played once at 20 fps from when the cross front reaches it: "
        "0-9 a 48 px piece of a horizontal arm (flipped for the left arm), 10-19 a 48 px piece of a vertical arm "
        "(rocks rise up the screen, so the same frames serve the upper and lower arm), 20-29 the centre where the paw "
        "lands. Crack with green light, stone shards erupt and shatter, dust. Shown at 1x. "
        "Anchor = ground point under the piece. Apollo."),
        extra_meta={"px": 1, "piece_len": 48, "sections": {"across": [0, 9], "down": [10, 19], "centre": [20, 29]}})


ELEC = ramp([(0.0, "#172038"), (0.2, "#253a5e"), (0.4, "#3c5e8b"), (0.6, "#4f8fba"), (0.78, "#73bed3"),
             (0.9, "#a4dddb"), (1.0, "#ebede9")])
SPARK = ["#ebede9", "#a4dddb", "#73bed3"]
# curves: [0, 1, 0, 0, 1, 0] then (in-handle x, y, x, y, out-handle x, y) per point
HUMP = [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0.15, 0.3, -0.2, 0, 0.5, 1, 0.2, 0, -0.15, 0.3, 1, 0, 0, 0]   # 0 at both ends
TAPER = [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0.333, -0.333, -0.333, 0.333, 1, 0, 0, 0]  # Icicle's shard curve: falls evenly base -> tip
COMET = [0, 1, 0, 0, 1, 0, 0, 0, 0, 0.15, 0.3, 0, -0.1, 0, 0.75, 1, 0.1, 0, -0.1, 0, 1, 0, 0, 0]       # thin tail, thick head, point


def crackle(seed, frames, every=2, step=17):
    """Wiggle-seed keys that re-roll a zigzag every `every` frames over `frames` (a (first, last) pair)."""
    a, b = frames
    return hold(*[(f, seed + i * step) for i, f in enumerate(range(a, b + 1, every))])


def ellipse_pts(cx, cy, rx, n=12, start=0):
    """n points round a 3:2 ground ellipse of half-width rx (closed with Loop on the Path)."""
    return [(cx + rx * math.cos(math.radians(start + i * 360 / n)), cy - rx * 2 / 3 * math.sin(math.radians(start + i * 360 / n)))
            for i in range(n)]


def path_line(R, name, path, width, stops, rng=None, curve=None, span=True, wiggle=None, crisp=False):
    """A line drawn along a Path (Spark-Bolt / Fire-Tornado style). width px; rng keys the drawn part."""
    # Fix Length + 1 px segments: the default (8 segments over the whole path) joins 9 samples with straight chords
    v = {"Width": [width, width], "Color over Length": ramp(stops), "Span Color over Path": True, "Span Width over Path": span,
         "1px Mode": crisp, "Fix Length": True, "Segment Length": 1}
    if rng: v["Range"] = rng
    if curve: v["Width Curve"] = curve
    if wiggle:
        amp, freq, seed = wiggle
        v.update({"Use Wiggle": True, "Amplitude": [amp, amp], "Frequency": freq, "Detail": 4, "Wiggle Seed": seed})
    return R.wire(R.node("Line", name, v), "Path", path, 1)


def storm_arc():
    """Storm lizard chain lightning, one sheet of six 8-frame sections at 20 fps (0.4 s = one jump's life):
    frames 0-39 a 32 px piece of bolt in five directions (0, ~22, 45, ~68, 90 degrees up from east), 40-47 the zap
    on each target. The game lays pieces end to end along a jump (nearest direction, flipped for the other
    quadrants, every other piece turned 180 degrees so neighbours don't repeat) and crops the last one; never
    stretched or rotated. Each piece: a light band and white core over a halo seen through crackle noise, a short fork,
    the zigzag re-rolled every 2 frames, pinned to the centre line at both ends so pieces join. The zap: a scorch star,
    a crackling ring round a 3:2 ellipse, a flash and sparks. Built from thunder()'s bolt technique. Shown at 1x."""
    W, H, N = 48, 48, 8
    STEPS = [(32, 0), (30, -12), (24, -24), (12, -30), (0, -32)]
    FR = N * (len(STEPS) + 1)
    R = Rich(W, H, FR, fps=20, out=OUT)
    F = lambda p: [p[0] / W, p[1] / H]
    gate = lambda s: show(s, s + N - 1)
    field, bolts, sections = R.empty(), [], {}

    for k, (dx, dy) in enumerate(STEPS):
        s, sd = k * N, 4100 + k * 97
        p0, p1 = (W / 2 - dx / 2, H / 2 - dy / 2), (W / 2 + dx / 2, H / 2 + dy / 2)
        zig = (5, 4, crackle(sd, (s, s + N - 1)))
        lines = []
        for name, width, color in [("Light", [(s, 3), (s + 1, 4), (s + 5, 2), (s + 7, 1)], "#ffffff"),
                                   ("Band", [(s, 2), (s + 2, 2), (s + 4, 1), (s + 7, 1)], "#73bed3"),
                                   ("Core", 1, "#ebede9")]:
            l = R.line(f"Arc {k} {name}", F(p0), F(p1), width, color, None, zig, crisp=(name == "Core"))
            lines.append(R.set(l, "Amplitude Curve", HUMP))
        halo = R.node("Blur", f"Arc {k} Halo", {"Size": 1}, {"Surface In": lines[0]})
        field = R.mix(field, R.mix(R.empty(), halo, opacity=gate(s), name=f"Arc {k} Halo Gate"), "add", name=f"Arc {k} Halo Layer")
        mid, a = (W / 2, H / 2), math.atan2(-dy, dx) + math.radians(50)
        fork = R.line(f"Arc {k} Fork", F(mid), F((mid[0] + 10 * math.cos(a), mid[1] - 10 * math.sin(a))), 1, "#a4dddb",
                      [(s, [0, 0]), (s + 1, [0, 1])], (2, 4, crackle(sd + 50, (s, s + 3))), crisp=True)
        bolts += [(lines[1], gate(s)), (lines[2], gate(s)), (fork, show(s, s + 3))]
        sections[f"dir{k}"] = {"frames": [s, s + N - 1], "start": [round(p0[0], 1), round(p0[1], 1)], "step": [dx, dy]}

    # zap on the target: scorch star, flash, crackling ring, sparks
    s, zx, zy = len(STEPS) * N, 24, 28
    rad, shp = ground(R, 12)
    flash = grad(R, "Zap Flash", F((zx, zy)), [(s, rad * 0.6), (s + 1, rad), (s + 4, rad * 0.5), (s + 6, 0.0)], shape=shp)
    ring = R.path("Zap Ring Path", ellipse_pts(zx, zy, 13, n=24), loop=True)
    ring_light = path_line(R, "Zap Ring Light", ring, 3, [(0, "#ffffff")], wiggle=(2, 6, crackle(5303, (s, s + 7))))
    ring_line = path_line(R, "Zap Ring", ring, 1, [(0, "#a4dddb")], wiggle=(2, 6, crackle(5303, (s, s + 7))), crisp=True)
    ring_halo = R.mix(R.empty(), R.node("Blur", "Zap Ring Halo", {"Size": 1}, {"Surface In": ring_light}),
                      opacity=[(0, 0), (s - 1, 0), (s, 1), (s + 3, 1), (s + 5, 0)], name="Zap Ring Fade")
    zap_light = R.mix(flash, ring_halo, "add", name="Zap Light")
    field = R.mix(field, R.mix(R.empty(), zap_light, opacity=gate(s), name="Zap Gate"), "add", name="Zap Layer")
    star = []
    for i in range(6):
        a = math.radians(i * 60 + 15)
        st = R.line(f"Scorch {i + 1}", F((zx, zy)), F((zx + 10 * math.cos(a), zy - 10 * 2 / 3 * math.sin(a))), 1, "#172038",
                    [(s, [0, 0]), (s + 1, [0, 1])], (1.5, 3, 7001 + i), crisp=True)
        star.append((st, [(0, 0), (s - 1, 0), (s, 1), (s + 4, 1), (s + 7, 0)]))
    sparks = R.particles("Zap Sparks", [zx / W, zy / H, 0.03, 0.02], hold((0, [0, 0]), (s, [10, 12]), (s + 1, [0, 0])), (3, 6),
                         (0, 360), (1.5, 3), SPARK, 6007, from_center=True, gravity=0.1)

    crk = R.node("Noise_Simplex", "Crackle Noise", {"Scale": [0.5, 0.5], "Iteration": 3, "Seed": 9021, "Level In": [0.3, 0.75]})
    crk = R.node("Offset", "Crackle Jitter", {"X Offset": [(0, 0), (FR - 1, 4.3)], "Y Offset": [(0, 0), (FR - 1, -3.7)]}, {"Surface In": crk})
    glow = R.node("Level", "Glow Boost", {"White in": [0, 0.55]}, {"Surface In": R.mix(field, crk, "multiply", name="Crackle Field")})
    glow = R.cutcolor(glow, ELEC, 0.24, "Glow")

    out = R.stack([(R.empty(), None)] + star + [(glow, None)] + bolts + [(ring_line, [(0, 0), (s, 0), (s + 1, 1), (s + 5, 1), (s + 6, 0)]), (sparks, None)])
    print("  colours outside Apollo:", R.audit())
    sections["zap"] = {"frames": [s, s + N - 1], "anchor": [zx, zy]}
    return R.finish(out, "Storm_Arc", anchor=(W // 2, H // 2), notes=(
        "Storm chain lightning: frames 0-39 are 32 px bolt pieces in five directions (sections.dirN: start point and "
        "step in sheet pixels, y down), 8 frames each over a jump's 0.4 s life; lay pieces end to end along the jump, "
        "flip for other quadrants, turn every other piece 180 degrees, crop the last; never rotate or stretch. Frames "
        "40-47: the zap on each hit target (anchor = target centre on the ground). 20 fps, shown at 1x. Apollo."),
        extra_meta={"px": 1, "piece_len": 32, "sections": sections})


def storm_strike():
    """Thunderhead strike: a bolt drops from above the frame onto the ground point (hit on frame 2), the ground
    flashes in a 3:2 ellipse, a crackling ring and a scorch star spread, sparks fly and fall, the glow fades.
    Elements as in thunder(), turned to the top-down view: halo through crackle noise, light band, white core, two
    forks, ground flash, ring, scorch, sparks. The game keeps its wind-up ring and plays this at the end. Shown at 1x."""
    W, H, FR = 48, 96, 10
    R = Rich(W, H, FR, fps=20, out=OUT)
    F = lambda p: [p[0] / W, p[1] / H]
    gx, gy = 24, 80
    top, foot = (22, -4), (gx, gy)
    draw = [(0, [0, 0]), (1, [0, 1])]
    zig = (5, 5, crackle(4400, (0, FR - 1)))

    light = R.line("Bolt Light", F(top), F(foot), [(0, 4), (1, 12), (4, 8), (7, 0)], "#ffffff", draw, zig)
    light = R.node("Blur", "Bolt Halo", {"Size": 3}, {"Surface In": light})
    rad, shp = ground(R, 18)
    flash = grad(R, "Ground Flash", F(foot), [(1, 0.0), (2, rad), (5, rad * 0.7), (9, 0.0)], shape=shp)
    ring = R.path("Ring Path", ellipse_pts(gx, gy, 17), loop=True)
    ring_light = path_line(R, "Ring Light", ring, 3, [(0, "#ffffff")], wiggle=(2, 7, crackle(5501, (0, FR - 1))))
    field = R.mix(R.mix(light, flash, "add", name="Bolt + Flash"),
                  R.mix(R.empty(), R.node("Blur", "Ring Halo", {"Size": 1}, {"Surface In": ring_light}), opacity=show(2, 6), name="Ring Gate"),
                  "add", name="Strike Light")
    crk = R.node("Noise_Simplex", "Crackle Noise", {"Scale": [0.5, 0.5], "Iteration": 3, "Seed": 9131, "Level In": [0.3, 0.75]})
    crk = R.node("Offset", "Crackle Jitter", {"X Offset": [(0, 0), (FR - 1, 2.3)], "Y Offset": [(0, 0), (FR - 1, -1.7)]}, {"Surface In": crk})
    glow = R.node("Level", "Glow Boost", {"White in": [0, 0.55]}, {"Surface In": R.mix(field, crk, "multiply", name="Crackle Field")})
    glow = R.cutcolor(glow, ELEC, 0.24, "Glow")

    band = R.line("Bolt Band", F(top), F(foot), [(0, 2), (1, 5), (4, 3), (7, 0)], "#73bed3", draw, zig)
    core = R.line("Bolt Core", F(top), F(foot), [(0, 1), (1, 2), (5, 1), (7, 0)], "#ebede9", draw, zig)
    on_bolt = lambda y: (top[0] + (foot[0] - top[0]) * (y - top[1]) / (foot[1] - top[1]), y)
    bolt = [(band, None), (core, None)]
    for i, (y, end, sd) in enumerate([(30, (8, 44), 611), (52, (40, 66), 733)]):
        f = R.line(f"Fork {i + 1}", F(on_bolt(y)), F(end), [(1, 2), (3, 1), (5, 0)], "#a4dddb", [(1, [0, 0]), (2, [0, 1])],
                   (2, 4, crackle(sd, (1, 5))))
        bolt.append((f, None))
    ring_line = path_line(R, "Ring", ring, 1, [(0, "#a4dddb")], wiggle=(2, 7, crackle(5501, (0, FR - 1))), crisp=True)
    star = []
    for i in range(7):
        a = math.radians(i * 360 / 7 + 10)
        st = R.line(f"Scorch {i + 1}", F(foot), F((gx + 15 * math.cos(a), gy - 10 * math.sin(a))), [(2, 2), (6, 1)], "#172038",
                    [(2, [0, 0]), (3, [0, 1])], (1.5, 3, 7101 + i))
        star.append((st, [(0, 0), (1, 0), (2, 1), (6, 1), (9, 0)]))
    pit = R.shape("Scorch Pit", "Ellipse", "#10141f", [(2, gx, gy, 1, 0.7), (3, gx, gy, 5, 3.3)])
    sparks = R.particles("Sparks", [gx / W, gy / H, 0.06, 0.03], hold((0, [0, 0]), (2, [14, 18]), (3, [3, 5]), (4, [0, 0])),
                         (4, 8), (20, 160), (2, 4), SPARK, 2719, gravity=0.3)

    out = R.stack([(R.empty(), None)] + star + [(pit, [(0, 0), (1, 0), (2, 1), (6, 1), (9, 0)]), (glow, None)] + bolt
                  + [(ring_line, [(0, 0), (1, 0), (2, 1), (6, 1), (7, 0)]), (sparks, None)])
    print("  colours outside Apollo:", R.audit())
    return R.finish(out, "Storm_Strike", anchor=(gx, gy), notes=(
        "Storm Thunderhead strike: a bolt drops from above the frame onto the ground point, which it hits on frame 2; "
        "ground flash, crackling 3:2 ring, scorch star, sparks, fading glow. Play once at the end of the cast's wind-up "
        "(the game keeps its ring + timer). 48x96, 20 fps, shown at 1x. Anchor = strike point on the ground. Apollo."),
        extra_meta={"px": 1, "hit_frame": 2})


def mouse_bite():
    """Mouse helper bite, 48x48, 8 frames at 20 fps, played once on the target. An upper and a lower jaw sweep along
    curved paths as comet streaks (light band under a white core) and snap past each other on frame 2 (the hit), so
    the corners cross; six spikes spray out of the corners of the mouth over a small, brief light; fur tufts fly and
    fall. No drawn teeth: four attempts at this size read as a denture icon, "!!", "11" or nails. Shown at 1x."""
    W, H, FR = 48, 48, 8
    R = Rich(W, H, FR, fps=20, out=OUT)
    F = lambda p: [p[0] / W, p[1] / H]
    cx, cy = 24, 26

    # jaws: arcs that sweep in as comets, then hold while they clamp; each overshoots the centre line so the corners
    # overlap and the teeth interlock
    def arc(name, a0, a1, r, sy, close):
        pts = [(cx + r * math.cos(math.radians(a)), cy - r * 0.8 * math.sin(math.radians(a))) for a in
               [a0 + (a1 - a0) * i / 12 for i in range(13)]]
        p = R.path(name + " Path", pts)
        head = [(0, [0, 0.35]), (1, [0, 0.85]), (2, [0, 1]), (4, [0, 1]), (5, [0.5, 1]), (6, [1, 1])]
        band = path_line(R, name + " Band", p, 4, [(0, "#4f8fba"), (1, "#73bed3")], head, COMET, span=False)
        core = path_line(R, name + " Core", p, 2, [(0, "#a4dddb"), (1, "#ebede9")], head, COMET, span=False)
        both = R.mix(band, core, name=name)
        return R.node("Offset", name + " Close", {"X Offset": 0, "Y Offset": [(0, sy / H), (2, close / H)]}, {"Surface In": both})
    upper = arc("Upper Jaw", 160, 20, 13, -5, 3)
    lower = arc("Lower Jaw", 205, 335, 11, 5, -3)

    # impact: spikes sprayed out of the corners of the mouth; their blurred light plus a small, one-frame flash
    spikes, spike_light = R.empty(), R.empty()
    for i, deg in enumerate((0, 35, -35, 180, 145, 215)):
        a = math.radians(deg)
        p0, p1 = (cx + 6 * math.cos(a), cy - 6 * math.sin(a)), (cx + 18 * math.cos(a), cy - 18 * math.sin(a))
        rng = [(1, [0, 0]), (2, [0, 0.5]), (3, [0.4, 1]), (4, [1, 1])]
        spikes = R.mix(spikes, R.line(f"Spike {i + 1}", F(p0), F(p1), 1, "#ebede9", rng, crisp=True), name=f"Spike {i + 1} Layer")
        spike_light = R.mix(spike_light, R.line(f"Spike {i + 1} Light", F(p0), F(p1), 3, "#ffffff", rng), "add", name=f"Spike {i + 1} Light Layer")
    glow = R.glow("Bite Flash", F((cx, cy)), [(1, 0.0), (2, 0.09), (3, 0.0)], (1, 0.8))
    light = R.mix(glow, R.node("Blur", "Spike Halo", {"Size": 1}, {"Surface In": spike_light}), "add", name="Bite Light")
    light = R.cutcolor(light, ramp([(0, "#253a5e"), (0.35, "#4f8fba"), (0.7, "#a4dddb"), (1, "#ebede9")]), 0.25, "Bite Light")

    tufts = R.particles("Fur Tufts", [cx / W, cy / H, 0.06, 0.05], hold((0, [0, 0]), (2, [8, 10]), (3, [2, 3]), (4, [0, 0])), (4, 6),
                        (0, 360), (1.2, 2.6), ["#ebede9", "#c7cfcc", "#a8b5b2"], 4111, from_center=True, gravity=0.2)
    R.set(tufts, "Size", [1, 2])

    out = R.stack([(R.empty(), None), (light, None),
                   (lower, [(0, 1), (5, 1), (6, 0)]), (upper, [(0, 1), (5, 1), (6, 0)]),
                   (spikes, None), (tufts, None)])
    print("  colours outside Apollo:", R.audit())
    return R.finish(out, "Mouse_Bite", anchor=(cx, cy), notes=(
        "Mouse helper bite: 8 frames played once on the target; the jaws snap shut on frame 2 = the hit. Anchor = "
        "target centre. 48x48, 20 fps, shown at 1x. Apollo."), extra_meta={"px": 1, "hit_frame": 2})


def cat_swipe():
    """Cat claw swipe, one direction (east), 6 frames at 20 fps (0.3 s); the game flips it horizontally for targets
    on the left. Survivors pace: aim only needs to read as left or right, so no other directions are drawn.
    Three claw marks sweep across a 124-degree arc on the 3:2 ground (radii 76/88/100 px), drawn in along their own
    paths like Spark-Bolt's bolt; each is a crescent, thick mid-arc and pointed at both ends (the width curve spans
    the whole path; a curve over only the drawn part did not taper), a light band under a white core; a crescent air
    smear trails behind them; flecks fly off the tips as they leave. Shown at 1x; anchor = the cat."""
    W, H, N = 128, 128, 6
    DIRS = [("E", 0)]
    FR = N * len(DIRS)
    R = Rich(W, H, FR, fps=20, out=OUT)
    SPAN, RADII = 62, (76, 88, 100)
    pt = lambda ax, ay, r, a: (ax + r * math.cos(math.radians(a)), ay - r * 2 / 3 * math.sin(math.radians(a)))
    head = [(0, [0, 0.15]), (1, [0, 0.55]), (2, [0.15, 0.95]), (3, [0.5, 1]), (4, [0.85, 1]), (5, [1, 1])]
    tail = [(0, [0, 0]), (1, [0, 0.4]), (2, [0.05, 0.85]), (3, [0.35, 1]), (4, [0.75, 1]), (5, [1, 1])]
    at = lambda keys, s: [(s + f, v) for f, v in keys]
    layers, sections = [(R.empty(), None)], {}

    for k, (dname, th) in enumerate(DIRS):
        s = k * N
        angles = [th + SPAN - i * 8 for i in range(int(2 * SPAN / 8) + 1)]          # clockwise sweep
        # anchor so the arc (and the cat) sit centred in the frame
        xs = [0] + [r * math.cos(math.radians(a)) for r in (60, 104) for a in angles]
        ys = [0] + [-r * 2 / 3 * math.sin(math.radians(a)) for r in (60, 104) for a in angles]
        assert max(xs) - min(xs) < W - 4 and max(ys) - min(ys) < H - 4, dname
        ax, ay = round(W / 2 - (max(xs) + min(xs)) / 2), round(H / 2 - (max(ys) + min(ys)) / 2)
        sections[dname] = {"frames": [s, s + N - 1], "anchor": [ax, ay], "angle": th}

        mid = R.path(f"{dname} Smear Path", [pt(ax, ay, 88, a) for a in angles])
        smear = path_line(R, f"{dname} Air Smear", mid, 22, [(0, "#4f8fba"), (1, "#a4dddb")], at(tail, s), HUMP)
        layers.append((smear, [(0, 0)] + ([(s - 1, 0)] if s else []) + [(s, 0.35), (s + 3, 0.35), (s + 5, 0)]))
        for c, r in enumerate(RADII):
            p = R.path(f"{dname} Claw {c + 1} Path", [pt(ax, ay, r, a) for a in angles])
            band = path_line(R, f"{dname} Claw {c + 1} Band", p, 6, [(0, "#73bed3"), (1, "#a4dddb")], at(head, s), HUMP)
            core = path_line(R, f"{dname} Claw {c + 1} Core", p, 3, [(0, "#ebede9")], at(head, s), HUMP)
            layers += [(band, show(s, s + N - 1)), (core, show(s, s + N - 1))]
        tx, ty = pt(ax, ay, 96, th - SPAN + 6)
        flecks = R.particles(f"{dname} Tip Flecks", [tx / W, ty / H, 0.04, 0.03], hold((0, [0, 0]), (s + 3, [5, 6]), (s + 4, [0, 0])),
                             (3, 5), (th - SPAN - 130, th - SPAN - 50), (1.5, 3), ["#ebede9", "#a4dddb"], 8101 + k)
        layers.append((flecks, show(s, s + N - 1)))

    out = R.stack(layers)
    print("  colours outside Apollo:", R.audit())
    return R.finish(out, "Cat_Swipe", anchor=tuple(sections["E"]["anchor"]), notes=(
        "Cat claw swipe, drawn facing east: 6 frames at 20 fps, played once. Flip horizontally when the target is to "
        "the left; never rotate. Three crescent claw marks sweep over a 124-degree 3:2 arc (radii 76-100 px, about the "
        "120 px hit reach), crescent air smear behind, flecks off the tips. Shown at 1x; the sweep upgrade may stretch "
        "it slightly. Anchor = the cat. Apollo."),
        extra_meta={"px": 1, "reach_px": 100, "sections": sections})


if __name__ == "__main__":
    for a in sys.argv[1:] or ["mole_rumble"]:
        globals()[a]()
