/* Native Phaser 4 presentation: reusable components and a retained display tree.
 * No custom Canvas rendering. Screens reconcile native objects in place so
 * button state and tweens survive simulation updates.
 */
(() => {
  'use strict';
  // The pixel font has very narrow spaces. Native Unicode thin spaces preserve
  // readable word gaps without custom canvas text drawing.
  const displayText = value => String(value).replace(/ /g, '\u2009');
  const color = value => {
    if (typeof value === 'number') return { color: value, alpha: 1 };
    if (/^#[0-9a-f]{8}$/i.test(value)) return { color:parseInt(value.slice(1,7),16),alpha:parseInt(value.slice(7),16)/255 };
    const c = Phaser.Display.Color.ValueToColor(value);
    return { color: c.color, alpha: c.alpha / 255 };
  };
  class WoodPanel extends Phaser.GameObjects.Container {
    constructor(scene) {
      super(scene, 0, 0);
      this.type = 'WoodPanel';
      this.background = new Phaser.GameObjects.NineSlice(scene, 0, 0, '__WHITE', undefined, 32, 32, 1, 1, 1, 1).setOrigin(0);
      this.add(this.background);
    }
    layout(key, width, height, borderX = 7, scale = 2, borderY = borderX) {
      const signature = [key, width, height, borderX, scale, borderY].join('|');
      if (signature !== this.layoutKey) {
        this.background.setTexture(key);
        this.background.setSlices(width / scale, height / scale, borderX, borderX, borderY, borderY);
        this.background.setScale(scale);
        this.setSize(width, height);
        this.layoutKey = signature;
      }
      return this;
    }
  }
  class WoodButton extends Phaser.GameObjects.Container {
    constructor(scene, view) {
      super(scene, 0, 0);
      this.type = 'WoodButton'; this.view = view;
      this.content = new Phaser.GameObjects.Container(scene, 0, 0);
      this.panel = new WoodPanel(scene);
      this.label = new Phaser.GameObjects.Text(scene, 0, 0, '', {fontFamily:'NinjaPixel', fontSize:16, color:'#30221a'}).setOrigin(0.5);
      this.content.add([this.panel, this.label]); this.add(this.content);
      this.on('pointerover', () => { if (this.callback) this.panel.background.setTint(0xffe4b8); });
      this.on('pointerout', () => { this.cancelPress(); this.panel.background.clearTint(); });
      this.on('pointerdown', pointer => {
        if (!this.callback) return;
        this.view.onPress?.();
        this.press = { id: pointer.id, x: pointer.x, y: pointer.y };
        this.animate(0.96, 65);
      });
      this.on('pointerup', pointer => {
        const press = this.press; this.cancelPress();
        if (!press || press.id !== pointer.id || Math.hypot(pointer.x-press.x, pointer.y-press.y)>6 || this.view.isDragging?.()) return;
        const callback = this.callback;
        if (callback) { this.view.onActivate?.(); callback(); this.view.invalidate?.(); }
      });
    }
    animate(scale, duration) {
      this.scene.tweens.killTweensOf(this.content);
      if (this.view.reducedMotion) this.content.setScale(1);
      else this.scene.tweens.add({targets:this.content, scaleX:scale, scaleY:scale, duration, ease:'Sine.Out'});
    }
    cancelPress() { this.press = null; this.animate(1, 120); }
    layout(label, x, y, width, height, options) {
      this.setPosition(x+width/2, y+height/2).setSize(width,height);
      this.panel.setPosition(-width/2,-height/2).layout(options.texture, width,height,options.borderX,options.scale,options.borderY);
      const signature = [label, options.size, options.color, width].join('|');
      if (signature !== this.labelKey) {
        this.label.setData('label',String(label)).setText(displayText(label)).setFontSize(options.size).setColor(options.color);
        this.label.setScale(Math.min(1,(width-16)/Math.max(1,this.label.width)),1);
        this.labelKey = signature;
      }
      this.callback = options.action || null;
      if (!this.input) this.setInteractive(new Phaser.Geom.Rectangle(0,0,width,height), Phaser.Geom.Rectangle.Contains);
      this.input.hitArea.setTo(0,0,width,height);
      this.input.cursor = this.callback ? 'pointer' : 'default';
      // Disabled controls still block aiming behind the UI but never activate.
      this.input.enabled = true;
      return this;
    }
    destroy(fromScene) { this.scene?.tweens.killTweensOf(this.content); super.destroy(fromScene); }
  }
  class NativeView {
    constructor(scene) {
      this.scene = scene; this.screen = null;
      this.root = scene.add.container(0,0);
      this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
      this.measure = scene.make.text({x:0,y:0,text:'',style:{fontFamily:'NinjaPixel',fontSize:16},add:false});
      this.groups = new Set(); this.stack = [];
      this.initGroup(this.root);
      const cancel = () => this.walk(object => { if (object instanceof WoodButton) object.cancelPress(); else if (object.press) object.press=null; });
      scene.input.on('pointerupoutside', cancel);
      scene.game.events.on('blur', cancel);
      scene.events.once('shutdown', () => {
        scene.game.events.off('blur', cancel);
        this.clear(); this.measure.destroy(); this.root.destroy();
      });
    }
    initGroup(group) { group.slots = new Map(); group.counts = {}; group.order = 0; this.groups.add(group); return group; }
    clear() {
      this.walk(object => this.scene.tweens.killTweensOf(object));
      for (const group of this.groups) group.clipShape?.destroy();
      this.root.removeAll(true); this.groups.clear(); this.initGroup(this.root);
    }
    begin(screen) {
      if (screen !== this.screen) { this.clear(); this.screen = screen; }
      for (const group of this.groups) { group.counts = {}; group.order = 0; }
      this.parent = this.root; this.stack = [];
      this.used = new Set();
    }
    object(type, create, key) {
      const parent = this.parent;
      const index = parent.counts[type] || 0; parent.counts[type] = index+1;
      const id = key === undefined ? `${type}:${index}` : `${type}:${key}`;
      let object = parent.slots.get(id);
      if (!object) { object = create(); parent.add(object); parent.slots.set(id, object); }
      object.setVisible(true).setActive(true).setDepth(parent.order++);
      if (object.input) object.input.enabled = true;
      this.used.add(object);
      return object;
    }
    end() {
      for (const group of this.groups) {
        for (const object of group.slots.values()) if (!this.used.has(object)) {
          object.setVisible(false).setActive(false);
          if (object.input) object.input.enabled = false;
          if (object instanceof WoodButton && object.press) object.cancelPress();
        }
        group.sort('depth');
      }
    }
    walk(callback, parent = this.root) { for(const child of parent.list) { callback(child); if(child.list) this.walk(callback,child); } }
    beginGroup(key, options = {}) {
      const group = this.object('Group', () => this.initGroup(new Phaser.GameObjects.Container(this.scene,0,0)),key);
      if(!options.preserveMotion)group.setPosition(options.x || 0,options.y || 0).setScale(options.scale || 1);
      if(options.enter && !group.entered) {
        group.entered=true;
        if(!this.reducedMotion) {
          group.setY(12).setAlpha(0);
          this.scene.tweens.add({targets:group,y:0,alpha:1,duration:220,ease:'Cubic.Out'});
        }
      }
      if (options.clip) {
        if (!group.clipShape) {
          group.clipShape = this.scene.make.graphics({add:false});
          group.enableFilters();
          group.filters.external.addMask(group.clipShape, false, this.scene.cameras.main);
        }
        const g = group.clipShape.clear().fillStyle(0xffffff);
        const shape = options.clip;
        if (Array.isArray(shape)) for(const circle of shape) g.fillCircle(circle.x,circle.y,circle.radius);
        else g.fillRect(shape.x,shape.y,shape.width,shape.height);
      }
      this.stack.push(this.parent); this.parent = group;
      return group;
    }
    endGroup() { this.parent = this.stack.pop(); }
    image(image, x, y, width, height, options = {}) {
      const key = typeof image === 'string' ? image : image?.key;
      if (!key || !this.scene.textures.exists(key)) return null;
      const texture = this.scene.textures.get(key);
      let frame = '__BASE';
      if (options.frame) {
        const [sx,sy,sw,sh] = options.frame;
        if(sw<=0||sh<=0) return null;
        frame = options.frame.join(',');
        if(!texture.has(frame)) texture.add(frame,0,sx,sy,sw,sh);
      }
      const object = this.object('Image',()=>new Phaser.GameObjects.Image(this.scene,0,0,key),options.id);
      object.setTexture(key,frame).setOrigin(options.center ? 0.5 : 0)
        .setPosition(x,y).setDisplaySize(width,height).setRotation(options.rotation || 0)
        .setFlipX(!!options.flipX).setAlpha(options.alpha ?? 1);
      return object;
    }
    text(value,x,y,size=18,tint='#fff',align='left',shadow=true) {
      const object = this.object('Text',()=>new Phaser.GameObjects.Text(this.scene,0,0,'',{fontFamily:'NinjaPixel',fontSize:size,color:tint}));
      const signature = [value,size,tint,shadow].join('|');
      if(object.styleKey!==signature) {
        object.setData('label',String(value)).setText(displayText(value)).setFontSize(size).setColor(tint);
        object.setShadow(shadow?2:0,shadow?2:0,'#172335',0,!!shadow,!!shadow);
        object.styleKey=signature;
      }
      object.setOrigin(align==='center'?0.5:align==='right'?1:0,0.5).setPosition(x,y).setScale(1).setAlpha(1);
      return object;
    }
    measureText(value,size=16) { this.measure.setFontSize(size).setText(displayText(value)); return this.measure.width; }
    graphics() { return this.object('Graphics',()=>new Phaser.GameObjects.Graphics(this.scene)).clear(); }
    rect(x,y,width,height,fill) { if(width<=0||height<=0)return; const c=color(fill); this.graphics().fillStyle(c.color,c.alpha).fillRect(x,y,width,height); }
    strokeRect(x,y,width,height,stroke,lineWidth=1) { const c=color(stroke); this.graphics().lineStyle(lineWidth,c.color,c.alpha).strokeRect(x,y,width,height); }
    circle(x,y,radius,fill,stroke,lineWidth=1) {
      const g=this.graphics(); if(fill){const c=color(fill);g.fillStyle(c.color,c.alpha).fillCircle(x,y,radius);}
      if(stroke){const c=color(stroke);g.lineStyle(lineWidth,c.color,c.alpha).strokeCircle(x,y,radius);}
    }
    ellipse(x,y,rx,ry,fill) { const c=color(fill); this.graphics().fillStyle(c.color,c.alpha).fillEllipse(x,y,rx*2,ry*2); }
    line(x1,y1,x2,y2,stroke,lineWidth=1) { const c=color(stroke);this.graphics().lineStyle(lineWidth,c.color,c.alpha).lineBetween(x1,y1,x2,y2); }
    panel(key,x,y,width,height,borderX=7,scale=2,borderY=borderX) {
      return this.object('WoodPanel',()=>new WoodPanel(this.scene)).setPosition(x,y).layout(key,width,height,borderX,scale,borderY);
    }
    button(label,x,y,width,height,options={}) {
      const settings={texture:'woodButton',size:16,color:'#30221a',borderX:7,borderY:3,scale:2,...options};
      return this.object('WoodButton',()=>new WoodButton(this.scene,this),`${x},${y}`).layout(label,x,y,width,height,settings);
    }
    hitArea(x,y,width,height,action,id,root=false) {
      const parent=this.parent;if(root)this.parent=this.root;
      const zone=this.object('Zone',()=>{
        const object=new Phaser.GameObjects.Zone(this.scene,0,0,1,1);
        object.on('pointerdown',p=>{this.onPress?.();object.press={id:p.id,x:p.x,y:p.y};});
        object.on('pointerup',p=>{
          const down=object.press;object.press=null;
          if(down&&down.id===p.id&&Math.hypot(p.x-down.x,p.y-down.y)<=6&&!this.isDragging?.()) {this.onActivate?.();object.action?.();this.invalidate?.();}
        });
        object.on('pointerout',()=>object.press=null);return object;
      },id);
      zone.setPosition(x+width/2,y+height/2).setSize(width,height);zone.action=action;
      if(!zone.input)zone.setInteractive();
      zone.input.hitArea.setTo(0,0,width,height);zone.input.cursor='pointer';
      this.parent=parent;return zone;
    }
    sheen(x,y,width,height,phase) {
      // Native gradient geometry, bounded within the node; no nested canvas clip.
      const position=phase*(width+28)-28;
      const left=Math.max(0,position),right=Math.min(width,position+28);
      if(right<=left)return;
      this.graphics().fillGradientStyle(0xfff0b0,0xfff0b0,0xfff0b0,0xfff0b0,0,0.2,0,0.2).fillRect(x+left,y,right-left,height);
    }
    confirmation(title,lines,onCancel,onConfirm) {
      this.beginGroup('confirmation');
      this.rect(0,0,540,900,'#000000aa');
      this.hitArea(0,0,540,900,()=>{},'modal-blocker');
      this.panel('woodPanel',34,290,472,300);
      this.text(title,270,342,26,'#fff0b0','center');
      lines.forEach((line,index)=>this.text(line,270,397+index*30,16,'#fff5d7','center',false));
      this.button('CANCEL',58,510,198,52,{action:onCancel});
      this.button('RESET',282,510,198,52,{action:onConfirm});
      this.endGroup();
    }
    reveal(id,x,y,width,height,options,token) {
      const holder=this.beginGroup('summon-reveal',{preserveMotion:true});
      this.image(id,0,0,width,height,{...options,center:true});
      if(holder.revealToken!==token) {
        holder.revealToken=token;this.scene.tweens.killTweensOf(holder);
        holder.setPosition(x,y).setAlpha(this.reducedMotion?1:0).setScale(this.reducedMotion?1:0.6);
        if(!this.reducedMotion)this.scene.tweens.add({targets:holder,alpha:1,scaleX:1,scaleY:1,duration:360,ease:'Back.Out'});
      } else holder.setPosition(x,y);
      this.endGroup();
    }
  }
  window.ScrollUI = { NativeView, WoodPanel, WoodButton };
})();
