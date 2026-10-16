// The Pancake Shop front screen from Aiman's design (assets/design/shop-pancake.jpg, 922 x 1152).
// The other shops are 941 x 1671, and cook.js measures everything in that size, so the picture
// is scaled to 941 wide and the extra height above and below is filled with the picture's own
// top and bottom edges stretched out (ceiling above, wooden counter below).
// → public/img/shops/pancake.webp (941 x 1671). The picture itself starts at y = TOP below.
// Run: node assets/make-pancake-shop.mjs
import sharp from 'sharp';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const W = 941, H = 1671;
const pic = await sharp(here('design/shop-pancake.jpg')).resize({ width: W }).toBuffer();
const { height: ph } = await sharp(pic).metadata();
const TOP = Math.round((H - ph) / 2), BOT = H - ph - TOP;
// fill: the picture's own top edge (ceiling) and bottom edge (wooden counter) stretched out
const strip = async (top, h, to) => sharp(pic).extract({ left: 0, top, width: W, height: h }).resize(W, to, { fit: 'fill' }).blur(6).toBuffer();
const above = await strip(0, 24, TOP), below = await strip(ph - 24, 24, BOT);
await sharp({ create: { width: W, height: H, channels: 3, background: '#8F604A' } })
  .composite([{ input: above, left: 0, top: 0 }, { input: below, left: 0, top: TOP + ph }, { input: pic, left: 0, top: TOP }])
  .webp({ quality: 88 }).toFile(here('../public/img/shops/pancake.webp'));
console.log('pancake shop: picture at y', TOP, 'height', ph);

// home card from her card design (left part, without the "Soon" badge and title)
await sharp(here('design/card-pancake.webp')).extract({ left: 85, top: 130, width: 1000, height: 515 })
  .resize(520, 268).webp({ quality: 90 }).toFile(here('../public/img/games/pancake.webp'));
