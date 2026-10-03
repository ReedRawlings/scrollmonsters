(() => {
  const ROOT = 'assets/player/grasslands/';
  // Hold each landing frame for 75ms after five 40ms rolling frames.
  const ROLL_FRAME_ENDS = [.04, .08, .12, .16, .20, .275];
  const DIRECTIONS = ['front', 'back', 'left', 'right'];
  // Frames are 64px cells with a small character near the lower middle.
  // Match the previous actor's world size and keep its collision center fixed.
  class SurvivorPlayer {
    static preload(scene) {
      for (const direction of DIRECTIONS) {
        for (const action of ['idle', 'walk', ...(['left', 'right'].includes(direction) ? ['dodgeroll'] : [])]) {
          scene.load.spritesheet(`player_${direction}_${action}`, ROOT + `spr_player_${direction}_${action}.png`, {frameWidth:64, frameHeight:64});
        }
      }
      scene.load.image('face_walker', ROOT + 'spr_player_front_idle.png');
    }
    static draw(scene) {
      const p = scene.player, dash = scene.expansion, rolling = dash.dashTime > 0;
      // The pack supplies lateral rolls only; vertical dashes retain the last roll facing.
      const facing = rolling ? dash.rollFacing : DIRECTIONS[p.dir];
      const action = rolling ? 'dodgeroll' : scene.moving ? 'walk' : 'idle';
      const frame = rolling ? ROLL_FRAME_ENDS.filter(end => SurvivorExpansion.dashDuration - dash.dashTime >= end).length : Math.floor(scene.elapsed * (scene.moving ? 10 : 8)) % (scene.moving ? 6 : 12);
      scene.playerSprite.setTexture(`player_${facing}_${action}`, frame)
        .setPosition(p.x,p.y).setOrigin(.5, .5625).setDepth(p.y+20)
        .setAlpha(p.inv>0 && Math.floor(p.inv*16)%2 ? .45 : 1);
    }
  }
  window.SurvivorPlayer = SurvivorPlayer;
})();
