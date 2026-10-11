"""Procedural-texture effects: noise is scrolled, masked and only coloured at the end (technique from the
Portal-Cream sample). Saved under new names next to the shape-built versions so the two can be compared.
Run: python3 build_procedural.py [firepool]"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fxlib import Project

EMBER_D, FIRE_D, FIRE, GOLD, CREAM = "#84333e", "#cf6631", "#e17e53", "#f7b750", "#ffe6d1"


def firepool():  # 48x32, 8f @10, loop: same size, anchor and visible width as Fire_Pool_Loop
    P = Project(48, 32, 8, fps=10); FR = P.FR
    # Two tiling noises. Each scrolls exactly one tile per loop, so frame 8 == frame 0 (seamless).
    a = P.noise("Flame Noise", scale=(0.3, 0.3), iters=3, seed=11, level_in=(0.2, 0.85))
    a = P.offset(a, "Rise", [(0, 0)], [(0, 0), (FR, -1)])
    b = P.noise("Flicker Noise", scale=(0.5, 0.5), iters=2, seed=23, level_in=(0.2, 0.85))
    b = P.offset(b, "Drift", [(0, 0), (FR, 1)], [(0, 0)])
    tex = P.blend(a, b, opacity=[(0, 0.5)])                                  # average of the two
    mask = P.gradient("Pool Mask", [(0, "#ffffff", 1), (0.6, "#c0c0c0", 1), (1, "#000000", 1)],
                      radius=0.46, center=(0.5, 0.52))                       # 3:2 ellipse, hottest in the middle
    heat = P.blend(tex, mask, mode=3)                                        # Multiply: noise inside the pool only
    heat = P.dither(heat, "Dither", steps=6)
    out = P.colorize(heat, "Fire Ramp", [(0.1, None), (0.3, EMBER_D), (0.5, FIRE_D), (0.7, FIRE), (0.9, GOLD), (1, CREAM)])
    P.finish(out, "Fire_Pool_Loop_Noise", loop=True, anchor=(24, 18),
             notes="procedural test of Fire_Pool_Loop: scrolling noise in a 3:2 mask, dithered, colour mapped last.",
             extra_meta={"visible_w": 40, "visible_note": "scale = 2r / 40"})


if __name__ == "__main__":
    for arg in sys.argv[1:] or ["firepool"]:
        globals()[arg]()
