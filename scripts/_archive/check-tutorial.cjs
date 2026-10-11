const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:["--use-gl=angle","--use-angle=metal"]});
 try {
 for(const touch of [false,true]){
 const page=await browser.newPage({viewport:{width:540,height:900},hasTouch:touch});
 const errors=[];page.on('pageerror',e=>{errors.push(e.stack);console.error(e.stack)});
 await page.addInitScript(()=>window.__vt_pending=true);
 await page.goto('http://localhost:5173');await page.waitForFunction(()=>window.__phaserReady);
 const read=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 const step=ms=>page.evaluate(ms=>window.advanceTime(ms),ms);
 const click=async(x,y)=>{const r=await page.locator('canvas').boundingBox(); const a=r.x+x*r.width/540,b=r.y+y*r.height/900; if(touch)await page.touchscreen.tap(a,b);else await page.mouse.click(a,b);};
 fs.mkdirSync('output/tutorial',{recursive:true});
 await click(270,700);await step(10000);
 assert.equal((await read()).combat.companions[0].creatureId,'tutorial-cat');assert.equal((await read()).tutorial.intro,true);assert.equal((await read()).tutorial.spawned,0);
 await page.locator('canvas').screenshot({path:`output/tutorial/intro-${touch}.png`});
 await click(270,478);
 let maxSpawn=0;
 for(let i=0;i<1000 && (await read()).mode==='combat';i++){
 const st=await read();
 for(const e of st.combat.enemies){assert.equal(e.maxHp,1);assert.equal(e.damage,1);}
 assert.equal(st.combat.vases.length,0);assert.equal(st.combat.obstacles.length,0);
 maxSpawn=Math.max(maxSpawn,st.tutorial.spawned);
 if(i===70) await page.locator("canvas").screenshot({path:`output/tutorial/combat-${touch}.png`});
 const e=st.combat.enemies.find(e=>e.x>=0&&e.x<=540&&e.y>=126&&e.y<=804);
 if(e){if(touch)await click(e.x,e.y);else {const r=await page.locator('canvas').boundingBox();await page.mouse.move(r.x+e.x*r.width/540,r.y+e.y*r.height/900);}}
 await step(100);
 }
 let st=await read();assert.equal(st.mode,'map');assert.equal(st.tutorial.kills,10);assert.equal(st.tutorial.spawned,10);
 assert.equal((await page.evaluate(()=>window.__scollTest.getSave())).gold,10);
 await click(130,730);assert.equal((await read()).mode,'map');
 await click(270,800);assert.equal((await read()).mode,'map');
 await page.reload();await page.waitForFunction(()=>window.__phaserReady);await click(270,700);
 assert.equal((await read()).tutorial.step,'upgrade');
 assert.deepEqual((await page.evaluate(()=>window.__scollTest.getSave())).ownedCreatures,['tutorial-cat']);
 assert.deepEqual((await page.evaluate(()=>window.__scollTest.getSave())).activeParty,['tutorial-cat']);
 await page.locator('canvas').screenshot({path:`output/tutorial/map-${touch}.png`});
 await click(390,730);st=await read();assert.equal(st.mode,'upgrades');assert.equal(st.selectedUpgrade,'power');
 await page.locator('canvas').screenshot({path:`output/tutorial/upgrade-${touch}.png`});
 await click(270,702);assert.equal((await page.evaluate(()=>window.__scollTest.getSave())).upgrades.power,1);
 await click(76,40);await step(100);assert.equal((await read()).mode,"map");await page.waitForTimeout(180);await click(270,800);await step(100);assert.equal((await read()).combat?.stage,1);assert.equal((await read()).tutorial.intro,false);assert.equal((await read()).combat.companions[0].creatureId,'tutorial-cat');
 assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS tutorial: mouse + touch, paused intro, ten 1 HP/1 damage monsters, no props, 10 gold, saved map gate, focused damage purchase, normal stage 1.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
