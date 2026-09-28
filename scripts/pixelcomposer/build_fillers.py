"""Placeholder ("filler") pixel art for VFX_REQUESTS.md items that need hand-drawn art:
packs, card backs and three upgrade icons. Correct sizes, frame counts and JSON so code can
integrate now; replace the PNGs with final art later (keep the same size/frames and the JSON stays valid).
Palette: Toasted40 + pure white.
Run: python3 build_fillers.py [packs] [cardback] [icons] [trail]"""
import json, os, sys, math
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SHEETS = os.path.abspath(os.path.join(HERE, "..", "..", "assets", "fx", "sheets")) + "/"

def c(hx, a=255): return tuple(int(hx[i:i + 2], 16) for i in (1, 3, 5)) + (a,)
INK, NAVY, NAVY_L = c("#1c080c"), c("#2e1b2b"), c("#392f36")
WHITE, CREAM = c("#ffffff"), c("#ffe6d1")
RARITY = {  # body, dark (crimp/shade), light (glint), glow
    "Common":    (c("#78949b"), c("#5d6b79"), c("#a6aa9d"), c("#78949b", 90)),
    "Rare":      (c("#8973ab"), c("#53414f"), c("#c2b5c4"), c("#8973ab", 90)),
    "Legendary": (c("#f7b750"), c("#a87c25"), c("#ffe6d1"), c("#f7b750", 90)),
}

def meta(name, w, h, frames, fps, loop, anchor, notes, **extra):
    m = {"image": name + ".png", "frame_width": w, "frame_height": h, "frame_count": frames,
         "layout": "horizontal strip, no spacing", "fps": fps, "duration_s": round(frames / fps, 3) if fps else None,
         "loop": loop, "anchor": {"x": anchor[0], "y": anchor[1], "from": "top-left of each frame"},
         "palette": "Toasted40 + white", "notes": "PLACEHOLDER art. " + notes, "smoothing": "none (nearest neighbor)"}
    m.update(extra)
    json.dump(m, open(SHEETS + name + ".json", "w"), indent=2)

