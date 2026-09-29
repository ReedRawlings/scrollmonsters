"""Monster attack effects from "THE SCROLL — Confirmed Monsters" (Pixel Composer, Toasted40 + white).
Small crisp pieces (tongue, spikes, anger mark, notes, footprints, bite) are hand-placed in build_monster_sprites.py.
Run: python3 build_monster_fx.py [flame] [wave] [ink] [noteburst] [lipstick]"""
import sys, os, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fxlib import Project

WHITE, CREAM, PEACH = "#ffffff", "#ffe6d1", "#f6cba7"
GOLD_L, GOLD, CORAL = "#f7b750", "#d1952e", "#e17e53"
RED, BRICK, PINK, ROSE, WINE = "#cd5151", "#b74037", "#d46e76", "#c28ead", "#84333e"
PLUM_D, PLUM, PLUM_L, MAUVE = "#2e1b2b", "#392f36", "#53414f", "#7f6462"
LAV = "#c2b5c4"


def win(on, levels):
    """Opacity keys: hidden before `on`, then one level per frame, hidden afterwards."""
    k = [] if on == 0 else [(0, 0.0), (on - 1, 0.0)]
    k += [(on + i, l) for i, l in enumerate(levels)]
    return k + [(on + len(levels), 0.0)]


def polar(cx, cy, dist, ang_deg, squash=1.0):
    a = math.radians(ang_deg)
    return cx + dist * math.cos(a), cy - dist * math.sin(a) * squash


# ------------------------------------------------------------------ Fizzteen: small flame cone
def flame():   # 64x48, 10f @15. Points right from the anchor (the mouth); rotate in code to aim.
    W, H, FR, OX, OY = 64, 48, 10, 4, 24
    P = Project(W, H, FR, fps=15)
    rnd = random.Random(7)
    puffs = [(f0, rnd.uniform(-15, 15), rnd.uniform(0.85, 1.15)) for f0 in range(6) for _ in range(3 if f0 < 5 else 2)]

    def keys(f0, ang, sc, ts, grow=1.0):
        out = []
        for t in ts:
            x, y = polar(OX, OY, 5 + 10.5 * t, ang)
            r = (2.2 + 1.5 * t) * sc * grow
            out.append((f0 + t, x, y - 0.25 * t * t, r, r * 0.8))   # licks upward a little as it cools
        return out

    smoke, body, hot, core = [], [], [], []
    for k, (f0, ang, sc) in enumerate(puffs):
        smoke.append((P.shape(f"Puff {k+1} Smoke", "Ellipse", PLUM_L, keys(f0, ang, sc, [3, 4])), win(f0 + 4, [0.55])))
        body.append((P.shape(f"Puff {k+1} Flame", "Ellipse", CORAL, keys(f0, ang, sc, [2, 3])), win(f0 + 2, [1, 1])))
        hot.append((P.shape(f"Puff {k+1} Hot", "Ellipse", GOLD_L, keys(f0, ang, sc, [0, 1])), win(f0, [1, 1])))
        core.append((P.shape(f"Puff {k+1} Core", "Ellipse", CREAM, keys(f0, ang, sc, [0, 1], 0.5)), win(f0, [1, 0.8])))
    mouth = P.shape("Mouth Flash", "Ellipse", CREAM, [(f, OX + 3, OY, r, r * 0.9) for f, r in enumerate([3, 4, 3.5, 4, 3.5, 2.5, 1, 0.01])])
    hotspot = P.shape("Mouth Core", "Ellipse", WHITE, [(f, OX + 3, OY, r, r * 0.9) for f, r in enumerate([1.5, 2, 1.5, 2, 1.5, 0.01])])
    layers = [(P.empty(), None)] + smoke + body + hot + core + [(mouth, None), (hotspot, None)]
    P.finish(P.stack(layers), "Fizzteen_Flame", anchor=(OX, OY),
             notes="Fizzteen: small flame cone pointing right (0 deg) from the anchor; rotate the sprite to aim. Hot gold at the mouth, coral in the middle, plum smoke at the tips.")


