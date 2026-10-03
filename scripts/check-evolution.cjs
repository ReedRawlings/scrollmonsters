const assert=require('node:assert/strict');
const {run,offscreenTexts,clickButton}=require('./survivor-test-utils.cjs');
const fs=require('node:fs');
// Merge cards draw their faces and text themselves, so they are clicked through the recorded layout (ui2x space x uiScale = canvas px).
async function clickMerge(page,id,{touch=false}={}){
 const r=await page.evaluate(id=>{const s=__survivorTest.scene,o=s.screens.layout.merge.options.find(v=>v.id===id),k=s.uiScale();return {x:(o.x+o.w/2)*k,y:(o.y+o.h/2)*k,w:s.scale.width,h:s.scale.height};},id);
 const c=await page.locator('canvas').boundingBox(),x=c.x+r.x*c.width/r.w,y=c.y+r.y*c.height/r.h;
 if(touch)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y,{delay:30});
}
fs.mkdirSync('output/evolution',{recursive:true});
run('Capture fusion, inheritance, combat, discovery and twenty-minute pacing',async (page,browser)=>{
 const result=await page.evaluate(()=>{
  const s=__survivorTest.scene,ev=()=>s.creatures.evolution;
  const reset=starter=>{s.starter=starter;s.start();s.juice.unlocks=[];s.obstacles=[];s.spawnTimer=s.player.fire=s.player.inv=9999;s.creatures.swarmAt=s.expedition.chestClock=s.relics.nextCache=9999;s.expedition.second=true;s.expedition.eliteSpawned=s.expedition.extraEliteSpawned=true;s.encounters.nests.forEach(n=>n.clock=9999);};
  const capture=(type,stage=0)=>{s.expedition.release(type,s.player.x,s.player.y,false,stage);const b=s.expedition.captureBody(type);b.progress=2.49;s.expedition.capture(b,type,.02);return b;};
  const target=(dx=60,dy=0)=>{const e=s.spawn('beast',s.player.x+dx,s.player.y+dy);Object.assign(e,{hp:1000,maxHp:1000,speed:0,clock:9999,r:10});return e;};
  const merges=[];
  for(const r of SurvivorEvolution.recipes)for(const reverse of [false,true]){
   const [starter,captured]=reverse?[...r.parents].reverse():r.parents;reset(starter);s.upgrades.partyDamage=2;s.upgrades.sweep=2;s.upgrades.bubble=1;s.upgrades.feather=1;s.upgrades.fireLife=2;
   capture(captured);const paused=s.mode==='merge',before=s.elapsed;s.tick(1);const frozen=s.elapsed===before,preview=ev().preview();
   const success=ev().choose(r.id),party=s.expedition.party(),maxHp=s.maxHp,again=ev().choose(r.id),body=s.creatures.allies[r.id];
   merges.push({id:r.id,reverse,paused,frozen,preview:preview.options.map(v=>v.id),success,party,maxHp,again,shared:s.upgrades.partyDamage,inherited:body.inherited,dash:s.creatures.elements.dashStyle});
  }
  reset('cat');s.expedition.release('frog',s.player.x,s.player.y,true);s.expedition.release('bear',s.player.x,s.player.y,true);capture('mollusc',2);const multi=ev().preview();const noRecruit=ev().choose('recruit');ev().choose('octopus');const fullParty=s.expedition.party();
  capture('owl',3);const noRecipe=ev().preview();ev().choose('leave');const afterLeave=s.expedition.party();
  reset('cat');capture('mollusc');ev().choose('recruit');const recruit=s.expedition.party();
  reset('cat');capture('mollusc');ev().choose('octopus');const a=s.creatures.allies.octopus;Object.assign(a,{x:s.player.x,y:s.player.y,attack:999});const e=target(70);const back=target(-70);ev().sweep(a,0);const forward=1000-e.hp,rearBefore=1000-back.hp;s.grantUpgrade('octoRear');ev().sweep(a,0);const rearAfter=1000-back.hp;ev().update(.01);const inked=e.inkUntil>s.elapsed,slow=e.slowUntil>s.elapsed;
  const life=ev().zones[0].life;s.mode='paused';s.tick(1);const pauseZones=ev().zones[0].life===life;s.mode='playing';
  reset('salamander');s.upgrades.slam=1;s.upgrades.fireLife=2;s.upgrades.beastSpeed=1;capture('beast');ev().choose('reptile');const r=s.creatures.allies.reptile;Object.assign(r,{x:s.player.x,y:s.player.y,attack:0});const re=target(100);for(let i=0;i<90;i++)ev().update(1/60);const reptile={damage:1000-re.hp,fire:ev().zones.some(z=>z.type==='fire'),stats:ev().stats('reptile')};
  reset('owl');s.upgrades.feather=1;s.upgrades.marks=1;s.upgrades.stormStrike=1;capture('storm');ev().choose('tengu');const te=target(80),te2=target(130,20);const t=s.creatures.allies.tengu;Object.assign(t,{x:s.player.x,y:s.player.y,attack:0});for(let i=0;i<60;i++)ev().update(1/60);const tengu={damage:1000-te.hp,chain:1000-te2.hp,marked:te.markUntil>s.elapsed,stats:ev().stats('tengu')};
  reset('frog');s.upgrades.bubble=2;s.upgrades.chorus=1;capture('mollusc');ev().choose('axolotl');const ax=s.creatures.allies.axolotl;ax.pulseClock=0;ev().update(.01);const shield=s.shield;s.player.inv=0;s.grantUpgrade('axoHaste');s.encounters.damage(10,'test');const axolotl={shield,blocked:!s.shield,zones:ev().zones.length,haste:ev().haste,frog:s.frogStats(),hp:s.maxHp,rate:s.attackRate()};
  reset('cat');s.elapsed=570;s.encounters.updateBoss(0);const first=s.encounters.boss;const bossInterval=s.spawnInterval();s.hit(first,100000,'player',s.player);s.elapsed=600;s.tick(.01);const continued=s.mode!=='won';s.mode='playing';s.elapsed=650;const resumedInterval=s.spawnInterval();s.elapsed=1140;s.encounters.updateBoss(0);const final=s.encounters.boss;s.hit(final,100000,'player',s.player);s.tick(.01);const won=s.mode==='won';
  reset('cat');s.elapsed=330;s.encounters.nests.forEach(n=>n.destroyed=true);s.expedition.updateLaterDens();const later=s.encounters.nests.filter(n=>n.stage===2).map(n=>n.type);const known=ev().discovered;
  // Leave a real two-option capture selector for screenshot and pointer testing.
  reset('cat');s.expedition.release('frog',s.player.x+40,s.player.y,true);capture('mollusc');s.draw();
  return {merges,multi,noRecruit,fullParty,noRecipe,afterLeave,recruit,forward,rearBefore,rearAfter,inked,slow,pauseZones,reptile,tengu,axolotl,bossInterval,resumedInterval,continued,won,firstFinal:!!first.final,finalFinal:final.final,later,known};
 });
 for(const m of result.merges){assert(m.paused&&m.frozen&&m.success&&!m.again);assert.deepEqual(m.party,[m.id]);assert(m.maxHp>400);assert.equal(m.shared,2);assert.equal(m.dash,m.id);assert(m.preview.includes(m.id));}
 assert.deepEqual(result.multi.options.map(o=>o.id),['octopus','axolotl']);assert.equal(result.noRecruit,false);assert.equal(result.fullParty.length,3);assert.deepEqual(result.afterLeave,result.fullParty);assert.equal(result.noRecipe.options.length,0);assert.deepEqual(result.recruit,['cat','mollusc']);
 assert(result.forward>0&&result.rearBefore===0&&result.rearAfter>0&&result.inked&&result.slow&&result.pauseZones);
 assert(result.reptile.damage>0&&result.reptile.fire&&result.reptile.stats.slam);assert(result.tengu.damage>0&&result.tengu.chain>0&&result.tengu.marked);
 assert(result.axolotl.shield&&result.axolotl.blocked&&result.axolotl.zones>0&&result.axolotl.haste>0&&result.axolotl.frog.active);assert(result.axolotl.frog.damageBonus===10);
 assert(result.continued&&result.won&&!result.firstFinal&&result.finalFinal);assert(result.bossInterval>=result.resumedInterval*5);assert(result.later.some(t=>['mollusc','spider'].includes(t)));assert.equal(result.known.length,12);
 await page.waitForTimeout(500);await page.screenshot({path:'output/evolution/merge-desktop.png'});assert.deepEqual(await offscreenTexts(page),[]);
 // Use actual pointer coordinates through the recorded logical layout.
 await clickMerge(page,'octopus');assert(await page.evaluate(()=>__survivorTest.scene.expedition.party().includes('octopus')));
 await page.evaluate(()=>{const s=__survivorTest.scene;s.juice.unlocks=[];s.mode='playing';s.draw();});await page.screenshot({path:'output/evolution/merged-desktop.png'});
 await page.setViewportSize({width:540,height:960});await page.reload();await page.waitForFunction(()=>window.__phaserReady);
 await page.evaluate(()=>{const s=__survivorTest.scene;s.starter='cat';s.start();s.expedition.release('frog',s.player.x+50,s.player.y,true);s.expedition.release('mollusc',s.player.x,s.player.y,false,0);const b=s.expedition.captureBody('mollusc');b.progress=2.5;s.expedition.capture(b,'mollusc',0);s.draw();});await page.waitForTimeout(450);await page.screenshot({path:'output/evolution/merge-phone.png'});assert.deepEqual(await offscreenTexts(page),[]);
 // Every result is reachable through real capture, uses its own art, and leaves visible attack effects.
 await page.setViewportSize({width:1100,height:760});await page.reload();await page.waitForFunction(()=>window.__phaserReady);
 for(const id of ['octopus','reptile','tengu','axolotl']){
  const summary=await page.evaluate(id=>{
   const s=__survivorTest.scene,r=SurvivorEvolution.recipes.find(r=>r.id===id);s.starter=r.parents[0];s.start();s.obstacles=[];s.spawnTimer=s.player.fire=s.player.inv=9999;s.encounters.nests.forEach(n=>n.clock=9999);
   s.expedition.release(r.parents[1],s.player.x,s.player.y,false,0);const captured=s.expedition.captureBody(r.parents[1]);captured.progress=2.5;s.expedition.capture(captured,r.parents[1],0);s.creatures.evolution.choose(id);s.juice.unlocks=[];
   const ev=s.creatures.evolution,a=s.creatures.allies[id];Object.assign(a,{x:s.player.x,y:s.player.y+35,attack:0,pulseClock:0});
   for(const [x,y] of [[90,35],[145,45],[130,100],[-80,35]]){const e=s.spawn('bat',s.player.x+x,s.player.y+y);e.hp=e.maxHp=1000;e.speed=0;}
   const upgrades=ev.upgrades().map(c=>c.id);for(const key of upgrades)s.grantUpgrade(key);
   const st=ev.stats(id);if(id==='octopus')ev.sweep(a,0);if(id==='reptile'){ev.charge(a,s.enemies[0]);for(let i=0;i<35;i++)ev.update(1/60);}
   if(id==='tengu'){ev.feather(a,s.enemies[0],st);for(let i=0;i<13;i++)ev.update(1/60);}
   if(id==='axolotl'){ev.update(.01);s.player.inv=0;s.encounters.damage(1,'test');}
   // A real evolved dash must retain its source and affect the world.
   s.expansion.cooldown=0;s.expansion.dash({x:1,y:0});s.expansion.move(.2,1,0);s.draw();
   return {type:id,texture:a.sprite.texture.key,upgrades,damage:s.creatures.damage[id],zones:ev.zones.length,dash:ev.s.dashStyle,party:s.expedition.party(),mode:s.mode};
  },id);
  assert.equal(summary.texture,id);assert.equal(summary.upgrades.length,3);assert(summary.damage>0);await page.waitForTimeout(80);await page.screenshot({path:'output/evolution/ability-'+id+'.png'});
 }
 const saved=await page.evaluate(()=>{const s=__survivorTest.scene;const before=s.creatures.evolution.discovered;s.start();return {before,after:s.creatures.evolution.discovered,hp:s.maxHp,pending:s.creatures.evolution.pending,zones:s.creatures.evolution.zones.length};});assert.deepEqual(saved.before,saved.after);assert.equal(saved.hp,400);assert.equal(saved.zones,0);assert.equal(saved.pending,null);
 // Native touch input and the compact desktop setting both use the same guarded transaction.
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await mobile.addInitScript(()=>window.__vt_pending=true);
 await mobile.goto(require('./survivor-test-utils.cjs').gameURL('survivors.html?test'));await mobile.waitForFunction(()=>window.__phaserReady);
 await mobile.evaluate(()=>{const s=__survivorTest.scene;s.start();s.expedition.release('mollusc',s.player.x,s.player.y,false,0);const b=s.expedition.captureBody('mollusc');b.progress=2.5;s.expedition.capture(b,'mollusc',0);s.draw();});await mobile.waitForTimeout(420);await clickMerge(mobile,'octopus',{touch:true});assert(await mobile.evaluate(()=>__survivorTest.scene.expedition.party().includes('octopus')));assert.equal(await mobile.evaluate(()=>__survivorTest.scene.joy),null);await mobile.close();
 await page.evaluate(()=>{const s=__survivorTest.scene;s.starter='cat';s.start();s.juice.setUiLarge(true);s.expedition.release('frog',s.player.x+30,s.player.y,true);s.expedition.release('mollusc',s.player.x,s.player.y,false,0);const b=s.expedition.captureBody('mollusc');b.progress=2.5;s.expedition.capture(b,'mollusc',0);s.draw();});await page.waitForTimeout(420);assert.deepEqual(await offscreenTexts(page),[]);await page.screenshot({path:'output/evolution/merge-large-ui.png'});await page.keyboard.press('2');assert(await page.evaluate(()=>__survivorTest.scene.expedition.party().includes('axolotl')));
 console.log('Verified 24 recipe orders, full-party and alternate choices, inheritance, four attacks and dashes, desktop/phone/large UI, persistence, reset and boss pacing.');
});
