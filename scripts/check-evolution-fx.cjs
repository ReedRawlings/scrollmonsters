const assert=require('node:assert/strict'),fs=require('node:fs');
const {run,gameURL}=require('./survivor-test-utils.cjs');
fs.mkdirSync('output/evolution-fx',{recursive:true});
run('Evolution ability sheets, sim-clock freeze, limits, reset and reduced motion',async(page,browser)=>{
 const missing=await page.evaluate(()=>__survivorTest.scene.evoFx.summary().missing);assert.deepEqual(missing,[],'All Phase B exports must be present before visual verification');
 const setup=()=>{
  const s=__survivorTest.scene;s.starter='cat';s.start();s.juice.irisAt=null;s.obstacles=[];s.elapsed=3;s.player.inv=s.player.fire=s.spawnTimer=9999;
  const ev=s.creatures.evolution;const x=s.player.x,y=s.player.y;
  const ally=type=>{s.expedition.release(type,x,y,true);s.creatures.allies[type].inherited={};s.creatures.allies[type].attack=999;return s.creatures.allies[type];};
  const oct=ally('octopus'),rep=ally('reptile'),ten=ally('tengu');ally('axolotl');
  const enemy=(dx,dy)=>{const e=s.spawn('bat',x+dx,y+dy);Object.assign(e,{hp:1000,maxHp:1000,speed:0,clock:9999});return e;};
  const e=enemy(65,0),e2=enemy(135,25);e.inkUntil=s.elapsed+1;e.burningUntil=s.elapsed+1;s.upgrades.octoRear=1;s.upgrades.reptileBite=1;s.upgrades.axoHaste=1;
  ev.sweep(oct,0);ev.charge(rep,e,true);ev.bite(rep);ev.feather(ten,e,ev.stats('tengu'));ev.lightning(ten,e2,ev.stats('tengu'));
  ev.zone('fire',{x:x-90,y:y+60},'reptile',{radius:40,life:3,damage:1});ev.casts.push({x:x+130,y:y-90,r:60,time:.65,damage:1});
  ev.shieldBlock();s.reward('abilityfx',{creature:'axolotl',effect:'shield',x,y});
  s.reward('abilityfx',{creature:'tengu',effect:'spark',x:e2.x,y:e2.y,target:e2});s.draw();
  return {keys:s.evoFx.summary().visible.map(v=>v.key),feather:ev.projectiles[0].sprite.texture.key,scales:Object.values(s.evoFx.pools).flat().filter(v=>v.visible).map(v=>[v.texture.key,v.scaleX,v.depth])};
 };
 const first=await page.evaluate(setup);for(const key of ['Ink_Splat','Ink_Pool_Start','Ink_Hit','Tentacle_Sweep','Charge_Kick','Fire_Pool_Start','Bite_Impact','Fire_Detonate','Lightning_Link','Zap_Spark','Thunder_Warning','Bubble_Pulse','Bubble_Break','Rally_Motes'])assert(first.keys.includes(key),key+' starts');assert.equal(first.feather,'Tengu_Feather');
 const phases=await page.evaluate(()=>{const s=__survivorTest.scene,ev=s.creatures.evolution;for(const z of ev.zones)z.life=z.total-.5;s.elapsed+=.5;s.draw();const loop=s.evoFx.summary().visible.map(v=>v.key);for(const z of ev.zones)z.life=.1;s.draw();const end=s.evoFx.summary().visible.map(v=>v.key);ev.casts=[{x:s.player.x,y:s.player.y,r:60,time:.001,damage:1}];ev.update(.01);s.draw();return {loop,end,strike:s.evoFx.summary().visible.some(v=>v.key==='elementThunder')};});
 assert(phases.loop.includes('Ink_Pool_Loop')&&phases.loop.includes('Fire_Pool_Loop'));assert(phases.end.includes('Ink_Pool_End')&&phases.end.includes('Fire_Pool_End'));assert(phases.strike);
 await page.evaluate(setup);const frozen=await page.evaluate(()=>{const s=__survivorTest.scene;s.mode='paused';s.draw();return s.evoFx.summary().visible;});await page.waitForTimeout(350);assert.deepEqual(await page.evaluate(()=>__survivorTest.scene.evoFx.summary().visible),frozen,'Frames freeze through real-time pause');
 const limits=await page.evaluate(()=>{const s=__survivorTest.scene,fx=s.evoFx;s.mode='playing';fx.reset();const target={};for(let i=0;i<40;i++)s.reward('abilityfx',{effect:'spark',creature:'tengu',x:100,y:100,target});s.draw();const coalesced=fx.oneShots.filter(f=>f.contact).length;for(let i=0;i<80;i++)s.reward('abilityfx',{effect:'spark',creature:'tengu',x:i*20,y:100,target:{}});s.draw();const peak=fx.summary();for(let n=0;n<10;n++){s.elapsed+=1;for(let i=0;i<40;i++)s.reward('abilityfx',{effect:'spark',creature:'tengu',x:i*20,y:100,target:{}});s.draw();}return {coalesced,peak:peak.pools,after:fx.summary().pools};});assert.equal(limits.coalesced,1);assert.equal(limits.peak.sparks,12);assert.equal(limits.after.sparks,12);
 const reduced=await page.evaluate(()=>{const s=__survivorTest.scene;s.evoFx.reset();s.juice.reduced=true;s.reward('abilityfx',{effect:'bite',x:0,y:0,radius:70});s.reward('abilityfx',{effect:'spark',x:0,y:0});s.creatures.evolution.ink(s.player,'axolotl');s.draw();return s.evoFx.summary().visible.map(v=>v.key);});assert(!reduced.includes('Zap_Spark')&&!reduced.includes('Bite_Impact'));assert(reduced.includes('Ink_Pool_Loop'));
 const restart=await page.evaluate(()=>{const s=__survivorTest.scene;s.start();s.draw();return s.evoFx.summary();});assert.equal(restart.visible.length,0);assert.equal(restart.oneShots,0);
 // Rendering and reward listeners must leave every gameplay collection, timer, and PRNG untouched.
 const same=await page.evaluate(()=>{const s=__survivorTest.scene;s.juice.reduced=false;const ev=s.creatures.evolution;ev.ink(s.player,'mollusc');const state=()=>JSON.stringify({snapshot:s.snapshot(),rng:s.rng,events:s.run.events});const before=state();for(let i=0;i<30;i++)s.evoFx.draw();return before===state();});assert(same);
 await page.evaluate(setup);await page.evaluate(()=>{const s=__survivorTest.scene;s.juice.reduced=false;s.elapsed+=.12;s.creatures.evolution.update(.12);s.draw();});await page.screenshot({path:'output/evolution-fx/grass-desktop.png'});
 // Real game has three creature slots; showcase intentionally exercises all effect families at once.
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await phone.addInitScript(()=>window.__vt_pending=true);await phone.goto(gameURL('survivors.html?test&field=desert'));await phone.waitForFunction(()=>window.__phaserReady);await phone.evaluate(setup);await phone.evaluate(()=>{const s=__survivorTest.scene;s.elapsed+=.3;s.creatures.evolution.update(.3);s.draw();});await phone.screenshot({path:'output/evolution-fx/desert-phone.png'});await phone.close();
 console.log('PASS: every sheet, ground start/loop/end, strike resolution, pause, 12-spark cap, reuse, reset, reduced motion and read-only rendering');
});