# ------------------------------------------------------------------ Chorubble: sound wave out + stronger bounce back
def wave_out():   # 96x64, 8f @15. Two 3:2 double rings expand from the creature.
    W, H, FR, C, CY = 96, 64, 8, 48, 32
    P = Project(W, H, FR, fps=15)
    layers = [(P.empty(), None)]
    radius = lambda t: 7 + 39 * (1 - (1 - t / 5) ** 2)         # ease out
    for k, f0 in enumerate([0, 2]):
        lead = [(f0 + t, C, CY, radius(t), radius(t) * 2 / 3) for t in range(6)]
        trail = [(f0 + t, C, CY, max(0.01, radius(t) - 4), max(0.01, radius(t) - 4) * 2 / 3) for t in range(6)]
        fade = [1, 1, 1, 0.85, 0.6, 0.35]
        layers.append((P.shape(f"Wave {k+1} Trail", "Donut", BRICK, trail, inner=0.1), win(f0, [f * 0.8 for f in fade])))
        layers.append((P.shape(f"Wave {k+1} Lead", "Donut", RED, lead, inner=0.14), win(f0, fade)))
    pop = P.shape("Bellow Pop", "Ellipse", CREAM, [(0, C, CY, 5, 3.5), (1, C, CY, 3, 2), (2, C, CY, 0.01, 0.01)])
    layers.append((pop, None))
    P.finish(P.stack(layers), "Chorubble_Wave_Out", anchor=(C, CY),
             notes="Chorubble: outgoing sound wave (low damage). Play centered on Chorubble; follow with Chorubble_Wave_Back when it bounces back.")


def wave_back():  # 96x64, 9f @15. Brighter, thicker rings collapse inward and hit on the last frames.
    W, H, FR, C, CY = 96, 64, 9, 48, 32
    P = Project(W, H, FR, fps=15)
    layers = [(P.empty(), None)]
    radius = lambda t: 4 + 42 * (1 - (t / 5) ** 2)             # speeds up as it converges
    for k, f0 in enumerate([0, 1]):
        rise = [0.35, 0.6, 0.8, 1, 1, 1]
        ring = lambda dr: [(f0 + t, C, CY, radius(t) + dr, (radius(t) + dr) * 2 / 3) for t in range(6)]
        layers.append((P.shape(f"Echo {k+1} Outer", "Donut", RED, ring(8), inner=0.08), win(f0, [r * 0.6 for r in rise])))
        layers.append((P.shape(f"Echo {k+1} Mid", "Donut", CREAM, ring(4), inner=0.12), win(f0, rise)))
        layers.append((P.shape(f"Echo {k+1} Lead", "Donut", WHITE, ring(0), inner=0.22), win(f0, rise)))
    layers.append((P.shape("Impact Ring", "Donut", CREAM, [(6, C, CY, 7, 5), (7, C, CY, 12, 8), (8, C, CY, 15, 10)], inner=0.2), win(6, [1, 0.7, 0.35])))
    layers.append((P.shape("Impact Flash", "Ellipse", WHITE, [(6, C, CY, 9, 6), (7, C, CY, 6, 4), (8, C, CY, 2, 1.5)]), win(6, [1, 0.9, 0.6])))
    for k in range(6):
        ks = []
        for f, dist, s in [(6, 8, 1.5), (7, 13, 1.2), (8, 16, 0.6)]:
            x, y = polar(C, CY, dist, 30 + 60 * k, 2 / 3); ks.append((f, x, y, s, s))
        layers.append((P.shape(f"Impact Spark {k+1}", "Rectangle", CREAM if k % 2 else WHITE, ks), win(6, [1, 1, 0.8])))
    P.finish(P.stack(layers), "Chorubble_Wave_Back", anchor=(C, CY),
             notes="Chorubble: the echo bouncing back (higher damage). Rings collapse onto the anchor and hit on frames 6-8; apply the damage on frame 6.",
             extra_meta={"hit_frame": 6})


# ------------------------------------------------------------------ Ghosting: inky trail puddle
INK_PARTS = {  # frames, per-frame size scale, per-frame opacity, wisps on
    "Appear": (5, [0.2, 0.7, 1.15, 0.95, 1.0], [1] * 5, [False] * 5),
    "Loop":   (6, [1.0] * 6, [1.0] * 6, [True] * 6),
    "Fade":   (6, [1.0, 0.95, 0.85, 0.7, 0.5, 0.25], [1, 0.85, 0.7, 0.5, 0.3, 0.1], [True, True, True, False, False, False]),
}
LOBES = [(16, 13, 12, 7.5, 0.0), (7, 11, 4.5, 3.5, 1.5), (25, 14, 4.5, 3, 3.0), (19, 8, 4.5, 3, 4.5), (10, 16, 4, 2.5, 2.2)]


