const assert=require('node:assert/strict');
const fs=require('node:fs');
const {run}=require('./survivor-test-utils.cjs');
run('directional spawning, recycling and movement',async page=>{
  const result=await page.evaluate(()=>{
    const s=__survivorTest.scene;s.start();s.obstacles=[];
    s.player.x=1800;s.player.y=1800;s.cameras.main.setScroll(1250,1420);
    s.enemies=[];
    for(let i=0;i<30;i++)s.spawn('bat',2000,1820+i);
    let crowded=0,invalid=0;const view=s.spawnView();
    for(let i=0;i<500;i++){const p=s.enemySpawnPoint();if(!p){invalid++;continue;}
      if(p.x>=view.left&&p.x<=view.right&&p.y>=view.top&&p.y<=view.bottom)invalid++;
      if(p.x>s.player.x&&p.y>s.player.y&&p.y-s.player.y<p.x-s.player.x)crowded++;
    }
    s.enemies=[];
    const ordinary=s.spawn('bat');ordinary.x=100;ordinary.y=100;ordinary.hp=1;
    const placed=s.spawn('bat',110,110),elite=s.spawn('beast');elite.elite=true;elite.x=120;elite.y=120;
    const visible=s.spawn('bat');visible.x=1800;visible.y=1800;
    const count=s.spawned,kills=s.kills;s.recycleTimer=0;s.recycleDistantEnemies(1);
    const recycled=ordinary.x!==100&&ordinary.hp===1&&s.spawned===count&&s.kills===kills;
    const protectedBodies=placed.x===110&&elite.x===120&&visible.x===1800;
    let edgeInvalid=0;
    for(const [x,y] of [[30,30],[s.worldSize-30,30],[30,s.worldSize-30],[s.worldSize-30,s.worldSize-30]]){
      s.player.x=x;s.player.y=y;s.cameras.main.setScroll(Math.max(0,Math.min(x-550,s.worldSize-1100)),Math.max(0,Math.min(y-380,s.worldSize-760)));
      for(let i=0;i<50;i++){const p=s.enemySpawnPoint();const v=s.spawnView();if(!p||s.blocked(p.x,p.y,20)||(p.x>=v.left&&p.x<=v.right&&p.y>=v.top&&p.y<=v.bottom))edgeInvalid++;}
    }
    s.obstacles=[{x:s.player.x,y:s.player.y,r:s.worldSize*2}];const blocked=s.enemySpawnPoint()===null;
    s.start();s.obstacles=[];s.enemies=[];s.player.x=1800;s.player.y=1800;s.keys.RIGHT.isDown=true;s.tick(.1);s.keys.RIGHT.isDown=false;
    const movement=s.player.x-1800;
    s.start();for(let i=0;i<600;i++){if(s.mode!=='playing')break;s.tick(1/60);}s.draw();
    return {crowded,invalid,recycled,protectedBodies,edgeInvalid,blocked,movement,state:JSON.parse(render_game_to_text())};
  });
  assert(result.crowded<10);assert.equal(result.invalid,0);assert(result.recycled&&result.protectedBodies&&result.blocked);assert.equal(result.edgeInvalid,0);assert(Math.abs(result.movement-15)<.001);
  fs.mkdirSync('output/swarm-spawning',{recursive:true});await page.waitForTimeout(150);await page.screenshot({path:'output/swarm-spawning/gameplay.png'});
  fs.writeFileSync('output/swarm-spawning/state.json',JSON.stringify(result,null,2));console.log({...result,state:undefined});
}).catch(e=>{console.error(e);process.exit(1)});
