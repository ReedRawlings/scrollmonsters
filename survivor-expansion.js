(() => {
 const entries=[['cat','Sweeping attacks and knockback'],['owl','Piercing feathers and ranged volleys'],['beast','Charges through enemy groups'],['frog','Shields and strengthens the party'],['mouse','Summons temporary attackers'],['mole','Delayed eruptions beneath groups'],['bear','Protective slams and stagger'],['salamander','Fire patches and spreading burns'],['spider','Slowing webs and vulnerable enemies'],['storm','Chain lightning and thunder strikes']];
 class SurvivorExpansion {
  constructor(s){this.s=s;this.cooldown=0;this.dashTime=0;this.dx=0;this.dy=1;this.facing={x:0,y:1};this.bestiaryPage=0;}
  dash(){const s=this.s;if(s.mode!=='playing'||this.cooldown>0)return;this.dx=this.facing.x;this.dy=this.facing.y;this.dashTime=.18;this.cooldown=3;s.creatures.elements.dashStart();if(s.relics.has('veil'))s.player.inv=Math.max(s.player.inv,Math.min(.18,.08+.03*(s.relics.count('veil')-1)));s.burst('fxDust',s.player.x,s.player.y,2,.35);s.logEvent('dash',{dx:this.dx,dy:this.dy});}
  move(dt,dx,dy){const s=this.s,p=s.player;this.cooldown=Math.max(0,this.cooldown-dt);if(Math.hypot(dx,dy)>.1){const d=Math.hypot(dx,dy);this.facing={x:dx/d,y:dy/d};}if(this.dashTime<=0)return false;let travel=620*Math.min(dt,this.dashTime);this.dashTime=Math.max(0,this.dashTime-dt);while(travel>0){const step=Math.min(5,travel),x=p.x+this.dx*step,y=p.y+this.dy*step;if(x<22||y<22||x>s.worldSize-22||y>s.worldSize-22||s.blocked(x,y,p.r)){this.dashTime=0;break;}p.x=x;p.y=y;travel-=step;}if(this.dashTime<=0)s.creatures.elements.dashEnd();return true;}
  ui(w,h){}
 }
 SurvivorExpansion.roster=entries;
 window.SurvivorExpansion=SurvivorExpansion;
})();
