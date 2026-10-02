"""Embed the sprites and font used by prototypes/bestiary/ as data URIs.

The prototypes open from file://, from scripts/serve.py or from a pasted preview, so they
cannot rely on relative asset paths. Run from the repo root:

    python3 scripts/build-bestiary-prototype-assets.py
"""
import base64
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'prototypes' / 'bestiary' / 'bestiary-assets.js'
A = 'assets/Ninja Adventure - Asset Pack/Actor/'
FONT = 'assets/ui/font_medium_9px.ttf'

WALK4 = [(0, 0), (0, 1), (0, 2), (0, 3)]      # 4x4 sheets: column 0 is facing south, rows are walk steps
WALK_CHAR = [(0, 1), (0, 2), (0, 3), (0, 4)]  # 64x112 character sheets: row 0 idles, rows 1-4 walk
PAIR = [(0, 0), (1, 0)]                       # two-frame sheets (Cat, Frog, Lion)

# id: (sheet, faceset or None, frame width, frame height, frames)
SPRITES = {
    # Capturable creatures
    'cat': (A + 'Animals/CatCyclop/SpriteSheet.png', A + 'Animals/CatCyclop/Faceset.png', 16, 16, PAIR),
    'owl': (A + 'Monsters/Arcane/Tier1/Owl/Owl.png', A + 'Monsters/Arcane/Tier1/Owl/Faceset.png', 16, 16, WALK4),
    'beast': (A + 'Monsters/Feral/Tier1/Beast/Beast.png', A + 'Monsters/Feral/Tier1/Beast/Faceset.png', 16, 16, WALK4),
    'frog': (A + 'Animals/Frog/SpriteSheet.png', A + 'Animals/Frog/Faceset.png', 16, 16, PAIR),
    'mouse': (A + 'Monsters/Arcane/Tier1/MouseBlack/SpriteSheet.png', A + 'Monsters/Arcane/Tier1/MouseBlack/Faceset.png', 16, 16, WALK4),
    'mole': (A + 'Monsters/Bloom/Tier1/Mole/Mole.png', A + 'Monsters/Bloom/Tier1/Mole/Faceset.png', 16, 16, WALK4),
    'bear': (A + 'Monsters/Feral/Tier2/Bear/SpriteSheet.png', A + 'Monsters/Feral/Tier2/Bear/Faceset.png', 16, 16, WALK4),
    'salamander': (A + 'Monsters/Feral/Tier1/Lizard/Lizard.png', A + 'Monsters/Feral/Tier1/Lizard/Faceset.png', 16, 16, WALK4),
    'spider': (A + 'Monsters/Feral/Tier2/SpiderRed/SpriteSheet.png', A + 'Monsters/Feral/Tier2/SpiderRed/Faceset.png', 16, 16, WALK4),
    'storm': (A + 'Monsters/Feral/Tier1/Lizard2/Lizard2.png', A + 'Monsters/Feral/Tier1/Lizard2/Faceset.png', 16, 16, WALK4),
    'mollusc': (A + 'Monsters/Mollusc/Mollusc.png', A + 'Monsters/Mollusc/Faceset.png', 16, 16, WALK4),
    # Evolutions
    'octopus': (A + 'Monsters/Octopus/SpriteSheet.png', A + 'Monsters/Octopus/Faceset.png', 16, 16, WALK4),
    'reptile': (A + 'Monsters/Feral/Tier2/Reptile/Reptile.png', A + 'Monsters/Feral/Tier2/Reptile/Faceset.png', 16, 16, WALK4),
    'tengu': (A + 'Monsters/Arcane/Tier2/Tengu/SpriteSheet.png', A + 'Monsters/Arcane/Tier2/Tengu/Faceset.png', 16, 28, WALK4),
    'axolotl': (A + 'Monsters/Axolot/SpriteSheet.png', A + 'Monsters/Axolot/Faceset.png', 16, 16, WALK4),
    # Foes
    'shaman': ('assets/Enemies/shaman_yellow.png', None, 16, 16, WALK_CHAR),
    'shamanGreen': ('assets/Enemies/shaman_green.png', None, 16, 16, WALK_CHAR),
    'shamanBlue': ('assets/Enemies/shaman_blue.png', None, 16, 16, WALK_CHAR),
    'hunter': (A + 'Characters/Hunter/SpriteSheet.png', A + 'Characters/Hunter/Faceset.png', 16, 16, WALK_CHAR),
    'skeleton': (A + 'Characters/Skeleton/SpriteSheet.png', A + 'Characters/Skeleton/Faceset.png', 16, 16, WALK_CHAR),
    'lion': (A + 'Animals/Lion/SpriteSheetYellow.png', None, 16, 23, PAIR),
    'golem': ('assets/Enemies/golem.png', None, 16, 16, WALK_CHAR),
    'golemForest': ('assets/Enemies/golem_forest.png', None, 16, 16, WALK_CHAR),
    'golemEnergy': ('assets/Enemies/golem_energy.png', None, 16, 16, WALK_CHAR),
    'demon': ('assets/Enemies/DemonRed/SpriteSheet.png', 'assets/Enemies/DemonRed/Faceset.png', 16, 16, WALK_CHAR),
    'demonGreen': ('assets/Enemies/DemonGreen/SpriteSheet.png', 'assets/Enemies/DemonGreen/Faceset.png', 16, 16, WALK_CHAR),
    'mage': ('assets/Enemies/NinjaMageOrange/SpriteSheet.png', 'assets/Enemies/NinjaMageOrange/Faceset.png', 16, 16, WALK_CHAR),
    'mageBlack': ('assets/Enemies/NinjaMageBlack/SpriteSheet.png', 'assets/Enemies/NinjaMageBlack/Faceset.png', 16, 16, WALK_CHAR),
    'gladiator': (A + 'Characters/RedGladiator/SpriteSheet.png', A + 'Characters/RedGladiator/Faceset.png', 16, 16, WALK_CHAR),
    'guardian': (A + 'Boss/DemonCyclop/Walk.png', A + 'Boss/DemonCyclop/Faceset.png', 50, 50, [(i, 0) for i in range(6)]),
}


def data_uri(path, mime):
    return f'data:{mime};base64,' + base64.b64encode((ROOT / path).read_bytes()).decode()


def png_size(path):
    header = (ROOT / path).read_bytes()[:24]
    return struct.unpack('>II', header[16:24])


sprites = {}
for key, (sheet, face, fw, fh, frames) in SPRITES.items():
    w, h = png_size(sheet)
    for col, row in frames:
        assert (col + 1) * fw <= w and (row + 1) * fh <= h, f'{key}: frame {col},{row} outside {w}x{h}'
    sprites[key] = {'sheet': data_uri(sheet, 'image/png'), 'w': w, 'h': h, 'fw': fw, 'fh': fh,
                    'frames': [list(f) for f in frames], 'face': data_uri(face, 'image/png') if face else None}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text('// Generated by scripts/build-bestiary-prototype-assets.py. Do not edit.\n'
               'window.BESTIARY_ASSETS=' + json.dumps({'font': data_uri(FONT, 'font/ttf'), 'sprites': sprites},
                                                      separators=(',', ':')) + ';\n')
print(f'{OUT.relative_to(ROOT)}: {len(sprites)} sprites, {OUT.stat().st_size // 1024} KB')
