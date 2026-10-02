#!/usr/bin/env python3
"""Builds animated GIF previews of the FX sheets in assets/fx/sheets, grouped by skill.

Matching sheets play together the way the game uses them: Start -> Loop x N -> End, Back/Front aura
layers around the player, merge pieces in order. White sheets get the same tint the game applies.
Output: output/fx-gifs/<group>.gif (nearest-neighbour scale, dark background, label in the game font).

    python3 scripts/pixelcomposer/preview_gifs.py            # all groups
    python3 scripts/pixelcomposer/preview_gifs.py tengu ink   # only these
"""
import json, math, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
SHEETS = os.path.join(ROOT, 'assets/fx/sheets')
OUT = os.path.join(ROOT, 'output/fx-gifs')
FONT = os.path.join(ROOT, 'assets/ui/font_medium_9px.ttf')
PLAYER = os.path.join(ROOT, 'assets/Ninja Adventure - Asset Pack/Actor/Characters/EggBoy/SpriteSheet.png')
BG, LABEL_BG, TICK_MS = (34, 29, 40), (20, 16, 28), 20  # GIF delays are in 10 ms units; 20 ms = 50 fps

# Tints from survivor-juice.js ELEMENT_TINT and docs/evolution-vfx-integration.md.
OCTOPUS, TENGU, STORM, AXOLOTL, CAT, MOLLUSC = 0xccafff, 0x9ce9ff, 0x9beaff, 0xa1dbef, 0xb5fff0, 0xc8a6ff
RARE = 0x8973ab

_cache = {}
def sheet(name):
    if name not in _cache:
        if name == 'Player':
            img = Image.open(PLAYER).convert('RGBA')
            _cache[name] = ([img.crop((0, 0, 16, 16))], {'fps': None, 'anchor': {'x': 8, 'y': 15}})
        else:
            meta = json.load(open(os.path.join(SHEETS, name + '.json')))
            img = Image.open(os.path.join(SHEETS, meta['image'])).convert('RGBA')
            w, h = meta['frame_width'], meta['frame_height']
            _cache[name] = ([img.crop((i * w, 0, i * w + w, h)) for i in range(meta['frame_count'])], meta)
    return _cache[name]

