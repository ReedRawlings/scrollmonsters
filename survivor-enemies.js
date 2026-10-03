// Enemy identities are separate from creature roles: recruitment and ally art stay intact.
(() => {
  const A='assets/Ninja Adventure - Asset Pack/';
  const textures={shamanYellow:'assets/Enemies/shaman_yellow.png',shamanGreen:'assets/Enemies/shaman_green.png',shamanBlue:'assets/Enemies/shaman_blue.png',hunter:A+'Actor/Characters/Hunter/SpriteSheet.png',skeleton:A+'Actor/Characters/Skeleton/SpriteSheet.png',golem:'assets/Enemies/golem.png',forestGolem:'assets/Enemies/golem_forest.png',energyGolem:'assets/Enemies/golem_energy.png',demonRed:'assets/Enemies/DemonRed/SpriteSheet.png',demonGreen:'assets/Enemies/DemonGreen/SpriteSheet.png',mageOrange:'assets/Enemies/NinjaMageOrange/SpriteSheet.png',mageBlack:'assets/Enemies/NinjaMageBlack/SpriteSheet.png',gladiator:A+'Actor/Characters/RedGladiator/SpriteSheet.png'};
  const direction=(x,y)=>Math.abs(x)>Math.abs(y)?(x<0?2:3):(y<0?1:0);
  window.SurvivorEnemies={
    stats:{shaman:{hp:180,speed:52,r:12,scale:3},hunter:{hp:120,speed:65,r:11,scale:3},skeleton:{hp:50,speed:72,r:10,scale:2.8},lion:{hp:100,speed:80,r:12,scale:2.8}},
    textureFor(type){return type==='shaman'?'shamanYellow':type;},
    reset(s){s.nextShamanAt=90;s.nextHunterAt=120;s.summonerId=0;},
    spawnUnlocked(s,type){return !s.isExpedition||s.elapsed>=({beast:60,owl:120,bear:180}[type]||0);},
    waveType(s){
      if(s.elapsed<90||s.elapsed>=1140||s.encounters?.bossPressure())return null;
      const alive=s.enemies.filter(e=>e.hp>0),roll=s.rand();
      if(roll<.005&&s.elapsed>=s.nextHunterAt&&!alive.some(e=>e.type==='hunter'))return 'hunter';
      if(roll>=.005&&roll<.035&&s.elapsed>=s.nextShamanAt&&alive.filter(e=>e.type==='shaman').length<2)return 'shaman';
      return null;
    },
    preload(s){s.load.spritesheet('lion',A+'Actor/Animals/Lion/SpriteSheetYellow.png',{frameWidth:16,frameHeight:23});s.load.image('hunterArrow',A+'FX/Projectile/Arrow.png');for(const [key,path] of Object.entries(textures))s.load.spritesheet(key,path,{frameWidth:16,frameHeight:16});s.load.spritesheet('mageOrb',A+'FX/Projectile/EnergyBall.png',{frameWidth:16,frameHeight:16});s.load.image('enemyAxe',A+'Items/Weapons/Axe/SpriteInHand.png');},
    decorate(s,e){
      if(e.type==='shaman'){s.bestiary?.see('shaman');e.variant=['shamanYellow','shamanGreen','shamanBlue'][Math.floor(s.rand()*3)];e.summonerId=++s.summonerId;e.contactDamage=50;e.clock=2;s.nextShamanAt=s.elapsed+25;}
      if(e.type==='hunter'){e.variant='hunter';e.contactDamage=50;e.clock=1;s.nextHunterAt=s.elapsed+45;}
      if(e.type==='skeleton'||e.type==='lion'){e.variant=e.type;e.contactDamage=e.type==='lion'?100:50;}

      if(e.type==='bat'){const roll=s.rand();e.variant=roll<.05?'forestGolem':roll<.06?'energyGolem':'golem';if(e.variant==='forestGolem'){e.hp*=1.25;e.maxHp*=1.25;e.speed*=1.25;e.contactDamage=70*1.25;}else if(e.variant==='energyGolem'){e.elite=true;e.hp*=2;e.maxHp*=2;e.contactDamage=140;}}
      if(e.type==='owl')e.variant=s.rand()<.05?'mageBlack':'mageOrange';
      if(e.type==='beast')e.variant='demonRed';
      if(e.type==='bear')e.variant='gladiator';
    },
    identity(e){return e.type==='beast'&&e.elite?'demonGreen':e.type==='bat'&&e.elite?'energyGolem':e.variant||e.type;},
    clearShot(s,e,x=s.player.x,y=s.player.y){
      const d=Math.hypot(x-e.x,y-e.y),steps=Math.ceil(d/12);
      for(let i=1;i<steps;i++)if(s.blocked(e.x+(x-e.x)*i/steps,e.y+(y-e.y)*i/steps,4))return false;
      return true;
    },
    visible(s,e){const c=s.cameras.main,v=s.viewScroll();return e.x>v.x+24&&e.x<v.x+c.width-24&&e.y>v.y+24&&e.y<v.y+c.height-24;},
    approach(s,e,dt,desired){
      const p=s.player,dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
      if(d>desired||!this.visible(s,e)){const x=e.x,y=e.y;s.move(e,dx/d*e.speed*dt,dy/d*e.speed*dt);if(Math.hypot(e.x-x,e.y-y)<e.speed*dt*.3)s.move(e,-dy/d*e.speed*dt,dx/d*e.speed*dt);}
      return d;
    },
    summonRoom(s,e){const alive=s.enemies.filter(t=>t.hp>0);return Math.max(0,Math.min(4-alive.filter(t=>t.summonedBy===e.summonerId).length,12-alive.filter(t=>t.summonedBy).length,s.enemyCap-alive.length));},
    summonPoints(s,e){const points=[];for(let i=0;i<24&&points.length<Math.min(2,this.summonRoom(s,e));i++){const a=i*2.4,r=60+(i%3)*18,p={x:e.x+Math.cos(a)*r,y:e.y+Math.sin(a)*r};if(!s.blocked(p.x,p.y,18)&&Math.hypot(p.x-s.player.x,p.y-s.player.y)>90&&points.every(q=>Math.hypot(q.x-p.x,q.y-p.y)>35))points.push(p);}return points;},
    update(s,e,dt){
      if(e.type==='shaman'){
        if(e.phase==='summon'){
          if(e.clock<=0){const type=e.variant==='shamanBlue'?'lion':'skeleton';let count=0;
            for(const p of e.summonPoints||[]){if(!this.summonRoom(s,e))break;if(s.blocked(p.x,p.y,18)||Math.hypot(p.x-s.player.x,p.y-s.player.y)<=90)continue;const child=s.spawn(type,p.x,p.y);if(child){child.summonedBy=e.summonerId;count++;}}
            s.logEvent('summoned',{summoner:e.variant,creature:type,count});e.summonPoints=[];e.phase='seek';e.clock=6;
          }
        }else{const d=this.approach(s,e,dt,240);if(e.clock<=0&&d<500&&this.visible(s,e)){e.summonPoints=this.summonPoints(s,e);if(e.summonPoints.length){e.phase='summon';e.clock=1.2;}else e.clock=1;}}
        if(Math.hypot(e.x-s.player.x,e.y-s.player.y)<e.r+s.player.r)s.encounters.damage(50,e.variant+'_contact');return true;
      }
      if(e.type==='hunter'){
        const d=Math.hypot(e.x-s.player.x,e.y-s.player.y);
        if(e.phase==='hunterAim'){
          if(!this.visible(s,e)||d>650){e.phase='seek';e.clock=.5;return true;}
          if(!e.aimLocked){e.aim=Math.atan2(s.player.y-e.y,s.player.x-e.x);if(e.clock<=.4)e.aimLocked=true;}
          if(e.clock<=0){s.encounters.shoot(e,e.aim,420,'hunter_arrow');s.logEvent('hunter_fired');e.phase='seek';e.clock=3.8;}
        }else{
          const range=Math.min(420,s.cameras.main.width*.4,s.cameras.main.height*.4);this.approach(s,e,dt,range);
          const clear=this.clearShot(s,e);
          if(!clear&&d<=range){const a=Math.atan2(s.player.y-e.y,s.player.x-e.x)+Math.PI/2;s.move(e,Math.cos(a)*e.speed*dt,Math.sin(a)*e.speed*dt);}
          if(e.clock<=0&&d<560&&this.visible(s,e)&&clear){e.phase='hunterAim';e.clock=1.5;e.aimLocked=false;e.aim=Math.atan2(s.player.y-e.y,s.player.x-e.x);}
        }
        if(d<e.r+s.player.r)s.encounters.damage(50,'hunter_contact');return true;
      }
      return false;
    },
    draw(s){
      s.enemyAxes ||= [];for(const axe of s.enemyAxes)axe.setVisible(false);let index=0;
      for(const e of s.enemies){if(e.hp<=0||!e.variant)continue;const key=this.identity(e),dir=direction(s.player.x-e.x,s.player.y-e.y),spin=e.type==='bear'&&e.phase==='spin';
        const attacking=['windup','charge','shoot','slam','spin','summon','hunterAim'].includes(e.phase);
        const facing=spin?[0,2,1,3][Math.floor((.7-e.clock)*12)%4]:dir;
        e.sprite.setTexture(key).setFrame(e.type==='lion'?Math.floor(s.elapsed*8)%2:attacking?20+facing:4+Math.floor(s.elapsed*8)%4*4+dir).setFlipX(e.type==='lion'&&s.player.x<e.x);
        if(e.phase==='summon')for(const p of e.summonPoints||[]){s.fx.fillStyle(0xffa050,.15).fillCircle(p.x,p.y,20);s.fx.lineStyle(3,0xffa050,.9).strokeCircle(p.x,p.y,20);}
        if(e.phase==='hunterAim')s.fx.lineStyle(e.aimLocked?3:1, e.aimLocked?0xff6548:0xffd27a,.9).lineBetween(e.x,e.y,e.x+Math.cos(e.aim)*650,e.y+Math.sin(e.aim)*650);
        if(e.type==='beast')e.sprite.setScale(e.elite?7:3.5);
        if(e.type==='bear'){
          let axe=s.enemyAxes[index++];if(!axe){axe=s.add.sprite(0,0,'enemyAxe');s.enemyAxes.push(axe);}
          const angle=spin?(.7-e.clock)*Math.PI*6-Math.PI/2:e.phase==='slam'?-Math.PI/2:Math.atan2(s.player.y-e.y,s.player.x-e.x);
          const radius=spin?55:25;
          axe.setVisible(true).setScale(4).setPosition(e.x+Math.cos(angle)*radius,e.y+Math.sin(angle)*radius).setRotation(angle+Math.PI/2).setDepth(e.y+24);
          if(spin)s.fx.lineStyle(5,0xffbd70,.85).beginPath().arc(e.x,e.y,70,angle-1.4,angle).strokePath();
        }
      }
    }
  };
})();
