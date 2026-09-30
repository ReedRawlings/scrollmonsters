const assert=require('node:assert/strict');
const fs=require('node:fs');
const {run}=require('./survivor-test-utils.cjs');
run('enemy variants, mage spreads, gladiator axe/spin, ally separation and cleanup',async page=>{
 const result=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.obstacles=[];const rand=s.rand;
  const spawn=(type,roll,x=s.player.x+200,y=s.player.y)=>{s.rand=()=>roll;const e=s.spawn(type,x,y);s.rand=rand;return e;};
  const basic=spawn('bat',.8),forest=spawn('bat',.049999),boundary=spawn('bat',.05),energy=spawn('bat',.059999),normal=spawn('bat',.06);
  const stats={basic:[basic.hp,basic.speed,basic.contactDamage||7],forest:[forest.hp,forest.speed,forest.contactDamage],energy:[energy.hp,energy.speed,energy.contactDamage],boundary:boundary.variant,normal:normal.variant};
  const orange=spawn('owl',.05),black=spawn('owl',.049999);
  s.encounters.bullets=[];Object.assign(orange,{phase:'shoot',clock:0,aim:0});s.encounters.updateShooter(orange,0);
  const one=s.encounters.bullets.length;Object.assign(black,{phase:'shoot',clock:0,aim:0});s.encounters.updateShooter(black,0);
  const shots=s.encounters.bullets.map(b=>({source:b.source,texture:b.sprite.texture.key,angle:Math.atan2(b.dy,b.dx)}));
  const red=spawn('beast',.5),green=spawn('beast',.5);green.elite=true;
  const gladiator=spawn('bear',.5,s.player.x+60);s.player.inv=0;gladiator.clock=0;s.creatures.enemy(gladiator,0);const warning=gladiator.phase,hp=s.player.hp;
  s.creatures.enemy(gladiator,0);const warningSafe=s.player.hp===hp;gladiator.clock=0;s.creatures.enemy(gladiator,0);const hit=s.player.hp,spin=gladiator.phase;s.player.inv=0;s.creatures.enemy(gladiator,.2);const once=s.player.hp===hit;
  s.mode='paused';const before=gladiator.clock;s.tick(.3);const paused=gladiator.clock===before;s.mode='playing';
  s.draw();const art={red:red.sprite.texture.key,green:green.sprite.texture.key,ratio:green.sprite.scaleX/red.sprite.scaleX,gladiator:gladiator.sprite.texture.key,axe:s.enemyAxes.some(a=>a.visible),cat:s.catSprite.texture.key};
  gladiator.hp=0;s.draw();const cleanup=s.enemyAxes.every(a=>!a.visible);
  // Dodging the windup prevents damage; a late entry into the live spin still hits once.
  const dodger=spawn('bear',.8,s.player.x+60);dodger.clock=0;s.player.inv=0;s.creatures.enemy(dodger,0);s.player.y+=200;dodger.clock=0;s.creatures.enemy(dodger,0);const dodged=s.player.hp===hit;s.player.y-=200;s.creatures.enemy(dodger,.1);const lateEntry=s.player.hp===hit-12;
  const old={x:dodger.x,y:dodger.y};spawn('bat',.8,dodger.x,dodger.y);s.separateEnemies(.5);const anchored=dodger.x===old.x&&dodger.y===old.y;
  const orb=s.encounters.bullets[0];s.encounters.bullets=[orb];orb.x=s.player.x;orb.y=s.player.y;s.player.inv=0;const orbHp=s.player.hp;s.encounters.update(0);const orbDamage=orbHp-s.player.hp;
  s.elapsed=360;const scaled=spawn('bat',.01),scaledBasic=spawn('bat',.8);const scaling=Math.abs(scaled.hp/scaledBasic.hp-1.25)<1e-9&&Math.abs(scaled.speed/scaledBasic.speed-1.25)<1e-9;

  // Threshold coverage across 10,000 evenly spaced draws, with existing spawn caps preserved.
  const counts={};for(let i=0;i<10000;i++){const e={type:'bat',hp:4,maxHp:4,speed:68};s.rand=()=>i/10000;SurvivorEnemies.decorate(s,e);counts[e.variant]=(counts[e.variant]||0)+1;}s.rand=rand;
  s.start();const reset=s.enemies.length===0&&s.enemyAxes.every(a=>!a.visible);
  return {stats,one,shots,warning,warningSafe,spin,hit,once,paused,art,cleanup,counts,reset,dodged,lateEntry,anchored,orbDamage,scaling};
 });
 assert.deepEqual(result.stats.basic,[4,68,7]);assert.deepEqual(result.stats.forest,[5,85,8.75]);assert.deepEqual(result.stats.energy,[8,68,14]);assert.equal(result.stats.boundary,'energyGolem');assert.equal(result.stats.normal,'golem');
 assert.equal(result.one,1);assert.equal(result.shots.length,4);assert(result.shots.every(b=>b.source==='mage_orb'&&b.texture==='mageOrb'));assert(Math.abs(result.shots[1].angle+.22)<1e-9);assert(Math.abs(result.shots[3].angle-.22)<1e-9);
 assert.equal(result.warning,'slam');assert(result.warningSafe);assert.equal(result.spin,'spin');assert.equal(result.hit,28);assert(result.once&&result.paused&&result.cleanup&&result.reset);assert(result.dodged&&result.lateEntry&&result.anchored&&result.scaling);assert.equal(result.orbDamage,6);
 assert.deepEqual(result.art,{red:'demonRed',green:'demonGreen',ratio:2,gladiator:'gladiator',axe:true,cat:'cat'});assert.deepEqual(result.counts,{forestGolem:500,energyGolem:100,golem:9400});
 // Showcase all artwork in the actual game, including a spinning axe and mage projectiles.
 await page.evaluate(()=>{const s=__survivorTest.scene;s.start();s.obstacles=[];s.spawnTimer=999;s.player.fire=999;s.player.inv=999;s.cat.attack=999;
 const rand=s.rand;const rows=[['bat',.8,-240,-110],['bat',.01,-120,-110],['bat',.055,0,-110],['beast',.8,120,-110],['beast',.8,250,-110],['owl',.8,-220,100],['owl',.01,-80,100],['bear',.8,170,100]];
 rows.forEach(([type,r,x,y],i)=>{s.rand=()=>r;const e=s.spawn(type,s.player.x+x,s.player.y+y);if(i===4)e.elite=true;if(type==='bear'){e.phase='spin';e.clock=.45;}if(type==='owl'){e.phase='shoot';e.clock=0;e.aim=-Math.PI/2;s.encounters.updateShooter(e,0);}e.clock=type==='bear'?.45:999;});s.rand=rand;s.encounters.bullets.forEach(b=>{b.x+=b.dx*b.speed*.4;b.y+=b.dy*b.speed*.4;});s.draw();});
 await page.waitForTimeout(200);fs.mkdirSync('output/enemy-variety',{recursive:true});await page.screenshot({path:'output/enemy-variety/showcase.png'});
 console.log(JSON.stringify(result));
});
