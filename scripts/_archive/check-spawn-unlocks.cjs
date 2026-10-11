const assert=require('node:assert/strict');
const fs=require('node:fs');
const {run}=require('./survivor-test-utils.cjs');
run('staggered enemy introductions and den defender gates',async page=>{
 const result=await page.evaluate(()=>{
  const s=__survivorTest.scene;s.start();s.obstacles=[];s.nextShamanAt=s.nextHunterAt=Infinity;s.encounters.nestsActive=true;
  const originalRand=s.rand,out={pools:{},dens:{}};
  for(const time of [0,20,59.999,60,119.999,120,179.999,180,570,1140]){
   s.elapsed=time;const pool=new Set();for(let i=0;i<1000;i++){s.rand=()=>i/1000;pool.add(s.expedition.enemyType());}out.pools[time]=[...pool].sort();
  }
  s.rand=originalRand;
  for(const [type,time] of [['beast',60],['owl',120],['bear',180]]){
   const n={kind:'nest',type,activeAt:30,x:s.player.x+200,y:s.player.y,clock:0,spawnCount:0};
   s.elapsed=time-.001;const before=s.enemies.length;s.encounters.updateNest(n,.1);const early=s.enemies.length-before;
   s.elapsed=time;s.encounters.updateNest(n,.1);out.dens[type]={early,unlocked:s.enemies.length-before};
  }
  s.start();s.obstacles=[];s.catActive=false;s.player.fire=999;s.elapsed=180;s.spawnTimer=999;
  for(const [i,type] of ['bat','beast','owl','bear'].entries())s.spawn(type,s.player.x-180+i*120,s.player.y-100);
  s.draw();return out;
 });
 for(const t of [0,20,59.999])assert.deepEqual(result.pools[t],['bat']);
 for(const t of [60,119.999])assert.deepEqual(result.pools[t],['bat','beast']);
 for(const t of [120,179.999])assert.deepEqual(result.pools[t],['bat','beast','mole','owl']);
 assert.deepEqual(result.pools[180],['bat','bear','beast','mole','owl']);
 for(const t of [570,1140])assert.deepEqual(result.pools[t],['bat','beast','owl']);
 for(const d of Object.values(result.dens))assert.deepEqual(d,{early:0,unlocked:1});
 fs.mkdirSync('output/spawn-unlocks',{recursive:true});await page.waitForTimeout(400);await page.screenshot({path:'output/spawn-unlocks/gameplay.png'});console.log(result);
}).catch(e=>{console.error(e);process.exitCode=1;});
