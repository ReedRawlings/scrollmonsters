const assert=require('node:assert/strict'),fs=require('node:fs');
const {run}=require('./survivor-test-utils.cjs');
run('summoners, minion caps, sparse Hunters, locked aim and reset',async page=>{
 const r=await page.evaluate(()=>{
  const s=__survivorTest.scene,api=SurvivorEnemies;const setup=()=>{s.start();s.obstacles=[];s.spawnTimer=999;s.player.fire=999;s.cat.attack=999;s.player.inv=999;s.cameras.main.setScroll(s.player.x-550,s.player.y-380);};setup();
  const make=(variant)=>{const e=s.spawn('shaman',s.player.x+220,s.player.y);e.variant=variant;return e;};
  const cast=e=>{e.clock=0;api.update(s,e,0);const warned=e.phase==='summon'&&(e.summonPoints?.length||0)>0;e.clock=0;api.update(s,e,0);return warned;};
  const yellow=make('shamanYellow'),warning=cast(yellow);const first=s.enemies.filter(e=>e.summonedBy===yellow.summonerId);cast(yellow);cast(yellow);const ownerCap=s.enemies.filter(e=>e.summonedBy===yellow.summonerId).length;
  const green=make('shamanGreen');cast(green);const greenTypes=s.enemies.filter(e=>e.summonedBy===green.summonerId).map(e=>e.type);
  const blue=make('shamanBlue');cast(blue);const blueChildren=s.enemies.filter(e=>e.summonedBy===blue.summonerId);const damageRatio=blueChildren[0].contactDamage/first[0].contactDamage;
  cast(green);cast(blue);const blocked=make('shamanYellow');cast(blocked);const global=s.enemies.filter(e=>e.summonedBy).length;
  const pauseClock=blue.clock;s.mode='paused';s.tick(3);const paused=blue.clock===pauseClock;s.mode='playing';
  setup();const dying=make('shamanYellow');dying.clock=0;api.update(s,dying,0);dying.hp=0;s.tick(.1);const cancelled=!s.enemies.some(e=>e.summonedBy);
  setup();const crowded=make('shamanBlue');s.enemyCap=2;cast(crowded);const cap=s.enemies.length;s.enemyCap=150;
  setup();const sh=make('shamanYellow');sh.clock=0;api.update(s,sh,0);s.obstacles=sh.summonPoints.map(p=>({...p,r:35}));sh.clock=0;api.update(s,sh,0);const solid=!s.enemies.some(e=>e.summonedBy);
  setup();const h=s.spawn('hunter',s.player.x+300,s.player.y);h.clock=0;api.update(s,h,0);const aimed=h.phase==='hunterAim';s.player.y+=20;h.clock=.5;api.update(s,h,0);const tracked=h.aim;h.clock=.39;api.update(s,h,0);const locked=h.aimLocked;s.player.y+=100;h.clock=.1;api.update(s,h,0);const steady=h.aim===tracked;h.clock=0;api.update(s,h,0);const arrow=s.encounters.bullets[0];const shot={count:s.encounters.bullets.length,source:arrow.source,speed:arrow.speed,texture:arrow.sprite.texture.key,reload:h.clock};
  arrow.x=s.player.x;arrow.y=s.player.y;s.player.inv=0;const hp=s.player.hp;s.encounters.update(0);const arrowDamage=hp-s.player.hp;
  h.x=s.player.x+900;h.clock=0;const x=h.x;api.update(s,h,.5);const approaches=h.x<x&&h.phase==='seek';
  setup();const covered=s.spawn('hunter',s.player.x+300,s.player.y);covered.clock=0;s.obstacles=[{x:s.player.x+150,y:s.player.y,r:70}];api.update(s,covered,.1);const lineOfSight=covered.phase==='seek';
  setup();s.elapsed=120;const rand=s.rand;s.rand=()=>.001;const chosen=api.waveType(s);const rare=s.spawn('hunter',s.player.x+300,s.player.y);const aliveCap=api.waveType(s)===null;rare.hp=0;const cooldown=api.waveType(s)===null;s.elapsed=165;const returns=api.waveType(s)==='hunter';s.rand=()=>.02;s.elapsed=200;const summoner=api.waveType(s);s.spawn('shaman',s.player.x+200,s.player.y);const summonCooldown=api.waveType(s)===null;s.elapsed=570;const finale=api.waveType(s)===null;s.rand=rand;
  setup();const reset=s.enemies.length===0&&s.nextHunterAt===120&&s.nextShamanAt===90&&s.summonerId===0;
  return {warning,first:first.map(e=>e.type),ownerCap,greenTypes,blueTypes:blueChildren.map(e=>e.type),damageRatio,global,paused,cancelled,cap,solid,aimed,locked,steady,shot,arrowDamage,approaches,lineOfSight,chosen,aliveCap,cooldown,returns,summoner,summonCooldown,finale,reset};
 });
 assert(r.warning);assert.deepEqual(r.first,['skeleton','skeleton']);assert.equal(r.ownerCap,4);assert.deepEqual(r.greenTypes,['skeleton','skeleton']);assert.deepEqual(r.blueTypes,['lion','lion']);assert.equal(r.damageRatio,2);assert.equal(r.global,12);assert(r.paused&&r.cancelled&&r.solid);assert.equal(r.cap,2);
 assert(r.aimed&&r.locked&&r.steady);assert.deepEqual(r.shot,{count:1,source:'hunter_arrow',speed:420,texture:'hunterArrow',reload:3.8});assert.equal(r.arrowDamage,80);assert(r.approaches&&r.lineOfSight);assert.equal(r.chosen,'hunter');assert(r.aliveCap&&r.cooldown&&r.returns);assert.equal(r.summoner,'shaman');assert(r.summonCooldown&&r.finale&&r.reset);
 await page.evaluate(()=>{const s=__survivorTest.scene;s.start();s.obstacles=[];s.player.fire=999;s.cat.attack=999;s.player.inv=999;s.spawnTimer=999;s.cameras.main.setScroll(s.player.x-550,s.player.y-380);
 for(const [i,variant] of ['shamanYellow','shamanGreen','shamanBlue'].entries()){const e=s.spawn('shaman',s.player.x-240+i*230,s.player.y-130);e.variant=variant;e.clock=0;SurvivorEnemies.update(s,e,0);e.clock=0;SurvivorEnemies.update(s,e,0);e.clock=0;SurvivorEnemies.update(s,e,0);}
 const h=s.spawn('hunter',s.player.x+260,s.player.y+130);h.clock=0;SurvivorEnemies.update(s,h,0);h.clock=.3;SurvivorEnemies.update(s,h,0);s.draw();});
 await page.waitForTimeout(200);fs.mkdirSync('output/summoners',{recursive:true});await page.screenshot({path:'output/summoners/showcase.png'});console.log(r);
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
 const phone=await page.evaluate(()=>{const s=__survivorTest.scene;s.start();s.obstacles=[];s.cameras.main.setScroll(s.player.x-s.cameras.main.width/2,s.player.y-s.cameras.main.height/2);const e=s.spawn('hunter',s.player.x+500,s.player.y);e.clock=0;let outsideAim=false;for(let i=0;i<600&&!s.encounters.bullets.length;i++){e.clock-=1/60;SurvivorEnemies.update(s,e,1/60);if(e.phase==='hunterAim'&&!SurvivorEnemies.visible(s,e))outsideAim=true;}s.draw();return {fired:s.encounters.bullets.length===1,outsideAim,inView:SurvivorEnemies.visible(s,e),distance:Math.abs(e.x-s.player.x)};});assert(phone.fired&&phone.inView&&!phone.outsideAim);await page.waitForTimeout(100);await page.screenshot({path:'output/summoners/phone.png'});console.log({phone});
});
