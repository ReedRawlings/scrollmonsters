(() => {
  'use strict';
  const D = () => ScrollUI.DARK;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const SLOT_W = 62, SLOT_H = 48, SLOT_GAP = 4, RELIC_PITCH = 24, RELICS_PER_ROW = 8;
  const NAMES = {storm:'STORM LIZARD'};
  class SurvivorHud {
    constructor(s){this.s=s;this.layout={slots:[],relics:[]};}
    // w,h are logical (270x480 portrait, 480x320 landscape). Called inside the x2 group.
    draw(w,h){
      const s=this.s,ui=s.ui;this.layout={slots:[],relics:[]};
      this.status(ui);
      this.timer(ui,w);
      const rowBottom=this.relicRow(ui,w);
      this.partyBar(ui,w,h);
      let y=Math.max(86,rowBottom+6);
      if(s.encounters.boss?.hp>0)y=this.guardian(ui,w,y)+6;
      if(s.noticeTime>0&&s.mode==='playing')y+=ui.notice(s.notice,w/2,y,w-24).height+6;
      if(s.logStorageError||s.unlockError)ui.darkText('Local progress could not be saved',w/2,y+6,{align:'center',color:D().danger});
      if(s.mode==='playing')this.worldLabels(ui,w,h);
    }
    status(ui){
      const s=this.s,p=s.player,hp=clamp(p.hp/s.maxHp,0,1),xp=clamp(s.xp/s.xpNeeded(),0,1);
      const g=ui.graphics();
      // HP: dark trough, then three red bands; XP: three teal bands. Right ends are slanted like the prototype.
      const bar=(x,y,w,hh,slant,fill,bands)=>{g.fillStyle(0x130306).beginPath().moveTo(x,y).lineTo(x+w,y).lineTo(x+w-slant,y+hh).lineTo(x,y+hh).closePath().fillPath();
        let yy=y;for(const [c,f] of bands){const bh=Math.round(hh*f);g.fillStyle(c).fillRect(x,yy,Math.max(0,(w-slant)*fill),bh);yy+=bh;}};
      bar(56,32,96,10,8,hp,[[0x6c192b,.2],[0xaf2424,.4],[0x4d0c1e,.4]]);
      bar(52,48,84,6,4,xp,[[0x187c8c,.34],[0x2dc5c0,.33],[0x0c4067,.33]]);
      ui.image('dk_status',2,10,166,70);
      ui.image('dk_heart',26,37,18,16);
      ui.darkText('LV '+s.level,148,51,{color:D().teal});
      ui.image('killIcon',178,45,6,11);
      ui.darkText(String(s.kills),188,51);
    }
    timer(ui,w){
      const s=this.s,t=`${Math.floor(s.elapsed/60)}:${String(Math.floor(s.elapsed%60)).padStart(2,'0')} / ${s.isExpedition?'10:00':'2:00'}`;
      // The drawn pill stays small; a thumb-sized zone behind it catches near misses.
      if(s.mode==='playing'){ui.hitArea(w-40,0,40,34,()=>s.pause(),'pause-target');ui.pill('II',w-26,8,20,16,()=>s.pause(),{id:'pause'});}
      ui.darkText(t,w-32,17,{align:'right',color:D().gold});
    }
    relicRow(ui,w){
      const s=this.s,ids=[...new Set(s.relics.equipped)];
      let i=0;const cell=()=>{const x=54+(i%RELICS_PER_ROW)*RELIC_PITCH,y=58+Math.floor(i/RELICS_PER_ROW)*RELIC_PITCH;i++;return {x,y};};
      for(const id of ids){const {x,y}=cell(),count=s.relics.count(id);this.layout.relics.push({id,count,x,y});
        ui.image('relic_'+id,x+2,y+2,16,16,{frame:[0,0,16,16]});
        if(count>1)ui.darkText(String(count),x+22,y+19,{align:'right'});}
      return i?58+Math.ceil(i/RELICS_PER_ROW)*RELIC_PITCH:58; // bottom of the last occupied row
    }
    partyBar(ui,w,h){
      const s=this.s,members=['walker',...s.expedition.party()].slice(0,4),total=4*SLOT_W+3*SLOT_GAP,x0=Math.round((w-total)/2),y=h-SLOT_H-4;
      for(let i=0;i<4;i++){const x=x0+i*(SLOT_W+SLOT_GAP),type=members[i]||null;this.layout.slots.push({type,x,y,w:SLOT_W,h:SLOT_H});
        ui.image('dk_zslot',x,y,SLOT_W,SLOT_H);
        if(type){if(s.textures.exists('face_'+type))ui.image('face_'+type,x+8,y+10,32,32,{frame:[3,3,32,32]});
          else if(s.textures.exists(type))ui.image(type,x+8,y+10,32,32,{frame:[0,0,16,16]});
          // Player charge is the dash cooldown; creature timers arrive with Phase 2.
          const charge=this.chargeOf(type),bh=Math.round(34*charge);this.layout.slots[i].charge=charge;
          if(bh>0)ui.rect(x+52,y+SLOT_H-6-bh,4,bh,charge>=1?'#08ec64':'#08a048');}}
      const cd=s.expansion.cooldown;
      if(s.mode==='playing')ui.pill(cd>0?'Dash '+cd.toFixed(1):'Dash',x0+total-72,y-24,72,20,()=>s.expansion.dash(),{id:'dash'});
      const styles=s.creatures.elements.dashOptions();
      if(s.mode==='playing'&&styles.length>1){const style=s.creatures.elements.dashStyle==='storm'?'lightning':s.creatures.elements.dashStyle;
        ui.pill('Dash: '+style,x0,y-22,96,18,()=>s.creatures.elements.cycleDash(),{id:'dash-style'});}
    }
    // 0 right after an attack, 1 when ready. Reads timers only.
    chargeOf(type){
      const s=this.s,k=(t,i)=>i>0?1-clamp(t/i,0,1):1;
      if(type==='walker')return 1-clamp(s.expansion.cooldown/3,0,1);
      if(type==='cat')return k(s.cat.attack,.85);
      if(type==='owl')return s.owl?k(s.owl.attack,s.companionStats().owl.interval):1;
      if(type==='beast'){const b=s.encounters.beast;return b?k(b.attack,s.companionStats().beast.interval):1;}
      if(type==='frog'){const f=s.expedition.frog;return f?k(f.pulseClock,s.frogStats().shieldInterval):1;}
      const a=s.creatures.allies[type];return a?k(a.attack,s.creatures.stats(type).interval):1;
    }
    guardian(ui,w,y){
      const b=this.s.encounters.boss,width=w-40;ui.darkPanel(20,y,width,22);
      ui.rect(26,y+14,Math.max(0,(width-12)*b.hp/b.maxHp),3,'#ef5266');
      ui.darkText('GUARDIAN '+Math.ceil(b.hp)+' / '+b.maxHp,w/2,y+9,{align:'center',color:D().gold});
      return y+22;
    }
    // Labels that follow things in the world. All positions go through toUI and are clamped on screen.
    worldLabels(ui,w,h){
      const s=this.s,top=112,bottom=h-SLOT_H-30;
      const at=(text,x,y,color=D().text)=>{const t=ui.darkText(text,0,0,{align:'center',color});const half=t.width/2+4;t.setPosition(clamp(x,half,w-half),clamp(y,top,bottom));return t;};
      const capture=(type,b)=>{const p=s.toUI(b.x,b.y);at('CAPTURE '+(NAMES[type]||type.toUpperCase())+' '+Math.round(b.progress/2.5*100)+'%\nCHOOSE 1 THIS ROUND',p.x,p.y-42);};
      for(const [type,a] of Object.entries(s.creatures.allies))if(a.state==='ready')capture(type,a);
      for(const [type,b] of [['frog',s.expedition.frog],['cat',s.expedition.catCapture],['beast',s.encounters.beast]])if(b?.state==='ready')capture(type,b);
      const o=s.owl;if(o?.state==='ready')capture('owl',o);else if(o?.state==='wild'){const p=s.toUI(o.x,o.y);at('WILD OWL',p.x,p.y-24);}
      for(const item of s.pickups.filter(e=>e.type!=='xp')){const p=s.toUI(item.x,item.y);if(p.x>12&&p.x<w-12&&p.y>top&&p.y<bottom)at({heal:'+8 HP',haste:'FRENZY',shield:'SHIELD',magnet:'XP MAGNET',cleanse:'CLEANSE'}[item.type],p.x,p.y+12);}
      const sh=s.expedition.shrine;if(s.isExpedition&&sh.active&&!sh.done){const p=s.toUI(sh.x,sh.y),st=s.expedition.shrineStats(),near=Math.hypot(s.player.x-sh.x,s.player.y-sh.y)<=240;
        at('SHRINE '+(sh.inCombat?'· DEFEAT ELITE':sh.needsExit?'· LEAVE TO REARM':!near?'· OPTIONAL '+(sh.completed+1)+'/3':'· HOLD 6s · '+(sh.completed+1)+'/3\n'+st.hp+' HP / '+st.damage+' DMG'),p.x,p.y-45,D().gold);}
    }
  }
  window.SurvivorHud = SurvivorHud;
})();
