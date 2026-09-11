// Seeded real-combat campaign simulation. Spend every affordable gold upgrade between attempts.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../game.js'),'utf8').replace('  render();\n  if (!window.__vt_pending)','  window.audit={state,upgradeDefs,captureDefs,attemptUpgrade,upgradeUnlocked,updateCombat,nearestEnemy,playerDpsFor,stageConfigs,spawnEnemy,removeEnemy,finishStage,updateTreasure,damageTreasure};\n  render();\n  if (!window.__vt_pending)');
const mode=process.env.SIM_MODE||"hybrid";
const buttermantBonus=Number(process.env.BUTTERMANT_PARTY_BONUS ?? 5);
if(!Number.isFinite(buttermantBonus)||buttermantBonus<0)throw Error('BUTTERMANT_PARTY_BONUS must be nonnegative');
if(mode==='full'&&![0,5].includes(buttermantBonus))throw Error('Full combat supports the live +5 node or the disabled baseline only');
const reportSuffix=buttermantBonus?`-buttermant${buttermantBonus}-cost50`:'';
const entryHp=Number(process.env.BOSS_ENTRY_HP||1);
if(!["hybrid","full"].includes(mode)||!(entryHp>0&&entryHp<=1))throw Error("Invalid SIM_MODE or BOSS_ENTRY_HP");
const seeds=Number(process.env.SIM_SEEDS||10);
const selectedStage=process.argv[2]?Number(process.argv[2]):null;
if(selectedStage!==null&&(!Number.isInteger(selectedStage)||selectedStage<1||selectedStage>10))throw Error("Stage must be 1–10");
if(!Number.isInteger(seeds)||seeds<1||seeds>100)throw Error("SIM_SEEDS must be 1–100");
function create(seed){
 const math=Object.create(Math);math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const sandbox={Math:math,document:{getElementById:()=>({width:540,height:900,getContext:()=>ctx,addEventListener(){}}),addEventListener(){}},Image:class{},localStorage:{getItem:()=>null,setItem(){}},window:{__vt_pending:true}};
 vm.runInNewContext(source,sandbox);
 const g={...sandbox.window.audit,api:sandbox.window.__scollTest,random:()=>math.random(),events:[],seenUnlocks:new Set(),seenCaptures:new Set(),context:{}};
 // Feasible campaign scenario: captures require clearing their listed milestone stage.
 // This also enforces Fangle's stage-3 milestone in the calculator VM.
 for(const capture of g.captureDefs)capture.requiresStageClear ??= capture.stage;
 // A zero-bonus baseline excludes the live node from simulated purchases.
 if(buttermantBonus===0)g.upgradeDefs=g.upgradeDefs.filter(d=>d.id!=='partyBond');
 const buy=g.attemptUpgrade;
 g.attemptUpgrade=d=>{
  const before=g.state.save.upgrades[d.id]||0, wallet=g.state.save[d.currency||'gold'];
  buy(d);
  const after=g.state.save.upgrades[d.id]||0;
  if(after>before)g.events.push({...g.context,kind:'purchase',id:d.id,name:d.name,rank:after,currency:d.currency||'gold',cost:wallet-g.state.save[d.currency||'gold']});
  noteUnlocks(g);
 };
 return g;
}
const r=(u,id)=>u[id]||0, crit=(u,id)=>1+r(u,id+'CritChance')/100*r(u,id+'CritDamage')/10;
function output(g,u=g.state.save.upgrades,bonus=buttermantBonus){
 const recruits=g.state.save.recruits;
 const extra=recruits.includes('healer')&&r(u,'partyBond')?bonus:0;
 const player=g.playerDpsFor(u,extra), fang=recruits.includes('striker')?(2+r(u,'strikerPower')+extra)/(1.05*(1-.15*r(u,'strikerSpeed')))*(1+r(u,'strikerDouble')/10*(1+r(u,'strikerTriple')/10))*crit(u,'striker'):0;
 const nova=recruits.includes('aoe')?(3+r(u,'aoePower'))/3.3*crit(u,'aoe'):0;
 const heal=recruits.includes('healer')?(2+r(u,'healPower'))/(4.6*(1-.15*r(u,'healSpeed')))*crit(u,'healer'):0;
 return {player,fang,nova,dps:player+fang+nova,heal,hp:10+5*r(u,'health')};
}
function value(g,u){const p=output(g,u);return Math.log(p.dps)+.65*Math.log(p.hp+p.heal*10)+.4*Math.log((1+r(u,'magnet')*.1)*(1+r(u,'travelSpeed')*.05)) + .025*r(u,'rockBreaker');}
function noteUnlocks(g){
 for(const d of g.upgradeDefs)if(g.upgradeUnlocked(d)&&!g.seenUnlocks.has(d.id)){
  g.seenUnlocks.add(d.id);g.events.push({...g.context,kind:'available',id:d.id,name:d.name});
 }
 for(const d of g.captureDefs)if(g.state.save.recruits.includes(d.capture)&&!g.seenCaptures.has(d.capture)){
  g.seenCaptures.add(d.capture);g.events.push({...g.context,kind:'capture',id:d.id,name:d.name,currency:d.currency||'stage',cost:d.cost||0,...(d.capture==='healer'?{partyDpsWithoutBonus:output(g,g.state.save.upgrades,0).dps,partyDpsWithBonus:output(g).dps,upgrades:{...g.state.save.upgrades}}:{})});
 }
}
function shop(g){
 // Essence captures use actual earned wallets. No stage-based assumed recruits.
 for(const d of [...g.captureDefs.filter(d=>d.currency),...g.upgradeDefs.filter(d=>d.currency)]) {
  if(d.capture? !g.state.save.recruits.includes(d.capture)&&g.state.save[d.currency]>=d.cost : g.upgradeUnlocked(d)&&r(g.state.save.upgrades,d.id)<d.max&&g.state.save[d.currency]>=d.costs[r(g.state.save.upgrades,d.id)])g.attemptUpgrade(d);
 }
 const purchases=[];
 for(let guard=0;guard<500;guard++){
  const u=g.state.save.upgrades,before=value(g,u);
  const choices=g.upgradeDefs.filter(d=>!d.currency&&g.upgradeUnlocked(d)&&r(u,d.id)<d.max&&d.costs[r(u,d.id)]<=g.state.save.gold).map(d=>{const cost=d.costs[r(u,d.id)];return {d,cost,score:(value(g,{...u,[d.id]:r(u,d.id)+1})-before)/cost}});
  if(!choices.length)break;
  choices.sort((a,b)=>b.score-a.score||a.cost-b.cost||a.d.id.localeCompare(b.d.id));
  const {d,cost}=choices[0];g.attemptUpgrade(d);purchases.push({id:d.id,rank:r(u,d.id),cost});
 }
 assert(!g.upgradeDefs.some(d=>!d.currency&&g.upgradeUnlocked(d)&&r(g.state.save.upgrades,d.id)<d.max&&d.costs[r(g.state.save.upgrades,d.id)]<=g.state.save.gold),'Shop left an affordable upgrade unbought');
 return purchases;
}
// Expected focused boss damage, discrete boss volleys and healer cooldowns.
function bossFight(g,stage,preBossDamage=0) {
 const cfg=g.stageConfigs[stage-1],p=output(g),u=g.state.save.upgrades;
 const maxBossHp=Number((Math.round(28*cfg.bossHpScale*(cfg.majorBoss?1.5:1))*cfg.hpMultiplier*cfg.bossHpMultiplier).toFixed(6));
 const hit=Math.max(1,Math.round(5*cfg.damageScale));
 let bossHp=maxBossHp,hp=Math.max(0,p.hp*entryHp-preBossDamage),time=0,previousTime=0,nextAttack=2.4;
 if(hp<=0)return {won:false,seconds:0,hp,bossHp,hit,maxBossHp};
 const healInterval=4.6*(1-.15*r(u,'healSpeed'));let nextHeal=healInterval;
 // No approach delay, misses, rocks, leftover enemies, or overkill. Full focus on boss.
 for(let i=0;i<18000;i++) {
  time=Math.min(nextAttack,p.heal>0?nextHeal:Infinity,time+bossHp/p.dps);
  const delta=time-previousTime;
  bossHp-=p.dps*delta;previousTime=time;
  if(bossHp<=1e-8){return {won:true,seconds:time,hp,bossHp:0,hit,maxBossHp};}
  if(nextHeal<=time+1e-8&&p.heal>0){hp=Math.min(p.hp,hp+p.heal*healInterval*(r(u,'deepBloom')&&hp<p.hp/2?2:1));nextHeal+=healInterval;}
  if(nextAttack<=time+1e-8){hp-=hit;nextAttack+=2.4;}
  if(hp<=0){return {won:false,seconds:time,hp,bossHp,hit,maxBossHp};}
 }
 throw Error('Boss model did not terminate');
}
function hybridAttempt(g,stage){
 g.api.startStage(stage);const cfg=g.stageConfigs[stage-1],travel=1+.05*r(g.state.save.upgrades,'travelSpeed');
 let t=.35/travel;const regular=[];
 while(t<cfg.duration){g.state.stageTime=t;g.spawnEnemy(null,'south');regular.push({enemy:g.state.enemies.at(-1),spawnTime:t});t+=cfg.spawnRate/travel*(.82+g.random()*.35);}
 // Ideal serial damage queue: damage cannot be spent before an enemy spawns.
 // All regulars must die by boss arrival; leftover enemies make the attempt a failure.
 // Expected single-target DPS ignores travel, misses, overkill and on-kill follow-ups.
 const p=output(g);let clearTime=0,killed=0,totalRegularHp=0;
 g.updateTreasure(0,cfg.duration);
 const queue=[...regular];
 // Reserve player firing time for the 5-HP chest once it enters the visible field.
 if(g.state.treasure)queue.push({chest:true,spawnTime:g.state.treasureSpawnAt+116/(24*travel)});
 queue.sort((a,b)=>a.spawnTime-b.spawnTime);
 for(const {enemy,spawnTime,chest} of queue){
  if(chest){
   clearTime=Math.max(clearTime,spawnTime)+5/p.player;
   if(clearTime<=cfg.duration)g.damageTreasure(5);
   continue;
  }
  totalRegularHp+=enemy.hp;
  clearTime=Math.max(clearTime,spawnTime)+enemy.hp/p.dps;
  if(clearTime<=cfg.duration){g.removeEnemy(enemy,true);killed++;}
 }
 const regularCleared=killed===regular.length;
 const preBossDamage=stage===4?3.5*Math.max(1,Math.round(cfg.damageScale)):0;
 const bossEntryHp=Math.max(0,p.hp*entryHp-preBossDamage);
 const fight=regularCleared?bossFight(g,stage,preBossDamage):{won:false,seconds:0,hp:bossEntryHp,reason:'Regular enemies remain at boss arrival'};
 g.state.stageTime=cfg.duration+fight.seconds;
 if(fight.won){g.spawnEnemy('boss','south');g.removeEnemy(g.state.enemies.at(-1),true);g.state.bossDefeated=true;}
 const expectedGold=Math.round(((killed+(fight.won?1:0))*(1+.1*r(g.state.save.upgrades,'magnet'))+g.state.treasureGold)*1e6)/1e6;
 assert(Math.abs(g.state.runGold-expectedGold)<1e-5,'Actual modeled regular kills / conditional boss reward mismatch');
 g.finishStage(fight.won);return {...fight,treasureGold:g.state.treasureGold,preBossDamage,bossEntryHp,regularCleared,regularClearTime:clearTime,totalRegularHp,regularSpawns:regular.length,regularGoldKills:killed,essenceKillSamples:killed,remainingRegular:regular.length-killed};
}
// Focused boss model checks with current stage-1 stats, independent of campaign seeds.
{
 const test=create(998);test.api.setSave({upgrades:{power:4,strikerPower:2,aoePower:1}});
 assert.equal(output(test).dps,output(test,test.state.save.upgrades,0).dps,'Bonus gated by capture');
 if(buttermantBonus>0){test.state.save.gold=50;test.attemptUpgrade(test.upgradeDefs.find(d=>d.id==='partyBond'));assert.equal(test.state.save.upgrades.partyBond,undefined,'Capture required to purchase');assert.equal(test.state.save.gold,50);}
 test.api.setSave({recruits:['striker','healer','aoe'],gold:49,upgrades:{power:4,strikerPower:2,aoePower:1}});
 assert.equal(output(test).dps,output(test,test.state.save.upgrades,0).dps,'Capture alone does not grant bonus');
 if(buttermantBonus>0){
  const node=test.upgradeDefs.find(d=>d.id==='partyBond');
  test.attemptUpgrade(node);assert.equal(test.state.save.upgrades.partyBond,undefined,'49G cannot buy 50G node');
  test.state.save.gold=50;test.attemptUpgrade(node);assert.equal(test.state.save.gold,0);assert.equal(test.state.save.upgrades.partyBond,1);
  test.state.save.gold=50;test.attemptUpgrade(node);assert.equal(test.state.save.gold,50,'Single purchase cap');
 }
 const before=output(test,test.state.save.upgrades,0),after=output(test);
 assert(Math.abs(after.player-before.player-buttermantBonus/.425)<1e-8);
 assert(Math.abs(after.fang-before.fang-buttermantBonus/1.05)<1e-8);
 assert.equal(after.nova,before.nova,'Tinmin is not affected by Party Bond');
 assert.equal(before.heal,after.heal,'No healing bonus');
}
if(entryHp===1){
 const test=create(999);test.api.setSave({});
 const weak=bossFight(test,1);assert(!weak.won);assert(Math.abs(weak.seconds-7.2)<1e-8,'Three 4-damage boss hits defeat 10 HP');
 test.api.setSave({upgrades:{power:1}});const strong=bossFight(test,1);
 assert(strong.won);assert(Math.abs(strong.seconds-28/(2/.425))<1e-8,'Focused boss kill time must match HP / DPS');
 assert.equal(strong.hp,2,'Two boss hits land before the kill');
}
const failures=[],records=[],unlockEvents=[];

