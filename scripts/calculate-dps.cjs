// Usage: node scripts/calculate-dps.cjs [stage]
const fs=require('node:fs'),vm=require('node:vm');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const sandbox={document:{getElementById:()=>({width:540,height:900,getContext:()=>ctx,addEventListener(){}}),addEventListener(){}},Image:class{},localStorage:{getItem:()=>null},window:{__vt_pending:true}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../game.js'),'utf8'),sandbox);
const stages=process.argv[2]?[Number(process.argv[2])]:Array.from({length:10},(_,i)=>i+1);
if(stages.some(s=>!Number.isInteger(s)||s<1||s>10))throw Error('Stage must be 1–10');
console.log('Assumptions: 35% gold on player offense, 75% hit/uptime, 65% additional-projectile effectiveness, base Fanglet from stage 4; no damage from healer. Rocks may lower real uptime.');
console.table(stages.map(stage=>{const p=sandbox.window.__scollTest.stageDpsEstimate(stage);return {stage,gold:p.gold,playerDPS:+p.effectivePlayerDps.toFixed(2),fangletDPS:+p.fangletDps.toFixed(2),partyDPS:+p.partyDps.toFixed(2),basicHP:p.basicHp*p.hpMultiplier,rangedHP:(stage===2?3:p.basicHp*2)*p.hpMultiplier,armoredHP:(stage===2?4:p.basicHp*3)*p.hpMultiplier,bossHP:p.bossHp*p.hpMultiplier,bossSeconds:+(p.bossHp*p.hpMultiplier/p.partyDps).toFixed(1)}}));
