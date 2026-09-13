const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const context = new Proxy({ measureText: text => ({ width: String(text).length * 8 }) }, { get: (object, key) => object[key] ?? (() => {}), set: (object, key, value) => (object[key] = value, true) });
const canvas = { width: 540, height: 900, getContext: () => context, addEventListener() {} };
const sandbox = { document: { getElementById: () => canvas, addEventListener() {} }, Image: class {}, location: { search: "?test=1" }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, window: { __vt_pending: true }, console };
const source = fs.readFileSync(require("node:path").join(__dirname, "../game.js"), "utf8").replace(
  "  render();\n  if (!window.__vt_pending)",
  "  window.review = { state, damageEnemy, attemptUpgrade, upgradeDefs };\n  render();\n  if (!window.__vt_pending)"
);
vm.runInNewContext(source, sandbox);
const { state, damageEnemy, attemptUpgrade, upgradeDefs } = sandbox.window.review;
const api = sandbox.window.__scollTest;

function guaranteedSpeciesDrop(species, affinityId) {
  api.setSave({ unlockedStage: 10, essencePity: { [affinityId]: 4 } });
  api.startStage(4);
  const enemy = { type: "basic", species, affinityId, hp: 1, maxHp: 1, gold: 1, x: 270, y: 300 };
  state.enemies.push(enemy);
  damageEnemy(enemy, 1);
  assert.equal(state.runEssence[affinityId], 2, `${species} drops stage-4 ${affinityId} essence`);
  assert.equal(state.save.essencePity[affinityId], 0, `${affinityId} pity resets`);
}

guaranteedSpeciesDrop("fanglet", "feral");
guaranteedSpeciesDrop("mossbud", "bloom");
guaranteedSpeciesDrop("tinmin", "arcane");

for (const [stageNumber, affinityId, reward] of [[3, "feral", 15], [5, "bloom", 15], [10, "arcane", 20]]) {
  api.setSave({ unlockedStage: 10 });
  api.startStage(stageNumber);
  const boss = { type: "boss", species: stageNumber === 3 ? "fanglet" : null, affinityId: stageNumber === 3 ? "feral" : null, hp: 1, maxHp: 1, gold: 1, x: 270, y: 300 };
  state.enemies.push(boss);
  damageEnemy(boss, 1);
  assert.equal(state.save.essence[affinityId], reward, `stage ${stageNumber} boss banks ${reward} ${affinityId} essence`);
}

api.setSave({ essence: { bloom: 30, feral: 9 }, ownedCreatures: ["healer"], activeParty: ["healer"] });
attemptUpgrade(upgradeDefs.find(definition => definition.id === "deepBloom"));
assert.equal(state.save.essence.bloom, 0);
assert.equal(state.save.essence.feral, 9);
assert.equal(state.save.upgrades.deepBloom, 1);

console.log("PASS: species-to-affinity drops, pity, milestone boss rewards, and affinity-funded talents");
