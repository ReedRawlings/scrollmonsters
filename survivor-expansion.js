(() => {
 const entries=[['cat','Sweeping attacks and knockback'],['owl','Piercing feathers and ranged volleys'],['beast','Charges through enemy groups'],['frog','Shields and +1 party hit damage'],['mouse','Summons temporary attackers'],['mole','Delayed eruptions beneath groups'],['bear','Cross tremors, strongest at center'],['salamander','Fire patches and spreading burns'],['spider','Damaging webs that slow and weaken'],['storm','Chain lightning and thunder strikes'],['mollusc','Ink pools that damage and slow']];
 class SurvivorExpansion {
  constructor(s){this.s=s;this.cooldown=0;this.dashTime=0;this.dx=0;this.dy=1;this.facing={x:0,y:1};this.bestiaryPage=0;}
  dash(direction=this.facing){const s=this.s;if(s.mode!=='playing'||this.cooldown>0)return;this.dx=direction.x;this.dy=direction.y;this.dashTime=.18;this.cooldown=3;s.creatures.elements.dashStart();if(s.relics.has('veil'))s.player.inv=Math.max(s.player.inv,Math.min(.18,.08+.03*(s.relics.count('veil')-1)));s.burst('fxDust',s.player.x,s.player.y,2,.35);s.logEvent('dash',{dx:this.dx,dy:this.dy});}
  move(dt,dx,dy){const s=this.s,p=s.player;this.cooldown=Math.max(0,this.cooldown-dt);if(Math.hypot(dx,dy)>.1){const d=Math.hypot(dx,dy);this.facing={x:dx/d,y:dy/d};}if(this.dashTime<=0)return false;let travel=620*Math.min(dt,this.dashTime);this.dashTime=Math.max(0,this.dashTime-dt);while(travel>0){const step=Math.min(5,travel),x=p.x+this.dx*step,y=p.y+this.dy*step;if(s.blocked(x,y,p.r)){if(s.greens?.smash(x,y,p.r))continue;this.dashTime=0;break;}p.x=x;p.y=y;travel-=step;}if(this.dashTime<=0){const origin=s.creatures.elements.dashOrigin,end={x:p.x,y:p.y};s.creatures.elements.dashEnd();s.relics.dashFinished(origin,end);}return true;}
 }
 SurvivorExpansion.roster=entries;
 window.SurvivorExpansion=SurvivorExpansion;
})();
