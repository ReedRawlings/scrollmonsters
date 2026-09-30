(() => {
  'use strict';
  const MAX = 40, MERGE_MS = 150, MERGE_SPAN = 600, BURSTS = 8, DIGITS = 5, LIFE = 700, CRIT_LIFE = 900, RISE = 18, POP_MS = 120, FADE_MS = 250, DEPTH = 999999990;
  const WHITE = 0xffffff, GOLD = 0xffc41b, RED = 0xef5266;
  // World-space damage numbers from the NovelMix digit strip. Presentation only: never writes game state.
  // Every object is made once here (40 numbers x 5 digits) and reused; nothing is created per hit.
  class SurvivorDamageNumbers {
    constructor(juice){
      const s=juice.s;this.j=juice;this.adv=FX_SHEETS.Damage_Digits.adv;this.spawned=0;
      this.pool=Array.from({length:MAX},()=>{const box=s.add.container(0,0).setDepth(DEPTH).setVisible(false);
        const digits=Array.from({length:DIGITS},()=>{const im=s.add.image(0,0,'Damage_Digits',juice.frameName('Damage_Digits',0)).setOrigin(0,.5);box.add(im);return im;});
        return {box,digits,live:false,target:null,last:0};});
    }
    reset(){for(const n of this.pool){n.live=false;n.target=null;n.box.setVisible(false);}}
    list(){return this.pool.filter(n=>n.live).map(n=>({value:n.value,crit:n.crit,hurt:n.hurt,x:n.x,y:n.y,scale:n.box.scaleX,depth:n.box.depth}));}
    show(target,amount,{crit=false,hurt=false}={}){
      const now=this.j.now();
      // Merge only within a short span, so a target under steady fire gets fresh numbers where it now stands.
      let n=this.pool.find(v=>v.live&&v.target===target&&now-v.last<=MERGE_MS&&now-v.born<=MERGE_SPAN);const wasCrit=!!n?.crit;
      if(n){n.sum+=amount;n.crit||=crit;}
      else{
        n=this.pool.find(v=>!v.live)||this.pool.reduce((a,b)=>a.last<=b.last?a:b); // full: recycle the oldest
        Object.assign(n,{live:true,target,sum:amount,crit,hurt,born:now,x:target.x+(this.j.rand()*2-1)*6,y:target.y-(target.r||10)-6});this.spawned++;
      }
      n.last=now;n.value=Math.min(99999,Math.max(1,Math.round(n.sum)));
      this.layout(n);this.animate(n,now);
      // One burst when a number turns gold, from a small budget of its own so crits never crowd out reward juice.
      if(crit&&!wasCrit&&!this.j.reduced&&this.j.fx.filter(f=>f.key==='Damage_Crit').length<BURSTS)this.j.play('Damage_Crit',n.x,n.y,{scale:2,depth:DEPTH-1});
    }
    layout(n){
      const str=String(n.value),tint=n.hurt?RED:n.crit?GOLD:WHITE;let x=0;
      n.digits.forEach((im,i)=>{const ch=str[i];im.setVisible(ch!==undefined);if(ch===undefined)return;
        im.setFrame(this.j.frameName('Damage_Digits',+ch)).setPosition(x,0).setTint(tint);x+=this.adv[+ch];});
      for(const im of n.digits)im.x-=Math.round(x/2); // centred on the hit
      n.box.setVisible(true);
    }
    // Rise from the first hit, pop and fade from the latest one, so merged hits keep climbing.
    animate(n,now){
      const life=n.crit?CRIT_LIFE:LIFE,since=now-n.last,k=Math.min(1,(now-n.born)/life);
      const pop=this.j.reduced?0:Math.max(0,1-since/POP_MS)*.6;
      n.box.setPosition(n.x,n.y-RISE*(1-Math.pow(1-k,3))).setScale((n.crit?3:2)*(1+pop)).setAlpha(since>life-FADE_MS?Math.max(0,(life-since)/FADE_MS):1);
    }
    update(now){for(const n of this.pool){if(!n.live)continue;if(now-n.last>=(n.crit?CRIT_LIFE:LIFE)){n.live=false;n.target=null;n.box.setVisible(false);}else this.animate(n,now);}}
  }
  window.SurvivorDamageNumbers = SurvivorDamageNumbers;
})();
