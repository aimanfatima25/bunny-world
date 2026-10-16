// Paints the brand logos off four characters before the Play Store (Google rejects apps that
// show other companies' logos): the NY cap (girl 20), NIKE cap (guy 10), Supreme hoodie (guy 14)
// and GAP hoodie (guy 21). Only the light letters inside each box are touched: they're found as
// pixels much lighter than the fabric around them, then filled in from the fabric next to them
// (the cloth colour, softened at the edges).
// Run once: node assets/remove-logos.mjs (it overwrites the pictures in public/img; the originals
// are in git history and in assets/design/friends).
import sharp from 'sharp';
import fs from 'node:fs';
sharp.cache(false);

const here = name => new URL(name, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const IMG = here('../public/img/');

// [file, box around the logo { x, y, w, h }, how much lighter than the cloth a letter is, how far to grow it]
const JOBS = [
  ['standing/girl-20.webp', { x: 50, y: 52, w: 48, h: 50 }, 14, 3],
  ['girls/girl-20.webp', { x: 84, y: 30, w: 44, h: 44 }, 14, 3],
  ['cutouts/girls/girl-20.webp', { x: 84, y: 30, w: 44, h: 44 }, 14, 3],
  ['standing/guy-10.webp', { x: 54, y: 36, w: 62, h: 26 }, 10, 3],
  ['standing/guy-14.webp', { x: 66, y: 292, w: 92, h: 40 }, 18, 3],
  ['standing/guy-21.webp', { x: 72, y: 292, w: 76, h: 50 }, 8, 3]
];

const lum = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

for (const [file, b, LIGHTER, GROW] of JOBS) {
  const path = IMG + file;
  const { data, info } = await sharp(fs.readFileSync(path)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, C = 4;
  const at = (x, y) => (y * W + x) * C;

  // the fabric's brightness: the middle value of the pixels on the box's edge
  const ring = [];
  for (let x = b.x; x < b.x + b.w; x++) for (const y of [b.y, b.y + b.h - 1]) ring.push(lum(data, at(x, y)));
  for (let y = b.y; y < b.y + b.h; y++) for (const x of [b.x, b.x + b.w - 1]) ring.push(lum(data, at(x, y)));
  ring.sort((p, q) => p - q);
  const fabric = ring[Math.floor(ring.length / 2)];

  // the letters: clearly lighter than the fabric (logos here are white/cream on dark cloth)
  let mask = new Uint8Array(W * info.height);
  for (let y = b.y + 1; y < b.y + b.h - 1; y++) for (let x = b.x + 1; x < b.x + b.w - 1; x++) {
    const i = at(x, y);
    if (data[i + 3] > 0 && lum(data, i) > fabric + LIGHTER) mask[y * W + x] = 1;
  }
  // grow the mask by a few pixels to catch the soft edges of the letters
  for (let pass = 0; pass < GROW; pass++) {
    const m2 = mask.slice();
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) {
      if (mask[y * W + x]) continue;
      if (mask[y * W + x - 1] || mask[y * W + x + 1] || mask[(y - 1) * W + x] || mask[(y + 1) * W + x]) m2[y * W + x] = 1;
    }
    mask = m2;
  }
  // fill the letters from the fabric around them
  const todo = [];
  for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) if (mask[y * W + x]) todo.push([x, y]);
  // fill with the cloth's usual colour (the middle value of the box's other pixels), then
  // soften just a little so the patch blends in without pulling in shadows
  const keep = [];
  for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) if (!mask[y * W + x] && data[at(x, y) + 3] > 200) keep.push(at(x, y));
  const mid = k => { const v = keep.map(i => data[i + k]).sort((p, q) => p - q); return v[Math.floor(v.length / 2)]; };
  const cloth = [mid(0), mid(1), mid(2)];
  for (const [x, y] of todo) { const i = at(x, y); data[i] = cloth[0]; data[i + 1] = cloth[1]; data[i + 2] = cloth[2]; }
  for (let it = 0; it < 4; it++) {
    for (const [x, y] of todo) {
      const i = at(x, y);
      for (let k = 0; k < 3; k++) {
        data[i + k] = (4 * data[i + k] + data[at(x - 1, y) + k] + data[at(x + 1, y) + k] + data[at(x, y - 1) + k] + data[at(x, y + 1) + k]) / 8;
      }
    }
  }
  fs.writeFileSync(path, await sharp(data, { raw: { width: W, height: info.height, channels: 4 } }).webp({ quality: 92 }).toBuffer());
  console.log(file, 'letters painted over:', todo.length, 'pixels');
}
