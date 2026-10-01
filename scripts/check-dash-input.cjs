const assert=require('node:assert/strict');
const fs=require('node:fs');
const {run,gameURL,listControls}=require('./survivor-test-utils.cjs');
run('150 enemies, automatic creature dash and keyboard/swipe input',async(page,browser)=>{
 const results=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.obstacles=[];s.spawnTimer=999;const styles=[];
  for(const type of ['salamander','spider','storm','bear','cat']){
   s.starter=type;s.start();styles.push(s.creatures.elements.dashStyle);
  }
  s.starter='cat';s.start();s.obstacles=[];s.spawnTimer=999;
  s.expedition.release('spider',s.player.x,s.player.y);const before=s.creatures.elements.dashStyle;
  s.expedition.capture(s.expedition.captureBody('spider'),'spider',2.5);const after=s.creatures.elements.dashStyle;
  s.expedition.release('storm',s.player.x,s.player.y);s.expedition.capture(s.expedition.captureBody('storm'),'storm',2.5);const latest=s.creatures.elements.dashStyle;
  s.mode='playing';s.enemies=[];for(let i=0;i<150;i++)s.spawn('bat',s.player.x+100+(i%15)*10,s.player.y+100+Math.floor(i/15)*10);
  const cap=s.enemies.length,blocked=!s.spawn('bat',s.player.x,s.player.y);s.enemies[0].hp=0;const replacement=!!s.spawn('bat',s.player.x+100,s.player.y);
  s.start();s.obstacles=[];s.spawnTimer=999;s.expansion.facing={x:1,y:0};s.draw();
  return {styles,before,after,latest,cap,blocked,replacement,manualRemoved:typeof s.creatures.elements.cycleDash==='undefined'};
 });
 assert.deepEqual(results.styles,['salamander','spider','storm','bear','cat']);assert.equal(results.before,'cat');assert.equal(results.after,'spider');assert.equal(results.latest,'storm');assert.equal(results.cap,150);assert(results.blocked&&results.replacement&&results.manualRemoved);
 assert(!(await listControls(page)).some(c=>c.label.startsWith('Dash')));
 await page.keyboard.press('Shift');assert.equal(await page.evaluate(()=>__survivorTest.scene.expansion.cooldown),0);
 await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>__survivorTest.scene.expansion.cooldown),3);
 const moved=await page.evaluate(()=>{const s=__survivorTest.scene,x=s.player.x;advanceTime(200);return s.player.x-x;});assert(moved>100);
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.addInitScript(()=>window.__vt_pending=true);await mobile.goto(gameURL('survivors.html?test'));await mobile.waitForFunction(()=>window.__phaserReady);
 await mobile.evaluate(()=>{const s=__survivorTest.scene;s.start();s.obstacles=[];s.spawnTimer=999;s.draw();});
 const box=await mobile.locator('canvas').boundingBox(),cdp=await mobile.context().newCDPSession(mobile),x=box.x+box.width*.5,y=box.y+box.height*.5;
 async function swipe(dx,dy,slow=false){
  await mobile.evaluate(()=>{const s=__survivorTest.scene;s.expansion.cooldown=0;s.expansion.dashTime=0;});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx,y:y+dy}]});
  if(slow)await mobile.waitForTimeout(350);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  return mobile.evaluate(()=>{const s=__survivorTest.scene;return {cd:s.expansion.cooldown,dx:s.expansion.dx,dy:s.expansion.dy,joy:s.joy};});
 }
 const right=await swipe(90,0);assert.equal(right.cd,3);assert(right.dx>.99&&Math.abs(right.dy)<.01);assert.equal(right.joy,null);
 const up=await swipe(0,-90);assert.equal(up.cd,3);assert(up.dy<-.99);
 assert.equal((await swipe(90,0,true)).cd,0,'Held movement does not dash on release');assert.equal((await swipe(5,0)).cd,0,'Tap does not dash');
 assert(!(await listControls(mobile)).some(c=>c.label.startsWith('Dash')));
 fs.mkdirSync('output/dash-input',{recursive:true});await mobile.evaluate(()=>__survivorTest.scene.draw());await mobile.waitForTimeout(100);await mobile.screenshot({path:'output/dash-input/mobile.png'});assert.deepEqual(errors,[]);await mobile.close();console.log(results);
}).catch(e=>{console.error(e);process.exit(1)});
