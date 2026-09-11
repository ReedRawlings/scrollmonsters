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


sandbox.Math=Object.create(Math);sandbox.Math.random=()=>0;
for(const owner of ['player','striker','healer','aoe']) {
 const chance=upgradeDefs.find(d=>d.id===owner+'CritChance'),power=upgradeDefs.find(d=>d.id===owner+'CritDamage');
 assert.equal(chance.max,10);assert.equal(power.max,5);
 api.setSave({gold:100000});attemptUpgrade(power);assert.equal(state.save.upgrades[power.id],undefined);
 if(owner!=='player'){attemptUpgrade(chance);assert.equal(state.save.upgrades[chance.id],undefined);state.save.recruits.push(owner);}
 attemptUpgrade(chance);assert.equal(criticalAmount(owner,10).amount,10);
 sandbox.Math.random=()=>0.01;assert.equal(criticalAmount(owner,10).amount,10);sandbox.Math.random=()=>0;
 for(let i=0;i<12;i++)attemptUpgrade(chance);for(let i=0;i<8;i++)attemptUpgrade(power);
 assert.equal(state.save.upgrades[chance.id],10);assert.equal(state.save.upgrades[power.id],5);assert.equal(criticalAmount(owner,10).amount,15);
 sandbox.Math.random=()=>0.1;assert.equal(criticalAmount(owner,10).amount,10);sandbox.Math.random=()=>0;
}
api.setSave({recruits:['striker','healer','aoe'],upgrades:{playerCritChance:10,playerCritDamage:5,strikerCritChance:10,strikerCritDamage:5,healerCritChance:10,healerCritDamage:5,aoeCritChance:10,aoeCritDamage:5}});api.startStage(1);
firePlayerVolley();assert.equal(state.projectiles[0].damage,1.5);assert(state.projectiles[0].critical);
shoot(0,0,1,1,true,2,510,'strikerFollowup');assert.equal(state.projectiles.at(-1).damage,3);
shoot(0,0,1,1,false,2,510,'boss');assert.equal(state.projectiles.at(-1).damage,2);
spawnEnemy('armored');spawnEnemy('armored');state.enemies.forEach(e=>{e.x=270;e.y=600;e.hp=e.maxHp=100});
state.party.hp=1;state.companions.forEach(c=>c.timer=0);updateCompanions(1/60);
assert.equal(state.party.hp,4);assert(state.enemies.every(e=>e.hp===95.5));assert(state.projectiles.some(p=>p.source==='striker'&&p.damage===3));
state.party.hp=9;state.companions.find(c=>c.type==='healer').timer=0;updateCompanions(1/60);assert.equal(state.party.hp,10);
assert(Math.abs(playerDpsFor({playerCritChance:10,playerCritDamage:5})/playerDpsFor({})-1.05)<1e-9);
console.log('PASS: all four crit trees, capture/prerequisite gates, caps, boundaries, player/Fangle/follow-up damage, shared AOE crit, healing and health cap, enemy exclusion, expected DPS');

api.setSave({upgrades:{playerCritChance:10,playerCritDamage:1,magnet:1}});api.startStage(1);sandbox.Math.random=()=>0;
firePlayerVolley();assert.equal(state.projectiles[0].damage,1.1);
spawnEnemy('armored');const decimalEnemy=state.enemies.at(-1);decimalEnemy.hp=decimalEnemy.maxHp=2.2;
damageEnemy(decimalEnemy,1.1);assert.equal(decimalEnemy.hp,1.1);damageEnemy(decimalEnemy,1.1);assert(!state.enemies.includes(decimalEnemy));assert.equal(state.runGold,1.1);
finishStage(false);assert.equal(state.save.gold,1.1);
api.startStage(1);awardGold(1);finishStage(false);assert.equal(state.save.gold,2.2);
api.setSave({...api.getSave(),gold:20.2});attemptUpgrade(upgradeDefs.find(d=>d.id==='playerCritChance'));assert.equal(state.save.gold,20.2,'Cannot buy 27G upgrade with 20.2G');
api.setSave({gold:20.2});attemptUpgrade(upgradeDefs.find(d=>d.id==='playerCritChance'));assert.equal(state.save.gold,0.2);
api.startStage(1);for(let i=0;i<100;i++)awardGold(0.1);assert.equal(state.runGold,10);
console.log('PASS: 110% first-rank crit, fractional health/death, 1.1G reward banking across runs, fractional wallet purchases, no decimal drift');
