"""Capture ring set (Toasted40, 3:2 ground ellipse):
  Capture_Ring  - idle crest, soft glint loop
  Capture_Fill  - 17 frames, 0%..100% fill from the center out; the game picks round(progress/2.5*16)
  Capture_Burst - one-shot: crest flashes, light column shoots up, sparkles rise
Run: python3 build_capture.py [ring] [fill] [burst]"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fxlib import Project, show

SQ = 2 / 3          # ground squash (3:2)
R_OUT, R_IN = 22, 13  # outer / inner ring half-widths (px)
# Toasted40
INK, STONE_D, STONE, STONE_L, PALE = "#392f36", "#53414f", "#7f6462", "#aa9395", "#c2b5c4"
GOLD_D, GOLD, GOLD_L, AMBER, CREAM, WHITE = "#a87c25", "#d1952e", "#f7b750", "#f6cba7", "#f6cba7", "#ffe6d1"


def crest(P, cx, cy, ring, inner, center, points, tag="", ring_op=None, parts_op=None):
    """The seal: outer ring, inner ring, center diamond, 4 points on the outer ring. Returns layer list."""
    e = lambda rx: (0, cx, cy, rx, rx * SQ)
    L = [
        (P.shape(f"{tag}Outer Ring", "Donut", ring, [e(R_OUT)], inner=0.12), ring_op),
        (P.shape(f"{tag}Inner Ring", "Donut", inner, [e(R_IN)], inner=0.14), parts_op),
        (P.shape(f"{tag}Center Diamond", "Regular Polygon", center, [(0, cx, cy, 5, 5 * SQ + 0.6)], sides=4), parts_op),
    ]
    for k, (dx, dy) in enumerate([(0, -R_OUT * SQ), (R_OUT, 0), (0, R_OUT * SQ), (-R_OUT, 0)]):
        L.append((P.shape(f"{tag}Point {k+1}", "Regular Polygon", points, [(0, cx + dx, cy + dy, 2.4, 2.4 * SQ + 0.4)], sides=4), parts_op))
    return L


def ring():
    P = Project(48, 32, 12); cx, cy = 24, 16
    layers = crest(P, cx, cy, STONE_D, STONE_D, STONE, STONE)
    glint = [(f, 0.55 * (0.5 - 0.5 * __import__("math").cos(2 * 3.14159 * f / 12))) for f in range(12)]
    layers.append((P.shape("Glint", "Donut", STONE_L, [(0, cx, cy, R_OUT, R_OUT * SQ)], inner=0.12), glint))
    P.finish(P.stack(layers), "Capture_Ring", loop=True, anchor=(cx, cy),
             notes="idle capture crest; faint glint pulse on the outer ring; 0.8 s loop")


def fill():
    STEPS = 16; P = Project(48, 32, STEPS + 1); cx, cy = 24, 16
    layers = crest(P, cx, cy, STONE_D, STONE_D, STONE, STONE)
    # gold glow spreading from the center; frame f = f/16 progress
    grow = [(f, cx, cy, R_OUT * f / STEPS + (0.01 if f == 0 else 0), (R_OUT * f / STEPS) * SQ) for f in range(STEPS + 1)]
    layers.append((P.shape("Gold Glow", "Ellipse", GOLD, grow), [(0, 0.0), (1, 0.35), (STEPS, 0.35)]))
    # parts light up as the glow passes them
    at = lambda pct: round(pct * STEPS)
    lit = [("Center Diamond", "Regular Polygon", WHITE, (0, cx, cy, 5, 5 * SQ + 0.6), at(0.15), dict(sides=4)),
           ("Inner Ring", "Donut", GOLD_L, (0, cx, cy, R_IN, R_IN * SQ), at(0.45), dict(inner=0.14))]
    for k, (dx, dy) in enumerate([(0, -R_OUT * SQ), (R_OUT, 0), (0, R_OUT * SQ), (-R_OUT, 0)]):
        lit.append((f"Point {k+1}", "Regular Polygon", GOLD_L, (0, cx + dx, cy + dy, 2.4, 2.4 * SQ + 0.4), at(0.70), dict(sides=4)))
    lit.append(("Outer Ring", "Donut", GOLD, (0, cx, cy, R_OUT, R_OUT * SQ), at(0.95), dict(inner=0.12)))
    for name, kind, col, k0, on, kw in lit:
        layers.append((P.shape("Lit " + name, kind, col, [k0], **kw), show(on)))
    # bright leading edge of the fill (hidden at 0% and once full)
    edge = [(f, cx, cy, max(0.01, R_OUT * f / STEPS), max(0.01, R_OUT * f / STEPS) * SQ) for f in range(STEPS + 1)]
    layers.append((P.shape("Fill Edge", "Donut", AMBER, edge, inner=0.2), [(0, 0.0), (1, 0.8), (STEPS - 1, 0.8), (STEPS, 0.0)]))
    P.finish(P.stack(layers), "Capture_Fill", loop=False, anchor=(cx, cy),
             notes="progress frames, not a timed animation: show frame round(progress / captureSeconds * 16). Frame 0 = empty, 16 = full.",
             extra_meta={"indexed_by": "capture progress", "frame_for_progress": "round(progress / 2.5 * 16)"})


def burst():
    import math
    P = Project(48, 96, 12); cx, cy = 24, 80
    # ground glow at the base of the column (bottom layer; size 0 when hidden)
    base = P.shape("Base Glow", "Ellipse", WHITE,
                   [(0, cx, cy, 12, 8), (2, cx, cy, 14, 9), (4, cx, cy, 8, 5), (5, cx, cy, 0.01, 0.01)])
    layers = [(base, None)]
    fade = [(0, 1.0), (6, 1.0), (9, 0.0)]
    layers += crest(P, cx, cy, GOLD, GOLD_L, WHITE, GOLD_L, tag="Lit ", ring_op=fade, parts_op=fade)
    # ring flare: warm-white ring expanding off the crest
    flare = [(0, cx, cy, R_OUT, R_OUT * SQ), (3, cx, cy, R_OUT + 2, (R_OUT + 2) * SQ)]
    layers.append((P.shape("Ring Flare", "Donut", WHITE, flare, inner=0.18), [(0, 1.0), (2, 0.8), (3, 0.0)]))
    # light column: gold sheath + warm-white core, grows up then thins
    def col(width_scale):
        k = []
        for f, top, w in [(0, cy, 2), (1, 48, 4), (2, 14, 6), (3, 2, 7), (5, 2, 6), (7, 2, 4), (9, 2, 2), (10, 2, 0.01)]:
            k.append((f, cx, (cy + top) / 2, max(0.01, w * width_scale), max(0.01, (cy - top) / 2)))
        return k
    layers.append((P.shape("Column Sheath", "Rectangle", GOLD_L, col(1.0)), [(0, 0.75), (9, 0.75), (10, 0.0)]))
    layers.append((P.shape("Column Core", "Rectangle", WHITE, col(0.45)), [(0, 1.0), (9, 1.0), (10, 0.0)]))
    # sparkles rising up the column
    for k, (dx, f0, r, colr) in enumerate([(-5, 1, 2.2, WHITE), (6, 2, 1.8, GOLD_L), (-3, 3, 2.0, WHITE), (4, 4, 1.6, AMBER), (0, 5, 2.2, WHITE)]):
        ks = [(0, cx + dx, cy - 6, 0.01, 0.01), (f0 - 1, cx + dx, cy - 6, 0.01, 0.01)]
        for t, (dy, rr) in enumerate([(-6, r * 0.6), (-20, r), (-34, r), (-46, r * 0.6), (-54, 0.01)]):
            ks.append((f0 + t, cx + dx, cy + dy, rr, rr))
        layers.append((P.shape(f"Sparkle {k+1}", "Star", colr, [x for x in ks if x[0] <= 11], inner=0.35, sides=4), None))
    P.finish(P.stack(layers), "Capture_Burst", loop=False, anchor=(cx, cy),
             notes="capture moment: crest flashes, light column shoots up, sparkles rise; anchor = ring center on the ground (same point as Capture_Ring/Fill)")


if __name__ == "__main__":
    for w in (sys.argv[1:] or ["ring", "fill", "burst"]):
        {"ring": ring, "fill": fill, "burst": burst}[w]()
