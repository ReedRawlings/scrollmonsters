"""Evolution upgrade icons (Phase C), pixel art built in Pixel Composer like the Castle/Tree samples:
flat shapes (no anti-aliasing), a hard 1px dark outline drawn OUTSIDE after the spin so every frame keeps a crisp edge,
and a final posterize to Toasted40 + white. One bold form per icon (16px leaves no room for detail).
16x16, 16 frames @12 fps, looping coin spin (horizontal squash), like the Tiny Dungeons upgrade icons.
Run: python3 build_icons.py [rush] [wake] [ink] [grip] [rhythm] [halo] [rally]"""
import sys, os, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fxlib import Project, template, anim

OUTLINE = "#1c080c"
WHITE, CREAM = "#ffffff", "#ffe6d1"
EMBER, FIRE, GOLD = "#cf6631", "#e17e53", "#f7b750"
INK_D, INK, INK_L, INK_S, JAR, CORK = "#53414f", "#8973ab", "#c28ead", "#c2b5c4", "#392f36", "#a57b73"
BUB_FILL = "#78949b"
N, C = 16, 8


def icon(build, name, notes):
    P = Project(16, 16, N, fps=12)
    art = P.stack([(P.empty(), None)] + [(n, None) for n in build(P)])
    # Coin spin: squash X by |cos|, never below ~2px so the outline never vanishes.
    t = P.add(template("transform_node.json"), "Spin", 384, 0); I = t["inputs"]; P.link(t, 0, art)
    I[3]["r"]["d"] = [0.5, 0.5]; I[4]["r"]["d"] = True; I[2]["r"]["d"] = [C, C]
    anim(I[6], [(f, [round(max(0.15, abs(math.cos(2 * math.pi * f / N))), 3), 1]) for f in range(N)])
    P.finish(t, name, outline=OUTLINE, loop=True, anchor=(C, C), notes=notes, extra_meta={"visible_w": 13})


def wake(P):   # Blazing Wake (Reptile): a wall of fire, three flames on an ember bar, the middle one tallest
    nodes = [P.shape("Ember Bar", "Rectangle", EMBER, [(0, C, 12.5, 5.5, 1.5)])]
    for k, (x, top) in enumerate([(4.5, 7), (8, 4), (11.5, 7)]):
        h = (12 - top) / 2
        nodes += [P.shape(f"Flame {k+1}", "Ellipse", FIRE, [(0, x, top + h, 2, h)]),
                  P.shape(f"Flame {k+1} Inner", "Ellipse", GOLD, [(0, x, top + h + 1.2, 1.2, h - 1.2)]),
                  P.shape(f"Flame {k+1} Core", "Rectangle", CREAM, [(0, x, 11, 0.5, 1)])]
    return nodes


def ink(P):    # Ink Flood (Octopus): a squat jar of ink with a cork
    return [P.shape("Jar", "Rectangle", JAR, [(0, C, 10, 4.5, 3.5)]),
            P.shape("Neck", "Rectangle", JAR, [(0, C, 5.5, 2.5, 1.5)]),
            P.shape("Ink", "Rectangle", INK, [(0, C, 11, 3.5, 2.5)]),
            P.shape("Ink Surface", "Rectangle", INK_L, [(0, C, 8.5, 3.5, 0.5)]),
            P.shape("Cork", "Rectangle", CORK, [(0, C, 3.5, 2, 1)]),
            P.shape("Glint", "Rectangle", INK_S, [(0, 5, 10.5, 0.5, 1.5)])]


def grip(P):   # Squeezing Grip (Octopus): one tentacle curling up and over, light sucker dots on its inner side
    segs = [(5, 12, 2.8, 2.4), (7.5, 9.5, 2.4, 2.2), (9.5, 6.5, 2.0, 1.9), (8.5, 3.8, 1.5, 1.4)]
    nodes = [P.shape(f"Tentacle {k+1}", "Ellipse", INK_L, [(0, x, y, rx, ry)]) for k, (x, y, rx, ry) in enumerate(segs)]
    nodes += [P.shape(f"Shade {k+1}", "Ellipse", INK, [(0, x + 0.8, y + 0.6, rx * 0.6, ry * 0.6)]) for k, (x, y, rx, ry) in enumerate(segs[:3])]
    nodes += [P.shape(f"Sucker {k+1}", "Rectangle", CREAM, [(0, x, y, 0.5, 0.5)]) for k, (x, y) in enumerate([(3.5, 11.5), (6, 9), (8, 6.5)])]
    return nodes


