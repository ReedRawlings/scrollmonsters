const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const ctx=new Proxy({measureText:()=>({width:1})},{get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const sandbox={document:{getElementById:()=>({width:540,height:900,getContext:()=>ctx,addEventListener(){}}),addEventListener(){}},Image:class{},localStorage:{getItem:()=>null,setItem(){}},window:{__vt_pending:true},Math:Object.create(Math)};
sandbox.Math.random=()=>0.5;
vm.runInNewContext(fs.readFileSync('game.js','utf8').replace('  window.__scollTest = {','  window.audit = {state,spawnEnemy,fangletAttack,fangletTarget,playerDamage,strikerDamage,firePlayerVolley,updateCombat,updateCompanions,upgradeDefs};\n  window.__scollTest = {'),sandbox);
const a=sandbox.window.audit,api=sandbox.window.__scollTest;
function setup(rank=5,bond=0,crit=false){sandbox.Math.random=()=>crit?0:0.5;api.setSave({unlockedStage:10,recruits:bond?['striker','healer']:['striker'],upgrades:{power:rank,strikerPower:rank,partyBond:bond,...(crit?{playerCritChance:10,strikerCritChance:10,playerCritDamage:5,strikerCritDamage:5}:{})}});api.startStage(4);Object.assign(a.state,{spawnTimer:999,fireTimer:999,treasureSpawnAt:null,obstacles:[],enemies:[]});a.state.companions.forEach(c=>c.timer=999);}
function enemy(hp=100,maxHp=hp,x=270,y=550){a.spawnEnemy('basic');const e=a.state.enemies.at(-1);Object.assign(e,{species:null,hp,maxHp,x,y,speed:0});return e;}
let cases=0;
for(let rank=0;rank<=10;rank++)for(const bond of [0,1])for(const crit of [false,true]){
 setup(rank,bond,crit);let e=enemy();a.state.mouse={x:e.x,y:e.y};a.firePlayerVolley();for(let i=0;i<20;i++)a.updateCombat(1/60);const player=100-e.hp;
 setup(rank,bond,crit);e=enemy();a.fangletAttack(a.state.companions[0]);const fangle=100-e.hp;
 assert.equal(player,fangle,`rank ${rank}, bond ${bond}, crit ${crit}`);assert.equal(fangle,(1+rank+5*bond)*(crit?1.5:1));cases++;
}
setup();let e=enemy();a.fangletAttack(a.state.companions[0]);assert.equal(e.hp,94);for(let i=0;i<36;i++)a.updateCombat(1/60);assert.equal(e.hp,94,'Animation cannot change damage again');
setup();a.state.save.upgrades.strikerFollowup=5;sandbox.Math.random=()=>0;const low=enemy(2,100,240,550),next=enemy(100,100,300,550);a.fangletAttack(a.state.companions[0]);assert(!a.state.enemies.includes(low));assert.equal(next.hp,94);assert.equal(a.state.effects.filter(e=>e.type==='groundTrap').length,2);
setup();e=enemy(1000);a.state.mouse={x:e.x,y:e.y};a.state.fireTimer=0;for(let i=0;i<600;i++)a.updateCombat(1/60);const player10s=1000-e.hp;
setup();e=enemy(1000);a.state.companions[0].timer=0;for(let i=0;i<600;i++)a.updateCombat(1/60);const fangle10s=1000-e.hp;
console.log(JSON.stringify({matchedActualHitCases:cases,rank5Hit:6,followupHit:6,damageAtTrapStart:true,tenSeconds:{player:player10s,fangle:fangle10s}},null,2));
