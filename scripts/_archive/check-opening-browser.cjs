const { chromium, devices } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async()=>{
 fs.mkdirSync('output/opening',{recursive:true});
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({...devices['iPhone 13']});
 const errors=[];page.on('pageerror',error=>errors.push(String(error)));
 await page.addInitScript(()=>{window.__vt_pending=true;let seed=1;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};});
 await page.goto(process.env.GAME_URL||'http://localhost:5173');
 const tap=async(x,y)=>{const b=await page.locator('canvas').boundingBox();await page.touchscreen.tap(b.x+x*b.width/540,b.y+y*b.height/900);};
 const read=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 const aimRun=async()=>{
   const b=await page.locator('canvas').boundingBox();
   for(let step=0;step<800;step++){
     const s=await read();if(s.mode!=='combat')return s;
     const targets=s.combat.enemies.filter(e=>e.y<=804).sort((a,b)=>Math.hypot(a.x-s.party.x,a.y-s.party.y)-Math.hypot(b.x-s.party.x,b.y-s.party.y));
     if(targets[0])await page.mouse.move(b.x+targets[0].x*b.width/540,b.y+targets[0].y*b.height/900);
     await page.evaluate(()=>window.advanceTime(100));
   }
   throw Error('Combat did not finish');
 };
 await tap(270,700);await tap(150,830);
 const first=await aimRun();assert.equal(first.result.won,false);assert(first.bankedGold>=10);assert.equal(first.party.damage,1);assert.equal(first.party.maxHp,10);
 await page.screenshot({path:'output/opening/first-defeat.png'});
 await tap(270,625);await tap(390,830);
 await page.screenshot({path:'output/opening/damage-node.png'});
 await tap(140,270);await tap(380,270);
 const bought=await read();assert.equal(bought.upgrades.power,1);assert.equal(bought.upgrades.health,1);assert.equal(bought.bankedGold,first.bankedGold-10);
 await page.screenshot({path:'output/opening/health-node.png'});
 await tap(270,838);await tap(150,830);
 const second=await aimRun();assert.equal(second.result.won,true);assert.equal(second.party.damage,2);assert.equal(second.party.maxHp,15);
 await page.screenshot({path:'output/opening/upgraded-clear.png'});
 assert.deepEqual(errors,[]);
 console.log(`PASS: first boss defeat banks ${first.bankedGold}G; buy both 5G upgrades by touch; retry wins with 2 damage / 15 HP; no browser errors`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
