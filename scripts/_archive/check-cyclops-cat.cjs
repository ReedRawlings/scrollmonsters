const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=metal']});
 try{
 const page=await browser.newPage({viewport:{width:540,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.stack));
 await page.addInitScript(()=>window.__vt_pending=true);
 // Expose combat internals only in this served test copy for controlled boundary checks.
 await page.route('**/game.js?*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync('game.js','utf8').replace('  window.__scollTest = {','  window.__catTest = { state, updateCompanions, render };\n  window.__scollTest = {')}));
 await page.goto('http://localhost:5173');await page.waitForFunction(()=>window.__phaserReady);
 const result=await page.evaluate(()=>{
 const {state,updateCompanions,render}=window.__catTest;
 window.__scollTest.setSave({tutorial:'done',ownedCreatures:['tutorial-cat'],activeParty:['tutorial-cat'],upgrades:{partyBond:1,strikerPower:10,strikerSpeed:5,strikerDouble:10,strikerTriple:10,strikerCritChance:10,strikerCritDamage:5,power:10,playerRange:10}});
 window.__scollTest.startStage(1);
 const cat=state.companions[0];cat.timer=0;
 const enemy={type:'basic',monsterId:'feral-bat',species:null,hp:10,maxHp:10,x:cat.x+121,y:cat.y,r:11,gold:1,edge:'east'};
 state.enemies=[enemy];updateCompanions(0);const outside=enemy.hp;
 enemy.x=cat.x+120;updateCompanions(0);const inside=enemy.hp,cooldown=cat.timer;
 updateCompanions(.5);const half=enemy.hp;
 updateCompanions(.5);const second=enemy.hp;
 render();return {outside,inside,cooldown,half,second,effects:state.effects.map(e=>e.type)};
 });
 assert.deepEqual(result,{outside:10,inside:9,cooldown:1,half:9,second:8,effects:['catSlash','catSlash']});
 fs.mkdirSync('output/cyclops-cat',{recursive:true});
 // Show a middle slash frame while preserving its target and the cat.
 await page.evaluate(()=>{const {state,render}=window.__catTest;state.effects=state.effects.slice(0,1);state.effects[0].life=.25;render();});
 await page.waitForTimeout(100);await page.locator('canvas').screenshot({path:'output/cyclops-cat/slash.png'});
 await page.evaluate(()=>window.__scollTest.setMode('bestiary'));await page.waitForTimeout(200);

 const click=async(x,y)=>{const r=await page.locator('canvas').boundingBox();await page.mouse.click(r.x+x*r.width/540,r.y+y*r.height/900);await page.waitForTimeout(100);};
 await click(140,825);await page.waitForTimeout(100);await page.locator('canvas').screenshot({path:'output/cyclops-cat/collection.png'});
 const catVisible=()=>page.evaluate(()=>{const visit=o=>o.visible!==false&&((o.getData?.('label')==='Cyclops Cat')||(o.list||[]).some(visit));return window.scrollMonstersGame.scene.getScene('ScrollMonsters').children.list.some(visit)});
 assert(await catVisible());await click(270,260);assert.equal(await catVisible(),false);await click(440,260);assert.equal(await catVisible(),false);await click(95,260);assert(await catVisible());
 await click(420,323);assert.deepEqual(await page.evaluate(()=>window.__scollTest.getSave().activeParty),[]);
 await click(420,323);await click(104,176);assert.deepEqual(await page.evaluate(()=>window.__scollTest.getSave().activeParty),['tutorial-cat']);
 await page.reload();await page.waitForFunction(()=>window.__phaserReady);
 assert.deepEqual(await page.evaluate(()=>window.__scollTest.getSave().activeParty),['tutorial-cat']);
 assert.deepEqual(errors,[]);console.log('PASS: fixed 1 damage under upgrades, 120px range boundary, 1s cooldown, slash animation, collection remove/equip and reload.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