def tinted(frame, tint):
    if tint is None: return frame
    r, g, b, a = frame.split()
    tr, tg, tb = tint >> 16 & 255, tint >> 8 & 255, tint & 255
    return Image.merge('RGBA', (r.point(lambda v: v * tr // 255), g.point(lambda v: v * tg // 255), b.point(lambda v: v * tb // 255), a))

def L(name, tint=None, at=(0, 0), repeat=1, start=0, hold=False, fps=None, flip=False):
    """One layer: a sheet placed with its anchor at `at`, starting `start` ms into its step."""
    return dict(name=name, tint=tint, at=at, repeat=repeat, start=start, hold=hold, fps=fps, flip=flip)

def layer_ms(l):
    frames, meta = sheet(l['name'])
    fps = l['fps'] or meta.get('fps')
    return l['start'] + (len(frames) * l['repeat'] * 1000 / fps if fps else 0)

# Each group: (label, [steps]); a step is a list of layers drawn together (first = back). Optional ('ms', n) fixes a step length.
GROUPS = {
    # Evolution abilities
    'octopus-tentacle-sweep': ('Octopus: Tentacle Sweep', [
        [L('Tentacle_Sweep', OCTOPUS), L('Ink_Hit', at=(30, -6), start=150), L('Ink_Hit', at=(22, 14), start=200)]]),
    'ink-pool': ('Mollusc / Octopus: Ink Pool', [
        [L('Ink_Splat')], [L('Ink_Pool_Start')], [L('Ink_Pool_Loop', repeat=3)], [L('Ink_Pool_End')]]),
    'reptile-charge-bite': ('Reptile: Charge, Bite, Detonate', [
        [L('Charge_Kick', at=(-30, 0))], [L('Bite_Impact', at=(10, -6))], [L('Fire_Detonate', at=(10, -6))]]),
    'fire-pool': ('Reptile / Salamander: Burning Ground', [
        [L('Fire_Pool_Start')], [L('Fire_Pool_Loop', repeat=3)], [L('Fire_Pool_End')]]),
    'tengu-feather-lightning': ('Tengu: Storm Feathers', [
        [L('Tengu_Feather', TENGU, at=(-34, 0), repeat=4), L('Lightning_Link', STORM, at=(-24, 0), repeat=4), L('Lightning_Link', STORM, at=(8, 0), repeat=4),
         L('Zap_Spark', STORM, at=(40, 0), start=200), L('Zap_Spark', STORM, at=(40, 0), start=600)]]),
    'tengu-thunder': ('Tengu: Gathering Storm', [
        [L('Thunder_Warning', STORM, repeat=3)], [L('Zap_Spark', STORM, at=(0, -4)), L('Zap_Spark', STORM, at=(-10, 4), start=60), L('Zap_Spark', STORM, at=(10, 4), start=120)]]),
    'axolotl-bubble': ('Axolotl: Shield Pulse, Bubble Break', [
        [L('Bubble_Pulse', AXOLOTL)], [L('Bubble_Break', AXOLOTL)], [L('Ink_Splat')]]),
    'bubble-rally': ('Axolotl: Bubble Rally', [
        [L('Player', at=(0, 0), hold=True), L('Rally_Motes', at=(0, 0), repeat=4)]]),
    # Evolution merge
    'evolution-merge': ('Evolution Merge', [
        [L('Merge_Trail', CAT, at=(-26, 0), repeat=3), L('Merge_Trail', MOLLUSC, at=(26, 0), repeat=3),
         L('Merge_Trail', CAT, at=(-14, 0), start=250, repeat=2), L('Merge_Trail', MOLLUSC, at=(14, 0), start=250, repeat=2)],
        [L('Merge_Core', OCTOPUS)], [L('Merge_Ring', OCTOPUS, at=(0, 14)), L('Merge_Reveal', OCTOPUS)]]),
    'new-evolution-panel': ('New Evolution: Recipe Discovered', [
        [L('Recipe_Discovered', repeat=3), L('Evolved_Slot_Glow', at=(0, 44), start=400)]]),
    # Player progression
    'level-up-aura': ('Level Up Aura', [
        [L('LevelUp_Aura_Ignite_Back'), L('Player', hold=True), L('LevelUp_Aura_Ignite_Front')],
        [L('LevelUp_Aura_Loop_Back', repeat=4), L('Player', hold=True), L('LevelUp_Aura_Loop_Front', repeat=4)],
        [L('LevelUp_Aura_Fade_Back'), L('Player', hold=True), L('LevelUp_Aura_Fade_Front')], [L('Player', hold=True), ('ms', 300)]]),
    'capture': ('Capture Ring', [
        [L('Capture_Ring', repeat=2)], [L('Capture_Fill')], [L('Capture_Burst')]]),
    # Monster attacks
    'fizzteen-flame': ('Fizzteen: Flame', [[L('Fizzteen_Flame', at=(-28, 0))]]),
    'chorubble-wave': ('Chorubble: Echo Wave', [[L('Chorubble_Wave_Out')], [L('Chorubble_Wave_Back')]]),
    'glazel-lipstick': ('Glazel: Lipstick Smear', [
        [L('Glazel_Lipstick_Swipe')], [L('Glazel_Smear_Loop', repeat=3)], [L('Glazel_Smear_Fade')]]),
    'hushwisp-notes': ('Hushwisp: Notes', [
        [L('Hushwisp_Note_A', at=(-14, -4), repeat=2), L('Hushwisp_Note_B', at=(14, 4), repeat=2)],
        [L('Hushwisp_Note_Burst', at=(-14, -4)), L('Hushwisp_Note_Burst', at=(14, 4), start=120)]]),
    'palimaw-tongue': ('Palimaw: Tongue Lash', [
        [L('Palimaw_Tongue_Mid', at=(-28, 0), hold=True), L('Palimaw_Tongue_Mid', at=(-20, 0), hold=True), L('Palimaw_Tongue_Mid', at=(-12, 0), hold=True),
         L('Palimaw_Tongue_Mid', at=(-4, 0), hold=True), L('Palimaw_Tongue_Tip', at=(4, 0), repeat=3)],
        [L('Palimaw_Tongue_Hit', at=(12, 0))]]),
    'quibblet-pierce': ('Quibblet: Pierce', [[L('Quibblet_Pierce')]]),
    'caller-anger': ('Alert Beaked Caller: Anger', [[L('Caller_Anger_Pop')], [L('Caller_Anger_Loop', repeat=4)]]),
    'grindle-steps': ('Grindle: Stomp Line', [
        [L('Grindle_Step_Left', at=(-36, 6))], [L('Grindle_Step_Right', at=(-12, -6))], [L('Grindle_Step_Left', at=(12, 6))], [L('Grindle_Step_Right', at=(36, -6))]]),
    'ratiot-bite': ('Ratiot: Bite', [[L('Ratiot_Bite')]]),
    # Rewards
    'pack-open': ('Card Pack: Drop and Open', [
        [L('Pack_Drop_Common', at=(-30, 0), repeat=3), L('Pack_Drop_Rare', repeat=3), L('Pack_Drop_Legendary', at=(30, 0), repeat=3)],
        [L('Pack_Open_Common', at=(-30, 0)), L('Pack_Open_Rare', start=120), L('Pack_Open_Legendary', at=(30, 0), start=240)],
        [L('Pack_Flip', RARE, at=(0, -14))]]),
    'unlock-reveal': ('Unlock Reveal', [[L('Unlock_Rays', repeat=2), L('Unlock_Fill', start=300)]]),
    'reward-sparks': ('Crit, Slot Power-Up, Reward Trail', [
        [L('Damage_Crit', at=(-34, 0), repeat=4), L('Slot_PowerUp', repeat=3), L('Reward_Trail', 0xffd36b, at=(34, 0), repeat=6)]]),
    'upgrade-icons': ('Upgrade Icons', [
        [L('Icon_Bolstering_Croak', at=(-24, 0), repeat=2), L('Icon_Growing_Colony', repeat=2), L('Icon_Staggering_Roar', at=(24, 0), repeat=2)]]),
}

def build(key, label, steps):
    # Timeline: steps run back to back; each step lasts as long as its longest layer (or a fixed 'ms').
    timeline, t = [], 0
    for step in steps:
        layers = [l for l in step if isinstance(l, dict)]
        fixed = [v for k, v in (x for x in step if isinstance(x, tuple))]
        dur = fixed[0] if fixed else max(layer_ms(l) for l in layers if not l['hold'] or True)
        for l in layers: timeline.append((t, t + dur, l))
        t += dur
    total = t + 450  # pause before the loop restarts
    # Canvas bounds relative to the shared origin.
    xs, ys = [], []
    for _, _, l in timeline:
        frames, meta = sheet(l['name'])
        ax, ay = meta['anchor']['x'], meta['anchor']['y']
        w, h = frames[0].size
        x0, y0 = l['at'][0] - ax, l['at'][1] - ay
        xs += [x0, x0 + w]; ys += [y0, y0 + h]
    pad = 6
    left, top = min(xs) - pad, min(ys) - pad
    cw, ch = max(xs) + pad - left, max(ys) + pad - top
    k = max(2, min(8, round(360 / max(cw, ch))))
    font = ImageFont.truetype(FONT, 18)
    band = 34
    W, H = cw * k, ch * k + band
    W = max(W, int(font.getlength(label)) + 24)
    out, n = [], math.ceil(total / TICK_MS)
    for i in range(n):
        now = i * TICK_MS
        base = Image.new('RGBA', (cw, ch), BG + (255,))
        for s0, s1, l in timeline:
            if not (s0 <= now < s1): continue
            frames, meta = sheet(l['name'])
            fps = l['fps'] or meta.get('fps')
            local = now - s0 - l['start']
            if local < 0: continue
            if fps:
                idx = int(local * fps / 1000)
                if idx >= len(frames) * l['repeat']:
                    if not l['hold']: continue
                    idx = len(frames) - 1
                f = frames[idx % len(frames)]
            else:
                f = frames[0]
            f = tinted(f, l['tint'])
            base.alpha_composite(f, (l['at'][0] - meta['anchor']['x'] - left, l['at'][1] - meta['anchor']['y'] - top))
        frame = Image.new('RGB', (W, H), LABEL_BG)
        frame.paste(base.convert('RGB').resize((cw * k, ch * k), Image.NEAREST), ((W - cw * k) // 2, 0))
        d = ImageDraw.Draw(frame)
        d.text((W // 2, ch * k + band // 2), label, font=font, fill=(255, 240, 200), anchor='mm', fontmode='1')
        out.append(frame)
    # Drop repeated frames (merge their delays) and share one palette so colours don't flicker.
    frames, delays = [], []
    for f in out:
        if frames and f.tobytes() == frames[-1].tobytes(): delays[-1] += TICK_MS
        else: frames.append(f); delays.append(TICK_MS)
    strip = Image.new('RGB', (W, H * min(len(frames), 24)))
    for j, f in enumerate(frames[::max(1, len(frames) // 24)][:24]): strip.paste(f, (0, j * H))
    pal = strip.quantize(255, method=Image.Quantize.MEDIANCUT)
    q = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
    path = os.path.join(OUT, key + '.gif')
    q[0].save(path, save_all=True, append_images=q[1:], duration=delays, loop=0, disposal=1, optimize=False)
    return path, W, H, total

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    want = sys.argv[1:]
    for key, (label, steps) in GROUPS.items():
        if want and not any(w in key for w in want): continue
        path, w, h, ms = build(key, label, steps)
        print(f'{key:28s} {w}x{h}  {ms / 1000:.1f}s  {os.path.getsize(path) // 1024} KB')
