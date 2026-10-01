"""Evolution ability effects, Phase B (Pixel Composer, Toasted40 + white). See docs/evolution-vfx-integration.md.
Ink and fire are drawn in palette colours (no tint). Lightning, bubble, sweep and warning effects are white and tinted in code.
Ground effects are 3:2 ellipses. Each JSON carries "visible_w": the visible width in px, so code can scale to the hit size.
Tengu_Feather and Lightning_Link are hand-drawn in build_fillers.py (single-pixel detail).
Run: python3 build_abilities.py [splat] [inkpool] [sweep] [inkhit] [kick] [firepool] [bite] [detonate] [zap] [warning] [pulse] [break] [rally]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fxlib import Project

WHITE, CREAM = "#ffffff", "#ffe6d1"
INK_D, INK, INK_L, INK_S = "#53414f", "#8973ab", "#c28ead", "#c2b5c4"
EMBER_D, FIRE_D, FIRE, GOLD, = "#84333e", "#cf6631", "#e17e53", "#f7b750"
T = 0.01
const = lambda op: [(0, op)]


def polar(cx, cy, dist, ang_deg, squash=1.0):
    a = math.radians(ang_deg)
    return cx + dist * math.cos(a), cy - dist * math.sin(a) * squash


def vis(w, note=None):
    m = {"visible_w": w}
    if note: m["visible_note"] = note
    return m


def pool(P, cx, cy, sizes, name):
    """Ink puddle layers keyed by [(frame, rx)]: fill, dark rim, highlight. Returns layers."""
    fill = P.shape(name + " Fill", "Ellipse", INK, [(f, cx, cy, rx, rx * 2 / 3) for f, rx in sizes])
    rim = P.shape(name + " Rim", "Donut", INK_D, [(f, cx, cy, rx, rx * 2 / 3) for f, rx in sizes], inner=0.12)
    hi = P.shape(name + " Shine", "Ellipse", INK_L, [(f, cx - rx * .3, cy - rx * .25, rx * .35, rx * .18) for f, rx in sizes])
    return [fill, rim, hi]


# ---------------------------------------------------------------- Mollusc / Octopus / Axolotl ink
def splat():   # 48x32, 6f @20: blob drops in, lands, spatters into droplets, settles into the pool's size
    P = Project(48, 32, 6, fps=20); C, Y = 24, 16
    blob = P.shape("Falling Blob", "Ellipse", INK, [(0, C, 6, 3, 3), (1, C, Y, T, T)])
    sizes = [(0, T), (1, 8), (2, 14), (3, 18), (4, 20), (5, 20)]
    layers = [(P.empty(), None), (blob, None)] + [(l, [(0, 1.0), (4, 1.0), (5, 0.7)]) for l in pool(P, C, Y, sizes, "Splat")]
    for k, ang in enumerate([20, 70, 115, 160, 220, 320]):
        ks = [(0, C, Y, T, T), (1, C, Y, T, T)]
        for f, d, s in [(2, 14, 2.0), (3, 19, 1.5), (4, 22, 1.0), (5, 23, T)]:
            x, y = polar(C, Y, d, ang, 2 / 3); ks.append((f, x, y, s, s))
        layers.append((P.shape(f"Droplet {k+1}", "Ellipse", INK if k % 2 else INK_L, ks), None))
    P.finish(P.stack(layers), "Ink_Splat", anchor=(C, Y), notes="ink lands and spatters; ends at the pool's size so Ink_Pool_Start/Loop can follow.",
             extra_meta=vis(40, "pool width at the end; scale = 2r / 40"))


def inkpool():  # start 4f @15, loop 8f @8, end 4f @15 (48x32): the puddle grows, shimmers, dries up
    for name, frames, fps, sizes, loop, fade in [
            ("Ink_Pool_Start", 4, 15, [(0, 6), (1, 12), (2, 17), (3, 20)], False, None),
            ("Ink_Pool_Loop", 8, 8, [(0, 20)], True, None),
            ("Ink_Pool_End", 4, 15, [(0, 20), (1, 16), (2, 10), (3, 4)], False, [(0, 1.0), (1, 0.8), (2, 0.6), (3, 0.35)])]:
        P = Project(48, 32, frames, fps=fps); C, Y = 24, 16
        layers = [(P.empty(), None)] + [(l, fade) for l in pool(P, C, Y, sizes, "Pool")]
        if loop:   # a shimmer orbits the surface once per loop, and two bubbles rise and pop out of phase
            ks = []
            for f in range(8):
                x, y = polar(C, Y, 8, 135 - 360 * f / 8, 2 / 3); ks.append((f, x, y, 4, 1.5))
            layers.append((P.shape("Shimmer", "Ellipse", INK_S, ks), const(0.6)))
            for k, (bx, by, f0) in enumerate([(17, 18, 0), (30, 14, 4)]):
                bk = []
                for f in range(8):
                    age = (f - f0) % 8; s = [1.0, 1.5, 2.0, 1.5, T, T, T, T][age]; bk.append((f, bx, by, s, s))
                layers.append((P.shape(f"Bubble {k+1}", "Donut", INK_S, bk, inner=0.4), None))
        P.finish(P.stack(layers), name, loop=loop, anchor=(C, Y), notes="friendly ink puddle (filled, textured: never an orange outline).",
                 extra_meta=vis(40, "scale = 2r / 40"))


def sweep():   # 96x96, 6f @20: 160-degree tentacle smear pointing right (0 deg), thick at the leading edge. White.
    P = Project(96, 96, 6, fps=20); C = 48; R = 44; N = 11
    progress = [0.3, 0.65, 0.9, 1.0, 1.0, 1.0]
    layers = [(P.empty(), None)]
    for ring, rad, thick in [("Outer", R, 1.0), ("Inner", R - 8, 0.6)]:
        for k in range(N):
            ang = 80 - 160 * k / (N - 1)    # sweeps from the top of the arc (80) down to the bottom (-80)
            fk = next(f for f, p in enumerate(progress) if p * (N - 1) >= k - 1e-6)
            x, y = polar(C, C, rad, ang); ks = [(0, x, y, T, T)] + ([(fk - 1, x, y, T, T)] if fk > 0 else [])
            for age, s in enumerate([4.0, 3.2, 2.4, 1.6, 1.0, T]):
                if fk + age < 6: ks.append((fk + age, x, y, s * thick, s * thick))
            layers.append((P.shape(f"{ring} Seg {k+1}", "Ellipse", WHITE, ks), None))
    tip = []
    for f, p in enumerate(progress[:4]):
        x, y = polar(C, C, R, 80 - 160 * p); tip.append((f, x, y, 5, 5))
    tip.append((4, *polar(C, C, R, -80), T, T))
    layers.append((P.shape("Leading Tip", "Star", WHITE, tip, inner=0.35, sides=4), None))
    P.finish(P.stack(layers), "Tentacle_Sweep", anchor=(C, C), notes="authored pointing right; rotate by the sweep angle, rear sweep = angle + PI. White, tint 0xccafff.",
             extra_meta=vis(44, "arc RADIUS in px; scale = r / 44"))


def inkhit():  # 16x16, 5f @20: small ink splash on an inked target
    P = Project(16, 16, 5, fps=20); C = 8
    blob = P.shape("Splash", "Ellipse", INK, [(0, C, C, 2, 2), (1, C, C, 4, 3), (2, C, C, 3.5, 2.5), (3, C, C, 2, 1.5), (4, C, C, T, T)])
    hi = P.shape("Splash Shine", "Ellipse", INK_L, [(0, C - 1, C - 1, 1, 1), (2, C - 1, C - 1, 1.5, 1), (3, C, C, T, T)])
    layers = [(P.empty(), None), (blob, None), (hi, None)]
    for k, ang in enumerate([45, 135, 225, 315]):
        ks = [(0, C, C, T, T)]
        for f, d, s in [(1, 4, 1.0), (2, 6, 1.0), (3, 7, 0.75), (4, 7.5, T)]:
            x, y = polar(C, C, d, ang); ks.append((f, x, y, s, s))
        layers.append((P.shape(f"Drop {k+1}", "Rectangle", INK, ks), None))
    P.finish(P.stack(layers), "Ink_Hit", anchor=(C, C), notes="tentacle hit on an inked target (Squeezing Grip). Coalesce: one per enemy per 100ms.",
             extra_meta=vis(14))


# ---------------------------------------------------------------- Reptile fire
def kick():    # 48x32, 6f @20: fire-and-dust puff thrown backward from a charge start. Authored charging RIGHT (puff goes left).
    P = Project(48, 32, 6, fps=20); AX, AY = 34, 20
    layers = [(P.empty(), None)]
    for k, (dy, col, s0) in enumerate([(-3, FIRE, 3), (2, "#a57b73", 4), (0, GOLD, 2)]):
        ks = []
        for f, (dx, s) in enumerate([(0, s0), (-6, s0 + 2), (-12, s0 + 3), (-18, s0 + 3), (-22, s0 + 1.5), (-24, T)]):
            ks.append((f, AX + dx - k * 3, AY + dy - f * 0.6, s * 1.3, s))
        layers.append((P.shape(f"Puff {k+1}", "Ellipse", col, ks), [(0, 1.0), (3, 0.8), (4, 0.5)]))
    for k, (ang, col) in enumerate([(160, GOLD), (190, CREAM), (210, FIRE)]):
        ks = [(0, AX, AY, T, T)]
        for f, d, s in [(1, 8, 1.0), (2, 14, 1.0), (3, 18, 0.75), (4, 20, T)]:
            x, y = polar(AX, AY, d, ang); ks.append((f, x, y, s, s))
        layers.append((P.shape(f"Ember {k+1}", "Rectangle", col, ks), None))
    P.finish(P.stack(layers), "Charge_Kick", anchor=(AX, AY), notes="authored for a charge to the RIGHT; flipX (or rotate) for other directions. Double Charge plays it at 0.7x.",
             extra_meta=vis(34))


def firepatch(P, C, Y, sizes, tongues=True, loop_frames=None, fade=None):
    base = P.shape("Ember Bed", "Ellipse", EMBER_D, [(f, C, Y, rx, rx * 2 / 3) for f, rx in sizes])
    mid = P.shape("Fire Bed", "Ellipse", FIRE_D, [(f, C, Y, rx * .75, rx * .5) for f, rx in sizes])
    core = P.shape("Hot Core", "Ellipse", GOLD, [(f, C, Y, rx * .35, rx * .22) for f, rx in sizes])
    layers = [(base, fade), (mid, fade), (core, fade)]
    if tongues:   # five flame tongues; heights cycle so frame 8 equals frame 0 in the loop
        spots = [(-11, 1), (-5, -2), (1, 2), (7, -1), (12, 1)]
        for k, (ox, oy) in enumerate(spots):
            ks, tk = [], []
            for f, rx in (sizes if not loop_frames else [(f, sizes[0][1]) for f in range(loop_frames)]):
                scale = rx / 20
                h = [5, 7, 9, 7, 4, 6, 8, 6][(f + k * 3) % 8] * scale if loop_frames else (4 + 2 * f) * scale
                x, y = C + ox * scale, Y + oy * scale - h / 2
                ks.append((f, x, y, 1.5 * scale + .5, h / 2)); tk.append((f, x, y - h / 2 + 1, 0.75 * scale + .25, 1))
            layers.append((P.shape(f"Tongue {k+1}", "Ellipse", FIRE if k % 2 else GOLD, ks), fade))
            layers.append((P.shape(f"Tongue Tip {k+1}", "Rectangle", CREAM, tk), fade))
    return layers


def firepool():  # 48x32: start 4f @15, loop 8f @10, end 4f @15. Filled, flickering flames (never an outline-only ring).
    C, Y = 24, 18
    for name, frames, fps, sizes, loop, fade in [
            ("Fire_Pool_Start", 4, 15, [(0, 6), (1, 12), (2, 17), (3, 20)], False, None),
            ("Fire_Pool_Loop", 8, 10, [(0, 20)], True, None),
            ("Fire_Pool_End", 4, 15, [(0, 20), (1, 15), (2, 9), (3, 4)], False, [(0, 1.0), (1, 0.8), (2, 0.55), (3, 0.3)])]:
        P = Project(48, 32, frames, fps=fps)
        layers = [(P.empty(), None)] + firepatch(P, C, Y, sizes, loop_frames=8 if loop else None, fade=fade)
        P.finish(P.stack(layers), name, loop=loop, anchor=(C, Y), notes="friendly burning ground (filled flames; hostile warnings are orange outlines).",
                 extra_meta=vis(40, "scale = 2r / 40"))


def bite():    # 64x48, 12f @20 (0.6s): two rows of fangs snap shut, bite down a pixel, hold, then fade slowly. Teeth only.
    P = Project(64, 48, 12, fps=20); C, Y = 32, 24
    fade = [(0, 1.0), (6, 1.0), (8, 0.75), (10, 0.4), (11, 0.15)]
    layers = [(P.empty(), None)]
    for row, (y0, y1, bite_dir) in enumerate([(10, 21, 1), (38, 27, -1)]):
        for k, ox in enumerate([-10.5, -3.5, 3.5, 10.5]):
            s0 = 2.5 if k in (1, 2) else 2.0   # inner fangs a little larger
            ks = [(0, C + ox, y0, s0, s0), (1, C + ox, (y0 + y1) / 2, s0 + .5, s0 + .5), (2, C + ox, y1, s0 + .75, s0 + .75),
                  (3, C + ox, y1 + bite_dir, s0 + .75, s0 + .75), (4, C + ox, y1, s0 + .5, s0 + .5), (11, C + ox, y1, s0 + .5, s0 + .5)]
            layers.append((P.shape(f"Fang {row+1}-{k+1}", "Rectangle", CREAM, ks, rotation=45), fade))
            tip = [(f, x, y + bite_dir * (s0 * .9), .75, .75) for f, x, y in [(0, C + ox, y0), (1, C + ox, (y0 + y1) / 2), (2, C + ox, y1), (3, C + ox, y1 + bite_dir), (4, C + ox, y1), (11, C + ox, y1)]]
            layers.append((P.shape(f"Fang Tip {row+1}-{k+1}", "Rectangle", WHITE, tip), fade))
    P.finish(P.stack(layers), "Bite_Impact", anchor=(C, Y), notes="Reptile heavy bite at the charge endpoint: fangs snap, hold, then fade. No ring.",
             extra_meta=vis(28, "fang span; draw at a fixed 3x world scale, NOT scaled to the 70 bite radius"))


def detonate():  # 64x48, 8f @20: fireball swells and pops, a ring and eight embers fly out and fall
    P = Project(64, 48, 8, fps=20); C, Y = 32, 24
    ball = P.shape("Fireball", "Ellipse", GOLD, [(0, C, Y, 4, 4), (1, C, Y, 9, 8), (2, C, Y, 13, 11), (3, C, Y, 10, 8), (4, C, Y, T, T)])
    shell = P.shape("Fireball Edge", "Ellipse", FIRE, [(0, C, Y, 5, 5), (1, C, Y, 11, 10), (2, C, Y, 16, 13), (3, C, Y, 14, 11), (4, C, Y, 8, 6), (5, C, Y, T, T)])
    core = P.shape("White Core", "Ellipse", CREAM, [(0, C, Y, 2, 2), (1, C, Y, 5, 4), (2, C, Y, 4, 3), (3, C, Y, T, T)])
    ring = P.shape("Blast Ring", "Donut", FIRE_D, [(0, C, Y, T, T), (2, C, Y, T, T), (3, C, Y, 18, 12), (4, C, Y, 23, 15.3), (5, C, Y, 27, 18), (6, C, Y, 29, 19.3), (7, C, Y, 30, 20)], inner=0.12)
    layers = [(P.empty(), None), (ring, [(0, 1.0), (5, 0.8), (6, 0.5), (7, 0.25)]), (shell, None), (ball, None), (core, None)]
    for k in range(8):
        ang = 22.5 + 45 * k; ks = [(0, C, Y, T, T), (1, C, Y, T, T)]
        for f, d, s in [(2, 10, 1.5), (3, 16, 1.5), (4, 21, 1.25), (5, 24, 1.0), (6, 26, 0.75), (7, 27, T)]:
            x, y = polar(C, Y, d, ang, 2 / 3); ks.append((f, x, y + (f - 2) ** 2 * 0.4, s, s))   # embers fall as they fly
        layers.append((P.shape(f"Ember {k+1}", "Rectangle", GOLD if k % 2 else CREAM, ks), None))
    P.finish(P.stack(layers), "Fire_Detonate", anchor=(C, Y), notes="Explosive Bite on a burning target; splash radius 75.", extra_meta=vis(60, "scale = 2r / 60 (r = 75)"))


# ---------------------------------------------------------------- Tengu lightning
def zap():     # 16x16, 5f @24: contact crackle, a 4-point star that flips 45 degrees each frame. White.
    P = Project(16, 16, 5, fps=24); C = 8
    a = P.shape("Crackle +", "Star", WHITE, [(0, C, C, 4, 4), (1, C, C, T, T), (2, C, C, 6, 6), (3, C, C, T, T), (4, C, C, 3, 3)], inner=0.2, sides=4)
    b = P.shape("Crackle x", "Star", WHITE, [(0, C, C, T, T), (1, C, C, 7, 7), (2, C, C, T, T), (3, C, C, 5, 5), (4, C, C, T, T)], inner=0.2, sides=4, rotation=45)
    dot = P.shape("Hot Dot", "Ellipse", WHITE, [(0, C, C, 1.5, 1.5), (2, C, C, 1.5, 1.5), (3, C, C, 1, 1), (4, C, C, T, T)])
    P.finish(P.stack([(P.empty(), None), (a, None), (b, None), (dot, None)]), "Zap_Spark", anchor=(C, C),
             notes="feather/lightning contact spark; white, tint 0x9beaff. Coalesce: one per enemy per 100ms, at most 12 alive.", extra_meta=vis(14))


def warning():  # 48x32, 6f @12, loop: friendly thunder warning. Steady ground ring, an inner ring and four sparks pulled inward. White.
    P = Project(48, 32, 6, fps=12); C, Y = 24, 16
    outer = P.shape("Ring", "Donut", WHITE, [(0, C, Y, 22, 14.7)], inner=0.08)
    inner = P.shape("Closing Ring", "Donut", WHITE, [(f, C, Y, rx, rx * 2 / 3) for f, rx in enumerate([20, 17, 14, 11, 8, 5])], inner=0.12)
    layers = [(P.empty(), None), (outer, const(0.8)), (inner, [(0, 0.3), (2, 0.6), (5, 0.9)])]
    for k, ang in enumerate([45, 135, 225, 315]):
        ks = []
        for f in range(6):
            x, y = polar(C, Y, 21 - 3 * f, ang, 2 / 3); ks.append((f, x, y, 1.0, 1.0))
        layers.append((P.shape(f"Spark {k+1}", "Rectangle", WHITE, ks), None))
    P.finish(P.stack(layers), "Thunder_Warning", loop=True, anchor=(C, Y),
             notes="friendly 0.65s thunder warning; white, tint 0x9beaff. Closed ring + inward sparks so it never reads as a hostile orange outline.",
             extra_meta=vis(44, "scale = 2r / 44 (r = 60)"))


# ---------------------------------------------------------------- Axolotl bubbles
def pulse():   # 48x48, 7f @20: bubble shell swells around the player, shines, settles. White.
    P = Project(48, 48, 7, fps=20); C = 24
    sizes = [(0, 8), (1, 14), (2, 19), (3, 21), (4, 20), (5, 21), (6, 21)]
    shell = P.shape("Shell", "Donut", WHITE, [(f, C, C, r, r) for f, r in sizes], inner=0.1)
    film = P.shape("Film", "Ellipse", WHITE, [(f, C, C, r, r) for f, r in sizes])
    shine = P.shape("Shine", "Ellipse", WHITE, [(f, C - r * .45, C - r * .45, r * .22, r * .14) for f, r in sizes], rotation=45)
    P.finish(P.stack([(P.empty(), None), (film, const(0.2)), (shell, [(0, 1.0), (4, 1.0), (5, 0.7), (6, 0.4)]), (shine, None)]), "Bubble_Pulse",
             anchor=(C, C), notes="Axolotl shield pulse around the player; white, tint 0xa1dbef.", extra_meta=vis(42, "scale = 2r / 42 (r = shield ring, 29)"))


def bubble_break():   # 64x44, 8f @20: the shell pops into shards and an expanding 3:2 ring. White.
    P = Project(64, 44, 8, fps=20); C, Y = 32, 22
    shell = P.shape("Shell", "Donut", WHITE, [(0, C, Y, 10, 10), (1, C, Y, 12, 12), (2, C, Y, T, T)], inner=0.12)
    ring = P.shape("Ring", "Donut", WHITE, [(0, C, Y, T, T), (1, C, Y, T, T)] + [(f, C, Y, rx, rx * 2 / 3) for f, rx in [(2, 12), (3, 18), (4, 23), (5, 27), (6, 30), (7, 31)]], inner=0.12)
    layers = [(P.empty(), None), (shell, None), (ring, [(0, 1.0), (5, 0.8), (6, 0.5), (7, 0.25)])]
    for k in range(6):
        ang = 30 + 60 * k; ks = [(0, C, Y, T, T), (1, C, Y, T, T)]
        for f, d, s in [(2, 12, 1.5), (3, 17, 1.25), (4, 21, 1.0), (5, 24, 0.75), (6, 26, T)]:
            x, y = polar(C, Y, d, ang, 2 / 3); ks.append((f, x, y, s * 1.5, s * .75))
        layers.append((P.shape(f"Shard {k+1}", "Rectangle", WHITE, ks, rotation=ang), None))
    P.finish(P.stack(layers), "Bubble_Break", anchor=(C, Y), notes="blocked hit: bubble pops, ring expands; ink pool follows (separate sheets). White, tint 0xa1dbef.",
             extra_meta=vis(62, "scale = 2r / 62 (r = ring radius, base 100)"))


def rally():   # 24x32, 8f @12, loop: gold motes rising around the player while Bubble Rally lasts
    P = Project(24, 32, 8, fps=12)
    layers = [(P.empty(), None)]
    for k, (x, phase, col) in enumerate([(5, 0, GOLD), (12, 3, CREAM), (19, 5, GOLD), (9, 6, CREAM)]):
        ks = []
        for f in range(8):
            t = ((f + phase) % 8) / 8; s = 1.5 * (1 - t) + 0.25
            ks.append((f, x + math.sin(t * 6.28) * 1.5, 29 - 26 * t, s, s))
        layers.append((P.shape(f"Mote {k+1}", "Rectangle", col, ks), None))
    P.finish(P.stack(layers), "Rally_Motes", loop=True, anchor=(12, 28), notes="Bubble Rally (+30% attack speed for 3s): gold motes rising from the player's feet. Drawn gold; no tint.",
             extra_meta=vis(18))


if __name__ == "__main__":
    fns = dict(splat=splat, inkpool=inkpool, sweep=sweep, inkhit=inkhit, kick=kick, firepool=firepool, bite=bite,
               detonate=detonate, zap=zap, warning=warning, pulse=pulse, **{"break": bubble_break}, rally=rally)
    for w in (sys.argv[1:] or list(fns)):
        fns[w]()
