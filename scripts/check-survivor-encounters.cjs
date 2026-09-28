const assert=require('node:assert/strict');
const {run}=require('./survivor-test-utils.cjs');
run('trial habitats, charge targeting, capture completion, growth and Guardian patterns',async page=>{
 const result=await page.evaluate(()=>{
  const s=__survivorTest.scene,out={};
  const setup=()=>{s.nestDeckOverride=['owl','beast','cat','mouse','mole','bear'];s.start();s.obstacles=[];s.spawnTimer=999;s.player.fire=999;s.cat.attack=999;s.player.inv=999;};
  setup();s.elapsed=29.9;s.encounters.update(.05);out.absent=!s.encounters.nestsActive;s.elapsed=30;s.encounters.update(0);out.active=s.encounters.nestsActive;for(let i=0;i<600;i++)s.encounters.update(1/60);out.defenders=s.encounters.nests.map(n=>n.spawnCount);
  setup();Object.assign(s.player,{x:800,y:800});s.encounters.beast={x:800,y:800,r:14,state:'ally',attack:0,charge:0,hits:new Set()};s.spawn('bat',760,800);for(const x of [910,955,1000])s.spawn('beast',x,800);const plan=s.encounters.planBeastCharge();out.plan={dx:plan.dx,hits:plan.hits};advanceTime(550);out.chargeDamage=s.encounters.beastDamage;
  setup();s.elapsed=30;s.encounters.nestsActive=true;s.encounters.nests.forEach(n=>n.clock=999);const owlNest=s.encounters.nests[0],beastNest=s.encounters.nests[1];s.hit(owlNest,999,'player',s.player);s.hit(beastNest,999,'player',s.player);out.pending={choice:s.encounters.chosen,owl:s.owl.state,beast:s.encounters.beast.state};Object.assign(s.player,{x:owlNest.x,y:owlNest.y});advanceTime(1000);const progress=s.owl.progress;s.pause();advanceTime(1000);out.frozen=s.owl.progress===progress;s.pause();advanceTime(1600);out.captured={choice:s.encounters.chosen,owl:s.owl.state,beast:s.encounters.beast,party:s.expedition.party()};
  setup();s.owl={x:s.player.x,y:s.player.y,state:'ally',attack:0,progress:2.5};s.encounters.beast={x:s.player.x,y:s.player.y,r:14,state:'ally',attack:0,charge:0,hits:new Set()};
  for(let i=0;i<2;i++)for(const id of ['partyDamage','partySpeed']){const choice=s.upgradePool().find(u=>u.id===id);s.choices=[choice];s.mode='upgrade';s.chooseUpgrade(0);}
  out.stats=s.companionStats();out.rate=s.attackRate();out.pool=s.upgradePool().map(u=>u.id);out.hits={};for(const type of ['owl','beast']){const e=s.spawn('beast',s.player.x+100,s.player.y);e.hp=100;s.hit(e,out.stats[type].damage,type,s.player);out.hits[type]=100-e.hp;}
  setup();s.elapsed=89.99;advanceTime(20);const b=s.encounters.boss;out.bossSpawned=!!b;advanceTime(9000);out.patterns=['aimed','ring'].every(pattern=>s.run.events.some(e=>e.type==='boss_volley'&&e.pattern===pattern));s.elapsed=119.99;advanceTime(100);out.overtime=s.mode==='playing';s.hit(b,99999,'player',s.player);advanceTime(20);out.won=s.mode;
  setup();s.player.inv=0;s.encounters.shoot({x:s.player.x-50,y:s.player.y},0,150);advanceTime(400);out.projectileHp=s.player.hp;
  setup();out.reset=!s.encounters.boss&&!s.encounters.chosen&&s.encounters.bullets.length===0&&s.upgrades.partyDamage===0;
  return out;
 });
 assert(result.absent&&result.active);assert(result.defenders.every(n=>n>=1));assert(result.plan.dx>.9);assert.equal(result.plan.hits,3);assert(result.chargeDamage>=14.4-1e-6);
 assert.equal(result.pending.choice,null);assert.equal(result.pending.owl,'ready');assert.equal(result.pending.beast,'ready');assert(result.frozen);assert.equal(result.captured.choice,'owl');assert.equal(result.captured.owl,'ally');assert.equal(result.captured.beast,null);assert.deepEqual(result.captured.party,['cat','owl']);
 assert(Math.abs(result.hits.owl-3.712)<1e-6);assert(Math.abs(result.hits.beast-5.568)<1e-6);assert(Math.abs(result.rate-1.12)<1e-6);assert(!result.pool.includes('owlPower')&&!result.pool.includes('beastSpeed'));
 assert(result.bossSpawned&&result.patterns&&result.overtime&&result.reset);assert.equal(result.won,'won');assert.equal(result.projectileHp,34);
},'survivors.html?trial&test').catch(error=>{console.error(error);process.exitCode=1;});
