const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:540,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>window.__vt_pending=true);
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:5198/');
 await page.evaluate(()=>document.fonts.ready);
 await page.waitForFunction(()=>window.__scollTest);
 await page.evaluate(()=>{window.__scollTest.setSave({unlockedStage:3});window.__scollTest.setMode('map')});
 fs.mkdirSync('output/stage-rosters',{recursive:true});
 const read=()=>page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 for(const stage of [1,2,3]){
  await page.mouse.click(64+(stage-1)*104,350);
  await page.screenshot({path:`output/stage-rosters/stage-${stage}.png`});
  await page.mouse.click(270,801);
  assert.equal((await read()).mode,'combat');
  await page.evaluate(()=>{for(let i=0;i<50;i++)window.__scollTest.spawnEnemy();window.advanceTime(100)});
  const state=await read(),allowed=stage===1?['feral-bat','bloom-bamboo']:['feral-beast','feral-bat','bloom-bamboo'];
  assert(state.combat.enemies.length>0);
  for(const e of state.combat.enemies)assert(allowed.includes(e.sprite),e.sprite);
  await page.evaluate(()=>window.__scollTest.setMode('map'));
 }
 await page.mouse.click(148,730);assert.equal((await read()).mode,'bestiary');
 await page.evaluate(()=>window.__scollTest.setMode('map'));
 await page.mouse.click(390,730);assert.equal((await read()).mode,'upgrades');
 assert.deepEqual(errors,[]);console.log('PASS: stage selection, live combat roster, Bestiary/Upgrades buttons, screenshots; no page errors');
}finally{await browser.close()}
})();
