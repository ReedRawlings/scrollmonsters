const {chromium}=require('playwright');const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:560,height:940}}),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.addInitScript(()=>{window.__vt_pending=true;});
 await page.route('**/game.js*',route=>route.fulfill({contentType:'application/javascript',body:fs.readFileSync('game.js','utf8').replace('  window.__scollTest = {','  window.biomeAudit = { state, updateCombat, updateParticles, updateVases, render, assets, destructibleVariants };\n  window.__scollTest = {')}));
 await page.goto('http://localhost:5173');await page.evaluate(()=>Promise.all(Object.values(window.biomeAudit.assets).map(i=>i.decode())));
 fs.mkdirSync('output/biomes-props',{recursive:true});
 const results=await page.evaluate(()=>{
 const a=window.biomeAudit,s=a.state,api=window.__scollTest;
 api.setSave({unlockedStage:10});const stages=[];
 for(let n=1;n<=10;n++){
 api.startStage(n);Object.assign(s,{spawnTimer:999,fireTimer:999,treasureSpawnAt:null,rockSpawnTimer:999});
 for(let i=0;i<29*60;i++)a.updateCombat(1/60);
 if(s.propsSpawned!==2)throw Error(`Stage ${n} spawned ${s.propsSpawned}`);
 if(s.vases.length<1)throw Error('No remaining second prop');stages.push({stage:n,props:s.propsSpawned});
 }
 api.startStage(1);const ys=s.particles.map(p=>p.y),xs=s.particles.map(p=>p.x);
 if(!ys.some(y=>y<300)||!ys.some(y=>y>350)||Math.min(...xs)>150||Math.max(...xs)<390)throw Error('Leaf coverage too narrow');
 const drops=[];const originalRandom=Math.random;
 for(let variant=0;variant<6;variant++)for(const roll of [0,0.24999,0.25,0.99]){
 api.startStage(3);Object.assign(s,{spawnTimer:999,fireTimer:999,treasureSpawnAt:null,rockSpawnTimer:999,vaseTimer:999});
 Math.random=()=>roll;s.vases=[{x:270,y:600,r:12,hp:1,kind:'vase',variant}];
 s.projectiles=[{x:270,y:550,vx:0,vy:560,r:6,friendly:true,damage:1,source:'player',age:0}];
 for(let i=0;i<8;i++)a.updateCombat(1/60);
 if(s.vases.length)throw Error('Prop survived');const win=roll<0.25?1:0;
 if(s.runGold!==win||s.drops.length!==win)throw Error('Wrong reward threshold');
 const material=a.destructibleVariants[variant].material;if(s.particles.filter(p=>p.kind===material).length!==6)throw Error('Wrong fragments');
 for(let i=0;i<180;i++)a.updateCombat(1/60);
 if(s.runGold!==win||s.drops.length)throw Error('Pickup credited twice or did not finish');
 drops.push({variant,roll,gold:win});Math.random=originalRandom;
 }
 return {stages,leafBounds:{x:[Math.min(...xs),Math.max(...xs)],y:[Math.min(...ys),Math.max(...ys)]},dropCases:drops.length};
 });
 for(const [stage,name] of [[1,'leaves'],[4,'desert'],[5,'stone']]){
 await page.evaluate(stage=>{window.__scollTest.startStage(stage);const s=window.biomeAudit.state;Object.assign(s,{scroll:280,spawnTimer:999,fireTimer:999,treasureSpawnAt:null,rockSpawnTimer:999});window.advanceTime(1600);},stage);
 await page.locator('canvas').screenshot({path:`output/biomes-props/${name}.png`});
 }
 await page.evaluate(()=>{window.__scollTest.startStage(1);const s=window.biomeAudit.state;s.vases=window.biomeAudit.destructibleVariants.map((v,i)=>({x:175+(i%2)*190,y:530+Math.floor(i/2)*90,r:12,hp:1,kind:'vase',variant:i}));window.biomeAudit.render();});
 await page.locator('canvas').screenshot({path:'output/biomes-props/prop-varieties.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({...results,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
