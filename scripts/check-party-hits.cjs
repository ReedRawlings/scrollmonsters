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


function setup(stage=10){api.setSave({unlockedStage:10,recruits:['striker','healer','aoe']});api.startStage(stage);state.fireTimer=999;state.spawnTimer=999;state.bossSpawned=true;state.companions.forEach(c=>c.timer=999);}
setup();assert.deepEqual(Array.from(state.companions,c=>[c.x,c.y]),[[270,410],[270,370],[270,330]]);
for(const member of ['player','striker','healer','aoe']){
 setup();const body=member==='player'?state.party:state.companions.find(c=>c.type===member);
 state.projectiles.push({x:body.x-35,y:body.y,vx:2400,vy:0,r:6,friendly:false,source:'ranged',damage:1.1});
 updateCombat(1/60);assert.equal(state.party.hp,8.9,member+' projectile hit');assert.equal(state.projectiles.length,0);
 assert.equal(state.effects.at(-1).y,body.y);
}
setup();state.projectiles.push({x:270,y:280,vx:0,vy:18000,r:8,friendly:false,source:'boss',damage:2});updateCombat(1/60);assert.equal(state.party.hp,8,'One projectile cannot hit multiple party members');assert.equal(state.effects.at(-1).y,330,'Frontmost collision intercepted by rear pet');
for(const member of ['striker','healer','aoe']){
 setup();const body=state.companions.find(c=>c.type===member);spawnEnemy('basic','west');const e=state.enemies.at(-1);e.x=body.x-35;e.y=body.y;e.meleeTimer=0;e.damage=2;
 updateCombat(1/60);assert.equal(state.party.hp,8,member+' melee hit');updateCombat(1/60);assert.equal(state.party.hp,8,'Melee cooldown prevents repeated immediate hits');
}
for(let stage=6;stage<=10;stage++)for(const fraction of [1,.44]){
 setup(stage);spawnEnemy('boss','south');const boss=state.enemies.at(-1);boss.x=270;boss.y=700;boss.hp=boss.maxHp*fraction;boss.attackTimer=0;updateCombat(1/60);
 assert.equal(state.projectiles.filter(p=>!p.friendly).length,1,`Stage ${stage} boss single shot at ${fraction} health`);
}
setup();state.projectiles.push({x:270,y:330,vx:0,vy:0,r:8,friendly:false,source:'boss',damage:20});updateCombat(1/60);assert.equal(state.result.won,false,'Lethal pet hit ends run');
console.log('PASS: close line; every party projectile hit; pet melee hits; single interception; lethal shared health; one shot per boss attack at full/low HP');
