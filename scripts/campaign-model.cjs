const {round}=require('./balance-runtime.cjs');
const clone=x=>JSON.parse(JSON.stringify(x)),rank=(g,id)=>g.state.save.upgrades[id]||0;
function loadout(g){return {hp:g.maxPartyHealth(),dps:round(g.partyDpsSummary().total),gold:g.state.save.gold,essence:clone(g.state.save.essence),party:[...g.state.save.activeParty],upgrades:clone(g.state.save.upgrades)};}
function value(g,policy){
 const s=g.state.save,dps=g.partyDpsSummary().total,hp=g.maxPartyHealth();
 const bloom=s.activeParty.some(id=>g.creatureById(id)?.affinityId==='bloom');
 const attacks=1/g.playerFireInterval()+s.activeParty.reduce((n,id)=>n+(g.feralAttacks[id]?1/(g.feralAttacks[id].cooldown*(1-rank(g,'strikerSpeed')*.15)):g.bloomAttacks[id]?1/g.bloomAttacks[id].cooldown:id==='tutorial-cat'?1:0),0);
 const healing=bloom?attacks*.1*(rank(g,'bloom')+3*rank(g,'flush')):0;
 // Explicit purchase heuristic, not a model of actual battle outcomes.
 const recovery=healing+ (s.activeParty.includes('feral-bat')?.3*rank(g,'batLeech')*.2:0)+(s.activeParty.includes('bloom-fish')?.25*rank(g,'waterBurst'):0);
 return Math.log(Math.max(.1,dps))+(policy==='offense'?.35:.85)*Math.log(hp+recovery*8)+.25*Math.log(1+.05*rank(g,'magnet'))+.12*Math.log(1+.1*rank(g,'essenceFinder'))+(policy==='range'?.8:.12)*Math.log(g.playerAttackRange()/152)+.02*rank(g,'rockBreaker')+.007*rank(g,'boulderBuster')+.025*rank(g,'lizardBurn')+(policy==='range'?.1:.01)*(rank(g,'batRange')+rank(g,'lizardRange'))+.015*rank(g,'strikerFollowup')+.01*rank(g,'strikerFollowupHeal')+.01*rank(g,'rockBurst');
}
function selectParty(g,policy){
 const s=g.state.save,owned=s.ownedCreatures,before=[...s.activeParty];let best=-Infinity,chosen=before;
 // Exhaustive best three among owned Tier 1 creatures and starter Cat.
 function walk(start,ids){if(ids.length===Math.min(3,owned.length)){s.activeParty=ids;const v=value(g,policy);if(v>best){best=v;chosen=[...ids];}return;}for(let i=start;i<owned.length;i++)walk(i+1,[...ids,owned[i]]);}
 if(owned.length)walk(0,[]);s.activeParty=chosen;g.writeSave();
}
function shop(g,policy,events){
 const s=g.state.save;
 // Buy real Tier 1 summons until owning three of each type; keep sufficient funds for first full party.
 for(const affinity of ['feral','bloom','arcane']){
  for(let tries=0;tries<20&&s.essence[affinity]>=g.summonCosts[1]&&s.ownedCreatures.filter(id=>g.creatureById(id)?.affinityId===affinity).length<3;tries++){
   const id=g.api.summonCreature(affinity,1);if(!id)break;events.push({kind:'summon',id,currency:affinity,cost:g.summonCosts[1]});
  }
 }
 selectParty(g,policy);
 const defs=g.visibleUpgradeDefs();
 for(let guard=0;guard<100;guard++){
  const base=value(g,policy),choices=[];
  for(const d of defs){const r=rank(g,d.id),cost=d.costs[r],wallet=d.currency?s.essence[d.currency]:s.gold;
   if(r>=d.max||cost>wallet||!g.upgradeUnlocked(d))continue;
   s.upgrades[d.id]=r+1;const score=(value(g,policy)-base)/cost;if(r)s.upgrades[d.id]=r;else delete s.upgrades[d.id];
   if(score>1e-9)choices.push({d,cost,score});
  }
  if(!choices.length)break;choices.sort((a,b)=>b.score-a.score||a.cost-b.cost||a.d.id.localeCompare(b.d.id));const {d,cost}=choices[0];g.attemptUpgrade(d);events.push({kind:'upgrade',id:d.id,rank:rank(g,d.id),currency:d.currency||'gold',cost});
 }
 selectParty(g,policy);
}
function fight(g,stage,limit=180){
 g.api.startStage(stage);const s=g.state;s.tutorialIntro=false;let bossEntry=null,frames=0;
 for(;frames<limit*60&&s.mode==='combat';frames++){
  // Manual nearest-target aim within real player range. No movement/dodging is available.
  const target=g.nearestEnemy(s.party.x,s.party.y,true,g.playerAttackRange());
  if(target)s.mouse={x:target.x,y:target.y};
  else {const props=[...s.obstacles,...s.vases].filter(e=>Math.hypot(e.x-s.party.x,e.y-s.party.y)<=g.playerAttackRange());if(props.length)s.mouse={x:props[0].x,y:props[0].y};}
  g.updateCombat(1/60);
  if(s.bossSpawned&&!bossEntry)bossEntry={hp:round(s.party.hp),remainingRegular:s.enemies.filter(e=>e.type!=='boss').length,bosses:s.enemies.filter(e=>e.type==='boss').length,time:round(s.stageTime)};
 }
 const timeout=s.mode==='combat';if(timeout)g.finishStage(false);
 return {won:!!s.result?.won,timeout,seconds:round(frames/60),gold:round(s.runGold),essence:clone(s.runEssence),bossEntry,endHp:round(s.party.hp),bossHpLeft:round(s.enemies.filter(e=>e.type==='boss').reduce((n,e)=>n+e.hp,0)),remainingRegular:s.enemies.filter(e=>e.type!=='boss').length};
}

module.exports={loadout,shop,fight};
