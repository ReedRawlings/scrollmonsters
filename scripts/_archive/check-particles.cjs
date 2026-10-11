const {chromium}=require('playwright');
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
 const page=await browser.newPage({viewport:{width:560,height:940}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{window.__vt_pending=true;Math.random=()=>0.5;});
 await page.route('**/game.js*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync('game.js','utf8').replace('  window.__scollTest = {','  window.particleAudit = { state, updateCombat, updateParticles, drawParticles, render, assets };\n  window.__scollTest = {')}));
 await page.goto('http://localhost:5173');
 await page.evaluate(()=>Promise.all(Object.values(window.particleAudit.assets).map(i=>i.decode())));
 fs.mkdirSync('output/particles',{recursive:true});
 const setup=async stage=>page.evaluate(stage=>{
 window.__scollTest.setSave({unlockedStage:10,upgrades:{power:1,rockBreaker:1}});window.__scollTest.startStage(stage);
 const s=window.particleAudit.state;Object.assign(s,{spawnTimer:999,fireTimer:999,treasureSpawnAt:null,rockSpawnTimer:999,vaseTimer:999,scroll:240});
 },stage);
 for(const [stage,label] of [[1,'leaves'],[2,'rain']]){
 await setup(stage);
 await page.evaluate(()=>window.advanceTime(3600));
 const summary=await page.evaluate(()=>JSON.parse(window.render_game_to_text()).combat);
 assert.equal(summary.weather,label);assert(summary.particles.counts[stage===1?'leaf':'rain']>0);
 if(stage===2)assert(summary.particles.counts.splash>0,'Rain reaches floor and splashes');
 await page.locator('canvas').screenshot({path:`output/particles/${label}.png`});
 for(let i=0;i<16;i++){await page.evaluate(()=>window.advanceTime(100));await page.locator('canvas').screenshot({path:`output/particles/${label}-${i}.png`});}
 }
 await setup(3);
 await page.evaluate(()=>{window.particleAudit.state.vases=[{x:165,y:620,r:12,hp:1,kind:'vase'}];window.particleAudit.render();});
 await page.locator('canvas').screenshot({path:'output/particles/vase-intact.png'});
 const checks=[];
 for(const kind of ['small','medium','vase']){
 await setup(3);
 const result=await page.evaluate(kind=>{
 const a=window.particleAudit,s=a.state;
 s.save.upgrades.rockBreaker=kind==='vase'?0:1;
 const item={x:270,y:600,r:kind==='medium'?27:12,size:kind,hp:1,...(kind==='vase'?{kind:'vase'}:{})};
 s[kind==='vase'?'vases':'obstacles']=[item];
 s.projectiles=[{x:270,y:550,vx:0,vy:560,r:6,friendly:true,damage:2,source:'player',age:0}];
 for(let i=0;i<8;i++)a.updateCombat(1/60);
 a.render();
 return {remaining:s[kind==='vase'?'vases':'obstacles'].length,fragments:s.particles.filter(p=>p.kind===(kind==='vase'?'vase':'rock')).length,gold:s.runGold};
 },kind);
 assert.equal(result.remaining,0);assert.equal(result.fragments,kind==='medium'?10:6);assert.equal(result.gold,0);checks.push({kind,...result});
 await page.locator('canvas').screenshot({path:`output/particles/${kind}-break.png`});
 for(let i=0;i<12;i++){await page.evaluate(()=>window.advanceTime(50));await page.locator('canvas').screenshot({path:`output/particles/${kind}-${i}.png`});}
 await page.evaluate(()=>window.advanceTime(1000));
 assert.equal(await page.evaluate(()=>window.particleAudit.state.particles.length),0,'Fragments expire');
 }
 // Spawn, scrolling, culling and restart; ambient budget remains bounded over a long run.
 await setup(1);
 const lifecycle=await page.evaluate(()=>{
 const a=window.particleAudit,s=a.state;s.vaseTimer=0;a.updateCombat(1/60);
 if(s.vases.length!==1)throw Error('Vase did not spawn');const y=s.vases[0].y;a.updateCombat(1/60);
 if(s.vases[0].y>=y)throw Error('Vase did not scroll');s.vases[0].y=90;a.updateCombat(1/60);
 if(s.vases.length)throw Error('Vase did not cull');
 window.__scollTest.startStage(2);let max=0;
 for(let i=0;i<3600;i++){a.updateParticles(1/60,0.4);max=Math.max(max,s.particles.length);}
 window.__scollTest.startStage(1);
 if(s.particles.some(p=>p.kind!=='leaf')||s.particles.length!==6||s.vases.length)throw Error('Stage reset leaked particles or props');return {maximumParticles:max};
 });
 assert(lifecycle.maximumParticles<40);assert.deepEqual(errors,[]);
 console.log(JSON.stringify({checks,lifecycle,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
