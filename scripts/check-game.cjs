const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = new Proxy({}, { get: (o, k) => o[k] ?? (() => {}), set: (o, k, v) => (o[k] = v, true) });
const canvas = { width: 540, height: 900, getContext: () => context, addEventListener() {} };
const sandbox = { document: { getElementById: () => canvas, addEventListener() {} }, Image: class {}, location: { search: '?test=1' }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, window: { __vt_pending: true }, console };
const source = fs.readFileSync(require('node:path').join(__dirname, '../game.js'), 'utf8').replace('  render();\n  if (!window.__vt_pending)', '  window.review = { state, updateCombat, spawnEnemy, damageEnemy, finishStage, stageConfigs, attemptUpgrade, upgradeDefs, captureDefs, expectedStageGold, expectedCampaignGold, balanceProjection, enemyVisible };\n  render();\n  if (!window.__vt_pending)');
vm.runInNewContext(source, sandbox);
const { state, updateCombat, spawnEnemy, damageEnemy, finishStage, stageConfigs, attemptUpgrade, upgradeDefs, captureDefs, expectedStageGold, expectedCampaignGold, balanceProjection, enemyVisible } = sandbox.window.review;
const api = sandbox.window.__scollTest;
for (const definition of upgradeDefs) {
  assert(definition.costs.every((cost, index) => index === 0 || cost > definition.costs[index - 1]), `${definition.id} costs must strictly increase by rank`);
}
for (let index = 1; index < stageConfigs.length; index++) {
  assert(stageConfigs[index].hpScale > stageConfigs[index - 1].hpScale, `Stage ${index + 1} enemies must be tougher than stage ${index}`);
}
assert(stageConfigs[9].hpScale < 3.1, 'Stage 10 regular HP scaling stays gradual');
assert.equal(expectedCampaignGold(0), 0);
assert(expectedStageGold(10) > expectedStageGold(1), 'Denser later stages offer more potential gold');
let previousProjectedDps = 0;
for (let levelsPlayed = 0; levelsPlayed < 10; levelsPlayed += 1) {
  const projection = balanceProjection(levelsPlayed);
  assert(projection.dps >= previousProjectedDps, 'Projected DPS cannot fall as campaign gold increases');
  assert(projection.coverage < 2, 'Expected offense should not trivialize stage demand');
  if (levelsPlayed === 0) assert(projection.coverage < 1, 'Fresh stage 1 remains the intended upgrade tutorial');
  else assert(projection.coverage > 0.8, `Expected earnings should keep stage ${projection.enteringStage} within party-assisted reach`);
  previousProjectedDps = projection.dps;
}
api.startStage(1);
assert.equal(state.party.x, 270); assert.equal(state.party.y, 180);
updateCombat(1 / 60);
assert(state.projectiles[0].vy > 0, 'Default fire points south');
const initialY = state.party.y;
updateCombat(1); assert(state.party.y > initialY); assert.equal(state.scroll, 0);
spawnEnemy('basic'); const movingEnemy = state.enemies.at(-1);
assert.equal(enemyVisible(movingEnemy), false); const spawnDistance = Math.hypot(movingEnemy.x - state.party.x, movingEnemy.y - state.party.y);
updateCombat(1 / 60); assert(Math.hypot(movingEnemy.x - state.party.x, movingEnemy.y - state.party.y) < spawnDistance);
for (const edge of ['north', 'east', 'south', 'west']) {
  state.enemies = []; spawnEnemy('basic', edge); assert.equal(state.enemies[0].edge, edge); assert.equal(enemyVisible(state.enemies[0]), false);
  const edgeDistance = Math.hypot(state.enemies[0].x - state.party.x, state.enemies[0].y - state.party.y);
  updateCombat(1 / 60); assert(Math.hypot(state.enemies[0].x - state.party.x, state.enemies[0].y - state.party.y) < edgeDistance, `${edge} enemy approaches the player`);
}
assert(stageConfigs.every(stage => stage.duration === 30 && stage.boss));
api.setSave({ unlockedStage: 10 }); api.startStage(3); const laterY = state.party.y; updateCombat(1);
assert.equal(state.party.y, laterY); assert(state.scroll > 0, 'Stage 3+ uses camera scrolling');
for (let stage = 1; stage <= 10; stage++) {
  api.setSave({ unlockedStage: 10 }); api.startStage(stage);
  state.stageTime = 29; state.fireTimer = 999; state.spawnTimer = 999;
  updateCombat(1 / 60);
  assert(state.enemies.some(enemy => enemy.type === 'boss'), `Stage ${stage} has boss`);
  const boss = state.enemies.find(enemy => enemy.type === 'boss');
  boss.x = state.party.x;
  boss.y = state.party.y + (stage <= 5 ? boss.r + 20 : 240);
  boss.attackTimer = 0;
  const hpBeforeBossAttack = state.party.hp;
  const shotsBeforeBossAttack = state.projectiles.filter(projectile => !projectile.friendly).length;
  updateCombat(1 / 60);
  if (stage <= 5) {
    assert.equal(state.party.hp, hpBeforeBossAttack - boss.damage, `Stage ${stage} boss attacks in melee`);
    assert.equal(state.projectiles.filter(projectile => !projectile.friendly).length, shotsBeforeBossAttack, `Stage ${stage} boss does not fire`);
  } else {
    assert(state.projectiles.filter(projectile => !projectile.friendly).length > shotsBeforeBossAttack, `Stage ${stage} boss fires from range`);
  }
  state.stageTime = 31;
  updateCombat(1 / 60);
  assert.equal(state.mode, 'combat'); assert.equal(state.bossDefeated, false);
  assert(state.enemies.includes(boss), "A living boss cannot disappear at the party boundary");
  finishStage(true); assert.equal(state.mode, 'combat');
  damageEnemy(boss, boss.hp); updateCombat(1 / 60);
  assert.equal(state.result.won, true); assert(state.save.completed.includes(stage));
}
api.setSave({}); api.startStage(1); state.spawnTimer = 999; state.fireTimer = 999;
spawnEnemy('basic', 'south'); damageEnemy(state.enemies[0], state.enemies[0].hp); assert.equal(state.runGold, 1, 'Kill gold is picked up immediately');
state.party.hp = 0; updateCombat(1 / 60); assert.equal(state.result.won, false); assert.equal(state.save.gold, 1);
api.setSave({ gold: 1000, fangEssence: 100, unlockedStage: 10 });
for (const capture of captureDefs) {
  const upgrade = upgradeDefs.find(def => def.recruit === capture.capture);
  attemptUpgrade(upgrade); assert.equal(state.save.upgrades[upgrade.id], undefined);
  api.startStage(capture.stage); api.clearCombat();
  if (capture.currency) { assert(!state.save.recruits.includes(capture.capture)); attemptUpgrade(capture); }
  assert(state.save.recruits.includes(capture.capture));
  attemptUpgrade(upgrade); assert.equal(state.save.upgrades[upgrade.id], 1);
  api.startStage(capture.stage); api.clearCombat();
  assert.equal(state.save.recruits.filter(type => type === capture.capture).length, 1);
}
assert.equal(state.save.recruits.length, 3);
console.log('PASS: ascending costs, DPS projection, four-edge spawns, automatic gold, boss gates, traversal, defeat banking, captures and replay deduplication');
