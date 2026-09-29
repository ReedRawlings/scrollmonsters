#!/usr/bin/env python3
"""Copy the DarkMode UI pieces and relic spin icons the survivors UI uses into the repo.

Sources are the purchased packs in ~/Downloads. The licenses allow shipping the art inside
the game but not redistributing the packs, so only the used crops are copied.
"""
from pathlib import Path
from PIL import Image

HOME = Path.home() / 'Downloads'
PIX = HOME / 'Pixelarium - Interfaces Bundle - Full version/Pack Content'
DARK = PIX / 'DarkMode Interface'
ZELDA = PIX / 'Zelda-Like Interface'
TINY = HOME / 'Tiny Dungeons - Items Pack/Tiny Dungeons - Items Pack/items/procedural_animations'
ROOT = Path(__file__).resolve().parent.parent
NINJA = ROOT / 'assets/Ninja Adventure - Asset Pack/Items'
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
    # Pack Sigil uses the static Ninja Adventure stamp, centred in 16x16 and repeated to match the strip format.
    stamp = Image.open(NINJA / 'Other/Stamp.png').convert('RGBA')
    strip = Image.new('RGBA', (256, 16))
    for i in range(16):
        strip.alpha_composite(stamp, (i * 16 + (16 - stamp.width) // 2, (16 - stamp.height) // 2))
    strip.save(ICON_OUT / 'pack.png')
    for relic in ('resonance', 'drum', 'veil'):
        assert (ICON_OUT / f'{relic}.png').exists(), f'missing hand-made icon {relic}.png'
    print('wrote', sorted(p.name for p in UI_OUT.iterdir()), sorted(p.name for p in ICON_OUT.iterdir()))

if __name__ == '__main__':
    main()
