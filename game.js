(() => {
  "use strict";

  function createGame(scene = null) {
  const canvas = scene ? scene.game.canvas : document.getElementById("game");
  const ctx = scene ? window.createPhaserRenderer(scene) : canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  let uiTargets = [];
  let upgradeBranch = 0;
  let selectedUpgrade = null;
  let bestiaryAffinity = "feral";
  let bestiaryTier = 1, bestiaryPage = 0;
  const SAVE_KEY = window.UPGRADE_TREE_PROTOTYPE ? "scollmonsters-upgrade-prototype-v1" : "scollmonsters-save-v2";
  const LEGACY_SAVE_KEY = window.UPGRADE_TREE_PROTOTYPE ? "scollmonsters-upgrade-prototype-legacy" : "scollmonsters-save-v1";
  const FIXED_STEP = 1 / 60;
  const COMBAT_SPRITE_SIZE = 32; // 16px frames at crisp 2x scale.
  // Shared menu styling. Keep these values aligned with UI_STYLE_GUIDE.md.
  const UI_THEME = Object.freeze({
    colors: Object.freeze({
      field: "#5c9855", path: "#b8895a", speck: "#5b684466",
      title: "#fff0b0", text: "#fff5d7", muted: "#e2ccb0",
      dark: "#30221a", locked: "#463c32", accent: "#ffd36b",
      feral: "#ef5266", bloom: "#4ac56b", arcane: "#5ed5f2"
    }),
    slices: Object.freeze({
      panel: Object.freeze({ x: 7, y: 7, scale: 2 }),
      button: Object.freeze({ x: 7, y: 3, scale: 2 }),
      tab: Object.freeze({ x: 7, y: 5, scale: 2 }),
      focus: Object.freeze({ x: 3, y: 3, scale: 2 })
    }),
    currencyRows: Object.freeze({ gold: 0, feral: 1, bloom: 2, arcane: 3 })
  });

  const assetPaths = {
    player: "player.svg", striker: "creature-striker.svg", healer: "creature-healer.svg", aoe: "creature-aoe.svg",
    basic: "enemy-basic.svg", armored: "enemy-armored.svg", ranged: "enemy-ranged.svg", boss: "boss.svg",
    gold: "gold.svg", heart: "heart.svg", heal: "heal.svg", crosshair: "crosshair.svg", autoTarget: "auto-target.svg",
    lock: "lock.svg", nodeComplete: "node-complete.svg", nodeOpen: "node-open.svg", playerShot: "projectile-player.svg",
    enemyShot: "projectile-enemy.svg", impact: "impact.svg", grass: "grass-tile.svg", path: "path-tile.svg",
    autoAttackBook: "assets/Ninja Adventure - Asset Pack/Ui/Skill Icon/Spell/BookRock.png",
    autoAttackBookDisabled: "assets/Ninja Adventure - Asset Pack/Ui/Skill Icon/Spell/BookRockDisabled.png",
    particleRain: "assets/Ninja Adventure - Asset Pack/FX/Particle/Rain.png",
    particleSplash: "assets/Ninja Adventure - Asset Pack/FX/Particle/RainOnFloor.png",
    particleLeaf: "assets/Ninja Adventure - Asset Pack/FX/Particle/Leaf.png",
    particleRock: "assets/Ninja Adventure - Asset Pack/FX/Particle/Rock.png",
    particleWood: "assets/Ninja Adventure - Asset Pack/FX/Particle/Wood.png",
    abandonedProps: "assets/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetVillageAbandoned.png",
    overworldMap: "assets/scenery/overworld.png",
    sceneryDesert: "assets/scenery/04-desert-path.png",
    sceneryStone: "assets/scenery/05-stone-path.png",
    particleVase: "assets/Ninja Adventure - Asset Pack/FX/Particle/Vase.png",
    propTiles: "assets/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetElement.png",
    sceneryMeadow: "assets/scenery/01-open-meadow.png",
    sceneryForest: "assets/scenery/02-forest-corridor.png",
    sceneryRocky: "assets/scenery/03-rocky-trail.png",
    natureTiles: "assets/Ninja Adventure - Asset Pack/Backgrounds/Tilesets/TilesetNature.png",
    earthProjectile: "assets/SoggySocks Earth FX/PNG/proj_earth_1_sheet.png",
    groundTrap: "assets/SoggySocks Combat FX/PNG/ground_trap_sheet.png",
    earthImpact: "assets/SoggySocks Earth FX/PNG/impact_earth_3_sheet.png",
    playerWalk: "assets/Ninja Adventure - Asset Pack/Actor/Characters/EggBoy/SeparateAnim/Walk.png",
    playerAttack: "assets/Ninja Adventure - Asset Pack/Actor/Characters/EggBoy/SeparateAnim/Attack.png",
    monsterBasic: "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier1/Bamboo/SpriteSheet.png",
    monsterRanged: "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Axolot/SpriteSheet.png",
    woodBackground: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/nine_path_bg.png",
    woodPanel: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/nine_path_panel.png",
    woodDisabled: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/nine_path_panel_disabled.png",
    woodInventoryCell: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/inventory_cell.png",
    woodTabSelected: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/tab_selected.png",
    woodTabUnselected: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/tab_unselected.png",
    woodButton: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/button_normal.png",
    woodButtonHover: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/button_hover.png",
    woodButtonDisabled: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/button_disabled.png",
    woodFocus: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/nine_path_focus.png",
    healthVessel: "assets/Ninja Adventure - Asset Pack/Ui/Receptacle/Receptacle Rectangle/BackgroundWood.png",
    healthFill: "assets/Ninja Adventure - Asset Pack/Ui/Receptacle/Receptacle Rectangle/ProgressHealth.png",
    coinDrop: "assets/Ninja Adventure - Asset Pack/Items/Treasure/Coin2-Sheet.png",
    treasureChest: "assets/Ninja Adventure - Asset Pack/Items/Treasure/LittleTreasureChest.png",
    demonWalk: "assets/Ninja Adventure - Asset Pack/Actor/Boss/DemonCyclop/Walk.png",
    demonHit: "assets/Ninja Adventure - Asset Pack/Actor/Boss/DemonCyclop/Hit.png",
    monsterArmored: "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier1/Beast/Beast.png",
    currencySheet: "assets/Ninja Adventure - Asset Pack/Items/Treasure/Coin2-Sheet.png",
    petRoster: "assets/Sprites/Pets/minimize_F-Sheet.png",
    petFangle: "assets/Sprites/Pets/Fangle.png",
    petButtermant: "assets/Sprites/Pets/buttermant.png",
    petTinmin: "assets/Sprites/Pets/tinmin.png"
  };
  const destructibleVariants = [
    { id: "clay-vase", sheet: "propTiles", x: 4, y: 1, material: "vase" },
    { id: "round-vase", sheet: "propTiles", x: 5, y: 1, material: "vase" },
    { id: "wood-crate", sheet: "propTiles", x: 0, y: 0, material: "wood" },
    { id: "moss-vase", sheet: "abandonedProps", x: 5, y: 4, material: "vase" },
    { id: "old-vase", sheet: "abandonedProps", x: 12, y: 11, material: "vase" },
    { id: "discarded-crate", sheet: "abandonedProps", x: 9, y: 11, material: "wood" }
  ];
  const nodeIconPaths = {
    power: "Spell/BookRock", speed: "Items & Weapon/Boot", multishot: "Spell/BookFire",
    power3: "Spell/BookRock", boulderBuster: "Job & Action/Mine", health: "Spell/Heal", rockBreaker: "Job & Action/Mine", tripleSpark: "Spell/BookThunder",
    magnet: "Job & Action/Harvest", autoTarget: "Spell/BookLight", travelSpeed: "Items & Weapon/Boot",
    strikerPower: "Job & Action/Punch", strikerSpeed: "Items & Weapon/Boot", strikerDouble: "Spell/BookFire",
    strikerTriple: "Spell/BookThunder", strikerFollowup: "Spell/BookDeath", strikerFollowupHeal: "Spell/Heal",
    healPower: "Spell/Heal", healSpeed: "Items & Weapon/Boot", partyBond: "Spell/BookPlant",
    deepBloom: "Spell/BookPlant", bloomShield: "Items & Weapon/Armor", aoePower: "Spell/BookThunder", aoeRadius: "Spell/BookWind"
  };
  for (const [id, path] of Object.entries(nodeIconPaths)) {
    assetPaths[`node_${id}`] = `assets/Ninja Adventure - Asset Pack/Ui/Skill Icon/${path}.png`;
    assetPaths[`node_${id}_off`] = `assets/Ninja Adventure - Asset Pack/Ui/Skill Icon/${path}Disabled.png`;
  }
  // Explicit base/shiny pairs; prefer SeparateAnim/Walk.png over full action atlases.
  // SpiritLarge has no paired variant and is intentionally excluded.
  const monsterCatalog = [
  {
    "id": "feral-bat",
    "name": "Bat",
    "affinityId": "feral",
    "tier": 1,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier1/Bat/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier1/BlueBat/SpriteSheet.png",
    "shinyName": "BlueBat",
    "petType": "striker"
  },
  {
    "id": "feral-beast",
    "name": "Beast",
    "affinityId": "feral",
    "tier": 1,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier1/Beast/Beast.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier1/Beast2/Beast2.png",
    "shinyName": "Beast2",
    "petType": "striker"
  },
  {
    "id": "feral-lizard",
    "name": "Lizard",
    "affinityId": "feral",
    "tier": 1,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier1/Lizard/Lizard.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier1/Lizard2/Lizard2.png",
    "shinyName": "Lizard2",
    "petType": "striker"
  },
  {
    "id": "feral-bear",
    "name": "Bear",
    "affinityId": "feral",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier2/Bear/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier2/BearGreen/SpriteSheetGreenbear.png",
    "shinyName": "BearGreen",
    "petType": "striker"
  },
  {
    "id": "feral-gladiator",
    "name": "Gladiator",
    "affinityId": "feral",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier2/Gladiator/SeparateAnim/Walk.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier2/RedGladiator/SeparateAnim/Walk.png",
    "shinyName": "RedGladiator",
    "petType": "striker"
  },
  {
    "id": "feral-reptile",
    "name": "Reptile",
    "affinityId": "feral",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier2/Reptile/Reptile.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier2/Reptile2/Reptile2.png",
    "shinyName": "Reptile2",
    "petType": "striker"
  },
  {
    "id": "feral-spiderred",
    "name": "SpiderRed",
    "affinityId": "feral",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier2/SpiderRed/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier2/SpiderYellow/SpriteSheet.png",
    "shinyName": "SpiderYellow",
    "petType": "striker"
  },
  {
    "id": "feral-dragon",
    "name": "Dragon",
    "affinityId": "feral",
    "tier": 3,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier3/Dragon/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier3/DragonYellow/SpriteSheet.png",
    "shinyName": "DragonYellow",
    "petType": "striker"
  },
  {
    "id": "feral-knight",
    "name": "Knight",
    "affinityId": "feral",
    "tier": 3,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier3/Knight/SeparateAnim/Walk.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier3/KnightGold/SeparateAnim/Walk.png",
    "shinyName": "KnightGold",
    "petType": "striker"
  },
  {
    "id": "feral-monkey",
    "name": "Monkey",
    "affinityId": "feral",
    "tier": 3,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier3/Monkey/SeparateAnim/Walk.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier3/MonkeyBoxerBlue/SeparateAnim/Walk.png",
    "shinyName": "MonkeyBoxerBlue",
    "petType": "striker"
  },
  {
    "id": "feral-trex",
    "name": "TRex",
    "affinityId": "feral",
    "tier": 3,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier3/TRex/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Feral/Tier3/Grey Trex/SpriteSheet.png",
    "shinyName": "Grey Trex",
    "petType": "striker"
  },
  {
    "id": "bloom-bamboo",
    "name": "Bamboo",
    "affinityId": "bloom",
    "tier": 1,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier1/Bamboo/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier1/BambooYellow/SpriteSheet.png",
    "shinyName": "BambooYellow",
    "petType": "healer"
  },
  {
    "id": "bloom-fish",
    "name": "Fish",
    "affinityId": "bloom",
    "tier": 1,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier1/Fish/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier1/FishRed/SpriteSheet.png",
    "shinyName": "FishRed",
    "petType": "healer"
  },
  {
    "id": "bloom-mole",
    "name": "Mole",
    "affinityId": "bloom",
    "tier": 1,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier1/Mole/Mole.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier1/Mole2/Mole2.png",
    "shinyName": "Mole2",
    "petType": "healer"
  },
  {
    "id": "bloom-butterfly",
    "name": "Butterfly",
    "affinityId": "bloom",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier2/Butterfly/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier2/ButterflyBlue/SpriteSheet.png",
    "shinyName": "ButterflyBlue",
    "petType": "healer"
  },
  {
    "id": "bloom-mushroom",
    "name": "Mushroom",
    "affinityId": "bloom",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier2/Mushroom/mushroom.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier2/Mushroom2/mushroom2.png",
    "shinyName": "Mushroom2",
    "petType": "healer"
  },
  {
    "id": "bloom-panda",
    "name": "Panda",
    "affinityId": "bloom",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier2/Panda/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier2/PandaBlue/PandaBlueSpriteSheet.png",
    "shinyName": "PandaBlue",
    "petType": "healer"
  },
  {
    "id": "bloom-racoon",
    "name": "Racoon",
    "affinityId": "bloom",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier2/Racoon/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier2/GoldRacoon/SpriteSheet.png",
    "shinyName": "GoldRacoon",
    "petType": "healer"
  },
  {
    "id": "bloom-heartgreen",
    "name": "HeartGreen",
    "affinityId": "bloom",
    "tier": 3,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier3/HeartGreen/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier3/HeartRed/SpriteSheet.png",
    "shinyName": "HeartRed",
    "petType": "healer"
  },
  {
    "id": "bloom-kappagreen",
    "name": "KappaGreen",
    "affinityId": "bloom",
    "tier": 3,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier3/KappaGreen/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier3/KappaRed/SpriteSheet.png",
    "shinyName": "KappaRed",
    "petType": "healer"
  },
  {
    "id": "bloom-maskracoon",
    "name": "MaskRacoon",
    "affinityId": "bloom",
    "tier": 3,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier3/MaskRacoon/SeparateAnim/Walk.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier3/MaskGoldRacoon/SeparateAnim/Walk.png",
    "shinyName": "MaskGoldRacoon",
    "petType": "healer"
  },
  {
    "id": "bloom-shaman",
    "name": "Shaman",
    "affinityId": "bloom",
    "tier": 3,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier3/Shaman/SeparateAnim/Walk.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bloom/Tier3/ShamanLion/SeparateAnim/Walk.png",
    "shinyName": "ShamanLion",
    "petType": "healer"
  },
  {
    "id": "arcane-eye",
    "name": "Eye",
    "affinityId": "arcane",
    "tier": 1,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier1/Eye/Eye.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier1/Eye2/Eye2.png",
    "shinyName": "Eye2",
    "petType": "aoe"
  },
  {
    "id": "arcane-flam",
    "name": "Flam",
    "affinityId": "arcane",
    "tier": 1,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier1/Flam/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier1/Flam2/SpriteSheet.png",
    "shinyName": "Flam2",
    "petType": "aoe"
  },
  {
    "id": "arcane-lantern",
    "name": "Lantern",
    "affinityId": "arcane",
    "tier": 1,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier1/Lantern/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier1/LanternRed/SpriteSheet.png",
    "shinyName": "LanternRed",
    "petType": "aoe"
  },
  {
    "id": "arcane-mouse",
    "name": "Mouse",
    "affinityId": "arcane",
    "tier": 1,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier1/Mouse/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier1/MouseBlack/SpriteSheet.png",
    "shinyName": "MouseBlack",
    "petType": "aoe"
  },
  {
    "id": "arcane-owl",
    "name": "Owl",
    "affinityId": "arcane",
    "tier": 1,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier1/Owl/Owl.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier1/Owl2/Owl2.png",
    "shinyName": "Owl2",
    "petType": "aoe"
  },
  {
    "id": "arcane-skull",
    "name": "Skull",
    "affinityId": "arcane",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier2/Skull/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier2/SkullBlue/SpriteSheet.png",
    "shinyName": "SkullBlue",
    "petType": "aoe"
  },
  {
    "id": "arcane-slime",
    "name": "Slime",
    "affinityId": "arcane",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier2/Slime/Slime.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier2/Slime3/Slime3.png",
    "shinyName": "Slime3",
    "petType": "aoe"
  },
  {
    "id": "arcane-spirit",
    "name": "Spirit",
    "affinityId": "arcane",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier2/Spirit/SpriteSheet.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier2/Spirit2/SpriteSheet.png",
    "shinyName": "Spirit2",
    "petType": "aoe"
  },
  {
    "id": "arcane-tengu",
    "name": "Tengu",
    "affinityId": "arcane",
    "tier": 2,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier2/Tengu/SeparateAnim/Walk.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier2/Tengu2/SeparateAnim/Walk.png",
    "shinyName": "Tengu2",
    "petType": "aoe"
  },
  {
    "id": "arcane-demon",
    "name": "Demon",
    "affinityId": "arcane",
    "tier": 3,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier3/Demon/SeparateAnim/Walk.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier3/DemonRed/SeparateAnim/Walk.png",
    "shinyName": "DemonRed",
    "petType": "aoe"
  },
  {
    "id": "arcane-skeleton",
    "name": "Skeleton",
    "affinityId": "arcane",
    "tier": 3,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier3/Skeleton/SeparateAnim/Walk.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier3/SkeletonDemon/SeparateAnim/Walk.png",
    "shinyName": "SkeletonDemon",
    "petType": "aoe"
  },
  {
    "id": "arcane-statue",
    "name": "Statue",
    "affinityId": "arcane",
    "tier": 3,
    "walk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier3/Statue/SeparateAnim/Walk.png",
    "shinyWalk": "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Arcane/Tier3/GoldStatue/SeparateAnim/Walk.png",
    "shinyName": "GoldStatue",
    "petType": "aoe"
  }
];
  for (const creature of monsterCatalog) {
    assetPaths[creature.id] = creature.walk;
    assetPaths[`${creature.id}-shiny`] = creature.shinyWalk;
  }
  const assets = {};
  Object.entries(assetPaths).forEach(([key, file]) => {
    const image = new Image();
    image.onload = () => render();
    image.src = file.includes("/") ? file : `assets/placeholder/${file}`;
    assets[key] = image;
  });

  const roundTracks = window.GAME_MUSIC?.combat || [];
  const menuTracks = window.GAME_MUSIC?.menu || [];
  const menuTrack = menuTracks[0] || null;
  const music = typeof Audio === "undefined" ? null : new Audio();
  const soundEffects = typeof Audio === "undefined" ? {} : {
    select: new Audio("assets/Ninja Adventure - Asset Pack/Audio/Sounds/Menu/Accept4.wav"),
    success: new Audio("assets/Ninja Adventure - Asset Pack/Audio/Jingles/Success1.wav")
  };
  let audioUnlocked = false;
  let currentTrack = null;
  if (music) { music.loop = true; music.volume = 0.3; music.preload = "auto"; }
  Object.values(soundEffects).forEach(sound => { sound.volume = 0.55; sound.preload = "auto"; });
  function playAudio(sound) {
    if (sound && audioUnlocked && !document.hidden) sound.play()?.catch(() => {});
  }
  function setMusic(track) {
    if (!music) return;
    if (!track) { music.pause(); music.removeAttribute("src"); currentTrack = null; return; }
    if (track !== currentTrack) {
      music.pause();
      currentTrack = track;
      music.src = `assets/music/${track.split("/").map(encodeURIComponent).join("/")}`;
    }
    playAudio(music);
  }
  function unlockAudio() {
    audioUnlocked = true;
    if (!currentTrack) setMusic(menuTrack);
    else playAudio(music);
  }
  function playSound(name) {
    const sound = soundEffects[name];
    if (!sound) return;
    sound.currentTime = 0;
    playAudio(sound);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      music?.pause();
      Object.values(soundEffects).forEach(sound => sound.pause());
    } else playAudio(music);
  });

  const stageNames = ["Mossy Mile", "Pebble Pass", "Bramble Bend", "Amber Road", "Old Mill", "Fern Crossing", "Dusty Rise", "Rune Trail", "Moonlit Gate", "Crownroot Keep"];
  const stageConfigs = Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return {
      number,
      name: stageNames[index],
      duration: 30,
      hpMultiplier: number === 1 ? 1 : 2,
      bossHpMultiplier: number === 1 ? 1 : 0.8,
      // Durability accelerates as the party gains damage, extra shots, and companions.
      spawnRate: 1.495 / (1 + (number - 1) * 0.22),
      hpScale: [1, 1.495, 2, 3, 3, 3, 4, 7, 7, 7][index],
      bossHpScale: [28, 42, 47, 93, 128, 102, 129, 198, 223, 278][index] / (28 * (number === 5 || number === 10 ? 1.5 : 1)),
      damageScale: 0.855 + (number - 1) * 0.25 + (number - 1) ** 2 * 0.025,
      boss: true,
      majorBoss: number === 5 || number === 10
    };
  });

  const stageRosters = {
    1: [{ id: "feral-bat", chance: 0.8, type: "basic", baseHp: 2, baseDamage: 2 },
        { id: "bloom-bamboo", chance: 0.2, type: "basic", baseHp: 1, baseDamage: 1 }],
    2: [{ id: "feral-beast", chance: 0.2, type: "armored", baseHp: 3, baseDamage: 2 },
        { id: "feral-bat", chance: 0.5, type: "basic", baseHp: 2, baseDamage: 2 },
        { id: "bloom-bamboo", chance: 0.3, type: "basic", baseHp: 1, baseDamage: 1 }],
    3: [{ id: "feral-beast", chance: 0.2, type: "armored", baseHp: 3, baseDamage: 2 },
        { id: "feral-bat", chance: 0.5, type: "basic", baseHp: 2, baseDamage: 2 },
        { id: "bloom-bamboo", chance: 0.3, type: "basic", baseHp: 1, baseDamage: 1 }]
  };
  function rosterStats(entry, stage) {
    const openingBat = entry.id === "feral-bat" && stage.number <= 2;
    return {
      hp: precise((openingBat ? 2 : Math.round(entry.baseHp * stage.hpScale)) * stage.hpMultiplier),
      damage: openingBat ? 2 : Math.max(1, Math.round(entry.baseDamage * stage.damageScale))
    };
  }
  function pickStageMonster(stageNumber, roll, forcedType = null) {
    const roster = stageRosters[stageNumber];
    if (!roster || forcedType === "boss") return null;
    const candidates = forcedType ? roster.filter(entry => entry.type === forcedType) : roster;
    if (!candidates.length) return null;
    const total = candidates.reduce((sum, entry) => sum + entry.chance, 0);
    let threshold = 0;
    return candidates.find(entry => (threshold += entry.chance) > roll * total) || candidates[candidates.length - 1];
  }

  const affinityDefs = Object.freeze({
    feral: { id: "feral", name: "Feral", short: "FE", color: UI_THEME.colors.feral },
    bloom: { id: "bloom", name: "Bloom", short: "BE", color: UI_THEME.colors.bloom },
    arcane: { id: "arcane", name: "Arcane", short: "AE", color: UI_THEME.colors.arcane }
  });
  const affinityOrder = Object.keys(affinityDefs);
  const speciesDefs = Object.freeze({
    fanglet: { id: "fanglet", name: "Fanglet", affinityId: "feral", petType: "striker", density: [0.20, 0.25, 0.55, 0.25, 0.15, 0.40, 0.20, 0.25, 0.40, 0.20] },
    mossbud: { id: "mossbud", name: "Mossbud", affinityId: "bloom", petType: "healer", density: [0.08, 0.10, 0.10, 0.25, 0.50, 0.15, 0.35, 0.25, 0.12, 0.30] },
    tinmin: { id: "tinmin", name: "Tinmin", affinityId: "arcane", petType: "aoe", density: [0.04, 0.05, 0.05, 0.10, 0.08, 0.15, 0.15, 0.25, 0.25, 0.35] }
  });
  const creatureDefs = Object.freeze(monsterCatalog.map(c => ({ ...c, role: { striker: "Striker", healer: "Healer", aoe: "Area" }[c.petType], captureCost: [0,10,100,1000][c.tier], description: "Duplicates grant shiny fragments." })));
  const creatureById = id => creatureDefs.find(creature => creature.id === id);
  const petDisplayNames = Object.fromEntries(creatureDefs.map(creature => [creature.id, creature.name]));

  // Every ability compounds from its own starting price; rank 1 uses exponent zero.
  const abilityRankCosts = (baseCost, ranks) =>
    Array.from({ length: ranks }, (_, index) => Math.round(baseCost * 1.35 ** index));

  const damageRankCosts = abilityRankCosts(10, 10);

  const upgradeDefs = [
    { id: "power", name: "Damage +1", branch: "PLAYER", max: 10, costs: damageRankCosts, effect: rank => `+1 damage (${2 + rank + partyDamageBonus()} total)`, requires: [] },
    { id: "speed", name: "Quick Hands", branch: "PLAYER", max: 3, costs: abilityRankCosts(20, 3), effect: rank => `Fire interval -${10 * (rank + 1)}%`, requires: ["power"] },
    { id: "multishot", name: "Split Spark", branch: "PLAYER", max: 10, costs: abilityRankCosts(30, 10), effect: rank => `${10 * (rank + 1)}% second shot chance`, requires: ["speed"] },
    { id: "health", name: "Health +5", branch: "PLAYER", max: 10, costs: damageRankCosts, effect: rank => `+5 health → ${15 + rank * 5} HP`, requires: ["power"] },
    { id: "magnet", name: "Golden Echo", branch: "PLAYER", max: 3, costs: abilityRankCosts(15, 3), effect: rank => `Battle gold +${10 * (rank + 1)}%`, requires: ["power"] },
    { id: "autoTarget", name: "Hunter's Eye", branch: "PLAYER", max: 1, costs: abilityRankCosts(25, 1), effect: () => "Unlock Space auto-target toggle", requires: ["magnet"] },
    { id: "strikerPower", name: "Feral Focus", branch: "STRIKER", max: 10, costs: damageRankCosts, effect: rank => `+1 damage (${2 + rank + partyDamageBonus()} total)`, requires: [], recruit: "striker" },
    { id: "strikerSpeed", name: "Feral Rhythm", branch: "STRIKER", max: 2, costs: abilityRankCosts(25, 2), effect: rank => `Attack cooldown -${15 * (rank + 1)}%`, requires: ["strikerPower"], recruit: "striker" },
    { id: "healPower", name: "Kind Bloom", branch: "HEALER", max: 3, costs: abilityRankCosts(20, 3), effect: rank => `+1 healing → ${3 + rank} HP`, requires: [], recruit: "healer" },
    { id: "healSpeed", name: "Bloom Rhythm", branch: "HEALER", max: 2, costs: abilityRankCosts(25, 2), effect: rank => `Heal cooldown -${15 * (rank + 1)}%`, requires: ["healPower"], recruit: "healer" },
    { id: "aoePower", name: "Nova Heart", branch: "AOE", max: 10, costs: abilityRankCosts(25, 10), effect: rank => `+1 damage (${4 + rank} total)`, requires: [], recruit: "aoe" },
    { id: "aoeRadius", name: "Wide Nova", branch: "AOE", max: 2, costs: abilityRankCosts(30, 2), effect: rank => `AOE radius +${22 * (rank + 1)}px`, requires: ["aoePower"], recruit: "aoe" }
  ];

  upgradeDefs.push(
    { id: "power3", name: "Damage +3", branch: "PLAYER", max: 5, costs: abilityRankCosts(50, 5), effect: level => `+3 player damage per rank (+${3 * (level + 1)} total)`, requires: ["power"], requiredRanks: { power: 5 } },
    { id: "boulderBuster", name: "Boulder Buster", branch: "PLAYER", max: 5, costs: abilityRankCosts(40, 5), effect: level => `Destroyed rocks fire ${level + 1} player projectile${level ? "s" : ""} in random directions`, requires: ["rockBreaker"] },
    { id: "partyBond", name: "Party Bond", branch: "PLAYER", recruit: "healer", max: 1, costs: [50], requires: [], effect: () => "+5 player & Fangle damage" },
    { id: "strikerDouble", name: "Double Attack", branch: "STRIKER", max: 10, costs: abilityRankCosts(30, 10), effect: rank => `${10 * (rank + 1)}% chance for all Feral creatures to attack twice`, requires: ["strikerSpeed"], recruit: "striker" },
    { id: "strikerTriple", name: "Triple Bite", branch: "STRIKER", max: 10, costs: abilityRankCosts(30, 10), effect: rank => `${10 * (rank + 1)}% third bite on double`, requires: ["strikerDouble"], requiredRanks: { strikerDouble: 5 }, recruit: "striker" },
    { id: "tripleSpark", name: "Triple Spark", branch: "PLAYER", max: 10, costs: abilityRankCosts(30, 10), effect: rank => `${10 * (rank + 1)}% third shot on split`, requires: ["multishot"], requiredRanks: { multishot: 5 } },
    { id: "rockBreaker", name: "Rock Breaker", branch: "PLAYER", max: 1, costs: abilityRankCosts(30, 1), effect: () => "Player shots damage rocks", requires: ["power"] },
    { id: "deepBloom", name: "Deep Bloom", branch: "HEALER", max: 5, costs: abilityRankCosts(30, 5), currency: "bloom", effect: rank => `${20 * (rank + 1)}% double heal below half HP`, requires: [], recruit: "healer" },
    { id: "bloomShield", name: "Bloom Guard", branch: "HEALER", max: 1, costs: [200], currency: "bloom", effect: () => "Deep Bloom: block next hit; 2s cooldown", requires: ["deepBloom"], requiredRanks: { deepBloom: 5 }, recruit: "healer" },
    { id: "travelSpeed", name: "Trail Pace", branch: "PLAYER", max: 10, costs: abilityRankCosts(20, 10), effect: rank => `Travel & spawns +${5 * (rank + 1)}%`, requires: ["magnet"] },
    { id: "strikerFollowup", name: "Follow-Up Bite", branch: "STRIKER", max: 5, costs: abilityRankCosts(30, 5), currency: "feral", effect: rank => `${20 * (rank + 1)}% extra bite on Fangle kill`, requires: [], recruit: "striker" },
    { id: "strikerFollowupHeal", name: "Mending Bite", branch: "STRIKER", max: 5, costs: abilityRankCosts(60, 5), currency: "feral", effect: rank => `Follow-Up Bite heals for ${rank + 1} HP`, requires: ["strikerFollowup"], requiredRanks: { strikerFollowup: 1 }, recruit: "striker" },
  );

  for (const [owner, branch, recruit] of [["player", "PLAYER", null], ["striker", "STRIKER", "striker"], ["healer", "HEALER", "healer"], ["aoe", "AOE", "aoe"]]) {
    upgradeDefs.push(
      { id: `${owner}CritChance`, name: "Crit Chance", branch, recruit, max: 10, costs: abilityRankCosts(20, 10), requires: [], effect: level => `${level + 1}% critical ${owner === "healer" ? "heal" : "hit"} chance` },
      { id: `${owner}CritDamage`, name: owner === "healer" ? "Crit Healing" : "Crit Damage", branch, recruit, max: 5, costs: abilityRankCosts(30, 5), requires: [`${owner}CritChance`], effect: level => `${110 + level * 10}% critical ${owner === "healer" ? "healing" : "damage"}` }
    );
  }

  const typeUpgradeIds = new Set(["strikerPower", "strikerSpeed", "strikerDouble", "strikerCritChance", "strikerCritDamage", "healerCritChance", "healerCritDamage", "aoeCritChance", "aoeCritDamage"]);
  const upgradeType = definition => typeUpgradeIds.has(definition.id) ? creatureById(definition.recruit)?.affinityId : null;
  const ownsUpgradeType = definition => state.save.ownedCreatures.some(id => creatureById(id)?.affinityId === upgradeType(definition));

  const balanceModel = Object.freeze({
    offenseShare: 0.35,
    expectedKillRate: 0.82,
    bossDamageWindow: 10,
    safetyFactor: 1.25,
    offensePath: [
      ["power", 1], ["speed", 1], ["power", 2], ["speed", 2],
      ["power", 3], ["multishot", 1], ["speed", 3], ["multishot", 2], ["power", 4], ["power", 5],
      ...Array.from({ length: 5 }, (_, index) => ["power", index + 6])
    ]
  });

  function expectedStageGold(stageNumber, travelRank = 0) {
    const stage = stageConfigs[stageNumber - 1];
    const regularWindow = stage.duration;
    const expectedSpawns = 1 + (regularWindow - 0.35 / (1 + travelRank * 0.05)) / (stage.spawnRate / (1 + travelRank * 0.05));
    return Math.round(1 + expectedSpawns * balanceModel.expectedKillRate);
  }

  function expectedCampaignGold(levelsPlayed) {
    let gold = 0;
    for (let stageNumber = 1; stageNumber <= Math.min(10, levelsPlayed); stageNumber += 1) {
      const expectedAttempts = stageNumber === 1 ? 2 : 1;
      gold += expectedStageGold(stageNumber) * expectedAttempts;
    }
    return gold;
  }

  const precise = value => Math.round(value * 1e6) / 1e6;
  const formatAmount = value => String(precise(value));
  const shotChance = level => Math.min(10, Math.max(0, level || 0)) / 10;
  const expectedProjectiles = upgrades => 1 + shotChance(upgrades.multishot) * (1 + shotChance(upgrades.tripleSpark));

  function playerDpsFor(upgrades, flatBonus = upgrades.partyBond ? 5 : 0) {
    const damage = 1 + (upgrades.power || 0) + flatBonus;
    const projectiles = expectedProjectiles(upgrades);
    const interval = 0.425 * (1 - (upgrades.speed || 0) * 0.1);
    return damage * projectiles / interval * (1 + Math.min(10, upgrades.playerCritChance || 0) / 100 * (Math.min(5, upgrades.playerCritDamage || 0) * 0.1));
  }

  function projectOffense(goldEarned) {
    const budget = Math.floor(goldEarned * balanceModel.offenseShare);
    const upgrades = {};
    let spent = 0;
    for (const [id, nextRank] of balanceModel.offensePath) {
      const definition = upgradeDefs.find(candidate => candidate.id === id);
      const cost = definition.costs[nextRank - 1];
      if (spent + cost > budget) break;
      spent += cost;
      upgrades[id] = nextRank;
    }
    return {
      budget,
      spent,
      upgrades,
      damage: 1 + (upgrades.power || 0),
      projectiles: expectedProjectiles(upgrades),
      fireInterval: 0.425 * (1 - (upgrades.speed || 0) * 0.1),
      dps: playerDpsFor(upgrades)
    };
  }

  function requiredStageDps(stageNumber) {
    const stage = stageConfigs[stageNumber - 1];
    const health = [1, 2, 3].map(value => Math.round(value * stage.hpScale));
    const weights = stageNumber === 1 ? [1, 0, 0] : stageNumber === 2 ? [0.78, 0, 0.22] : [0.55, 0.23, 0.22];
    const averageRegularHealth = stageRosters[stageNumber]
      ? stageRosters[stageNumber].reduce((total, entry) => total + rosterStats(entry, stage).hp / stage.hpMultiplier * entry.chance, 0)
      : health.reduce((total, value, index) => total + value * weights[index], 0);
    const bossMultiplier = stage.majorBoss ? 1.5 : 1;
    const bossHealth = precise(Math.round(28 * stage.bossHpScale * bossMultiplier) * stage.bossHpMultiplier);
    const regularDemand = averageRegularHealth / stage.spawnRate;
    const bossDemand = bossHealth / balanceModel.bossDamageWindow;
    return stage.hpMultiplier * balanceModel.safetyFactor * Math.max(regularDemand, bossDemand);
  }

  function balanceProjection(levelsPlayed, goldEarned = expectedCampaignGold(levelsPlayed)) {
    const enteringStage = Math.min(10, Math.max(1, levelsPlayed + 1));
    const offense = projectOffense(goldEarned);
    const requiredDps = requiredStageDps(enteringStage);
    return { levelsPlayed, enteringStage, goldEarned, ...offense, requiredDps, coverage: offense.dps / requiredDps };
  }

  // Fixed stage tuning from an explicit expected loadout, never the player's live save.
  function stageDpsEstimate(stageNumber) {
    const gold = expectedCampaignGold(stageNumber - 1);
    const offense = projectOffense(gold);
    const effectivePlayerDps = offense.damage / offense.fireInterval * (1 + (offense.projectiles - 1) * 0.65) * 0.75;
    const fangletDps = stageNumber >= 4 ? 2 / 1.05 : 0;
    const partyDps = effectivePlayerDps + fangletDps;
    return { stage: stageNumber, basicDamage: Math.max(1, Math.round(stageConfigs[stageNumber - 1].damageScale)), armoredDamage: Math.max(1, Math.round(2 * stageConfigs[stageNumber - 1].damageScale)), bossDamage: Math.max(1, Math.round(5 * stageConfigs[stageNumber - 1].damageScale)), hpMultiplier: stageNumber === 1 ? 1 : 2, gold, upgrades: offense.upgrades, effectivePlayerDps, fangletDps, partyDps,
      basicHp: Math.round(stageConfigs[stageNumber - 1].hpScale),
      bossHp: precise(Math.round(28 * stageConfigs[stageNumber - 1].bossHpScale * (stageNumber === 5 || stageNumber === 10 ? 1.5 : 1)) * stageConfigs[stageNumber - 1].bossHpMultiplier) };
  }
  const captureDefs = creatureDefs.map(creature => ({
    id: `capture${creature.id[0].toUpperCase()}${creature.id.slice(1)}`,
    name: creature.name,
    capture: creature.id,
    requiresStageClear: creature.requiresStageClear,
    currency: creature.affinityId,
    cost: creature.captureCost
  }));
  const monsterSheets = { basic: "monsterBasic", ranged: "monsterRanged", armored: "monsterArmored" };
  // Columns name spawn sections, not the monster's current movement heading.
  const monsterColumns = { north: 0, south: 1, east: 2, west: 3 };
  const playerAttackDuration = 0.24;
  const treeDefs = [...upgradeDefs];
  const treePositions = () => {
    const branch = ["PLAYER", "STRIKER", "HEALER", "AOE"][upgradeBranch];
    let definitions = treeDefs.filter(definition => definition.branch === branch);
    if (branch === "PLAYER") definitions = ["power", "power3", "boulderBuster", "speed", "multishot", "health", "rockBreaker", "tripleSpark", "playerCritChance", "playerCritDamage", "magnet", "autoTarget", "travelSpeed", "partyBond"].map(id => upgradeDefs.find(definition => definition.id === id));
    else definitions.sort((a, b) => Number(!!b.capture) - Number(!!a.capture));
    const rows = definitions.length > 8 ? Math.ceil(definitions.length / 2) : definitions.length > 6 ? 4 : 3;
    return definitions.map((definition, index) => ({ definition, x: 24 + Math.floor(index / rows) * 256, y: (rows > 4 ? 218 : 230) + index % rows * (rows > 4 ? 112 : rows === 4 ? 120 : 136), height: 108 }));
  };
  const treeRequirements = definition => definition.requires;

  const emptyAffinityMap = () => Object.fromEntries(affinityOrder.map(id => [id, 0]));
  const defaultSave = () => ({ saveVersion: 2, fragments: {}, shinyCreatures: [], gold: 0, essence: emptyAffinityMap(), essencePity: emptyAffinityMap(), completed: [], unlockedStage: 1, ownedCreatures: [], activeParty: [], upgrades: {}, autoTargetEnabled: false, stage4TreasureAttempted: false });
  function mergeHealthRanks(upgrades) {
    const result = { ...upgrades };
    if (result.vitality !== undefined || result.fortitude !== undefined) {
      result.health = Math.min(10, (result.health || 0) + (result.vitality || 0) + (result.fortitude || 0));
      delete result.vitality;
      delete result.fortitude;
    }
    return result;
  }
  function loadSave() {
    try {
      localStorage.removeItem(LEGACY_SAVE_KEY);
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      const fresh = defaultSave();
      return {
        ...fresh,
        ...parsed,
        fragments: Object.fromEntries(monsterCatalog.map(c => [c.id, Math.max(0, Math.min(5, Math.floor(Number(parsed.fragments?.[c.id]) || 0)))])),
        shinyCreatures: (parsed.shinyCreatures || []).filter(id => monsterCatalog.some(c => c.id === id) && Number(parsed.fragments?.[id]) >= 5 && (parsed.ownedCreatures || []).includes(id)),
        essence: { ...fresh.essence, ...(parsed.essence || {}) },
        essencePity: { ...fresh.essencePity, ...(parsed.essencePity || {}) },
        ownedCreatures: [...new Set(parsed.ownedCreatures || [])].filter(id => creatureById(id)),
        activeParty: [...new Set(parsed.activeParty || [])].filter(id => creatureById(id) && (parsed.ownedCreatures || []).includes(id)).slice(0, 3),
        upgrades: mergeHealthRanks(parsed.upgrades || {})
      };
    } catch {
      return defaultSave();
    }
  }

  const state = {
    mode: "title", save: loadSave(), mouse: { x: WIDTH / 2, y: HEIGHT * 0.8 }, selectedStage: 1, stage: null,
    party: { x: WIDTH / 2, y: HEIGHT / 2, hp: 10, maxHp: 10 }, stageTime: 0, spawnTimer: 0, fireTimer: 0,
    obstacles: [], scroll: 0, runGold: 0, bossSpawned: false, bossDefeated: false, enemies: [], projectiles: [], drops: [], effects: [],
    particles: [], vases: [], ambientTimer: 0, vaseTimer: 1.5, particleSeed: 1,
    companions: [], result: null, toast: "", toastTimer: 0, animationTime: 0
  };

  const rank = id => state.save.upgrades[id] || 0;
  const hasRecruit = id => state.save.ownedCreatures.includes(id);
  const isActiveCreature = id => state.save.activeParty.some(member => member === id || creatureById(member)?.petType === id);
  const writeSave = () => localStorage.setItem(SAVE_KEY, JSON.stringify(state.save));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const travelMultiplier = () => 1 + rank("travelSpeed") * 0.05;
  const partyDamageBonus = () => isActiveCreature("healer") && rank("partyBond") > 0 ? 5 : 0;
  const playerDamage = () => 1 + rank("power") + 3 * rank("power3") + partyDamageBonus();
  const strikerDamage = () => 1 + rank("strikerPower") + partyDamageBonus();
  const playerFireInterval = () => 0.425 * (1 - rank("speed") * 0.1);
  const rollAttackCount = (secondId, thirdId) => {
    if (!rank(secondId) || Math.random() >= shotChance(rank(secondId))) return 1;
    return 2 + (rank(thirdId) > 0 && Math.random() < shotChance(rank(thirdId)) ? 1 : 0);
  };
  const playerProjectiles = () => rollAttackCount("multishot", "tripleSpark");
  const maxPartyHealth = () => 10 + rank("health") * 5;
  const autoTargetUnlocked = () => rank("autoTarget") > 0;

  function setMode(mode) {
    state.mode = mode;
    setMusic(mode === "combat" ? (roundTracks.length ? roundTracks[Math.floor(Math.random() * roundTracks.length)] : null) : menuTrack);
    state.toast = "";
    render();
  }

  function setupCompanions() {
    state.companions = state.save.activeParty.map((type, index) => ({ type: creatureById(type)?.petType || type, creatureId: type, x: state.party.x, y: state.party.y - (index + 1) * 40, timer: 0.4 + index * 0.45, pulse: 0 }));
  }

  const partyBodies = () => [{ type: "player", x: state.party.x, y: state.party.y, r: 12 }, ...state.companions.map(companion => ({ ...companion, r: 12 }))];
  const nearestPartyBody = (x, y) => partyBodies().reduce((best, body) => Math.hypot(body.x - x, body.y - y) < Math.hypot(best.x - x, best.y - y) ? body : best);
  function hitParty(body, damage) {
    if (state.party.shield && damage > 0) {
      state.party.shield = false;
      state.effects.push({ type: "heal", x: body.x, y: body.y, life: 0.3, maxLife: 0.3, radius: 40 });
      return;
    }
    state.party.hp = precise(state.party.hp - damage);
    state.effects.push({ type: "impact", x: body.x, y: body.y, life: 0.25, maxLife: 0.25, radius: 30 });
  }
  function projectilePartyHit(projectile, oldX, oldY) {
    const dx = projectile.x - oldX, dy = projectile.y - oldY, lengthSquared = dx * dx + dy * dy;
    return partyBodies().map(body => {
      const radius = body.r + projectile.r, ox = oldX - body.x, oy = oldY - body.y;
      const c = ox * ox + oy * oy - radius * radius;
      if (c <= 0) return { body, t: 0 };
      if (!lengthSquared) return null;
      const b = 2 * (ox * dx + oy * dy), discriminant = b * b - 4 * lengthSquared * c;
      if (discriminant < 0) return null;
      const t = (-b - Math.sqrt(discriminant)) / (2 * lengthSquared);
      return t >= 0 && t <= 1 ? { body, t } : null;
    }).filter(Boolean).sort((a, b) => a.t - b.t)[0]?.body;
  }

  function startStage(stageNumber) {
    if (stageNumber > state.save.unlockedStage) return;
    state.selectedStage = stageNumber;
    state.stage = stageConfigs[stageNumber - 1];
    state.party.x = WIDTH / 2;
    state.party.y = HEIGHT / 2;
    state.mouse = { x: WIDTH / 2, y: HEIGHT * 0.8 };
    state.party.maxHp = maxPartyHealth();
    state.party.hp = state.party.maxHp;
    state.party.shield = false;
    state.party.shieldReadyAt = 0;
    state.stageTime = 0;
    state.spawnTimer = 0.35 / travelMultiplier();
    state.fireTimer = 0;
    state.playerAttackStartedAt = -Infinity;
    state.scroll = 0;
    state.runGold = 0;
    state.runEssence = emptyAffinityMap();
    state.bossSpawned = false;
    state.bossDefeated = false;
    state.enemies = [];
    state.obstacles = [];
    state.rockSpawnTimer = 0;
    const firstStage4 = stageNumber === 4 && !state.save.stage4TreasureAttempted && !state.save.completed.includes(4);
    const treasureEligible = firstStage4 || state.save.stage4TreasureAttempted || state.save.completed.includes(4);
    state.treasureSpawnAt = firstStage4 || (treasureEligible && Math.random() < 0.001) ? 5 + Math.random() * 5 : null;
    state.treasure = null;
    state.treasureGold = 0;
    if (stageNumber === 4 && !state.save.stage4TreasureAttempted) {
      state.save.stage4TreasureAttempted = true;
      writeSave();
    }
    state.projectiles = [];
    state.drops = [];
    state.effects = [];
    state.particles = [];
    state.vases = [];
    state.ambientTimer = 0;
    state.vaseTimer = 1.5;
    state.propsSpawned = 0;
    state.leafSpawnBand = 0;
    state.particleSeed = stageNumber * 7919;
    if (weatherType() === "leaves") for (let i = 0; i < 6; i++) spawnLeaf(true);
    state.result = null;
    setupCompanions();
    setMode("combat");
  }

  function spawnPoint(radius, forcedEdge = null) {
    const edge = forcedEdge || ["north", "east", "south", "west"][Math.floor(Math.random() * 4)];
    const margin = radius + 8;
    if (edge === "north") return { edge, x: 70 + Math.random() * (WIDTH - 140), y: 126 - margin };
    if (edge === "east") return { edge, x: WIDTH + margin, y: 150 + Math.random() * (HEIGHT - 270) };
    if (edge === "west") return { edge, x: -margin, y: 150 + Math.random() * (HEIGHT - 270) };
    return { edge: "south", x: 70 + Math.random() * (WIDTH - 140), y: HEIGHT - 96 + margin };
  }

  function spawnEnemy(forcedType = null, forcedEdge = null) {
    const roll = Math.random();
    const rangedChance = state.stage.number >= 2 ? 0.23 : 0.12;
    const armoredChance = state.stage.number >= 3 ? 0.22 : 0.09;
    const rosterEntry = pickStageMonster(state.stage.number, roll, forcedType);
    let type = rosterEntry?.type || forcedType;
    if (!type && state.stage.number === 1) type = "basic";
    if (!type && state.stage.number === 2) type = roll < 0.22 ? "armored" : "basic";
    if (!type) type = roll < armoredChance ? "armored" : roll < armoredChance + rangedChance ? "ranged" : "basic";
    const openingStage = state.stage.number <= 2;
    const base = {
      basic: { hp: 1, speed: openingStage ? 92 : 32, damage: 1, cooldown: 99, radius: 11 },
      ranged: { hp: 2, speed: 28, damage: 1, cooldown: 2.7, radius: 12 },
      armored: { hp: 3, speed: openingStage ? 70 : 24, damage: 2, cooldown: 99, radius: 15 },
      boss: { hp: 28, speed: state.stage.number <= 5 ? 72 : 28, damage: 5, cooldown: 2.4, radius: 42 }
    }[type];
    const bossFactor = type === "boss" ? (state.stage.majorBoss ? 1.5 : 1) : 1;
    const hpScale = type === "boss" ? state.stage.bossHpScale : state.stage.hpScale;
    const speciesRoll = Math.random();
    const rosterCreature = rosterEntry && creatureById(rosterEntry.id);
    const species = rosterCreature ? Object.values(speciesDefs).find(species => species.affinityId === rosterCreature.affinityId).id : type === "boss" ? (state.stage.number === 3 ? "fanglet" : null) : rollSpecies(state.stage.number, speciesRoll, openingStage && state.stageTime < 15);
    const openingFanglet = openingStage && species === "fanglet";
    const stats = rosterEntry && rosterStats(rosterEntry, state.stage);
    const hp = stats ? stats.hp : precise((openingFanglet ? 2 : Math.round(base.hp * hpScale * bossFactor)) * state.stage.hpMultiplier * (type === "boss" ? state.stage.bossHpMultiplier : 1));
    const demonCyclop = type === "boss" && [1, 2, 4].includes(state.stage.number);
    const spawn = spawnPoint(base.radius, demonCyclop ? "north" : forcedEdge);
    const pool = monsterCatalog.filter(c => c.tier === Math.min(3, Math.ceil(state.stage.number / 4)) && (!species || c.affinityId === speciesDefs[species].affinityId));
    const monsterId = rosterEntry?.id || (type === "boss" && state.stage.number === 3 ? "feral-bat" : pool[Math.floor(Math.random() * pool.length)].id);
    state.enemies.push({
      monsterId,
      type, species, affinityId: species ? speciesDefs[species].affinityId : null, demonCyclop, edge: spawn.edge, x: spawn.x, y: spawn.y, r: base.radius,
      hp, maxHp: hp, speed: base.speed * 1.4 * (type === "boss" ? 1 : 1.2), damage: stats ? stats.damage : openingFanglet ? 2 : Math.max(1, Math.round(base.damage * state.stage.damageScale)),
      gold: 1, meleeTimer: 0, meleeCooldown: 1.5, attackTimer: base.cooldown,
      attackCooldown: base.cooldown
    });
  }

  function rollSpecies(stage, roll, suppressFanglet = false) {
    let threshold = 0;
    for (const species of Object.values(speciesDefs)) {
      threshold += species.density[stage - 1];
      if (roll < threshold) return suppressFanglet && species.id === "fanglet" ? null : species.id;
    }
    return null;
  }
  const speciesDensity = (speciesId, stage) => speciesDefs[speciesId].density[stage - 1];
  const currencyName = currency => currency === "gold" ? "gold" : `${affinityDefs[currency].name} essence`;
  const currencyAmount = currency => currency === "gold" ? state.save.gold : state.save.essence[currency];
  const spendCurrency = (currency, amount) => {
    if (currency === "gold") state.save.gold = precise(state.save.gold - amount);
    else state.save.essence[currency] -= amount;
  };
  const essenceYield = stage => 1 + Math.floor((stage - 1) / 3);
  const enemyVisible = enemy => enemy.x >= 0 && enemy.x <= WIDTH && enemy.y >= 126 && enemy.y <= HEIGHT - 96;

  function nearestEnemy(fromX = state.party.x, fromY = state.party.y, includeTreasure = false) {
    const targets = includeTreasure && state.treasure && !state.treasure.open ? [...state.enemies, state.treasure] : state.enemies;
    return targets.filter(enemyVisible).reduce((best, enemy) => {
      const distance = Math.hypot(enemy.x - fromX, enemy.y - fromY);
      return !best || distance < best.distance ? { enemy, distance } : best;
    }, null)?.enemy || null;
  }

  function criticalAmount(owner, amount) {
    const chance = Math.min(10, rank(`${owner}CritChance`)) / 100;
    const critical = chance > 0 && Math.random() < chance;
    return { amount: critical ? precise(amount * (1 + Math.min(5, rank(`${owner}CritDamage`)) * 0.1)) : amount, critical };
  }

  function shoot(x, y, targetX, targetY, friendly, damage, speed = 560, source = "player", angleOffset = 0) {
    const angle = Math.atan2(targetY - y, targetX - x) + angleOffset;
    const owner = source === "strikerFollowup" ? "striker" : source;
    const result = friendly ? criticalAmount(owner, damage) : { amount: damage, critical: false };
    damage = result.amount;
    state.projectiles.push({ critical: result.critical, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: source === "boss" ? 8 : 6, friendly, damage, source, age: 0 });
  }

  function firePlayerVolley() {
    state.playerAttackStartedAt = state.animationTime;
    const target = state.save.autoTargetEnabled && autoTargetUnlocked() ? nearestEnemy(state.party.x, state.party.y, true) : null;
    const targetX = target?.x ?? state.mouse.x;
    const targetY = target?.y ?? state.mouse.y;
    const count = playerProjectiles();
    for (let index = 0; index < count; index += 1) {
      const spread = count === 1 ? 0 : (index - (count - 1) / 2) * 0.105;
      shoot(state.party.x, state.party.y + 12, targetX, targetY, true, playerDamage(), 560, "player", spread);
    }
  }

  function spawnCoins(x, y, count) {
    for (let index = 0; index < count; index++) {
      const angle = index * 2.39996;
      const radius = count === 1 ? 0 : 18 + 11 * Math.sqrt(index);
      state.drops.push({ x, y, age: 0, offsetX: Math.cos(angle) * radius, offsetY: Math.sin(angle) * radius * 0.65, popHeight: 22 + (index % 3) * 5 });
    }
  }

  function awardGold(value) {
    state.runGold = precise(state.runGold + value * (1 + rank("magnet") * 0.1));
  }

  function awardEssence(affinityId, amount) {
    state.runEssence[affinityId] += amount;
  }

  function removeEnemy(enemy, reward = false) {
    const index = state.enemies.indexOf(enemy);
    if (index < 0) return;
    state.enemies.splice(index, 1);
    if (reward) {
      awardGold(enemy.gold);
      spawnCoins(enemy.x, enemy.y, enemy.gold);
      if (enemy.species && enemy.type !== "boss") {
        const affinityId = speciesDefs[enemy.species].affinityId;
        state.save.essencePity[affinityId] += 1;
        if (Math.random() < 0.3 || state.save.essencePity[affinityId] >= 5) {
          awardEssence(affinityId, essenceYield(state.stage.number));
          state.save.essencePity[affinityId] = 0;
        }
      }
      const bossRewards = {
        3: { feral: 15 },
        5: { bloom: 15 },
        6: { feral: 2 * essenceYield(6) },
        8: { bloom: 2 * essenceYield(8) },
        9: { feral: 2 * essenceYield(9) },
        10: { arcane: 20 }
      }[state.stage.number];
      if (enemy.type === "boss" && bossRewards) {
        for (const [affinityId, amount] of Object.entries(bossRewards)) awardEssence(affinityId, amount);
      }
    }
  }

  const fangletRange = 360;
  function fangletTarget(companion) {
    const candidates = state.enemies.filter(enemy => enemyVisible(enemy) && enemy.hp > 0 && Math.hypot(enemy.x - companion.x, enemy.y - companion.y) <= fangletRange);
    const wounded = candidates.filter(enemy => enemy.hp < enemy.maxHp);
    const lowest = wounded.length ? Math.min(...wounded.map(enemy => enemy.hp)) : null;
    const pool = wounded.length ? wounded.filter(enemy => enemy.hp === lowest) : candidates;
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  }

  function fangletAttack(companion, source = "striker") {
    if (state.mode !== "combat") return;
    const target = fangletTarget(companion);
    if (!target) return;
    const hit = criticalAmount("striker", strikerDamage());
    state.effects.push({ type: "groundTrap", target, x: target.x, y: target.y, life: 0.6, maxLife: 0.6, source, critical: hit.critical });
    damageEnemy(target, hit.amount, source);
  }

  const boulderBusterDamage = () => 1;

  function boulderBurst(rock) {
    if (rock.kind === "vase") return;
    for (let i = 0; i < rank("boulderBuster"); i++) {
      const angle = Math.random() * Math.PI * 2;
      shoot(rock.x, rock.y, rock.x + Math.cos(angle), rock.y + Math.sin(angle), true, boulderBusterDamage(), 560, "boulderBuster");
    }
  }

  function damageEnemy(enemy, amount, source = "player") {
    if (state.mode !== "combat" || !state.enemies.includes(enemy)) return;
    enemy.hp = precise(enemy.hp - amount);
    if (enemy.demonCyclop && amount > 0) enemy.hitStartedAt = state.animationTime;
    if (source === "strikerFollowup" && rank("strikerFollowupHeal")) {
      state.party.hp = precise(Math.min(state.party.maxHp, state.party.hp + rank("strikerFollowupHeal")));
    }
    const playerImpact = source === "player" || source === "boulderBuster";
    if (source !== "striker" && source !== "strikerFollowup") state.effects.push({ type: playerImpact ? "earthImpact" : "impact", x: enemy.x, y: enemy.y, life: playerImpact ? 0.48 : 0.12, maxLife: playerImpact ? 0.48 : 0.12, radius: playerImpact ? 50 : 22 });
    if (enemy.hp <= 0) {
      if (enemy.type === "boss") state.bossDefeated = true;
      removeEnemy(enemy, true);
      if (enemy.type === "boss") { finishStage(true); return; }
      if (source === "striker" && rank("strikerFollowup") && Math.random() < Math.min(5, rank("strikerFollowup")) * 0.2) {
        const companion = state.companions.find(member => member.type === "striker");
        if (companion) fangletAttack(companion, "strikerFollowup");
      }
    }
  }

  function updateCompanions(dt) {
    for (const [index, companion] of state.companions.entries()) {
      companion.x = state.party.x;
      companion.y = state.party.y - (index + 1) * 40;
      if (state.mode !== "combat") return;
      companion.timer -= dt;
      companion.pulse = Math.max(0, companion.pulse - dt);
      if (companion.timer > 0) continue;
      if (companion.type === "striker") {
        if (fangletTarget(companion)) {
          const isFeral = creatureById(companion.creatureId)?.affinityId === "feral";
          const count = isFeral ? rollAttackCount("strikerDouble", "strikerTriple") : 1;
          for (let index = 0; index < count; index += 1) fangletAttack(companion);
        }
        companion.timer = 1.05 * (1 - rank("strikerSpeed") * 0.15);
      } else if (companion.type === "healer") {
        if (state.party.hp < state.party.maxHp) {
          const deepBloom = state.party.hp < state.party.maxHp / 2 && rank("deepBloom") && Math.random() < Math.min(5, rank("deepBloom")) * 0.2;
          state.party.hp = precise(Math.min(state.party.maxHp, state.party.hp + criticalAmount("healer", (2 + rank("healPower")) * (deepBloom ? 2 : 1)).amount));
          if (deepBloom && rank("bloomShield") && !state.party.shield && state.stageTime >= state.party.shieldReadyAt) {
            state.party.shield = true;
            state.party.shieldReadyAt = state.stageTime + 2;
          }
          companion.pulse = 0.7;
          state.effects.push({ type: "heal", x: state.party.x, y: state.party.y, life: 0.7, maxLife: 0.7, radius: 54 });
        }
        companion.timer = 4.6 * (1 - rank("healSpeed") * 0.15);
      } else if (companion.type === "aoe") {
        const target = nearestEnemy(companion.x, companion.y);
        if (target) {
          const radius = 70 + rank("aoeRadius") * 22;
          const blast = criticalAmount("aoe", 3 + rank("aoePower"));
          state.enemies.filter(enemy => Math.hypot(enemy.x - target.x, enemy.y - target.y) <= radius).forEach(enemy => damageEnemy(enemy, blast.amount));
          state.effects.push({ type: "aoe", x: target.x, y: target.y, life: 0.55, maxLife: 0.55, radius });
        }
        companion.timer = 3.3;
      }
    }
  }

  function finishStage(won) {
    if (state.mode !== "combat") return;
    if (won && !state.bossDefeated) return;
    const firstClear = won && !state.save.completed.includes(state.stage.number);
    let newRecruit = null;
    state.save.gold = precise(state.save.gold + state.runGold);
    for (const affinityId of affinityOrder) state.save.essence[affinityId] += state.runEssence[affinityId];
    if (won) {
      if (firstClear) state.save.completed.push(state.stage.number);
      state.save.unlockedStage = Math.max(state.save.unlockedStage, Math.min(10, state.stage.number + 1));
    }
    writeSave();
    state.result = { won, gold: state.runGold, essence: { ...state.runEssence }, firstClear, newRecruit, stage: state.stage.number };
    setMode("result");
  }

  // Chests ride the center lane; only destroying one grants its reward.
  function updateTreasure(previousTime, currentTime) {
    if (state.treasureSpawnAt === null || currentTime < state.treasureSpawnAt) return;
    if (!state.treasure && state.treasureGold) return;
    if (!state.treasure) state.treasure = { x: WIDTH / 2, y: HEIGHT + 20, r: 20, hp: 5, maxHp: 5 };
    state.treasure.y -= 24 * travelMultiplier() * Math.max(0, currentTime - Math.max(previousTime, state.treasureSpawnAt));
    // Reserve the whole lane, including rocks that entered before the chest.
    state.obstacles = state.obstacles.filter(rock => Math.abs(rock.x - state.treasure.x) > rock.r + state.treasure.r + 12);
    if (state.treasure.y + state.treasure.r < 126) {
      state.treasure = null;
      state.treasureSpawnAt = null;
    }
  }

  function damageTreasure(amount) {
    if (!state.treasure || state.treasure.open) return;
    state.treasure.hp = precise(state.treasure.hp - amount);
    if (state.treasure.hp <= 0) {
      state.runGold = precise(state.runGold + 15);
      state.treasureGold = 15;
      state.treasure.hp = 0;
      state.treasure.open = true;
      spawnCoins(state.treasure.x, state.treasure.y, 15);
      state.toast = "Treasure chest +15 gold";
      state.toastTimer = 2;
    }
  }

  // Separate random stream: cosmetic weather cannot change combat rolls.
  function particleRandom() {
    state.particleSeed = (Math.imul(state.particleSeed, 1664525) + 1013904223) >>> 0;
    return state.particleSeed / 4294967296;
  }

  function weatherType() {
    return ["leaves", "rain", "clear", "clear", "clear"][(state.stage.number - 1) % 5];
  }

  function addParticle(particle) {
    if (state.particles.length < 96) state.particles.push(particle);
  }

  function breakFragments(kind, x, y, large = false) {
    const count = large ? 10 : 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + particleRandom() * 0.4;
      const speed = 35 + particleRandom() * (large ? 110 : 70);
      const life = 0.55 + particleRandom() * 0.3;
      addParticle({ kind, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 80,
        age: 0, life, maxLife: life, frame: Math.floor(particleRandom() * (kind === "rock" ? 5 : 6)) });
    }
  }

  function spawnLeaf(initial = false) {
    const band = state.leafSpawnBand++;
    const x = 24 + (band % 3) * 164 + particleRandom() * 150;
    const y = 120 + (band % 2) * 220 + particleRandom() * 170;
    addParticle({ kind: "leaf", x, y, vx: 4 + particleRandom() * 8, vy: 18 + particleRandom() * 8,
      phase: particleRandom() * Math.PI * 2, age: initial ? 0.3 : 0, life: 6, maxLife: 6 });
  }

  function updateParticles(dt, cameraStep) {
    const splashes = [];
    for (const p of state.particles) {
      p.age += dt; p.life -= dt;
      if (p.kind === "rain") {
        p.x += p.vx * dt; p.y += p.vy * dt; p.groundY -= cameraStep;
        if (p.y >= p.groundY && p.life > 0) {
          p.life = 0;
          splashes.push({ kind: "splash", x: p.x, y: p.groundY, age: 0, life: 0.3, maxLife: 0.3 });
        }
      } else if (p.kind === "leaf") {
        p.x += (p.vx + Math.sin(p.age * 2.8 + p.phase) * 18) * dt;
        p.y += p.vy * dt - cameraStep * 0.3;
      } else if (p.kind === "splash") p.y -= cameraStep;
      else { p.vy += 240 * dt; p.x += p.vx * dt; p.y += p.vy * dt - cameraStep; }
    }
    state.particles = state.particles.filter(p => p.life > 0 && p.x > -40 && p.x < WIDTH + 40 && p.y < HEIGHT + 40);
    splashes.forEach(addParticle);
    state.ambientTimer -= dt;
    const weather = weatherType();
    if (state.ambientTimer <= 0) {
      if (weather === "rain") {
        const groundY = 145 + particleRandom() * 650;
        addParticle({ kind: "rain", x: 20 + particleRandom() * (WIDTH - 40), y: groundY - 280,
          groundY, vx: -45, vy: 430, age: 0, life: 1.2, maxLife: 1.2, frame: Math.floor(particleRandom() * 3) });
        state.ambientTimer = 0.07;
      } else if (weather === "leaves") {
        spawnLeaf();
        state.ambientTimer = 0.9;
      } else state.ambientTimer = 1;
    }
  }

  function updateVases(dt, cameraStep) {
    for (const vase of state.vases) vase.y -= cameraStep;
    state.vases = state.vases.filter(vase => vase.y + vase.r >= 126);
    state.vaseTimer -= dt * travelMultiplier();
    if (state.vaseTimer <= 0 && !state.bossSpawned && state.propsSpawned < 2) {
      // Two sparse opportunities per level, with the first already in view.
      const y = state.propsSpawned === 0 ? 760 : HEIGHT + 16;
      const lanes = particleRandom() < 0.5 ? [155, 385, 120, 420] : [385, 155, 420, 120];
      const x = lanes.find(x => ![...state.obstacles, ...state.vases].some(prop => Math.hypot(prop.x - x, prop.y - y) < prop.r + 48));
      if (x === undefined) { state.vaseTimer = 0.2; return; }
      const variant = Math.floor(particleRandom() * destructibleVariants.length);
      state.vases.push({ x, y, r: 12, hp: 1, kind: "vase", variant });
      state.propsSpawned++;
      state.vaseTimer = 10;
    }
  }

  function drawParticles(ground) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, 112, WIDTH, HEIGHT - 208); ctx.clip();
    for (const p of state.particles) {
      if ((p.kind === "splash") !== ground) continue;
      const specs = { rain: ["particleRain", 8, 8], splash: ["particleSplash", 8, 8],
        leaf: ["particleLeaf", 12, 7], rock: ["particleRock", 16, 16], vase: ["particleVase", 14, 14], wood: ["particleWood", 16, 16] };
      const [key, w, h] = specs[p.kind], image = assets[key];
      if (!image?.complete || !image.naturalWidth) continue;
      const frame = p.kind === "splash" ? Math.min(2, Math.floor(p.age * 10))
        : p.kind === "leaf" ? Math.floor(p.age * 7 + p.phase) % 6 : p.frame;
      const ambient = p.kind === "rain" || p.kind === "leaf";
      ctx.globalAlpha = (p.kind === "rain" ? 0.45 : p.kind === "splash" ? 0.4 : 0.9)
        * Math.min(1, p.life / 0.25, ambient ? p.age / 0.2 : 1);
      ctx.drawImage(image, frame * w, 0, w, h, Math.round(p.x - w), Math.round(p.y - h), w * 2, h * 2);
    }
    ctx.restore();
  }

  function updateCombat(dt) {
    if (state.mode !== "combat") return;
    state.stageTime += dt;
    const previousScroll = state.scroll;
    state.scroll += 24 * travelMultiplier() * dt;
    const cameraStep = state.scroll - previousScroll;
    updateParticles(dt, cameraStep);
    updateVases(dt, cameraStep);
    for (const coin of state.drops) {
      coin.age += dt;
      coin.y -= cameraStep;
      if (coin.age >= 0.65) {
        const dx = state.party.x - (coin.x + coin.offsetX), dy = state.party.y - (coin.y + coin.offsetY);
        const distance = Math.hypot(dx, dy);
        const step = (300 + Math.max(0, coin.age - 0.65) * 500) * dt;
        if (distance <= 20 + step) coin.collected = true;
        else { coin.x += dx / distance * step; coin.y += dy / distance * step; }
      }
    }
    state.drops = state.drops.filter(coin => !coin.collected);
    for (const rock of state.obstacles) rock.y -= cameraStep;
    state.obstacles = state.obstacles.filter(rock => rock.y + rock.r >= 126);
    if (state.stage.number >= 4) {
      state.rockSpawnTimer -= dt * travelMultiplier();
      if (state.rockSpawnTimer <= 0) {
        const size = Math.random() < 0.5 ? "small" : "medium";
        const radius = size === "small" ? 13 : 27;
        const health = size === "small" ? 8 : 15;
        state.obstacles.push({ x: Math.random() < 0.5 ? 85 + Math.random() * 125 : 330 + Math.random() * 125, y: HEIGHT + radius, r: radius, size, hp: health, maxHp: health });
        state.rockSpawnTimer = 3.5 + Math.random();
      }
    }
    updateTreasure(state.stageTime - dt, state.stageTime);
    state.spawnTimer -= dt;
    state.fireTimer -= dt;
    const bossWindow = state.stage.boss && state.stageTime >= state.stage.duration;
    if (bossWindow && !state.bossSpawned) {
      spawnEnemy("boss");
      state.bossSpawned = true;
    }
    if (state.stageTime < state.stage.duration && state.spawnTimer <= 0 && !bossWindow) {
      spawnEnemy();
      state.spawnTimer = state.stage.spawnRate / travelMultiplier() * (0.82 + Math.random() * 0.35);
    }
    if (state.fireTimer <= 0) {
      firePlayerVolley();
      state.fireTimer = playerFireInterval();
    }
    updateCompanions(dt);
    if (state.mode !== "combat") return;

    for (const enemy of [...state.enemies]) {
      // Enemies steer toward the fixed party independently of decorative terrain scroll.
      const targetBody = nearestPartyBody(enemy.x, enemy.y);
      const dx = targetBody.x - enemy.x, dy = targetBody.y - enemy.y;
      const distance = Math.hypot(dx, dy);
      const meleeBoss = enemy.type === "boss" && state.stage.number <= 5;
      const stopDistance = enemy.type === "boss" ? (meleeBoss ? enemy.r + targetBody.r : 240) : enemy.r + targetBody.r;
      const travel = Math.min(enemy.speed * dt, Math.max(0, distance - stopDistance));
      enemy.x += dx / Math.max(1, distance) * travel;
      enemy.y += dy / Math.max(1, distance) * travel;
      const touchingParty = Math.hypot(enemy.x - targetBody.x, enemy.y - targetBody.y) <= enemy.r + targetBody.r + 1;
      if (enemyVisible(enemy)) { enemy.attackTimer -= dt; enemy.meleeTimer -= dt; }
      if (((enemy.type === "ranged" && !touchingParty) || (enemy.type === "boss" && !meleeBoss)) && enemyVisible(enemy) && enemy.attackTimer <= 0) {
        shoot(enemy.x, enemy.y - enemy.r, targetBody.x, targetBody.y, false, enemy.damage, enemy.type === "boss" ? 220 : 185, enemy.type);
        enemy.attackTimer = enemy.attackCooldown;
      }
      if (meleeBoss && touchingParty && enemy.attackTimer <= 0) {
        hitParty(targetBody, enemy.damage);
        enemy.attackTimer = enemy.attackCooldown;
      }
      if (enemy.type !== "boss" && touchingParty && enemy.meleeTimer <= 0) {
        hitParty(targetBody, enemy.damage);
        enemy.meleeTimer = enemy.meleeCooldown;
      }
    }

    for (const projectile of [...state.projectiles]) {
      const oldX = projectile.x, oldY = projectile.y;
      projectile.age = (projectile.age || 0) + dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      let hit = false;
      if ((projectile.source === "player" || projectile.source === "boulderBuster")) {
        const dx = projectile.x - oldX, dy = projectile.y - oldY;
        const chest = state.treasure;
        if (chest && !chest.open && enemyVisible(chest)) {
          const t = clamp(((chest.x - oldX) * dx + (chest.y - oldY) * dy) / Math.max(0.001, dx * dx + dy * dy), 0, 1);
          if (Math.hypot(oldX + t * dx - chest.x, oldY + t * dy - chest.y) <= chest.r + projectile.r) {
            damageTreasure(projectile.damage);
            state.projectiles.splice(state.projectiles.indexOf(projectile), 1);
            continue;
          }
        }
        const rock = [...state.obstacles, ...state.vases].find(obstacle => {
          const t = clamp(((obstacle.x - oldX) * dx + (obstacle.y - oldY) * dy) / Math.max(0.001, dx * dx + dy * dy), 0, 1);
          return Math.hypot(oldX + t * dx - obstacle.x, oldY + t * dy - obstacle.y) <= obstacle.r + projectile.r;
        });
        if (rock) {
          if (rock.kind === "vase" || rank("rockBreaker")) {
            rock.hp -= projectile.damage;
            if (rock.hp <= 0) {
              const collection = rock.kind === "vase" ? state.vases : state.obstacles;
              collection.splice(collection.indexOf(rock), 1);
              boulderBurst(rock);
              breakFragments(rock.kind === "vase" ? destructibleVariants[rock.variant ?? 0].material : "rock", rock.x, rock.y, rock.size === "medium");
              if (rock.kind === "vase" && Math.random() < 0.25) {
                state.runGold = precise(state.runGold + 1);
                spawnCoins(rock.x, rock.y, 1);
              }
            }
          }
          state.effects.push({ type: "impact", x: projectile.x, y: projectile.y, life: 0.15, maxLife: 0.15, radius: 12 });
          state.projectiles.splice(state.projectiles.indexOf(projectile), 1);
          continue;
        }
      }
      if (projectile.friendly) {
        const enemy = state.enemies.find(candidate => enemyVisible(candidate) && Math.hypot(projectile.x - candidate.x, projectile.y - candidate.y) < projectile.r + candidate.r);
        if (enemy) {
          damageEnemy(enemy, projectile.damage, projectile.source);
          if (state.mode !== "combat") return;
          hit = true;
        }
      } else {
        const body = projectilePartyHit(projectile, oldX, oldY);
        if (body) { hitParty(body, projectile.damage); hit = true; }
      }
      if (hit || projectile.x < -40 || projectile.x > WIDTH + 40 || projectile.y < -40 || projectile.y > HEIGHT + 40) state.projectiles.splice(state.projectiles.indexOf(projectile), 1);
    }

    state.effects.forEach(effect => {
      effect.life -= dt;
      if (effect.type === "groundTrap" && state.enemies.includes(effect.target)) {
        effect.x = effect.target.x; effect.y = effect.target.y;
      }
    });
    state.effects = state.effects.filter(effect => effect.life > 0);
    if (state.party.hp <= 0) finishStage(false);
    else if (state.bossDefeated) finishStage(true);
  }

  function update(dt) {
    state.animationTime += dt;
    if (state.toastTimer > 0) state.toastTimer -= dt;
    if (state.mode === "combat") updateCombat(dt);
  }

  function drawSprite(name, x, y, size = 40, alpha = 1) {
    const image = assets[name];
    if (!image?.complete) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    ctx.globalAlpha = 1;
  }

  function drawSheetFrame(name, x, y, frame, frameCount, size = 100, rotation = 0, alpha = 1) {
    const image = assets[name];
    if (!image?.complete || !image.naturalWidth) return false;
    const frameWidth = image.naturalWidth / frameCount;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(rotation);
    ctx.drawImage(image, frame * frameWidth, 0, frameWidth, image.naturalHeight, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function drawGridFrame(name, x, y, frame, columns, row, rows, width, height = width, alpha = 1) {
    const image = assets[name];
    if (!image?.complete || !image.naturalWidth) return false;
    const frameWidth = image.naturalWidth / columns;
    const frameHeight = image.naturalHeight / rows;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, frame * frameWidth, row * frameHeight, frameWidth, frameHeight, Math.round(x - width / 2), Math.round(y - height / 2), width, height);
    ctx.restore();
    return true;
  }

  function playerAnimation() {
    const elapsed = state.animationTime - (state.playerAttackStartedAt ?? -Infinity);
    const attacking = state.mode === "combat" && elapsed >= 0 && elapsed < playerAttackDuration;
    return { animation: attacking ? "attack" : "walk", frame: attacking ? 0 : Math.floor(state.animationTime * 8) % 4 };
  }

  function drawPlayer(x, y, height = 54, alpha = 1) {
    const { animation, frame } = playerAnimation();
    const drawn = animation === "attack"
      ? drawGridFrame("playerAttack", x, y, 0, 4, 0, 1, height, height, alpha)
      : drawGridFrame("playerWalk", x, y, 0, 4, frame, 4, height, height, alpha);
    if (!drawn) drawSprite("player", x, y, height, alpha);
  }

  function demonAnimation(enemy) {
    const elapsed = state.animationTime - (enemy.hitStartedAt ?? -Infinity);
    const hit = elapsed >= 0 && elapsed < 0.3;
    return { animation: hit ? "hit" : "walk", frame: hit ? Math.min(2, Math.floor(elapsed * 10)) : Math.floor(state.animationTime * 8) % 6 };
  }

  function drawMonster(enemy) {
    if (enemy.demonCyclop) {
      const { animation, frame } = demonAnimation(enemy);
      if (!drawSheetFrame(animation === "hit" ? "demonHit" : "demonWalk", enemy.x, enemy.y, frame, animation === "hit" ? 3 : 6, 100)) drawSprite("boss", enemy.x, enemy.y, 92);
      return;
    }
    const sheet = enemy.monsterId || monsterSheets[enemy.type];
    const size = enemy.type === "boss" ? 92 : COMBAT_SPRITE_SIZE;
    if (!sheet || !drawGridFrame(sheet, enemy.x, enemy.y, monsterColumns[enemy.edge] ?? 1, 4, Math.floor(state.animationTime * 8) % 4, 4, size)) {
      drawSprite(enemy.type, enemy.x, enemy.y, size);
    }
  }

  function drawPet(type, x, y, size = 16, alpha = 1, facing = "south") {
    const creature = monsterCatalog.find(c => c.id === type);
    if (creature) {
      const shiny = state.save.shinyCreatures.includes(type) && state.save.fragments[type] >= 5;
      drawGridFrame(type + (shiny ? "-shiny" : ""), x, y, monsterColumns[facing] ?? 1, 4, Math.floor(state.animationTime * 8) % 4, 4, size, size, alpha);
      return;
    }
    const row = { striker: 0, healer: 1, aoe: 2 }[type];
    const image = assets.petRoster;
    if (row === undefined || !image?.naturalWidth) return;
    const direction = facing === "north" ? 1 : facing === "east" || facing === "west" ? 2 : 0;
    const column = (Math.floor(state.animationTime * 8) % 4) * 3 + direction;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), Math.round(y));
    if (facing === "west") ctx.scale(-1, 1);
    ctx.drawImage(image, column * 16, row * 32, 16, 16, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  const captureFacing = edge => ({ north: "south", south: "north", east: "west", west: "east" }[edge] || "south");

  function drawText(value, x, y, size = 18, color = "#fff", align = "left", shadow = true) {
    ctx.font = `${size}px "NinjaPixel", monospace`;
    ctx.wordSpacing = "2px";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#172335";
    if (shadow && color !== "#2b2218") ctx.fillText(value, x + 2, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }

  // Stretch only the centers and edges, preserving the pixel-art corners.
  function drawWood(name, x, y, width, height, borderX = UI_THEME.slices.panel.x, scale = UI_THEME.slices.panel.scale, borderY = borderX) {
    const image = assets[name];
    if (!image?.complete || !image.naturalWidth) return;
    const sw = image.naturalWidth, sh = image.naturalHeight;
    const sourceBorderX = Math.min(borderX, Math.floor(sw / 2));
    const sourceBorderY = Math.min(borderY, Math.floor(sh / 2));
    const targetBorderX = Math.min(sourceBorderX * scale, width / 2);
    const targetBorderY = Math.min(sourceBorderY * scale, height / 2);
    const sx = [0, sourceBorderX, sw - sourceBorderX], sy = [0, sourceBorderY, sh - sourceBorderY];
    const srcW = [sourceBorderX, sw - sourceBorderX * 2, sourceBorderX], srcH = [sourceBorderY, sh - sourceBorderY * 2, sourceBorderY];
    const dx = [x, x + targetBorderX, x + width - targetBorderX], dy = [y, y + targetBorderY, y + height - targetBorderY];
    const dw = [targetBorderX, width - targetBorderX * 2, targetBorderX], dh = [targetBorderY, height - targetBorderY * 2, targetBorderY];
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
      ctx.drawImage(image, sx[col], sy[row], srcW[col], srcH[row], dx[col], dy[row], dw[col], dh[row]);
    }
  }

  function drawPanel(x, y, width, height, color = "") {
    drawWood(color === "#303541f5" ? "woodDisabled" : "woodPanel", x, y, width, height);

  }

  function drawButton(label, x, y, width, height, active = true, action = null) {
    const slice = UI_THEME.slices.button;
    if (active && action) uiTargets.push({ x, y, width, height, action });
    drawWood(active ? "woodButton" : "woodButtonDisabled", x, y, width, height, slice.x, slice.scale, slice.y);
    // Long creature names must fit the narrow branch tabs.
    ctx.font = '16px "NinjaPixel", monospace';
    const size = Math.min(16, 16 * (width - 16) / Math.max(1, ctx.measureText(label).width));
    drawText(label, x + width / 2, y + height / 2, size, active ? "#2b2218" : "#ded1b8", "center");
  }

  function sceneryKey() {
    return ["sceneryMeadow", "sceneryForest", "sceneryRocky", "sceneryDesert", "sceneryStone"][(state.stage.number - 1) % 5];
  }

  function drawTrackScenery() {
    const image = assets[sceneryKey()];
    if (!image?.complete || !image.naturalWidth) { drawBackground(); drawRoad(); return; }
    const scale = 2, height = image.naturalHeight * scale;
    const offset = Math.floor(state.scroll) % height;
    const x = Math.floor((WIDTH - image.naturalWidth * scale) / 2);
    for (let y = -offset; y < HEIGHT; y += height) {
      ctx.drawImage(image, x, y, image.naturalWidth * scale, height);
    }
  }

  function drawBackground() {
    ctx.fillStyle = "#70b55f";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const offset = state.mode === "combat" ? (state.scroll * 0.45) % 32 : 0;
    for (let x = 0; x < WIDTH; x += 32) {
      for (let y = -32 - offset; y < HEIGHT; y += 32) drawSprite("grass", x + 16, y + 16, 32);
    }
  }

  function drawRoad() {
    ctx.fillStyle = "#c9a96b";
    ctx.fillRect(48, 0, WIDTH - 96, HEIGHT);
    const offset = state.mode === "combat" ? state.scroll % 32 : 0;
    for (let x = 48; x < WIDTH - 48; x += 32) {
      for (let y = -32 - offset; y < HEIGHT; y += 32) drawSprite("path", x + 16, y + 16, 32);
    }
  }

  function drawBestiaryBackground() {
    ctx.fillStyle = UI_THEME.colors.field;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = UI_THEME.colors.path;
    ctx.fillRect(57, 0, 426, HEIGHT);
    ctx.fillStyle = UI_THEME.colors.speck;
    for (let y = 0; y < HEIGHT; y += 24) for (let x = 0; x < WIDTH; x += 24) {
      if ((x / 24 + y / 24) % 3 === 0) ctx.fillRect(x + 3, y + 6, 3, 3);
    }
  }

  function drawCurrencyIcon(currencyId, x, y, size = 30, alpha = 1) {
    const image = assets.currencySheet;
    if (!image?.complete || !image.naturalWidth) return;
    const row = UI_THEME.currencyRows[currencyId];
    if (row === undefined) return;
    const frame = Math.floor(state.animationTime * 10) % 4;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(image, frame * 10, row * 10, 10, 10, Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    ctx.restore();
  }

  function drawHeader(title, subtitle = "") {
    drawPanel(0, 0, WIDTH, 104);
    drawText(title, 24, 35, 26, "#ffe17d");
    if (subtitle) affinityOrder.forEach((affinityId, index) => {
      const x = 75 + index * 165;
      drawCurrencyIcon(affinityId, x, 76, 24);
      drawText(formatAmount(state.save.essence[affinityId]), x + 19, 76, 17, affinityDefs[affinityId].color, "left", false);
    });
    drawCurrencyIcon("gold", 420, 35, 28);
    drawText(formatAmount(state.save.gold), 441, 35, 20, "#ffe17d");
  }

  const affinityWalletText = () => affinityOrder.map(id => `${affinityDefs[id].short} ${formatAmount(state.save.essence[id])}`).join("  •  ");
  function drawAffinityToken(affinityId, x, y, radius = 15) {
    drawCurrencyIcon(affinityId, x, y, radius * 2);
  }

  function drawTitle() {
    drawBackground(); drawRoad(); drawPanel(24, 130, 492, 635);
    drawText("SCOLLMONSTERS", WIDTH / 2, 203, 38, "#ffe17d", "center");
    drawText("A southbound monster journey", WIDTH / 2, 248, 19, "#a8d9ff", "center");
    drawPlayer(270, 347, 72);
    drawPet("feral-bat", 180, 412, 48); drawPet("bloom-bamboo", 270, 425, 48); drawPet("arcane-eye", 360, 412, 48);
    drawText("Touch and drag, or move your mouse", WIDTH / 2, 501, 19, "#fff", "center");
    drawText("to aim. Attacks fire automatically.", WIDTH / 2, 533, 19, "#fff", "center");
    drawText("Unlock auto-target, then tap its button", WIDTH / 2, 587, 17, "#c9d5e3", "center");
    drawText("or press Space to switch aiming modes.", WIDTH / 2, 615, 17, "#c9d5e3", "center");
    drawButton(state.save.completed.length ? "CONTINUE" : "BEGIN JOURNEY", 80, 664, 380, 72, true, () => setMode("map"));
    drawButton("RESET PROGRESS", 130, 768, 280, 52, true, () => {
      if (!window.confirm("Reset all progress in this browser? Gold, essence, creatures, upgrades and cleared stages will be erased. This cannot be undone.")) return;
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(LEGACY_SAVE_KEY);
      window.location.reload();
    });
  }

  function mapNodePosition(stageNumber) {
    const column = stageNumber <= 5 ? stageNumber - 1 : 10 - stageNumber;
    return { x: 64 + column * 104, y: stageNumber <= 5 ? 350 : 190 };
  }

  function drawMap() {
    const colors = UI_THEME.colors;
    ctx.fillStyle = UI_THEME.colors.dark;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawWood("woodBackground", 0, 0, WIDTH, HEIGHT, 4, 2);
    drawHeader("OVERWORLD", affinityWalletText());
    const reached = new URLSearchParams(location.search).get("overworld") === "explored" ? 10 : Math.min(10, state.save.unlockedStage);
    state.selectedStage = Math.min(state.selectedStage, reached);
    // Unreached terrain is not drawn; only the cleared route and current frontier are revealed.
    ctx.save();ctx.beginPath();ctx.rect(14,116,512,320);ctx.clip();
    ctx.fillStyle = colors.dark;ctx.fillRect(14,116,512,320);
    ctx.save();ctx.beginPath();
    if (reached === 10) ctx.rect(14,116,512,320);
    else for(let n=1;n<=reached;n++) { const p=mapNodePosition(n);ctx.moveTo(p.x+82,p.y);ctx.arc(p.x,p.y,82,0,Math.PI*2); }
    ctx.clip();
    const map = assets.overworldMap;
    if(map?.complete && map.naturalWidth)ctx.drawImage(map,14,116,512,320);
    ctx.restore();
    for(let n=1;n<=reached;n++) {
      const p=mapNodePosition(n),selected=n===state.selectedStage,complete=state.save.completed.includes(n);
      ctx.fillStyle=selected?colors.accent:complete?colors.field:colors.dark;
      ctx.fillRect(p.x-16,p.y-9,32,30);
      drawText(String(n),p.x,p.y+6,18,selected?colors.dark:colors.text,"center",false);
      if(selected) {ctx.strokeStyle=colors.text;ctx.lineWidth=2;ctx.strokeRect(p.x-20,p.y-13,40,38);}
      uiTargets.push({x:p.x-26,y:p.y-26,width:52,height:52,action:()=>{state.selectedStage=n;}});
    }
    if(reached<10)drawText("UNEXPLORED",270,139,15,colors.muted,"center");
    ctx.restore();
    const stage = stageConfigs[state.selectedStage-1];
    drawWood("woodPanel",18,450,504,218);
    drawWood("woodBackground",28,460,484,198,4,2);
    const roster = stageRosters[stage.number];
    if (roster) {
      const bossHp = precise(Math.round(28 * stage.bossHpScale) * stage.hpMultiplier * stage.bossHpMultiplier);
      const bossDamage = Math.max(1, Math.round(5 * stage.damageScale));
      const drawRosterEntry = (entry, x, compact) => {
        const creature = creatureById(entry.id), stats = rosterStats(entry, stage);
        drawPet(entry.id,x,compact ? 492 : 501,48);
        drawText(creature.name,x,compact ? 526 : 550,15,colors.text,"center");
        drawText(affinityDefs[creature.affinityId].name,x,compact ? 549 : 575,15,colors[creature.affinityId],"center");
        drawText(`HP ${stats.hp}`,x,compact ? 577 : 609,15,colors.text,"center");
        drawText(`ATK ${stats.damage}`,x,compact ? 601 : 635,15,colors.text,"center");
      };
      roster.forEach((entry,index)=>drawRosterEntry(entry,102+index*162,roster.length>2));
      if (roster.length === 2) {
        drawSheetFrame("demonWalk",432,498,0,6,72);
        drawText("Demon Cyclop",432,550,15,colors.text,"center");
        drawText("Boss",432,575,15,colors.accent,"center");
        drawText(`HP ${bossHp}`,432,609,15,colors.text,"center");
        drawText(`ATK ${bossDamage}`,432,635,15,colors.text,"center");
      } else {
        ctx.fillStyle=colors.muted;ctx.fillRect(44,615,452,1);
        if(stage.number===3) drawPet("feral-bat",62,637,32);
        else drawSheetFrame("demonWalk",62,637,0,6,40);
        drawText(stage.number===3?"Bat Boss":"Demon Cyclop",88,640,15,colors.text);
        drawText(`HP ${bossHp} / ATK ${bossDamage}`,490,640,15,colors.text,"right");
      }
    } else {
      const enemyTypes = stage.number === 1 ? [[1,1]] : stage.number === 2 ? [[1,1],[3,2]] : [[1,1],[2,1],[3,2]];
      const range = values => { const lo=Math.min(...values), hi=Math.max(...values); return lo===hi ? String(lo) : `${lo}-${hi}`; };
      const hpRange = range(enemyTypes.map(([hp])=>precise(Math.round(hp*stage.hpScale)*stage.hpMultiplier)));
      const damageRange = range(enemyTypes.map(([,damage])=>Math.max(1,Math.round(damage*stage.damageScale))));
      Object.values(speciesDefs).forEach((species,index)=>{
        const x=100+index*170;
        drawPet(monsterCatalog.find(c => c.affinityId === species.affinityId && c.tier === Math.min(3,Math.ceil(stage.number/4))).id,x-32,489,48);
        drawCurrencyIcon(species.affinityId,x+16,483,20);
        drawText(`${Math.round(species.density[stage.number-1]*100)}%`,x+33,485,15,colors[species.affinityId],"left",false);
        drawText(affinityDefs[species.affinityId].name,x,522,15,colors.text,"center");
        const openingFanglet = stage.number <= 2 && species.petType === "striker";
        drawText(`HP ${openingFanglet ? 2*stage.hpMultiplier : hpRange}`,x,547,15,colors.text,"center");
        drawText(`DMG ${openingFanglet ? 2 : damageRange}`,x,571,15,colors.text,"center");
      });
      const bossName=stage.number===3?"Feral boss":[1,2,4].includes(stage.number)?"Demon Cyclop":"Boss";
      const bossHp=precise(Math.round(28*stage.bossHpScale*(stage.majorBoss?1.5:1))*stage.hpMultiplier*stage.bossHpMultiplier);
      drawText(`${bossName}: HP ${bossHp} / DMG ${Math.max(1,Math.round(5*stage.damageScale))}`,36,638,15,colors.text);
      drawText(`Other monsters: HP ${hpRange} / DMG ${damageRange}`,36,608,15,colors.text);
    }
    drawWood("woodPanel",18,686,504,162);
    drawWood("woodBackground",28,696,484,142,4,2);

    drawBestiaryButton("BESTIARY",34,704,228,50,"normal",()=>setMode("bestiary"));
    drawBestiaryButton("UPGRADES",278,704,228,50,"normal",()=>setMode("upgrades"));
    drawBestiaryButton(`PLAY STAGE ${stage.number}`,34,772,472,58,"normal",()=>startStage(stage.number));
  }

  const summonPool = (affinityId,tier) => monsterCatalog.filter(c => c.affinityId === affinityId && c.tier === tier && (state.save.fragments[c.id] || 0) < 5);
  function summonCreature(affinityId,tier) {
    const pool = summonPool(affinityId,tier), cost = [0,10,100,1000][tier];
    if (!pool.length || !cost || state.save.essence[affinityId] < cost) return null;
    const creature = pool[Math.floor(Math.random()*pool.length)];
    state.save.essence[affinityId] -= cost;
    if (!hasRecruit(creature.id)) {
      state.save.ownedCreatures.push(creature.id);
      if (state.save.activeParty.length < 3) state.save.activeParty.push(creature.id);
      state.toast = `${creature.name} unlocked!`;
    } else {
      state.save.fragments[creature.id] = (state.save.fragments[creature.id] || 0)+1;
      state.toast = state.save.fragments[creature.id] === 5 ? `${creature.name} shiny unlocked!` : `${creature.name} fragment ${state.save.fragments[creature.id]}/5`;
    }
    state.toastTimer=3; playSound("success"); writeSave(); return creature.id;
  }

  const creatureGateUnlocked = creature => !creature.requiresStageClear || state.save.completed.includes(creature.requiresStageClear);
  function recruitCreature(creature) {
    if (!creature) return;
    if (hasRecruit(creature.id)) return toggleCreatureInParty(creature.id);
    if (creature.tier) return;
    if (!creatureGateUnlocked(creature)) {
      state.toast = `Clear stage ${creature.requiresStageClear} to unlock ${creature.name}`;
      state.toastTimer = 2; return;
    }
    if (state.save.essence[creature.affinityId] < creature.captureCost) {
      state.toast = `Need ${creature.captureCost - state.save.essence[creature.affinityId]} more ${currencyName(creature.affinityId)}`;
      state.toastTimer = 2; return;
    }
    state.save.essence[creature.affinityId] -= creature.captureCost;
    state.save.ownedCreatures.push(creature.id);
    if (state.save.activeParty.length < 3) state.save.activeParty.push(creature.id);
    playSound("success");
    state.toast = `${creature.name} recruited${isActiveCreature(creature.id) ? " and added to the party" : ""}!`;
    state.toastTimer = 2;
    writeSave();
  }

  function toggleCreatureInParty(creatureId) {
    const creature = creatureById(creatureId);
    if (!hasRecruit(creatureId)) return;
    if (isActiveCreature(creatureId)) {
      state.save.activeParty = state.save.activeParty.filter(id => id !== creatureId);
      state.toast = `${creature.name} moved to reserves`;
    } else if (state.save.activeParty.length >= 3) {
      state.toast = "Party full — move a creature to reserves first";
      state.toastTimer = 2; return;
    } else {
      state.save.activeParty.push(creatureId);
      state.toast = `${creature.name} joined the active party`;
    }
    state.toastTimer = 2;
    writeSave();
  }

  function drawBestiaryButton(label, x, y, width, height, visualState = "normal", action = null) {
    const slice = UI_THEME.slices.button;
    if (action) uiTargets.push({ x, y, width, height, action });
    const image = visualState === "selected" ? "woodButtonHover" : visualState === "locked" ? "woodButtonDisabled" : "woodButton";
    drawWood(image, x, y, width, height, slice.x, slice.scale, slice.y);
    ctx.font = '15px "NinjaPixel", monospace';
    const size = Math.floor(Math.min(15, 15 * (width - 16) / Math.max(1, ctx.measureText(label).width)));
    drawText(label, x + width / 2, y + height / 2, size, visualState === "locked" ? UI_THEME.colors.locked : UI_THEME.colors.dark, "center", false);
  }

  function drawMenuTab(label, x, y, width, height, selected, action, fontSize = 15) {
    const slice = UI_THEME.slices.tab;
    uiTargets.push({ x, y, width, height, action });
    drawWood(selected ? "woodTabSelected" : "woodTabUnselected", x, y, width, height, slice.x, slice.scale, slice.y);
    ctx.font = `${fontSize}px "NinjaPixel", monospace`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    ctx.wordSpacing = "2px";
    const metrics = ctx.measureText(label);
    const baseline = Math.round(y + height / 2 + (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2);
    ctx.fillStyle = selected ? UI_THEME.colors.dark : UI_THEME.colors.text;
    ctx.fillText(label, Math.round(x + width / 2), baseline, width - 16);

  }

  function drawBestiaryTab(affinityId, x, selected) {
    drawMenuTab(affinityDefs[affinityId].name.toUpperCase(), x, 237, 162, 42, selected, () => { bestiaryAffinity = affinityId; bestiaryPage = 0; });
  }

  function drawBestiary() {
    drawBestiaryBackground();
    drawWood("woodPanel", 15, 15, 510, 72);
    drawText("BESTIARY", 33, 51, 30, UI_THEME.colors.title);
    affinityOrder.forEach((affinityId, index) => {
      const x = 273 + index * 87;
      drawCurrencyIcon(affinityId, x, 51, 30);
      drawText(formatAmount(state.save.essence[affinityId]), x + 21, 51, 18, affinityDefs[affinityId].color, "left", false);
    });

    drawWood("woodPanel", 18, 99, 504, 126);
    drawText("ACTIVE PARTY", 36, 120, 18, UI_THEME.colors.accent, "left", false);
    for (let slot = 0; slot < 3; slot += 1) {
      const x = 36 + slot * 160, creatureId = state.save.activeParty[slot];
      drawWood("woodInventoryCell", x, 141, 136, 70);
      if (creatureId) drawPet(creatureId, x + 68, 176, 48);
      else drawText("EMPTY", x + 68, 176, 15, UI_THEME.colors.muted, "center");
    }

    affinityOrder.forEach((affinityId, index) => drawBestiaryTab(affinityId, 18 + index * 171, affinityId === bestiaryAffinity));

    [1,2,3].forEach((tier,index) => drawMenuTab(`TIER ${tier}`,18+index*171,291,162,36,bestiaryTier===tier,()=>{bestiaryTier=tier;bestiaryPage=0;}));
    const roster = creatureDefs.filter(c => c.affinityId === bestiaryAffinity && c.tier === bestiaryTier);
    const pages = Math.max(1, Math.ceil(roster.length / 3));
    roster.slice(bestiaryPage*3,bestiaryPage*3+3).forEach((creature,index)=>{
      const y=339+index*112, owned=hasRecruit(creature.id), active=state.save.activeParty.includes(creature.id);
      drawWood(owned ? "woodPanel" : "woodDisabled",18,y,504,102);
      drawPet(creature.id,63,y+50,48,owned?1:0.35);
      drawText(creature.name,99,y+24,18,UI_THEME.colors.text);
      drawText(`${creature.role} · Fragments ${state.save.fragments[creature.id] || 0}/5`,99,y+54,15,UI_THEME.colors.muted);
      drawBestiaryButton(owned ? (active ? "ACTIVE" : "ADD") : "LOCKED",369,y+10,135,34,owned?"normal":"locked",owned?()=>toggleCreatureInParty(creature.id):null);
      const unlocked=owned && state.save.fragments[creature.id]>=5;
      drawBestiaryButton(state.save.shinyCreatures.includes(creature.id)?"SHINY":"BASE",369,y+57,135,32,unlocked?"normal":"locked",unlocked?()=>{
        state.save.shinyCreatures=state.save.shinyCreatures.includes(creature.id)?state.save.shinyCreatures.filter(id=>id!==creature.id):[...state.save.shinyCreatures,creature.id];writeSave();
      }:null);
    });
    drawBestiaryButton("<",18,684,60,34,"normal",()=>{bestiaryPage=(bestiaryPage+pages-1)%pages;});
    drawText(`${bestiaryPage+1}/${pages}`,108,701,15);
    drawBestiaryButton(">",144,684,60,34,"normal",()=>{bestiaryPage=(bestiaryPage+1)%pages;});
    const pool=summonPool(bestiaryAffinity,bestiaryTier), cost=[0,10,100,1000][bestiaryTier];
    drawBestiaryButton(pool.length?`SUMMON ${cost}`:"COMPLETE",222,684,300,42,pool.length && state.save.essence[bestiaryAffinity]>=cost?"normal":"locked",()=>summonCreature(bestiaryAffinity,bestiaryTier));

    if (state.toastTimer > 0) drawText(state.toast, WIDTH / 2, 758, 15, UI_THEME.colors.title, "center");
    drawText("Choose up to three creatures for your active party", WIDTH / 2, 792, 15, UI_THEME.colors.muted, "center");
    drawBestiaryButton("BACK TO MAP", 99, 819, 342, 42, "normal", () => setMode("map"));
  }

  function rankRequirementText(definition) {
    const [id, level] = Object.entries(definition.requiredRanks)[0];
    return `Requires ${upgradeDefs.find(candidate => candidate.id === id).name} rank ${level}`;
  }

  function upgradeUnlocked(definition) {
    return (upgradeType(definition) ? ownsUpgradeType(definition) : (!definition.recruit || hasRecruit(definition.recruit))) && definition.requires.every(id => rank(id) >= (definition.requiredRanks?.[id] || 1));
  }

  const treeView = { x: 0, y: 0, zoom: 1 };
  const inTree = p => p.x >= 18 && p.x <= 522 && p.y >= 230 && p.y <= 582;
  function zoomTree(factor) {
    treeView.zoom = clamp(treeView.zoom * factor, 0.5, 1.6);
    render();
  }
  function iconTreePositions() {
    const definitions = treePositions().map(item => item.definition);
    if (upgradeBranch === 0) {
      // The central damage node anchors four spokes; outer nodes continue each path.
      const positions = {
        power3: [160, 490], boulderBuster: [270, 610], power: [270, 370], health: [270, 260], speed: [160, 370],
        multishot: [58, 370], tripleSpark: [58, 490],
        rockBreaker: [270, 490], magnet: [380, 370], travelSpeed: [482, 370],
        autoTarget: [482, 490], playerCritChance: [160, 260],
        playerCritDamage: [58, 260], partyBond: [380, 260]
      };
      return definitions.map(definition => ({ definition, x: positions[definition.id][0], y: positions[definition.id][1] }));
    }

    const depth = def => Math.max(0, ...def.requires.map(id => {
      const parent = definitions.find(item => item.id === id);
      return parent ? depth(parent) + 1 : 0;
    }));
    const levels = definitions.map(depth), maxDepth = Math.max(0, ...levels);
    return definitions.map((definition, index) => {
      const level = levels[index], peers = definitions.filter((_, i) => levels[i] === level);
      return { definition, x: Math.round(18 + (peers.indexOf(definition) + 0.5) * 504 / peers.length),
        y: Math.round(258 + level * Math.min(94, 278 / Math.max(1, maxDepth))) };
    });
  }

  function drawUpgrades() {
    const colors = UI_THEME.colors;
    ctx.fillStyle = colors.dark;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawWood("woodBackground", 0, 0, WIDTH, HEIGHT, 4, 2);
    drawPanel(0, 0, WIDTH, 104);
    drawBestiaryButton("< MAP", 16, 16, 120, 48, "normal", () => setMode("map"));
    drawText("UPGRADES", 154, 39, 30, colors.title);
    drawCurrencyIcon("gold", 418, 39, 30);
    drawText(formatAmount(state.save.gold), 506, 39, 18, colors.accent, "right", false);
    affinityOrder.forEach((id, index) => {
      const x = 62 + index * 166;
      drawCurrencyIcon(id, x, 82, 20);
      drawText(formatAmount(state.save.essence[id]), x + 22, 82, 18, colors[id], "left", false);
    });
    ["Player", "Feral", "Bloom", "Arcane"].forEach((name, index) => {
      const x = 14 + index * 130;
      drawMenuTab(name, x, 124, 122, 56, index === upgradeBranch, () => { upgradeBranch = index; selectedUpgrade = null; treeView.x = treeView.y = 0; treeView.zoom = 1; }, 30);
    });
    drawText("DRAG TO PAN", 110, 207, 15, colors.muted, "center", false);
    drawBestiaryButton("−", 290, 190, 48, 34, "normal", () => zoomTree(1 / 1.2));
    drawBestiaryButton("+", 346, 190, 48, 34, "normal", () => zoomTree(1.2));
    drawBestiaryButton("RESET", 402, 190, 114, 34, "normal", () => { treeView.x = treeView.y = 0; treeView.zoom = 1; });
    const positions = iconTreePositions();
    if (!positions.some(item => item.definition.id === selectedUpgrade)) selectedUpgrade = positions[0]?.definition.id;
    ctx.save();
    ctx.beginPath(); ctx.rect(18, 230, 504, 352); ctx.clip();
    ctx.translate(270 + treeView.x, 406 + treeView.y);
    ctx.scale(treeView.zoom, treeView.zoom); ctx.translate(-270, -406);
    for (const item of positions) for (const id of item.definition.requires) {
      const parent = positions.find(p => p.definition.id === id); if (!parent) continue;
      const ready = rank(id) >= (item.definition.requiredRanks?.[id] || 1);
      ctx.strokeStyle = item.definition.id === selectedUpgrade ? colors.accent : ready ? colors.muted : "#827660";
      ctx.lineWidth = item.definition.id === selectedUpgrade ? 4 : 2;
      const dx = item.x - parent.x, dy = item.y - parent.y;
      const inset = 42 / Math.max(Math.abs(dx), Math.abs(dy));
      ctx.beginPath();
      ctx.moveTo(parent.x + dx * inset, parent.y + dy * inset);
      ctx.lineTo(item.x - dx * inset, item.y - dy * inset);
      ctx.stroke();
    }
    for (const { definition: def, x, y } of positions) {
      const available = upgradeUnlocked(def), current = rank(def.id), maxed = current >= def.max;
      const icon = nodeIconPaths[def.id] ? def.id : def.id.endsWith("CritChance") ? "autoTarget" : "tripleSpark";
      drawSprite(`node_${icon}${current > 0 ? "" : "_off"}`, x, y, 72, available ? 1 : 0.65);
      const balance = def.currency ? state.save.essence[def.currency] : state.save.gold;
      if (available && !maxed && balance >= def.costs[current]) {
        // A quiet, staggered sweep marks upgrades that can be bought right now.
        const phase = (state.animationTime * 0.32 + x / 540 + y / 900) % 1;
        const sweep = x - 100 + phase * 200;
        ctx.save();
        ctx.beginPath(); ctx.rect(x - 36, y - 36, 72, 58); ctx.clip();
        const glow = ctx.createLinearGradient(sweep - 14, y - 36, sweep + 14, y + 22);
        glow.addColorStop(0, "#fff0b000");
        glow.addColorStop(0.5, "#fff0b033");
        glow.addColorStop(1, "#fff0b000");
        ctx.fillStyle = glow; ctx.fillRect(x - 36, y - 36, 72, 58);
        ctx.restore();
      }
      if (selectedUpgrade === def.id) drawWood("woodFocus", x - 40, y - 40, 80, 80, UI_THEME.slices.focus.x, UI_THEME.slices.focus.scale);
      ctx.fillStyle = colors.dark; ctx.fillRect(x - 26, y + 22, 52, 20);
      drawText(`${current}/${def.max}`, x, y + 32, 14, maxed ? colors.accent : colors.text, "center", false);
      const sx = 270 + treeView.x + (x - 270) * treeView.zoom, sy = 406 + treeView.y + (y - 406) * treeView.zoom;
      const left = Math.max(18, sx - 38 * treeView.zoom), top = Math.max(230, sy - 38 * treeView.zoom);
      const right = Math.min(522, sx + 38 * treeView.zoom), bottom = Math.min(582, sy + 42 * treeView.zoom);
      if (right > left && bottom > top) uiTargets.push({ x: left, y: top, width: right - left, height: bottom - top, action: () => { selectedUpgrade = def.id; } });
    }
    ctx.restore();
    const def = positions.find(item => item.definition.id === selectedUpgrade)?.definition;
    if (def) {
      const current = rank(def.id), maxed = current >= def.max, unlocked = upgradeUnlocked(def);
      const cost = def.costs[current] || 0, balance = def.currency ? state.save.essence[def.currency] : state.save.gold;
      let description = maxed ? `MAXED: ${def.effect(current - 1)}`
        : current === 0 ? `NEXT: ${def.effect(current)}`
        : `NOW: ${def.effect(current - 1)}. NEXT: ${def.effect(current)}`;
      if (!unlocked) {
        const requirements = def.requires.map(id => `${upgradeDefs.find(d => d.id === id)?.name || id} ${def.requiredRanks?.[id] || 1}`);
        if (upgradeType(def) && !ownsUpgradeType(def)) requirements.unshift(`Summon a ${affinityDefs[upgradeType(def)].name} creature`);
        else if (!upgradeType(def) && def.recruit && !hasRecruit(def.recruit)) requirements.unshift(`Recruit ${petDisplayNames[def.recruit]}`);
        description = `LOCKED: ${requirements.join("; ")}. ${description}`;
      }
      ctx.font = '15px "NinjaPixel", monospace';
      const lines = [""];
      for (const word of description.split(" ")) {
        const i = lines.length - 1, next = lines[i] ? `${lines[i]} ${word}` : word;
        if (ctx.measureText(next).width > 456 && lines[i]) lines.push(word); else lines[i] = next;
      }
      const buttonY = 642 + lines.length * 20;
      drawWood(unlocked ? "woodPanel" : "woodDisabled", 20, 596, 500, buttonY + 54 - 596);
      drawText(def.name, 38, 620, 21, unlocked ? colors.text : colors.locked, "left", unlocked);
      lines.forEach((line, i) => drawText(line, 38, 646 + i * 20, 15, unlocked ? colors.muted : colors.locked, "left", unlocked));
      const label = maxed ? "MAXED" : !unlocked ? "LOCKED" : `${balance >= cost ? "UPGRADE" : "NEED"} ${cost} ${def.currency ? affinityDefs[def.currency].short : "G"}`;
      drawBestiaryButton(label, 38, buttonY, 464, 42, !maxed && unlocked && balance >= cost ? "normal" : "locked",
        !maxed && unlocked && balance >= cost ? () => attemptUpgrade(def) : null);
    }
  }

  function drawCombat() {
    drawTrackScenery();
    drawParticles(true);
    for (const vase of state.vases) {
      if (vase.y < 126 || vase.y > HEIGHT - 96) continue;
      const variant = destructibleVariants[vase.variant ?? 0], image = assets[variant.sheet];
      if (image?.complete && image.naturalWidth) {
        ctx.drawImage(image, variant.x * 16, variant.y * 16, 16, 16, Math.round(vase.x - 16), Math.round(vase.y - 16), 32, 32);
      }
    }
    for (const rock of state.obstacles) {
      if (rock.y < 126 - rock.r || rock.y > HEIGHT - 96 + rock.r) continue;
      const small = rock.size === "small", size = small ? 32 : 64;
      const image = assets.natureTiles;
      if (image?.complete && image.naturalWidth) {
        // Transparent atlas margins excluded from the circular shot collider.
        ctx.drawImage(image, small ? 272 : 240, small ? 208 : 160, small ? 16 : 32, small ? 16 : 32,
          Math.round(rock.x - size / 2), Math.round(rock.y - size / 2), size, size);
      } else {
        ctx.fillStyle = "#b58a64"; ctx.beginPath(); ctx.arc(rock.x, rock.y, rock.r, 0, Math.PI * 2); ctx.fill();
      }
      if (rank("rockBreaker")) {
        ctx.fillStyle = "#371c27"; ctx.fillRect(rock.x - rock.r, rock.y - rock.r - 10, rock.r * 2, 5);
        ctx.fillStyle = "#f0c65a"; ctx.fillRect(rock.x - rock.r, rock.y - rock.r - 10, rock.r * 2 * Math.max(0, rock.hp / rock.maxHp), 5);
      }
    }
    if (state.treasure) {
      const {x, y, open} = state.treasure;
      drawGridFrame("treasureChest", x, y, open ? 1 : 0, 2, 0, 1, 48);
      if (!open) {
        drawText("15G", x, y - 32, 16, "#ffe17d", "center");
        ctx.fillStyle = "#371c27"; ctx.fillRect(x - 20, y - 26, 40, 5);
        ctx.fillStyle = "#ffe17d"; ctx.fillRect(x - 20, y - 26, 40 * state.treasure.hp / state.treasure.maxHp, 5);
      }
    }
    for (const coin of state.drops) {
      const progress = Math.min(1, coin.age / 0.5);
      const x = coin.x + coin.offsetX * progress;
      const groundY = coin.y + coin.offsetY * progress;
      ctx.fillStyle = "#59452355";
      ctx.beginPath(); ctx.ellipse(x, groundY + 7, 7, 3, 0, 0, Math.PI * 2); ctx.fill();
      drawGridFrame("coinDrop", x, groundY - 4 * coin.popHeight * progress * (1 - progress), Math.floor(coin.age * 10) % 4, 4, 0, 4, 20);
    }
    drawPlayer(state.party.x, state.party.y, COMBAT_SPRITE_SIZE);
    for (const companion of state.companions) drawPet(companion.creatureId || companion.type, companion.x, companion.y, COMBAT_SPRITE_SIZE);
    if (state.party.shield) {
      ctx.strokeStyle = "#8ce9ff"; ctx.lineWidth = 3;
      for (const body of partyBodies()) {
        ctx.beginPath(); ctx.arc(body.x, body.y, body.r + 9, 0, Math.PI * 2); ctx.stroke();
      }
    }
    for (const enemy of state.enemies) {
      drawMonster(enemy);
      ctx.fillStyle = "#371c27"; ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 13, enemy.r * 2, 5);
      ctx.fillStyle = enemy.type === "boss" ? "#ffb347" : "#ff6b5c"; ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 13, enemy.r * 2 * clamp(enemy.hp / enemy.maxHp, 0, 1), 5);
    }
    if (state.bossSpawned && !state.bossDefeated) {
      drawText(state.stage.majorBoss ? "DEFEAT THE BOSS" : "DEFEAT THE MINIBOSS", WIDTH / 2, HEIGHT - 114, 18, "#ffe17d", "center");
    }
    for (const projectile of state.projectiles) {
      if ((projectile.source === "player" || projectile.source === "boulderBuster")) {
        const frame = Math.floor(projectile.age * 12) % 4;
        const rotation = Math.atan2(projectile.vy, projectile.vx);
        if (!drawSheetFrame("earthProjectile", projectile.x, projectile.y, frame, 4, 200, rotation)) drawSprite("playerShot", projectile.x, projectile.y, projectile.r * 6);
      } else drawSprite(projectile.friendly ? "playerShot" : "enemyShot", projectile.x, projectile.y, projectile.r * 3);
    }
    for (const effect of state.effects) {
      const alpha = clamp(effect.life / effect.maxLife, 0, 1);
      if (effect.type === "aoe") {
        ctx.strokeStyle = `rgba(185,124,255,${alpha})`; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * (1.1 - alpha * 0.1), 0, Math.PI * 2); ctx.stroke();
      } else if (effect.type === "groundTrap") {
        const frame = Math.min(9, Math.floor((1 - effect.life / effect.maxLife) * 10));
        drawSheetFrame("groundTrap", effect.x, effect.y, frame, 10, 300);
      } else if (effect.type === "earthImpact") {
        const frame = Math.min(7, Math.floor((1 - effect.life / effect.maxLife) * 8));
        if (!drawSheetFrame("earthImpact", effect.x, effect.y, frame, 8, 100, 0, alpha)) drawSprite("impact", effect.x, effect.y, effect.radius * 2, alpha);
      } else drawSprite(effect.type === "heal" ? "heal" : "impact", effect.x, effect.y, effect.radius * 2, alpha);
    }
    drawParticles(false);
    if (!state.save.autoTargetEnabled || !autoTargetUnlocked()) drawSprite("crosshair", state.mouse.x, state.mouse.y, 34);
    drawPanel(12, 12, WIDTH - 24, 96);
    const healthRatio = clamp(state.party.hp / state.party.maxHp, 0, 1);
    const vessel = assets.healthVessel, fill = assets.healthFill;
    if (vessel?.naturalWidth) ctx.drawImage(vessel, 25, 32, 34, 56);
    if (fill?.naturalWidth && healthRatio > 0) {
      // Fixed artwork; only the integer-pixel reveal changes with actual HP.
      const height = Math.round(40 * healthRatio);
      ctx.save();
      ctx.beginPath(); ctx.rect(31, 80 - height, 22, height); ctx.clip();
      ctx.drawImage(fill, 31, 40, 22, 40);
      ctx.restore();
    }
    drawText(`${Math.max(0, precise(state.party.hp))}/${state.party.maxHp} HP`, 75, 36, 20, "#fff");
    if (state.toastTimer > 0) drawText(state.toast, WIDTH / 2, 155, 18, "#ffe17d", "center");
    const goldText = formatAmount(state.save.gold + state.runGold);
    ctx.font = '20px "NinjaPixel", monospace';
    const goldIconX = 446 - ctx.measureText(goldText).width - 18;
    drawCurrencyIcon("gold", goldIconX, 36, 24);
    drawText(goldText, 446, 36, 20, "#ffe17d", "right");
    affinityOrder.forEach((affinityId, index) => {
      const x = 82 + index * 116;
      drawAffinityToken(affinityId, x, 74, 12);
      drawText(formatAmount(state.save.essence[affinityId] + state.runEssence[affinityId]), x + 20, 74, 18, "#fff");
    });
    const autoOn = autoTargetUnlocked() && state.save.autoTargetEnabled;
    drawSprite(autoOn ? "autoAttackBook" : "autoAttackBookDisabled", 484, 60, 48);
    if (autoTargetUnlocked()) uiTargets.push({ x: 460, y: 36, width: 48, height: 48, action: toggleAutoTarget });

  }

  function drawResult() {
    drawBackground(); drawRoad(); drawPanel(24, 130, 492, 650);
    drawText(state.result.won ? `STAGE ${state.result.stage} CLEAR` : "PARTY DEFEATED", WIDTH / 2, 195, 31, state.result.won ? "#8ce99a" : "#ff7b7b", "center");
    drawText(`Total gold: ${formatAmount(state.save.gold)}`, WIDTH / 2, 270, 24, "#ffe17d", "center");
    affinityOrder.forEach((affinityId, index) => {
      const affinity = affinityDefs[affinityId], y = 325 + index * 38;
      drawAffinityToken(affinityId, 128, y, 12);
      drawText(`${affinity.name} essence: +${state.result.essence[affinityId]} (${state.save.essence[affinityId]} total)`, 150, y, 18, affinity.color);
    });
    const gateOpened = state.result.won && creatureDefs.some(creature => creature.requiresStageClear === state.result.stage);
    drawText(gateOpened ? "A new creature is available in the Bestiary." : state.result.won ? (state.result.stage < 10 ? `Stage ${state.result.stage + 1} is now available.` : "All ten stages cleared!") : "Buy upgrades or adjust your party, then retry.", WIDTH / 2, 478, 20, "#fff", "center");
    drawButton("RETURN TO MAP", 80, 590, 380, 70, true, () => setMode("map"));
    drawButton("RETRY STAGE", 80, 685, 380, 64, true, () => startStage(state.result.stage));
  }

  function render() {
    uiTargets = [];
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    if (state.mode === "title") drawTitle(); else if (state.mode === "map") drawMap(); else if (state.mode === "bestiary") drawBestiary(); else if (state.mode === "upgrades") drawUpgrades(); else if (state.mode === "combat") drawCombat(); else if (state.mode === "result") drawResult();
    ctx.endFrame?.();
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * WIDTH / rect.width, y: (event.clientY - rect.top) * HEIGHT / rect.height };
  }

  function attemptUpgrade(definition) {
    const current = rank(definition.id);
    if (!upgradeUnlocked(definition)) {
      if (upgradeType(definition) && !ownsUpgradeType(definition)) state.toast = `Summon a ${affinityDefs[upgradeType(definition)].name} creature first`;
      else if (definition.id === "partyBond") state.toast = "Recruit Buttermant first";
      else if (definition.requiredRanks) state.toast = rankRequirementText(definition);
      else if (definition.recruit) state.toast = `Recruit ${petDisplayNames[definition.recruit]} first`;
      else state.toast = "Purchase the prerequisite first";
      state.toastTimer = 1.8; return;
    }
    if (current >= definition.max) return;
    const cost = definition.costs[current];
    const currency = definition.currency || "gold";
    if (currencyAmount(currency) < cost) { state.toast = `Need ${formatAmount(cost - currencyAmount(currency))} more ${currencyName(currency)}`; state.toastTimer = 1.8; return; }
    spendCurrency(currency, cost);
    state.save.upgrades[definition.id] = current + 1;
    playSound("success");
    state.toast = "";
    state.toastTimer = 0;
    if (definition.id === "autoTarget") state.save.autoTargetEnabled = true;
    writeSave();
  }

  function toggleAutoTarget() {
    if (!autoTargetUnlocked()) return;
    state.save.autoTargetEnabled = !state.save.autoTargetEnabled;
    writeSave(); render();
  }

  function targetAt(point) {
    return uiTargets.find(target => point.x >= target.x && point.x <= target.x + target.width && point.y >= target.y && point.y <= target.y + target.height);
  }

  let treeDrag = null, treeDragged = false;
  canvas.addEventListener("wheel", event => {
    if (state.mode !== "upgrades" || !inTree(canvasPoint(event))) return;
    event.preventDefault(); zoomTree(event.deltaY < 0 ? 1.1 : 1 / 1.1);
  }, { passive: false });
  let aimPointer = null;
  let aimGesture = false;
  canvas.addEventListener("pointerdown", event => {
    if (!event.isPrimary) return;
    unlockAudio();
    const point = canvasPoint(event);
    if (state.mode === "upgrades" && inTree(point)) {
      treeDrag = { id: event.pointerId, start: point, x: treeView.x, y: treeView.y }; treeDragged = false;
      canvas.setPointerCapture?.(event.pointerId); return;
    }
    aimGesture = state.mode === "combat" && !targetAt(point);
    if (aimGesture) {
      state.mouse = point;
      aimPointer = event.pointerId;
      canvas.setPointerCapture?.(event.pointerId);
    }
  });
  canvas.addEventListener("pointermove", event => {
    if (treeDrag && event.pointerId === treeDrag.id && state.mode === "upgrades") {
      const p = canvasPoint(event), dx = p.x - treeDrag.start.x, dy = p.y - treeDrag.start.y;
      if (Math.hypot(dx, dy) > 5) treeDragged = true;
      if (treeDragged) { treeView.x = clamp(treeDrag.x + dx, -650, 650); treeView.y = clamp(treeDrag.y + dy, -650, 650); render(); }
      return;
    }
    if (!event.isPrimary || state.mode !== "combat") return;
    if (event.pointerType === "mouse" || event.pointerId === aimPointer) {
      const point = canvasPoint(event);
      if (!targetAt(point)) state.mouse = point;
    }
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    canvas.addEventListener(type, event => { if (aimPointer === event.pointerId) aimPointer = null; if (treeDrag?.id === event.pointerId) treeDrag = null; });
  }
  canvas.addEventListener("click", event => {
    if (treeDragged) { treeDragged = false; return; }
    if (aimGesture) { aimGesture = false; return; }
    unlockAudio();
    const target = targetAt(canvasPoint(event));
    if (target) { playSound("select"); target.action(); }
    render();
  });

  document.addEventListener("keydown", event => {
    unlockAudio();
    if (event.code === "Space" && autoTargetUnlocked()) {
      event.preventDefault(); if (!event.repeat) toggleAutoTarget();
    }
    if (event.key.toLowerCase() === "f") {
      if (!document.fullscreenElement) canvas.requestFullscreen?.(); else document.exitFullscreen?.();
    }
  });

  window.render_game_to_text = () => JSON.stringify({
    engine: scene ? { name: "Phaser", version: Phaser.VERSION, renderer: "Canvas", scene: scene.sys.settings.key } : null,
    audio: { track: currentTrack, unlocked: audioUnlocked, playing: !!music && !music.paused },
    coordinateSystem: "origin top-left; x east; y south; canvas 540x900", mode: state.mode, selectedStage: state.selectedStage,
    unlockedStage: state.save.unlockedStage, completedStages: state.save.completed,
    party: { x: state.party.x, y: state.party.y, hp: precise(state.party.hp), maxHp: state.party.maxHp, shield: !!state.party.shield, shieldCooldown: precise(Math.max(0, (state.party.shieldReadyAt || 0) - state.stageTime)), damage: playerDamage(), members: ["player", ...state.save.activeParty], bodies: partyBodies().map(({type,x,y,r}) => ({type,x,y,r})), memberNames: ["Player", ...state.save.activeParty.map(type => petDisplayNames[type])], animation: playerAnimation().animation, animationFrame: playerAnimation().frame },
    combat: state.mode === "combat" ? {
      direction: "north-to-south", scenery: sceneryKey(), movementMode: "centered-scrolling", cameraScroll: Math.round(state.scroll), travelSpeed: 24 * travelMultiplier(), spawnFrequencyMultiplier: travelMultiplier(), stage: state.stage.number, phase: state.bossSpawned ? "boss" : "journey", bossDefeated: state.bossDefeated,
      aim: { x: Math.round(state.mouse.x), y: Math.round(state.mouse.y), mode: state.save.autoTargetEnabled && autoTargetUnlocked() ? "auto-nearest" : "cursor" },
      enemies: state.enemies.map(enemy => ({ type: enemy.type, species: enemy.species, affinityId: enemy.affinityId, sprite: enemy.demonCyclop ? "DemonCyclop" : enemy.monsterId || enemy.type, animationColumn: monsterColumns[enemy.edge], animationFrame: Math.floor(state.animationTime * 8) % 4, ...(enemy.demonCyclop ? demonAnimation(enemy) : {}), edge: enemy.edge, x: Math.round(enemy.x), y: Math.round(enemy.y), hp: Math.ceil(enemy.hp), maxHp: enemy.maxHp, damage: enemy.damage, gold: enemy.gold, speed: enemy.speed })),
      projectiles: state.projectiles.map(projectile => ({ x: Math.round(projectile.x), y: Math.round(projectile.y), friendly: projectile.friendly, critical: !!projectile.critical, source: projectile.source, damage: projectile.damage, animationFrame: (projectile.source === "player" || projectile.source === "boulderBuster") ? Math.floor(projectile.age * 12) % 4 : null })),
      weather: weatherType(),
      particles: { total: state.particles.length, counts: state.particles.reduce((counts, p) => { counts[p.kind] = (counts[p.kind] || 0) + 1; return counts; }, {}) },
      destructiblesSpawned: state.propsSpawned,
      vases: state.vases.map(vase => ({ x: Math.round(vase.x), y: Math.round(vase.y), hp: vase.hp, radius: vase.r, variant: destructibleVariants[vase.variant ?? 0].id, coinDropChance: 0.25 })),
      effects: state.effects.map(effect => ({ type: effect.type, x: Math.round(effect.x), y: Math.round(effect.y) })),
      companions: state.companions.map(companion => ({ role: companion.type, name: petDisplayNames[companion.creatureId || companion.type], creatureId: companion.creatureId, shiny: state.save.shinyCreatures.includes(companion.creatureId), x: Math.round(companion.x), y: Math.round(companion.y), animationFrame: Math.floor(state.animationTime * 8) % 4 })),
      coins: state.drops.map(coin => ({ x: coin.x, y: coin.y, phase: coin.age < 0.5 ? "pop" : coin.age < 0.65 ? "rest" : "travel", animationFrame: Math.floor(coin.age * 10) % 4 })),
      treasure: state.treasure, treasureSpawnAt: state.treasureSpawnAt, treasureGold: state.treasureGold,
      obstacles: state.obstacles.map(rock => ({x: Math.round(rock.x), y: Math.round(rock.y), radius: Math.round(rock.r), size: rock.size, spriteSize: rock.size === "small" ? 32 : 64, hp: rock.hp, maxHp: rock.maxHp, destructible: !!rank("rockBreaker"), blocks: "player shots"})), totalGold: precise(state.save.gold + state.runGold), totalEssence: Object.fromEntries(affinityOrder.map(id => [id, state.save.essence[id] + state.runEssence[id]])), goldPickup: "automatic-on-kill", runGold: state.runGold, runEssence: state.runEssence
    } : null,
    upgradeBranch: ["Player", "Feral", "Bloom", "Arcane"][upgradeBranch],
    bestiaryAffinity,
    bestiary: creatureDefs.map(creature => ({ id: creature.id, name: creature.name, affinityId: creature.affinityId, role: creature.role, cost: creature.captureCost, requiresStageClear: creature.requiresStageClear, gateUnlocked: creatureGateUnlocked(creature), owned: hasRecruit(creature.id), active: isActiveCreature(creature.id) })),
    fragments: state.save.fragments, shinyCreatures: state.save.shinyCreatures,
    essence: state.save.essence, essencePity: state.save.essencePity, ownedCreatures: state.save.ownedCreatures, activeParty: state.save.activeParty, bankedGold: state.save.gold, upgrades: state.save.upgrades, autoTargetUnlocked: autoTargetUnlocked(), autoTargetEnabled: state.save.autoTargetEnabled, result: state.result
  });

  window.advanceTime = ms => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let index = 0; index < steps; index += 1) update(FIXED_STEP);
    render();
  };

  window.__scollTest = {
    summonCreature, summonPool, monsterCatalog, spawnEnemy,
    getSave: () => JSON.parse(JSON.stringify(state.save)),
    setSave: save => {
      const fresh = defaultSave();
      state.save = { ...fresh, ...save, essence: { ...fresh.essence, ...(save.essence || {}) }, essencePity: { ...fresh.essencePity, ...(save.essencePity || {}) }, ownedCreatures: [...new Set(save.ownedCreatures || [])], activeParty: [...new Set(save.activeParty || [])].slice(0, 3), upgrades: mergeHealthRanks(save.upgrades || {}) };
      writeSave(); render();
    },
    startStage,
    setMode,
    recruitById: id => recruitCreature(creatureById(id)),
    toggleCreatureInParty,
    clearCombat: () => { if (state.mode === "combat") { [...state.enemies].forEach(enemy => { if (state.mode === "combat") damageEnemy(enemy, enemy.hp); }); state.stageTime = state.stage.duration; state.bossSpawned = true; state.bossDefeated = true; update(FIXED_STEP); render(); } },
    resetSave: () => { state.save = defaultSave(); localStorage.removeItem(SAVE_KEY); localStorage.removeItem(LEGACY_SAVE_KEY); state.selectedStage = 1; setMode("title"); },
    balanceProjection, stageDpsEstimate
  };

  if (new URLSearchParams(location.search).get("overworld") === "explored") setMode("map");

  document.fonts?.load('16px "NinjaPixel"').then(() => render());
  render();
  if (!window.__vt_pending) {
    // Phaser supplies delta in milliseconds; simulation remains in seconds.
    scene?.events.on('update', (_time, delta) => { update(Math.min(0.05, delta / 1000)); render(); });
  }
  return { render };
  }

  // The standalone simulation path lets the existing Node checks run without a
  // DOM or GPU. Browser entry points always load Phaser before this file.
  if (!window.Phaser) { createGame(); return; }
  class ScrollMonstersScene extends Phaser.Scene {
    constructor() { super('ScrollMonsters'); }
    create() {
      createGame(this);
      window.__phaserReady = true;
    }
  }
  window.scrollMonstersGame = new Phaser.Game({
    type: Phaser.CANVAS,
    canvas: document.getElementById('game'),
    width: 540, height: 900,
    transparent: false, backgroundColor: '#79b867',
    pixelArt: true, roundPixels: false,
    audio: { noAudio: true }, // Existing music selection and unlock rules are retained.
    scale: { mode: Phaser.Scale.NONE, autoRound: false },
    scene: [ScrollMonstersScene],
    banner: false
  });
})();
