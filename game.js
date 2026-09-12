(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  let uiTargets = [];
  let upgradeBranch = 0;
  const SAVE_KEY = "scollmonsters-save-v1";
  const FIXED_STEP = 1 / 60;

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
    monsterBasic: "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Bamboo/SpriteSheet.png",
    monsterRanged: "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Axolot/SpriteSheet.png",
    woodPanel: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/nine_path_panel.png",
    woodDisabled: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/nine_path_panel_disabled.png",
    woodButton: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/button_normal.png",
    woodButtonDisabled: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/button_disabled.png",
    woodFocus: "assets/Ninja Adventure - Asset Pack/Ui/Theme/Theme Wood/nine_path_focus.png",
    healthVessel: "assets/Ninja Adventure - Asset Pack/Ui/Receptacle/Receptacle Rectangle/BackgroundWood.png",
    healthFill: "assets/Ninja Adventure - Asset Pack/Ui/Receptacle/Receptacle Rectangle/ProgressHealth.png",
    coinDrop: "assets/Ninja Adventure - Asset Pack/Items/Treasure/Coin2.png",
    treasureChest: "assets/Ninja Adventure - Asset Pack/Items/Treasure/LittleTreasureChest.png",
    demonWalk: "assets/Ninja Adventure - Asset Pack/Actor/Boss/DemonCyclop/Walk.png",
    demonHit: "assets/Ninja Adventure - Asset Pack/Actor/Boss/DemonCyclop/Hit.png",
    monsterArmored: "assets/Ninja Adventure - Asset Pack/Actor/Monsters/Beast/Beast.png",
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
  const assets = {};
  Object.entries(assetPaths).forEach(([key, file]) => {
    const image = new Image();
    image.onload = () => render();
    image.src = file.includes("/") ? file : `assets/placeholder/${file}`;
    assets[key] = image;
  });

  const roundTracks = ["37 - Dark Forest.ogg", "10 - Dark Castle.ogg", "17 - Fight.ogg", "23 - Road.ogg", "24 - Final Area.ogg", "28 - Tension.ogg", "21 - Dungeon.ogg"];
  const menuTrack = "1 - Adventure Begin.ogg";
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
    if (track !== currentTrack) {
      music.pause();
      currentTrack = track;
      music.src = `assets/Ninja Adventure - Asset Pack/Audio/Musics/${track}`;
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

  // Every ability compounds from its own starting price; rank 1 uses exponent zero.
  const abilityRankCosts = (baseCost, ranks) =>
    Array.from({ length: ranks }, (_, index) => Math.round(baseCost * 1.35 ** index));

  const upgradeDefs = [
    { id: "power", name: "Damage +1", branch: "PLAYER", max: 10, costs: abilityRankCosts(15, 10).map(cost => Math.round(cost * 0.8)), effect: rank => `+1 damage (${2 + rank + partyDamageBonus()} total)`, requires: [] },
    { id: "speed", name: "Quick Hands", branch: "PLAYER", max: 3, costs: abilityRankCosts(20, 3), effect: rank => `Fire interval -${10 * (rank + 1)}%`, requires: ["power"] },
    { id: "multishot", name: "Split Spark", branch: "PLAYER", max: 10, costs: abilityRankCosts(30, 10), effect: rank => `${10 * (rank + 1)}% second shot chance`, requires: ["speed"] },
    { id: "health", name: "Health +5", branch: "PLAYER", max: 10, costs: abilityRankCosts(15, 10), effect: rank => `+5 health → ${15 + rank * 5} HP`, requires: [] },
    { id: "magnet", name: "Golden Echo", branch: "SHARED", max: 3, costs: abilityRankCosts(15, 3), effect: rank => `Battle gold +${10 * (rank + 1)}%`, requires: [] },
    { id: "autoTarget", name: "Hunter's Eye", branch: "SHARED", max: 1, costs: abilityRankCosts(25, 1), effect: () => "Unlock Space auto-target toggle", requires: ["magnet"] },
    { id: "strikerPower", name: "Fangle Focus", branch: "STRIKER", max: 10, costs: abilityRankCosts(20, 10), effect: rank => `+1 damage (${2 + rank + partyDamageBonus()} total)`, requires: [], recruit: "striker" },
    { id: "strikerSpeed", name: "Fangle Rhythm", branch: "STRIKER", max: 2, costs: abilityRankCosts(25, 2), effect: rank => `Attack cooldown -${15 * (rank + 1)}%`, requires: ["strikerPower"], recruit: "striker" },
    { id: "healPower", name: "Kind Bloom", branch: "HEALER", max: 3, costs: abilityRankCosts(20, 3), effect: rank => `+1 healing → ${3 + rank} HP`, requires: [], recruit: "healer" },
    { id: "healSpeed", name: "Bloom Rhythm", branch: "HEALER", max: 2, costs: abilityRankCosts(25, 2), effect: rank => `Heal cooldown -${15 * (rank + 1)}%`, requires: ["healPower"], recruit: "healer" },
    { id: "aoePower", name: "Nova Heart", branch: "AOE", max: 10, costs: abilityRankCosts(25, 10), effect: rank => `+1 damage (${4 + rank} total)`, requires: [], recruit: "aoe" },
    { id: "aoeRadius", name: "Wide Nova", branch: "AOE", max: 2, costs: abilityRankCosts(30, 2), effect: rank => `AOE radius +${22 * (rank + 1)}px`, requires: ["aoePower"], recruit: "aoe" }
  ];

  upgradeDefs.push(
    { id: "partyBond", name: "Party Bond", branch: "HEALER", recruit: "healer", max: 1, costs: [50], requires: [], effect: () => "+5 player & Fangle damage" },
    { id: "strikerDouble", name: "Double Bite", branch: "STRIKER", max: 10, costs: abilityRankCosts(30, 10), effect: rank => `${10 * (rank + 1)}% second bite chance`, requires: ["strikerSpeed"], recruit: "striker" },
    { id: "strikerTriple", name: "Triple Bite", branch: "STRIKER", max: 10, costs: abilityRankCosts(30, 10), effect: rank => `${10 * (rank + 1)}% third bite on double`, requires: ["strikerDouble"], requiredRanks: { strikerDouble: 5 }, recruit: "striker" },
    { id: "tripleSpark", name: "Triple Spark", branch: "PLAYER", max: 10, costs: abilityRankCosts(30, 10), effect: rank => `${10 * (rank + 1)}% third shot on split`, requires: ["multishot"], requiredRanks: { multishot: 5 } },
    { id: "rockBreaker", name: "Rock Breaker", branch: "PLAYER", max: 1, costs: abilityRankCosts(30, 1), effect: () => "Player shots damage rocks", requires: ["power"] },
    { id: "deepBloom", name: "Deep Bloom", branch: "HEALER", max: 5, costs: abilityRankCosts(30, 5), currency: "mossEssence", effect: rank => `${20 * (rank + 1)}% double heal below half HP`, requires: [], recruit: "healer" },
    { id: "bloomShield", name: "Bloom Guard", branch: "HEALER", max: 1, costs: [200], currency: "mossEssence", effect: () => "Deep Bloom: block next hit; 2s cooldown", requires: ["deepBloom"], requiredRanks: { deepBloom: 5 }, recruit: "healer" },
    { id: "travelSpeed", name: "Trail Pace", branch: "SHARED", max: 10, costs: abilityRankCosts(20, 10), effect: rank => `Travel & spawns +${5 * (rank + 1)}%`, requires: [] },
    { id: "strikerFollowup", name: "Follow-Up Bite", branch: "STRIKER", max: 5, costs: abilityRankCosts(30, 5), currency: "fangEssence", effect: rank => `${20 * (rank + 1)}% extra bite on Fangle kill`, requires: [], recruit: "striker" },
    { id: "strikerFollowupHeal", name: "Mending Bite", branch: "STRIKER", max: 5, costs: abilityRankCosts(60, 5), currency: "fangEssence", effect: rank => `Follow-Up Bite heals for ${rank + 1} HP`, requires: ["strikerFollowup"], requiredRanks: { strikerFollowup: 1 }, recruit: "striker" },
  );

  for (const [owner, branch, recruit] of [["player", "PLAYER", null], ["striker", "STRIKER", "striker"], ["healer", "HEALER", "healer"], ["aoe", "AOE", "aoe"]]) {
    upgradeDefs.push(
      { id: `${owner}CritChance`, name: "Crit Chance", branch, recruit, max: 10, costs: abilityRankCosts(20, 10), requires: [], effect: level => `${level + 1}% critical ${owner === "healer" ? "heal" : "hit"} chance` },
      { id: `${owner}CritDamage`, name: owner === "healer" ? "Crit Healing" : "Crit Damage", branch, recruit, max: 5, costs: abilityRankCosts(30, 5), requires: [`${owner}CritChance`], effect: level => `${110 + level * 10}% critical ${owner === "healer" ? "healing" : "damage"}` }
    );
  }

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
    const averageRegularHealth = health.reduce((total, value, index) => total + value * weights[index], 0);
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
  const captureDefs = [
    { id: "captureStriker", name: "Fangle", branch: "STRIKER", capture: "striker", stage: 3, currency: "fangEssence", cost: 8, requires: [] },
    { id: "captureHealer", name: "Buttermant", branch: "HEALER", capture: "healer", stage: 5, requiresStageClear: 5, currency: "mossEssence", cost: 12, requires: [] },
    { id: "captureAoe", name: "Tinmin", branch: "AOE", capture: "aoe", stage: 10, requires: [] }
  ];
  const petDisplayNames = { striker: "Fangle", healer: "Buttermant", aoe: "Tinmin" };
  const monsterSheets = { basic: "monsterBasic", ranged: "monsterRanged", armored: "monsterArmored" };
  // Columns name spawn sections, not the monster's current movement heading.
  const monsterColumns = { north: 0, south: 1, east: 2, west: 3 };
  const playerAttackDuration = 0.24;
  const treeDefs = [...upgradeDefs, ...captureDefs];
  const treePositions = () => {
    const branch = ["PLAYER", "SHARED", "STRIKER", "HEALER", "AOE"][upgradeBranch];
    let definitions = treeDefs.filter(definition => definition.branch === branch);
    if (branch === "PLAYER") definitions = ["power", "speed", "multishot", "health", "rockBreaker", "tripleSpark", "playerCritChance", "playerCritDamage"].map(id => upgradeDefs.find(definition => definition.id === id));
    else definitions.sort((a, b) => Number(!!b.capture) - Number(!!a.capture));
    const rows = definitions.length > 8 ? Math.ceil(definitions.length / 2) : definitions.length > 6 ? 4 : 3;
    return definitions.map((definition, index) => ({ definition, x: 24 + Math.floor(index / rows) * 256, y: (rows > 4 ? 218 : 230) + index % rows * (rows > 4 ? 112 : rows === 4 ? 120 : 136), height: 108 }));
  };
  const treeRequirements = definition => definition.recruit && definition.requires.length === 0
    ? [captureDefs.find(capture => capture.capture === definition.recruit).id] : definition.requires;

  const defaultSave = () => ({ gold: 0, mossEssence: 0, mossDryKills: 0, fangEssence: 0, fangDryKills: 0, completed: [], unlockedStage: 1, recruits: [], upgrades: {}, autoTargetEnabled: false, stage4TreasureAttempted: false });
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
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      const legacyUpgrades = parsed.damageRank ? { power: parsed.damageRank } : {};
      return { ...defaultSave(), ...parsed, upgrades: mergeHealthRanks({ ...legacyUpgrades, ...(parsed.upgrades || {}) }) };
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
  const hasRecruit = id => state.save.recruits.includes(id);
  const writeSave = () => localStorage.setItem(SAVE_KEY, JSON.stringify(state.save));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const travelMultiplier = () => 1 + rank("travelSpeed") * 0.05;
  const partyDamageBonus = () => hasRecruit("healer") && rank("partyBond") > 0 ? 5 : 0;
  const playerDamage = () => 1 + rank("power") + partyDamageBonus();
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
    setMusic(mode === "combat" ? roundTracks[Math.floor(Math.random() * roundTracks.length)] : menuTrack);
    state.toast = "";
    render();
  }

  function setupCompanions() {
    state.companions = state.save.recruits.map((type, index) => ({ type, x: state.party.x, y: state.party.y - (index + 1) * 40, timer: 0.4 + index * 0.45, pulse: 0 }));
  }

  const partyBodies = () => [{ type: "player", x: state.party.x, y: state.party.y, r: 20 }, ...state.companions.map(companion => ({ ...companion, r: 18 }))];
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
    state.runEssence = 0;
    state.runMossEssence = 0;
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
    let type = forcedType;
    if (!type && state.stage.number === 1) type = "basic";
    if (!type && state.stage.number === 2) type = roll < 0.22 ? "armored" : "basic";
    if (!type) type = roll < armoredChance ? "armored" : roll < armoredChance + rangedChance ? "ranged" : "basic";
    const openingStage = state.stage.number <= 2;
    const base = {
      basic: { hp: 1, speed: openingStage ? 92 : 32, damage: 1, cooldown: 99, radius: 17 },
      ranged: { hp: 2, speed: 28, damage: 1, cooldown: 2.7, radius: 18 },
      armored: { hp: 3, speed: openingStage ? 70 : 24, damage: 2, cooldown: 99, radius: 22 },
      boss: { hp: 28, speed: state.stage.number <= 5 ? 72 : 28, damage: 5, cooldown: 2.4, radius: 42 }
    }[type];
    const bossFactor = type === "boss" ? (state.stage.majorBoss ? 1.5 : 1) : 1;
    const hpScale = type === "boss" ? state.stage.bossHpScale : state.stage.hpScale;
    const speciesRoll = Math.random();
    const canFang = !openingStage || state.stageTime >= 15;
    const species = type === "boss" ? (state.stage.number === 3 ? "fanglet" : null) : canFang && speciesRoll < fangDensity(state.stage.number) ? "fanglet" : speciesRoll >= fangDensity(state.stage.number) && speciesRoll < fangDensity(state.stage.number) + mossDensity(state.stage.number) ? "mossbud" : null;
    const openingFanglet = openingStage && species === "fanglet";
    const hp = precise((openingFanglet ? 2 : Math.round(base.hp * hpScale * bossFactor)) * state.stage.hpMultiplier * (type === "boss" ? state.stage.bossHpMultiplier : 1));
    const demonCyclop = type === "boss" && [1, 2, 4].includes(state.stage.number);
    const spawn = spawnPoint(base.radius, demonCyclop ? "north" : forcedEdge);
    state.enemies.push({
      type, species, demonCyclop, edge: spawn.edge, x: spawn.x, y: spawn.y, r: base.radius,
      hp, maxHp: hp, speed: base.speed * 1.4 * (type === "boss" ? 1 : 1.2), damage: openingFanglet ? 2 : Math.max(1, Math.round(base.damage * state.stage.damageScale)),
      gold: 1, meleeTimer: 0, meleeCooldown: 1.5, attackTimer: base.cooldown,
      attackCooldown: base.cooldown
    });
  }

  const fangDensity = stage => [0.2, 0.3, 0.7, 0.35, 0.25, 0.65, 0.3, 0.4, 0.75, 0.35][stage - 1];
  const mossDensity = stage => [0, 0, 0.1, 0.35, 0.6, 0.15, 0.5, 0.4, 0.15, 0.5][stage - 1];
  const currencyName = currency => currency === "mossEssence" ? "Buttermant essence" : currency === "fangEssence" ? "Fangle essence" : "gold";
  const fangYield = stage => 1 + Math.floor((stage - 1) / 3);
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
      shoot(state.party.x, state.party.y + 20, targetX, targetY, true, playerDamage(), 560, "player", spread);
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

  function removeEnemy(enemy, reward = false) {
    const index = state.enemies.indexOf(enemy);
    if (index < 0) return;
    state.enemies.splice(index, 1);
    if (reward) {
      awardGold(enemy.gold);
      spawnCoins(enemy.x, enemy.y, enemy.gold);
      if (enemy.species === "fanglet" && enemy.type !== "boss") {
        state.save.fangDryKills += 1;
        if (Math.random() < 0.3 || state.save.fangDryKills >= 5) {
          state.runEssence += fangYield(state.stage.number);
          state.save.fangDryKills = 0;
        }
      }
      if (enemy.species === "mossbud") {
        state.save.mossDryKills += 1;
        if (Math.random() < 0.3 || state.save.mossDryKills >= 5) {
          state.runMossEssence += fangYield(state.stage.number);
          state.save.mossDryKills = 0;
        }
      }
      if (enemy.type === "boss" && [5, 8, 10].includes(state.stage.number)) state.runMossEssence += 2 * fangYield(state.stage.number);
      if (enemy.type === "boss" && state.stage.number === 3) state.runEssence += 15;
      if (enemy.type === "boss" && [6, 9].includes(state.stage.number)) state.runEssence += 2 * fangYield(state.stage.number);
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

  function damageEnemy(enemy, amount, source = "player") {
    if (state.mode !== "combat" || !state.enemies.includes(enemy)) return;
    enemy.hp = precise(enemy.hp - amount);
    if (enemy.demonCyclop && amount > 0) enemy.hitStartedAt = state.animationTime;
    if (source === "strikerFollowup" && rank("strikerFollowupHeal")) {
      state.party.hp = precise(Math.min(state.party.maxHp, state.party.hp + rank("strikerFollowupHeal")));
    }
    const playerImpact = source === "player";
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
          const count = rollAttackCount("strikerDouble", "strikerTriple");
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
    state.save.fangEssence += state.runEssence;
    state.save.mossEssence += state.runMossEssence;
    if (won) {
      if (firstClear) state.save.completed.push(state.stage.number);
      state.save.unlockedStage = Math.max(state.save.unlockedStage, Math.min(10, state.stage.number + 1));
      const recruitAt = { 10: "aoe" }[state.stage.number];
      if (recruitAt && !hasRecruit(recruitAt)) {
        state.save.recruits.push(recruitAt);
        newRecruit = recruitAt;
      }
    }
    writeSave();
    state.result = { won, gold: state.runGold, essence: state.runEssence, mossEssence: state.runMossEssence, firstClear, newRecruit, stage: state.stage.number };
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
      if (projectile.source === "player") {
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
    const sheet = monsterSheets[enemy.type];
    const size = enemy.type === "boss" ? 92 : 48;
    if (!sheet || !drawGridFrame(sheet, enemy.x, enemy.y, monsterColumns[enemy.edge] ?? 1, 4, Math.floor(state.animationTime * 8) % 4, 4, size)) {
      drawSprite(enemy.type, enemy.x, enemy.y, size);
    }
  }

  function drawPet(type, x, y, size = 16, alpha = 1, facing = "south") {
    const row = { striker: 0, healer: 1, aoe: 2 }[type];
    const image = assets.petRoster;
    if (row === undefined || !image?.naturalWidth) return;
    const direction = facing === "north" ? 1 : facing === "east" || facing === "west" ? 2 : 0;
    const column = (Math.floor(state.animationTime * 8) % 4) * 3 + direction;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), Math.round(y));
    if (facing === "west") ctx.scale(-1, 1);
    ctx.drawImage(image, column * 16, row * 32, 16, 16, -24, -24, 48, 48);
    ctx.restore();
  }

  const captureFacing = edge => ({ north: "south", south: "north", east: "west", west: "east" }[edge] || "south");

  function drawText(value, x, y, size = 18, color = "#fff", align = "left") {
    ctx.font = `${size}px "NinjaPixel", monospace`;
    ctx.wordSpacing = "2px";
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#172335";
    if (color !== "#2b2218") ctx.fillText(value, x + 2, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }

  // Stretch only the centers and edges, preserving the pixel-art corners.
  function drawWood(name, x, y, width, height, border = 7, scale = 2) {
    const image = assets[name];
    if (!image?.complete || !image.naturalWidth) return;
    const sw = image.naturalWidth, sh = image.naturalHeight;
    const edge = Math.min(border * scale, width / 2, height / 2);
    const sx = [0, border, sw - border], sy = [0, border, sh - border];
    const srcW = [border, sw - border * 2, border], srcH = [border, sh - border * 2, border];
    const dx = [x, x + edge, x + width - edge], dy = [y, y + edge, y + height - edge];
    const dw = [edge, width - edge * 2, edge], dh = [edge, height - edge * 2, edge];
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) {
      ctx.drawImage(image, sx[col], sy[row], srcW[col], srcH[row], dx[col], dy[row], dw[col], dh[row]);
    }
  }

  function drawPanel(x, y, width, height, color = "") {
    drawWood(color === "#303541f5" ? "woodDisabled" : "woodPanel", x, y, width, height);

  }

  function drawButton(label, x, y, width, height, active = true, action = null) {
    if (active && action) uiTargets.push({ x, y, width, height, action });
    drawWood(active ? "woodButton" : "woodButtonDisabled", x, y, width, height, 2);
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

  function drawHeader(title, subtitle = "") {
    drawPanel(0, 0, WIDTH, 104);
    drawText(title, 24, 35, 26, "#ffe17d");
    if (subtitle) drawText(subtitle, 24, 77, 17, "#b9cee5");
    drawSprite("gold", 420, 35, 28);
    drawText(formatAmount(state.save.gold), 441, 35, 20, "#ffe17d");
  }

  function drawTitle() {
    drawBackground(); drawRoad(); drawPanel(24, 130, 492, 635);
    drawText("SCOLLMONSTERS", WIDTH / 2, 203, 38, "#ffe17d", "center");
    drawText("A southbound monster journey", WIDTH / 2, 248, 19, "#a8d9ff", "center");
    drawPlayer(270, 347, 72);
    drawPet("striker", 180, 412, 52); drawPet("healer", 270, 425, 52); drawPet("aoe", 360, 412, 52);
    drawText("Touch and drag, or move your mouse", WIDTH / 2, 501, 19, "#fff", "center");
    drawText("to aim. Attacks fire automatically.", WIDTH / 2, 533, 19, "#fff", "center");
    drawText("Unlock auto-target, then tap its button", WIDTH / 2, 587, 17, "#c9d5e3", "center");
    drawText("or press Space to switch aiming modes.", WIDTH / 2, 615, 17, "#c9d5e3", "center");
    drawButton(state.save.completed.length ? "CONTINUE" : "BEGIN JOURNEY", 80, 664, 380, 72, true, () => setMode("map"));
    drawButton("RESET PROGRESS", 130, 768, 280, 52, true, () => {
      if (!window.confirm("Reset all progress in this browser? Gold, essence, creatures, upgrades and cleared stages will be erased. This cannot be undone.")) return;
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    });
  }

  function mapNodePosition(stageNumber) {
    const row = Math.floor((stageNumber - 1) / 2);
    const column = row % 2 === 0 ? (stageNumber - 1) % 2 : 1 - (stageNumber - 1) % 2;
    return { x: 155 + column * 230, y: 185 + row * 120 };
  }

  function drawMap() {
    drawBackground();
    drawHeader("OVERWORLD", `Fangle: ${state.save.fangEssence} • Buttermant: ${state.save.mossEssence} essence`);
    ctx.strokeStyle = "#705239"; ctx.lineWidth = 16; ctx.lineCap = "round"; ctx.beginPath();
    for (let number = 1; number <= 10; number++) {
      const point = mapNodePosition(number);
      if (number === 1) ctx.moveTo(point.x, point.y); else ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
    for (let number = 1; number <= 10; number++) {
      const point = mapNodePosition(number);
      const complete = state.save.completed.includes(number), open = number <= state.save.unlockedStage;
      drawWood(open ? "woodButton" : "woodButtonDisabled", point.x - 36, point.y - 36, 72, 72, 2);
      if (number === state.selectedStage) drawWood("woodFocus", point.x - 42, point.y - 42, 84, 84, 3);
      if (complete) drawText("*", point.x + 24, point.y - 24, 16, "#fff3b0", "center");
      drawText(String(number), point.x, point.y, 24, "#fff", "center");
      if ([3, 5, 10].includes(number)) drawPet(number === 3 ? "striker" : number === 5 ? "healer" : "aoe", point.x - 64, point.y, 36, open ? 1 : 0.5);
      if (open) uiTargets.push({ x: point.x - 44, y: point.y - 44, width: 88, height: 88, action: () => { state.selectedStage = number; } });
    }
    drawText(`Fang ${Math.round(fangDensity(state.selectedStage) * 100)}% • Moss ${Math.round(mossDensity(state.selectedStage) * 100)}% • ${fangYield(state.selectedStage)} essence/drop`, WIDTH / 2, 715, 18, "#a9e9eb", "center");
    drawPanel(24, 744, 492, 132);
    drawText(`Stage ${state.selectedStage} — ${stageConfigs[state.selectedStage - 1].name}`, WIDTH / 2, 770, 20, "#fff", "center");
    drawButton("PLAY", 40, 798, 220, 62, true, () => startStage(state.selectedStage));
    drawButton("UPGRADES", 280, 798, 220, 62, true, () => setMode("upgrades"));
  }

  function rankRequirementText(definition) {
    const [id, level] = Object.entries(definition.requiredRanks)[0];
    return `Requires ${upgradeDefs.find(candidate => candidate.id === id).name} rank ${level}`;
  }

  function upgradeUnlocked(definition) {
    return (!definition.recruit || hasRecruit(definition.recruit)) && definition.requires.every(id => rank(id) >= (definition.requiredRanks?.[id] || 1));
  }

  function drawUpgrades() {
    drawBackground(); drawHeader("UPGRADES", `Fangle: ${state.save.fangEssence} • Buttermant: ${state.save.mossEssence} essence`);
    const branches = ["Player", "Shared", "Fangle", "Buttermant", "Tinmin"];
    branches.forEach((name, index) => {
      const x = 14 + index * 104;
      drawButton(name, x, 128, 96, 66, true, () => { upgradeBranch = index; });
      if (index === upgradeBranch) drawWood("woodFocus", x - 3, 125, 102, 72, 3);
    });
    const positions = treePositions();
    // Draw prerequisite paths first so cards and text stay unobstructed.
    for (const item of positions) for (const id of treeRequirements(item.definition)) {
      const parent = positions.find(candidate => candidate.definition.id === id);
      if (!parent) continue;
      const ready = parent.definition.capture ? hasRecruit(parent.definition.capture) : rank(id) >= (item.definition.requiredRanks?.[id] || 1);
      ctx.strokeStyle = ready ? "#ffd873" : "#483326"; ctx.lineWidth = 3;
      ctx.beginPath();
      if (parent.x === item.x) {
        ctx.moveTo(parent.x + 116, parent.y + parent.height);
        ctx.lineTo(item.x + 116, item.y);
      } else {
        const fromX = parent.x < item.x ? parent.x + 232 : parent.x;
        const toX = parent.x < item.x ? item.x : item.x + 232;
        ctx.moveTo(fromX, parent.y + 54); ctx.lineTo(270, parent.y + 54);
        ctx.lineTo(270, item.y + 54); ctx.lineTo(toX, item.y + 54);
      }
      ctx.stroke();
    }
    for (const item of positions) {
      const def = item.definition, current = rank(def.id);
      const captured = def.capture && hasRecruit(def.capture);
      const available = def.capture ? (captured || (!!def.currency && captureStageUnlocked(def))) : upgradeUnlocked(def);
      const maxed = !def.capture && current >= def.max;
      const cost = maxed || def.capture ? 0 : def.costs[current];
      drawPanel(item.x, item.y, 232, item.height, available ? "#253753f5" : "#303541f5");
      const price = def.capture ? (captured ? 0 : def.cost || 0) : maxed ? 0 : cost;
      const rankLabel = `${def.capture ? Number(captured) : current}/${def.capture ? 1 : def.max}`;
      const costLabel = `${def.currency ? "E" : "G"}${price}`;
      ctx.font = '14px "NinjaPixel", monospace';
      const costWidth = ctx.measureText(costLabel).width;
      const rankWidth = ctx.measureText(rankLabel).width;
      const rankRight = item.x + 222 - costWidth - 8;
      const nameWidth = rankRight - rankWidth - 8 - (item.x + 10);
      ctx.font = '18px "NinjaPixel", monospace';
      const nameSize = Math.min(18, 18 * nameWidth / Math.max(1, ctx.measureText(def.name).width));
      drawText(def.name, item.x + 10, item.y + 23, nameSize, available ? "#fff" : "#eee0ca");
      drawText(rankLabel, rankRight, item.y + 23, 14, "#fff", "right");
      drawText(costLabel, item.x + 222, item.y + 23, 14, "#fff", "right");
      const effect = def.capture
        ? captured ? "Unlock monster talents" : `Clear stage ${def.requiresStageClear || def.stage} to capture${def.currency ? ` / ${currencyName(def.currency)}` : ""}`
        : def.id === "power" ? `${playerDamage() + (maxed ? 0 : 1)} damage` : def.id === "health" ? `${maxPartyHealth() + (maxed ? 0 : 5)} HP` : !available && def.id === "partyBond" ? "Capture Buttermant first" : !available && def.requiredRanks ? rankRequirementText(def) : def.effect(Math.min(current, def.max - 1));
      const description = effect + (!def.capture && def.currency ? ` / ${currencyName(def.currency)}` : "");
      ctx.font = '17px "NinjaPixel", monospace';
      const lines = [""];
      for (const word of description.split(" ")) {
        const last = lines.length - 1;
        const next = lines[last] ? `${lines[last]} ${word}` : word;
        if (ctx.measureText(next).width > 208 && lines[last]) lines.push(word);
        else lines[last] = next;
      }
      lines.slice(0, 3).forEach((line, index) => drawText(line, item.x + 12, item.y + 49 + index * 21, 17, "#fff"));
      uiTargets.push({ x: item.x, y: item.y, width: 232, height: item.height, action: () => attemptUpgrade(def) });
    }
    if (state.toastTimer > 0) drawText(state.toast, WIDTH / 2, 742, 17, "#ffde83", "center");
    drawButton("BACK TO MAP", 100, 804, 340, 68, true, () => setMode("map"));
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
      drawSheetFrame("coinDrop", x, groundY - 4 * coin.popHeight * progress * (1 - progress), Math.floor(coin.age * 10) % 4, 4, 20);
    }
    drawPlayer(state.party.x, state.party.y, 54);
    for (const companion of state.companions) drawPet(companion.type, companion.x, companion.y, companion.type === "aoe" ? 48 : 43);
    if (state.party.shield) {
      ctx.strokeStyle = "#8ce9ff"; ctx.lineWidth = 3;
      for (const body of partyBodies()) {
        ctx.beginPath(); ctx.arc(body.x, body.y, body.r + 9, 0, Math.PI * 2); ctx.stroke();
      }
    }
    for (const enemy of state.enemies) {
      if (enemy.species === "fanglet") drawPet("striker", enemy.x, enemy.y, 16, 1, captureFacing(enemy.edge));
      else if (enemy.species === "mossbud") drawPet("healer", enemy.x, enemy.y, 16, 1, captureFacing(enemy.edge));
      else drawMonster(enemy);
      ctx.fillStyle = "#371c27"; ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 13, enemy.r * 2, 5);
      ctx.fillStyle = enemy.type === "boss" ? "#ffb347" : "#ff6b5c"; ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 13, enemy.r * 2 * clamp(enemy.hp / enemy.maxHp, 0, 1), 5);
    }
    if (state.bossSpawned && !state.bossDefeated) {
      drawText(state.stage.majorBoss ? "DEFEAT THE BOSS" : "DEFEAT THE MINIBOSS", WIDTH / 2, HEIGHT - 114, 18, "#ffe17d", "center");
    }
    for (const projectile of state.projectiles) {
      if (projectile.source === "player") {
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
    drawSheetFrame("coinDrop", goldIconX, 36, Math.floor(state.animationTime * 10) % 4, 4, 24);
    drawText(goldText, 446, 36, 20, "#ffe17d", "right");
    const essenceIcons = assets.petRoster;
    if (essenceIcons?.naturalWidth) {
      // Static south-facing frames keep the resource counters easy to scan.
      ctx.drawImage(essenceIcons, 0, 0, 16, 16, 76, 58, 32, 32);
      ctx.drawImage(essenceIcons, 0, 32, 16, 16, 252, 58, 32, 32);
    }
    drawText(formatAmount(state.save.fangEssence + state.runEssence), 118, 74, 20, "#fff");
    drawText(formatAmount(state.save.mossEssence + state.runMossEssence), 294, 74, 20, "#fff");
    const autoOn = autoTargetUnlocked() && state.save.autoTargetEnabled;
    drawSprite(autoOn ? "autoAttackBook" : "autoAttackBookDisabled", 484, 60, 48);
    if (autoTargetUnlocked()) uiTargets.push({ x: 460, y: 36, width: 48, height: 48, action: toggleAutoTarget });

  }

  function drawResult() {
    drawBackground(); drawRoad(); drawPanel(24, 130, 492, 650);
    drawText(state.result.won ? `STAGE ${state.result.stage} CLEAR` : "PARTY DEFEATED", WIDTH / 2, 195, 31, state.result.won ? "#8ce99a" : "#ff7b7b", "center");
    drawText(`Fangle essence: +${state.result.essence} (${state.save.fangEssence} total)`, WIDTH / 2, 330, 20, "#a9e9eb", "center");
    drawText(`Total gold: ${formatAmount(state.save.gold)}`, WIDTH / 2, 270, 24, "#ffe17d", "center");
    drawText(`Buttermant essence: ${state.save.mossEssence}`, WIDTH / 2, 365, 20, "#a9e9eb", "center");
    if (state.result.newRecruit) {
      drawPet(state.result.newRecruit, WIDTH / 2, 402, 90);
      drawText(`${petDisplayNames[state.result.newRecruit].toUpperCase()} CAPTURED!`, WIDTH / 2, 482, 25, "#a8d9ff", "center");
      drawText("A new upgrade branch is open.", WIDTH / 2, 522, 20, "#fff", "center");
    } else {
      drawText(state.result.won ? (state.result.stage < 10 ? `Stage ${state.result.stage + 1} is now available.` : "All ten stages cleared!") : "Buy +1 damage / +5 HP, then retry.", WIDTH / 2, 425, 22, "#fff", "center");
    }
    drawButton("RETURN TO MAP", 80, 590, 380, 70, true, () => setMode("map"));
    drawButton("RETRY STAGE", 80, 685, 380, 64, true, () => startStage(state.result.stage));
  }

  function render() {
    uiTargets = [];
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    if (state.mode === "title") drawTitle(); else if (state.mode === "map") drawMap(); else if (state.mode === "upgrades") drawUpgrades(); else if (state.mode === "combat") drawCombat(); else if (state.mode === "result") drawResult();
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * WIDTH / rect.width, y: (event.clientY - rect.top) * HEIGHT / rect.height };
  }

  const captureStageUnlocked = definition => !definition.requiresStageClear || state.save.completed.includes(definition.requiresStageClear);

  function attemptUpgrade(definition) {
    const current = rank(definition.id);
    if (definition.capture) {
      if (!hasRecruit(definition.capture) && !captureStageUnlocked(definition)) {
        state.toast = `Clear stage ${definition.requiresStageClear} to unlock capture`;
        state.toastTimer = 1.8; return;
      }
      if (definition.currency && !hasRecruit(definition.capture)) {
        if (state.save[definition.currency] < definition.cost) {
          state.toast = `Need ${definition.cost - state.save[definition.currency]} more ${currencyName(definition.currency)}`;
        } else {
          state.save[definition.currency] -= definition.cost;
          state.save.recruits.push(definition.capture);
          playSound("success");
          writeSave();
          state.toast = `${definition.name} captured! Talents unlocked`;
        }
        state.toastTimer = 1.8; return;
      }
      state.toast = hasRecruit(definition.capture) ? `${definition.name} captured — branch unlocked` : `Clear stage ${definition.stage} to capture ${definition.name}`;
      state.toastTimer = 1.8; return;
    }
    if (!upgradeUnlocked(definition)) {
      state.toast = definition.id === "partyBond" ? "Capture Buttermant first" : definition.requiredRanks ? rankRequirementText(definition) : definition.recruit ? `Recruit the ${definition.branch.toLowerCase()} first` : "Purchase the prerequisite first";
      state.toastTimer = 1.8; return;
    }
    if (current >= definition.max) return;
    const cost = definition.costs[current];
    const currency = definition.currency || "gold";
    if (state.save[currency] < cost) { state.toast = `Need ${formatAmount(cost - state.save[currency])} more ${currencyName(currency)}`; state.toastTimer = 1.8; return; }
    state.save[currency] = precise(state.save[currency] - cost);
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

  let aimPointer = null;
  let aimGesture = false;
  canvas.addEventListener("pointerdown", event => {
    if (!event.isPrimary) return;
    unlockAudio();
    const point = canvasPoint(event);
    aimGesture = state.mode === "combat" && !targetAt(point);
    if (aimGesture) {
      state.mouse = point;
      aimPointer = event.pointerId;
      canvas.setPointerCapture?.(event.pointerId);
    }
  });
  canvas.addEventListener("pointermove", event => {
    if (!event.isPrimary || state.mode !== "combat") return;
    if (event.pointerType === "mouse" || event.pointerId === aimPointer) {
      const point = canvasPoint(event);
      if (!targetAt(point)) state.mouse = point;
    }
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    canvas.addEventListener(type, event => { if (aimPointer === event.pointerId) aimPointer = null; });
  }
  canvas.addEventListener("click", event => {
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
    audio: { track: currentTrack, unlocked: audioUnlocked, playing: !!music && !music.paused },
    coordinateSystem: "origin top-left; x east; y south; canvas 540x900", mode: state.mode, selectedStage: state.selectedStage,
    unlockedStage: state.save.unlockedStage, completedStages: state.save.completed,
    party: { x: state.party.x, y: state.party.y, hp: precise(state.party.hp), maxHp: state.party.maxHp, shield: !!state.party.shield, shieldCooldown: precise(Math.max(0, (state.party.shieldReadyAt || 0) - state.stageTime)), damage: playerDamage(), members: ["player", ...state.save.recruits], bodies: partyBodies().map(({type,x,y,r}) => ({type,x,y,r})), memberNames: ["Player", ...state.save.recruits.map(type => petDisplayNames[type])], animation: playerAnimation().animation, animationFrame: playerAnimation().frame },
    combat: state.mode === "combat" ? {
      direction: "north-to-south", scenery: sceneryKey(), movementMode: "centered-scrolling", cameraScroll: Math.round(state.scroll), travelSpeed: 24 * travelMultiplier(), spawnFrequencyMultiplier: travelMultiplier(), stage: state.stage.number, phase: state.bossSpawned ? "boss" : "journey", bossDefeated: state.bossDefeated,
      aim: { x: Math.round(state.mouse.x), y: Math.round(state.mouse.y), mode: state.save.autoTargetEnabled && autoTargetUnlocked() ? "auto-nearest" : "cursor" },
      enemies: state.enemies.map(enemy => ({ type: enemy.type, species: enemy.species, sprite: enemy.demonCyclop ? "DemonCyclop" : enemy.species || enemy.type, ...(enemy.demonCyclop ? demonAnimation(enemy) : {}), edge: enemy.edge, x: Math.round(enemy.x), y: Math.round(enemy.y), hp: Math.ceil(enemy.hp), maxHp: enemy.maxHp, damage: enemy.damage, gold: enemy.gold, speed: enemy.speed })),
      projectiles: state.projectiles.map(projectile => ({ x: Math.round(projectile.x), y: Math.round(projectile.y), friendly: projectile.friendly, critical: !!projectile.critical, source: projectile.source, damage: projectile.damage, animationFrame: projectile.source === "player" ? Math.floor(projectile.age * 12) % 4 : null })),
      weather: weatherType(),
      particles: { total: state.particles.length, counts: state.particles.reduce((counts, p) => { counts[p.kind] = (counts[p.kind] || 0) + 1; return counts; }, {}) },
      destructiblesSpawned: state.propsSpawned,
      vases: state.vases.map(vase => ({ x: Math.round(vase.x), y: Math.round(vase.y), hp: vase.hp, radius: vase.r, variant: destructibleVariants[vase.variant ?? 0].id, coinDropChance: 0.25 })),
      effects: state.effects.map(effect => ({ type: effect.type, x: Math.round(effect.x), y: Math.round(effect.y) })),
      companions: state.companions.map(companion => ({ role: companion.type, name: petDisplayNames[companion.type], x: Math.round(companion.x), y: Math.round(companion.y), animationFrame: Math.floor(state.animationTime * 8) % 4 })),
      coins: state.drops.map(coin => ({ x: coin.x, y: coin.y, phase: coin.age < 0.5 ? "pop" : coin.age < 0.65 ? "rest" : "travel", animationFrame: Math.floor(coin.age * 10) % 4 })),
      treasure: state.treasure, treasureSpawnAt: state.treasureSpawnAt, treasureGold: state.treasureGold,
      obstacles: state.obstacles.map(rock => ({x: Math.round(rock.x), y: Math.round(rock.y), radius: Math.round(rock.r), size: rock.size, spriteSize: rock.size === "small" ? 32 : 64, hp: rock.hp, maxHp: rock.maxHp, destructible: !!rank("rockBreaker"), blocks: "player shots"})), totalGold: precise(state.save.gold + state.runGold), totalEssence: state.save.fangEssence + state.runEssence, totalMossEssence: state.save.mossEssence + state.runMossEssence, goldPickup: "automatic-on-kill", runGold: state.runGold, runEssence: state.runEssence
    } : null,
    upgradeBranch: ["Player", "Shared", "Fangle", "Buttermant", "Tinmin"][upgradeBranch],
    captureNodes: captureDefs.map(definition => ({ monster: definition.name, stage: definition.currency ? null : definition.stage, essenceCost: definition.cost || 0, captured: hasRecruit(definition.capture) })),
    mossbudEssence: state.save.mossEssence, fangletEssence: state.save.fangEssence, bankedGold: state.save.gold, upgrades: state.save.upgrades, autoTargetUnlocked: autoTargetUnlocked(), autoTargetEnabled: state.save.autoTargetEnabled, result: state.result
  });

  window.advanceTime = ms => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let index = 0; index < steps; index += 1) update(FIXED_STEP);
    render();
  };

  window.__scollTest = {
    getSave: () => JSON.parse(JSON.stringify(state.save)),
    setSave: save => { state.save = { ...defaultSave(), ...save, upgrades: mergeHealthRanks(save.upgrades || {}) }; writeSave(); render(); },
    startStage,
    clearCombat: () => { if (state.mode === "combat") { [...state.enemies].forEach(enemy => { if (state.mode === "combat") damageEnemy(enemy, enemy.hp); }); state.stageTime = state.stage.duration; state.bossSpawned = true; state.bossDefeated = true; update(FIXED_STEP); render(); } },
    resetSave: () => { state.save = defaultSave(); localStorage.removeItem(SAVE_KEY); state.selectedStage = 1; setMode("title"); },
    balanceProjection, stageDpsEstimate
  };

  document.fonts?.load('16px "NinjaPixel"').then(() => render());
  render();
  if (!window.__vt_pending) {
    let previous = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - previous) / 1000);
      previous = now; update(dt); render(); requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
})();
