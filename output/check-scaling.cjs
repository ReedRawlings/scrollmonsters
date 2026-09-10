const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(process.cwd(), 'game.js'), 'utf8').replace('  render();\n  if (!window.__vt_pending)', '  window.review = { state, updateCombat, spawnEnemy, damageEnemy, nearestEnemy, attemptUpgrade, upgradeDefs };\n  render();\n  if (!window.__vt_pending)');
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

for (const stage of [1,3,5,8,10]) {
  const reports=[];
  for (const strong of [false,true]) {
    let wins=0, gold=0;
    for(let seed=1;seed<=20;seed++) {
      const g=fresh(seed);
      const upgrades={health:3,healPower:3,healSpeed:2, ...(strong ? {power:3,speed:3,multishot:2,strikerPower:3,strikerSpeed:2} : {power:1})};
      g.api.setSave({unlockedStage:10,recruits:stage>5?['striker','healer']:stage>3?['striker']:[],upgrades});g.api.startStage(stage);
      for(let i=0;i<180*60 && g.state.mode==='combat';i++) {const t=g.nearestEnemy();if(t) g.state.mouse={x:t.x,y:t.y};g.updateCombat(1/60);}
      assert.equal(g.state.mode,'result');wins+=g.state.result.won?1:0;gold+=g.state.result.gold;
    }
    reports.push({strong,wins,meanGold:gold/20});
  }
  console.log({stage,reports});
}
