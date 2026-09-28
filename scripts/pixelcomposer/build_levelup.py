"""7. LevelUp_Aura: flame-shaped power-up aura hugging a 16x16 player. 32x48 frames, anchor = feet (16, 47).
Three parts x two layers (Back = behind the player sprite, Front = in front):
  Ignite 5f (flares up from nothing) · Loop 6f @15 (seamless) · Fade 5f
Gold into white-hot at the core; tongues lick upward, fast vertical speed lines and sparks rise off the top.
The front layer stays at the edges so it never covers the player's face.
Run: python3 build_levelup.py [ignite] [loop] [fade]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fxlib import Project

W, H, CX, FEET = 32, 48, 16, 47
WHITE, CREAM, GOLD_L, GOLD, GOLD_D = "#ffffff", "#ffe6d1", "#f7b750", "#d1952e", "#a87c25"

PARTS = {  # frames, per-frame intensity (size scale), per-frame opacity scale, lines/sparks active
    "Ignite": (5, [0.15, 0.4, 0.7, 0.95, 1.1], [0.5, 0.8, 1, 1, 1], [False, False, True, True, True]),
    "Loop":   (6, [1.0] * 6, [1.0] * 6, [True] * 6),
    "Fade":   (5, [1.0, 0.8, 0.55, 0.3, 0.05], [1, 0.8, 0.55, 0.3, 0.05], [True, True, False, False, False]),
}
TONGUES = [(-9, 6, 0.0), (-5, 9, 1.7), (0, 11, 3.4), (5, 9, 5.1), (9, 6, 0.9)]   # (x offset, base height, phase)


def flick(f, n, phase):
    return 1 + 0.22 * math.sin(2 * math.pi * f / n + phase)        # seamless over a loop of n frames


def build(part, layer):
    n, inten, opac, fx_on = PARTS[part]
    P = Project(W, H, n, fps=15)
    layers = [(P.empty(), None)]
    ops = lambda base: [(f, round(base * opac[f], 3)) for f in range(n)]
    if layer == "Back":
        # ground glow under the feet, outer flame body, tongues, white-hot core
        layers.append((P.shape("Ground Glow", "Ellipse", GOLD, [(f, CX, FEET - 1, 10 * inten[f], 3 * inten[f]) for f in range(n)]), ops(0.5)))
        layers.append((P.shape("Flame Body", "Ellipse", GOLD, [(f, CX, FEET - 13 * inten[f], 11 * inten[f], 14 * inten[f]) for f in range(n)]), ops(0.55)))
        for k, (dx, hgt, ph) in enumerate(TONGUES):
            ks = []
            for f in range(n):
                h = hgt * flick(f, 6, ph) * inten[f]
                ks.append((f, CX + dx * min(1, inten[f]), FEET - 24 * inten[f] - h * 0.5, 2.2 * inten[f], h))
            layers.append((P.shape(f"Tongue {k+1}", "Ellipse", GOLD_L, ks), ops(0.75)))
        layers.append((P.shape("Hot Core", "Ellipse", CREAM, [(f, CX, FEET - 10 * inten[f], 6.5 * inten[f], 10 * inten[f] * flick(f, 6, 2.0)) for f in range(n)]), ops(0.6)))
    else:
        # side tongues at hip height, speed lines up the flanks, sparks above the head
        for k, dx in enumerate([-12, 12]):
            ks = [(f, CX + dx * min(1, inten[f]), FEET - 9, 2 * inten[f], 6 * inten[f] * flick(f, 6, k * 3.1)) for f in range(n)]
            layers.append((P.shape(f"Side Tongue {k+1}", "Ellipse", GOLD_L, ks), ops(0.85)))
        for k, (dx, ph) in enumerate([(-13, 0), (-8, 3), (8, 1), (13, 4)]):
            ks = []
            for f in range(n):
                t = ((f + ph) % 3) / 3                                   # rises fast, repeats every 3 frames
                y = FEET - 4 - t * 38
                on = fx_on[f] and t < 0.9
                ks.append((f, CX + dx, y, 0.5 if on else 0.01, (3 + 2 * (k % 2)) if on else 0.01))
            layers.append((P.shape(f"Speed Line {k+1}", "Rectangle", WHITE, ks), ops(0.9)))
        for k, (dx, ph, r) in enumerate([(-4, 0, 1.8), (3, 2, 1.5), (0, 4, 2.0)]):
            ks = []
            for f in range(n):
                t = ((f + ph) % 6) / 6
                on = fx_on[f]
                ks.append((f, CX + dx + math.sin(t * 6.28) * 1.5, FEET - 30 - t * 14, (r * (1 - t)) if on else 0.01, (r * (1 - t)) if on else 0.01))
            layers.append((P.shape(f"Spark {k+1}", "Star", WHITE if k != 1 else CREAM, ks, inner=0.35, sides=4), None))
    name = f"LevelUp_Aura_{part}_{layer}"
    P.finish(P.stack(layers), name, loop=(part == "Loop"), anchor=(CX, FEET),
             notes=f"{part} ({layer.lower()} layer): draw the Back strip behind the player sprite and the Front strip in front, same anchor (feet).")


if __name__ == "__main__":
    for part in (sys.argv[1:] or ["ignite", "loop", "fade"]):
        for layer in ("Back", "Front"):
            build(part.capitalize(), layer)
