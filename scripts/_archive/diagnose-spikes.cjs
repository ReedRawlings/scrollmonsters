const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{create,round,gameHash}=require('./balance-runtime.cjs'),{fight}=require('./campaign-model.cjs');
const folder=path.resolve(process.env.SIM_OUTPUT||'output/balance-current'),r=JSON.parse(fs.readFileSync(path.join(folder,'report.json')));
assert.equal(r.gameHash,gameHash,'Game changed since report generation; rerun the calculator before diagnostics.');
// Audit actual campaign gold and essence ledgers, including paid duplicate summons.
for(const run of r.runs){let gold=10,essence={feral:0,bloom:0,arcane:0};const g=create();gold-=g.upgradeDefs.find(d=>d.id==='power').costs[0];for(const stage of run.stages)for(const a of stage.attempts){for(const e of a.events){if(e.currency==='gold')gold-=e.cost;else essence[e.currency]-=e.cost;}gold+=a.gold;for(const id of Object.keys(essence))essence[id]+=a.essence[id];}assert(Math.abs(gold-run.finalSave.gold)<.0001);for(const id of Object.keys(essence))assert.equal(essence[id],run.finalSave.essence[id]);}
const variants=['baseline','stage7','stage9','stage10','fish4_owl3','spawn20slower','owlApproaches','maxRange'],rows=[];
for(const variant of variants){const results=[];for(const run of r.runs){const entry=run.stages.find(s=>s.stage===8)?.attempts[0].entering;if(!entry)continue;const g=create(1000+run.seed);g.api.setSave({tutorial:'done',unlockedStage:10,ownedCreatures:entry.party,activeParty:entry.party,fullPartyReached:true,upgrades:entry.upgrades});let stage=8;
 if(variant.startsWith('stage'))stage=Number(variant.slice(5));
 if(variant==='fish4_owl3')for(const e of g.stageRosters[8]){if(e.id==='bloom-fish')e.damageOverride=4;if(e.id==='arcane-owl')e.damageOverride=3;}
 if(variant==='owlApproaches')for(const e of g.stageRosters[8])if(e.id==='arcane-owl')e.id='arcane-eye';
 if(variant==='maxRange'){g.state.save.upgrades.playerRange=5;g.state.save.upgrades.batRange=5;g.state.save.upgrades.lizardRange=5;}
 if(variant==='spawn20slower')g.stageConfigs[7].spawnRate*=1.2;
 results.push(fight(g,stage));}
 const wins=results.filter(x=>x.won).length,bosses=results.filter(x=>x.bossEntry).length;rows.push({variant,runs:results.length,wins,bossReached:bosses,averageSeconds:round(results.reduce((n,x)=>n+x.seconds,0)/results.length)});}
fs.writeFileSync(path.join(folder,'diagnostics.json'),JSON.stringify(rows,null,2));console.table(rows);console.log('PASS: campaign currency ledgers balance. What-if replays use the same stage-8 entry loadouts and paired seeds; no game tuning changed.');
