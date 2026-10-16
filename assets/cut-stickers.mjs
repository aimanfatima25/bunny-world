// Aiman's stickers (assets/design/stickers/*.webp, 1254 x 1254) → public/img/stickers/<id>.webp
// Some have a real see-through background, some a painted grey/white checkerboard or black.
// The background is found by spreading from the edges over see-through, plain grey/white
// or black pixels; it stops at each sticker's cream outline. Then a soft edge and a trim.
// Run: node assets/cut-stickers.mjs
import sharp from 'sharp';
import fs from 'node:fs';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = here('design/stickers/'), OUT = here('../public/img/stickers/');
fs.mkdirSync(OUT, { recursive: true });

for (const file of fs.readdirSync(SRC).filter(f => f.endsWith('.webp'))) {
  const { data: D, info } = await sharp(SRC + file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const bgLike = i => {
    const r = D[i * 4], g = D[i * 4 + 1], b = D[i * 4 + 2], a = D[i * 4 + 3];
    if (a < 30) return true;
    const hi = Math.max(r, g, b), lo = Math.min(r, g, b);
    return hi - lo <= 10 && (lo >= 222 || hi <= 40);
  };
  const bg = new Uint8Array(N), q = new Int32Array(N);
  let h = 0, t = 0;
  const seed = i => { if (!bg[i] && bgLike(i)) { bg[i] = 1; q[t++] = i; } };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  while (h < t) { const i = q[h++], x = i % W; if (x > 0) seed(i - 1); if (x < W - 1) seed(i + 1); if (i >= W) seed(i - W); if (i < N - W) seed(i + W); }
  const out = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    if (bg[i]) continue;
    const x = i % W;
    const edge = (x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (i >= W && bg[i - W]) || (i < N - W && bg[i + W]);
    out[i * 4] = D[i * 4]; out[i * 4 + 1] = D[i * 4 + 1]; out[i * 4 + 2] = D[i * 4 + 2];
    out[i * 4 + 3] = edge ? 140 : D[i * 4 + 3];
  }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 })
    .resize({ width: 360, height: 360, fit: 'inside' }).webp({ quality: 90, alphaQuality: 100 }).toFile(OUT + file);
}
console.log('stickers cut');
