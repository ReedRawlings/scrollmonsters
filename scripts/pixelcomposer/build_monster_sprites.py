"""Hand-placed pixel pieces for monster attacks (too small or too hard-edged for Pixel Composer shapes).
Writes PNG strips + JSON straight into assets/fx/sheets/ (no .pxc). Palette: Toasted40 + pure white.
Run: python3 build_monster_sprites.py [tongue] [pierce] [anger] [notes] [steps] [bite]"""
import json, os, sys, math
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SHEETS = os.path.abspath(os.path.join(HERE, "..", "..", "assets", "fx", "sheets")) + "/"

def c(hx, a=255): return tuple(int(hx[i:i + 2], 16) for i in (1, 3, 5)) + (a,)
CLEAR = (0, 0, 0, 0)
INK, WHITE, CREAM, PEACH = c("#1c080c"), c("#ffffff"), c("#ffe6d1"), c("#f6cba7")
PINK, ROSE_D, TONGUE_D, GROOVE = c("#d46e76"), c("#9a4e66"), c("#84333e"), c("#a56456")
GOLD_L, GOLD, GOLD_D, GOLD_K = c("#f7b750"), c("#d1952e"), c("#a87c25"), c("#866123")
RED, CORAL, EMBER, MAROON, MAROON_K = c("#cd5151"), c("#e17e53"), c("#bd553d"), c("#5f2525"), c("#4c1a12")
BRICK, WINE = c("#b74037"), c("#84333e")
PURPLE, LAV, DUST, CLAY = c("#8973ab"), c("#c2b5c4"), c("#ac8a62"), c("#6d3a36")


def meta(name, w, h, frames, fps, loop, anchor, notes, **extra):
    m = {"image": name + ".png", "frame_width": w, "frame_height": h, "frame_count": frames,
         "layout": "horizontal strip, no spacing", "fps": fps, "duration_s": round(frames / fps, 3) if fps else None,
         "loop": loop, "anchor": {"x": anchor[0], "y": anchor[1], "from": "top-left of each frame"},
         "palette": "Toasted40 + white", "notes": notes, "smoothing": "none (nearest neighbor)"}
    m.update(extra)
    json.dump(m, open(SHEETS + name + ".json", "w"), indent=2)


def save(frames, name):
    w, h = frames[0].size
    out = Image.new("RGBA", (w * len(frames), h), CLEAR)
    for i, f in enumerate(frames): out.paste(f, (i * w, 0))
    out.save(SHEETS + name + ".png"); print(f"{name:24s} {w}x{h} x{len(frames)}")


def new(w, h):
    im = Image.new("RGBA", (w, h), CLEAR); return im, ImageDraw.Draw(im)