def ink(part):   # 32x24 @10. The game drops these along the player's path: Appear once, Loop while active, Fade once.
    W, H, CX, CY = 32, 24, 16, 12
    n, scale, opac, wisps_on = INK_PARTS[part]
    P = Project(W, H, n, fps=10)
    wob = lambda f, ph: 1 + (0.06 * math.sin(2 * math.pi * f / 6 + ph) if part == "Loop" else 0)
    ops = lambda base: [(f, round(base * opac[f], 3)) for f in range(n)]
    at = lambda x, y, f: (CX + (x - CX) * scale[f], CY + (y - CY) * scale[f])
    layers = [(P.empty(), None)]
    for k, (x, y, rx, ry, ph) in enumerate(LOBES):
        layers.append((P.shape(f"Ink Lobe {k+1}", "Ellipse", PLUM_D, [(f, *at(x, y, f), rx * scale[f] * wob(f, ph), ry * scale[f] / wob(f, ph)) for f in range(n)]), ops(1.0)))
    layers.append((P.shape("Ink Depth", "Ellipse", PLUM, [(f, *at(15, 12.5, f), 7.5 * scale[f] * wob(f, 1), 4 * scale[f]) for f in range(n)]), ops(1.0)))
    layers.append((P.shape("Ink Gloss", "Ellipse", PLUM_L, [(f, *at(11, 10, f), 2.5 * scale[f], 1.2 * scale[f]) for f in range(n)]), ops(1.0)))
    layers.append((P.shape("Ink Glint", "Rectangle", MAUVE, [(f, *at(10, 10, f), 0.6 * scale[f], 0.5 * scale[f]) for f in range(n)]), ops(1.0)))
    if part == "Appear":   # splash droplets thrown out as it lands
        for k, ang in enumerate([20, 160, 250, 300]):
            ks = []
            for f, dist, s in [(0, 3, 1.5), (1, 9, 1.5), (2, 13, 1.0), (3, 14, 0.6), (4, 14, 0.01)]:
                x, y = polar(CX, CY, dist, ang, 2 / 3); ks.append((f, x, y, s, s))
            layers.append((P.shape(f"Splash {k+1}", "Ellipse", PLUM_D, ks), None))
    for k, (x0, ph, r0) in enumerate([(9, 0, 1.8), (18, 2, 2.2), (24, 4, 1.6)]):   # smoky scraps rising off the ink
        ks = []
        for f in range(n):
            t = ((f + ph) % 6) / 6
            r = (r0 * (1 - t) + 0.4) if wisps_on[f] else 0.01
            ks.append((f, x0 + math.sin(t * 6.28) * 1.2, 11 - t * 10, r, r))
        layers.append((P.shape(f"Wisp {k+1}", "Ellipse", MAUVE if k != 1 else PLUM_L, ks), ops(0.7)))
    name = f"Ghosting_Ink_{part}"
    P.finish(P.stack(layers), name, loop=(part == "Loop"), anchor=(CX, CY),
             notes=f"Ghosting ink puddle, {part.lower()} part. Drop one every few steps behind the player; slow enemies standing on it. Appear -> Loop while active -> Fade.")


# ------------------------------------------------------------------ Hushwisp: music note burst
def noteburst():   # 32x32, 6f @20. Plays where a Hushwisp_Note popped.
    P = Project(32, 32, 6, fps=20); C = 16
    layers = [(P.empty(), None)]
    layers.append((P.shape("Pop Ring", "Donut", LAV, [(f, C, C, r, r) for f, r in enumerate([4, 8, 11, 13, 14])], inner=0.2), win(0, [1, 1, 0.8, 0.5, 0.3])))
    layers.append((P.shape("Pop Core", "Ellipse", CREAM, [(f, C, C, r, r) for f, r in enumerate([5, 4, 2, 0.01])]), None))
    layers.append((P.shape("Pop Center", "Ellipse", WHITE, [(f, C, C, r, r) for f, r in enumerate([3, 2, 0.01])]), None))
    for k in range(6):
        ks = []
        for f, dist, s in zip(range(6), [5, 9, 12, 14, 15, 15], [1.5, 1.5, 1.0, 0.8, 0.5, 0.01]):
            x, y = polar(C, C, dist, 90 + 60 * k); ks.append((f, x, y, s, s))
        layers.append((P.shape(f"Spark {k+1}", "Rectangle", [CREAM, ROSE, WHITE][k % 3], ks), None))
    P.finish(P.stack(layers), "Hushwisp_Note_Burst", anchor=(C, C),
             notes="Hushwisp: soft lavender pop when a music note touches an enemy or times out (3 s).")


# ------------------------------------------------------------------ Glazel: lipstick smear
SMEAR_X0, SMEAR_X1, SMEAR_HH = 6, 42, 4


