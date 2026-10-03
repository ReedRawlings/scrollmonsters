const assert=require('node:assert/strict'),fs=require('node:fs');
const {run,clickButton,offscreenTexts}=require('./survivor-test-utils.cjs');
fs.mkdirSync('output/evolution-roster',{recursive:true});
run('Twelve bases, twelve recipes, inherited combat, dashes and paged bestiary',async(page,browser)=>{
 const data=await page.evaluate(()=>{
  const s=__survivorTest.scene,recipes=SurvivorEvolution.recipes,newRecipes=SurvivorEvolutionRoster.recipes;
  const reset=starter=>{s.starter=starter;s.start();s.obstacles=[];s.juice.enabled=false;s.juice.unlocks=[];s.player.inv=s.player.fire=s.spawnTimer=9999;};
  const enemies=()=>{for(let i=0;i<5;i++){const e=s.spawn('beast',s.player.x+50+i*22,s.player.y+(i%2)*15);Object.assign(e,{hp:10000,maxHp:10000,speed:0,clock:9999});}};
  const outcomes=[];
  for(const r of newRecipes)for(const reverse of [false,true]){
   const [partner,captured]=reverse?[...r.parents].reverse():r.parents;reset(partner);const keys=r.parents.flatMap(t=>SurvivorEvolution.parentUpgrades[t]);for(const k of keys)s.upgrades[k]=1;
   s.expedition.release(captured,s.player.x,s.player.y,false);const b=s.expedition.captureBody(captured);b.progress=2.5;s.expedition.capture(b,captured,0);const ev=s.creatures.evolution;ev.choose(r.id);s.juice.enabled=true;
   const a=s.creatures.allies[r.id];Object.assign(a,{x:s.player.x,y:s.player.y,attack:0,pulseClock:0});enemies();
   const inherited=keys.every(k=>a.inherited[k]===1&&s.upgrades[k]===0);
   for(let i=0;i<240;i++){s.elapsed+=1/60;ev.update(1/60);}s.draw();
   const stats=ev.stats(r.id),finite=Object.values(stats).every(v=>typeof v!=='number'||Number.isFinite(v));
   const damage=Object.values(s.enemies).reduce((n,e)=>n+10000-e.hp,0),before=JSON.stringify({r:ev.roster.summary(),hp:s.player.hp,rng:s.rng});for(let i=0;i<20;i++)s.evoFx.draw();const pure=before===JSON.stringify({r:ev.roster.summary(),hp:s.player.hp,rng:s.rng});
   const dashBefore=JSON.stringify({state:ev.roster.summary(),hp:s.enemies.map(e=>e.hp),shield:s.shield});ev.dashEnd({x:s.player.x-40,y:s.player.y,style:r.id});for(let i=0;i<30;i++){s.elapsed+=1/60;ev.update(1/60);}const dashAfter=JSON.stringify({state:ev.roster.summary(),hp:s.enemies.map(e=>e.hp),shield:s.shield});
   outcomes.push({id:r.id,reverse,inherited,finite,damage,pure,hp:s.maxHp,dash:s.creatures.elements.dashStyle,dashChanged:dashBefore!==dashAfter,party:s.expedition.party(),upgrades:ev.upgrades().map(u=>u.id),support:s.frogStats().active});
  }
  reset('bamboo');enemies();for(let i=0;i<90;i++){s.elapsed+=1/60;s.creatures.evolution.update(1/60);}const bamboo={fields:s.creatures.evolution.roster.fields.length,damage:s.creatures.damage.bamboo};
  // Every new combat family must have identical state with presentation disabled.
  const replay=enabled=>{reset('cat');s.juice.enabled=enabled;for(const r of newRecipes){s.expedition.release(r.id,s.player.x,s.player.y,true);s.creatures.allies[r.id].inherited={};s.creatures.allies[r.id].attack=0;}enemies();for(let i=0;i<300;i++){s.elapsed+=1/60;s.creatures.evolution.update(1/60);s.draw();}return JSON.stringify({hp:s.enemies.map(e=>e.hp),state:s.creatures.evolution.roster.summary(),rng:s.rng});};
  const deterministic=replay(true)===replay(false);
  const upgraded=[];for(const r of newRecipes){reset('cat');s.catActive=false;s.expedition.release(r.id,s.player.x,s.player.y,true);const ev=s.creatures.evolution,a=s.creatures.allies[r.id];a.inherited={};a.attack=0;enemies();for(const [id,,,cap] of SurvivorEvolutionRoster.upgrades[r.id])for(let n=0;n<cap;n++)s.grantUpgrade(id);for(let i=0;i<300;i++){s.elapsed+=1/60;ev.update(1/60);}s.juice.enabled=true;s.draw();upgraded.push({id:r.id,damage:s.creatures.damage[r.id],offered:ev.upgrades().length,fields:ev.roster.fields.length,missiles:ev.roster.missiles.length,blasts:ev.roster.blasts.length});}

  reset('frog');s.expedition.release('heartbloom',s.player.x,s.player.y,true);const ev=s.creatures.evolution,a=s.creatures.allies.heartbloom;a.inherited={};enemies();ev.roster.attack(a,'heartbloom',s.enemies[0]);const p=ev.roster.missiles[0];s.encounters.shoot(p,0,10,'test');const bullet=s.encounters.bullets.at(-1);ev.roster.update(.001);const intercept=bullet.life===0;
  reset('bamboo');s.juice.enabled=true;s.mode='paused';const frozen=JSON.stringify(s.creatures.evolution.roster.summary());s.tick(1);const freeze=frozen===JSON.stringify(s.creatures.evolution.roster.summary());s.start();const clean=s.creatures.evolution.roster.summary();
  return {upgraded,base:SurvivorExpansion.roster.map(([id])=>id),recipes:recipes.map(r=>({id:r.id,parents:r.parents})),outcomes,bamboo,deterministic,intercept,freeze,clean};
 });
 assert.equal(data.base.length,12);assert.equal(data.recipes.length,12);for(const id of data.base)assert.equal(data.recipes.filter(r=>r.parents.includes(id)).length,2,id+' has exactly two branches');
 for(const o of data.outcomes){assert(o.inherited&&o.finite&&o.pure&&o.dashChanged,JSON.stringify(o));assert(o.damage>0,o.id+' attacks');assert.deepEqual(o.party,[o.id]);assert.equal(o.dash,o.id);assert.equal(o.upgrades.length,3);assert(o.hp>400);if(o.id==='heartbloom')assert(o.support);}
 for(const u of data.upgraded){assert(u.damage>0,u.id+' upgraded attacks');assert.equal(u.offered,0,u.id+' respects caps');assert(u.fields<=8&&u.missiles<=40&&u.blasts<=40,u.id+' bounded effects');}
 assert(data.bamboo.fields>0&&data.bamboo.damage>0);assert(data.deterministic);assert(data.intercept);assert(data.freeze);assert.deepEqual(data.clean,{fields:[],blasts:0,missiles:0});
 // Inspect every bestiary page on desktop and touch portrait, with all recipes discovered.
 const setup=()=>{const s=__survivorTest.scene;s.juice.enabled=true;s.juice.reduced=true;s.unlocked=SurvivorExpansion.roster.map(([id])=>id);s.creatures.evolution.discovered=SurvivorEvolution.evolved.slice();s.mode='title';s.screens.bpage=0;s.bestiaryOpen=true;s.draw();};
 await page.evaluate(setup);
 for(let i=0;i<3;i++){assert.deepEqual(await offscreenTexts(page),[]);await page.screenshot({path:`output/evolution-roster/bestiary-desktop-${i}.png`});await clickButton(page,'>');}
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];phone.on('pageerror',e=>errors.push(e.message));phone.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await phone.addInitScript(()=>window.__vt_pending=true);await phone.goto(page.url());await phone.waitForFunction(()=>window.__phaserReady);await phone.evaluate(setup);
 for(let i=0;i<4;i++){for(const id of data.recipes.slice(i*3,i*3+3).map(r=>r.id)){await phone.evaluate(id=>{const s=__survivorTest.scene;s.screens.bsel={kind:'evo',id};s.draw();},id);assert.deepEqual(await offscreenTexts(phone),[],id+' detail fits phone');}assert.deepEqual(await offscreenTexts(phone),[]);await phone.screenshot({path:`output/evolution-roster/bestiary-phone-${i}.png`});await clickButton(phone,'>',{touch:true});}
 // Each new form gets an actual combat screenshot, beyond the selection UI.
 for(const id of data.recipes.slice(4).map(r=>r.id)){
  await page.evaluate(id=>{const s=__survivorTest.scene;s.starter='cat';s.start();s.catActive=false;s.obstacles=[];s.juice.irisAt=null;s.juice.reduced=false;s.expedition.release(id,s.player.x,s.player.y,true);const a=s.creatures.allies[id];a.inherited={};a.attack=0;for(let i=0;i<6;i++){const e=s.spawn('beast',s.player.x+50+i*17,s.player.y+(i%2)*25);e.hp=1000;e.maxHp=1000;}for(let i=0;i<65;i++){s.elapsed+=1/60;s.creatures.evolution.update(1/60);}s.draw();},id);
  await page.screenshot({path:`output/evolution-roster/ability-${id}.png`});
 }
 assert.deepEqual(errors,[]);await phone.close();console.log('PASS: all eight new forms, both recipe orders, two paths per base, inherited ranks, combat, dashes, presentation determinism, guardian interception and all desktop/portrait bestiary pages');
});
