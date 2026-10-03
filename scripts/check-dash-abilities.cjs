const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {gameURL,launchOptions}=require('./survivor-test-utils.cjs');
(async()=>{
 const browser=await chromium.launch(launchOptions);
 try{
  const page=await browser.newPage({viewport:{width:1100,height:760}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>window.__vt_pending=true);
  await page.goto(gameURL('survivors.html?test'));
  await page.waitForFunction(()=>window.__phaserReady);
  const results=await page.evaluate(()=>{
   const s=__survivorTest.scene,out={};
   const prepare=(type,positions=[])=>{
    s.starter=type;s.start();s.obstacles=[];s.spawnTimer=999;s.enemies=[];s.player.x=960;s.player.y=960;s.expansion.facing={x:1,y:0};s.shield=false;
    const enemies=positions.map(x=>{const e=s.spawn('bat',x,960);e.hp=e.maxHp=100;return e;});
    s.expansion.dash();s.expansion.move(.35,1,0);
    return enemies;
   };
   let enemies=prepare('cat',[1110]);out.cat={style:s.creatures.elements.dashStyle,hp:enemies[0].hp,inv:s.player.inv};
   enemies=prepare('owl',[1210]);out.owl={style:s.creatures.elements.dashStyle,hp:enemies[0].hp,marked:enemies[0].markUntil>s.elapsed};
   enemies=prepare('beast',[1010]);out.beast={style:s.creatures.elements.dashStyle,hp:enemies[0].hp};
   prepare('frog');out.frog={style:s.creatures.elements.dashStyle,shield:s.shield,inv:s.player.inv};const frogHp=s.player.hp;s.encounters.damage(5,'test');out.frog.blocked=s.player.hp===frogHp&&!s.shield;
   enemies=prepare('mouse',[1140,1170]);out.mouse={style:s.creatures.elements.dashStyle,helpers:s.creatures.helpers.length};s.creatures.update(.3);out.mouse.hit=enemies.some(e=>e.hp<100);
   enemies=prepare('mole',[1070]);out.mole={style:s.creatures.elements.dashStyle,strike:s.creatures.strikes.find(a=>a.source==='mole')?.time};s.creatures.update(.46);out.mole.hit=enemies[0].hp<100&&s.creatures.strikes.length===0;
   enemies=prepare('bear',[1100]);out.bear={style:s.creatures.elements.dashStyle,hp:enemies[0].hp,stun:enemies[0].stun};
   for(const type of ['salamander','spider','storm']){prepare(type,[1130]);out[type]={style:s.creatures.elements.dashStyle,zones:s.creatures.elements.zones.length,links:s.creatures.elements.links.length};}
   s.starter='cat';s.start();s.obstacles=[];s.player.x=960;s.player.y=960;s.expedition.release('bear',960,960);s.expedition.capture(s.expedition.captureBody('bear'),'bear',2.5);out.recruit=s.creatures.elements.dashStyle;
   return out;
  });
  for(const type of ['cat','owl','beast','frog','mouse','mole','bear','salamander','spider','storm'])assert.equal(results[type].style,type);
  assert(results.cat.hp<100&&results.cat.inv===0);
  assert(results.owl.hp<100&&results.owl.marked);
  assert(results.beast.hp<100);
  assert(results.frog.shield&&results.frog.inv===0&&results.frog.blocked);
  assert.equal(results.mouse.helpers,2);assert(results.mouse.hit);
  assert.equal(results.mole.strike,.45);assert(results.mole.hit);
  assert(results.bear.hp<100&&results.bear.stun>=.5);
  assert(results.salamander.zones>0&&results.spider.zones>0&&results.storm.links>0);
  assert.equal(results.recruit,'bear');
  await page.evaluate(()=>{const s=__survivorTest.scene;s.starter='bear';s.start();s.obstacles=[];s.player.x=960;s.player.y=960;s.expansion.facing={x:1,y:0};s.spawn('bat',1100,960);s.expansion.dash();s.expansion.move(.35,1,0);s.draw();});
  fs.mkdirSync('output/dash-abilities',{recursive:true});await page.screenshot({path:'output/dash-abilities/bear.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS',results);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
