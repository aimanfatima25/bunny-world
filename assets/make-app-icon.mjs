// The Android app icon: a close-up of the five friends from Aiman's thumbnail
// (assets/design/thumbnail.jpg) filling the whole icon shape, edge to edge, like other games'
// icons (no title, no pink border). Run: node assets/make-app-icon.mjs
//  - adaptive icon (Android 8+): the picture is the BACKGROUND layer and the foreground is
//    empty. A layer is 108dp but phones only show the middle 72dp (2/3), so the close-up we want
//    to see (VIEW) sits in the middle and the picture carries on around it for the parts that
//    get cut off (the edges are mirrored where the picture runs out).
//  - older phones: ic_launcher.png (square) and ic_launcher_round.png show just VIEW.
import sharp from 'sharp';

const here = name => new URL(name, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = here('design/thumbnail.jpg');
const RES = here('../android/app/src/main/res/');

// what the icon should show, in thumbnail pixels: from the beret down to the main girl's hands
const VIEW = { x: 145, y: 168, size: 730 };
const PAD = 160;
const padded = await sharp(SRC).extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, extendWith: 'mirror' }).png().toBuffer();
const full = VIEW.size * 1.5;      // the whole 108dp layer around the 72dp view
const layer = await sharp(padded).extract({
  left: Math.round(VIEW.x + PAD - (full - VIEW.size) / 2), top: Math.round(VIEW.y + PAD - (full - VIEW.size) / 2),
  width: Math.round(full), height: Math.round(full)
}).png().toBuffer();
const view = await sharp(SRC).extract({ left: VIEW.x, top: VIEW.y, width: VIEW.size, height: VIEW.size }).png().toBuffer();

const sizes = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(sizes)) {
  const L = Math.round(108 * k), I = Math.round(48 * k);
  await sharp(layer).resize(L, L, { kernel: 'lanczos3' }).png().toFile(`${RES}mipmap-${d}/ic_launcher_background.png`);
  await sharp({ create: { width: L, height: L, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toFile(`${RES}mipmap-${d}/ic_launcher_foreground.png`);
  // older phones: a rounded square and a circle
  const sq = Buffer.from(`<svg width="${I}" height="${I}"><rect width="${I}" height="${I}" rx="${I * 0.22}" fill="#fff"/></svg>`);
  const ci = Buffer.from(`<svg width="${I}" height="${I}"><circle cx="${I / 2}" cy="${I / 2}" r="${I / 2}" fill="#fff"/></svg>`);
  const small = await sharp(view).resize(I, I, { kernel: 'lanczos3' }).png().toBuffer();
  await sharp(small).composite([{ input: sq, blend: 'dest-in' }]).png().toFile(`${RES}mipmap-${d}/ic_launcher.png`);
  await sharp(small).composite([{ input: ci, blend: 'dest-in' }]).png().toFile(`${RES}mipmap-${d}/ic_launcher_round.png`);
}
// a big copy to look at (and for the Play Store's 512 x 512 icon later)
await sharp(view).resize(512, 512).png().toFile(here('app-icon-512.png'));
console.log('made the app icon');
