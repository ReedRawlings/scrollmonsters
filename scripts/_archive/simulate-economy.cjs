// Seeded, 60Hz live-combat runs. No hybrid DPS/boss shortcut or assumed capture milestones.
const fs=require('node:fs'),path=require('node:path'),{create,stageAudit,round,gameHash}=require('./balance-runtime.cjs');
const seeds=Number(process.env.SIM_SEEDS||5),cap=Number(process.env.SIM_MAX_ATTEMPTS||30),limit=Number(process.env.SIM_MAX_SECONDS||180),selected=process.argv[2]?Number(process.argv[2]):null;
const policies=(process.env.SIM_POLICIES||'balanced,offense,range').split(',');
if(!Number.isInteger(seeds)||seeds<1||seeds>100||!Number.isInteger(cap)||cap<1||!Number.isFinite(limit)||limit<10||policies.some(p=>!['balanced','offense','range'].includes(p))||(selected!==null&&(!Number.isInteger(selected)||selected<1||selected>10)))throw Error('Invalid simulation options');
const output=path.resolve(process.env.SIM_OUTPUT||'output/balance-current');fs.mkdirSync(output,{recursive:true});
const {loadout,shop,fight}=require('./campaign-model.cjs');
const audit=stageAudit(create()),runs=[];
for(const policy of policies)for(let seed=1;seed<=seeds;seed++){
 const g=create(seed),stageRows=[];const tutorial=fight(g,0);
 if(g.state.save.tutorial!=='upgrade')throw Error('Tutorial did not complete; no fabricated starting resources');
 // Mandatory tutorial purchase is the only fixed purchase, using the real upgrade handler.
 g.api.setMode('upgrades');g.attemptUpgrade(g.upgradeDefs.find(d=>d.id==='power'));
 for(let stage=1;stage<=10;stage++){
  const attempts=[];let won=false;
  for(let n=1;n<=cap;n++){
   const events=[];shop(g,policy,events);const entering=loadout(g),result=fight(g,stage,limit);attempts.push({attempt:n,entering,events,...result});
   if(result.won){won=true;break;}if(result.timeout)break;
  }
  stageRows.push({stage,won,attempts});if(!won)break;
 }
 runs.push({policy,seed,tutorialSeconds:tutorial.seconds,stages:stageRows,finalSave:g.api.getSave()});console.log(`${policy} seed ${seed}: ${stageRows.map(r=>`${r.stage}:${r.attempts.length}${r.won?'':'!'}`).join(' ')}`);
}
const mean=a=>a.length?a.reduce((n,v)=>n+v,0)/a.length:null,summary=[];
for(const policy of policies)for(let stage=1;stage<=10;stage++){
 const rows=runs.filter(r=>r.policy===policy).map(r=>r.stages.find(s=>s.stage===stage)).filter(Boolean),clears=rows.filter(r=>r.won),first=rows.map(r=>r.attempts[0]);
 summary.push({policy,stage,reached:rows.length,cleared:clears.length,firstTry:rows.filter(r=>r.attempts[0].won).length,meanAttempts:round(mean(rows.map(r=>r.attempts.length))||0),maxAttempts:Math.max(0,...rows.map(r=>r.attempts.length)),entryHp:round(mean(first.map(r=>r.entering.hp))||0),entryDps:round(mean(first.map(r=>r.entering.dps))||0),firstBossHp:round(mean(first.filter(r=>r.bossEntry).map(r=>r.bossEntry.hp))||0),meanMinutes:round(mean(rows.map(r=>r.attempts.reduce((n,a)=>n+a.seconds,0)/60))||0)});
}
const report={generatedAt:new Date().toISOString(),gameHash,settings:{seeds,policies,cap,limit,step:1/60},assumptions:['Live combat at 60 Hz, real tutorial, real earned gold/essence and retries.','Perfect instantaneous nearest-target cursor aim inside actual player range; no predictive leading.','Heuristic purchase policies; no claim of optimal or representative human play.','Tier 1 summons only; at most three owned per affinity; random duplicates are paid. Higher tiers deliberately excluded.','Automatic roster selection from owned creatures; ignores attack uptime/range when ranking direct DPS except explicit upgrade range scores.','No stage farming after clear; repeated failures bank actual rewards. Timeout is censored, not a modeled defeat prediction.','Single-target displayed DPS excludes burn, kills and extra AOE; live fights include these effects.'],audit,summary,runs};
fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
const csv=rows=>Object.keys(rows[0]).join(',')+'\n'+rows.map(r=>Object.values(r).map(v=>JSON.stringify(v)).join(',')).join('\n')+'\n';fs.writeFileSync(path.join(output,'campaign.csv'),csv(summary));
console.table(audit.filter(r=>!selected||r.stage===selected).map(({roster,...r})=>r));console.table(summary.filter(r=>!selected||r.stage===selected));console.log('Reports:',output);
