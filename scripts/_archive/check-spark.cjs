const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = new Proxy({}, { get: (o, k) => o[k] ?? (() => {}), set: (o, k, v) => (o[k] = v, true) });
const canvas = { width: 540, height: 900, getContext: () => context, addEventListener() {} };
const sandbox = { document: { getElementById: () => canvas, addEventListener() {} }, Image: class {}, location: { search: '?test=1' }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, window: { __vt_pending: true }, console };
const source = fs.readFileSync(require('node:path').join(__dirname, '../game.js'), 'utf8').replace('  render();\n  if (!window.__vt_pending)', '  window.review = { state, updateCombat, spawnEnemy, damageEnemy, finishStage, stageConfigs, attemptUpgrade, upgradeDefs, captureDefs, expectedStageGold, expectedCampaignGold, balanceProjection, enemyVisible, firePlayerVolley, expectedProjectiles, updateCompanions };\n  render();\n  if (!window.__vt_pending)');
vm.runInNewContext(source, sandbox);
const { state, updateCombat, spawnEnemy, damageEnemy, finishStage, stageConfigs, attemptUpgrade, upgradeDefs, captureDefs, expectedStageGold, expectedCampaignGold, balanceProjection, enemyVisible, firePlayerVolley, expectedProjectiles, updateCompanions } = sandbox.window.review;
const api = sandbox.window.__scollTest;

const triple = upgradeDefs.find(d => d.id === 'tripleSpark');
const split = upgradeDefs.find(d => d.id === 'multishot');
assert.equal(split.max,10); assert.equal(triple.max,10);
api.setSave({gold:100000,upgrades:{multishot:4}}); attemptUpgrade(triple);
assert.equal(state.save.upgrades.tripleSpark,undefined);
state.save.upgrades.multishot=5; attemptUpgrade(triple);assert.equal(state.save.upgrades.tripleSpark,1);
for(let i=0;i<15;i++) attemptUpgrade(triple);
assert.equal(state.save.upgrades.tripleSpark,10);
function volley(ranks, rolls) {
  api.setSave({upgrades:ranks});api.startStage(1);
  sandbox.Math = Object.create(Math); sandbox.Math.random = () => rolls.shift() ?? 0.5;
  state.projectiles=[];firePlayerVolley();return state.projectiles.length;
}
assert.equal(volley({},[0]),1);
assert.equal(volley({multishot:1},[0.09]),2);
assert.equal(volley({multishot:1},[0.1]),1);
assert.equal(volley({multishot:5,tripleSpark:1},[0.49,0.09]),3);
assert.equal(volley({multishot:5,tripleSpark:1},[0.49,0.1]),2);
assert.equal(volley({multishot:5,tripleSpark:10},[0.5]),1);
assert.equal(volley({multishot:10,tripleSpark:10},[0.999,0.999]),3);
assert.equal(expectedProjectiles({multishot:5,tripleSpark:1}),1.55);
console.log('PASS: rank-five gate, ten-rank cap, chance boundaries, conditional third shot, guaranteed three shots at max, expected DPS');

const doubleBite = upgradeDefs.find(d => d.id === 'strikerDouble');
const tripleBite = upgradeDefs.find(d => d.id === 'strikerTriple');
assert.equal(doubleBite.max,10);assert.equal(tripleBite.max,10);
api.setSave({gold:100000,upgrades:{strikerSpeed:1,strikerDouble:5}});attemptUpgrade(tripleBite);assert.equal(state.save.upgrades.strikerTriple,undefined,'Capture is required');
api.setSave({gold:100000,recruits:['striker'],upgrades:{strikerSpeed:1,strikerDouble:4}});attemptUpgrade(tripleBite);assert.equal(state.save.upgrades.strikerTriple,undefined);
attemptUpgrade(doubleBite);attemptUpgrade(tripleBite);assert.equal(state.save.upgrades.strikerTriple,1);
for(let i=0;i<15;i++) {attemptUpgrade(doubleBite);attemptUpgrade(tripleBite);}
assert.equal(state.save.upgrades.strikerDouble,10);assert.equal(state.save.upgrades.strikerTriple,10);
function bites(ranks,rolls) {
 api.setSave({recruits:['striker'],upgrades:ranks});api.startStage(1);
 spawnEnemy('basic');state.enemies[0].x=270;state.enemies[0].y=600;
 sandbox.Math.random=()=>rolls.shift()??0.5;state.companions[0].timer=0;updateCompanions(1/60);
 assert(state.projectiles.every(p=>p.source==='striker' && p.damage===2));
 return state.projectiles.length;
}
assert.equal(bites({},[0]),1);
assert.equal(bites({strikerDouble:1},[0.09]),2);
assert.equal(bites({strikerDouble:1},[0.1]),1);
assert.equal(bites({strikerDouble:5,strikerTriple:1},[0.49,0.09]),3);
assert.equal(bites({strikerDouble:5,strikerTriple:1},[0.49,0.1]),2);
assert.equal(bites({strikerDouble:5,strikerTriple:10},[0.5]),1);
assert.equal(bites({strikerDouble:10,strikerTriple:10},[0.999,0.999]),3);
console.log('PASS: Fangle capture and rank gates, caps, actual attack count and damage, chance boundaries');

api.setSave({recruits:['striker'],upgrades:{strikerDouble:10,strikerTriple:10,strikerFollowup:1}});api.startStage(1);
spawnEnemy('basic');spawnEnemy('basic');spawnEnemy('basic');state.enemies.forEach(e=>{e.y=600;e.x=270;});
damageEnemy(state.enemies[0],100,'striker');assert.equal(state.projectiles.length,1,'Kill bonus stays a single shot');
damageEnemy(state.enemies[0],100,'strikerFollowup');assert.equal(state.projectiles.length,1,'Kill bonus cannot chain');
console.log('PASS: Follow-Up Bite stays single and cannot recursively chain');
