(() => {
  // Star Map: meta progression bought with Embers between runs (full expedition only). Opened from the title like the Bestiary.
  // Lighting a star opens its neighbours; stars two links away show as ? slots. Seven stars change runs today; the rest are
  // on the map but say "Coming soon" and cannot be bought yet.
  const KEY = 'scrollmonsters-starmap-v1';
  const D = () => ScrollUI.DARK;
  // x/y are map units around Den Heart; the screen scales them to fit. icon: a file in assets/icons, loaded as star_<id>
  // (the upgrade_ keys are remapped by the evolution loader, so they cannot be trusted to show this art).
  const STARS = [
    {id:'core',name:'Den Heart',x:0,y:0,ranks:0,core:true,icon:'upgrades/octoRear.png',desc:'Your first star. It is always lit.'},
    {id:'vitality',name:'Vitality',x:-58,y:-34,ranks:3,cost:[15,30,50],live:true,icon:'upgrades/hide.png',desc:'Every run starts with more health.',eff:r=>`+${40*r} max HP`},
    {id:'ferocity',name:'Ferocity',x:60,y:-30,ranks:3,cost:[20,35,55],live:true,icon:'upgrades/partyDamage.png',desc:'Your whole party hits harder.',eff:r=>`+${5*r}% damage`},
    {id:'fleet',name:'Fleet Foot',x:-6,y:62,ranks:3,cost:[10,20,35],live:true,icon:'upgrades/feet.png',desc:'You move faster.',eff:r=>`+${4*r}% move speed`},
    // Runs start with half the old gem pull range (50 px); three Magnet ranks restore the full 100 px.
    {id:'magnet',name:'Magnet',x:-122,y:16,ranks:3,cost:[10,20,30],live:true,icon:'upgrades/pull.png',desc:'XP gems fly to you from farther away.',eff:r=>`Gem range ${Math.round(50+50*r/3)} px`},
    {id:'quick',name:'Quick Roll',x:-84,y:104,ranks:2,cost:[20,40],live:true,icon:'upgrades/partySpeed.png',desc:'Your dodge roll recharges sooner.',eff:r=>`-${10*r}% dash cooldown`},
    {id:'second',name:'Second Wind',x:-118,y:-96,ranks:1,cost:[90],icon:'relics/bloodroot.png',desc:'Once per run, survive a killing blow.',eff:()=>'Revive at 30% HP'},
    {id:'reroll',name:'Reroll',x:96,y:-96,ranks:2,cost:[30,60],icon:'relics/echo.png',desc:'Redraw a level-up offer you dislike.',eff:r=>`${r} reroll${r>1?'s':''} per run`},
    {id:'twin',name:'Twin Shot',x:-10,y:-152,ranks:1,cost:[120],keystone:true,icon:'relics/twinshot.svg',desc:'Your basic attack fires two projectiles from the start.',eff:()=>'+1 projectile'},
    {id:'lucky',name:'Lucky Packs',x:128,y:14,ranks:2,cost:[25,50],icon:'relics/pack.png',desc:'Upgrade packs roll bigger more often.',eff:r=>`Rare ${17+4*r}% · Legend ${2+r}%`},
    {id:'compass',name:'Den Compass',x:66,y:100,ranks:1,cost:[40],icon:'upgrades/marks.png',desc:'An arrow at the screen edge points to the nearest den.',eff:()=>'Den arrow'},
    {id:'capture',name:'Steady Capture',x:22,y:158,ranks:2,cost:[20,40],icon:'upgrades/bubble.png',desc:'Capture rings fill faster.',eff:r=>`+${15*r}% capture speed`},
    {id:'shrine',name:'Shrine Sense',x:124,y:150,ranks:1,cost:[45],icon:'relics/resonance.png',desc:'The compass also points to shrines.',eff:()=>'Shrine arrow'},
    {id:'longshot',name:'Long Shot',x:150,y:-60,ranks:3,cost:[15,30,45],live:true,icon:'upgrades/tenguVolley.png',desc:'Your shots fly farther.',eff:r=>`+${20*r}% shot range`},
    {id:'sharp',name:'Sharp Shot',x:178,y:-130,ranks:5,cost:[10,20,30,40,50],live:true,icon:'relics/hunter.png',desc:'Your basic shots hit harder.',eff:r=>`+${r} shot damage`},
    {id:'hoard',name:'Ember Hoard',x:178,y:72,ranks:2,cost:[35,70],icon:'upgrades/comboFire.png',desc:'Every run pays more Embers.',eff:r=>`+${10*r}% Embers`},
  ];
  const LINKS = [['core','vitality'],['core','ferocity'],['core','fleet'],['vitality','magnet'],['vitality','second'],['second','twin'],['ferocity','reroll'],['reroll','twin'],
    ['ferocity','lucky'],['ferocity','longshot'],['longshot','sharp'],['lucky','hoard'],['fleet','quick'],['fleet','compass'],['magnet','quick'],['compass','capture'],['compass','shrine'],['shrine','hoard']];
  const BY = Object.fromEntries(STARS.map(n=>[n.id,n]));
  const NB = Object.fromEntries(STARS.map(n=>[n.id,[]])); for (const [a,b] of LINKS) { NB[a].push(b); NB[b].push(a); }
  const NONE = {hp:0,damage:0,speed:0,dash:0,pickup:0,range:0,shot:0,active:false};

  class SurvivorStarMap {
    constructor(s){this.s=s;this.sel=null;this.litAt={};this.layout=null;}
    static read(){try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&v.ranks&&typeof v.ranks==='object')return {ranks:{...v.ranks}};}catch{}return {ranks:{}};}
    static none(){return {...NONE};}
    static preload(scene){for(const n of STARS)scene.load.image('star_'+n.id,'assets/icons/'+n.icon);}
    static rank(save,id){const n=BY[id];return n.core?1:Math.max(0,Math.min(n.ranks,save.ranks[id]|0));}
    // What every run starts with. Only live stars count, and only in the full expedition.
    static bonuses(s){
      if(!s.isExpedition||s.isDemo)return SurvivorStarMap.none();
      const save=SurvivorStarMap.read(),r=id=>SurvivorStarMap.rank(save,id);
      const b={hp:40*r('vitality'),damage:.05*r('ferocity'),speed:.04*r('fleet'),dash:.1*r('quick'),pickup:r('magnet')/3,range:.2*r('longshot'),shot:r('sharp')};
      return {...b,active:Object.values(b).some(v=>v>0)};
    }
    get save(){return SurvivorStarMap.read();}
    rank(id){return SurvivorStarMap.rank(this.save,id);}
    lit(id){return this.rank(id)>0;}
    state(id){if(this.lit(id))return 'lit';if(NB[id].some(n=>this.lit(n)))return 'open';if(NB[id].some(n=>NB[n].some(m=>this.lit(m))))return 'faint';return 'hidden';}
    cost(id){const n=BY[id],r=this.rank(id);return n.core||r>=n.ranks?null:n.cost[r];}
    open(){const s=this.s;if(s.mode!=='title'||s.isDemo)return;s.starMapOpen=true;this.sel=null;s.draw();}
    close(){const s=this.s;s.starMapOpen=false;s.starMapClosedFrame=s.game.loop.frame;s.draw();}
    select(id){this.sel=id&&this.state(id)!=='hidden'?id:null;this.s.draw();}
    buy(id){
      const s=this.s,n=BY[id],c=this.cost(id);if(!n?.live||c==null||this.state(id)==='faint'||this.state(id)==='hidden')return false;
      if(!SurvivorEmbers.spend(c))return false;
      const save=this.save;save.ranks[id]=(save.ranks[id]|0)+1;try{localStorage.setItem(KEY,JSON.stringify(save));}catch{SurvivorEmbers.refund(c);return false;}
      this.litAt[id]=s.juice.now();const p=this.layout?.stars?.[id];if(p)s.juice.play('Slot_PowerUp',p.x,p.y,{ui:true,scale:1});
      s.draw();return true;
    }

    // Laid out like the Bestiary: portrait fills 270x480; landscape sits in a centred 480x320 frame.
    draw(w,h){
      const s=this.s,ui=s.ui,j=s.juice,portrait=h>w,now=j.now(),red=j.reduced;
      s.screens.dim(w,h);ui.rect(0,0,w,h,'#0b0710a0');
      const ox=portrait?0:Math.round((w-480)/2),oy=portrait?0:Math.round((h-320)/2);if(!portrait){ui.beginGroup('starmapframe',{x:ox,y:oy});w=480;h=320;}
      const L=portrait?{banner:14,head:[12,52,246],map:[0,60,270,240],detail:[12,304,246,130],back:[w/2-50,442,100,26]}
        :{banner:2,head:[12,40,236],map:[4,46,248,266],detail:[256,48,212,214],back:[312,272,100,26]};
      this.layout={stars:{},map:L.map,frame:[ox,oy]};
      ui.banner('STAR MAP',w/2,L.banner);
      const total=SurvivorEmbers.read().total,litCount=STARS.filter(n=>!n.core&&this.lit(n.id)).length;
      ui.darkText(`STARS ${litCount}/${STARS.length-1}`,L.head[0],L.head[1],{color:D().gold});
      const tw=ui.darkText(String(total),L.head[0]+L.head[2],L.head[1],{align:'right',color:D().gold}).width;
      ui.image('emberCoin',L.head[0]+L.head[2]-tw-15,L.head[1]-5,10,10,{frame:[0,0,10,10]})?.clearTint();this.layout.total=total;
      // Tapping empty map clears the selection; stars sit on top of this area.
      const [mx,my,mw,mh]=L.map;ui.hitArea(mx,my,mw,mh,()=>this.select(null),'starmap-blank');
      const xs=STARS.map(n=>n.x),ys=STARS.map(n=>n.y),k=Math.min((mw-40)/(Math.max(...xs)-Math.min(...xs)),(mh-48)/(Math.max(...ys)-Math.min(...ys)));
      const cx=mx+mw/2-k*(Math.max(...xs)+Math.min(...xs))/2,cy=my+(mh-12)/2-k*(Math.max(...ys)+Math.min(...ys))/2;
      const P=id=>({x:Math.round(cx+BY[id].x*k),y:Math.round(cy+BY[id].y*k)});
      // Links: gold between lit stars, a white dash to stars you can buy, a faint dotted line towards ? stars.
      const g=ui.graphics(),R=18;
      const seg=(a,b,color,alpha,dash,gap,width=2)=>{const d=Math.hypot(b.x-a.x,b.y-a.y),ux=(b.x-a.x)/d,uy=(b.y-a.y)/d;g.lineStyle(width,color,alpha);
        for(let t=R;t<d-R;t+=dash+gap){const e=Math.min(d-R,t+dash);g.lineBetween(a.x+ux*t,a.y+uy*t,a.x+ux*e,a.y+uy*e);}};
      for(const [a,b] of LINKS){const sa=this.state(a),sb=this.state(b);if(sa==='hidden'||sb==='hidden')continue;const pa=P(a),pb=P(b);
        if(sa==='lit'&&sb==='lit'){seg({x:pa.x+1,y:pa.y+1},{x:pb.x+1,y:pb.y+1},0x120a1a,1,999,0);seg(pa,pb,0xffc41b,1,999,0);}
        else if(sa==='lit'||sb==='lit')seg(pa,pb,0xffffff,.55,4,4);else seg(pa,pb,0xb9b0d0,.35,2,6);}
      for(const n of STARS){
        const st=this.state(n.id),p=P(n.id);if(st==='hidden'){g.fillStyle(0xb9b0d0,.35).fillRect(p.x-1,p.y-1,2,2);continue;}
        this.layout.stars[n.id]={x:p.x+ox,y:p.y+oy,state:st};
        if(st==='faint'){ui.panel('dk_slot',p.x-14,p.y-14,28,28,5,2);ui.darkText('?',p.x,p.y,{align:'center',color:D().muted});}
        else{
          // A newly lit star pops: 1.4x settling to 1x over 260ms.
          const t=now-(this.litAt[n.id]??-Infinity),pop=red||t>=260?1:t<100?1.4:1.4-.4*(t-100)/160,sz=Math.round(32*pop);
          const im=ui.image('star_'+n.id,p.x-sz/2,p.y-sz/2,sz,sz,{frame:[0,0,16,16]});
          // Known stars you cannot afford or that are coming soon are tinted like locked Bestiary creatures.
          if(im){if(st==='lit')im.clearTint();else im.setTint(0x5c4b7b);}
          if(st==='lit'&&n.ranks>1){const pw=n.ranks*4-1;for(let i=0;i<n.ranks;i++){g.fillStyle(0x120a1a,1).fillRect(p.x-pw/2+i*4-1,p.y+17,5,5);g.fillStyle(i<this.rank(n.id)?0xffc41b:0x4a3f63,1).fillRect(p.x-pw/2+i*4,p.y+18,3,3);}}
          const c=this.cost(n.id);
          if(st==='open'&&n.live&&c!=null){const lw=ui.darkText(String(c),p.x+6,p.y+24,{align:'center',color:total>=c?D().gold:D().muted}).width;ui.image('emberCoin',p.x+6-lw/2-12,p.y+19,10,10,{frame:[0,0,10,10]})?.clearTint();}
        }
        ui.hitArea(p.x-16,p.y-16,32,32,()=>this.select(n.id),'star-'+n.id);
        if(this.sel===n.id){const bx=p.x-17,by=p.y-17,bs=34,sg=ui.graphics();sg.lineStyle(2,0xffffff,1);
          for(const [qx,qy,dx,dy] of [[bx,by,1,1],[bx+bs,by,-1,1],[bx,by+bs,1,-1],[bx+bs,by+bs,-1,-1]])sg.lineBetween(qx,qy,qx+6*dx,qy).lineBetween(qx,qy,qx,qy+6*dy);}
      }
      if(this.sel)this.detail(L.detail,total);
      ui.pill('Back',...L.back,()=>this.close(),{id:'starmap-back'});
      if(!portrait)ui.endGroup();
    }
    detail([dx,dy,dw,dh],total){
      const s=this.s,ui=s.ui,n=BY[this.sel],st=this.state(n.id),wrap=dw-16;ui.darkPanel(dx,dy,dw,dh);let ty=dy+8;
      const line=(t,o={})=>{const tx=ui.darkText(t,dx+8,ty,{wrap,...o}).setOrigin(0,0);ty+=tx.height+4;return tx;};
      if(st==='faint'){line('???',{size:18});line('Light a star next to this one to reveal it.',{color:D().muted});return;}
      ui.image('star_'+n.id,dx+dw-40,dy+8,32,32,{frame:[0,0,16,16]})?.clearTint();
      line(n.name.toUpperCase(),{size:18,wrap:wrap-40});
      if(n.core){line('Every run starts with',{color:D().teal});const on=STARS.filter(m=>m.live&&this.lit(m.id));
        if(!on.length)line('Nothing yet.',{color:D().muted});else for(const m of on)line(m.eff(this.rank(m.id)),{color:D().gold});return;}
      const r=this.rank(n.id),c=this.cost(n.id);
      line(!n.live?'Coming soon':n.keystone?'Keystone':`Rank ${r} / ${n.ranks}`,{color:D().teal});
      line(r>0?n.eff(r)+(r<n.ranks?'  >  '+n.eff(r+1):''):n.eff(1),{color:D().gold});
      line(n.desc,{color:D().muted});
      if(!n.live)return;
      const [bx,by,bw,bh]=[dx+8,dy+dh-34,dw-16,26];
      if(c==null)s.screens.button('Maxed',bx,by,bw,bh,()=>{},'star-buy');
      else{const can=total>=c;ui.card((r?'Raise':'Light')+' · '+c,bx,by,bw,bh,()=>{if(can)this.buy(n.id);},{align:'center',color:can?D().gold:D().muted,id:'star-buy'});
        ui.image('emberCoin',bx+bw-22,by+bh/2-5,10,10,{frame:[0,0,10,10]})?.clearTint();}
    }
  }
  SurvivorStarMap.KEY=KEY;SurvivorStarMap.stars=STARS;SurvivorStarMap.links=LINKS;
  window.SurvivorStarMap=SurvivorStarMap;
})();
