(() => {
  // Keep one simulation copy of each object, in the nearest repeating world image.
  class SurvivorWorld {
    static delta(a,b,size){return ((a-b+size/2)%size+size)%size-size/2;}
    static near(s,p){return {x:s.player.x+this.delta(p.x,s.player.x,s.worldSize),y:s.player.y+this.delta(p.y,s.player.y,s.worldSize)};}
    static distance(s,a,b){return Math.hypot(this.delta(a.x,b.x,s.worldSize),this.delta(a.y,b.y,s.worldSize));}
    static denApart(s,a,b){const cam=s.cameras.main;return Math.abs(this.delta(a.x,b.x,s.worldSize))>cam.width+140||Math.abs(this.delta(a.y,b.y,s.worldSize))>cam.height+140;}
    static offscreen(s,p,margin=80){const v=s.spawnView(),q=this.near(s,p);return q.x<v.left-margin||q.x>v.right+margin||q.y<v.top-margin||q.y>v.bottom+margin;}
    static eventPoint(s,radius=40,valid=()=>true){
      const v=s.spawnView(),p=s.player;
      for(let i=0;i<80;i++){
        const a=s.rand()*Math.PI*2,dx=Math.cos(a),dy=Math.sin(a),pad=radius+90+s.rand()*180;
        const tx=(dx>0?v.right+pad-p.x:p.x-v.left+pad)/Math.max(.0001,Math.abs(dx));
        const ty=(dy>0?v.bottom+pad-p.y:p.y-v.top+pad)/Math.max(.0001,Math.abs(dy));
        const d=Math.min(tx,ty),point={x:p.x+dx*d,y:p.y+dy*d};
        if(this.offscreen(s,point,radius+40)&&!s.blocked(point.x,point.y,radius)&&valid(point))return point;
      }
      return null;
    }
    static sync(s){
      const seen=new Set(),visit=o=>{
        if(!o||typeof o!=='object'||seen.has(o))return;
        if(!Array.isArray(o)&&Object.getPrototypeOf(o)!==Object.prototype)return;
        seen.add(o);
        if(Number.isFinite(o.x)&&Number.isFinite(o.y)){const p=this.near(s,o);o.x=p.x;o.y=p.y;}
        if(Number.isFinite(o.tx)&&Number.isFinite(o.ty)){const p=this.near(s,{x:o.tx,y:o.ty});o.tx=p.x;o.ty=p.y;}
        for(const [k,v] of Object.entries(o))if(!['sprite','obstacle'].includes(k))visit(v);
      };
      const c=s.creatures,e=s.encounters,g=s.greens,x=s.expedition;
      [s.obstacles,s.cat,s.owl,s.enemies,s.shots,s.effects,s.pickups,s.trail,c?.allies,c?.helpers,c?.strikes,c?.zones,c?.elements.zones,c?.elements.casts,c?.elements.links,c?.elements.dashOrigin,e?.nests,e?.beast,e?.boss,e?.bullets,e?.trails,e?.pulses,x?.shrine,x?.frog,x?.catCapture,x?.chests,s.relics?.cache,s.packs?.items,g?.props,g?.treasure,g?.slabColliders].forEach(visit);
      // Static art and transient sprites use the same nearest image as collision bodies.
      for(const sp of s.children.list){if(sp.parentContainer||sp.scrollFactorX!==1||!['Sprite','Image','Ellipse','TileSprite'].includes(sp.type)||sp===s.loopFloor)continue;
        const p=this.near(s,sp),dy=p.y-sp.y;sp.setPosition(p.x,p.y);if(sp.depth>-1000000&&Math.abs(sp.depth-sp.y)<500)sp.setDepth(sp.depth+dy);
      }
      g?.positionGround();
      if(s.loopFloor)s.loopFloor.setPosition(Math.floor(s.player.x/s.worldSize)*s.worldSize-s.worldSize,Math.floor(s.player.y/s.worldSize)*s.worldSize-s.worldSize);
    }
  }
  window.SurvivorWorld=SurvivorWorld;
})();