def smear_layers(P, cy, front, scale, opac, gloss_x=None):
    """The lipstick stroke on the ground: rounded red band with a pink top edge, dark bottom edge and a white gloss streak.
    front[f] = x of the stroke's leading end; scale[f] = thickness scale; opac[f] = opacity."""
    n = len(front); X0 = SMEAR_X0
    band = lambda dy, hh, pad=0: [(f, (X0 + pad + front[f] - pad) / 2, cy + dy * scale[f], max(0.01, (front[f] - X0 - 2 * pad) / 2), max(0.01, hh * scale[f])) for f in range(n)]
    ops = lambda base: [(f, round(base * opac[f], 3)) for f in range(n)]
    L = []
    L.append((P.shape("Smear Start Cap", "Ellipse", RED, [(f, X0, cy, 3 * scale[f], SMEAR_HH * scale[f]) for f in range(n)]), ops(1)))
    L.append((P.shape("Smear End Cap", "Ellipse", RED, [(f, front[f], cy, 3 * scale[f], SMEAR_HH * scale[f]) for f in range(n)]), ops(1)))
    L.append((P.shape("Smear Band", "Rectangle", RED, band(0, SMEAR_HH)), ops(1)))
    L.append((P.shape("Smear Shade", "Rectangle", WINE, band(3, 1, 2)), ops(1)))
    L.append((P.shape("Smear Top Edge", "Rectangle", PINK, band(-2.5, 1, 1)), ops(1)))
    if gloss_x is None:
        L.append((P.shape("Smear Gloss", "Rectangle", WHITE, band(-2, 0.5, 5)), ops(0.8)))
    else:  # a short gloss glint travelling along the stroke
        L.append((P.shape("Smear Gloss", "Rectangle", WHITE, [(f, gloss_x[f], cy - 2 * scale[f], 3, 0.5 * scale[f]) for f in range(n)]), ops(0.9)))
    return L


def lipstick_swipe():   # 48x32, 8f @15: a lipstick sweeps left to right drawing the smear, then pops away
    W, H, FR, CY = 48, 32, 8, 20
    P = Project(W, H, FR, fps=15)
    front = [SMEAR_X0 + (SMEAR_X1 - SMEAR_X0) * min(f, 5) / 5 for f in range(FR)]
    layers = [(P.empty(), None)] + smear_layers(P, CY, front, [1] * FR, [1] * FR)
    TILT = 35                                            # leans back against the stroke (counter-clockwise)
    ax, ay = -math.sin(math.radians(TILT)), -math.cos(math.radians(TILT))   # from the tip up along the tube
    lift = [0, 0, 0, 0, 0, 0, -3, -6]
    def part(name, col, along, hw, hh):
        ks = [(f, front[f] + ax * along, CY - 3 + lift[f] + ay * along, hw, hh) for f in range(7)] + [(7, front[7] + ax * along, CY - 9 + ay * along, 0.01, 0.01)]
        return (P.shape(name, "Rectangle", col, ks, rotation=TILT), None)
    layers += [part("Lipstick Bullet", RED, 3, 2, 3), part("Lipstick Bullet Shine", PINK, 3, 0.7, 2.5),
               part("Lipstick Collar", GOLD_L, 7, 2.8, 1), part("Lipstick Case", GOLD, 11, 2.8, 4), part("Lipstick Case Shine", GOLD_L, 11, 0.8, 3.5)]
    layers.append((P.shape("Pop Sparkle", "Star", WHITE, [(0, 40, 8, 0.01, 0.01), (5, 40, 8, 0.01, 0.01), (6, 40, 8, 4, 4), (7, 40, 7, 2, 2)], inner=0.3, sides=4), None))
    P.finish(P.stack(layers), "Glazel_Lipstick_Swipe", anchor=(24, CY),
             notes="Glazel: a lipstick draws the smear left to right (frames 0-5) and pops away. Then switch to Glazel_Smear_Loop (same anchor) for the rest of the 1 s, then Glazel_Smear_Fade.")


def smear_loop():   # 48x32, 6f @10, loop: finished smear with a gloss glint sliding along it
    W, H, FR, CY = 48, 32, 6, 20
    P = Project(W, H, FR, fps=10)
    gloss = [SMEAR_X0 + 4 + (SMEAR_X1 - SMEAR_X0 - 8) * f / 5 for f in range(FR)]
    layers = [(P.empty(), None)] + smear_layers(P, CY, [SMEAR_X1] * FR, [1] * FR, [1] * FR, gloss_x=gloss)
    P.finish(P.stack(layers), "Glazel_Smear_Loop", loop=True, anchor=(24, CY),
             notes="Glazel smear on the ground (speed boost for the player, slow for enemies). Same frame size and anchor as the swipe.")


def smear_fade():   # 48x32, 5f @10: the smear thins out and fades
    W, H, FR, CY = 48, 32, 5, 20
    P = Project(W, H, FR, fps=10)
    layers = [(P.empty(), None)] + smear_layers(P, CY, [SMEAR_X1] * FR, [1, 0.85, 0.65, 0.45, 0.25], [1, 0.8, 0.6, 0.4, 0.2])
    P.finish(P.stack(layers), "Glazel_Smear_Fade", anchor=(24, CY), notes="Glazel smear fading out. Same frame size and anchor as the swipe.")


if __name__ == "__main__":
    fns = dict(flame=[flame], wave=[wave_out, wave_back], ink=[lambda p=p: ink(p) for p in INK_PARTS],
               noteburst=[noteburst], lipstick=[lipstick_swipe, smear_loop, smear_fade])
    for w in (sys.argv[1:] or list(fns)):
        for fn in fns[w]:
            fn()
