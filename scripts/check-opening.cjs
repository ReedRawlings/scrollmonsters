const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../game.js'), 'utf8').replace('  render();\n  if (!window.__vt_pending)', '  window.review = { state, updateCombat, spawnEnemy, damageEnemy, nearestEnemy, attemptUpgrade, upgradeDefs };\n  render();\n  if (!window.__vt_pending)');
function fresh(seed = 1) {
  const random = Object.create(Math);
  random.random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const ctx = new Proxy({}, { get: (o,k) => o[k] ?? (() => {}), set: (o,k,v) => (o[k]=v,true) });
  const sandbox = { Math: random, document: { getElementById: () => ({ width:540, height:900, getContext:()=>ctx, addEventListener() {} }), addEventListener() {} }, Image: class {}, localStorage:{getItem:()=>null,setItem(){},removeItem(){}}, window:{__vt_pending:true} };
  vm.runInNewContext(source, sandbox);
  return { ...sandbox.window.review, api: sandbox.window.__scollTest };
}
function play(game, upgrades = {}) {
  const { state, api, updateCombat, nearestEnemy } = game;
  api.setSave({ upgrades }); api.startStage(1);
  let bossShotDamage = 0, previousHp = state.party.hp;
  for(let i=0;i<120*60 && state.mode==='combat';i++) {
    const target = nearestEnemy();
    if (target) state.mouse = { x:target.x, y:target.y };
    updateCombat(1/60);
    if (state.bossSpawned && state.party.hp < previousHp) bossShotDamage += previousHp-state.party.hp;
    previousHp=state.party.hp;
  }
  assert.equal(state.mode,'result');
  return { won:state.result.won, gold:state.result.gold, hp:state.party.hp, seconds:Number(state.stageTime.toFixed(1)), bossShotDamage };
}
const results=[];
for(let seed=1;seed<=20;seed++) {
  const initial=play(fresh(seed));
  const upgraded=play(fresh(seed),{power:1,health:1});
  results.push({seed,initial,upgraded});
}
console.log(JSON.stringify(results.slice(0,3),null,2));
console.log('No-upgrade wins:',results.filter(r=>r.initial.won).length,'/20; upgraded wins:',results.filter(r=>r.upgraded.won).length,'/20');
assert(results.every(r=>!r.initial.won && r.initial.bossShotDamage>0),'Unupgraded players must lose to boss even with ideal aim');
assert(results.every(r=>r.initial.gold>=10),'First failed run with ideal aim can buy damage and health');
assert(results.every(r=>r.upgraded.won),'One damage and one health rank can beat stage 1');
const game=fresh();const {state,api,spawnEnemy,damageEnemy,updateCombat,attemptUpgrade,upgradeDefs}=game;
api.startStage(1);state.fireTimer=999;state.spawnTimer=999;
spawnEnemy('basic');const enemy=state.enemies[0];
assert(enemy.x<0||enemy.x>540||enemy.y<126||enemy.y>804,'Entire monster starts outside the combat area');assert.equal(enemy.hp,1);assert.equal(enemy.gold,1);assert.equal(enemy.speed,92 * 1.4);
state.projectiles.push({x:enemy.x,y:enemy.y,vx:0,vy:0,r:6,friendly:true,damage:1});updateCombat(1/60);assert.equal(enemy.hp,1,'Cannot hit offscreen monsters');
enemy.x=270;enemy.y=700;damageEnemy(enemy,1);assert.equal(state.enemies.length,0);assert.equal(state.runGold,1);
spawnEnemy('basic');const charger=state.enemies[0];charger.x=80;charger.y=310;
const hp=state.party.hp;updateCombat(1/60);assert.equal(state.party.hp,hp,'Passing the party latitude is not a hit');assert(charger.x>80,'Monsters home horizontally toward player');
charger.x=state.party.x;charger.y=state.party.y+30;updateCombat(1/60);assert.equal(state.party.hp,hp-1);assert.equal(state.runGold,1,'Contact does not award a kill reward');
api.setSave({gold:10});attemptUpgrade(upgradeDefs.find(d=>d.id==='power'));attemptUpgrade(upgradeDefs.find(d=>d.id==='health'));api.startStage(1);
assert.equal(state.party.maxHp,15);assert.equal(state.save.gold,0);updateCombat(1/60);assert.equal(state.projectiles[0].damage,2);
console.log('PASS: opening balance across 20 seeds; 1 HP/1 gold; fast offscreen homing/contact; no offscreen hits; affordable +1 damage/+5 health');

for (const x of [70,270,470]) {
  const g=fresh();g.api.startStage(1);g.state.spawnTimer=999;g.state.fireTimer=999;g.spawnEnemy('basic');
  const e=g.state.enemies[0];e.x=x;e.y=700;
  const startDistance=Math.hypot(e.x-g.state.party.x,e.y-g.state.party.y), worldY=e.y+g.state.scroll;
  for(let frame=0;frame<60;frame++)g.updateCombat(1/60);
  assert(Math.hypot(e.x-g.state.party.x,e.y-g.state.party.y)<startDistance, 'Enemy must approach on screen');
  assert(e.y+g.state.scroll<worldY, 'Enemy must approach relative to scrolling ground');
}
console.log('PASS: monsters approach relative to both player and ground from all spawn lanes');

for (const x of [70,270,470]) {
  const g=fresh();g.api.startStage(1);g.state.spawnTimer=999;g.state.fireTimer=999;g.spawnEnemy('basic');
  const e=g.state.enemies[0];e.x=x;let lastDistance=Math.hypot(e.x-g.state.party.x,e.y-g.state.party.y);
  for(let frame=0;frame<600 && g.state.enemies.includes(e);frame++){
    g.updateCombat(1/60);const distance=Math.hypot(e.x-g.state.party.x,e.y-g.state.party.y);
    assert(distance<=lastDistance, 'Approach distance must decrease every frame, including beside the player');
    lastDistance=distance;
  }
  assert.equal(g.state.enemies.length,0,'Enemy must reach party instead of drifting past');
  assert.equal(g.state.party.hp,9,'Enemy contact must damage the party');
}
console.log('PASS: all lanes converge every frame and make contact, without drifting past the player');
