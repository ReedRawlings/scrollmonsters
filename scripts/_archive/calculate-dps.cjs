// Usage: node scripts/calculate-dps.cjs [stage] [save.json]
// No save: seeded live-combat campaign. Save: static current-loadout comparison.
if(!process.argv[3]){require('./simulate-economy.cjs');return;}
const fs=require('node:fs'),{create,stageAudit,round}=require('./balance-runtime.cjs');
const stage=process.argv[2]?Number(process.argv[2]):null;
if(stage!==null&&(!Number.isInteger(stage)||stage<1||stage>10))throw Error('Stage must be 1–10');
const save=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
if(save.recruits&&!save.activeParty)throw Error('Legacy recruits save: supply current ownedCreatures and activeParty IDs instead.');
const g=create(),audit=stageAudit(g);g.api.setSave({...save,tutorial:'done'});
const party=g.partyDpsSummary(),hp=g.maxPartyHealth();
console.log('Expected direct-hit DPS, including current damage/cooldowns/extra attacks/crits; excludes burn, kill procs, overkill, travel and extra AOE targets.');console.table(party.members.map(m=>({member:m.name,dps:round(m.dps)})));
console.table(audit.filter(r=>stage===null||r.stage===stage).map(r=>({stage:r.stage,hp,partyDps:round(party.total),hpPressure:r.incomingHpPerSecond,bosses:r.bossCount,bossHp:r.totalBossHp,bossDamage:r.bossDamage,idealBossSeconds:round(r.totalBossHp/Math.max(.001,party.total)),bossHitsToDie:Math.ceil(hp/r.bossDamage)})));
