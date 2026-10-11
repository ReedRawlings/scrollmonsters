const assert=require('node:assert/strict');
const fs=require('node:fs');
const {run}=require('./survivor-test-utils.cjs');
run('all damaging effects push consistently without bypassing walls or resistance',async page=>{
 const result=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.obstacles=[];s.spawnTimer=999;s.catActive=false;s.player.fire=999;
  const p=s.player,out={};
  const make=()=>{const e=s.spawn('bat',p.x+100,p.y);e.hp=e.maxHp=10000;e.speed=0;return e;};
  out.sources=['player','cat','owl','beast','mouse','mole','bear','salamander','spider','storm',...SurvivorEvolution.types].map(source=>{const e=make(),x=e.x;s.hit(e,10,source,{x:e.x,y:e.y});return {source,push:e.x-x,damage:10000-e.hp};});
  let e=make(),x=e.x;s.hit(e,10,'player',{x:e.x+3,y:e.y,dx:1,dy:0});out.projectile=e.x-x;
  e=make();e.x=p.x;e.y=p.y;s.aim={x:0,y:1};s.hit(e,10,'mole',e);out.overlap=e.y-p.y;
  e=make();x=e.x;s.obstacles=[{x:x+e.r+8,y:e.y,r:4}];s.hit(e,10,'cat',p);out.wall=e.x-x;out.blocked=s.blocked(e.x,e.y,e.r);s.obstacles=[];
  out.resistance=[];for(const props of [{elite:true},{type:'beast',phase:'charge'},{kind:'boss',hp:10000}]){e=make();Object.assign(e,props);x=e.x;s.hit(e,10,'cat',p);out.resistance.push(e.x-x);}
  e=make();e.enemyShield=true;x=e.x;s.hit(e,10,'cat',p);out.shield={push:e.x-x,hp:e.hp};
  e=make();x=e.x;s.upgrades.pull=1;s.hit(e,10,'cat',p);out.upgrade={push:e.x-x,stun:e.stun};s.upgrades.pull=0;
  // Exercise actual damage-over-time dispatch, with a target at the pool's center.
  s.enemies.forEach(e=>e.hp=0);e=make();x=e.x;s.creatures.elements.zone('fire',e.x,e.y,false);s.creatures.elements.update(.01);out.fireFirst=e.x-x;s.creatures.elements.update(.6);out.fireSecond=e.x-x;
  s.draw();return out;
 });
 for(const r of result.sources){assert.equal(r.push,16,r.source);assert(r.damage>0,r.source);}
 assert.equal(result.projectile,16);assert.equal(result.overlap,16);assert.equal(result.wall,4);assert.equal(result.blocked,false);
 assert.deepEqual(result.resistance,[0,0,0]);assert.deepEqual(result.shield,{push:0,hp:10000});assert.deepEqual(result.upgrade,{push:60,stun:.45});
 assert.equal(result.fireFirst,16);assert.equal(result.fireSecond,32);
 fs.mkdirSync('output/effect-knockback',{recursive:true});await page.waitForTimeout(100);await page.screenshot({path:'output/effect-knockback/gameplay.png'});console.log(result);
}).catch(e=>{console.error(e);process.exitCode=1;});
