const assert=require('node:assert/strict');
const fs=require('node:fs');
const {run,gameURL}=require('./survivor-test-utils.cjs');
run('looping 4500 world, event placement, timings and den spacing',async(page,browser)=>{
 const result=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();const size=s.worldSize;const shrine={...s.expedition.shrine};s.obstacles=[];
  const chests=s.expedition.chestClock,cache=s.relics.nextCache;
  s.player.x=size-3;s.player.y=size/2;s.cat.x=size-30;s.cat.y=s.player.y;
  const enemy=s.spawn('bat',10,s.player.y);const hp=enemy.hp;SurvivorWorld.sync(s);
  const near=enemy.x-s.player.x;s.move(s.player,10,0);SurvivorWorld.sync(s);const right=s.player.x;
  s.player.x=2;s.move(s.player,-10,0);SurvivorWorld.sync(s);const left=s.player.x;
  s.player.y=size-3;s.move(s.player,0,10);SurvivorWorld.sync(s);const bottom=s.player.y;
  s.player.y=2;s.move(s.player,0,-10);SurvivorWorld.sync(s);const top=s.player.y;
  s.player.x=size-4;s.player.y=2000;s.expansion.facing={x:1,y:0};s.expansion.dash();s.expansion.move(.35,1,0);const dash=s.player.x;
  s.obstacles=[{x:5,y:2000,r:20}];s.player.x=size-30;s.player.y=2000;const seamBlocked=s.blocked(size+5,2000,12);s.move(s.player,25,0);const seamCollision=s.player.x<size;
  s.obstacles=[];const stored=s.encounters.nests[0];stored.hp=17;const original={x:stored.x,y:stored.y};s.player.x=original.x+size;s.player.y=original.y;SurvivorWorld.sync(s);const persistent=stored.hp===17&&Math.abs(stored.x-s.player.x)<.001;
  s.start();s.obstacles=[];s.player.x=size-10;s.player.y=size-10;SurvivorWorld.sync(s);s.elapsed=60;s.expedition.chestClock=0;s.expedition.updateChests(0);s.relics.update(0);
  const chest=s.expedition.chests[0],guarded=s.relics.cache;
  const offscreen=SurvivorWorld.offscreen(s,chest,60)&&SurvivorWorld.offscreen(s,guarded,100);
  const interval=s.expedition.chestClock;guarded.guards=3;s.player.x=guarded.x;s.player.y=guarded.y;s.relics.update(0);const cacheDelay=s.relics.nextCache-s.elapsed;
  s.start();s.obstacles=[];s.catActive=false;s.player.fire=999;s.encounters.nests=[];
  const sizes=[];for(let i=0;i<3;i++){s.enemies.forEach(e=>e.sprite.setVisible(false));s.enemies=[];s.elapsed=s.creatures.swarmAt;s.creatures.update(0);sizes.push(s.run.events.filter(e=>e.type==='mouse_swarm').at(-1));}
  const denChecks=[];for(let seed=1;seed<=12;seed++){s.seed=seed;s.resetState();const d=s.greens.map.dens;denChecks.push(d.length===4&&d.every((a,i)=>d.slice(i+1).every(b=>SurvivorWorld.denApart(s,a,b))));}
  const different=JSON.stringify(s.expedition.shrine)!==JSON.stringify(shrine);
  s.start();s.player.x=size-60;s.player.y=size-60;s.elapsed=160;s.encounters.update(0);s.draw();
  return {seamBlocked,seamCollision,persistent,size,chests,cache,near,right,left,bottom,top,dash,hp,offscreen,interval,cacheDelay,sizes,denChecks,different};
 });
 assert(result.seamBlocked&&result.seamCollision&&result.persistent);assert.equal(result.size,4500);assert(result.chests>=40&&result.chests<=60);assert.equal(result.cache,60);assert.equal(result.near,13);assert.equal(result.right,4507);assert.equal(result.left,-8);assert.equal(result.bottom,4507);assert.equal(result.top,-8);assert(result.dash>4500);assert(result.offscreen);assert(result.interval>=40&&result.interval<=60);assert.equal(result.cacheDelay,90);assert.deepEqual(result.sizes.map(e=>e.requested),[6,7,8]);assert(result.denChecks.every(Boolean)&&result.different);
 fs.mkdirSync('output/looping-world',{recursive:true});await page.waitForTimeout(100);await page.screenshot({path:'output/looping-world/corner.png'});
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];mobile.on('pageerror',e=>errors.push(e.message));await mobile.addInitScript(()=>window.__vt_pending=true);await mobile.goto(gameURL('survivors.html?test'));await mobile.waitForFunction(()=>window.__phaserReady);
 const phone=await mobile.evaluate(()=>{const s=__survivorTest.scene;s.start();s.elapsed=150;s.expedition.update(0);const d=s.encounters.nests;const apart=d.every((a,i)=>d.slice(i+1).every(b=>SurvivorWorld.denApart(s,a,b)));s.player.x=-30;s.player.y=4505;SurvivorWorld.sync(s);s.expedition.chestClock=0;s.expedition.updateChests(0);s.relics.update(0);s.draw();return {apart,offscreen:SurvivorWorld.offscreen(s,s.expedition.chests[0],60)&&SurvivorWorld.offscreen(s,s.relics.cache,100)};});assert(phone.apart&&phone.offscreen);await mobile.waitForTimeout(100);await mobile.screenshot({path:'output/looping-world/phone.png'});assert.deepEqual(errors,[]);await mobile.goto(gameURL('survivors.html?test&field=desert'));await mobile.waitForFunction(()=>window.__phaserReady);
 const desert=await mobile.evaluate(()=>{const s=__survivorTest.scene;s.start();s.player.x=-100;s.player.y=9100;SurvivorWorld.sync(s);s.elapsed=150;s.expedition.update(0);s.relics.update(0);s.expedition.chestClock=0;s.expedition.updateChests(0);s.draw();return {size:s.worldSize,shrineClear:!s.blocked(s.expedition.shrine.x,s.expedition.shrine.y,130),dens:s.encounters.nests.every((a,i)=>s.encounters.nests.slice(i+1).every(b=>SurvivorWorld.denApart(s,a,b))),cache:SurvivorWorld.offscreen(s,s.relics.cache,100)};});assert(desert.size===4500&&desert.shrineClear&&desert.dens&&desert.cache);await mobile.waitForTimeout(100);await mobile.screenshot({path:'output/looping-world/desert.png'});assert.deepEqual(errors,[]);await mobile.close();console.log(result,phone,desert);
}).catch(e=>{console.error(e);process.exit(1)});
