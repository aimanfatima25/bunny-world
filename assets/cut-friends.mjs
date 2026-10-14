// Cuts each friend card out of Aiman's animal sheets (assets/design/friends/*.webp).
// Cards sit on a plain cream background, so we find them by looking for rows and
// columns that contain picture pixels. Cards are saved left-to-right, top-to-bottom.
// Run: node assets/cut-friends.mjs
import sharp from 'sharp';
import fs from 'node:fs';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = here('../public/img/friends/');
fs.mkdirSync(OUT, { recursive: true });

// The card order in each sheet, read like a book
const SHEETS = {
  'sea.webp': ['clownfish', 'axolotl', 'goldie', 'betta', 'puffer', 'sleepy-axolotl', 'bluefish', 'goldfish', 'blackfish', 'happy-axolotl', 'angelfish', 'koi'],
  'animals-1.webp': ['penguin', 'fox', 'otter', 'deer', 'puppy', 'turtle', 'seal', 'raccoon', 'shark', 'octopus', 'hedgehog', 'croc'],
  'animals-2.webp': ['tiger', 'cat', 'lion', 'panda', 'chick'],
  'capybara.webp': ['capybara'],
  'bunny.webp': ['bunny'],
  // the girls; their cards have a number in the top-left corner that we paint over
  'girls.png': Array.from({ length: 22 }, (_, i) => `girl-${i + 1}`)
};
const GIRLS_OUT = here('../public/img/girls/');
fs.mkdirSync(GIRLS_OUT, { recursive: true });

// runs of true values in a list → [start, end] pairs, ignoring tiny gaps and specks
function runs(flags, minLen) {
  const out = [];
  let start = -1;
  flags.forEach((on, i) => {
    if (on && start < 0) start = i;
    if (!on && start >= 0) { if (i - start >= minLen) out.push([start, i]); start = -1; }
  });
  if (start >= 0 && flags.length - start >= minLen) out.push([start, flags.length]);
  return out;
}

for (const [file, names] of Object.entries(SHEETS)) {
  const src = here('design/friends/' + file);
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
  const bg = px(4, 4);
  // a "picture" pixel is clearly different from the cream background
  const limit = file === 'girls.png' ? 18 : 60; // the girls' pastel cards are very close to white
  const isArt = (x, y) => { const p = px(x, y); return Math.abs(p[0] - bg[0]) + Math.abs(p[1] - bg[1]) + Math.abs(p[2] - bg[2]) > limit; };

  const rowFlags = Array.from({ length: H }, (_, y) => { let n = 0; for (let x = 0; x < W; x += 2) if (isArt(x, y)) n++; return n > W * 0.04; });
  const boxes = [];
  for (const [y0, y1] of runs(rowFlags, 60)) {
    const colFlags = Array.from({ length: W }, (_, x) => { let n = 0; for (let y = y0; y < y1; y += 2) if (isArt(x, y)) n++; return n > (y1 - y0) * 0.08; });
    for (const [x0, x1] of runs(colFlags, 60)) boxes.push([x0, y0, x1, y1]);
  }
  if (boxes.length !== names.length) throw new Error(`${file}: found ${boxes.length} cards, expected ${names.length}`);

  const isGirls = file === 'girls.png';
  for (let i = 0; i < boxes.length; i++) {
    const [x0, y0, x1, y1] = boxes[i];
    // trim a few pixels so the cream border doesn't show
    const pad = 6;
    const left = x0 + pad, top = y0 + pad, w = x1 - x0 - pad * 2, h = y1 - y0 - pad * 2;
    let img = sharp(src).extract({ left, top, width: w, height: h });
    if (isGirls) {
      // cover the number badge with the card's own background colour
      // sample the plain background just below the number
      const [r, g, b] = px(left + Math.round(w * 0.06), top + Math.round(h * 0.25));
      const cover = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <rect x="0" y="0" width="${w * 0.17}" height="${h * 0.17}" rx="${w * 0.05}" fill="rgb(${r},${g},${b})"/></svg>`);
      // (sharp always resizes before compositing, so paste the cover first, then start again)
      img = sharp(await sharp(await img.png().toBuffer()).composite([{ input: cover }]).png().toBuffer());
    }
    await img
      .resize(300, 340, { fit: 'cover', position: isGirls ? 'top' : 'centre' })
      .webp({ quality: 86 })
      .toFile((isGirls ? GIRLS_OUT : OUT) + names[i] + '.webp');
  }
  console.log(`${file}: ${boxes.length} cards`);
}
