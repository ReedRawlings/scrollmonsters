const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = new Proxy({}, { get: (o,k) => o[k] ?? (()=>{}), set: (o,k,v) => (o[k]=v,true) });
let saved;
const math = Object.create(Math); math.random = () => 0.99;
const sandbox = { Math: math, document: {getElementById:()=>({width:540,height:900,getContext:()=>context,addEventListener(){}}),addEventListener(){}},Image:class{},localStorage:{getItem:()=>saved||null,setItem:(k,v)=>saved=v},window:{__vt_pending:true},console};
vm.runInNewContext(fs.readFileSync('game.js','utf8').replace('  render();\n  if (!window.__vt_pending)', '  window.review = {state, updateCombat, spawnEnemy, damageEnemy, removeEnemy, finishStage, attemptUpgrade, captureDefs, upgradeDefs, updateCompanions};\n  render();\n  if (!window.__vt_pending)'),sandbox);
const {state,updateCombat,spawnEnemy,damageEnemy,removeEnemy,finishStage,attemptUpgrade,captureDefs,upgradeDefs}=sandbox.window.review;
const api=sandbox.window.__scollTest;

const moss=captureDefs.find(d=>d.capture==='healer'), bloom=upgradeDefs.find(d=>d.id==='deepBloom');
api.setSave({unlockedStage:10,mossEssence:42,fangEssence:50});attemptUpgrade(bloom);assert.equal(state.save.mossEssence,42);
attemptUpgrade(moss);attemptUpgrade(bloom);assert.equal(state.save.mossEssence,0);assert.equal(state.save.fangEssence,50);
api.startStage(5);state.party.hp=4;state.companions[0].timer=0;sandbox.window.review.updateCompanions(0);assert.equal(state.party.hp,8);
for(let i=0;i<5;i++){spawnEnemy('basic');const e=state.enemies.at(-1);e.species='mossbud';damageEnemy(e,10000);}
assert.equal(state.runMossEssence,2);finishStage(false);assert.equal(state.save.mossEssence,2);
api.startStage(10);spawnEnemy('basic');assert.equal(state.enemies.at(-1).damage,5);spawnEnemy('boss');assert.equal(state.enemies.at(-1).damage,26);
console.log('PASS: Mossbud capture, currency isolation, Deep Bloom, guaranteed drop, defeat banking and late damage');
