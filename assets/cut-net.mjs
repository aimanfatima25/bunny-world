// Aiman's fishing net picture (assets/design/net.webp) has the "see-through" checkerboard
// painted into it. This turns the checkerboard really see-through: plain grey/white squares go,
// the bluish tint inside the net stays faint, the cream net strings and the wooden hoop and
// handle stay solid. → public/img/ui/net.webp (Catch the Fish)
// Run: node assets/cut-net.mjs
import sharp from 'sharp';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const { data, info } = await sharp(here('design/net.webp')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const N = info.width * info.height, out = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
  const hi = Math.max(r, g, b), lo = Math.min(r, g, b);
  let a = 255;
  if (hi - lo <= 6 && lo >= 212) a = 0;                                         // checkerboard (and the lines between its squares)
  else if (lo >= 215 && b >= r + 3) a = 60;                                      // the net's bluish see-through
  else if (lo >= 236 && r >= b) a = 235;                                         // cream strings
  out.set([r, g, b, a], i * 4);
}
await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ threshold: 1 }).resize({ width: 300 }).webp({ quality: 92, alphaQuality: 100 }).toFile(here('../public/img/ui/net.webp'));
console.log('net done');
