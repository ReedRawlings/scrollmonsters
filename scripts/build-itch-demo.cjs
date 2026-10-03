const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist', 'scrollmonsters-demo');
const zipFile = path.join(root, 'dist', 'scrollmonsters-demo.zip');
const copy = relative => {
  const source = path.join(root, relative);
  if (!fs.existsSync(source)) throw Error(`Missing demo asset: ${relative}`);
  const target = path.join(output, relative);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.cpSync(source, target, {recursive: true});
};

fs.rmSync(output, {recursive: true, force: true});
fs.mkdirSync(output, {recursive: true});
const html = fs.readFileSync(path.join(root, 'survivors.html'), 'utf8')
  .replace('</head>', '<script>window.SCROLLMONSTERS_DEMO=true</script>\n</head>');
for (const name of ['index.html', 'survivors.html']) fs.writeFileSync(path.join(output, name), html);
for (const [, script] of html.matchAll(/<script src="([^"]+)"/g)) {
  if (script !== 'assets/music/playlist.js') copy(script.split('?')[0]);
}
copy('survivor-runs.html');
copy('survivor-runs.js');
copy('demo.html');
copy('vendor/PHASER-LICENSE.md');

// Copy runtime assets only. itch accepts at most 1,000 extracted files per HTML game.
const A = 'assets/Ninja Adventure - Asset Pack/';
const assets = new Set([
  'assets/player/grasslands',
  'assets/MapAssets/Greens/tilemap.png',
  'assets/MapAssets/Greens/garden_objects_atlas-export.png',
  'assets/MapAssets/Greens/MonsterDen.png',
  'assets/ui/xp_gem.png', 'assets/ui/font_medium_9px.ttf',
  ...['panel','slot','pill','banner','status','zslot','heart'].map(name => `assets/ui/darkmode/${name}.png`),
  ...['impact_hit_1','slash_whirlwind','impact_dust_dash'].map(name => `assets/SoggySocks Combat FX/PNG/${name}_sheet.png`),
  'assets/SoggySocks Earth FX/PNG/impact_earth_3_sheet.png',
  'assets/SoggySocks Water FX/PNG/impact_water_sheet.png',
  ...['shaman_yellow.png','shaman_green.png','shaman_blue.png','golem.png','golem_forest.png','golem_energy.png',
    'DemonRed/SpriteSheet.png','DemonGreen/SpriteSheet.png','NinjaMageOrange/SpriteSheet.png','NinjaMageBlack/SpriteSheet.png']
    .map(name => `assets/Enemies/${name}`),
  ...['TilesetDungeon.png','TilesetFloor.png','TilesetNature.png']
    .map(name => A+`Backgrounds/Tilesets/${name}`),
  ...['Elemental/Explosion/SpriteSheet.png','Projectile/Fireball.png','Elemental/Thunder/SpriteSheet.png',
    'Particle/Fire.png','SlashFx/Slash/SpriteSheet.png','Projectile/Arrow.png','Projectile/EnergyBall.png']
    .map(name => A+`FX/${name}`),
  ...['Treasure/LittleTreasureChest.png','Weapons/Bone/Sprite.png','Scroll/ScrollThunder.png',
    'Resource/feather.png','Potion/Heart.png','Weapons/Sword/SpriteInHand.png','Weapons/Axe/SpriteInHand.png']
    .map(name => A+`Items/${name}`),
  ...['Monsters/Arcane/Tier1/MouseBlack/SpriteSheet.png','Monsters/Feral/Tier2/Bear/SpriteSheet.png',
    'Monsters/Bloom/Tier1/Mole/Mole.png','Monsters/Feral/Tier1/Lizard/Lizard.png',
    'Monsters/Feral/Tier1/Lizard2/Lizard2.png','Monsters/Feral/Tier2/SpiderRed/SpriteSheet.png',
    'Animals/Frog/SpriteSheet.png','Boss/DemonCyclop2/Walk.png','Boss/DemonCyclop/Walk.png',
    'Animals/CatCyclop/SpriteSheet.png',
    'Monsters/Feral/Tier1/Bat/SpriteSheet.png','Monsters/Feral/Tier1/Beast/Beast.png',
    'Monsters/Arcane/Tier1/Owl/Owl.png','Characters/Hunter/SpriteSheet.png',
    'Characters/Skeleton/SpriteSheet.png','Characters/RedGladiator/SpriteSheet.png',
    'Animals/Lion/SpriteSheetYellow.png','Monsters/Mollusc/Mollusc.png',
    'Monsters/Octopus/SpriteSheet.png','Monsters/Feral/Tier2/Reptile/Reptile.png',
    'Monsters/Arcane/Tier2/Tengu/SpriteSheet.png','Monsters/Axolot/SpriteSheet.png']
    .map(name => A+`Actor/${name}`),
  ...['Animals/CatCyclop','Monsters/Arcane/Tier1/Owl',
    'Monsters/Feral/Tier1/Beast','Animals/Frog','Monsters/Arcane/Tier1/MouseBlack',
    'Monsters/Bloom/Tier1/Mole','Monsters/Feral/Tier2/Bear','Monsters/Feral/Tier1/Lizard',
    'Monsters/Feral/Tier2/SpiderRed','Monsters/Feral/Tier1/Lizard2','Monsters/Mollusc',
    'Monsters/Octopus','Monsters/Feral/Tier2/Reptile','Monsters/Arcane/Tier2/Tengu',
    'Monsters/Axolot'].map(name => A+`Actor/${name}/Faceset.png`)
]);
const fxContext = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'survivor-fx-manifest.js'), 'utf8'), fxContext);
for (const {src} of Object.values(fxContext.window.FX_SHEETS)) assets.add(src);
for (const directory of ['assets/icons/relics','assets/icons/upgrades']) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    if (/\.(png|svg)$/.test(name)) assets.add(`${directory}/${name}`);
  }
}
for (const asset of assets) copy(asset);
copy('assets/Ninja Adventure - Asset Pack/Audio/Sounds/Menu/Accept4.wav');
copy('assets/Ninja Adventure - Asset Pack/LICENSE.txt');

