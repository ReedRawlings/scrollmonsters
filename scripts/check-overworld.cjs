const {chromium}=require('playwright'),fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({headless:true});try{const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});let errors=[];p.on('pageerror',e=>errors.push(String(e)));await p.addInitScript(()=>window.__vt_pending=true);await p.goto('http://localhost:5174');await p.waitForTimeout(600);fs.mkdirSync('output/overworld',{recursive:true});
const tap=async(x,y)=>{let r=await p.locator('canvas').boundingBox();await p.touchscreen.tap(r.x+x*r.width/540,r.y+y*r.height/900);};const read=()=>p.evaluate(()=>JSON.parse(window.render_game_to_text()));
await p.evaluate(()=>window.__scollTest.setSave({}));await tap(270,700);await p.locator('canvas').screenshot({path:'output/overworld/fresh.png'});await tap(480,190);assert.equal((await read()).selectedStage,1);
for(const n of [5,10]){await p.evaluate(n=>window.__scollTest.setSave({unlockedStage:n,completed:Array.from({length:n-1},(_,i)=>i+1)}),n);await p.locator('canvas').screenshot({path:`output/overworld/reached-${n}.png`});}
await tap(480,190);assert.equal((await read()).selectedStage,6);await p.locator('canvas').screenshot({path:'output/overworld/selected-6.png'});
await tap(146,729);assert.equal((await read()).mode,'bestiary');
// Return through the normal screen controls using test API to reset entry only.
await p.reload();await tap(270,700);await tap(390,729);assert.equal((await read()).mode,'upgrades');await tap(76,40);assert.equal((await read()).mode,'map');
await tap(168,350);assert.equal((await read()).selectedStage,2);await tap(270,799);assert.equal((await read()).combat.stage,2);await p.evaluate(()=>window.advanceTime(1000));await p.locator('canvas').screenshot({path:'output/overworld/combat.png'});assert.deepEqual(errors,[]);console.log('PASS: fog blocks unreached stage selection, reached selection, Bestiary/Upgrades navigation, selected stage starts combat');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
