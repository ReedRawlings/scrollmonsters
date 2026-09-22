(() => {
 const entries=[['cat','Sweeping attacks and knockback'],['owl','Piercing feathers and ranged volleys'],['beast','Charges through enemy groups'],['frog','Shields and strengthens the party'],['mouse','Summons temporary attackers'],['mole','Delayed eruptions beneath groups'],['bear','Protective slams and stagger']];
 class SurvivorExpansion {
  constructor(s){this.s=s;this.cooldown=0;this.dashTime=0;this.dx=0;this.dy=1;this.facing={x:0,y:1};}
  dash(){const s=this.s;if(s.mode!=='playing'||this.cooldown>0)return;this.dx=this.facing.x;this.dy=this.facing.y;this.dashTime=.18;this.cooldown=3;s.burst('fxDust',s.player.x,s.player.y,2,.35);s.logEvent('dash',{dx:this.dx,dy:this.dy});}
  move(dt,dx,dy){const s=this.s,p=s.player;this.cooldown=Math.max(0,this.cooldown-dt);if(Math.hypot(dx,dy)>.1){const d=Math.hypot(dx,dy);this.facing={x:dx/d,y:dy/d};}if(this.dashTime<=0)return false;let travel=620*Math.min(dt,this.dashTime);this.dashTime=Math.max(0,this.dashTime-dt);while(travel>0){const step=Math.min(5,travel),x=p.x+this.dx*step,y=p.y+this.dy*step;if(x<22||y<22||x>s.worldSize-22||y>s.worldSize-22||s.blocked(x,y,p.r)){this.dashTime=0;break;}p.x=x;p.y=y;travel-=step;}return true;}
  ui(w,h){const s=this.s;if(s.mode==='playing'){s.button(this.cooldown>0?'Dash '+this.cooldown.toFixed(1):'Dash',w-116,h-138,100,()=>this.dash());}
   if(s.mode!=='bestiary')return;const pw=Math.min(w-24,490),x=(w-pw)/2,y=Math.max(85,(h-465)/2);s.panel(x,y,pw,465);s.label('BESTIARY',w/2,y+20,23,'#fff0b0','center');s.label('Capture creatures to reveal their entries',w/2,y+51,13,'#e2ccb0','center');entries.forEach(([id,role],i)=>{const known=s.unlocked.includes(id),yy=y+84+i*43;s.label(known?id.toUpperCase():'???',x+22,yy,16,known?'#8ee0df':'#e2ccb0');s.label(known?role:'???',x+22,yy+19,w<700?11:12,'#fff5d7');});s.button('Back',x+22,y+400,pw-44,()=>{s.mode='title';s.draw();});}
 }
 window.SurvivorExpansion=SurvivorExpansion;
})();