const musicContext = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/music/playlist.js'), 'utf8'), musicContext);
const music = musicContext.window.GAME_MUSIC;
for (const track of [...music.combat, ...music.menu]) copy('assets/music/' + track);
fs.writeFileSync(path.join(output, 'assets/music/playlist.js'), 'window.GAME_MUSIC = ' + JSON.stringify(music) + ';\n');
fs.writeFileSync(path.join(output, 'README.txt'),
  'ScrollMonsters demo: a browser game with a guardian encounter at 9:30. Defeat the guardian to finish. Upload scrollmonsters-demo.zip to itch.io as an HTML game.\n' +
  'The archive opens at index.html. Move with WASD/arrows or touch; Space dashes. Break a den, then stand in the capture ring to recruit or evolve.\n' +
  'This forest-only build starts with Cat. Capture Owl, Frog, Storm Lizard and Mollusc during a run to discover Octopus, Tengu and Axolotl evolutions.\n');
fs.rmSync(zipFile, {force: true});
const zipped = spawnSync('zip', ['-qr', zipFile, '.'], {cwd: output, encoding: 'utf8'});
if (zipped.status !== 0) throw Error(zipped.stderr || 'zip failed');
const count = spawnSync('unzip', ['-Z1', zipFile], {encoding: 'utf8'}).stdout.trim().split('\n').filter(name => name && !name.endsWith('/')).length;
if (count > 1000) throw Error(`itch HTML game limit exceeded: ${count} files`);
const size = (fs.statSync(zipFile).size / 1048576).toFixed(1);
console.log(`Built ${zipFile} (${size} MiB, ${count} files)`);
