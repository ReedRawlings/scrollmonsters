const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let roll = 0;
const math = Object.create(Math); math.random = () => roll;
const ctx = new Proxy({measureText:t=>({width:String(t).length*8})}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const sandbox = {URLSearchParams,Math:math,document:{getElementById:()=>({width:540,height:900,getContext:()=>ctx,addEventListener(){}}),addEventListener(){}},Image:class{},location:{search:''},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},window:{__vt_pending:true}};
const source = fs.readFileSync('game.js','utf8').replace('  render();\n  if (!window.__vt_pending)', '  window.review={state,damageEnemy};\n  render();\n  if (!window.__vt_pending)');
vm.runInNewContext(source,sandbox);
const api=sandbox.window.__scollTest, {state,damageEnemy}=sandbox.window.review;
const expected = {
  1:{'feral-bat':[800,2,2],'bloom-bamboo':[200,1,1]},
  2:{'feral-beast':[200,8,2],'feral-bat':[500,4,2],'bloom-bamboo':[300,2,1]},
  3:{'feral-beast':[200,12,3],'feral-bat':[500,8,3],'bloom-bamboo':[300,4,1]}
};
for(const stage of [1,2,3]){
 api.setSave({unlockedStage:10}); api.startStage(stage);
 const counts={};
 for(let i=0;i<1000;i++){
  roll=(i+0.5)/1000;api.spawnEnemy(); const e=state.enemies.pop();
  assert(expected[stage][e.monsterId],`Unexpected monster ${e.monsterId}`);
  counts[e.monsterId]=(counts[e.monsterId]||0)+1;
  assert.equal(e.hp,expected[stage][e.monsterId][1]);assert.equal(e.damage,expected[stage][e.monsterId][2]);
  assert.equal(e.affinityId,e.monsterId.split('-')[0]);assert(e.species);
 }
 for(const [id,[count]] of Object.entries(expected[stage])) assert.equal(counts[id],count);
 api.spawnEnemy('boss');const boss=state.enemies.pop();
 assert.equal(boss.type,'boss');assert.equal(boss.demonCyclop,stage!==3);
 if(stage===3) assert.equal(boss.monsterId,'feral-bat');
 // Exercise actual spawned monsters through rewards; no synthetic affinity metadata.
 for(const value of [0.1,0.85]){
  state.save.essencePity={feral:0,bloom:0,arcane:0};state.runEssence={feral:0,bloom:0,arcane:0};
  for(let kill=1;kill<=5;kill++){
   roll=value;api.spawnEnemy();const e=state.enemies.at(-1),affinity=e.affinityId;
   roll=0.99;damageEnemy(e,e.hp);
   assert.equal(state.runEssence[affinity],kill===5?1:0);
  }
  assert.equal(state.runEssence.arcane,0);
 }
 roll=0.85;api.spawnEnemy();const e=state.enemies.at(-1),before=state.runEssence.bloom;
 roll=0.29;damageEnemy(e,e.hp);assert.equal(state.runEssence.bloom,before+1);
 console.log(`PASS stage ${stage}: exact weighted roster, HP/ATK, boss, affinity drops and pity`);
}
