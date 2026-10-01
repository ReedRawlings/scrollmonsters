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

# ---------------------------------------------------------------- evolution merge (placeholders for the .pxc builds)
# White unless noted, so code tints each one with the parents' / result's element colour. Shared by all four evolutions.
GOLD, RARE = c("#f7b750"), c("#8973ab")

def ellipse_ring(d, cx, cy, rx, ry, col, width=1):
    if rx < 1 or ry < 1: d.point((cx, cy), fill=col); return
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], outline=col, width=width)

def merge():
    # Merge_Trail: 8x8 mote, 6 frames @ 24fps; a soft diamond that shrinks (each parent leaves one in its colour).
    frames = []
    for f in range(6):
        im = Image.new("RGBA", (8, 8), (0, 0, 0, 0)); d = ImageDraw.Draw(im); r = 3 - f // 2; a = 255 - f * 30
        d.polygon([(4, 4 - r), (4 + r, 4), (4, 4 + r), (4 - r, 4)], fill=(255, 255, 255, a // 2), outline=(255, 255, 255, a)); frames.append(im)
    save(strip(frames), "Merge_Trail")
    meta("Merge_Trail", 8, 8, 6, 24, False, (4, 4), "white diamond mote that shrinks and fades; tinted per parent in code.")
    # Merge_Core: 32x32, 6 frames @ 24fps (250ms); a cocoon that swells, pinches and flares to hide the swap.
    frames = []
    for f, (r, a) in enumerate([(3, 180), (6, 230), (9, 255), (7, 255), (10, 220), (13, 120)]):
        im = Image.new("RGBA", (32, 32), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        d.ellipse([16 - r, 16 - r, 16 + r, 16 + r], fill=(255, 255, 255, a // 2), outline=(255, 255, 255, a))
        if f >= 2: d.ellipse([16 - r // 2, 16 - r // 2, 16 + r // 2, 16 + r // 2], fill=(255, 255, 255, a))
        frames.append(im)
    save(strip(frames), "Merge_Core")
    meta("Merge_Core", 32, 32, 6, 24, False, (16, 16), "white cocoon pulse that hides the swap; local, never full-screen. Tinted with the result element.")
    # Merge_Reveal: 48x48, 8 frames @ 24fps; eight rays burst out once.
    frames = []
    for f in range(8):
        im = Image.new("RGBA", (48, 48), (0, 0, 0, 0)); d = ImageDraw.Draw(im); a = 255 if f < 4 else 255 - (f - 3) * 50
        r0, r1 = 4 + f * 2, 8 + f * 3
        for k in range(8):
            an = k * math.pi / 4; L = r1 if k % 2 == 0 else r1 - 4
            d.line([(24 + math.cos(an) * r0, 24 + math.sin(an) * r0), (24 + math.cos(an) * L, 24 + math.sin(an) * L)], fill=(255, 255, 255, a))
        if f < 2: d.ellipse([24 - 4 + f, 24 - 4 + f, 24 + 4 - f, 24 + 4 - f], fill=(255, 255, 255, 255))
        frames.append(im)
    save(strip(frames), "Merge_Reveal")
    meta("Merge_Reveal", 48, 48, 8, 24, False, (24, 24), "single eight-ray burst as the result appears; white, tinted in code.")
    # Merge_Ring: 64x44 ground ring (3:2), 8 frames @ 24fps; expands and thins out.
    frames = []
    for f in range(8):
        im = Image.new("RGBA", (64, 44), (0, 0, 0, 0)); d = ImageDraw.Draw(im); rx = 6 + f * 3.6
        ellipse_ring(d, 32, 22, int(rx), int(rx * 2 / 3), (255, 255, 255, 255 - f * 28), 2 if f < 4 else 1); frames.append(im)
    save(strip(frames), "Merge_Ring")
    meta("Merge_Ring", 64, 44, 8, 24, False, (32, 22), "3:2 ground shockwave ring under the result; white, tinted in code.")
    # Evolved_Slot_Glow: 32x24 (drawn at 2x over the 62x48 party slot), 6 frames @ 15fps; gold frame glow pulses once.
    frames = []
    for f, a in enumerate([120, 255, 220, 160, 90, 40]):
        im = Image.new("RGBA", (32, 24), (0, 0, 0, 0)); d = ImageDraw.Draw(im); g = GOLD[:3] + (a,)
        d.rectangle([0, 0, 31, 23], outline=g); d.rectangle([1, 1, 30, 22], outline=GOLD[:3] + (a // 2,))
        for x, y in [(0, 0), (31, 0), (0, 23), (31, 23)]: d.point((x, y), fill=(255, 255, 255, a))
        frames.append(im)
    save(strip(frames), "Evolved_Slot_Glow")
    meta("Evolved_Slot_Glow", 32, 24, 6, 15, False, (16, 12), "gold glow around the party slot the evolution lands in (2x over 62x48).")
    # Recipe_Discovered: 64x64, 8 frames @ 8fps loop; slow rotating sparkle ring behind the result portrait.
    frames = []
    for f in range(8):
        im = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        ellipse_ring(d, 32, 32, 27, 27, RARE[:3] + (110,))
        for k in range(6):
            an = (k / 6 + f / 48) * 2 * math.pi; x, y = 32 + math.cos(an) * 27, 32 + math.sin(an) * 27
            d.line([(x - 1, y), (x + 1, y)], fill=WHITE); d.line([(x, y - 1), (x, y + 1)], fill=WHITE)
        frames.append(im)
    save(strip(frames), "Recipe_Discovered")
    meta("Recipe_Discovered", 64, 64, 8, 8, True, (32, 32), "rotating sparkle ring behind the result portrait on the NEW EVOLUTION panel.")

# ---------------------------------------------------------------- Tengu (final hand-placed art: single-pixel detail)
def final_meta(name, w, h, frames, fps, loop, anchor, notes, visible_w):
    m = {"image": name + ".png", "frame_width": w, "frame_height": h, "frame_count": frames, "layout": "horizontal strip, no spacing",
         "fps": fps, "duration_s": round(frames / fps, 3), "loop": loop, "anchor": {"x": anchor[0], "y": anchor[1], "from": "top-left of each frame"},
         "palette": "Toasted40 + white", "notes": notes, "smoothing": "none (nearest neighbor)", "visible_w": visible_w}
    json.dump(m, open(SHEETS + name + ".json", "w"), indent=2)

def tengu():
    # Tengu_Feather: 16x8, 4f @15 loop, pointing right. White quill and vane; the crackle along the vane edge walks each frame.
    frames = []
    for f in range(4):
        im = Image.new("RGBA", (16, 8), (0, 0, 0, 0)); px = im.load()
        for x in range(2, 15): px[x, 4] = (255, 255, 255, 255)                      # quill
        for x in range(4, 13):                                                       # vane, widest in the middle
            half = 2 if 6 <= x <= 10 else 1
            for y in range(4 - half, 4 + half + 1): px[x, y] = (255, 255, 255, 230 if y != 4 else 255)
        px[14, 4] = px[15, 4] = (255, 255, 255, 255)                                 # tip
        for k in range(3):                                                           # crackle: bright pixels just off the vane edge
            x = 4 + (f * 3 + k * 4) % 9; y = 1 if k % 2 == 0 else 6; px[x, y] = (255, 255, 255, 255)
        for x in (0, 1): px[x, 4] = (255, 255, 255, 120 - 50 * x if f % 2 else 80)   # trailing wisp
        frames.append(im)
    save(strip(frames), "Tengu_Feather")
    final_meta("Tengu_Feather", 16, 8, 4, 15, True, (8, 4), "charged feather pointing right; rotate to the flight angle. White, tint 0x9ce9ff. Hand-placed pixels.", 16)
    # Lightning_Link: 32x12, 4f @20 loop. A jagged bolt from x=0 to x=31 on the centre line, a new path each frame, with a soft halo.
    frames = []; paths = [[0, -3, 2, -1, 3, -2, 1, 0], [0, 2, -2, 3, -1, 2, -3, 0], [0, -2, -4, 1, 3, -1, 2, 0], [0, 3, 1, -3, -1, 3, -2, 0]]
    for f in range(4):
        im = Image.new("RGBA", (32, 12), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        pts = [(round(i * 31 / 7), 6 + paths[f][i]) for i in range(8)]
        d.line(pts, fill=(255, 255, 255, 70), width=3)                                # halo
        d.line(pts, fill=(255, 255, 255, 255), width=1)                               # core
        fork = pts[3 + f % 3]; d.line([fork, (fork[0] + 3, fork[1] + (3 if f % 2 else -3))], fill=(255, 255, 255, 200))
        frames.append(im)
    save(strip(frames), "Lightning_Link")
    final_meta("Lightning_Link", 32, 12, 4, 20, True, (0, 6), "bolt strip from the left edge; origin (0, 0.5), rotate to the target, scaleX = distance / 32. White, tint 0x9beaff.", 32)

if __name__ == "__main__":
    for w in (sys.argv[1:] or ["packs", "cardback", "icons", "trail", "merge", "tengu"]):
        {"packs": packs, "cardback": cardback, "icons": icons, "trail": trail, "merge": merge, "tengu": tengu}[w]()