def outline(im, col=INK):
    """1px outline around every solid pixel (translucent dust and glows are left un-outlined)."""
    W, H = im.size; px = im.load()
    out = Image.new("RGBA", im.size, CLEAR); o = out.load()
    for y in range(H):
        for x in range(W):
            if px[x, y][3] == 0 and any(0 <= x + dx < W and 0 <= y + dy < H and px[x + dx, y + dy][3] > 200
                                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                o[x, y] = col
    out.alpha_composite(im); return out


def fade(im, k):
    if k >= 1: return im
    r, g, b, a = im.split(); return Image.merge("RGBA", (r, g, b, a.point(lambda v: int(v * k))))


# ------------------------------------------------------------------ Palimaw: tongue lash (tip + tileable middle + hit)
def tongue_band(d, x0, x1):
    """Tongue cross-section rows 4..11 (the outline adds rows 3 and 12)."""
    d.rectangle([x0, 4, x1, 4], fill=PEACH)
    d.rectangle([x0, 5, x1, 9], fill=PINK)
    d.rectangle([x0, 8, x1, 8], fill=GROOVE)
    d.rectangle([x0, 10, x1, 11], fill=ROSE_D)


def tongue():
    im, d = new(8, 16); tongue_band(d, 0, 7)
    save([outline(im)], "Palimaw_Tongue_Mid")
    meta("Palimaw_Tongue_Mid", 8, 16, 1, None, False, (0, 8),
         "Palimaw tongue middle, tiles horizontally. Stretch/repeat from Palimaw's mouth to the tip along the lash line (rotate to aim); "
         "the band sits on rows 3-12 so it lines up with Palimaw_Tongue_Tip.")
    frames = []
    for f in range(4):                                   # tip with the tongue's own sleepy second face; blinks on frame 3
        im, d = new(16, 16)
        tongue_band(d, 0, 6)
        top = 1 if f != 1 else 0                         # tiny squash/stretch
        d.ellipse([3, top, 14, 14], fill=PINK)
        d.ellipse([3, 10, 14, 14], fill=ROSE_D); d.ellipse([3, top, 14, 12], fill=PINK)
        d.arc([4, top + 1, 12, 11], 190, 260, fill=PEACH)
        if f == 3:
            d.line([(7, 6), (8, 6)], fill=INK); d.line([(11, 6), (12, 6)], fill=INK)
        else:
            d.line([(8, 5), (8, 6)], fill=INK); d.line([(11, 5), (11, 6)], fill=INK)
            d.point([(7, 5), (10, 5)], fill=TONGUE_D)    # heavy sleepy lids
        d.line([(9, 9), (10, 9)], fill=TONGUE_D); d.point([(8, 8), (11, 8)], fill=TONGUE_D)   # small smile
        frames.append(outline(im))
    save(frames, "Palimaw_Tongue_Tip")
    meta("Palimaw_Tongue_Tip", 16, 16, 4, 8, True, (0, 8),
         "Palimaw tongue tip with its second face (blinks). Anchor = left edge of the band; attach to the end of the Mid pieces and rotate with them.")
    frames = []
    for f in range(5):                                   # slobbery hit at the end of the lash
        im, d = new(16, 16); C = 8
        if f == 0: d.ellipse([C - 4, C - 3, C + 4, C + 3], fill=WHITE)
        if f == 1: d.ellipse([C - 5, C - 4, C + 5, C + 4], outline=PEACH); d.ellipse([C - 2, C - 2, C + 2, C + 2], fill=WHITE)
        for k in range(6):
            a = math.radians(30 + 60 * k); r = [2, 4, 6, 7, 7][f]
            x, y = C + r * math.cos(a), C + r * math.sin(a) * 0.8 + [0, 0, 0, 1, 2][f]
            col = [PINK, PEACH, PINK][k % 3]
            if f < 4: d.rectangle([x, y, x + (1 if f < 3 else 0), y + (1 if f < 3 else 0)], fill=col)
            else: d.point((x, y), fill=c("#d46e76", 140))
        frames.append(im)
    save(frames, "Palimaw_Tongue_Hit")
    meta("Palimaw_Tongue_Hit", 16, 16, 5, 20, False, (8, 8), "Palimaw: slobber splat where the tongue tip hits.")


# ------------------------------------------------------------------ Quibblet: triangular pierce
def pierce():
    W, H, F, GX, GY, R = 48, 48, 8, 24, 34, 15
    verts = [(GX + R * math.cos(math.radians(a)), GY - R * math.sin(math.radians(a)) * 2 / 3) for a in (90, 210, 330)]
    side_h = [0, 0, 14, 16, 13, 7, 2, 0]
    mid_h = [0, 0, 18, 21, 17, 9, 3, 0]
    frames = []
    for f in range(F):
        ground, g = new(W, H)
        if f <= 5:                                        # warning triangle on the ground, then cracks
            col = [c("#d1952e", 110), GOLD_L, GOLD_L, GOLD, GOLD, c("#d1952e", 120)][f]
            pts = [tuple(map(round, v)) for v in verts]
            if f == 0:
                for i in range(3):
                    (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % 3]
                    for s in range(0, 10, 2): g.line([(x0 + (x1 - x0) * s / 10, y0 + (y1 - y0) * s / 10), (x0 + (x1 - x0) * (s + 1) / 10, y0 + (y1 - y0) * (s + 1) / 10)], fill=col)
            else:
                g.polygon(pts, outline=col)
            if 2 <= f <= 5:
                for v in verts: g.line([(GX, GY), v], fill=GOLD_K)
        spikes, s = new(W, H)
        bases = sorted([(v, side_h[f], 3.5) for v in verts] + [((GX, GY), mid_h[f], 4.5)], key=lambda b: b[0][1])
        for (bx, by), h, w in bases:
            if h <= 0: continue
            bx, by = round(bx), round(by)
            s.polygon([(bx - w, by), (bx, by - h), (bx, by)], fill=GOLD)
            s.polygon([(bx, by - h), (bx + w, by), (bx, by)], fill=GOLD_D)
            s.line([(bx - w + 1, by - 1), (bx, by - h + 1)], fill=GOLD_L)
            if f == 3: s.line([(bx, by - h), (bx, by - h + 2)], fill=WHITE)
        frame = Image.alpha_composite(ground, outline(spikes))
        d = ImageDraw.Draw(frame)
        if f == 3:                                        # impact ticks
            for k in range(8):
                a = math.radians(22.5 + 45 * k); x0, y0 = GX + 16 * math.cos(a), GY - 8 - 12 * math.sin(a)
                d.line([(x0, y0), (x0 + 3 * math.cos(a), y0 - 3 * math.sin(a))], fill=CREAM)
        if f >= 5:                                        # dust at the spike holes
            for (bx, by) in verts + [(GX, GY)]:
                r = [0, 0, 0, 0, 0, 2, 3, 3][f]; al = [0, 0, 0, 0, 0, 170, 120, 60][f]
                d.ellipse([bx - r - 1, by - r - 1 - (f - 5), bx + r + 1, by + r - 1 - (f - 5)], fill=c("#ac8a62", al))
        frames.append(frame)
    save(frames, "Quibblet_Pierce")
    meta("Quibblet_Pierce", W, H, F, 20, False, (GX, GY),
         "Quibblet: warning triangle on the ground (frames 0-1), three spikes plus a center spike pierce up (2-4), retract and leave dust (5-7). "
         "Apply damage on frame 3. Anchor = triangle center on the ground.", hit_frame=3)


# ------------------------------------------------------------------ Alert Beaked Caller: anger mark over debuffed enemies
def anger_mark(cx, cy, gap, arm, col):
    im, d = new(16, 16)
    for sx in (-1, 1):
        for sy in (-1, 1):
            corner = (cx + sx * gap, cy + sy * gap)
            d.line([(cx + sx * gap, cy + sy * (gap + arm)), corner, (cx + sx * (gap + arm), cy + sy * gap)], fill=col, width=2, joint="curve")
    return outline(im, MAROON_K)


def anger():
    frames = []
    for gap, arm, col in [(0, 1, WHITE), (1, 3, WHITE), (2, 5, CORAL), (2, 4, RED), (2, 4, RED)]:
        frames.append(anger_mark(8, 7, gap, arm, col))
    save(frames, "Caller_Anger_Pop")
    meta("Caller_Anger_Pop", 16, 16, 5, 15, False, (8, 15),
         "Alert Beaked Caller debuff: anger mark pops in above an enemy. Anchor = bottom center (place just above the enemy's head); then play Caller_Anger_Loop until the debuff ends.")
    frames = []
    for dy, arm, col in [(0, 4, RED), (-1, 5, CORAL), (-1, 5, RED), (0, 4, RED), (0, 4, RED), (0, 4, RED)]:
        frames.append(anger_mark(8, 7 + dy, 2, arm, col))
    save(frames, "Caller_Anger_Loop")
    meta("Caller_Anger_Loop", 16, 16, 6, 10, True, (8, 15), "Alert Beaked Caller debuff: throbbing anger mark, loops while the enemy takes extra damage.")


# ------------------------------------------------------------------ Hushwisp: music notes
def note_art(kind, dy, twinkle):
    im, d = new(16, 16)
    if kind == "A":   # eighth note
        d.ellipse([3, 9 + dy, 8, 13 + dy], fill=PURPLE)
        d.line([(8, 2 + dy), (8, 11 + dy)], fill=PURPLE, width=2)
        d.line([(9, 3 + dy), (12, 6 + dy), (12, 8 + dy)], fill=PURPLE, width=2)
        d.point((4, 10 + dy), fill=LAV); d.point((5, 10 + dy), fill=LAV)
    else:             # two beamed notes
        for hx, hy in [(1, 10), (8, 9)]:
            d.ellipse([hx, hy + dy, hx + 4, hy + 3 + dy], fill=PURPLE); d.point((hx + 1, hy + 1 + dy), fill=LAV)
        d.line([(5, 4 + dy), (5, 11 + dy)], fill=PURPLE, width=1); d.line([(12, 3 + dy), (12, 10 + dy)], fill=PURPLE, width=1)
        d.polygon([(5, 3 + dy), (12, 2 + dy), (12, 4 + dy), (5, 5 + dy)], fill=PURPLE)
    im = outline(im)
    if twinkle: ImageDraw.Draw(im).point((14, 2 + dy) if kind == "A" else (14, 1 + dy), fill=CREAM)
    return im


def notes():
    bob = [0, -1, -1, -1, 0, 1, 1, 1]
    for kind in "AB":
        frames = [note_art(kind, bob[f], f in (2, 3)) for f in range(8)]
        save(frames, f"Hushwisp_Note_{kind}")
        meta(f"Hushwisp_Note_{kind}", 16, 16, 8, 10, True, (8, 8),
             f"Hushwisp music note ({'single eighth note' if kind == 'A' else 'two beamed notes'}), gentle bob. Pick A or B at random per note; "
             "on touch or after 3 s play Hushwisp_Note_Burst at the same spot.")


# ------------------------------------------------------------------ Grindle: stomping footprints
def foot(d, fill, shade):
    """Big round left-foot print seen from above: broad sole, three fat toes (big toe on the inside/right)."""
    d.ellipse([6, 9, 17, 18], fill=fill)
    d.ellipse([8, 14, 15, 18], fill=shade)
    for x, y, r in [(5.5, 5.5, 1.5), (10.5, 4, 1.5), (16, 4.5, 2)]:
        d.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def steps():
    W, H, C, CY = 24, 20, 12, 10
    for side in ("Left", "Right"):
        frames = []
        for f in range(9):
            im, d = new(W, H)
            if f <= 1:                                    # stomp ring
                r = [8, 11][f]
                d.ellipse([C - r, CY + 1 - r * 2 // 3, C + r, CY + 1 + r * 2 // 3], outline=CREAM if f == 0 else c("#ffe6d1", 140))
            if 1 <= f <= 3:                               # dust kicked out to the sides
                r, al = [0, 2, 3, 2][f], [0, 200, 140, 70][f]
                for dx in (-8, 8):
                    d.ellipse([C + dx - r, CY + 5 - r - f, C + dx + r, CY + 5 + r - f], fill=c("#ac8a62", al))
            pr, pd = new(W, H)
            foot(pd, CREAM if f == 0 else CORAL, CREAM if f == 0 else EMBER)
            pr = outline(pr, CLAY)
            pr = fade(pr, [1, 1, 1, 1, 1, 1, 0.7, 0.4, 0.15][f])
            if side == "Right": pr = pr.transpose(Image.FLIP_LEFT_RIGHT)
            frames.append(Image.alpha_composite(im, pr))
        name = f"Grindle_Step_{side}"
        save(frames, name)
        meta(name, W, H, 9, 15, False, (C, CY),
             f"Grindle: one stomping {side.lower()} footprint (toes point up). Place prints alternating Left/Right along the vertical line, "
             "a few frames apart; damage on frame 0. Rotate to change the line's direction.", hit_frame=0)


# ------------------------------------------------------------------ Ratiot: big bite
def bite():
    W, H, F, C, CY = 48, 56, 8, 24, 31
    upper_y = [16, 18, 27, 29, 28, 28, 27, 27]         # teeth line of the huge upper jaw
    lower_y = [50, 48, 35, 32, 33, 33, 34, 34]         # teeth line of the tiny lower jaw
    alpha = [1, 1, 1, 1, 1, 0.75, 0.45, 0.15]
    frames = []
    for f in range(F):
        jaws, d = new(W, H)
        u, l = upper_y[f], lower_y[f]
        for k in range(6):                               # upper teeth hang down
            x = 9 + 6 * k; th = 5 if k in (1, 4) else 4
            d.polygon([(x - 2, u), (x + 2, u), (x, u + th)], fill=CREAM)
        d.polygon([(4, u - 1), (44, u + 1), (40, u - 9), (26, u - 15), (10, u - 13)], fill=BRICK)   # wedge
        d.polygon([(4, u - 1), (44, u + 1), (42, u - 2), (6, u - 3)], fill=WINE)
        d.line([(10, u - 13), (26, u - 15), (40, u - 9)], fill=CORAL)
        for k in range(3):                               # lower teeth point up
            x = 18 + 6 * k
            d.polygon([(x - 2, l), (x + 2, l), (x, l - 3)], fill=CREAM)
        d.polygon([(15, l), (33, l), (30, l + 5), (18, l + 5)], fill=BRICK)
        d.line([(15, l), (33, l)], fill=CORAL)
        frame = fade(outline(jaws), alpha[f])
        fd = ImageDraw.Draw(frame)
        if f == 2:                                       # speed lines as the jaw slams
            for x in (12, 24, 36): fd.line([(x, u - 22), (x, u - 18)], fill=WHITE)
        if f in (3, 4):                                  # impact burst
            for k in range(8):
                a = math.radians(45 * k); r0, r1 = [0, 0, 0, 16, 19][f], [0, 0, 0, 21, 22][f]
                fd.line([(C + r0 * math.cos(a), CY - r0 * math.sin(a)), (C + r1 * math.cos(a), CY - r1 * math.sin(a))], fill=WHITE if f == 3 else CREAM)
        frames.append(frame)
    save(frames, "Ratiot_Bite")
    meta("Ratiot_Bite", W, H, F, 20, False, (C, CY),
         "Ratiot: huge upper jaw slams onto a tiny lower jaw over the target (single target, melee). Anchor = target center; damage on frame 3.", hit_frame=3)


if __name__ == "__main__":
    fns = dict(tongue=tongue, pierce=pierce, anger=anger, notes=notes, steps=steps, bite=bite)
    for w in (sys.argv[1:] or list(fns)):
        fns[w]()
