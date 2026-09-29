(() => {
 const entries=[['cat','Sweeping attacks and knockback'],['owl','Piercing feathers and ranged volleys'],['beast','Charges through enemy groups'],['frog','Shields and strengthens the party'],['mouse','Summons temporary attackers'],['mole','Delayed eruptions beneath groups'],['bear','Protective slams and stagger'],['salamander','Fire patches and spreading burns'],['spider','Slowing webs and vulnerable enemies'],['storm','Chain lightning and thunder strikes']];
 class SurvivorExpansion {
  constructor(s){this.s=s;this.cooldown=0;this.dashTime=0;this.dx=0;this.dy=1;this.facing={x:0,y:1};this.bestiaryPage=0;}
  dash(){const s=this.s;if(s.mode!=='playing'||this.cooldown>0)return;this.dx=this.facing.x;this.dy=this.facing.y;this.dashTime=.18;this.cooldown=3;s.creatures.elements.dashStart();if(s.relics.has('veil'))s.player.inv=Math.max(s.player.inv,Math.min(.18,.08+.03*(s.relics.count('veil')-1)));s.burst('fxDust',s.player.x,s.player.y,2,.35);s.logEvent('dash',{dx:this.dx,dy:this.dy});}
  move(dt,dx,dy){const s=this.s,p=s.player;this.cooldown=Math.max(0,this.cooldown-dt);if(Math.hypot(dx,dy)>.1){const d=Math.hypot(dx,dy);this.facing={x:dx/d,y:dy/d};}if(this.dashTime<=0)return false;let travel=620*Math.min(dt,this.dashTime);this.dashTime=Math.max(0,this.dashTime-dt);while(travel>0){const step=Math.min(5,travel),x=p.x+this.dx*step,y=p.y+this.dy*step;if(x<22||y<22||x>s.worldSize-22||y>s.worldSize-22||s.blocked(x,y,p.r)){this.dashTime=0;break;}p.x=x;p.y=y;travel-=step;}if(this.dashTime<=0)s.creatures.elements.dashEnd();return true;}
  starterGrid(x,y,width){const s=this.s,page=this.bestiaryPage,cell=(width-16)/3;
    entries.slice(page*9,page*9+9).forEach(([id],i)=>{const known=s.unlocked.includes(id),xx=x+(i%3)*(cell+8),yy=y+Math.floor(i/3)*76,selected=s.starter===id;
      s.ui.button('',xx,yy,cell,68,{action:()=>{if(!known)return;const mode=s.mode;s.run=null;s.starter=id;s.resetState();s.expansion.bestiaryPage=page;s.mode=mode;s.draw();}}).setScrollFactor(0);
      if(known)s.ui.object('starterPortrait',()=>new Phaser.GameObjects.Image(s,0,0,id)).setTexture(id,0).setPosition(xx+cell/2,yy+24).setScale(2);
      else s.label('???',xx+cell/2,yy+17,20,'#62402b','center');
      s.label(known?(id==='storm'?'Storm Lizard':id[0].toUpperCase()+id.slice(1)):'???',xx+cell/2,yy+47,12,selected?'#fff5b0':'#30221a','center');
      if(selected)s.ui.graphics().lineStyle(3,0xffed96).strokeRect(xx+2,yy+2,cell-4,64);
    });
    s.button('‹',x,y+232,65,()=>{this.bestiaryPage=(page+1)%2;s.draw();});s.label('Page '+(page+1)+'/2',x+width/2,y+246,14,'#e2ccb0','center');s.button('›',x+width-65,y+232,65,()=>{this.bestiaryPage=(page+1)%2;s.draw();});
  }
  ui(w,h){const s=this.s;
   if(s.mode!=='bestiary')return;const pw=Math.min(w-24,490),x=(w-pw)/2,y=Math.max(85,(h-440)/2);s.panel(x,y,pw,440);s.label('CHOOSE STARTER',w/2,y+20,23,'#fff0b0','center');this.starterGrid(x+18,y+60,pw-36);s.button('Done',x+18,y+365,pw-36,()=>{s.mode='title';s.draw();});}
 }
 window.SurvivorExpansion=SurvivorExpansion;
})();
