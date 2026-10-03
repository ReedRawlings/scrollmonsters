const assert=require('node:assert/strict');
const fs=require('node:fs');
const {run,gameURL}=require('./survivor-test-utils.cjs');
run('directional continuous fire, touch aim and quarter-second protection',async(page,browser)=>{
 await page.evaluate(()=>{const s=__survivorTest.scene;s.start();s.obstacles=[];s.spawnTimer=999;s.catActive=false;s.draw();});
 await page.waitForTimeout(100);
 const canvas=await page.locator('canvas').boundingBox();
 await page.mouse.move(canvas.x+canvas.width*.9,canvas.y+canvas.height*.5);
 const aimed=await page.evaluate(()=>{const s=__survivorTest.scene;s.player.fire=0;s.tick(1/60);const shot=s.shots.at(-1);return {dx:shot.dx,dy:shot.dy,enemies:s.enemies.length};});
 assert(aimed.dx>.95);assert.equal(aimed.enemies,0,'Fires without a target');
 const checks=await page.evaluate(()=>{
  const s=__survivorTest.scene,p=s.player,out={};s.spawnTimer=999;s.shots.forEach(e=>e.sprite.setVisible(false));s.shots=[];
  s.mouseAim=null;s.aim={x:1,y:0};p.fire=0;
  const e=s.spawn('bat',p.x+80,p.y);e.speed=0;e.hp=e.maxHp=200;s.tick(.2);out.aimedHit=e.hp<200;s.enemies=[];
  p.inv=0;p.hp=400;s.encounters.damage(70,'projectile');out.first=p.hp;out.window=p.inv;s.tick(.24);s.encounters.damage(70,'hazard');out.protected=p.hp;s.tick(.011);s.encounters.damage(70,'hazard');out.expired=p.hp;
  p.inv=0;p.hp=200;s.drop('heal',p.x,p.y);s.tick(.01);out.healWindow=p.inv;out.healed=p.hp;s.encounters.damage(70,'projectile');out.healProtected=p.hp;s.tick(.251);s.encounters.damage(70,'projectile');out.healExpired=p.hp;
  p.inv=0;p.hp=400;p.fire=999;const contact=s.spawn('bat',p.x,p.y);contact.speed=0;s.tick(.01);out.contactWindow=p.inv;out.contactHp=p.hp;s.enemies=[];
  s.start();out.reset=s.player.inv===0&&s.aim.x===0&&s.aim.y===1&&s.mouseAim===null;return out;
 });
 assert(checks.aimedHit);assert.equal(checks.first,344);assert.equal(checks.window,.25);assert.equal(checks.protected,344);assert.equal(checks.expired,288);
 assert.equal(checks.healWindow,.25);assert.equal(checks.healed,280);assert.equal(checks.healProtected,280);assert.equal(checks.healExpired,224);assert.equal(checks.contactWindow,.25);assert.equal(checks.contactHp,344);assert(checks.reset);
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await mobile.addInitScript(()=>window.__vt_pending=true);await mobile.goto(gameURL('survivors.html?test'));await mobile.waitForFunction(()=>window.__phaserReady);
 await mobile.evaluate(()=>{const s=__survivorTest.scene;s.start();s.obstacles=[];s.spawnTimer=999;s.catActive=false;});
 const c=await mobile.locator('canvas').boundingBox(),session=await mobile.context().newCDPSession(mobile);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:c.x+c.width*.4,y:c.y+c.height*.6}]});
 await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:c.x+c.width*.65,y:c.y+c.height*.6}]});
 const touch=await mobile.evaluate(()=>{const s=__survivorTest.scene,x=s.player.x;advanceTime(200);return {aim:s.aim,x:s.player.x-x,shot:s.shots.at(-1).dx};});assert(touch.x>0&&touch.aim.x>.99&&touch.shot>.99);
 await mobile.waitForTimeout(350); // held movement, not a quick dash swipe
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.waitForFunction(()=>!__survivorTest.scene.joy);
 const release=await mobile.evaluate(()=>{const s=__survivorTest.scene,x=s.player.x;s.player.fire=0;advanceTime(20);return {stopped:s.player.x===x,dx:s.shots.at(-1).dx};});assert(release.stopped&&release.dx>.99);
 fs.mkdirSync('output/player-aim',{recursive:true});await mobile.waitForTimeout(150);await mobile.screenshot({path:'output/player-aim/touch.png'});
 await page.mouse.move(canvas.x+canvas.width*.8,canvas.y+canvas.height*.6);await page.evaluate(()=>advanceTime(500));await page.waitForTimeout(150);await page.screenshot({path:'output/player-aim/desktop.png'});
 fs.writeFileSync('output/player-aim/state.json',JSON.stringify({aimed,checks,touch,release},null,2));await mobile.close();
}).catch(e=>{console.error(e);process.exitCode=1;});
