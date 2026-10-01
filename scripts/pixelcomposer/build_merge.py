"""Evolution merge effects (Pixel Composer, Toasted40 + white). Shared by all four evolutions.
White effects (core, reveal, ring) are tinted in code with the result's element colour; the slot glow is gold and the
discovery ring purple. Merge_Trail (8x8) stays hand-drawn in build_fillers.py: too small for Pixel Composer shapes.
Sizes, frame counts and anchors match the placeholders, so the game needs no code change after export.
Run: python3 build_merge.py [core] [reveal] [ring] [slot] [discovered]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fxlib import Project, anim

WHITE, CREAM, GOLD_L, GOLD, RARE, RARE_L = "#ffffff", "#ffe6d1", "#f7b750", "#d1952e", "#8973ab", "#c2b5c4"
const = lambda op: [(0, op)]
T = 0.01   # "invisible" half-size


def polar(cx, cy, dist, ang_deg):
    a = math.radians(ang_deg)
    return cx + dist * math.cos(a), cy - dist * math.sin(a)


def core():   # 32x32, 6f @24 (250ms), once: four motes pull in, a cocoon swells, pinches and flares to hide the swap
    P = Project(32, 32, 6, fps=24); C = 16
    shell = P.shape("Cocoon", "Ellipse", WHITE, [(0, C, C, 3, 3), (1, C, C, 6, 6), (2, C, C, 9, 9), (3, C, C, 7, 7), (4, C, C, 10, 10), (5, C, C, 13, 13)])
    rim = P.shape("Cocoon Rim", "Donut", WHITE, [(0, C, C, 4, 4), (1, C, C, 7, 7), (2, C, C, 10, 10), (3, C, C, 8, 8), (4, C, C, 12, 12), (5, C, C, 15, 15)], inner=0.14)
    heart = P.shape("Core", "Ellipse", WHITE, [(0, C, C, T, T), (1, C, C, 2, 2), (2, C, C, 4, 4), (3, C, C, 5, 5), (4, C, C, 3, 3), (5, C, C, T, T)])
    layers = [(P.empty(), None), (shell, [(0, 0.45), (2, 0.55), (4, 0.4), (5, 0.15)]), (rim, [(0, 0.9), (3, 1.0), (4, 0.7), (5, 0.3)]), (heart, None)]
    for k, ang in enumerate([45, 135, 225, 315]):   # motes drawn inward on frames 0-2
        ks = []
        for f, dist, s in [(0, 14, 1.0), (1, 10, 1.0), (2, 6, 0.75), (3, 4, T)]:
            x, y = polar(C, C, dist, ang); ks.append((f, x, y, s, s))
        layers.append((P.shape(f"Mote {k+1}", "Rectangle", WHITE, ks), None))
    P.finish(P.stack(layers), "Merge_Core", anchor=(C, C), notes="white cocoon pulse that hides the swap; local, never full-screen. Tinted with the result element in code.")


def reveal():  # 48x48, 8f @24 (333ms), once: a single burst as the result appears; rays out, sparks out, ring out
    P = Project(48, 48, 8, fps=24); C = 24
    flash = P.shape("Flash", "Ellipse", WHITE, [(0, C, C, 6, 6), (1, C, C, 9, 9), (2, C, C, 7, 7), (3, C, C, T, T)])
    ring = P.shape("Ring", "Donut", WHITE, [(0, C, C, 6, 6), (2, C, C, 12, 12), (4, C, C, 17, 17), (6, C, C, 20, 20), (7, C, C, 21, 21)], inner=0.12)
    layers = [(P.empty(), None), (flash, None), (ring, [(0, 1.0), (4, 0.8), (6, 0.4), (7, 0.15)])]
    steps = [(0, 4, 3.0, 1.0), (1, 7, 5.0, 1.0), (2, 10, 5.5, 1.0), (3, 13, 5.0, 0.75), (4, 15, 4.0, 0.75), (5, 17, 3.0, 0.5), (6, 19, 1.5, 0.5), (7, 20, T, T)]
    for k, ang in enumerate([90, 0, 270, 180]):   # long orthogonal rays (frame, inner dist, half-length, half-width)
        vert = ang in (90, 270); ks = []
        for f, dist, hl, hw in steps:
            x, y = polar(C, C, dist + hl, ang); ks.append((f, x, y, hw if vert else hl, hl if vert else hw))
        layers.append((P.shape(f"Ray {k+1}", "Rectangle", WHITE, ks), None))
    for k, ang in enumerate([45, 135, 225, 315]):  # square sparks on the diagonals, a frame behind the rays
        ks = [(0, C, C, T, T)]
        for f, dist, s in [(1, 6, 1.5), (2, 9, 1.5), (3, 12, 1.25), (4, 14, 1.0), (5, 16, 0.75), (6, 17, T)]:
            x, y = polar(C, C, dist, ang); ks.append((f, x, y, s, s))
        layers.append((P.shape(f"Spark {k+1}", "Rectangle", CREAM if k % 2 else WHITE, ks), None))
    P.finish(P.stack(layers), "Merge_Reveal", anchor=(C, C), notes="single burst as the result appears; white, tinted with the result element in code.")


def ring():    # 64x44 (3:2 ground ellipse), 8f @24, once: shockwave under the result, plus a fainter echo a frame behind
    P = Project(64, 44, 8, fps=24); CX, CY = 32, 22
    lead = [(f, CX, CY, rx, rx * 2 / 3) for f, rx in enumerate([6, 11, 16, 20, 24, 27, 29, 31])]
    echo = [(0, CX, CY, T, T)] + [(f, CX, CY, rx, rx * 2 / 3) for f, rx in enumerate([0, 4, 8, 12, 16, 19, 22, 24]) if f > 0]
    a = P.shape("Shockwave", "Donut", WHITE, lead, inner=0.16)
    b = P.shape("Echo", "Donut", WHITE, echo, inner=0.1)
    P.finish(P.stack([(P.empty(), None), (b, [(0, 0.5), (4, 0.4), (7, 0.1)]), (a, [(0, 1.0), (3, 1.0), (5, 0.6), (7, 0.2)])]), "Merge_Ring",
             anchor=(CX, CY), notes="3:2 ground shockwave under the result; draw below actors. White, tinted in code.")


def slot():    # 32x24 (2x over the 62x48 party slot), 6f @15, once: gold frame flares out a pixel and fades, white corner glints
    P = Project(32, 24, 6, fps=15); W, H = 32, 24
    def frame(name, col, inset):   # four edge bars at `inset` px from the border
        bars = [(W / 2, inset + 0.5, W / 2 - inset, 0.5), (W / 2, H - inset - 0.5, W / 2 - inset, 0.5),
                (inset + 0.5, H / 2, 0.5, H / 2 - inset), (W - inset - 0.5, H / 2, 0.5, H / 2 - inset)]
        return [P.shape(f"{name} {i+1}", "Rectangle", col, [(0, x, y, hw, hh)]) for i, (x, y, hw, hh) in enumerate(bars)]
    layers = [(P.empty(), None)]
    for n in frame("Inner Edge", GOLD, 1): layers.append((n, [(0, 0.5), (1, 0.8), (3, 0.5), (5, 0.0)]))
    for n in frame("Outer Edge", GOLD_L, 0): layers.append((n, [(0, 0.5), (1, 1.0), (2, 0.9), (3, 0.6), (4, 0.3), (5, 0.1)]))
    for k, (x, y) in enumerate([(1, 1), (W - 1, 1), (1, H - 1), (W - 1, H - 1)]):
        layers.append((P.shape(f"Glint {k+1}", "Star", WHITE, [(0, x, y, T, T), (1, x, y, 2.5, 2.5), (2, x, y, 1.5, 1.5), (3, x, y, T, T)], inner=0.3, sides=4), None))
    P.finish(P.stack(layers), "Evolved_Slot_Glow", anchor=(W // 2, H // 2), notes="gold glow around the party slot the evolution lands in (2x over 62x48).")


def discovered():  # 64x64, 8f @8, loop: rare-purple ring with six orbiting sparkles over faint counter-rotating rays
    P = Project(64, 64, 8, fps=8); C = 32
    rays = P.shape("Rays", "Star", RARE_L, [(0, C, C, 30, 30)], inner=0.2, sides=12)
    anim(rays["inputs"][19], [(f, -30 * f / 8) for f in range(8)])   # 12-point star repeats every 30 degrees: seamless loop
    halo = P.shape("Halo", "Donut", RARE, [(0, C, C, 28, 28)], inner=0.08)
    layers = [(P.empty(), None), (rays, const(0.18)), (halo, const(0.6))]
    # Six sparkles turn 60 degrees per loop, so frame 8 equals frame 0. Each is a cross of two 1px bars:
    # 4-point Star shapes this small vanish. Arms twinkle between 2.5 and 3.5px every other frame.
    for k in range(6):
        hk, vk = [], []
        for f in range(8):
            x, y = polar(C, C, 28, k * 60 + 60 * f / 8); arm = 3.5 if (f + k) % 2 == 0 else 2.5
            hk.append((f, x, y, arm, 0.5)); vk.append((f, x, y, 0.5, arm))
        layers.append((P.shape(f"Sparkle {k+1} H", "Rectangle", WHITE, hk), None))
        layers.append((P.shape(f"Sparkle {k+1} V", "Rectangle", WHITE, vk), None))
    P.finish(P.stack(layers), "Recipe_Discovered", loop=True, anchor=(C, C),
             notes="rotating sparkle ring behind the result portrait on the NEW EVOLUTION panel.")


if __name__ == "__main__":
    fns = dict(core=core, reveal=reveal, ring=ring, slot=slot, discovered=discovered)
    for w in (sys.argv[1:] or list(fns)):
        fns[w]()
