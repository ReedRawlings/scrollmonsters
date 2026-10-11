const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:process.platform==='darwin'?['--use-gl=angle','--use-angle=metal']:[]});try{
 const page=await browser.newPage({viewport:{width:540,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/game.js*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync('game.js','utf8').replace('window.__scollTest = {','window.__scollTest = { rosterCheck:()=>({state,stageRosters,stageConfigs,rosterStats,pickStageMonster,stageBossDamage}),')}));
 await page.addInitScript(()=>window.__vt_pending=true);
 await page.goto(process.env.GAME_URL||'http://localhost:5184');await page.waitForFunction(()=>window.__scollTest);
 const report=await page.evaluate(()=>{
  const a=__scollTest,t=a.rosterCheck(),rows=[];a.setSave({unlockedStage:10});
  for(let n=1;n<=10;n++){
   const roster=t.stageRosters[n],stage=t.stageConfigs[n-1];
   if(Math.abs(roster.reduce((sum,c)=>sum+c.chance,0)-1)>1e-9)throw Error('probabilities '+n);
   a.startStage(n);t.state.enemies=[];
   for(let i=0;i<100;i++)a.spawnEnemy();
   for(const enemy of t.state.enemies){const entry=roster.find(c=>c.id===enemy.monsterId);if(!entry)throw Error('outside roster '+n);const stats=t.rosterStats(entry,stage);if(enemy.hp!==stats.hp||enemy.damage!==stats.damage)throw Error('stats '+n)}
   for(const c of roster)if(a.monsterCatalog.find(x=>x.id===c.id)?.tier!==1)throw Error('tier '+n);
   a.spawnEnemy('boss');const boss=t.state.enemies.at(-1);if(a.monsterCatalog.find(c=>c.id===boss.monsterId).tier!==1)throw Error('boss tier');
   if(n===2&&(boss.hp!==40||boss.damage!==5))throw Error('stage2 boss regression');
   rows.push({stage:n,roster:roster.map(c=>({id:c.id,...t.rosterStats(c,stage)})),bossHp:boss.hp,bossAtk:boss.damage});
  }
  t.state.save.unlockedStage=10;t.state.selectedStage=4;a.setMode('map');return rows;
 });
 assert.equal(errors.length,0,errors.join('\n'));fs.mkdirSync('output/stage-rosters',{recursive:true});fs.writeFileSync('output/stage-rosters/stats.json',JSON.stringify(report,null,2));await page.waitForTimeout(500);await page.screenshot({path:'output/stage-rosters/stage4.png'});console.log('PASS: all 10 rosters, 100 spawns per stage, Tier 1 only, exact stats, probability totals and Stage 2 boss preserved');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
