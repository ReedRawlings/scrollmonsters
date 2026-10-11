const {chromium}=require('playwright');
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
 const page=await browser.newPage({viewport:{width:720,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.addInitScript(()=>{window.__vt_pending=true;});
 await page.route('**/game.js*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync('game.js','utf8').replace('  window.__scollTest = {','  window.sceneryAudit = {state, updateCombat, render};\n  window.__scollTest = {')}));
 await page.goto('http://localhost:5173');
 await page.evaluate(()=>Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{}))));
 await page.waitForTimeout(500);
 fs.mkdirSync('output/approved-scenery',{recursive:true});
 for(const stage of [1,2,3]){
 await page.evaluate(stage=>{window.__scollTest.setSave({unlockedStage:10,upgrades:{rockBreaker:1,power:1}});window.__scollTest.startStage(stage);const s=window.sceneryAudit.state;s.scroll=280;s.obstacles=[{x:165,y:620,r:13,size:'small',hp:8,maxHp:8},{x:365,y:690,r:27,size:'medium',hp:15,maxHp:15}];window.sceneryAudit.render();},stage);
 await page.locator('canvas').screenshot({path:`output/approved-scenery/stage-${stage}.png`});
 }
 const result=await page.evaluate(()=>{
 const {state:s,updateCombat,render}=window.sceneryAudit;
 window.__scollTest.startStage(4);s.enemies=[];s.spawnTimer=999;s.fireTimer=999;s.treasureSpawnAt=null;s.rockSpawnTimer=999;
 const checks=[];
 for(const breaker of [false,true])for(const size of ['small','medium']){
 s.save.upgrades.rockBreaker=Number(breaker);const hp=size==='small'?8:15,r=size==='small'?13:27;
 const rock={x:160,y:600,r,size,hp,maxHp:hp};s.obstacles=[rock];
 const shots=breaker?Math.ceil(hp/2):1;
 for(let i=0;i<shots;i++){
 s.projectiles=[{x:160,y:rock.y-60,vx:0,vy:560,r:6,friendly:true,damage:2,source:'player',age:0}];
 for(let frame=0;frame<8;frame++)updateCombat(1/60);
 if(i<shots-1&&rock.hp<=0)throw Error('Rock broke early');
 }
 if(breaker&&s.obstacles.includes(rock))throw Error('Rock did not break');
 if(!breaker&&rock.hp!==hp)throw Error('Rock damaged without upgrade');
 checks.push({size,breaker,shots,hp:rock.hp});
 }
 const sizes=new Set();s.save.upgrades.rockBreaker=1;
 for(let i=0;i<60;i++){s.obstacles=[];s.rockSpawnTimer=0;updateCombat(1/60);const rock=s.obstacles[0];sizes.add(rock.size);if(rock.hp!==(rock.size==='small'?8:15))throw Error('Wrong spawn HP');}
 if(sizes.size!==2)throw Error('Missing rock size');
 s.scroll=1000;s.obstacles=[];render();return checks;
 });
 await page.locator('canvas').screenshot({path:'output/approved-scenery/loop-join.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({checks:result,spawnSizes:'both',browserErrors:errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
