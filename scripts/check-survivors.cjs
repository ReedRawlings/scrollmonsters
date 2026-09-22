const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 const errors=[];
 try{
 const page=await browser.newPage({viewport:{width:1100,height:760}});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{window.__vt_pending=true;localStorage.setItem('scollmonsters-save-v2','campaign-sentinel');});
 await page.goto('http://localhost:5174/survivors.html?trial&test');await page.waitForFunction(()=>window.__phaserReady,{timeout:15000});
 fs.mkdirSync('output/survivors',{recursive:true});
 await page.screenshot({path:'output/survivors/title.png'});
 await page.keyboard.press('Enter');await page.waitForFunction(()=>__survivorTest.scene.mode==='playing');await page.keyboard.down('ArrowRight');await page.evaluate(()=>advanceTime(1000));await page.keyboard.up('ArrowRight');
 const moved=await page.evaluate(()=>JSON.parse(render_game_to_text()));assert.equal(moved.player.x,978);assert(moved.cat.x>800);
 await page.waitForTimeout(100);await page.keyboard.down('p');await page.waitForTimeout(100);await page.keyboard.up('p');await page.waitForFunction(()=>__survivorTest.scene.mode==='paused');const paused=await page.evaluate(()=>{advanceTime(1500);return JSON.parse(render_game_to_text());});assert.equal(paused.mode,'paused');assert.equal(paused.elapsed,1);await page.keyboard.press('p');
 const combat=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;
  s.spawn('bat',s.cat.x+70,s.cat.y);advanceTime(1000);
  return {cat:s.catDamage,kills:s.kills,player:s.playerDamage};
 });assert(combat.cat>0);assert(combat.kills>0);
 const obstacle=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;s.player.x=510;s.player.y=650;s.cat.x=470;s.cat.y=650;s.trail=[{x:470,y:650},{x:510,y:650}];
  s.keys.D.isDown=true;advanceTime(1000);s.keys.D.isDown=false;return {x:s.player.x,catGap:Math.hypot(s.cat.x-s.player.x,s.cat.y-s.player.y)};
 });assert(obstacle.x<=526.01);assert(obstacle.catGap<100);
 const charge=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;s.player.fire=999;s.cat.attack=999;
  const e=s.spawn('beast',1000,800);e.clock=0;advanceTime(20);const windup=e.phase;advanceTime(820);const charging=e.phase;
  advanceTime(800);return {windup,charging,hp:s.player.hp};
 });assert.equal(charge.windup,'windup');assert.equal(charge.charging,'charge');assert(charge.hp<40);
 const endings=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;s.owlAppeared=true;s.encounters.bossAppeared=true;s.encounters.boss={hp:0};s.elapsed=119.9;advanceTime(200);const win=s.mode;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;s.player.hp=1;s.player.fire=999;s.cat.attack=999;s.spawn('bat',800,800);advanceTime(20);const lose=s.mode;s.start();s.encounters.nests.forEach(n=>n.clock=999);return {win,lose,hp:s.player.hp,elapsed:s.elapsed,enemies:s.enemies.length,save:localStorage.getItem('scollmonsters-save-v2')};
 });assert.deepEqual(endings,{win:'won',lose:'lost',hp:40,elapsed:0,enemies:0,save:'campaign-sentinel'});
 const progression=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;
  for(let i=0;i<10;i++)s.hit(s.spawn('bat',800,800),99,'player',s.player);
  const drops=s.pickups.filter(e=>e.type==='xp').length;advanceTime(20);
  const mode=s.mode,choices=s.choices.length,noOwl=s.upgradePool().every(c=>c.id!=='feather'),time=s.elapsed;advanceTime(2000);const frozen=s.elapsed===time;
  s.chooseUpgrade(0);const applied=Object.values(s.upgrades).reduce((a,b)=>a+b,0);
  s.summonOwl();s.owl.state='ally';const owlEligible=s.upgradePool().some(c=>c.id==='feather');
  s.choices=[{id:'hide'}];s.mode='upgrade';s.chooseUpgrade(0);const hp=s.player.hp,maxHp=s.maxHp;
  s.elapsed=59.99;const e=s.spawn('bat',1100,800);advanceTime(20);const scaled={hp:e.maxHp,speed:e.speed};advanceTime(20);const once=e.maxHp;
  const fresh=s.spawn('bat',1100,800).maxHp;s.start();s.encounters.nests.forEach(n=>n.clock=999);return {drops,mode,choices,noOwl,frozen,applied,owlEligible,hp,maxHp,scaled,once,fresh,reset:s.level===1&&s.xp===0&&s.maxHp===40&&!s.stronger};
 });assert.equal(progression.drops,10);assert.equal(progression.mode,'upgrade');assert.equal(progression.choices,3);assert(progression.noOwl&&progression.frozen&&progression.owlEligible&&progression.reset);assert.equal(progression.applied,1);assert(progression.hp>=48&&progression.maxHp>=48);assert.equal(progression.scaled.hp,4.8);assert.equal(progression.scaled.speed,68*1.08);assert.equal(progression.once,4.8);assert.equal(progression.fresh,4.8);
 await page.evaluate(()=>{const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.xp=10;s.checkLevel();s.draw();});await page.waitForTimeout(100);await page.screenshot({path:'output/survivors/upgrade.png'});
 await page.keyboard.down('1');await page.waitForTimeout(80);await page.keyboard.up('1');await page.waitForFunction(()=>__survivorTest.scene.mode==='playing');
 console.log('PASS: XP drops/collection, 3 choices, combat freeze, keyboard choice, upgrade application, Owl eligibility, 60s existing/new enemy scaling, reset.');
 const naturalCapture=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;s.summonOwl();s.owl.x=880;s.owl.y=800;
  advanceTime(6000);const weakened=s.owl.state==='ready';s.player.x=s.owl.x;s.player.y=s.owl.y;advanceTime(2600);
  return {weakened,recruited:s.owl.state==='ally'};
 });assert(naturalCapture.weakened&&naturalCapture.recruited);
 const capture=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;s.elapsed=24.99;s.summonOwl();advanceTime(20);
  const appeared=s.owl?.state;s.player.fire=999;s.cat.attack=999;
  s.hit(s.owl,100,'player',s.player);const ready=s.owl.state;
  s.player.x=s.owl.x;s.player.y=s.owl.y;advanceTime(1000);const progress=s.owl.progress;
  s.pause();advanceTime(1000);const frozen=s.owl.progress;s.pause();
  s.player.x-=150;advanceTime(600);const decayed=s.owl.progress;
  s.player.x=s.owl.x;s.player.y=s.owl.y;advanceTime(2600);const ally=s.owl.state;
  s.enemies.forEach(e=>e.sprite.setVisible(false));s.enemies=[];
  s.player.x=800;s.player.y=800;s.owl.x=800;s.owl.y=800;s.owl.attack=0;
  s.spawn('bat',900,800);s.spawn('bat',945,800);advanceTime(450);
  return {appeared,ready,progress,frozen,decayed,ally,damage:s.owlDamage,kills:s.kills};
 });assert.equal(capture.appeared,'wild');assert.equal(capture.ready,'ready');assert(capture.progress>.9);assert.equal(capture.frozen,capture.progress);assert.equal(capture.decayed,0);assert.equal(capture.ally,'ally');assert(capture.damage>=8);assert.equal(capture.kills,2);
 const powerups=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;s.player.hp=38;s.drop('heal',800,800);advanceTime(20);const healed=s.player.hp;
  s.drop('haste',800,800);s.drop('shield',800,800);advanceTime(20);const haste=s.haste,shield=s.shield;
  s.player.fire=999;s.cat.attack=999;s.spawn('bat',800,800);advanceTime(20);const blocked=s.player.hp,consumed=!s.shield;
  advanceTime(1000);const damaged=s.player.hp<40;
  s.enemies.forEach(e=>e.sprite.setVisible(false));s.enemies=[];advanceTime(12000);const expired=s.haste;
  s.start();s.encounters.nests.forEach(n=>n.clock=999);return {healed,haste,shield,blocked,consumed,damaged,expired,reset:s.owl===null&&!s.shield&&s.haste===0&&s.pickups.length===0};
 });assert.equal(powerups.healed,40);assert.equal(powerups.haste,12);assert(powerups.shield);assert.equal(powerups.blocked,40);assert(powerups.consumed&&powerups.damaged&&powerups.reset);assert.equal(powerups.expired,0);
 await page.evaluate(()=>{const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;s.summonOwl();s.hit(s.owl,99,'player',s.player);s.owl.x=900;s.owl.y=800;s.player.x=865;s.cat.x=825;s.owl.progress=1.4;s.drop('heal',700,740);s.drop('haste',800,680);s.drop('shield',900,690);s.noticeTime=0;s.draw();});
 await page.waitForTimeout(100);await page.screenshot({path:'output/survivors/capture.png'});
 console.log('PASS: 40 HP, wild Owl spawn/weaken/capture, capture pause/decay, piercing ally damage, heal cap, frenzy expiry, shield hit, restart clears new state.');
 await page.evaluate(()=>{const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;for(let i=0;i<16;i++){const a=i*Math.PI/8;s.spawn(i%4?'bat':'beast',800+Math.cos(a)*220,800+Math.sin(a)*180);}advanceTime(500);});
 await page.waitForTimeout(150);await page.screenshot({path:'output/survivors/combat.png'});
 await page.keyboard.press('Escape');await page.screenshot({path:'output/survivors/paused.png'});
 assert.deepEqual(errors,[]);
 console.log('PASS: movement, Cat following/damage, obstacles, pause, telegraphed charge, damage, win/lose/restart, campaign save isolation; no browser errors.');
 const density=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.owlAppeared=true;s.player.inv=999;let firstMinute=0;
  // Remove targets to measure the spawn schedule independently of combat strength.
  for(let i=0;i<7201&&s.mode==='playing';i++){
   for(const e of s.enemies)e.sprite.setVisible(false);s.enemies=[];
   s.tick(1/60);if(i===3599)firstMinute=s.spawned;
  }
  const result={firstMinute,total:s.spawned,secondMinute:s.spawned-firstMinute};s.start();s.encounters.nests.forEach(n=>n.clock=999);s.owlAppeared=true;s.player.inv=999;
  for(let i=0;i<120;i++)s.spawn('bat',1200,800);s.tick(1/60);return {...result,cap:s.spawned,capSeconds:s.spawnCapSeconds};
 });assert(density.total>=250&&density.total<=270);assert(density.secondMinute>density.firstMinute*1.5);assert.equal(density.cap,120);assert(density.capSeconds>0);console.log('PASS: increased density and spawn cap',density);
 const logs=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;s.xp=10;s.checkLevel();s.chooseUpgrade(0);advanceTime(1000);s.start();s.encounters.nests.forEach(n=>n.clock=999);s.spawnTimer=999;s.player.hp=1;s.player.fire=999;s.cat.attack=999;s.spawn('bat',800,800);advanceTime(20);
  const runs=JSON.parse(localStorage.getItem('scrollmonsters-survivor-runs-v1'));return {latest:runs[0],previous:runs[1]};
 });assert.equal(logs.latest.status,'lost');assert.equal(logs.previous.status,'restarted');assert(logs.previous.events.some(e=>e.type==='upgrade_chosen'));assert(logs.latest.events.some(e=>e.type==='damage_taken'));assert(logs.previous.samples.length>0);
 const history=await browser.newPage();await history.goto('http://localhost:5174/survivor-runs.html');await history.evaluate(data=>localStorage.setItem('scrollmonsters-survivor-runs-v1',JSON.stringify(data)),[logs.latest,logs.previous]);await history.reload();assert.equal(await history.locator('article').count(),2);await history.screenshot({path:'output/survivors/history.png'});const download=history.waitForEvent('download');await history.locator('#export').click();assert((await download).suggestedFilename().endsWith('.json'));await history.close();console.log('PASS: run history persists outcomes, restart, upgrades, damage, checkpoints; review and JSON export.');
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 mobile.on('pageerror',e=>errors.push(e.message));await mobile.addInitScript(()=>window.__vt_pending=true);
 await mobile.goto('http://localhost:5174/survivors.html?trial&test');await mobile.waitForFunction(()=>window.__phaserReady);
 await mobile.evaluate(()=>__survivorTest.start());
 const box=await mobile.locator('canvas').boundingBox();const session=await mobile.context().newCDPSession(mobile);const point={x:box.x+box.width*.3,y:box.y+box.height*.65};
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x+45,y:point.y,id:1}]});
 await mobile.evaluate(()=>advanceTime(1000));
 const touch=await mobile.evaluate(()=>JSON.parse(render_game_to_text()));assert(touch.player.x>850);
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const stopped=await mobile.evaluate(()=>{advanceTime(1000);return JSON.parse(render_game_to_text());});assert.equal(stopped.player.x,touch.player.x);
 await mobile.evaluate(()=>{const s=__survivorTest.scene;s.xp=10;s.checkLevel();s.draw();});await mobile.waitForTimeout(100);await mobile.screenshot({path:'output/survivors/mobile-upgrade.png'});
 const mb=await mobile.locator('canvas').boundingBox();await mobile.touchscreen.tap(mb.x+mb.width/2,mb.y+mb.height*(235+110)/820);await mobile.waitForFunction(()=>__survivorTest.scene.mode==='playing');
 await mobile.evaluate(()=>{const s=__survivorTest.scene;s.summonOwl();s.hit(s.owl,99,'player',s.player);s.owl.x=s.player.x+65;s.owl.y=s.player.y;s.drop('haste',s.player.x-80,s.player.y-90);s.shield=true;s.haste=12;s.draw();});await mobile.waitForTimeout(100);await mobile.screenshot({path:'output/survivors/mobile.png'});assert.deepEqual(errors,[]);console.log('PASS: portrait touch drag, release stops movement, mobile rendering.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
