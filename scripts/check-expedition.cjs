const assert=require('node:assert/strict');
const {run,clickButton,gameURL}=require('./survivor-test-utils.cjs');
run('ten-minute expedition, party progression, support, shrine, finale and mobile entry',async(page,browser)=>{
 const capture=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.nestDeckOverride=['owl','beast','cat','mouse','mole','bear'];s.start();s.spawnTimer=999;s.player.inv=999;s.obstacles=[];
  s.elapsed=30;s.encounters.update(0);const first=s.encounters.nests[0];s.hit(first,999,'player',s.player);Object.assign(s.player,{x:first.x,y:first.y});advanceTime(2600);const party1=s.expedition.party();
  s.elapsed=150;s.expedition.update(0);const options=s.encounters.nests.filter(n=>n.stage===1).map(n=>n.type),frog=s.encounters.nests.find(n=>n.stage===1&&n.type==='frog');s.hit(frog,999,'player',s.player);Object.assign(s.player,{x:frog.x,y:frog.y});advanceTime(2600);
  const other=s.encounters.nests.find(n=>n.stage===1&&n!==frog);s.hit(other,999,'player',s.player);s.upgrades.chorus=1;s.expedition.frog.pulseClock=0;s.expedition.update(.02);const shield=s.shield,haste=s.chorusTime;s.player.inv=0;const hp=s.player.hp;s.encounters.damage(8,'test');
  return {duration:s.snapshot().duration,party1,options,party:s.expedition.party(),shield,haste,blocked:s.player.hp===hp&&!s.shield};
 });
 assert.equal(capture.duration,600);assert.deepEqual(capture.party1,['cat','owl']);assert.deepEqual(capture.options,['frog','beast']);assert.deepEqual(capture.party,['cat','owl','frog']);assert(capture.shield&&capture.blocked&&capture.haste>0);
 await page.reload();await page.waitForFunction(()=>window.__phaserReady);
 const starter=await page.evaluate(()=>{const s=__survivorTest.scene;const saved=s.unlocked;s.starter='owl';s.start();return {saved,party:s.expedition.party(),cat:s.catActive,pool:s.upgradePool().map(u=>u.id)};});assert(starter.saved.includes('owl')&&starter.saved.includes('frog'));assert.deepEqual(starter.party,['owl']);assert(!starter.cat&&!starter.pool.includes('claws'));
 const marks=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.starter='cat';s.start();s.obstacles=[];s.spawnTimer=999;s.player.fire=999;s.cat.attack=999;s.upgrades.marks=1;
  s.expedition.release('owl',s.player.x,s.player.y,true);const e=s.spawn('beast',s.player.x+80,s.player.y);Object.assign(e,{hp:100,maxHp:100,speed:0,clock:999});advanceTime(300);
  const applied=e.markUntil>s.elapsed,remaining=e.markUntil-s.elapsed,hp=e.hp;s.hit(e,4,'cat',s.cat);const boosted=hp-e.hp,beforeOwl=e.hp;s.hit(e,4,'owl',s.owl);const owl=e.hp-beforeOwl;
  s.elapsed=e.markUntil+.01;const beforeExpired=e.hp;s.hit(e,4,'cat',s.cat);return {applied,remaining,boosted,owl:Math.abs(owl),expired:beforeExpired-e.hp};
 });assert(marks.applied&&marks.remaining>2.5&&marks.remaining<=3);assert.equal(marks.boosted,5);assert.equal(marks.owl,4);assert.equal(marks.expired,4);
 const shrine=await page.evaluate(()=>{const s=__survivorTest.scene;s.starter='cat';s.start();s.elapsed=90;s.player.hp=15;const sh=s.expedition.shrine;Object.assign(s.player,{x:sh.x,y:sh.y});for(let i=0;i<361;i++)s.expedition.updateShrine(1/60);const elite=s.enemies.find(e=>e.shrineTier);const locked=sh.inCombat;s.hit(elite,999,'player',s.player);return {locked,completed:sh.completed,hp:s.player.hp,rewards:s.relics.queue.length,events:s.run.events.filter(e=>e.type==='shrine_completed').length};});assert(shrine.locked);assert.equal(shrine.completed,1);assert.equal(shrine.hp,27);assert.equal(shrine.rewards,1);assert.equal(shrine.events,1);
 const timeline=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.player.inv=999;s.player.fire=999;s.cat.attack=999;s.expedition.chestClock=999;let atFive;
  // Keep scheduling active without combat/XP interference; remove targets after each tick.
  for(let i=0;i<36001;i++){
   for(const e of s.enemies)e.sprite.setVisible(false);s.enemies=[];for(const p of s.pickups)p.sprite.setVisible(false);s.pickups=[];
   if(s.mode==='upgrade')s.chooseUpgrade(0);if(s.mode==='pack')s.packs.close();if(s.mode==='relic')s.relics.skip();s.tick(1/60);
   if(i===18000)atFive={time:s.elapsed,boss:!!s.encounters.boss,mode:s.mode};
  }
  const finale={time:s.elapsed,bossHp:s.encounters.boss.hp,phase:s.expedition.phase,mode:s.mode,elite:s.expedition.eliteSpawned};
  for(const n of s.encounters.nests)n.destroyed=true;const spawned=s.spawned;s.tick(1);const wavesStop=s.spawned===spawned;s.hit(s.encounters.boss,99999,'player',s.player);s.tick(1/60);
  return {atFive,finale,wavesStop,outcome:s.mode,phases:s.run.events.filter(e=>e.type==='encounter_phase').length};
 });
 assert(timeline.atFive.time>=300);assert(!timeline.atFive.boss);assert.equal(timeline.atFive.mode,'playing');assert(timeline.finale.time>=600);assert.equal(timeline.finale.bossHp,1200);assert.equal(timeline.finale.phase,9);assert(timeline.finale.elite&&timeline.wavesStop);assert.equal(timeline.outcome,'won');assert.equal(timeline.phases,10);
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await mobile.addInitScript(()=>window.__vt_pending=true);await mobile.goto(gameURL('survivors.html?test'));await mobile.waitForFunction(()=>window.__phaserReady);await clickButton(mobile,'BEGIN',{touch:true});assert.equal(await mobile.evaluate(()=>__survivorTest.scene.mode),'playing');
 await mobile.evaluate(()=>{localStorage.removeItem('scrollmonsters-starters-v1');localStorage.setItem('scrollmonsters-survivor-runs-v1',JSON.stringify([{summary:{owl:'ally',encounters:{beast:'ally'}},events:[]}]));});await mobile.reload();await mobile.waitForFunction(()=>window.__phaserReady);const migrated=await mobile.evaluate(()=>__survivorTest.scene.unlocked);assert(migrated.includes('owl')&&migrated.includes('beast'));await mobile.close();
}).catch(error=>{console.error(error);process.exitCode=1;});
