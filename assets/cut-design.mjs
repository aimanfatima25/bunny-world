// Cuts the pieces we need out of Aiman's home screen design (assets/design/home.webp):
// the game card pictures, the star, the heart and the icons.
// Run: node assets/cut-design.mjs
import sharp from 'sharp';
import fs from 'node:fs';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = here('design/home.webp');
const OUT = here('../public/img/');
fs.mkdirSync(OUT + 'games', { recursive: true });
fs.mkdirSync(OUT + 'ui', { recursive: true });

// [left, top, width, height] in the 941 x 1672 design
const pieces = {
  'games/flappy.webp': [60, 699, 260, 134],
  'games/catch.webp': [347, 699, 250, 134],
  'games/merge.webp': [624, 699, 258, 134],
  'games/match3.webp': [60, 903, 252, 134],
  'games/adventure.webp': [337, 903, 270, 134],
  'games/bubble.webp': [634, 903, 250, 134],
  'games/memory.webp': [60, 1103, 252, 136],
  'games/room.webp': [337, 1103, 270, 136],
  'games/dressup.webp': [634, 1103, 250, 136],
  'games/garden.webp': [60, 1305, 252, 136],
  'games/friends.webp': [342, 1305, 262, 136],
  'games/aquarium.webp': [638, 1305, 246, 136],
  'ui/star.webp': [180, 52, 46, 46],
  'ui/heart.webp': [383, 52, 46, 46],
  'ui/calendar.webp': [641, 44, 70, 64],
  'ui/mail.webp': [737, 44, 70, 64],
  'ui/settings.webp': [833, 44, 70, 64],
  'ui/avatar.webp': [42, 26, 112, 112],
  'ui/nav-home.webp': [108, 1540, 60, 52],
  'ui/nav-games.webp': [276, 1540, 60, 52],
  'ui/nav-friends.webp': [438, 1540, 60, 52],
  'ui/nav-collection.webp': [608, 1540, 60, 52],
  'ui/nav-shop.webp': [776, 1540, 60, 52],
  // the cabin scene, used until a version without characters arrives
  'ui/scene.webp': [0, 112, 941, 578],
  // just the cottage wall above the girls' heads, for the scene with the chosen girl and animal
  'ui/scene-wall.webp': [230, 112, 376, 264]
};

for (const [name, [left, top, width, height]] of Object.entries(pieces)) {
  // pictures are saved at 2x so they stay sharp on phones
  await sharp(SRC).extract({ left, top, width, height }).resize(width * 2, height * 2, { kernel: 'lanczos3' }).webp({ quality: 88 }).toFile(OUT + name);
  console.log('cut', name);
}
