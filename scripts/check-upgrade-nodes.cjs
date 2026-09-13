const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true});try{const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.addInitScript(()=>window.__vt_pending=true);
await p.goto('http://localhost:5174/');await p.waitForTimeout(500);fs.mkdirSync('output/upgrade-nodes',{recursive:true});
const tap=async(x,y)=>{const r=await p.locator('canvas').boundingBox();await p.touchscreen.tap(r.x+x*r.width/540,r.y+y*r.height/900);};
await p.evaluate(()=>window.__scollTest.setSave({gold:1000,essence:{feral:100,bloom:100,arcane:100}}));await tap(270,700);await tap(390,729);
const before=await p.evaluate(()=>window.__scollTest.getSave());await tap(122,258);assert.deepEqual(await p.evaluate(()=>window.__scollTest.getSave()),before);
await p.locator('canvas').screenshot({path:'output/upgrade-nodes/player.png'});
await tap(270,702);assert((await p.evaluate(()=>window.__scollTest.getSave())).gold<before.gold);
for(let i=1;i<5;i++){await tap(62+i*104,150);await p.locator('canvas').screenshot({path:`output/upgrade-nodes/branch-${i}.png`});}
await tap(76,40);assert.equal(await p.evaluate(()=>JSON.parse(window.render_game_to_text()).mode),'map');assert.deepEqual(errors,[]);console.log('PASS: node tap does not spend, explicit upgrade buys, five branches render without errors');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
