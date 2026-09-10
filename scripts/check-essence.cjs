const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = new Proxy({}, { get: (o,k) => o[k] ?? (()=>{}), set: (o,k,v) => (o[k]=v,true) });
let saved;
const math = Object.create(Math); math.random = () => 0.99;
const sandbox = { Math: math, document: {getElementById:()=>({width:540,height:900,getContext:()=>context,addEventListener(){}}),addEventListener(){}},Image:class{},localStorage:{getItem:()=>saved||null,setItem:(k,v)=>saved=v},window:{__vt_pending:true},console};
vm.runInNewContext(fs.readFileSync('game.js','utf8').replace('  render();\n  if (!window.__vt_pending)', '  window.review = {state, updateCombat, spawnEnemy, damageEnemy, removeEnemy, finishStage, attemptUpgrade, captureDefs, upgradeDefs};\n  render();\n  if (!window.__vt_pending)'),sandbox);
const {state,updateCombat,spawnEnemy,damageEnemy,removeEnemy,finishStage,attemptUpgrade,captureDefs,upgradeDefs}=sandbox.window.review;
const api=sandbox.window.__scollTest;
const capture=captureDefs[0], bite=upgradeDefs.find(d=>d.id==='strikerFollowup');
api.setSave({gold:100,unlockedStage:10}); attemptUpgrade(capture); assert.equal(state.save.recruits.length,0);
api.startStage(3);
function fang(){spawnEnemy('basic');const e=state.enemies.at(-1);e.species='fanglet';e.x=270;e.y=400;return e;}
for(let i=0;i<4;i++) damageEnemy(fang(),100);
assert.equal(state.runEssence,0); damageEnemy(fang(),100); assert.equal(state.runEssence,1,'fifth dry kill guarantees essence');
removeEnemy(fang());assert.equal(state.runEssence,1,'contact gives no essence');
finishStage(false); assert.equal(state.save.fangEssence,1); assert.equal(state.save.gold,105);
api.setSave({fangEssence:28,gold:100,unlockedStage:10});attemptUpgrade(bite);assert.equal(state.save.fangEssence,28);
attemptUpgrade(capture);assert.equal(state.save.fangEssence,20);attemptUpgrade(capture);assert.equal(state.save.fangEssence,20);
attemptUpgrade(bite);assert.equal(state.save.fangEssence,0);assert.equal(state.save.gold,100);
attemptUpgrade(upgradeDefs.find(d=>d.id==='strikerPower'));assert.equal(state.save.gold,92);
api.startStage(6);const first=fang(),second=fang();damageEnemy(first,100,'striker');assert.equal(state.projectiles.length,1);assert.equal(state.projectiles[0].source,'strikerFollowup');
fang();damageEnemy(second,100,'strikerFollowup');assert.equal(state.projectiles.length,1,'bonus cannot chain');
math.random=()=>0;damageEnemy(fang(),100);assert.equal(state.runEssence,2,'later kills yield larger bundles');
spawnEnemy('boss');damageEnemy(state.enemies.at(-1),10000);assert.equal(state.runEssence,6,'hunting boss guaranteed reward');finishStage(false);assert.equal(state.save.fangEssence,6);
assert.equal(JSON.parse(saved).fangEssence,6);
for (const stage of [1,2]) {
  api.setSave({unlockedStage:10}); api.startStage(stage);
  state.stageTime=14.99; spawnEnemy('basic'); assert.equal(state.enemies.at(-1).species,null);
  state.stageTime=15; spawnEnemy('basic'); const earlyFang=state.enemies.at(-1);
  assert.equal(earlyFang.species,'fanglet'); assert.equal(earlyFang.hp,2); assert.equal(earlyFang.damage,2);
}
console.log('PASS: capture costs, currency isolation, prerequisites, no double purchase, random/pity drops, contact exclusion, defeat banking, later yields, boss reward, non-chaining follow-up');

api.setSave({unlockedStage:10});api.startStage(1);state.spawnTimer=999;state.fireTimer=999;
spawnEnemy('basic');const melee=state.enemies[0];melee.x=state.party.x+37;melee.y=state.party.y;
updateCombat(1/60);assert(state.enemies.includes(melee));assert.equal(state.party.hp,9);
for(let i=0;i<60;i++)updateCombat(1/60);assert.equal(state.party.hp,9,'Melee respects cooldown');
for(let i=0;i<40;i++)updateCombat(1/60);assert.equal(state.party.hp,8,'Enemy attacks again');
api.startStage(1);state.spawnTimer=999;state.fireTimer=999;
state.obstacles=[{x:100,y:400,r:26}];state.projectiles=[{x:100,y:360,vx:0,vy:3000,r:6,source:'player',friendly:true,damage:1}];
updateCombat(1/60);assert.equal(state.projectiles.length,0,'Swept collision catches player shots');
state.projectiles=[{x:200,y:360,vx:0,vy:3000,r:6,source:'player',friendly:true,damage:1}];
updateCombat(1/60);assert.equal(state.projectiles.length,1,'Clear firing lane remains open');
console.log('PASS: persistent melee cooldown and sparse obstacle projectile blocking');
