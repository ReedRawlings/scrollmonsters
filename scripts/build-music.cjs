const fs = require('node:fs');
const path = require('node:path');
const extensions = new Set(['.ogg', '.mp3', '.wav', '.m4a', '.aac', '.webm']);
function scanMusic(directory) {
  const list = folder => fs.existsSync(folder) ? fs.readdirSync(folder, { withFileTypes: true })
    .filter(file => file.isFile() && extensions.has(path.extname(file.name).toLowerCase()))
    .map(file => file.name).sort((a, b) => a.localeCompare(b, 'en')) : [];
  return { combat: list(directory), menu: list(path.join(directory, 'menu')).map(name => `menu/${name}`) };
}
function buildMusic(directory = path.join(__dirname, '../assets/music')) {
  const playlist = scanMusic(directory);
  fs.writeFileSync(path.join(directory, 'playlist.js'), `// Generated from the music folder. Do not edit by hand.\nwindow.GAME_MUSIC = ${JSON.stringify(playlist, null, 2)};\n`);
  return playlist;
}
if (require.main === module) {
  const playlist = buildMusic();
  console.log(`Music: ${playlist.combat.length} combat tracks, ${playlist.menu.length} menu tracks`);
}
module.exports = { scanMusic, buildMusic };