def bubble(P, name, x, y, r):
    return [P.shape(name + " Fill", "Ellipse", BUB_FILL, [(0, x, y, r, r)]),
            P.shape(name + " Rim", "Donut", WHITE, [(0, x, y, r, r)], inner=0.3 if r < 3 else 0.2),
            P.shape(name + " Shine", "Rectangle", WHITE, [(0, x - r * 0.4, y - r * 0.4, 0.5, 0.5)])]


def rhythm(P):  # Bubble Rhythm (Axolotl): three bubbles rising, each larger than the last
    return bubble(P, "Small", 4.5, 12, 1.8) + bubble(P, "Middle", 7.5, 8.5, 2.5) + bubble(P, "Large", 10.5, 4.5, 3.2)


def halo(P):   # Ink Halo (Axolotl): a flat purple ring seen at an angle, lit along its top edge
    return [P.shape("Halo", "Donut", INK, [(0, C, 8.5, 6, 3)], inner=0.35),
            P.shape("Halo Light", "Rectangle", INK_S, [(0, C, 5.8, 3, 0.5)]),
            P.shape("Halo Shade", "Rectangle", INK_D, [(0, C, 11.2, 3.5, 0.5)])]


def rally(P):  # Bubble Rally (Axolotl): one bubble with a gold up-chevron inside (a burst of attack speed)
    nodes = bubble(P, "Bubble", C, C, 5.5)
    nodes += [P.shape("Chevron Left", "Rectangle", GOLD, [(0, 6.6, 8.6, 2.2, 0.8)], rotation=45),
              P.shape("Chevron Right", "Rectangle", GOLD, [(0, 9.4, 8.6, 2.2, 0.8)], rotation=-45)]
    return nodes


def rush(P):   # Double Charge (Reptile): two fiery chevrons pointing forward (right), the back one dimmer
    nodes = []
    for k, (x, col) in enumerate([(5.5, EMBER), (10, FIRE)]):
        nodes += [P.shape(f"Chevron {k+1} Top", "Rectangle", col, [(0, x, 6, 2.6, 1.1)], rotation=-45),
                  P.shape(f"Chevron {k+1} Bottom", "Rectangle", col, [(0, x, 10, 2.6, 1.1)], rotation=45)]
    nodes.append(P.shape("Front Glint", "Rectangle", GOLD, [(0, 11.5, 8, 0.5, 0.5)]))
    return nodes


ICONS = {
    "rush": (rush, "Icon_Double_Charge", "Reptile Double Charge: two chevrons pointing right (check they point RIGHT, >>)."),
    "wake": (wake, "Icon_Blazing_Wake", "Reptile Blazing Wake: a wall of fire."),
    "ink": (ink, "Icon_Ink_Flood", "Octopus Ink Flood: a jar of ink."),
    "grip": (grip, "Icon_Squeezing_Grip", "Octopus Squeezing Grip: a curling tentacle."),
    "rhythm": (rhythm, "Icon_Bubble_Rhythm", "Axolotl Bubble Rhythm: three rising bubbles."),
    "halo": (halo, "Icon_Ink_Halo", "Axolotl Ink Halo: a flat purple ring."),
    "rally": (rally, "Icon_Bubble_Rally", "Axolotl Bubble Rally: a bubble with a gold up-chevron (check it points UP)."),
}

if __name__ == "__main__":
    for w in (sys.argv[1:] or list(ICONS)):
        fn, name, notes = ICONS[w]
        icon(fn, name, notes + " 16-frame coin spin, like the other upgrade icons.")
