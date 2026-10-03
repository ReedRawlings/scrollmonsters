const assert=require('node:assert/strict'),fs=require('node:fs');
const {run,offscreenTexts}=require('./survivor-test-utils.cjs');
run('Grasslands player direction, roll, pause, collision and portraits',async(page,browser)=>{
 fs.mkdirSync('output/player-character',{recursive:true});
 const initial=await page.evaluate(()=>{const s=__survivorTest.scene;s.start();s.juice.enabled=false;s.catActive=false;s.obstacles=[];s.spawnTimer=s.player.fire=s.player.inv=9999;s.encounters.nests=[];s.elapsed=2;const states=[];
  for(let dir=0;dir<4;dir++)for(const moving of [false,true]){s.player.dir=dir;s.moving=moving;s.draw();states.push({key:s.playerSprite.texture.key,frame:s.playerSprite.frame.name});}
  return {states,r:s.player.r,scale:s.playerSprite.scaleX,face:s.textures.get('face_walker').getSourceImage().width};});
 assert.equal(initial.r,12);assert.equal(initial.scale,3);assert.equal(initial.face,768);
 assert.deepEqual(initial.states.map(s=>s.key),['front','back','left','right'].flatMap(d=>['idle','walk'].map(a=>`player_${d}_${a}`)));
 await page.evaluate(()=>{const s=__survivorTest.scene;s.keys.D.isDown=true;advanceTime(100);s.keys.D.isDown=false;s.expansion.cooldown=0;});
 await page.keyboard.press('Space');
 const start=await page.evaluate(()=>{const s=__survivorTest.scene;s.draw();return {x:s.player.x,y:s.player.y,key:s.playerSprite.texture.key,remaining:s.expansion.dashTime};});
 assert.equal(start.key,'player_right_dodgeroll');assert.equal(start.remaining,.35);
 const middle=await page.evaluate(()=>{const s=__survivorTest.scene;advanceTime(80);s.draw();return {key:s.playerSprite.texture.key,frame:s.playerSprite.frame.name,x:s.player.x};});
 assert.equal(middle.key,'player_right_dodgeroll');assert(+middle.frame>0);assert(middle.x>start.x);
 await page.evaluate(()=>{const s=__survivorTest.scene;s.juice.enabled=true;s.juice.irisAt=null;s.juice.numbers.reset();s.upgrades.partyDamage=1;const e=s.spawn('bear',s.player.x+80,s.player.y);e.speed=0;s.hit(e,30,'cat',s.player);s.draw();});
 await page.screenshot({path:'output/player-character/roll-damage.png'});
 const landing=await page.evaluate(()=>{const s=__survivorTest.scene,original=s.expansion.dashTime;const frames=[.21,.26,.28,.34].map(age=>{s.expansion.dashTime=.35-age;s.draw();return +s.playerSprite.frame.name;});s.expansion.dashTime=original;s.draw();return frames;});assert.deepEqual(landing,[5,5,6,6]);
 const pause=await page.evaluate(()=>{const s=__survivorTest.scene;s.pause();const before={x:s.player.x,t:s.expansion.dashTime,frame:s.playerSprite.frame.name};advanceTime(300);s.draw();const after={x:s.player.x,t:s.expansion.dashTime,frame:s.playerSprite.frame.name};s.pause();return {before,after};});assert.deepEqual(pause.before,pause.after);
 const end=await page.evaluate(()=>{const s=__survivorTest.scene;advanceTime(300);s.draw();return {x:s.player.x,y:s.player.y,key:s.playerSprite.texture.key,cooldown:s.expansion.cooldown};});
 assert(Math.abs(end.x-start.x-111.6)<.001);assert(!end.key.includes('dodgeroll'));assert(end.cooldown>2.6&&end.cooldown<3);
 const other=await page.evaluate(()=>{const s=__survivorTest.scene;s.expansion.cooldown=0;s.expansion.dash({x:-1,y:0});s.draw();const left=s.playerSprite.texture.key;s.expansion.move(.35,0,0);s.expansion.cooldown=0;s.expansion.dash({x:0,y:-1});s.draw();const up=s.playerSprite.texture.key;s.expansion.move(.35,0,0);s.expansion.cooldown=0;s.obstacles=[{x:s.player.x+25,y:s.player.y,r:12}];const before=s.player.x;s.expansion.dash({x:1,y:0});s.expansion.move(.35,0,0);s.draw();return {left,up,distance:s.player.x-before,done:s.expansion.dashTime===0};});
 assert.equal(other.left,'player_left_dodgeroll');assert.equal(other.up,'player_left_dodgeroll');assert(other.distance<111.6&&other.done);
 await page.evaluate(()=>{const s=__survivorTest.scene;s.player.dir=0;s.moving=false;s.draw();});await page.screenshot({path:'output/player-character/idle.png'});assert.deepEqual(await offscreenTexts(page),[]);
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await phone.addInitScript(()=>window.__vt_pending=true);await phone.goto(page.url());await phone.waitForFunction(()=>window.__phaserReady);await phone.evaluate(()=>{const s=__survivorTest.scene;s.start();s.juice.irisAt=null;s.elapsed=2;s.draw();});await phone.screenshot({path:'output/player-character/phone.png'});assert.deepEqual(await offscreenTexts(phone),[]);await phone.close();
});
