const assert=require('node:assert/strict'),{create,stageAudit}=require('./balance-runtime.cjs');
const g=create(1),audit=stageAudit(g);
assert.equal(audit.length,10);assert.equal(audit[9].bossCount,2);assert.equal(audit[9].totalBossHp,audit[9].bossHp*2);assert(audit.slice(0,9).every(r=>r.bossCount===1));assert(audit.slice(7).every(r=>r.baseGoldPerKill===2));
assert.equal(audit[1].roster.find(e=>e.id==='feral-beast').hp,4);assert.equal(audit[1].roster.find(e=>e.id==='feral-bat').hp,3);
g.api.setSave({tutorial:'done',activeParty:['tutorial-cat'],ownedCreatures:['tutorial-cat']});assert.equal(g.partyDpsSummary().members.find(m=>m.id==='tutorial-cat').dps,1);
g.api.setSave({tutorial:'done',upgrades:{power:2,power3:1,partyBond:1},activeParty:['feral-bat'],ownedCreatures:['feral-bat']});const p=g.partyDpsSummary();assert.equal(p.members[0].dps,9);assert.equal(p.members[1].dps,8);
g.api.setSave({essence:{feral:29}});assert.equal(g.api.summonCreature('feral',1),null);g.state.save.essence.feral=30;assert.equal(g.api.summonCreature('feral',1),'feral-bat');assert.equal(g.state.save.essence.feral,0);
const a=create(123),b=create(123);for(const runtime of [a,b]){runtime.api.setSave({tutorial:'done'});runtime.api.startStage(1);for(let i=0;i<300;i++)runtime.updateCombat(1/60);}assert.equal(JSON.stringify(a.state.enemies),JSON.stringify(b.state.enemies));assert.equal(a.state.party.hp,b.state.party.hp);
console.log('PASS: live stage audit, real boss count/rewards, stage 2 overrides, starter DPS, current Party Bond, summon prices/guarantee, seeded reproducibility');