def strip(frames):
    w, h = frames[0].size
    out = Image.new("RGBA", (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames): out.paste(f, (i * w, 0))
    return out

def save(img, name):
    img.save(SHEETS + name + ".png"); print(f"{name:26s} {img.size[0]}x{img.size[1]}")

# ---------------------------------------------------------------- packs
def draw_pack(d, x0, y0, w, h, rarity, glint_x=None, torn=0):
    body, dark, light, _ = RARITY[rarity]
    x1, y1 = x0 + w - 1, y0 + h - 1
    d.rectangle([x0, y0 + 2 + torn, x1, y1 - 2], fill=body, outline=INK)          # wrapper body
    for x in range(x0, x1 + 1):                                                     # crimped edges (zigzag)
        if not torn:
            d.point((x, y0 + 1 + (x % 2)), fill=dark); d.point((x, y0 + (x % 2)), fill=INK if x % 2 == 0 else (0, 0, 0, 0))
        d.point((x, y1 - 1 - (x % 2)), fill=dark); d.point((x, y1 - (x % 2)), fill=INK if x % 2 == 0 else (0, 0, 0, 0))
    cx, cy = x0 + w // 2, y0 + h // 2
    d.polygon([(cx, cy - 3), (cx + 3, cy), (cx, cy + 3), (cx - 3, cy)], fill=dark, outline=light)   # diamond emblem
    d.line([(x1 - 1, y0 + 3 + torn), (x1 - 1, y1 - 3)], fill=dark)                  # side shade = thickness
    if glint_x is not None:                                                         # glint sweeping across foil
        for k in range(h):
            gx = glint_x + (h - k) // 3
            if x0 < gx < x1 and y0 + 2 + torn < y0 + k < y1 - 2: d.point((gx, y0 + k), fill=light)

def packs():
    W, H, F = 16, 20, 6
    for rarity, pw in [("Common", 9), ("Rare", 11), ("Legendary", 13)]:
        frames = []
        for f in range(F):
            im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
            bob = [0, -1, -1, 0, 0, 0][f]
            glow = RARITY[rarity][3]
            d.ellipse([W // 2 - pw // 2 - 1, H - 4, W // 2 + pw // 2 + 1, H - 1], fill=glow)       # soft glow under
            draw_pack(d, (W - pw) // 2, 2 + bob, pw, 15, rarity, glint_x=(W - pw) // 2 - 4 + f * 3)
            frames.append(im)
        name = f"Pack_Drop_{rarity}"; save(strip(frames), name)
        meta(name, W, H, F, 10, True, (W // 2, H - 1), f"{rarity} upgrade pack on the ground: bob, foil glint, soft glow. Width grows with rarity.")
    # opening: one strip per rarity
    W, H, F = 24, 32, 7
    for rarity, pw in [("Common", 9), ("Rare", 11), ("Legendary", 13)]:
        body, dark, light, _ = RARITY[rarity]
        frames = []
        for f in range(F):
            im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
            x0, y0 = (W - pw) // 2, H - 17
            if f <= 1:
                draw_pack(d, x0, y0 - f, pw, 15, rarity)
            else:
                spread = min(f - 1, 3)
                draw_pack(d, x0 - spread // 2, y0, pw + spread, 15, rarity, torn=2)            # torn open, puffed
                for k in range(min(f - 1, 3)):                                                 # cards peek out
                    cx = W // 2 - 4 + k * 3; top = y0 - 2 - min(f - 2, 3) * 2 + k
                    d.rectangle([cx, top, cx + 5, y0 + 4], fill=WHITE, outline=INK)
                if f >= 1 and f <= 3:                                                          # torn crimp flying off
                    d.line([(x0 + 2 + f * 2, y0 - 2 - f * 2), (x0 + 6 + f * 2, y0 - 4 - f * 2)], fill=dark, width=2)
                for k in range(6):                                                             # rarity sparkles
                    if f >= 2:
                        a = k * math.pi / 3 + f * 0.3; r = 4 + (f - 2) * 3
                        px, py = W // 2 + r * math.cos(a), y0 - 2 + r * math.sin(a) * 0.8
                        col = light if (k + f) % 2 else WHITE
                        if f < 6: d.point((px, py), fill=col); d.point((px + 1, py), fill=col) if f < 4 else None
            frames.append(im)
        name = f"Pack_Open_{rarity}"; save(strip(frames), name)
        meta(name, W, H, F, 20, False, (W // 2, H - 1), f"{rarity} pack opening: crimp tears off, wrapper puffs, cards peek, sparkles.")

# ---------------------------------------------------------------- card backs
def cardback():
    W, H = 60, 85; frames = []
    for rarity in ["Common", "Rare", "Legendary"]:
        body, dark, light, _ = RARITY[rarity]
        im = Image.new("RGBA", (W, H), NAVY); d = ImageDraw.Draw(im)
        for k in range(-H, W + H, 6):                                                          # diagonal pattern
            d.line([(k, 0), (k + H, H)], fill=NAVY_L)
        cx, cy, r = W // 2, H // 2, 14
        d.polygon([(cx, cy - r - 2), (cx + r + 2, cy), (cx, cy + r + 2), (cx - r - 2, cy)], fill=NAVY)
        d.polygon([(cx, cy - r), (cx + r, cy), (cx, cy + r), (cx - r, cy)], fill=dark, outline=body)
        d.polygon([(cx, cy - r + 3), (cx + r - 3, cy), (cx, cy + r - 3), (cx - r + 3, cy)], outline=light)
        q = ["01110", "10001", "00001", "00110", "00100", "00000", "00100"]                    # "?"
        for yy, row in enumerate(q):
            for xx, ch in enumerate(row):
                if ch == "1": d.rectangle([cx - 5 + xx * 2, cy - 7 + yy * 2, cx - 4 + xx * 2, cy - 6 + yy * 2], fill=WHITE)
        if rarity == "Legendary":                                                              # extra corner ornaments
            for (x, y, sx, sy) in [(3, 3, 1, 1), (W - 4, 3, -1, 1), (3, H - 4, 1, -1), (W - 4, H - 4, -1, -1)]:
                d.line([(x, y), (x + 7 * sx, y)], fill=body); d.line([(x, y), (x, y + 7 * sy)], fill=body)
                d.point((x + 2 * sx, y + 2 * sy), fill=light)
        frames.append(im)
    save(strip(frames), "Pack_CardBack")
    meta("Pack_CardBack", W, H, 3, None, False, (W // 2, H // 2), "Card back inner art, one frame per rarity: common, rare, legendary. Sits inside the DarkMode item-slot nine-slice.",
         frames_by_rarity=["common", "rare", "legendary"])

# ---------------------------------------------------------------- icons (16x16, 16-frame coin spin)
def icon_art(kind):
    im = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if kind == "Bolstering_Croak":   # frog face with sound arcs
        d.ellipse([3, 5, 12, 13], fill=c("#7b7460"), outline=INK); d.point([(5, 7), (10, 7)], fill=WHITE)
        d.line([(6, 11), (9, 11)], fill=INK); d.arc([10, 2, 15, 8], 280, 80, fill=c("#f7b750")); d.arc([12, 1, 17, 9], 280, 80, fill=c("#ffe6d1"))
    elif kind == "Growing_Colony":  # cluster of three growing orbs
        for (x, y, r, col) in [(4, 10, 3, "#545955"), (10, 10, 4, "#7b7460"), (7, 5, 3, "#a6aa9d")]:
            d.ellipse([x - r, y - r, x + r, y + r], fill=c(col), outline=INK)
        d.line([(12, 2), (12, 5)], fill=c("#f7b750")); d.line([(11, 3), (13, 3)], fill=c("#f7b750"))
    else:                            # Staggering_Roar: jagged red burst with a dizzy mark
        pts = [(8 + (7 if k % 2 == 0 else 3.5) * math.cos(k * math.pi / 6), 8 + (7 if k % 2 == 0 else 3.5) * math.sin(k * math.pi / 6)) for k in range(12)]
        d.polygon(pts, fill=c("#cd5151"), outline=INK); d.ellipse([6, 6, 10, 10], fill=c("#ffe6d1")); d.point((8, 8), fill=c("#84333e"))
    return im

def icons():
    for kind in ["Bolstering_Croak", "Growing_Colony", "Staggering_Roar"]:
        art = icon_art(kind); frames = []
        for f in range(16):
            s = math.cos(2 * math.pi * f / 16); w = max(1, round(16 * abs(s)))
            src = art.transpose(Image.FLIP_LEFT_RIGHT) if s < 0 else art
            im = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); im.paste(src.resize((w, 16), Image.NEAREST), ((16 - w) // 2, 0))
            frames.append(im)
        name = f"Icon_{kind}"; save(strip(frames), name)
        meta(name, 16, 16, 16, 12, True, (8, 8), f"{kind.replace('_', ' ')} upgrade icon, 16-frame coin spin (fps is a guess; match the other Tiny Dungeons icons).")

# ---------------------------------------------------------------- reward trail sparkle (hand-placed; too small for PC shapes)
def trail():
    W = H = 8; frames = []
    P = {  # (x, y, alpha) offsets from center (3,3)/(4,4) — a 4-point sparkle that pops then fades
        0: [(0, 0, 255), (0, -1, 200), (0, 1, 200), (-1, 0, 200), (1, 0, 200)],
        1: [(0, 0, 255)] + [(dx * k, dy * k, 255 if k == 1 else 190) for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)] for k in (1, 2, 3)],
        2: [(0, 0, 255)] + [(dx * k, dy * k, 230 if k == 1 else 130) for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)] for k in (1, 2)] + [(d1, d2, 110) for d1 in (-1, 1) for d2 in (-1, 1)],
        3: [(0, 0, 200)] + [(dx, dy, 120) for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]],
        4: [(0, 0, 110)],
    }
    for f in range(5):
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); px = im.load()
        for dx, dy, a in P[f]:
            x, y = 4 + dx, 4 + dy
            if 0 <= x < W and 0 <= y < H: px[x, y] = (255, 255, 255, a)
        frames.append(im)
    save(strip(frames), "Reward_Trail")
    m = {"image": "Reward_Trail.png", "frame_width": W, "frame_height": H, "frame_count": 5, "layout": "horizontal strip, no spacing",
         "fps": 20, "duration_s": 0.25, "loop": False, "anchor": {"x": 4, "y": 4, "from": "top-left of each frame"},
         "palette": "Toasted40 + white", "notes": "tiny white sparkle (hand-placed pixels): pops to a 7px cross, fades to one pixel. Tint gold in code if wanted.",
         "smoothing": "none (nearest neighbor)"}
    json.dump(m, open(SHEETS + "Reward_Trail.json", "w"), indent=2)

if __name__ == "__main__":
    for w in (sys.argv[1:] or ["packs", "cardback", "icons", "trail"]):
        {"packs": packs, "cardback": cardback, "icons": icons, "trail": trail}[w]()
