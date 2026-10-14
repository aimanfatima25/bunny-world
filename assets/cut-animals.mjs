// Cuts every animal out of Aiman's full-body animal sheet (assets/design/friends/animals-full.webp,
// 1536 x 1024, animals on a white background) into clean transparent pictures:
// public/img/animals/<id>.webp, used for the chosen animal at home, in the Shop and in the games.
//
// How it stays clean (no "paper cut-out" white rim):
//  1. the white background is found by spreading from the sheet's edges over almost-pure white,
//     so it stops at each animal's soft outline (white bunnies and sheep keep their white fur)
//  2. pixels just inside that edge are made partly see-through by how white they are, and the
//     white is taken back out of their colour, so the outline fades smoothly into anything
//  3. pieces close together (a Zzz, a flower, a chick on a head) stay with their animal
// The animals are numbered row by row, left to right; NAMES below gives each one its id.
// Run: node assets/cut-animals.mjs   (add "sheet" to also write assets/animals-check.png)
import sharp from 'sharp';
import fs from 'node:fs';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = here('design/friends/animals-full.webp');
const OUT = here('../public/img/animals/');
fs.mkdirSync(OUT, { recursive: true });

// one id per animal, in sheet order (row by row)
const NAMES = [
  'bunny', 'puppy', 'cat', 'bear', 'chick', 'panda', 'duck', 'penguin', 'sheep', 'squirrel',
  'fox', 'raccoon', 'deer', 'hedgehog', 'alpaca', 'goat', 'cow', 'piggy', 'otter', 'seal', 'capybara',
  'shihtzu', 'husky', 'ginger', 'fluffy', 'tuxedo', 'lop', 'cocoa-lop', 'snow-bunny', 'chinchilla', 'hamster', 'flower-capy',
  'turtle', 'lizard', 'chipmunk', 'red-panda', 'ferret', 'skunk', 'fennec', 'lamb', 'sloth', 'berry-hog', 'chick-capy',
  'owl', 'snowbird', 'crow', 'bow-chick', 'sparrow', 'dove', 'pigeon', 'flamingo', 'cockatoo', 'budgie', 'java', 'king-capy',
  'leaf-capy', 'scarf-capy', 'yuzu-capy', 'sleepy-capy', 'crown-capy', 'bunny-capy', 'frog-capy', 'duck-capy', 'sunny-capy', 'queen-capy'
];

const BG = 30;      // how far from pure white still counts as background (the sheet is 254,254,254)
const SOFT = 70;    // edge pixels this far from white become fully solid
const NEAR = 9;     // small pieces within about 3x this many pixels belong to the nearest animal

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, N = W * H;
const dist = i => 765 - data[i * 3] - data[i * 3 + 1] - data[i * 3 + 2];

// 1. background: spread from the edges over near-white pixels
const bg = new Uint8Array(N), queue = new Int32Array(N);
let head = 0, tail = 0;
const seed = i => { if (!bg[i] && dist(i) < BG) { bg[i] = 1; queue[tail++] = i; } };
for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
while (head < tail) {
  const i = queue[head++], x = i % W;
  if (x > 0) seed(i - 1); if (x < W - 1) seed(i + 1); if (i >= W) seed(i - W); if (i < N - W) seed(i + W);
}

// 3. group the animal pixels into joined-up shapes; small loose pieces (a Zzz, a flower)
//    join the nearest big shape
const label = new Int32Array(N).fill(-1);
let shapes = [];
for (let s = 0; s < N; s++) {
  if (bg[s] || label[s] >= 0) continue;
  const id = shapes.length, box = { id, x0: W, y0: H, x1: 0, y1: 0, size: 0 };
  head = tail = 0; queue[tail++] = s; label[s] = id;
  while (head < tail) {
    const i = queue[head++], x = i % W, y = (i - x) / W;
    box.size++; if (x < box.x0) box.x0 = x; if (x > box.x1) box.x1 = x; if (y < box.y0) box.y0 = y; if (y > box.y1) box.y1 = y;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1]) {
      if (j >= 0 && !bg[j] && label[j] < 0) { label[j] = id; queue[tail++] = j; }
    }
  }
  shapes.push(box);
}
const big = shapes.filter(b => b.size > 1500);
const gap = (a, b) => Math.max(0, a.x0 - b.x1, b.x0 - a.x1) + Math.max(0, a.y0 - b.y1, b.y0 - a.y1);
const owner = new Int32Array(shapes.length).map((_, i) => i);
for (const p of shapes) {
  if (p.size > 1500 || p.size < 80) continue;
  let best = null;
  for (const b of big) if (gap(p, b) <= NEAR * 3 && (!best || gap(p, b) < gap(p, best))) best = b;
  if (!best) continue;
  owner[p.id] = best.id;
  best.x0 = Math.min(best.x0, p.x0); best.y0 = Math.min(best.y0, p.y0);
  best.x1 = Math.max(best.x1, p.x1); best.y1 = Math.max(best.y1, p.y1);
}
for (let i = 0; i < N; i++) if (label[i] >= 0) label[i] = owner[label[i]];
shapes = big;

