(() => {
  'use strict';
  // Presentation only: the creature attack sheets in assets/fx/attacks (scripts/pixelcomposer/build_attacks.py).
  // Reads sim state and never writes it; ages use the sim clock so pauses freeze them. A sheet that isn't exported yet
  // reports has()===false and the sim keeps drawing its old effect.
  // Sheets are shown at a whole-number scale only: visible_w is the base gameplay width in sheet pixels, so the base
  // size lands exactly on the sheet's px (1 = authored at full on-screen size); upgrades may stretch it a little.
  const LIMITS={rumble:12,erupt:10,strike:12,web:12,snap:8};
  const AFTER=.3; // the rumble's last frame (cracks at the edge) fades out over this after the hit
  class SurvivorAttackFx {
    constructor(s){this.s=s;this.pools={};this.reset();s.events.once('shutdown',()=>this.destroy());}
    reset(){for(const pool of Object.values(this.pools))for(const sp of pool)sp.setVisible(false);this.eruptions=[];this.strikes=[];this.snaps=[];}
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
    coversRumble(a){return (a.source==='mole'||a.source==='mole_eruption')&&this.has('Mole_Rumble');}
    sprite(group,key,frame,x,y,{scale=1,depth=y,alpha=1}={}){
      const pool=this.pools[group]||(this.pools[group]=[]),i=this.counts[group]||0;if(i>=LIMITS[group])return null;this.counts[group]=i+1;
      const sp=pool[i]||(pool[i]=this.s.add.sprite(0,0,key)),m=this.meta(key);
      return sp.setTexture(key,this.s.juice.frameName(key,frame)).setOrigin(m.ax/m.fw,m.ay/m.fh).setPosition(x,y).setScale(scale).setAlpha(alpha).setDepth(depth).setVisible(true);
    }
    draw(){const s=this.s;this.counts={};for(const pool of Object.values(this.pools))for(const sp of pool)sp.setVisible(false);
      if(!s.juice.enabled){this.eruptions=[];this.strikes=[];this.snaps=[];return;}
      const now=s.elapsed;
      if(this.has('Mole_Rumble')){const n=this.meta('Mole_Rumble').n;this.eruptions=this.eruptions.filter(f=>now-f.at<AFTER);
        // Indexed by progress, so it fits the 1s strike, the 0.5s aftershock and the 0.45s dash alike.
        for(const a of s.creatures.strikes){if(!this.coversRumble(a))continue;const p=SurvivorWorld.near(s,a);
          this.sprite('rumble','Mole_Rumble',Math.min(n-1,Math.floor((1-a.time/a.total)*(n-1)+.001)),p.x,p.y,{scale:this.scaleFor('Mole_Rumble',a.r),depth:p.y-3});}
        for(const f of this.eruptions){const p=SurvivorWorld.near(s,f);
          this.sprite('erupt','Mole_Rumble',n-1,p.x,p.y,{scale:this.scaleFor('Mole_Rumble',f.r),depth:p.y-3,alpha:Math.max(0,1-(now-f.at)/AFTER)});}
      }else this.eruptions=[];
      if(this.has('Storm_Strike')){const m=this.meta('Storm_Strike'),hit=m.hit_frame||0,lead=hit/m.fps;
        this.strikes=this.strikes.filter(f=>hit+Math.floor((now-f.at)*m.fps)<m.n);
        for(const c of s.creatures.elements.casts){if(c.type!=='strike'||c.time>lead)continue;const p=SurvivorWorld.near(s,c);
          this.sprite('strike','Storm_Strike',Math.floor((lead-c.time)*m.fps),p.x,p.y,{scale:m.px||1,depth:p.y+40});}
        for(const f of this.strikes){const p=SurvivorWorld.near(s,f);
          this.sprite('strike','Storm_Strike',hit+Math.floor((now-f.at)*m.fps),p.x,p.y,{scale:m.px||1,depth:p.y+40});}
      }else this.strikes=[];
      if(this.has('Silk_Web')){const m=this.meta('Silk_Web'),[l0,l1]=m.land,[p0,p1]=m.loop_frames,[s0,s1]=m.snap,land=(l1-l0+1)/m.fps,len=p1-p0+1;
        for(const z of s.creatures.elements.zones){if(z.type!=='web')continue;const age=z.total-z.life,p=SurvivorWorld.near(s,z);
          const f=age<land?l0+Math.floor(age*m.fps):p0+Math.floor((age-land)*m.fps)%len;
          this.sprite('web','Silk_Web',f,p.x,p.y,{scale:this.webScale(z.r),depth:p.y-4,alpha:Math.min(1,z.life/.4)});}
        this.snaps=this.snaps.filter(f=>s0+Math.floor((now-f.at)*m.fps)<=s1);
        for(const f of this.snaps){const p=SurvivorWorld.near(s,f);
          this.sprite('snap','Silk_Web',s0+Math.floor((now-f.at)*m.fps),p.x,p.y,{scale:this.webScale(f.r),depth:p.y-4});}
      }else this.snaps=[];
    }
    summary(){return {missing:['Mole_Rumble','Storm_Strike','Silk_Web'].filter(k=>!this.has(k)),eruptions:this.eruptions.length,strikes:this.strikes.length,snaps:this.snaps.length};}
    destroy(){for(const pool of Object.values(this.pools))for(const sp of pool)sp.destroy();this.pools={};}
  }
  window.SurvivorAttackFx=SurvivorAttackFx;
})();
