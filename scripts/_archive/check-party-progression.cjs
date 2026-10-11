const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const math=Object.create(Math);let roll=.99;math.random=()=>roll;
const sandbox={Math:math,URLSearchParams,document:{getElementById:()=>({width:540,height:900,addEventListener(){}}),addEventListener(){}},Image:class{},location:{search:'?test=1'},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},window:{__vt_pending:true},console};
vm.runInNewContext(fs.readFileSync('game.js','utf8').replace('window.__scollTest = {','window.__scollTest = { review:()=>({state,partyDpsSummary,feralAttackRange,lizardBurnChance,damageEnemy,feralCreatureAttack,feralAttacks,updateCombat,upgradeDefs,attemptUpgrade,stageBossDamage,rosterStats,stageRosters,stageConfigs}),'),sandbox);
const a=sandbox.window.__scollTest,t=a.review(),s=t.state;
a.setSave({tutorial:'done',unlockedStage:10,gold:1000,essence:{feral:10000},ownedCreatures:['feral-bat','feral-lizard'],activeParty:['feral-bat','feral-lizard']});
for(const id of ['batLeech','batRange','lizardBurn','lizardRange'])for(let i=0;i<5;i++)t.attemptUpgrade(t.upgradeDefs.find(d=>d.id===id));
assert.equal(t.lizardBurnChance(),1);assert.equal(t.feralAttackRange('feral-bat'),324);assert.equal(t.feralAttackRange('feral-lizard'),228);
a.startStage(1);s.party.hp=1;s.enemies=[];a.spawnEnemy('basic','north');let e=s.enemies[0];Object.assign(e,{x:270,y:300,hp:1,maxHp:1});t.damageEnemy(e,1,'feral-bat');assert.equal(s.party.hp,2);
a.spawnEnemy('basic','north');e=s.enemies[0];Object.assign(e,{x:270,y:300,hp:100,maxHp:100});t.feralCreatureAttack({creatureId:'feral-lizard',x:270,y:400},t.feralAttacks['feral-lizard']);assert(e.burn);
let d=t.partyDpsSummary();assert.equal(d.members[1].dps,2);assert.equal(d.members[2].dps,2);s.save.upgrades.strikerDouble=10;s.save.upgrades.strikerTriple=10;assert.equal(t.partyDpsSummary().members[1].dps,6);
for(const stage of [9,10]){const c=t.stageConfigs[stage-1],bonus=stage===9?3:2;assert.equal(t.stageBossDamage(c),Math.round(5*c.damageScale)+bonus);for(const r of t.stageRosters[stage])assert.equal(t.rosterStats(r,c).damage,Math.round(r.baseDamage*c.damageScale)+bonus);}
s.save.activeParty=[];a.startStage(10);s.stageTime=s.stage.duration;s.spawnTimer=s.fireTimer=s.rockSpawnTimer=s.vaseTimer=999;t.updateCombat(1/60);const bosses=s.enemies.filter(e=>e.type==='boss');assert.equal(bosses.length,2);assert.notEqual(bosses[0].x,bosses[1].x);
t.damageEnemy(bosses[0],bosses[0].hp);assert.equal(s.bossDefeated,false);assert.equal(s.runEssence.arcane,0);t.damageEnemy(bosses[1],bosses[1].hp);assert.equal(s.bossDefeated,true);assert.equal(s.runEssence.arcane,20);
console.log('PASS: Feral upgrade ranks/effects/range, Bat healing, DPS including triple attacks, late damage, two bosses and final-only victory/reward');
