const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = new Proxy({}, { get: (o, k) => o[k] ?? (() => {}), set: (o, k, v) => (o[k] = v, true) });
const canvas = { width: 540, height: 900, getContext: () => context, addEventListener() {} };
const sandbox = { document: { getElementById: () => canvas, addEventListener() {} }, Image: class {}, location: { search: '?test=1' }, localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, window: { __vt_pending: true }, console };
const source = fs.readFileSync(require('node:path').join(__dirname, '../game.js'), 'utf8').replace('  render();\n  if (!window.__vt_pending)', '  window.review = { state, updateCombat, spawnEnemy, damageEnemy, finishStage, stageConfigs, attemptUpgrade, upgradeDefs, captureDefs, expectedStageGold, expectedCampaignGold, balanceProjection, enemyVisible, firePlayerVolley, expectedProjectiles, updateCompanions, criticalAmount, shoot, playerDpsFor, awardGold };\n  render();\n  if (!window.__vt_pending)');
vm.runInNewContext(source, sandbox);
const { state, updateCombat, spawnEnemy, damageEnemy, finishStage, stageConfigs, attemptUpgrade, upgradeDefs, captureDefs, expectedStageGold, expectedCampaignGold, balanceProjection, enemyVisible, firePlayerVolley, expectedProjectiles, updateCompanions, criticalAmount, shoot, playerDpsFor, awardGold } = sandbox.window.review;
const api = sandbox.window.__scollTest;



const node=upgradeDefs.find(d=>d.id==='partyBond');assert.equal(node.max,1);assert.equal(node.costs[0],50);
api.setSave({gold:50});attemptUpgrade(node);assert.equal(state.save.gold,50);assert.equal(state.save.upgrades.partyBond,undefined);
api.setSave({gold:49,recruits:['healer','striker','aoe']});attemptUpgrade(node);assert.equal(state.save.upgrades.partyBond,undefined);
state.save.gold=100;attemptUpgrade(node);assert.equal(state.save.gold,50);assert.equal(state.save.upgrades.partyBond,1);attemptUpgrade(node);assert.equal(state.save.gold,50);
api.startStage(1);firePlayerVolley();assert.equal(state.projectiles[0].damage,6);
spawnEnemy('armored');state.enemies[0].hp=state.enemies[0].maxHp=100;state.enemies[0].x=270;state.enemies[0].y=650;
state.party.hp=1;state.companions.forEach(c=>c.timer=0);updateCompanions(1/60);assert(state.projectiles.some(p=>p.source==='striker'&&p.damage===7));assert.equal(state.party.hp,3);assert.equal(state.enemies[0].hp,97);
api.setSave({recruits:['healer','striker'],upgrades:{partyBond:1,power:4,strikerPower:1,multishot:10,tripleSpark:10,strikerDouble:10,strikerTriple:10,playerCritChance:10,playerCritDamage:1,strikerCritChance:10,strikerCritDamage:1,strikerFollowup:1}});api.startStage(1);sandbox.Math=Object.create(Math);sandbox.Math.random=()=>0;
firePlayerVolley();assert.equal(state.projectiles.length,3);assert(state.projectiles.every(p=>p.damage===11));
spawnEnemy('basic');spawnEnemy('basic');state.enemies.forEach(e=>{e.x=270;e.y=650;e.hp=100;});state.companions.forEach(c=>c.timer=0);updateCompanions(1/60);
assert.equal(state.projectiles.filter(p=>p.source==='striker'&&p.damage===8.8).length,3);
damageEnemy(state.enemies[0],100,'striker');assert.equal(state.projectiles.at(-1).source,'strikerFollowup');assert.equal(state.projectiles.at(-1).damage,8.8);
console.log('PASS: capture gate, 50G cost, single purchase, player/Fangle +5, extra shots and crits, follow-up bonus, healing/Tinmin unchanged');
