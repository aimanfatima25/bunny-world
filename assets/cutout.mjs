// Makes "cut-out" versions of the girl and animal pictures (transparent background) so the
// chosen girl and animal can sit on the cottage ledge on the home screen.
//
// How: starting from the edges of each card, spread over neighbouring pixels whose colour
// changes only a little (the soft watercolour background). The dark outline around the
// character stops the spreading. Then only the biggest leftover shape (the character) is
// kept, which removes little hearts and sparkles in the background.
// Run: node assets/cutout.mjs
import sharp from 'sharp';
import fs from 'node:fs';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const jobs = [
  ['../public/img/girls/', '../public/img/cutouts/girls/'],
  ['../public/img/friends/', '../public/img/cutouts/friends/']
];

// how much the colour may change between neighbours and still be "background"; girls are
// stricter because blonde hair is almost the same colour as their pastel backgrounds
const STEP = { girls: 12, friends: 26 };
// animals whose colours are very close to their backgrounds need a gentler setting
const GENTLE = { 'croc.webp': 9, 'shark.webp': 12 };
const DARK = 260;  // r+g+b below this is outline, never background

for (const [from, to] of jobs) {
  fs.mkdirSync(here(to), { recursive: true });
  const step = from.includes('girls') ? STEP.girls : STEP.friends;
  for (const file of fs.readdirSync(here(from))) {
    const { data, info } = await sharp(here(from + file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height, N = W * H;
    const bg = new Uint8Array(N);
    const queue = new Int32Array(N);
    let head = 0, tail = 0;
    const sum = i => data[i * 3] + data[i * 3 + 1] + data[i * 3 + 2];
    const diff = (a, b) => Math.abs(data[a * 3] - data[b * 3]) + Math.abs(data[a * 3 + 1] - data[b * 3 + 1]) + Math.abs(data[a * 3 + 2] - data[b * 3 + 2]);
    // seeds: the top and side edges; for animals also the bottom edge, so the grass and
    // seaweed they sit in goes too (for girls the bottom edge is their clothes)
    const girls = from.includes('girls');
    const seed = i => { if (!bg[i]) { bg[i] = 1; queue[tail++] = i; } };
    for (let x = 0; x < W; x++) { seed(x); if (!girls) seed((H - 1) * W + x); }
    for (let y = 0; y < (girls ? H * 0.75 : H); y++) { seed(y * W); seed(y * W + W - 1); }
    while (head < tail) {
      const i = queue[head++], x = i % W, y = (i - x) / W;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j < 0 || bg[j]) continue;
        if (sum(j) < DARK || diff(i, j) > (GENTLE[file] || step)) continue;
        bg[j] = 1;
        queue[tail++] = j;
      }
    }
    // keep only the biggest connected shape that isn't background
    const label = new Int32Array(N).fill(-1);
    let best = -1, bestSize = 0, id = 0;
    for (let s = 0; s < N; s++) {
      if (bg[s] || label[s] >= 0) continue;
      head = tail = 0; queue[tail++] = s; label[s] = id; let size = 0;
      while (head < tail) {
        const i = queue[head++], x = i % W, y = (i - x) / W; size++;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
          if (j >= 0 && !bg[j] && label[j] < 0) { label[j] = id; queue[tail++] = j; }
        }
      }
      if (size > bestSize) { bestSize = size; best = id; }
      id++;
    }
    const out = Buffer.alloc(N * 4);
    for (let i = 0; i < N; i++) {
      out[i * 4] = data[i * 3]; out[i * 4 + 1] = data[i * 3 + 1]; out[i * 4 + 2] = data[i * 3 + 2];
      out[i * 4 + 3] = label[i] === best ? 255 : 0;
    }
    await sharp(out, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 88, alphaQuality: 90 }).toFile(here(to + file));
  }
  console.log('cut out', from);
}
