/* Phaser display-list adapter for the game's pixel-art drawing vocabulary.
 * Images are pooled native Phaser Images. Bespoke text, paths and gradients are
 * custom Canvas Game Objects, preserving the approved UI and nested clipping.
 * Phaser owns the visible canvas, frame lifecycle, display list and textures.
 */
(() => {
  'use strict';
  const properties = ['fillStyle', 'strokeStyle', 'lineWidth', 'font', 'textAlign',
    'textBaseline', 'wordSpacing', 'globalAlpha', 'imageSmoothingEnabled'];
  const matrix = context => {
    const m = context.getTransform();
    return [m.a, m.b, m.c, m.d, m.e, m.f];
  };
  const trace = (context, path) => {
    context.beginPath();
    for (const step of path) {
      context.setTransform(...step.transform);
      context[step.method](...step.args);
    }
  };
  const applyClips = (context, clips) => {
    for (const path of clips) { trace(context, path); context.clip(); }
  };
  class CanvasArtwork extends Phaser.GameObjects.GameObject {
    constructor(scene) { super(scene, 'CanvasArtwork'); }
    renderCanvas(renderer, source, camera) {
      const context = renderer.currentContext;
      context.save();
      applyClips(context, this.paint.clips);
      context.setTransform(...this.paint.transform);
      for (const property of properties) context[property] = this.paint[property];
      context.globalAlpha *= camera.alpha;
      if (this.path) trace(context, this.path);
      context[this.method](...this.args);
      context.restore();
    }
  }
  window.createPhaserRenderer = scene => {
    const scratch = document.createElement('canvas').getContext('2d');
    const pool = [], imageKeys = new WeakMap();
    let cursor = 0, textureNumber = 0, clips = [], path = [];
    const stack = [];
    const snapshot = () => {
      const paint = { transform: matrix(scratch), clips: clips.slice() };
      for (const property of properties) paint[property] = scratch[property];
      return paint;
    };
    const acquire = type => {
      let object = pool[cursor];
      if (object && object.type !== type) { object.destroy(); object = null; }
      if (!object) {
        object = type === 'Image' ? scene.add.image(0, 0, '__WHITE').setOrigin(0) : scene.add.existing(new CanvasArtwork(scene));
        pool[cursor] = object;
      }
      object.setActive(true);
      object.visible = true;
      // GameObject has no Depth mixin; the native Image does.
      object.depth = cursor++;
      return object;
    };
    const draw = (method, args, drawingPath = null) => {
      const object = acquire('CanvasArtwork');
      object.paint = snapshot(); object.method = method; object.args = args;
      object.path = drawingPath;
    };
    const api = {
      clearRect() { cursor = 0; },
      endFrame() {
        for (let i = cursor; i < pool.length; i++) { pool[i].visible = false; pool[i].setActive(false); }
        scene.children.queueDepthSort();
      },
      save() { scratch.save(); stack.push(clips.slice()); },
      restore() { scratch.restore(); clips = stack.pop() || []; },
      beginPath() { path = []; },
      clip() { clips = [...clips, path.slice()]; },
      fill() { draw('fill', [], path.slice()); },
      stroke() { draw('stroke', [], path.slice()); },
      drawImage(image, ...args) {
        if (!image.complete || !image.naturalWidth) return;
        let key = imageKeys.get(image);
        if (!key) {
          key = `scroll-art-${textureNumber++}`;
          scene.textures.addImage(key, image);
          imageKeys.set(image, key);
        }
        let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight, x, y, w, h;
        if (args.length === 8) [sx, sy, sw, sh, x, y, w, h] = args;
        else if (args.length === 4) [x, y, w, h] = args;
        else { [x, y] = args; w = sw; h = sh; }
        if (sw <= 0 || sh <= 0 || w <= 0 || h <= 0) return;
        const texture = scene.textures.get(key), frame = `${sx},${sy},${sw},${sh}`;
        if (!texture.has(frame)) texture.add(frame, 0, sx, sy, sw, sh);
        const object = acquire('Image');
        const [a, b, c, d, e, f] = matrix(scratch);
        const scaleX = Math.hypot(a, b), scaleY = (a * d - b * c) / scaleX;
        object.setTexture(key, frame).setPosition(a * x + c * y + e, b * x + d * y + f)
          .setRotation(Math.atan2(b, a)).setScale(w / sw * scaleX, h / sh * scaleY)
          .setAlpha(scratch.globalAlpha);
        if (clips.length) {
          const savedClips = clips.slice();
          object.mask = {
            preRenderCanvas(renderer) { renderer.currentContext.save(); applyClips(renderer.currentContext, savedClips); },
            postRenderCanvas(renderer) { renderer.currentContext.restore(); }
          };
        } else object.mask = null;
      }
    };
    for (const method of ['translate', 'rotate', 'scale', 'measureText', 'createLinearGradient']) {
      api[method] = (...args) => scratch[method](...args);
    }
    for (const method of ['rect', 'arc', 'ellipse', 'moveTo', 'lineTo']) {
      api[method] = (...args) => path.push({ method, args, transform: matrix(scratch) });
    }
    for (const method of ['fillRect', 'strokeRect', 'fillText']) api[method] = (...args) => draw(method, args);
    for (const property of properties) Object.defineProperty(api, property, {
      get: () => scratch[property], set: value => { scratch[property] = value; }
    });
    scene.events.once('shutdown', () => {
      for (const key of scene.textures.getTextureKeys().filter(key => key.startsWith('scroll-art-'))) scene.textures.remove(key);
    });
    return api;
  };
})();
