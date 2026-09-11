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
    earthProjectile: "assets/SoggySocks Earth FX/PNG/proj_earth_1_sheet.png",
    earthImpact: "assets/SoggySocks Earth FX/PNG/impact_earth_3_sheet.png",
    playerWalk: "assets/Sprites/MainCharacter/16x16 Walk-Sheet.png",
    petFangle: "assets/Sprites/Pets/Fangle.png",
    petButtermant: "assets/Sprites/Pets/buttermant.png",
    petTinmin: "assets/Sprites/Pets/tinmin.png"
  };
  const assets = {};
  Object.entries(assetPaths).forEach(([key, file]) => {
    const image = new Image();
    image.onload = () => render();
    image.src = file.includes("/") ? file : `assets/placeholder/${file}`;
    assets[key] = image;
  });

  const stageNames = ["Mossy Mile", "Pebble Pass", "Bramble Bend", "Amber Road", "Old Mill", "Fern Crossing", "Dusty Rise", "Rune Trail", "Moonlit Gate", "Crownroot Keep"];
  const stageConfigs = Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;
    return {
      number,
      name: stageNames[index],
      duration: 30,
      hpMultiplier: number === 1 ? 1 : 2,
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
    { id: "power", name: "Damage +1", branch: "PLAYER", max: 10, costs: abilityRankCosts(15, 10), effect: rank => `+1 damage (${2 + rank} total)`, requires: [] },
    { id: "speed", name: "Quick Hands", branch: "PLAYER", max: 3, costs: abilityRankCosts(20, 3), effect: rank => `Fire interval -${10 * (rank + 1)}%`, requires: ["power"] },
    { id: "multishot", name: "Split Spark", branch: "PLAYER", max: 2, costs: abilityRankCosts(30, 2), effect: rank => `${rank + 2} projectiles per volley`, requires: ["speed"] },
    { id: "health", name: "Health +5", branch: "PLAYER", max: 10, costs: abilityRankCosts(15, 10), effect: rank => `+5 health → ${15 + rank * 5} HP`, requires: [] },
    { id: "magnet", name: "Golden Echo", branch: "SHARED", max: 3, costs: abilityRankCosts(15, 3), effect: rank => `Battle gold +${10 * (rank + 1)}%`, requires: [] },
    { id: "autoTarget", name: "Hunter's Eye", branch: "SHARED", max: 1, costs: abilityRankCosts(25, 1), effect: () => "Unlock Space auto-target toggle", requires: ["magnet"] },
    { id: "strikerPower", name: "Fangle Focus", branch: "STRIKER", max: 10, costs: abilityRankCosts(20, 10), effect: rank => `+1 damage (${3 + rank} total)`, requires: [], recruit: "striker" },
    { id: "strikerSpeed", name: "Fangle Rhythm", branch: "STRIKER", max: 2, costs: abilityRankCosts(25, 2), effect: rank => `Attack cooldown -${15 * (rank + 1)}%`, requires: ["strikerPower"], recruit: "striker" },
    { id: "healPower", name: "Kind Bloom", branch: "HEALER", max: 3, costs: abilityRankCosts(20, 3), effect: rank => `+1 healing → ${3 + rank} HP`, requires: [], recruit: "healer" },
    { id: "healSpeed", name: "Bloom Rhythm", branch: "HEALER", max: 2, costs: abilityRankCosts(25, 2), effect: rank => `Heal cooldown -${15 * (rank + 1)}%`, requires: ["healPower"], recruit: "healer" },
    { id: "aoePower", name: "Nova Heart", branch: "AOE", max: 10, costs: abilityRankCosts(25, 10), effect: rank => `+1 damage (${4 + rank} total)`, requires: [], recruit: "aoe" },
    { id: "aoeRadius", name: "Wide Nova", branch: "AOE", max: 2, costs: abilityRankCosts(30, 2), effect: rank => `AOE radius +${22 * (rank + 1)}px`, requires: ["aoePower"], recruit: "aoe" }
  ];

  upgradeDefs.push(
    { id: "rockBreaker", name: "Rock Breaker", branch: "PLAYER", max: 1, costs: abilityRankCosts(30, 1), effect: () => "Player shots damage rocks", requires: ["power"] },
    { id: "deepBloom", name: "Deep Bloom", branch: "HEALER", max: 1, costs: abilityRankCosts(30, 1), currency: "mossEssence", effect: () => "Double healing below half HP", requires: [], recruit: "healer" },
    { id: "travelSpeed", name: "Trail Pace", branch: "SHARED", max: 10, costs: abilityRankCosts(20, 10), effect: rank => `Travel & spawns +${5 * (rank + 1)}%`, requires: [] },
    { id: "strikerFollowup", name: "Follow-Up Bite", branch: "STRIKER", max: 1, costs: abilityRankCosts(30, 1), currency: "fangEssence", effect: () => "Fangle kill: one extra bite", requires: [], recruit: "striker" },
  );

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

  function playerDpsFor(upgrades) {
    const damage = 1 + (upgrades.power || 0);
    const projectiles = 1 + (upgrades.multishot || 0);
    const interval = 0.425 * (1 - (upgrades.speed || 0) * 0.1);
    return damage * projectiles / interval;
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
      projectiles: 1 + (upgrades.multishot || 0),
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
    const bossHealth = Math.round(28 * stage.bossHpScale * bossMultiplier);
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
      bossHp: Math.round(28 * stageConfigs[stageNumber - 1].bossHpScale * (stageNumber === 5 || stageNumber === 10 ? 1.5 : 1)) };
  }
  const captureDefs = [
    { id: "captureStriker", name: "Fangle", branch: "STRIKER", capture: "striker", stage: 3, currency: "fangEssence", cost: 8, requires: [] },
    { id: "captureHealer", name: "Buttermant", branch: "HEALER", capture: "healer", stage: 5, currency: "mossEssence", cost: 12, requires: [] },
    { id: "captureAoe", name: "Tinmin", branch: "AOE", capture: "aoe", stage: 10, requires: [] }
  ];
  const petDisplayNames = { striker: "Fangle", healer: "Buttermant", aoe: "Tinmin" };
  const playerWalkFrames = [0, 2, 3, 5];
  const treeDefs = [...upgradeDefs, ...captureDefs];
  const treePositions = () => {
    const branch = ["PLAYER", "SHARED", "STRIKER", "HEALER", "AOE"][upgradeBranch];
    let definitions = treeDefs.filter(definition => definition.branch === branch);
    if (branch === "PLAYER") definitions = ["power", "speed", "multishot", "health", "rockBreaker"].map(id => upgradeDefs.find(definition => definition.id === id));
    else definitions.sort((a, b) => Number(!!b.capture) - Number(!!a.capture));
    return definitions.map((definition, index) => ({ definition, x: 24 + Math.floor(index / 3) * 256, y: 230 + index % 3 * 136 }));
  };
  const treeRequirements = definition => definition.recruit && definition.requires.length === 0
    ? [captureDefs.find(capture => capture.capture === definition.recruit).id] : definition.requires;

  const defaultSave = () => ({ gold: 0, mossEssence: 0, mossDryKills: 0, fangEssence: 0, fangDryKills: 0, completed: [], unlockedStage: 1, recruits: [], upgrades: {}, autoTargetEnabled: false });
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
    companions: [], result: null, toast: "", toastTimer: 0, goldFraction: 0, animationTime: 0
  };

  const rank = id => state.save.upgrades[id] || 0;
  const hasRecruit = id => state.save.recruits.includes(id);
  const writeSave = () => localStorage.setItem(SAVE_KEY, JSON.stringify(state.save));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const travelMultiplier = () => 1 + rank("travelSpeed") * 0.05;
  const playerDamage = () => 1 + rank("power");
  const playerFireInterval = () => 0.425 * (1 - rank("speed") * 0.1);
  const playerProjectiles = () => 1 + rank("multishot");
  const maxPartyHealth = () => 10 + rank("health") * 5;
  const autoTargetUnlocked = () => rank("autoTarget") > 0;

  function setMode(mode) {
    state.mode = mode;
    state.toast = "";
    render();
  }

  function setupCompanions() {
    const offsets = { striker: [-64, -48], healer: [64, -48], aoe: [0, -100] };
    state.companions = state.save.recruits.map((type, index) => ({ type, x: state.party.x + offsets[type][0], y: state.party.y + offsets[type][1], timer: 0.4 + index * 0.45, pulse: 0 }));
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
    state.stageTime = 0;
    state.spawnTimer = 0.35 / travelMultiplier();
    state.fireTimer = 0;
    state.scroll = 0;
    state.runGold = 0;
    state.runEssence = 0;
    state.runMossEssence = 0;
    state.goldFraction = 0;
    state.bossSpawned = false;
    state.bossDefeated = false;
    state.enemies = [];
    state.obstacles = [];
    state.rockSpawnTimer = 0;
    state.projectiles = [];
    state.drops = [];
    state.effects = [];
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
    const species = type === "boss" ? null : canFang && speciesRoll < fangDensity(state.stage.number) ? "fanglet" : speciesRoll >= fangDensity(state.stage.number) && speciesRoll < fangDensity(state.stage.number) + mossDensity(state.stage.number) ? "mossbud" : null;
    const openingFanglet = openingStage && species === "fanglet";
    const hp = (openingFanglet ? 2 : Math.round(base.hp * hpScale * bossFactor)) * state.stage.hpMultiplier;
    const spawn = spawnPoint(base.radius, forcedEdge);
    state.enemies.push({
      type, species, edge: spawn.edge, x: spawn.x, y: spawn.y, r: base.radius,
      hp, maxHp: hp, speed: base.speed * 1.4, damage: openingFanglet ? 2 : Math.max(1, Math.round(base.damage * state.stage.damageScale)),
      gold: 1, meleeTimer: 0, meleeCooldown: 1.5, attackTimer: base.cooldown,
      attackCooldown: base.cooldown
    });
  }

  const fangDensity = stage => [0.2, 0.3, 0.7, 0.35, 0.25, 0.65, 0.3, 0.4, 0.75, 0.35][stage - 1];
  const mossDensity = stage => [0, 0, 0.1, 0.35, 0.6, 0.15, 0.5, 0.4, 0.15, 0.5][stage - 1];
  const currencyName = currency => currency === "mossEssence" ? "Buttermant essence" : currency === "fangEssence" ? "Fangle essence" : "gold";
  const fangYield = stage => 1 + Math.floor((stage - 1) / 3);
  const enemyVisible = enemy => enemy.x >= 0 && enemy.x <= WIDTH && enemy.y >= 126 && enemy.y <= HEIGHT - 96;

  function nearestEnemy(fromX = state.party.x, fromY = state.party.y) {
    return state.enemies.filter(enemyVisible).reduce((best, enemy) => {
      const distance = Math.hypot(enemy.x - fromX, enemy.y - fromY);
      return !best || distance < best.distance ? { enemy, distance } : best;
    }, null)?.enemy || null;
  }

  function shoot(x, y, targetX, targetY, friendly, damage, speed = 560, source = "player", angleOffset = 0) {
    const angle = Math.atan2(targetY - y, targetX - x) + angleOffset;
    state.projectiles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: source === "boss" ? 8 : 6, friendly, damage, source, age: 0 });
  }

  function firePlayerVolley() {
    const target = state.save.autoTargetEnabled && autoTargetUnlocked() ? nearestEnemy() : null;
    const targetX = target?.x ?? state.mouse.x;
    const targetY = target?.y ?? state.mouse.y;
    const count = playerProjectiles();
    for (let index = 0; index < count; index += 1) {
      const spread = count === 1 ? 0 : (index - (count - 1) / 2) * 0.105;
      shoot(state.party.x, state.party.y + 20, targetX, targetY, true, playerDamage(), 560, "player", spread);
    }
  }

  function awardGold(value) {
    state.goldFraction += value * (1 + rank("magnet") * 0.1);
    const wholeGold = Math.floor(state.goldFraction + 1e-9);
    if (wholeGold > 0) {
      state.runGold += wholeGold;
      state.goldFraction -= wholeGold;
    }
  }

  function removeEnemy(enemy, reward = false) {
    const index = state.enemies.indexOf(enemy);
    if (index < 0) return;
    state.enemies.splice(index, 1);
    if (reward) {
      awardGold(enemy.gold);
      if (enemy.species === "fanglet") {
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
      if (enemy.type === "boss" && [3, 6, 9].includes(state.stage.number)) state.runEssence += 2 * fangYield(state.stage.number);
    }
  }

  function damageEnemy(enemy, amount, source = "player") {
    if (state.mode !== "combat" || !state.enemies.includes(enemy)) return;
    enemy.hp -= amount;
    const playerImpact = source === "player";
    state.effects.push({ type: playerImpact ? "earthImpact" : "impact", x: enemy.x, y: enemy.y, life: playerImpact ? 0.48 : 0.12, maxLife: playerImpact ? 0.48 : 0.12, radius: playerImpact ? 50 : 22 });
    if (enemy.hp <= 0) {
      if (enemy.type === "boss") state.bossDefeated = true;
      removeEnemy(enemy, true);
      if (enemy.type === "boss") { finishStage(true); return; }
      if (source === "striker" && rank("strikerFollowup")) {
        const companion = state.companions.find(member => member.type === "striker");
        const target = companion && nearestEnemy(companion.x, companion.y);
        if (target) shoot(companion.x, companion.y, target.x, target.y, true, 2 + rank("strikerPower"), 510, "strikerFollowup");
      }
    }
  }

  function updateCompanions(dt) {
    for (const companion of state.companions) {
      if (state.mode !== "combat") return;
      companion.timer -= dt;
      companion.pulse = Math.max(0, companion.pulse - dt);
      if (companion.timer > 0) continue;
      if (companion.type === "striker") {
        const target = nearestEnemy(companion.x, companion.y);
        if (target) shoot(companion.x, companion.y + 15, target.x, target.y, true, 2 + rank("strikerPower"), 510, "striker");
        companion.timer = 1.05 * (1 - rank("strikerSpeed") * 0.15);
      } else if (companion.type === "healer") {
        if (state.party.hp < state.party.maxHp) {
          state.party.hp = Math.min(state.party.maxHp, state.party.hp + (2 + rank("healPower")) * (rank("deepBloom") && state.party.hp < state.party.maxHp / 2 ? 2 : 1));
          companion.pulse = 0.7;
          state.effects.push({ type: "heal", x: state.party.x, y: state.party.y, life: 0.7, maxLife: 0.7, radius: 54 });
        }
        companion.timer = 4.6 * (1 - rank("healSpeed") * 0.15);
      } else if (companion.type === "aoe") {
        const target = nearestEnemy(companion.x, companion.y);
        if (target) {
          const radius = 70 + rank("aoeRadius") * 22;
          state.enemies.filter(enemy => Math.hypot(enemy.x - target.x, enemy.y - target.y) <= radius).forEach(enemy => damageEnemy(enemy, 3 + rank("aoePower")));
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
    state.save.gold += state.runGold;
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

  function updateCombat(dt) {
    if (state.mode !== "combat") return;
    state.stageTime += dt;
    const previousScroll = state.scroll;
    state.scroll += 24 * travelMultiplier() * dt;
    const cameraStep = state.scroll - previousScroll;
    for (const rock of state.obstacles) rock.y -= cameraStep;
    state.obstacles = state.obstacles.filter(rock => rock.y + rock.r >= 126);
    if (state.stage.number >= 4) {
      state.rockSpawnTimer -= dt * travelMultiplier();
      if (state.rockSpawnTimer <= 0) {
        const radius = 24 + Math.random() * 8;
        state.obstacles.push({ x: Math.random() < 0.5 ? 85 + Math.random() * 125 : 330 + Math.random() * 125, y: HEIGHT + radius, r: radius, hp: 15, maxHp: 15 });
        state.rockSpawnTimer = 3.5 + Math.random();
      }
    }
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
      const dx = state.party.x - enemy.x, dy = state.party.y - enemy.y;
      const distance = Math.hypot(dx, dy);
      const meleeBoss = enemy.type === "boss" && state.stage.number <= 5;
      const stopDistance = enemy.type === "boss" ? (meleeBoss ? enemy.r + 20 : 240) : enemy.r + 20;
      const travel = Math.min(enemy.speed * dt, Math.max(0, distance - stopDistance));
      enemy.x += dx / Math.max(1, distance) * travel;
      enemy.y += dy / Math.max(1, distance) * travel;
      const touchingParty = Math.hypot(enemy.x - state.party.x, enemy.y - state.party.y) <= enemy.r + 21;
      if (enemyVisible(enemy)) { enemy.attackTimer -= dt; enemy.meleeTimer -= dt; }
      if (((enemy.type === "ranged" && !touchingParty) || (enemy.type === "boss" && !meleeBoss)) && enemyVisible(enemy) && enemy.attackTimer <= 0) {
        const shots = enemy.type === "boss" && state.stage.number > 1 && enemy.hp < enemy.maxHp * 0.45 ? 3 : 1;
        for (let index = 0; index < shots; index += 1) {
          shoot(enemy.x, enemy.y - enemy.r, state.party.x, state.party.y, false, enemy.damage, enemy.type === "boss" ? 220 : 185, enemy.type, (index - (shots - 1) / 2) * 0.13);
        }
        enemy.attackTimer = enemy.attackCooldown;
      }
      if (meleeBoss && distance <= enemy.r + 21 && enemy.attackTimer <= 0) {
        state.party.hp -= enemy.damage;
        state.effects.push({ type: "impact", x: state.party.x, y: state.party.y, life: 0.25, maxLife: 0.25, radius: 30 });
        enemy.attackTimer = enemy.attackCooldown;
      }
      if (enemy.type !== "boss" && touchingParty && enemy.meleeTimer <= 0) {
        state.party.hp -= enemy.damage;
        state.effects.push({ type: "impact", x: state.party.x, y: state.party.y, life: 0.25, maxLife: 0.25, radius: 30 });
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
        const rock = state.obstacles.find(obstacle => {
          const t = clamp(((obstacle.x - oldX) * dx + (obstacle.y - oldY) * dy) / Math.max(0.001, dx * dx + dy * dy), 0, 1);
          return Math.hypot(oldX + t * dx - obstacle.x, oldY + t * dy - obstacle.y) <= obstacle.r + projectile.r;
        });
        if (rock) {
          if (rank("rockBreaker")) {
            rock.hp -= projectile.damage;
            if (rock.hp <= 0) state.obstacles.splice(state.obstacles.indexOf(rock), 1);
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
      } else if (Math.hypot(projectile.x - state.party.x, projectile.y - state.party.y) < 26) {
        state.party.hp -= projectile.damage;
        state.effects.push({ type: "impact", x: state.party.x, y: state.party.y, life: 0.2, maxLife: 0.2, radius: 30 });
        hit = true;
      }
      if (hit || projectile.x < -40 || projectile.x > WIDTH + 40 || projectile.y < -40 || projectile.y > HEIGHT + 40) state.projectiles.splice(state.projectiles.indexOf(projectile), 1);
    }

    state.effects.forEach(effect => { effect.life -= dt; });
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

  function drawPlayer(x, y, height = 54, alpha = 1) {
    const frame = Math.floor(state.animationTime * 8) % playerWalkFrames.length;
    if (!drawGridFrame("playerWalk", x, y, playerWalkFrames[frame], 6, 2, 5, height * 2 / 3, height, alpha)) drawSprite("player", x, y, height, alpha);
  }

  function drawPet(type, x, y, size = 44, alpha = 1) {
    const sheet = { striker: "petFangle", healer: "petButtermant", aoe: "petTinmin" }[type];
    const frame = Math.floor(state.animationTime * 8) % 4;
    if (!sheet || !drawGridFrame(sheet, x, y, frame, 4, 0, 1, size, size, alpha)) drawSprite(type, x, y, size, alpha);
  }

  function drawText(value, x, y, size = 18, color = "#fff", align = "left") {
    ctx.font = `bold ${size}px ui-monospace, monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#172335";
    if (color !== "#2b2218") ctx.fillText(value, x + 2, y + 2);
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
  }

  function drawPanel(x, y, width, height, color = "#172335e8") {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "#d6b36a";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
  }

  function drawButton(label, x, y, width, height, active = true, action = null) {
    if (active && action) uiTargets.push({ x, y, width, height, action });
    ctx.fillStyle = active ? "#f0c65a" : "#606b79";
    ctx.fillRect(x, y, width, height);
    ctx.strokeStyle = "#392e21";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);
    drawText(label, x + width / 2, y + height / 2, 16, active ? "#2b2218" : "#c4c9d0", "center");
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
    ctx.fillStyle = "#172335ee";
    ctx.fillRect(0, 0, WIDTH, 104);
    drawText(title, 24, 35, 26, "#ffe17d");
    if (subtitle) drawText(subtitle, 24, 77, 17, "#b9cee5");
    drawSprite("gold", 420, 35, 28);
    drawText(String(state.save.gold), 441, 35, 20, "#ffe17d");
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
      if (number === state.selectedStage) { ctx.strokeStyle = "#fff3b0"; ctx.lineWidth = 4; ctx.strokeRect(point.x - 42, point.y - 42, 84, 84); }
      drawSprite(complete ? "nodeComplete" : open ? "nodeOpen" : "lock", point.x, point.y, 72);
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

  function upgradeUnlocked(definition) {
    return (!definition.recruit || hasRecruit(definition.recruit)) && definition.requires.every(id => rank(id) > 0);
  }

  function drawUpgrades() {
    drawBackground(); drawHeader("UPGRADES", `Fangle: ${state.save.fangEssence} • Buttermant: ${state.save.mossEssence} essence`);
    const branches = ["Player", "Shared", "Fangle", "Buttermant", "Tinmin"];
    branches.forEach((name, index) => {
      const x = 14 + index * 104;
      drawButton(name, x, 128, 96, 66, true, () => { upgradeBranch = index; });
      if (index === upgradeBranch) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.strokeRect(x, 128, 96, 66); }
    });
    const positions = treePositions();
    for (const item of positions) {
      for (const requirement of treeRequirements(item.definition)) {
        const parent = positions.find(candidate => candidate.definition.id === requirement);
        if (!parent) continue;
        const ready = parent.definition.capture ? hasRecruit(parent.definition.capture) : rank(requirement) > 0;
        ctx.strokeStyle = ready ? "#ffe17d" : "#58677a"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(parent.x + 116, parent.y + 108); ctx.lineTo(item.x + 116, item.y); ctx.stroke();
      }
      const def = item.definition, current = rank(def.id);
      const captured = def.capture && hasRecruit(def.capture);
      const available = def.capture ? (captured || !!def.currency) : upgradeUnlocked(def);
      const maxed = !def.capture && current >= def.max;
      const cost = maxed || def.capture ? 0 : def.costs[current];
      drawPanel(item.x, item.y, 232, 108, available ? "#253753f5" : "#303541f5");
      drawText(def.name, item.x + 10, item.y + 20, 17, available ? "#fff" : "#bac1cb");
      if (def.capture) {
        drawPet(def.capture, item.x + 205, item.y + 47, 30, captured ? 1 : 0.5);
        drawText(captured ? "CAPTURED" : (def.currency ? `${def.cost} ${currencyName(def.currency)}` : `Clear stage ${def.stage}`), item.x + 10, item.y + 45, 15, captured ? "#8ce99a" : "#ffe17d");
        drawText("Unlock monster talents", item.x + 10, item.y + 81, 14, "#d3dbe5");
      } else {
        drawText(`Rank ${current}/${def.max}`, item.x + 10, item.y + 44, 15, "#d3dbe5");
        drawText(maxed ? "" : `${cost}${def.currency === "mossEssence" ? " ME" : def.currency ? " FE" : "G"}`, item.x + 220, item.y + 44, 15, state.save[def.currency || "gold"] >= cost ? "#ffe17d" : "#ff8d8d", "right");
        const effect = maxed ? "MAXED" : def.id === "autoTarget" ? "Unlock auto-target" : def.id === "health" ? "+5 shared party HP" : def.effect(current);
        const lines = [""];
        for (const word of effect.split(" ")) {
          if ((lines[lines.length - 1] + word).length > 25) lines.push("");
          lines[lines.length - 1] += word + " ";
        }
        lines.slice(0, 2).forEach((line, index) => drawText(line.trim(), item.x + 10, item.y + 72 + index * 18, 14, "#ffe17d"));
      }
      uiTargets.push({ x: item.x, y: item.y, width: 232, height: 108, action: () => attemptUpgrade(def) });
    }
    if (state.toastTimer > 0) drawText(state.toast, WIDTH / 2, 742, 17, "#ffde83", "center");
    drawButton("BACK TO MAP", 100, 804, 340, 68, true, () => setMode("map"));
  }

  function drawCombat() {
    drawBackground(); drawRoad();
    for (const rock of state.obstacles) {
      if (rock.y < 126 - rock.r || rock.y > HEIGHT - 96 + rock.r) continue;
      ctx.fillStyle = "#514c43"; ctx.fillRect(rock.x - rock.r, rock.y - rock.r + 9, rock.r * 2, rock.r * 2 - 4);
      ctx.fillStyle = "#858a8b"; ctx.fillRect(rock.x - rock.r + 4, rock.y - rock.r, rock.r * 2 - 8, rock.r * 2 - 5);
      ctx.fillStyle = "#b9bdb3"; ctx.fillRect(rock.x - rock.r + 8, rock.y - rock.r + 4, rock.r, 6);
      if (rank("rockBreaker")) {
        ctx.fillStyle = "#371c27"; ctx.fillRect(rock.x - rock.r, rock.y - rock.r - 10, rock.r * 2, 5);
        ctx.fillStyle = "#f0c65a"; ctx.fillRect(rock.x - rock.r, rock.y - rock.r - 10, rock.r * 2 * Math.max(0, rock.hp / rock.maxHp), 5);
      }
    }
    drawPlayer(state.party.x, state.party.y, 54);
    for (const companion of state.companions) drawPet(companion.type, companion.x, companion.y, companion.type === "aoe" ? 48 : 43);
    for (const enemy of state.enemies) {
      if (enemy.species === "fanglet") drawPet("striker", enemy.x, enemy.y, enemy.r * 2.5);
      else if (enemy.species === "mossbud") drawPet("healer", enemy.x, enemy.y, enemy.r * 2.5);
      else drawSprite(enemy.type, enemy.x, enemy.y, enemy.type === "boss" ? 92 : enemy.r * 2.5);
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
        if (!drawSheetFrame("earthProjectile", projectile.x, projectile.y, frame, 4, 100, rotation)) drawSprite("playerShot", projectile.x, projectile.y, projectile.r * 3);
      } else drawSprite(projectile.friendly ? "playerShot" : "enemyShot", projectile.x, projectile.y, projectile.r * 3);
    }
    for (const effect of state.effects) {
      const alpha = clamp(effect.life / effect.maxLife, 0, 1);
      if (effect.type === "aoe") {
        ctx.strokeStyle = `rgba(185,124,255,${alpha})`; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * (1.1 - alpha * 0.1), 0, Math.PI * 2); ctx.stroke();
      } else if (effect.type === "earthImpact") {
        const frame = Math.min(7, Math.floor((1 - effect.life / effect.maxLife) * 8));
        if (!drawSheetFrame("earthImpact", effect.x, effect.y, frame, 8, 100, 0, alpha)) drawSprite("impact", effect.x, effect.y, effect.radius * 2, alpha);
      } else drawSprite(effect.type === "heal" ? "heal" : "impact", effect.x, effect.y, effect.radius * 2, alpha);
    }
    if (!state.save.autoTargetEnabled || !autoTargetUnlocked()) drawSprite("crosshair", state.mouse.x, state.mouse.y, 34);
    drawPanel(12, 12, WIDTH - 24, 114);
    drawSprite("heart", 38, 44, 28);
    ctx.fillStyle = "#513040"; ctx.fillRect(60, 30, 230, 29);
    ctx.fillStyle = "#ef476f"; ctx.fillRect(60, 30, 230 * clamp(state.party.hp / state.party.maxHp, 0, 1), 29);
    drawText(`${Math.max(0, Math.ceil(state.party.hp))}/${state.party.maxHp}`, 175, 45, 19, "#fff", "center");
    drawText(`STAGE ${state.stage.number}`, 323, 43, 22, "#fff");
    drawText(state.bossSpawned ? "BOSS BATTLE" : "SOUTHBOUND ↓", 30, 91, 20, "#a8d9ff");
    drawText(`Essence: Fangle ${state.save.fangEssence + state.runEssence} • Buttermant ${state.save.mossEssence + state.runMossEssence}`, 24, 115, 16, "#a9e9eb");
    drawSprite("gold", 330, 91, 28); drawText(String(state.save.gold + state.runGold), 354, 91, 22, "#ffe17d");
    if (autoTargetUnlocked()) {
      drawButton(state.save.autoTargetEnabled ? "AUTO ON • TAP TO AIM" : "AIM • TAP FOR AUTO", 60, HEIGHT - 82, WIDTH - 120, 64, true, toggleAutoTarget);
    } else {
      drawPanel(60, HEIGHT - 78, WIDTH - 120, 60);
      drawText("TOUCH + DRAG TO AIM", WIDTH / 2, HEIGHT - 48, 19, "#fff", "center");
    }
  }

  function drawResult() {
    drawBackground(); drawRoad(); drawPanel(24, 130, 492, 650);
    drawText(state.result.won ? `STAGE ${state.result.stage} CLEAR` : "PARTY DEFEATED", WIDTH / 2, 195, 31, state.result.won ? "#8ce99a" : "#ff7b7b", "center");
    drawText(`Fangle essence: +${state.result.essence} (${state.save.fangEssence} total)`, WIDTH / 2, 330, 20, "#a9e9eb", "center");
    drawText(`Total gold: ${state.save.gold}`, WIDTH / 2, 270, 24, "#ffe17d", "center");
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

  function attemptUpgrade(definition) {
    const current = rank(definition.id);
    if (definition.capture) {
      if (definition.currency && !hasRecruit(definition.capture)) {
        if (state.save[definition.currency] < definition.cost) {
          state.toast = `Need ${definition.cost - state.save[definition.currency]} more ${currencyName(definition.currency)}`;
        } else {
          state.save[definition.currency] -= definition.cost;
          state.save.recruits.push(definition.capture);
          writeSave();
          state.toast = `${definition.name} captured! Talents unlocked`;
        }
        state.toastTimer = 1.8; return;
      }
      state.toast = hasRecruit(definition.capture) ? `${definition.name} captured — branch unlocked` : `Clear stage ${definition.stage} to capture ${definition.name}`;
      state.toastTimer = 1.8; return;
    }
    if (!upgradeUnlocked(definition)) {
      state.toast = definition.recruit ? `Recruit the ${definition.branch.toLowerCase()} first` : "Purchase the prerequisite first";
      state.toastTimer = 1.8; return;
    }
    if (current >= definition.max) return;
    const cost = definition.costs[current];
    const currency = definition.currency || "gold";
    if (state.save[currency] < cost) { state.toast = `Need ${cost - state.save[currency]} more ${currencyName(currency)}`; state.toastTimer = 1.8; return; }
    state.save[currency] -= cost;
    state.save.upgrades[definition.id] = current + 1;
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
    targetAt(canvasPoint(event))?.action();
    render();
  });

  document.addEventListener("keydown", event => {
    if (event.code === "Space" && autoTargetUnlocked()) {
      event.preventDefault(); if (!event.repeat) toggleAutoTarget();
    }
    if (event.key.toLowerCase() === "f") {
      if (!document.fullscreenElement) canvas.requestFullscreen?.(); else document.exitFullscreen?.();
    }
  });

  window.render_game_to_text = () => JSON.stringify({
    coordinateSystem: "origin top-left; x east; y south; canvas 540x900", mode: state.mode, selectedStage: state.selectedStage,
    unlockedStage: state.save.unlockedStage, completedStages: state.save.completed,
    party: { x: state.party.x, y: state.party.y, hp: Math.ceil(state.party.hp), maxHp: state.party.maxHp, damage: playerDamage(), members: ["player", ...state.save.recruits], memberNames: ["Player", ...state.save.recruits.map(type => petDisplayNames[type])], animationFrame: Math.floor(state.animationTime * 8) % playerWalkFrames.length },
    combat: state.mode === "combat" ? {
      direction: "north-to-south", movementMode: "centered-parallax", cameraScroll: Math.round(state.scroll), travelSpeed: 24 * travelMultiplier(), spawnFrequencyMultiplier: travelMultiplier(), stage: state.stage.number, phase: state.bossSpawned ? "boss" : "journey", bossDefeated: state.bossDefeated,
      aim: { x: Math.round(state.mouse.x), y: Math.round(state.mouse.y), mode: state.save.autoTargetEnabled && autoTargetUnlocked() ? "auto-nearest" : "cursor" },
      enemies: state.enemies.map(enemy => ({ type: enemy.type, species: enemy.species, edge: enemy.edge, x: Math.round(enemy.x), y: Math.round(enemy.y), hp: Math.ceil(enemy.hp), maxHp: enemy.maxHp, damage: enemy.damage, gold: enemy.gold, speed: enemy.speed })),
      projectiles: state.projectiles.map(projectile => ({ x: Math.round(projectile.x), y: Math.round(projectile.y), friendly: projectile.friendly, source: projectile.source, damage: projectile.damage, animationFrame: projectile.source === "player" ? Math.floor(projectile.age * 12) % 4 : null })),
      effects: state.effects.map(effect => ({ type: effect.type, x: Math.round(effect.x), y: Math.round(effect.y) })),
      companions: state.companions.map(companion => ({ role: companion.type, name: petDisplayNames[companion.type], x: Math.round(companion.x), y: Math.round(companion.y), animationFrame: Math.floor(state.animationTime * 8) % 4 })),
      obstacles: state.obstacles.map(rock => ({x: Math.round(rock.x), y: Math.round(rock.y), radius: Math.round(rock.r), hp: rock.hp, maxHp: rock.maxHp, destructible: !!rank("rockBreaker"), blocks: "player shots"})), totalGold: state.save.gold + state.runGold, totalEssence: state.save.fangEssence + state.runEssence, totalMossEssence: state.save.mossEssence + state.runMossEssence, goldPickup: "automatic-on-kill", runGold: state.runGold, runEssence: state.runEssence
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
