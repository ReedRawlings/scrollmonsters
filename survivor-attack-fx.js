(() => {
  'use strict';
  // Presentation only: the creature attack sheets in assets/fx/attacks (scripts/pixelcomposer/build_attacks.py).
  // Reads sim state and never writes it; ages use the sim clock so pauses freeze them. A sheet that isn't exported yet
  // reports has()===false and the sim keeps drawing its old effect.
  // Sheets are shown at a whole-number scale only: visible_w is the base gameplay width in sheet pixels, so the base
  // size lands exactly on the sheet's px (1 = authored at full on-screen size); upgrades may stretch it a little.
  const LIMITS={rumble:12,erupt:10,strike:12,web:12,snap:8,fire:16,swipe:8,bite:24,arc:96,zap:24,cross:64,roots:160,snare:8,danger:24,wisp:12,puff:48,wispfx:24};
  // frame indices add 1e-6 so a frame boundary (e.g. 0.05s x 20fps = 0.9999...) doesn't hold a frame one tick too long
  const AFTER=.3; // the rumble's last frame (cracks at the edge) fades out over this after the hit
  class SurvivorAttackFx {
    constructor(s){this.s=s;this.pools={};this.reset();s.events.once('shutdown',()=>this.destroy());}
    reset(){for(const pool of Object.values(this.pools))for(const sp of pool)sp.setVisible(false);this.eruptions=[];this.strikes=[];this.snaps=[];this.swipes=[];this.bites=[];this.zaps=[];this.crosses=new Map();this.puffs=[];this.wispFx=[];this.puffAt=0;}
    has(key){return this.s.juice.enabled&&!!FX_SHEETS[key]&&this.s.textures.exists(key);}
    meta(key){return FX_SHEETS[key];}
    scaleFor(key,r){return 2*r/this.meta(key).visible_w;}
    // Mole: the rumble is the whole attack. It is indexed by wind-up progress, the hit lands on its last frame (the
    // cracks reach the edge), and erupt() holds that frame and fades it. Returns false so the sim falls back to its
    // burst while the sheet is missing.
    erupt(a){if(!this.has('Mole_Rumble'))return false;if(this.eruptions.length<LIMITS.erupt)this.eruptions.push({x:a.x,y:a.y,r:a.r,at:this.s.elapsed});if(!a.hostile)this.s.juice.jitter(2,120);else this.s.juice.jitter(3,180);return true;}
    // Storm Thunderhead strike: the bolt lands on the sheet's hit frame. The frames before it play over the end of the
    // cast's wind-up (indexed by the time left), so the hit frame coincides with the damage; the rest plays from the hit.
    strike(c){if(!this.has('Storm_Strike'))return false;if(this.strikes.length<LIMITS.strike)this.strikes.push({x:c.x,y:c.y,at:this.s.elapsed});this.s.juice.jitter(c.hostile?3:2,140);return true;}
    // Spider web: frames 0-9 land once, 10-25 loop for the zone's life (fading over its last 0.4s); a Tension Trap
    // burst plays the snap (26-33). Never below 1x; Wide Web upgrades stretch it a little. Wild webs keep their ring.
    coversWeb(){return this.has('Silk_Web');}
    snapWeb(z){if(!this.has('Silk_Web'))return false;if(this.snaps.length<LIMITS.snap)this.snaps.push({x:z.x,y:z.y,r:z.r,at:this.s.elapsed});return true;}
    webScale(r){return Math.max(1,this.scaleFor('Silk_Web',r));}
    // Salamander fire patch: frames 0-7 ignite once, 8-31 loop while the patch burns, fading over its last 0.4s.
    // The old elementFire sprite isn't made while this sheet exists; wild patches keep their ring.
    coversFire(){return this.has('Fire_Patch');}
    // Cat swipe: drawn facing east, flipped for targets on the left; never rotated. It follows the cat for its 0.3s.
    swipe(c,a,radius){if(!this.has('Cat_Swipe'))return false;if(this.swipes.length<LIMITS.swipe)this.swipes.push({c,flip:Math.cos(a)<0,scale:Math.max(1,radius/120),at:this.s.elapsed});return true;}
    // Mouse bite: starts one frame before the clamp so the jaws close right after the hit; follows the target.
    bite(t){if(!this.has('Mouse_Bite'))return false;if(this.bites.length<LIMITS.bite)this.bites.push({t,x:t.x,y:t.y,at:this.s.elapsed});return true;}
    // Storm chain lightning: each jump is laid with 32 px bolt pieces from the sheet (the nearest of five drawn
    // directions, mirrored for the other quadrants, never rotated), spaced so the last one ends on the target; every
    // other piece is turned 180 degrees (both flips, anchored at its end) so neighbours don't repeat. Each hit target gets
    // the zap. Pieces and zap play by the link's age.
    coversArc(){return this.has('Storm_Arc');}
    zap(t){if(!this.has('Storm_Arc'))return false;if(this.zaps.length<LIMITS.zap)this.zaps.push({x:t.x,y:t.y,at:this.s.elapsed});return true;}
    // Bear cross: the centre piece plays when the paw lands; arm pieces (48 px each) are dropped along the four arms as the
    // sim's front reaches them and each plays its own 10 frames. Reach upgrades add pieces; nothing is stretched.
    coversCross(){return this.has('Cross_Slam');}
    coversRumble(a){return (a.source==='mole'||a.source==='mole_eruption')&&this.has('Mole_Rumble');}
    // Bamboo roots (party Bamboo's line, Panda's cross): 48x64 pieces laid every piece_len px from the target outward,
    // each starting 0.05s after the one before; erupt, loop while the field lasts, retract over its last 0.3s.
    coversRoots(){return this.has('Bamboo_Spike');}
    // Bamboo enemy's snare: replaces the silk on webs a Bamboo cast; same erupt / loop / retract timing.
    coversSnare(z){return z.src==='bamboo'&&this.has('Bamboo_Snare');}
    // Enemy telegraphs: Danger_Mark under the target, indexed by wind-up progress (frame = progress * (n-1)), shown at a
    // whole-number scale picked from the radius. Replaces the old orange rings and clock arcs.
    coversDanger(){return this.has('Danger_Mark');}
    // Spirit's orbiting wisps: the flame steps down l -> m -> s as its hits run out, plays spawn when it appears, drops
    // a trail puff every 0.05s; block / hit / fade are one-shot sections played where they happen.
    coversWisp(){return this.has('Spirit_Wisp');}
    wispEvent(kind,x,y,follow){if(!this.coversWisp())return false;if(this.wispFx.length<LIMITS.wispfx)this.wispFx.push({kind,x,y,follow,at:this.s.elapsed});return true;}
    wispBlock(p,shot){return this.wispEvent('block',(p.x+shot.x)/2,(p.y+shot.y)/2);}
    wispHit(e){return this.wispEvent('hit',e.x,e.y,e);}
    wispFade(p){return this.wispEvent('fade',p.x,p.y);}
    phased(m,age,life){const [e0,e1]=m.erupt,[l0,l1]=m.loop_frames,[r0,r1]=m.retract,er=(e1-e0+1)/m.fps,rt=(r1-r0+1)/m.fps;
      if(life<rt)return r0+Math.min(r1-r0,Math.floor((rt-life)*m.fps+1e-6));
      return age<er?e0+Math.floor(age*m.fps+1e-6):l0+Math.floor((age-er)*m.fps+1e-6)%(l1-l0+1);}
    sprite(group,key,frame,x,y,{scale=1,depth=y,alpha=1,flip=false,flipY=false,ox,oy}={}){
      const pool=this.pools[group]||(this.pools[group]=[]),i=this.counts[group]||0;if(i>=LIMITS[group])return null;this.counts[group]=i+1;
      const sp=pool[i]||(pool[i]=this.s.add.sprite(0,0,key)),m=this.meta(key);
      const ax=ox??m.ax,ay=oy??m.ay;
      return sp.setTexture(key,this.s.juice.frameName(key,frame)).setFlipX(flip).setFlipY(flipY).setOrigin(flip?1-ax/m.fw:ax/m.fw,flipY?1-ay/m.fh:ay/m.fh).setPosition(x,y).setScale(scale).setAlpha(alpha).setDepth(depth).setVisible(true);
    }
    draw(){const s=this.s;this.counts={};for(const pool of Object.values(this.pools))for(const sp of pool)sp.setVisible(false);
      if(!s.juice.enabled){this.eruptions=[];this.strikes=[];this.snaps=[];this.swipes=[];this.bites=[];this.zaps=[];this.crosses.clear();return;}
      const now=s.elapsed;
      if(this.has('Mole_Rumble')){const n=this.meta('Mole_Rumble').n;this.eruptions=this.eruptions.filter(f=>now-f.at<AFTER);
        // Indexed by progress, so it fits the 1s strike, the 0.5s aftershock and the 0.45s dash alike.
        for(const a of s.creatures.strikes){if(!this.coversRumble(a)||(a.hostile&&this.coversDanger()))continue;const p=SurvivorWorld.near(s,a);
          this.sprite('rumble','Mole_Rumble',Math.min(n-1,Math.floor((1-a.time/a.total)*(n-1)+.001)),p.x,p.y,{scale:this.scaleFor('Mole_Rumble',a.r),depth:p.y-3});}
        for(const f of this.eruptions){const p=SurvivorWorld.near(s,f);
          this.sprite('erupt','Mole_Rumble',n-1,p.x,p.y,{scale:this.scaleFor('Mole_Rumble',f.r),depth:p.y-3,alpha:Math.max(0,1-(now-f.at)/AFTER)});}
      }else this.eruptions=[];
      if(this.has('Storm_Strike')){const m=this.meta('Storm_Strike'),hit=m.hit_frame||0,lead=hit/m.fps;
        this.strikes=this.strikes.filter(f=>hit+Math.floor((now-f.at)*m.fps+1e-6)<m.n);
        for(const c of s.creatures.elements.casts){if(c.type!=='strike'||c.time>lead)continue;const p=SurvivorWorld.near(s,c);
          this.sprite('strike','Storm_Strike',Math.floor((lead-c.time)*m.fps+1e-6),p.x,p.y,{scale:m.px||1,depth:p.y+40});}
        for(const f of this.strikes){const p=SurvivorWorld.near(s,f);
          this.sprite('strike','Storm_Strike',hit+Math.floor((now-f.at)*m.fps+1e-6),p.x,p.y,{scale:m.px||1,depth:p.y+40});}
      }else this.strikes=[];
      if(this.has('Silk_Web')){const m=this.meta('Silk_Web'),[l0,l1]=m.land,[p0,p1]=m.loop_frames,[s0,s1]=m.snap,land=(l1-l0+1)/m.fps,len=p1-p0+1;
        for(const z of s.creatures.elements.zones){if(z.type!=='web'||this.coversSnare(z))continue;const age=z.total-z.life,p=SurvivorWorld.near(s,z);
          const f=age<land?l0+Math.floor(age*m.fps+1e-6):p0+Math.floor((age-land)*m.fps+1e-6)%len;
          this.sprite('web','Silk_Web',f,p.x,p.y,{scale:this.webScale(z.r),depth:p.y-4,alpha:Math.min(1,z.life/.4)});}
        this.snaps=this.snaps.filter(f=>s0+Math.floor((now-f.at)*m.fps+1e-6)<=s1);
        for(const f of this.snaps){const p=SurvivorWorld.near(s,f);
          this.sprite('snap','Silk_Web',s0+Math.floor((now-f.at)*m.fps+1e-6),p.x,p.y,{scale:this.webScale(f.r),depth:p.y-4});}
      }else this.snaps=[];
      if(this.has('Fire_Patch')){const m=this.meta('Fire_Patch'),[i0,i1]=m.ignite,[l0,l1]=m.loop_frames,ign=(i1-i0+1)/m.fps,len=l1-l0+1;
        for(const z of s.creatures.elements.zones){if(z.type!=='fire')continue;const age=z.total-z.life,p=SurvivorWorld.near(s,z);
          const f=age<ign?i0+Math.floor(age*m.fps+1e-6):l0+Math.floor((age-ign)*m.fps+1e-6)%len;
          this.sprite('fire','Fire_Patch',f,p.x,p.y,{scale:Math.max(1,this.scaleFor('Fire_Patch',z.r)),depth:p.y,alpha:Math.min(1,z.life/.4)});}
      }
      if(this.has('Cat_Swipe')){const m=this.meta('Cat_Swipe');this.swipes=this.swipes.filter(w=>Math.floor((now-w.at)*m.fps+1e-6)<m.n);
        for(const w of this.swipes){const p=SurvivorWorld.near(s,w.c);
          this.sprite('swipe','Cat_Swipe',Math.floor((now-w.at)*m.fps+1e-6),p.x,p.y,{scale:w.scale,depth:p.y+30,flip:w.flip});}
      }else this.swipes=[];
      if(this.has('Mouse_Bite')){const m=this.meta('Mouse_Bite'),start=Math.max(0,(m.hit_frame||0)-1);
        this.bites=this.bites.filter(b=>start+Math.floor((now-b.at)*m.fps+1e-6)<m.n);
        for(const b of this.bites){if(b.t.hp>0){b.x=b.t.x;b.y=b.t.y;}const p=SurvivorWorld.near(s,b);
          this.sprite('bite','Mouse_Bite',start+Math.floor((now-b.at)*m.fps+1e-6),p.x,p.y,{depth:p.y+30});}
      }else this.bites=[];
      if(this.has('Storm_Arc')){const m=this.meta('Storm_Arc'),secs=m.sections,dirs=[0,1,2,3,4].map(k=>secs['dir'+k]);
        for(const l of s.creatures.elements.links){const age=.38-l.life,p0=SurvivorWorld.near(s,l),p1=SurvivorWorld.near(s,{x:l.tx,y:l.ty});
          const dx=p1.x-p0.x,dy=p1.y-p0.y,d=Math.hypot(dx,dy);if(d<4)continue;
          const k=Math.round(Math.atan2(Math.abs(dy),Math.abs(dx))*180/Math.PI/22.5),sec=dirs[k],fx=dx<0,fy=dy>0;
          const step=Math.hypot(sec.step[0],sec.step[1]),n=Math.max(1,Math.ceil(d/step)),gap=(d-step)/Math.max(1,n-1),ux=dx/d,uy=dy/d;
          const f=sec.frames[0]+Math.min(sec.frames[1]-sec.frames[0],Math.floor(age*m.fps+1e-6));
          for(let i=0;i<n;i++){const turn=i%2===1,o=n>1?i*gap:0,end=[sec.start[0]+sec.step[0],sec.start[1]+sec.step[1]];
            const x=p0.x+ux*o,y=p0.y+uy*o,[ox,oy]=turn?end:sec.start; // both flips map the piece's end onto its start side
            this.sprite('arc','Storm_Arc',f,x,y,{depth:Math.max(p0.y,p1.y)+40,flip:turn?!fx:fx,flipY:turn?!fy:fy,ox,oy});}}
        const z=secs.zap;this.zaps=this.zaps.filter(t=>Math.floor((now-t.at)*m.fps+1e-6)<=z.frames[1]-z.frames[0]);
        for(const t of this.zaps){const p=SurvivorWorld.near(s,t);
          this.sprite('zap','Storm_Arc',z.frames[0]+Math.floor((now-t.at)*m.fps+1e-6),p.x,p.y,{depth:p.y+38,ox:z.anchor[0],oy:z.anchor[1]});}
      }else this.zaps=[];
      if(this.has('Cross_Slam')){const m=this.meta('Cross_Slam'),sec=m.sections,len=m.piece_len||48,half=len/2,life=(sec.across[1]-sec.across[0]+1)/m.fps;
        for(const a of s.creatures.strikes)if(a.shape==='cross'&&!this.crosses.has(a))this.crosses.set(a,{x:a.x,y:a.y,r:a.r,total:a.total,at:now-(a.total-a.time)});
        for(const [key,c] of this.crosses){const age=now-c.at,p=SurvivorWorld.near(s,c);
          if(age>c.total+life+.05){this.crosses.delete(key);continue;}
          const play=(range,t0,x,y,flip)=>{const f=Math.floor((age-t0)*m.fps+1e-6);if(f<0||f>range[1]-range[0])return;
            this.sprite('cross','Cross_Slam',range[0]+f,x,y,{depth:y-2,flip});};
          play(sec.centre,0,p.x,p.y,false);
          for(let d=len;d-half<c.r;d+=len){const t0=(d-half)/c.r*c.total;
            play(sec.across,t0,p.x+d,p.y,false);play(sec.across,t0,p.x-d,p.y,true);
            play(sec.down,t0,p.x,p.y+d,false);play(sec.down,t0,p.x,p.y-d,false);}}
      }else this.crosses.clear();
      if(this.has('Bamboo_Spike')){const m=this.meta('Bamboo_Spike'),gap=m.piece_len||26;
        for(const f of s.creatures.evolution?.roster?.fields||[]){if(f.kind!=='roots')continue;const p=SurvivorWorld.near(s,f),age=f.total-f.life;let i=0;
          const put=(d,x,y)=>{const t=age-d/gap*.05;if(t>=0)this.sprite('roots','Bamboo_Spike',this.phased(m,t,f.life),x,y,{depth:y,flip:i++%2===1});};
          if(f.shape==='cross'){put(0,p.x,p.y);for(let d=gap;d<=f.r;d+=gap){put(d,p.x+d,p.y);put(d,p.x-d,p.y);put(d,p.x,p.y-d);put(d,p.x,p.y+d);}}
          else {const c=Math.cos(f.angle||0),si=Math.sin(f.angle||0);for(let d=0;d<=f.r;d+=gap)put(d,p.x+c*d,p.y+si*d);}}
      }
      if(this.has('Bamboo_Snare')){const m=this.meta('Bamboo_Snare');
        for(const z of s.creatures.elements.zones){if(!this.coversSnare(z))continue;const p=SurvivorWorld.near(s,z);
          this.sprite('snare','Bamboo_Snare',this.phased(m,z.total-z.life,z.life),p.x,p.y,{depth:p.y});}
      }
      if(this.coversDanger()){const m=this.meta('Danger_Mark'),n=m.n,base=(m.visible_w||64)/2;
        const mark=(x,y,r,t)=>{const p=SurvivorWorld.near(s,{x,y});this.sprite('danger','Danger_Mark',Math.min(n-1,Math.floor(Math.max(0,t)*(n-1)+1e-6)),p.x,p.y,{scale:Math.max(1,Math.round(r/base)),depth:p.y-6});};
        for(const c of s.creatures.elements.casts)if(c.hostile)mark(c.x,c.y,c.r,1-c.time/c.total);
        for(const a of s.creatures.strikes)if(a.hostile&&a.shape!=='cross')mark(a.x,a.y,a.r,1-a.time/a.total);
        for(const e of s.enemies)if(e.type==='shaman'&&e.phase==='summon')for(const q of e.summonPoints||[])mark(q.x,q.y,20,1-e.clock/1.2);
      }
      if(this.coversWisp()){const m=this.meta('Spirit_Wisp'),sec=m.sections,ring=(s.creatures.evolution?.roster?.missiles||[]).filter(p=>p.source==='spirit'&&p.life>0);
        const at=(name,t)=>{const [a,b]=sec[name],f=Math.floor(t*m.fps+1e-6);return f>b-a?null:a+f;};
        const drop=now-this.puffAt>=.05;if(drop)this.puffAt=now;
        ring.forEach((p,k)=>{const q=SurvivorWorld.near(s,p),left=p.hitsLeft/p.st.hits;
          let f=p.age<(sec.spawn[1]-sec.spawn[0]+1)/m.fps?at('spawn',p.age):null;
          if(f===null){const [a,b]=sec[left>.6?'flame_l':left>.3?'flame_m':'flame_s'];f=a+(Math.floor(now*m.fps+1e-6)+k*3)%(b-a+1);}
          this.sprite('wisp','Spirit_Wisp',f,q.x,q.y,{depth:q.y+30});
          if(drop&&this.puffs.length<LIMITS.puff)this.puffs.push({x:p.x,y:p.y,at:now});});
        this.puffs=this.puffs.filter(u=>at('puff',now-u.at)!==null);
        for(const u of this.puffs){const q=SurvivorWorld.near(s,u);this.sprite('puff','Spirit_Wisp',at('puff',now-u.at),q.x,q.y,{depth:q.y+29});}
        this.wispFx=this.wispFx.filter(e=>at(e.kind,now-e.at)!==null);
        for(const e of this.wispFx){if(e.follow?.hp>0){e.x=e.follow.x;e.y=e.follow.y;}const q=SurvivorWorld.near(s,e);this.sprite('wispfx','Spirit_Wisp',at(e.kind,now-e.at),q.x,q.y,{depth:q.y+31});}
      }else{this.puffs=[];this.wispFx=[];}
    }
    summary(){return {missing:['Mole_Rumble','Storm_Strike','Silk_Web','Fire_Patch','Cat_Swipe','Mouse_Bite','Storm_Arc','Cross_Slam','Bamboo_Spike','Bamboo_Snare','Danger_Mark','Spirit_Wisp'].filter(k=>!this.has(k)),eruptions:this.eruptions.length,strikes:this.strikes.length,snaps:this.snaps.length,swipes:this.swipes.length,bites:this.bites.length,zaps:this.zaps.length,crosses:this.crosses.size};}
    destroy(){for(const pool of Object.values(this.pools))for(const sp of pool)sp.destroy();this.pools={};}
  }
  window.SurvivorAttackFx=SurvivorAttackFx;
})();
