// Pictures for the three cooking games (Sushi Shop, Ramen Shop, Cake & Sweets):
//  - the home-screen cards, cut out of Aiman's card design (assets/design/shop-cards.webp,
//    1254 x 1254, three cards on wood) into public/img/games/<id>.webp, the same 520 x 268
//    shape as the other game cards (the tile adds the name underneath)
//  - her three shop screens (assets/design/shop-<id>.webp) copied to public/img/shops/ at
//    exactly 941 x 1671, the size every box in public/js/games/shops.js is measured in
// Run: node assets/cut-shop-cards.mjs
import sharp from 'sharp';
import fs from 'node:fs';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = here('design/shop-cards.webp');
// the picture part of each card: left, width, and the band (top, height) around the food
const CARDS = [
  { id: 'ramen', left: 52, width: 344, top: 520, height: 178 },
  { id: 'sushi', left: 456, width: 344, top: 545, height: 178 },
  { id: 'cake', left: 860, width: 344, top: 515, height: 178 }
];
for (const c of CARDS) {
  await sharp(SRC).extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .resize(520, 268, { fit: 'cover', kernel: 'lanczos3' })
    .webp({ quality: 90 }).toFile(here(`../public/img/games/${c.id}.webp`));
}
fs.mkdirSync(here('../public/img/shops'), { recursive: true });
for (const id of ['sushi', 'ramen', 'cake']) {
  await sharp(here(`design/shop-${id}.webp`)).resize(941, 1671, { fit: 'fill' })
    .webp({ quality: 88 }).toFile(here(`../public/img/shops/${id}.webp`));
}
console.log('cut 3 shop cards and 3 shop screens');
