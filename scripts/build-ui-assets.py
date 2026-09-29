#!/usr/bin/env python3
"""Copy the DarkMode UI pieces and relic spin icons the survivors UI uses into the repo.

Sources are the purchased packs in ~/Downloads. The licenses allow shipping the art inside
the game but not redistributing the packs, so only the used crops are copied.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HOME = Path.home() / 'Downloads'
PIX = HOME / 'Pixelarium - Interfaces Bundle - Full version/Pack Content'
DARK = PIX / 'DarkMode Interface'
ZELDA = PIX / 'Zelda-Like Interface'
TINY = HOME / 'Tiny Dungeons - Items Pack/Tiny Dungeons - Items Pack/items/procedural_animations'
ROOT = Path(__file__).resolve().parent.parent
NINJA = ROOT / 'assets/Ninja Adventure - Asset Pack/Items'
import json
VFXMIX = HOME / 'FullBundle/AllPackBundle/VfxMix'
FX_OUT = ROOT / 'assets/fx/vfxmix'
SHEETS = ROOT / 'assets/fx/sheets'
# Sheets the juice uses, read from the artist's JSON so re-exports need no code change.
FX_FROM_JSON = ['Capture_Ring', 'Capture_Fill', 'Capture_Burst', 'Reward_Trail', 'Slot_PowerUp',
    'LevelUp_Aura_Ignite_Back', 'LevelUp_Aura_Ignite_Front', 'LevelUp_Aura_Loop_Back', 'LevelUp_Aura_Loop_Front',
    'LevelUp_Aura_Fade_Back', 'LevelUp_Aura_Fade_Front', 'Unlock_Rays', 'Unlock_Fill', 'Damage_Crit',
    'Pack_Drop_Common', 'Pack_Drop_Rare', 'Pack_Drop_Legendary', 'Pack_Open_Common', 'Pack_Open_Rare', 'Pack_Open_Legendary',
    'Pack_CardBack', 'Pack_Flip', 'Pack_Sheen']
# Sheets without artist JSON: src, frame w/h, frames, fps, loop, anchor x/y.
FX_EXTRA = {
    'ShrineStates': ('assets/fx/ShrineStates.png', 32, 32, 4, 1, False, 16, 31),
    'Spark_Light': ('assets/fx/vfxmix/spark_04.png', 142, 119, 16, 24, False, 71, 60),
    'P_Shard': ('assets/fx/vfxmix/gem_broken_yellow.png', 18, 16, 6, 1, False, 9, 8),
    'P_Rock': ('assets/fx/vfxmix/rock_gray.png', 22, 22, 6, 1, False, 11, 11),
}
UPGRADE_OUT = ROOT / 'assets/icons/upgrades'
FONT = ROOT / 'assets/ui/font_medium_9px.ttf'
DIGITS_OUT = ROOT / 'assets/ui/damage_digits.png'
def digit_strip():
    """White NovelMix digits with a 1px dark outline in 8x9 cells, and each digit's advance.

    At 9px the digit glyphs are at most 6px wide and 7px tall and start 4px below the em top,
    so drawing at (1, -3) leaves exactly one outline pixel on every side.
    """
    font = ImageFont.truetype(str(FONT), 9)
    cw, ch = 8, 9
    strip, adv = Image.new('RGBA', (cw * 10, ch), (0, 0, 0, 0)), []
    for d in range(10):
        glyph = Image.new('L', (cw, ch), 0)
        draw = ImageDraw.Draw(glyph); draw.fontmode = '1'
        draw.text((1, -3), str(d), font=font, fill=255)
        box = glyph.getbbox()
        assert box and box[0] >= 1 and box[1] >= 1 and box[2] <= cw - 1 and box[3] <= ch - 1, (d, box)
        cell = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
        cell.paste((18, 10, 26, 255), (0, 0), glyph.filter(ImageFilter.MaxFilter(3)))
        cell.paste((255, 255, 255, 255), (0, 0), glyph)
        strip.paste(cell, (d * cw, 0))
        adv.append(int(font.getlength(str(d))))
    strip.save(DIGITS_OUT)
    return {'src': 'assets/ui/damage_digits.png', 'fw': cw, 'fh': ch, 'n': 10, 'fps': 1, 'loop': False, 'ax': 0, 'ay': ch // 2, 'adv': adv}
# Every offerable upgrade id -> ('tiny', strip) | ('ninja', Items/ path, static) | ('sheet', artist strip in assets/fx/sheets).
# No icon may repeat or closely resemble another upgrade's or a relic's icon.
UPGRADE_ICONS = {
    'partyDamage': ('tiny', 'sword_02'), 'partySpeed': ('ninja', 'Object/Hourglass.png'),
    'hide': ('tiny', 'armor_02_v1_helmet'), 'feet': ('tiny', 'monster_loot_garden_fly'),
    'sweep': ('ninja', 'Tool/Sickle.png'), 'pull': ('ninja', 'Weapons/Whip/Sprite.png'),
    'marks': ('ninja', 'Projectile/Arrow.png'), 'feather': ('ninja', 'Resource/feather.png'), 'split': ('ninja', 'Projectile/Caltrop.png'),
    'slam': ('ninja', 'Scroll/ScrollRock.png'),
    'bubble': ('ninja', 'Resource/Water.png'), 'frogPower': ('sheet', 'Icon_Bolstering_Croak'), 'chorus': ('ninja', 'Object/PanFlute.png'),
    'mouseCount': ('sheet', 'Icon_Growing_Colony'), 'mouseJump': ('ninja', 'Food/Meat.png'),
    'moleArea': ('ninja', 'Tool/Shovel.png'), 'moleEcho': ('ninja', 'Tool/Hammer.png'), 'moleSlow': ('ninja', 'Tool/Pickaxe.png'),
    'bearArea': ('ninja', 'Weapons/Club/Sprite.png'), 'bearStun': ('sheet', 'Icon_Staggering_Roar'), 'bearGuard': ('ninja', 'Tool/Anvil.png'),
    'fireLife': ('tiny', 'potion_02'), 'fireArea': ('tiny', 'monster_loot_desert_larva'), 'fireSpread': ('tiny', 'food_06'),
    'webWeaken': ('tiny', 'monster_loot_dungeon_flying_skull'), 'webCount': ('tiny', 'food_07'), 'webArea': ('tiny', 'monster_loot_garden_goblin'),
    'webBurst': ('tiny', 'monster_loot_hell_reaper'), 'stormJumps': ('tiny', 'money_gem'), 'stormRange': ('tiny', 'armor_02_v2_legs'),
    'stormStrike': ('tiny', 'monster_loot_snow_impish'), 'comboFire': ('tiny', 'monster_loot_hell_fire_pig'),
    'comboWeb': ('tiny', 'monster_loot_dungeon_rat'), 'comboStorm': ('tiny', 'monster_loot_dungeon_slime'), 'comboShield': ('tiny', 'shield_03'),
}

def static_strip(path):
    """A static 16x16-or-smaller item, centred and repeated 16 times so every icon is a 256x16 strip."""
    im = Image.open(path).convert('RGBA')
    assert im.width <= 16 and im.height <= 16, f'{path} is larger than 16x16'
    strip = Image.new('RGBA', (256, 16))
    for i in range(16):
        strip.alpha_composite(im, (i * 16 + (16 - im.width) // 2, (16 - im.height) // 2))
    return strip
UI_OUT = ROOT / 'assets/ui/darkmode'
ICON_OUT = ROOT / 'assets/icons/relics'

CROPS = {  # output name: (source, crop box or None)
    'panel': (DARK / 'Dialogue interfaces/spr_dialogue_box_withoutstartingpoint_9slice.png', (5, 5, 37, 37)),
    'slot': (DARK / 'Player interface/Player Status/spr_item_slot.png', None),
    'pill': (DARK / 'Dialogue interfaces/spr_dialogue_box_button.png', (1, 1, 21, 12)),
    'banner': (DARK / 'GameplayHud/spr_banner_hud.png', None),
    'status': (DARK / 'Player interface/Player Status/single size player status/spr_player_status_version1.png', None),
    'zslot': (ZELDA / 'Player interface/Player Status/item slots/spr_item_slot_single_charge_zeldalike.png', (0, 0, 31, 24)),
    'heart': (ZELDA / 'Player interface/Player Status/spr_player_healthbar.png', (36, 0, 45, 8)),
}
# relic id -> Tiny Dungeons strip. resonance, drum and veil are hand-made and already in ICON_OUT.
RELIC_STRIPS = {
    'boots': 'armor_01_v2_boots', 'stone': 'monster_loot_desert_sand_giant', 'ricochet': 'jewel_sapphire',
    'repulsion': 'ring_02', 'slipstream': 'armor_02_v2_chestplate', 'bloodroot': 'ring_03',
    'echo': 'monster_loot_snow_boar', 'hunter': 'key_hell_chest_big', 'spite': 'food_01',
}

def main():
    UI_OUT.mkdir(parents=True, exist_ok=True)
    ICON_OUT.mkdir(parents=True, exist_ok=True)
    for name, (src, box) in CROPS.items():
        im = Image.open(src).convert('RGBA')
        (im.crop(box) if box else im).save(UI_OUT / f'{name}.png')
    for relic, strip in RELIC_STRIPS.items():
        Image.open(TINY / f'{strip}.png').convert('RGBA').save(ICON_OUT / f'{relic}.png')
    # Pack Sigil uses the static Ninja Adventure stamp, repeated to match the strip format.
    static_strip(NINJA / 'Other/Stamp.png').save(ICON_OUT / 'pack.png')
    for relic in ('resonance', 'drum', 'veil'):
        assert (ICON_OUT / f'{relic}.png').exists(), f'missing hand-made icon {relic}.png'
    UPGRADE_OUT.mkdir(parents=True, exist_ok=True)
    for upgrade, (kind, src) in UPGRADE_ICONS.items():
        if kind == 'tiny': im = Image.open(TINY / f'{src}.png').convert('RGBA')
        elif kind == 'sheet': im = Image.open(SHEETS / f'{src}.png').convert('RGBA')
        else: im = static_strip(NINJA / src)
        assert im.size == (256, 16), (upgrade, im.size)
        im.save(UPGRADE_OUT / f'{upgrade}.png')
    upgrade_ids = sorted(UPGRADE_ICONS)
    manifest_ids = 'window.UPGRADE_ICON_IDS=' + json.dumps(upgrade_ids) + ';\n'
    FX_OUT.mkdir(parents=True, exist_ok=True)
    for src, name in [('fx/spark_04.png', 'spark_04.png'), ('particle/gem_broken_yellow.png', 'gem_broken_yellow.png'), ('particle/rock_gray.png', 'rock_gray.png')]:
        Image.open(VFXMIX / src).convert('RGBA').save(FX_OUT / name)
    manifest = {}
    for key in FX_FROM_JSON:
        j = json.loads((SHEETS / f'{key}.json').read_text())
        manifest[key] = {'src': f'assets/fx/sheets/{j["image"]}', 'fw': j['frame_width'], 'fh': j['frame_height'], 'n': j['frame_count'],
                         'fps': j.get('fps') or 1, 'loop': bool(j.get('loop')), 'ax': j['anchor']['x'], 'ay': j['anchor']['y']}
    for key, (src, fw, fh, n, fps, loop, ax, ay) in FX_EXTRA.items():
        manifest[key] = {'src': src, 'fw': fw, 'fh': fh, 'n': n, 'fps': fps, 'loop': loop, 'ax': ax, 'ay': ay}
    manifest['Damage_Digits'] = digit_strip()
    (ROOT / 'survivor-fx-manifest.js').write_text('// Generated by scripts/build-ui-assets.py from assets/fx/sheets/*.json. Do not edit.\nwindow.FX_SHEETS=' + json.dumps(manifest, separators=(',', ':')) + ';\n' + manifest_ids)
    print('wrote', sorted(p.name for p in UI_OUT.iterdir()), sorted(p.name for p in ICON_OUT.iterdir()))

if __name__ == '__main__':
    main()
