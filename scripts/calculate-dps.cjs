// Usage: node scripts/calculate-dps.cjs [stage] [save.json]
// Default: real-combat simulation spending all affordable gold. Optional save: static loadout audit.
if (!process.argv[3]) { require("./simulate-economy.cjs"); return; }
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
const math=Object.create(Math);math.random=()=>0.999;
const sandbox={Math:math,document:{getElementById:()=>({width:540,height:900,getContext:()=>ctx,addEventListener(){}}),addEventListener(){}},Image:class{},localStorage:{getItem:()=>null,setItem(){}},window:{__vt_pending:true}};
const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8').replace('  render();\n  if (!window.__vt_pending)','  window.audit={stageConfigs,upgradeDefs,projectOffense,expectedCampaignGold,spawnEnemy,state,playerDpsFor};\n  render();\n  if (!window.__vt_pending)');
vm.runInNewContext(source,sandbox);
const a=sandbox.window.audit, api=sandbox.window.__scollTest;
const stages=process.argv[2]?[Number(process.argv[2])]:Array.from({length:10},(_,i)=>i+1);
if(stages.some(s=>!Number.isInteger(s)||s<1||s>10))throw Error('Stage must be 1–10');
const supplied=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):null;
const round=n=>+n.toFixed(2), rank=(u,id)=>u[id]||0;
const crit=(u,id)=>1+rank(u,id+'CritChance')/100*rank(u,id+'CritDamage')/10;
const shots=(u,second,third)=>1+rank(u,second)/10*(1+rank(u,third)/10);
function party(u,recruits){
 const configuredBonus=Number(process.env.BUTTERMANT_PARTY_BONUS??5);
 if(!Number.isFinite(configuredBonus)||configuredBonus<0)throw Error('BUTTERMANT_PARTY_BONUS must be nonnegative');
 const extra=recruits.includes('healer')&&rank(u,'partyBond')?configuredBonus:0;
 const player=a.playerDpsFor(u,extra), fang=recruits.includes('striker')?(2+rank(u,'strikerPower')+extra)/(1.05*(1-rank(u,'strikerSpeed')*.15))*shots(u,'strikerDouble','strikerTriple')*crit(u,'striker'):0;
 const nova=recruits.includes('aoe')?(3+rank(u,'aoePower'))/3.3*crit(u,'aoe'):0;
 const heal=recruits.includes('healer')?(2+rank(u,'healPower'))/(4.6*(1-rank(u,'healSpeed')*.15))*crit(u,'healer'):0;
 return {player,fang,nova,heal,total:player+fang+nova};
}
console.log(`Player/Fangle flat damage bonus after Buttermant: ${process.env.BUTTERMANT_PARTY_BONUS??5}; requires purchased partyBond rank 1 (50G); no healing bonus.`);
console.log('Using supplied upgrades/recruits; static loadout comparison, not a campaign spending policy.');
console.log('DPS is ideal sustained single-target output (all projectiles hit, no overkill/rocks/travel loss); healing is separate. Follow-Up Bite is excluded: its DPS depends on kill rate. Deep Bloom doubles healing only below half HP.');
const rows=stages.map(stage=>{
 const gold=a.expectedCampaignGold(stage-1), u=supplied?.upgrades||a.projectOffense(gold).upgrades;
 const recruits=supplied?.recruits||[...(stage>=4?['striker']:[]),...(stage>=6?['healer']:[])];
 const p=party(u,recruits),cfg=a.stageConfigs[stage-1],travel=1+rank(u,'travelSpeed')*.05;
 api.setSave({unlockedStage:10});api.startStage(stage);
 const hp={};for(const type of ['basic','ranged','armored','boss']){a.spawnEnemy(type,'south');hp[type]=a.state.enemies.at(-1).maxHp;}
 const spawns=1+(cfg.duration-.35/travel)/(cfg.spawnRate/travel*.995);
 const bonus=1+rank(u,'magnet')*.1, gold82=(spawns*.82+1)*bonus, gold100=(spawns+1)*bonus;
 const weights=stage===1?[1,0,0]:stage===2?[.78,0,.22]:[.55,.23,.22];
 const hpRate=(hp.basic*weights[0]+hp.ranged*weights[1]+hp.armored*weights[2])/(cfg.spawnRate/travel*.995);
 return {stage,priorGold:gold,playerDPS:round(p.player),fangleDPS:round(p.fang),tinminDPS:round(p.nova),partyDPS:round(p.total),healPS:round(p.heal),gold82:round(gold82),gold100:round(gold100),basicHP:hp.basic,rangedHP:hp.ranged,armoredHP:hp.armored,bossHP:hp.boss,incomingHPps:round(hpRate),bossSeconds:round(hp.boss/p.total)};
});
console.table(rows);
console.log('Gold columns estimate a full 30-second traversal plus boss kill at 82%/100% regular kills. Failure/early boss completion, spawn variation and contact/overkill change actual earnings. Opening Fangles override regular HP to 2 (stage 1) / 4 (stage 2); HP columns show ordinary archetypes. priorGold is the old budget assumption, not simulated earnings.');
if(!supplied){
 const max=Object.fromEntries(a.upgradeDefs.map(d=>[d.id,d.max]));const p=party(max,['striker','healer','aoe']);
 console.log('ALL-UPGRADES CEILING (not a campaign prediction):',Object.fromEntries(Object.entries(p).map(([k,v])=>[k,round(v)])));
 console.log('Total gold to purchase all gold-funded ranks:',a.upgradeDefs.filter(d=>!d.currency).reduce((n,d)=>n+d.costs.reduce((s,c)=>s+c,0),0));
 console.log('Tinmin at base adds',round(3/3.3),'single-target DPS; multiply its component by targets hit for crowd damage. Max Tinmin adds',round(p.nova),'DPS per target.');
}