for(let seed=1;seed<=seeds;seed++){
 const g=create(seed);let earned=0,spent=0,totalSeconds=0,totalAttempts=0;
 g.context={seed,stage:1,attempt:0,totalAttempts,earned,seconds:0};noteUnlocks(g);
 for(let stage=1;stage<=10;stage++){
  let won=false;const first=output(g);let attempts=0,stageGold=0,seconds=0;
  for(;attempts<80&&!won;){
   g.context={seed,stage,attempt:attempts,totalAttempts,earned,seconds:totalSeconds};
   const purchases=shop(g);spent+=purchases.reduce((n,p)=>n+p.cost,0);
   for(const capture of g.captureDefs)if(g.state.save.recruits.includes(capture.capture))assert(g.state.save.completed.includes(capture.requiresStageClear),'Captured creature before milestone clear');
   for(const d of g.upgradeDefs)if(r(g.state.save.upgrades,d.id)>0)assert(g.upgradeUnlocked(d),'Purchased rank without its prerequisites or recruit');
   if(stage<=5){assert(!g.state.save.recruits.includes('healer'),'Buttermant cannot enter stages 1–5 before its first clear');assert(!r(g.state.save.upgrades,'partyBond'),'Party Bond unavailable before stage-5 clear');}
   const entering={...output(g),gold:g.state.save.gold,upgrades:{...g.state.save.upgrades},recruits:[...g.state.save.recruits]};
   let fight;
   if(mode==='hybrid') fight=hybridAttempt(g,stage);
   else {
    g.api.startStage(stage);
    for(let frame=0;frame<180*60&&g.state.mode==='combat';frame++){
     const target=g.nearestEnemy();if(target)g.state.mouse={x:target.x,y:target.y};g.updateCombat(1/60);
    }
    if(g.state.mode==='combat')throw Error(`Seed ${seed}, stage ${stage}: attempt timed out`);
    const boss=g.state.enemies.find(e=>e.type==='boss');
    fight={won:g.state.result.won,seconds:g.state.stageTime,bossSpawned:g.state.bossSpawned,bossHp:boss?.hp,bossMaxHp:boss?.maxHp,remainingRegular:g.state.enemies.filter(e=>e.type!=='boss').length};
   }
   if(!fight.won)failures.push({seed,stage,attempt:attempts+1,...fight,partyDps:entering.dps,partyHp:entering.hp});
   attempts++;won=g.state.result.won;const gold=g.state.result.gold;earned+=gold;stageGold+=gold;seconds+=g.state.stageTime;
   totalSeconds+=g.state.stageTime;totalAttempts++;
   g.context={seed,stage,attempt:attempts,totalAttempts,earned,seconds:totalSeconds};noteUnlocks(g);
   const afterPurchases=shop(g);spent+=afterPurchases.reduce((n,p)=>n+p.cost,0);
   assert(Math.abs(earned-spent-g.state.save.gold)<1e-4,'Gold ledger mismatch');
   if(won||attempts===80)records.push({seed,stage,won,attempts,stageGold,seconds,earned,spent,unspent:g.state.save.gold,firstDps:first.dps,winning:entering,bossFight:fight,after:output(g),recruits:[...g.state.save.recruits]});
  }
  if(!won)break;
 }
 unlockEvents.push(...g.events);
}
const mean=(rows,f)=>rows.reduce((n,x)=>n+f(x),0)/rows.length, round=x=>+x.toFixed(2);
console.log(`Calculator scenario: +${buttermantBonus} player/Fangle flat damage after Buttermant capture, before extra shots and crits; no healing bonus. Single-rank Party Bond costs 50G, requires capture, and competes with other affordable purchases.`);
console.log(`MODEL ${mode}: ${seeds} seeds; accurate nearest-target aim; all affordable gold upgrades purchased after every attempt. Gold and essence purchases tracked; retries until clear (80-attempt cap).`);
if(mode==='hybrid')console.log(`Require all regulars cleared by 30s using a spawn-timed ideal DPS queue; award gold/essence only for modeled kills. Boss starts at ${entryHp*100}% party HP minus 3.5 ranged hits (7 HP) in stage 4 only. Boss uses expected focused DPS, discrete 2.4s hits, one shot per boss attack at every health level, and actual healer cooldowns. No other regular-enemy damage, misses or rocks modeled. Leftover regulars cause failure at boss arrival; their subsequent attacks are not simulated.`);
console.log('Purchase heuristic: marginal log DPS + 0.65 log(HP + 10 seconds healing) + 0.4 log(economy), per gold; small rock-breaker preference. Not an optimal policy or human playtest. No reserved budget.');
const rows=Array.from({length:10},(_,i)=>i+1).map(stage=>{
 const rs=records.filter(x=>x.stage===stage);if(!rs.length)return {stage,clears:0};const cfg=create(1).stageConfigs[stage-1];
 return {stage,clears:rs.filter(x=>x.won).length,attempts:round(mean(rs,x=>x.attempts)),playerDPS:round(mean(rs,x=>x.winning.player)),fangleDPS:round(mean(rs,x=>x.winning.fang)),partyDPS:round(mean(rs,x=>x.winning.dps)),HP:round(mean(rs,x=>x.winning.hp)),goldPerAttempt:round(mean(rs,x=>x.stageGold/x.attempts)),totalGoldSpent:round(mean(rs,x=>x.spent)),leftover:round(mean(rs,x=>x.unspent)),basicHP:Math.round(cfg.hpScale)*cfg.hpMultiplier,bossHP:Number((Math.round(28*cfg.bossHpScale*(cfg.majorBoss?1.5:1))*cfg.hpMultiplier*cfg.bossHpMultiplier).toFixed(6))};
});
console.table(selectedStage?rows.filter(row=>row.stage===selectedStage):rows);
fs.mkdirSync(path.join(__dirname,'../output'),{recursive:true});fs.writeFileSync(path.join(__dirname,`../output/economy-${mode}${reportSuffix}.json`),JSON.stringify({mode,buttermantBonus,partyBondCost:50,entryHp,regularClearRequired:true,stage4RangedHits:3.5,seeds,rows,records,failures,unlockEvents},null,2));
console.log('DPS shown is ideal output of the loadout that cleared (or last attempted) each stage; full mode uses actual combat; hybrid mode isolates boss survival. Tinmin is acquired after stage 10. Raw ledger/loadouts: output/economy-<mode>.json');

