const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,args:[]});
 const page=await browser.newPage({viewport:{width:540,height:900}}); const errors=[];
 page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4173/?test=1',{waitUntil:'networkidle'});
 const roster=await page.evaluate(()=>JSON.parse(window.render_game_to_text()).bestiary);
 assert.equal(roster.length,34);assert(!roster.some(c=>['striker','healer','aoe'].includes(c.id)));
 const result=await page.evaluate(()=>{
  const a=window.__scollTest; a.resetSave(); const catalog=a.monsterCatalog;
  const results=[];
  for(const affinity of ['feral','bloom','arcane'])for(const tier of [1,2,3]){
   a.setSave({essence:{[affinity]:100000}});
   const pool=a.summonPool(affinity,tier), count=pool.length;
   for(let i=0;i<count*6;i++){
    const before=a.getSave(), id=a.summonCreature(affinity,tier), after=a.getSave();
    const expected=before.ownedCreatures.includes(id)?(before.fragments[id]||0)+1:0;
    if((after.fragments[id]||0)!==expected)throw Error('Incorrect duplicate fragment award');
   }
   const s=a.getSave(); results.push({count,owned:s.ownedCreatures.length,fragments:Object.values(s.fragments),remaining:a.summonPool(affinity,tier).length,spent:100000-s.essence[affinity],cost:[0,10,100,1000][tier]});
   const before=JSON.stringify(a.getSave()); a.summonCreature(affinity,tier); if(JSON.stringify(a.getSave())!==before)throw Error('Completed pool charged currency');
  }
  const c=catalog.find(c=>c.name==='Tengu');
  a.setSave({unlockedStage:10,essence:{arcane:0},ownedCreatures:[c.id],activeParty:[c.id],fragments:{[c.id]:5},shinyCreatures:[c.id]});
  a.setMode('bestiary');return {results,catalog};
 });
 assert.equal(result.catalog.length,34);
 for(const c of result.catalog){assert(fs.existsSync(c.walk));assert(fs.existsSync(c.shinyWalk));}
 for(const r of result.results){assert.equal(r.owned,r.count);assert(r.fragments.every(n=>n===5));assert.equal(r.remaining,0);assert.equal(r.spent,r.count*6*r.cost);}
 await page.reload({waitUntil:'networkidle'});
 assert.deepEqual(await page.evaluate(()=>window.__scollTest.getSave().shinyCreatures),['arcane-tengu']);
 await page.evaluate(()=>{window.__scollTest.setMode('bestiary')});
 await page.mouse.click(435,255); await page.mouse.click(265,308); await page.mouse.click(170,700);
 await page.mouse.click(425,413);
 assert.deepEqual(await page.evaluate(()=>window.__scollTest.getSave().shinyCreatures),[]);
 await page.mouse.click(425,413);
 assert.deepEqual(await page.evaluate(()=>window.__scollTest.getSave().shinyCreatures),['arcane-tengu']);
 await page.waitForTimeout(300);fs.mkdirSync('output/monster-summons',{recursive:true});
 await page.screenshot({path:'output/monster-summons/bestiary.png'});
 await page.evaluate(()=>{const a=window.__scollTest;a.startStage(6);for(const edge of ['north','south','east','west'])a.spawnEnemy('basic',edge);});
 await page.evaluate(()=>window.advanceTime(1400));
 const state=await page.evaluate(()=>JSON.parse(window.render_game_to_text()));
 for(const [edge,column] of Object.entries({north:0,south:1,east:2,west:3})){
  const enemy=state.combat.enemies.find(e=>e.edge===edge);assert(enemy);assert.equal(enemy.animationColumn,column);
 }
 assert.equal(state.combat.companions[0].role,'aoe');
 assert.equal(state.combat.companions[0].shiny,true);
 await page.screenshot({path:'output/monster-summons/combat.png'});
 fs.writeFileSync('output/monster-summons/state.json',JSON.stringify(state,null,2));
 await page.evaluate(()=>{const a=window.__scollTest;a.setSave({essence:{arcane:100}});a.setMode('bestiary')});
 await page.mouse.click(380,700);
 const summoned=await page.evaluate(()=>window.__scollTest.getSave());
 assert.equal(summoned.essence.arcane,0);assert.equal(summoned.ownedCreatures.length,1);
 await page.mouse.click(380,700);assert.equal((await page.evaluate(()=>window.__scollTest.getSave())).ownedCreatures.length,1);
 assert.deepEqual(errors,[]);await browser.close();console.log('34 pairs, all nine pools, five-fragment completion, costs, persistence, shiny party combat and asset loading passed.');
})().catch(e=>{console.error(e);process.exit(1)});
