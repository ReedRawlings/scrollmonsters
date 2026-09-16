// Headless access to the live game. No combat or economy rules are reimplemented here.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const gamePath=path.join(__dirname,'../game.js'),original=fs.readFileSync(gamePath,'utf8');
const marker='window.__scollTest = {';
if(!original.includes(marker))throw Error('Game test entry point changed');
const source=original.replace(marker,`window.balanceRuntime={state,stageConfigs,stageRosters,rosterStats,stageBossDamage,upgradeDefs,upgradeUnlocked,attemptUpgrade,updateCombat,finishStage,nearestEnemy,enemyVisible,spawnEnemy,damageEnemy,maxPartyHealth,partyDpsSummary,playerAttackRange,playerFireInterval,feralAttacks,bloomAttacks,feralAttackRange,lizardBurnChance,summonCosts,creatureById,writeSave,visibleUpgradeDefs:()=>{const old=upgradeBranch;const defs=[];for(upgradeBranch=0;upgradeBranch<4;upgradeBranch++)defs.push(...upgradeBranchDefinitions());upgradeBranch=old;return defs;}};\n${marker}`);
function create(seed=1){
 const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const sandbox={Math:math,URLSearchParams,location:{search:'?calculator=1'},document:{getElementById:()=>({width:540,height:900,addEventListener(){}}),addEventListener(){}},Image:class{},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},window:{__vt_pending:true},console};
 vm.runInNewContext(source,sandbox,{filename:'game.js'});
 return {...sandbox.window.balanceRuntime,api:sandbox.window.__scollTest};
}
const round=x=>Math.round(x*100)/100;
function stageAudit(g){
 const rows=[];
 for(let number=1;number<=10;number++){
  g.api.setSave({tutorial:'done',unlockedStage:10});g.api.startStage(number);
  const s=g.state,cfg=s.stage;s.stageTime=cfg.duration;s.spawnTimer=s.fireTimer=s.rockSpawnTimer=s.vaseTimer=999;g.updateCombat(1/60);
  const bosses=s.enemies.filter(e=>e.type==='boss');
  const roster=g.stageRosters[number].map(e=>({id:e.id,weight:e.chance,...g.rosterStats(e,cfg)}));
  const meanHp=roster.reduce((n,e)=>n+e.hp*e.weight,0),meanDamage=roster.reduce((n,e)=>n+e.damage*e.weight,0);
  const meanInterval=cfg.spawnRate*.995,spawns=1+(cfg.duration-.35)/meanInterval;
  rows.push({stage:number,roster,meanHp:round(meanHp),meanDamage:round(meanDamage),spawnSeconds:round(meanInterval),incomingHpPerSecond:round(meanHp/meanInterval),bossCount:bosses.length,bossHp:bosses[0].maxHp,totalBossHp:round(bosses.reduce((n,e)=>n+e.maxHp,0)),bossDamage:bosses[0].damage,bossAttackSeconds:bosses[0].attackCooldown,bossContactDps:round(bosses.reduce((n,e)=>n+e.damage/e.attackCooldown,0)),baseGoldPerKill:bosses[0].gold,goldCeiling:round((spawns+bosses.length)*bosses[0].gold)});
 }
 return rows;
}
module.exports={create,stageAudit,round,gameHash:crypto.createHash('sha256').update(original).digest('hex')};