for(let seed=1;seed<=seeds;seed++){
 const events=unlockEvents.filter(e=>e.seed===seed);let priorTime=0;
 for(const event of events){assert(event.seconds>=priorTime,'Unlock timeline must be chronological');priorTime=event.seconds;}
 for(const event of events.filter(e=>e.kind==='purchase'))assert(events.some(e=>e.kind==='available'&&e.id===event.id&&e.seconds<=event.seconds),'Purchase must follow eligibility');
}
const milestoneDefinitions=create(1);
const milestones=[...milestoneDefinitions.upgradeDefs.map(d=>({id:d.id,name:(d.recruit?({striker:'Fangle',healer:'Buttermant',aoe:'Tinmin'}[d.recruit])+': ':d.branch==='PLAYER'?'Player: ':'')+d.name,kind:'purchase'})),...milestoneDefinitions.captureDefs.map(d=>({id:d.id,name:d.name,kind:'capture'}))];
const unlockRows=milestones.map(m=>{
 const events=unlockEvents.filter(e=>e.id===m.id&&e.kind===m.kind&&(e.kind==='capture'||e.rank===1));
 const available=unlockEvents.filter(e=>e.id===m.id&&e.kind==='available');
 return {id:m.id,name:m.name,observed:events.length,seeds,availableStages:available.length?`${Math.min(...available.map(e=>e.stage))}–${Math.max(...available.map(e=>e.stage))}`:'capture condition',firstPurchaseStages:events.length?`${Math.min(...events.map(e=>e.stage))}–${Math.max(...events.map(e=>e.stage))}`:'not purchased',meanEarnedGold:events.length?round(mean(events,e=>e.earned)):null,meanAttempts:events.length?round(mean(events,e=>e.totalAttempts)):null,meanCombatMinutes:events.length?round(mean(events,e=>e.seconds/60)):null};
});
fs.writeFileSync(path.join(__dirname,`../output/unlock-timing-${mode}${reportSuffix}.json`),JSON.stringify({mode,buttermantBonus,partyBondCost:50,seeds,assumptions:'Spawn-timed ideal DPS must clear all regulars before boss; stage 4 takes 3.5 ranged hits before boss; rewards for modeled kills only; purchase strategy unchanged. Times exclude menus. Earned gold is cumulative, not the price.',unlocks:unlockRows},null,2));
console.log('UNLOCK TIMING: first purchases/captures; earned gold includes spending on all earlier upgrades. Stage ranges reflect purchase choices, not hard gates.');
console.table(unlockRows);
