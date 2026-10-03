"""Reward presentation effects (Pixel Composer, Toasted40 + white).
White effects (sheen, flip, trail) are meant to be tinted in code.
Run: python3 build_rewards.py [sheen] [flip] [trail] [slot] [crit] [rays] [unlockfill]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fxlib import Project, show

WHITE, CREAM, GOLD_L, GOLD, AMBER = "#ffffff", "#ffe6d1", "#f7b750", "#d1952e", "#f6cba7"
const = lambda op: [(0, op)]


def polar(cx, cy, dist, ang_deg):
    a = math.radians(ang_deg)
    return cx + dist * math.cos(a), cy - dist * math.sin(a)


def sheen():   # 3. 24x85, 8f @12, loop: diagonal highlight band sweeping across, a sparkle as it passes
    P = Project(24, 85, 8, fps=12)
    xs = [-10 + 44 * f / 8 for f in range(8)]
    wide = P.shape("Soft Band", "Rectangle", WHITE, [(f, xs[f], 42, 5, 64) for f in range(8)], rotation=20)
    thin = P.shape("Bright Band", "Rectangle", WHITE, [(f, xs[f], 42, 1.5, 64) for f in range(8)], rotation=20)
    spark = P.shape("Sparkle", "Star", WHITE, [(0, 12, 30, 0.01, 0.01), (2, 12, 30, 0.01, 0.01), (3, 10, 30, 2.5, 2.5),
                                              (4, 12, 30, 3.5, 3.5), (5, 14, 30, 1.5, 1.5), (6, 14, 30, 0.01, 0.01)], inner=0.3, sides=4)
    P.finish(P.stack([(P.empty(), None), (wide, const(0.35)), (thin, const(0.9)), (spark, None)]), "Pack_Sheen",
             loop=True, anchor=(0, 0), notes="white highlight band; tint lightly with the rarity color, clip to the card, offset start frame per card")


def flip():    # 4. 48x48, 6f @20, once: burst of light from the card center + square sparks. White, tinted in code.
    P = Project(48, 48, 6, fps=20); C = 24
    core = P.shape("Core", "Ellipse", WHITE, [(0, C, C, 5, 5), (1, C, C, 10, 10), (2, C, C, 12, 12), (3, C, C, 8, 8), (4, C, C, 0.01, 0.01)])
    ring = P.shape("Ring", "Donut", WHITE, [(0, C, C, 6, 6), (1, C, C, 12, 12), (2, C, C, 17, 17), (3, C, C, 20, 20), (4, C, C, 0.01, 0.01)], inner=0.18)
    layers = [(P.empty(), None), (core, [(0, 1.0), (1, 1.0), (2, 0.7), (3, 0.4)]), (ring, [(0, 1.0), (2, 0.8), (3, 0.5)])]
    for k in range(6):
        ang = 30 + 60 * k; ks = []
        for f, dist, s in [(0, 6, 1.5), (1, 11, 1.5), (2, 15, 1.2), (3, 18, 1.0), (4, 20, 0.6), (5, 21, 0.01)]:
            x, y = polar(C, C, dist, ang); ks.append((f, x, y, s, s))
        layers.append((P.shape(f"Spark {k+1}", "Rectangle", WHITE, ks), None))
    P.finish(P.stack(layers), "Pack_Flip", anchor=(C, C), notes="white card-flip flash; tint by rarity in code")


def trail():   # 5. 8x8, 5f @20, once: tiny sparkle that pops and fades. White (tint gold in code if wanted).
    P = Project(8, 8, 5, fps=20); C = 4
    star = P.shape("Sparkle", "Star", WHITE, [(0, C, C, 1.5, 1.5), (1, C, C, 3.5, 3.5), (2, C, C, 2.5, 2.5), (3, C, C, 1.5, 1.5), (4, C, C, 0.01, 0.01)], inner=0.3, sides=4)
    dot = P.shape("Center", "Ellipse", WHITE, [(0, C, C, 1, 1), (2, C, C, 1, 1), (3, C, C, 0.01, 0.01)])
    P.finish(P.stack([(P.empty(), None), (star, None), (dot, None)]), "Reward_Trail", anchor=(C, C),
             notes="spawn every few frames along the flight path; white, tint gold in code if wanted")


def slot():    # 6. 32x32, 6f @15, once: gold ring pulse + upward shimmer over the party-bar portrait
    P = Project(32, 32, 6, fps=15); C = 16
    ring = P.shape("Gold Ring", "Donut", GOLD_L, [(0, C, C, 8, 8), (1, C, C, 11, 11), (2, C, C, 13, 13), (3, C, C, 15, 15), (4, C, C, 16, 16), (5, C, C, 0.01, 0.01)], inner=0.2)
    inner = P.shape("White Ring", "Donut", WHITE, [(0, C, C, 6, 6), (1, C, C, 9, 9), (2, C, C, 12, 12), (3, C, C, 0.01, 0.01)], inner=0.15)
    layers = [(P.empty(), None), (ring, [(0, 1.0), (3, 1.0), (4, 0.5)]), (inner, None)]
    for k, (x, f0, col) in enumerate([(9, 1, CREAM), (16, 0, GOLD_L), (23, 1, CREAM)]):
        ks = [(0, x, 27, 0.01, 0.01)] + ([(f0 - 1, x, 27, 0.01, 0.01)] if f0 > 0 else [])
        for t, (y, h) in enumerate([(24, 3), (18, 4), (12, 3.5), (7, 2), (4, 0.01)]):
            if f0 + t <= 5: ks.append((f0 + t, x, y, 0.75, h))
        layers.append((P.shape(f"Shimmer {k+1}", "Rectangle", col, ks), None))
    for k, (x, y, f0) in enumerate([(7, 10, 2), (25, 8, 3)]):
        layers.append((P.shape(f"Sparkle {k+1}", "Star", WHITE, [(0, x, y, 0.01, 0.01), (f0 - 1, x, y, 0.01, 0.01), (f0, x, y, 2.5, 2.5), (f0 + 1, x, y - 2, 1.5, 1.5), (f0 + 2, x, y - 3, 0.01, 0.01)], inner=0.3, sides=4), None))
    P.finish(P.stack(layers), "Slot_PowerUp", anchor=(C, C), notes="gold ring pulse + rising shimmer: this creature got stronger")


def crit():    # 11. 24x24, 5f @20, once: gold 4-point flash behind a crit number; center kept open
    P = Project(24, 24, 5, fps=20); C = 12
    layers = [(P.empty(), None)]
    steps = [(0, 5, 2.0, 1.0), (1, 7, 4.5, 1.0), (2, 8, 3.5, 0.75), (3, 9, 2.0, 0.5), (4, 9.5, 0.01, 0.01)]   # (frame, dist, half-len, half-w)
    for k, ang in enumerate([90, 0, 270, 180]):
        vert = ang in (90, 270); ks, tips = [], []
        for f, dist, hl, hw in steps:
            x, y = polar(C, C, dist + hl, ang)
            ks.append((f, x, y, hw if vert else hl, hl if vert else hw))
            tx, ty = polar(C, C, dist + 2 * hl, ang); tips.append((f, tx, ty, max(0.01, hw), max(0.01, hw)))
        layers.append((P.shape(f"Ray {k+1}", "Rectangle", GOLD_L, ks), None))
        layers.append((P.shape(f"Ray Tip {k+1}", "Rectangle", WHITE, tips), None))
    for k, ang in enumerate([45, 135, 225, 315]):
        ks = [(0, C, C, 0.01, 0.01)]
        for f, dist, s in [(1, 6, 1.0), (2, 8, 1.0), (3, 10, 0.6), (4, 11, 0.01)]:
            x, y = polar(C, C, dist, ang); ks.append((f, x, y, s, s))
        layers.append((P.shape(f"Spark {k+1}", "Rectangle", CREAM, ks), None))
    P.finish(P.stack(layers), "Damage_Crit", anchor=(C, C), notes="gold flash behind a crit number; nothing drawn within ~4px of the center")


def rays():    # 8. 64x64, 8f @8, loop: soft rotating gold rays behind the NEW STARTER portrait
    P = Project(64, 64, 8, fps=8); C = 32
    def star(name, col, r, inner, direction):
        n = P.shape(name, "Star", col, [(0, C, C, r, r)], inner=inner, sides=10)
        from fxlib import anim
        anim(n["inputs"][19], [(f, direction * 36 * f / 8) for f in range(8)])   # 10-point star repeats every 36 degrees
        return n
    outer = star("Outer Rays", GOLD_L, 32, 0.22, 1)
    mid = star("Mid Rays", AMBER, 25, 0.25, -1)
    core = star("Inner Rays", CREAM, 18, 0.3, 1)
    P.finish(P.stack([(P.empty(), None), (outer, const(0.3)), (mid, const(0.35)), (core, const(0.45))]), "Unlock_Rays",
             loop=True, anchor=(C, C), notes="slow rotating rays behind the 76x76 portrait; brighter toward the center, faint at the edges")


def unlockfill():   # 9. 48x48, 8f @20, once: white wipe across the portrait, full flash on frame 3, then sparks
    P = Project(48, 48, 8, fps=20); C = 24
    band = P.shape("Wipe Band", "Rectangle", WHITE, [(0, 6, 6, 5, 40), (1, 14, 14, 9, 40), (2, 22, 22, 18, 40), (3, 24, 24, 0.01, 0.01)], rotation=45)
    flash = P.shape("Full Flash", "Rectangle", WHITE, [(0, C, C, 0.01, 0.01), (2, C, C, 0.01, 0.01), (3, C, C, 23, 23), (4, C, C, 21, 21), (5, C, C, 16, 16), (6, C, C, 0.01, 0.01)])
    layers = [(P.empty(), None), (band, [(0, 0.9), (2, 1.0)]), (flash, [(0, 1.0), (3, 1.0), (4, 0.6), (5, 0.3)])]
    for k in range(8):
        ang = 22.5 + 45 * k; ks = [(0, C, C, 0.01, 0.01), (3, C, C, 0.01, 0.01)]
        for f, dist, s in [(4, 14, 1.5), (5, 18, 1.5), (6, 21, 1.0), (7, 23, 0.01)]:
            x, y = polar(C, C, dist, ang); ks.append((f, x, y, s, s))
        layers.append((P.shape(f"Spark {k+1}", "Rectangle", WHITE if k % 2 else CREAM, ks), None))
    P.finish(P.stack(layers), "Unlock_Fill", anchor=(C, C),
             notes="swap the silhouette for the real portrait on frame 3 (full white)", extra_meta={"swap_frame": 3})


if __name__ == "__main__":
    fns = dict(sheen=sheen, flip=flip,   # trail is hand-drawn in build_fillers.py
               slot=slot, crit=crit, rays=rays, unlockfill=unlockfill)
    for w in (sys.argv[1:] or list(fns)):
        fns[w]()