// keep real animals (drop specks), order them row by row, left to right
const animals = shapes.map(b => ({ ...b, cy: (b.y0 + b.y1) / 2 }));
animals.sort((a, b) => a.cy - b.cy);
const rows = [];
for (const a of animals) {
  const row = rows.find(r => Math.abs(r[0].cy - a.cy) < 70);
  row ? row.push(a) : rows.push([a]);
}
const ordered = rows.flatMap(r => r.sort((a, b) => a.x0 - b.x0));
console.log('rows:', rows.map(r => r.length).join(' '), '=', ordered.length, 'animals');
if (ordered.length !== NAMES.length) console.warn(`! found ${ordered.length} animals but NAMES has ${NAMES.length}`);

// 2. each animal: soft see-through edge with the white taken out, trimmed with a little room
const PAD = 4;
for (let n = 0; n < ordered.length; n++) {
  const b = ordered[n], name = NAMES[n] || `animal-${n + 1}`;
  const x0 = Math.max(0, b.x0 - PAD), y0 = Math.max(0, b.y0 - PAD);
  const w = Math.min(W - 1, b.x1 + PAD) - x0 + 1, h = Math.min(H - 1, b.y1 + PAD) - y0 + 1;
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y0 + y) * W + x0 + x, o = (y * w + x) * 4;
    if (bg[i] || label[i] !== b.id) continue;
    // touching the background? then fade by whiteness
    const sx = x0 + x, sy = y0 + y;
    let edge = false;
    for (let dy = -2; dy <= 2 && !edge; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = sx + dx, yy = sy + dy;
      if (xx >= 0 && xx < W && yy >= 0 && yy < H && bg[yy * W + xx]) { edge = true; break; }
    }
    const a = edge ? Math.min(1, Math.max(0, (dist(i) - BG) / SOFT)) : 1;
    if (a <= 0) continue;
    for (let c = 0; c < 3; c++) {
      const v = data[i * 3 + c];
      out[o + c] = Math.max(0, Math.min(255, Math.round((v - (1 - a) * 255) / a)));
    }
    out[o + 3] = Math.round(a * 255);
  }
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .resize({ height: 300, fit: 'inside', kernel: 'lanczos3' })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(OUT + name + '.webp');
}
console.log(`cut ${ordered.length} animals into public/img/animals/`);

// a check picture: every animal on a coloured background, with its number
if (process.argv.includes('sheet')) {
  const cell = 150, cols = 11, rowsN = Math.ceil(ordered.length / cols);
  const tiles = [];
  for (let n = 0; n < ordered.length; n++) {
    const name = NAMES[n] || `animal-${n + 1}`;
    const pic = await sharp(OUT + name + '.webp').resize(cell - 10, cell - 26, { fit: 'inside' }).png().toBuffer();
    const label = Buffer.from(`<svg width="${cell}" height="20"><text x="4" y="15" font-size="13" font-family="Arial" fill="#fff">${n + 1} ${name}</text></svg>`);
    tiles.push({ input: pic, left: (n % cols) * cell + 5, top: Math.floor(n / cols) * cell + 22 });
    tiles.push({ input: label, left: (n % cols) * cell, top: Math.floor(n / cols) * cell });
  }
  await sharp({ create: { width: cols * cell, height: rowsN * cell, channels: 3, background: '#5d8f8a' } })
    .composite(tiles).png().toFile(here('animals-check.png'));
  console.log('wrote assets/animals-check.png');
}
