// Dress Up pictures from Aiman's "Pastel Kawaii Dress-Up Room" design (assets/design/dressup-room.png,
// 1254 x 1254):
//  - the base doll in her camisole and shorts → public/img/dressup/doll.webp (transparent)
//    The room behind her is removed by spreading from the edges of her box over everything
//    that isn't her dark outline; her outline, hair and body stay.
//  - the 18 dresses in the right-hand panel and the 7 accessories along the bottom → cut off
//    their cream cards into public/img/dressup/dress/<n>.webp and acc/<n>.webp
// Later sheets made on the base doll (assets/design/dressup-prompts.md) get their own section here.
// Run: node assets/cut-dressup.mjs   (add "check" to write assets/dressup-check.png)
import sharp from 'sharp';
import fs from 'node:fs';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = here('design/dressup-room.png');
const OUT = here('../public/img/dressup/');
['', 'dress', 'acc'].forEach(d => fs.mkdirSync(OUT + d, { recursive: true }));

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const SW = info.width;
const lum = (x, y) => { const k = (y * SW + x) * 3; return 0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2]; };

// spreads "background" from the box's edges (and any extra seeds) over pixels that pass `open`
function cutOut(box, open, seeds, thin, card) {
  const [x0, y0, W, H] = box, N = W * H;
  const bg = new Uint8Array(N), queue = new Int32Array(N);
  let head = 0, tail = 0;
  const seed = i => { if (!bg[i] && open(x0 + i % W, y0 + ((i / W) | 0))) { bg[i] = 1; queue[tail++] = i; } };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  (seeds || []).forEach(([sx, sy]) => seed((sy - y0) * W + (sx - x0)));
  while (head < tail) {
    const i = queue[head++], x = i % W;
    if (x > 0) seed(i - 1); if (x < W - 1) seed(i + 1); if (i >= W) seed(i - W); if (i < N - W) seed(i + W);
  }
  // keep the biggest joined-up shape (drops specks of the room)
  const label = new Int32Array(N).fill(-1);
  let best = -1, bestSize = 0;
  for (let s = 0, id = 0; s < N; s++) {
    if (bg[s] || label[s] >= 0) continue;
    head = tail = 0; queue[tail++] = s; label[s] = id; let size = 0;
    while (head < tail) {
      const i = queue[head++], x = i % W; size++;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1]) {
        if (j >= 0 && !bg[j] && label[j] < 0) { label[j] = id; queue[tail++] = j; }
      }
    }
    if (size > bestSize) { bestSize = size; best = id; }
    id++;
  }
  // optional clean-up: shave off thin lines of the room that touch her (wear the shape away by
  // `thin` pixels, keep what's still joined to her, then grow back only inside the shape)
  let keep = new Uint8Array(N);
  for (let i = 0; i < N; i++) keep[i] = label[i] === best ? 1 : 0;
  if (thin) {
    let worn = keep;
    for (let k = 0; k < thin; k++) {
      const next = new Uint8Array(N);
      for (let i = 0; i < N; i++) {
        const x = i % W;
        next[i] = worn[i] && (x > 0 && worn[i - 1]) && (x < W - 1 && worn[i + 1]) && (i >= W && worn[i - W]) && (i < N - W && worn[i + W]) ? 1 : 0;
      }
      worn = next;
    }
    // the biggest piece that's left
    const lab = new Int32Array(N).fill(-1); let big = -1, bigSize = 0;
    for (let s = 0, id = 0; s < N; s++) {
      if (!worn[s] || lab[s] >= 0) continue;
      head = tail = 0; queue[tail++] = s; lab[s] = id; let size = 0;
      while (head < tail) {
        const i = queue[head++], x = i % W; size++;
        for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1]) {
          if (j >= 0 && worn[j] && lab[j] < 0) { lab[j] = id; queue[tail++] = j; }
        }
      }
      if (size > bigSize) { bigSize = size; big = id; }
      id++;
    }
    let grown = new Uint8Array(N);
    for (let i = 0; i < N; i++) grown[i] = lab[i] === big ? 1 : 0;
    for (let k = 0; k < thin + 1; k++) {
      const next = grown.slice();
      for (let i = 0; i < N; i++) {
        if (grown[i] || !keep[i]) continue;
        const x = i % W;
        if ((x > 0 && grown[i - 1]) || (x < W - 1 && grown[i + 1]) || (i >= W && grown[i - W]) || (i < N - W && grown[i + W])) next[i] = 1;
      }
      grown = next;
    }
    keep = grown;
  }
  for (let i = 0; i < N; i++) if (!keep[i]) bg[i] = 1;

  let minX = W, minY = H, maxX = 0, maxY = 0;
  const out = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    if (!keep[i]) continue;
    const x = i % W, y = (i / W) | 0, k = ((y0 + y) * SW + x0 + x) * 3;
    out[i * 4] = data[k]; out[i * 4 + 1] = data[k + 1]; out[i * 4 + 2] = data[k + 2];
    // the very edge is a touch see-through, so it sits softly on any background
    const edge = (x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W]);
    out[i * 4 + 3] = edge ? 200 : 255;
    if (card) {
      // near the card: fade by how different from the card it is, and take the card's
      // colour back out, so no light rim is left
      let near = false;
      for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < W && yy >= 0 && yy < H && bg[yy * W + xx]) { near = true; break; }
      }
      if (near) {
        const d = Math.abs(data[k] - card[0]) + Math.abs(data[k + 1] - card[1]) + Math.abs(data[k + 2] - card[2]);
        const a = Math.min(1, Math.max(0, (d - 20) / 70));
        if (a <= 0) { out[i * 4 + 3] = 0; continue; }
        for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.max(0, Math.min(255, Math.round((data[k + c] - (1 - a) * card[c]) / a)));
        out[i * 4 + 3] = Math.round(a * 255);
      }
    }
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { out, W, H, crop: { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 } };
}

// peel light pixels off the outside, a ring at a time, until reaching the dark outline
// (the items had a pale "sticker" edge on their cards)
function peelRim(c, rings) {
  const { out, W, H } = c;
  for (let r = 0; r < rings; r++) {
    const gone = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!out[i * 4 + 3]) continue;
      const outside = (x === 0 || !out[(i - 1) * 4 + 3]) || (x === W - 1 || !out[(i + 1) * 4 + 3]) || (y === 0 || !out[(i - W) * 4 + 3]) || (y === H - 1 || !out[(i + W) * 4 + 3]);
      const light = 0.299 * out[i * 4] + 0.587 * out[i * 4 + 1] + 0.114 * out[i * 4 + 2] > 175;
      if (outside && light) gone.push(i);
    }
    gone.forEach(i => { out[i * 4 + 3] = 0; });
  }
}

async function save(c, file, height) {
  let img = sharp(c.out, { raw: { width: c.W, height: c.H, channels: 4 } }).extract(c.crop);
  if (height) img = sharp(await img.png().toBuffer()).resize({ height, kernel: 'lanczos3' });
  await img.webp({ quality: 92, alphaQuality: 100 }).toFile(file);
}

// 1. the doll: everything lighter than her outline is room, starting from the box edges and
//    the gaps between her legs and arms
const DOLL = [320, 262, 420, 748];
const doll = cutOut(DOLL, (x, y) => lum(x, y) > 140, [[520, 820], [522, 900], [430, 690], [612, 690]], 3);
await save(doll, OUT + 'doll.webp');
console.log('doll', doll.crop, '(in the design: left', DOLL[0] + doll.crop.left, 'top', DOLL[1] + doll.crop.top, ')');

// 2. dresses: a 3 x 6 grid of cream cards; the cream around each dress is removed
// the cards are an even cream (252, 239, 224); only colours very close to it count as card,
// so pale lilac or white skirts stay
const CREAM = (x, y) => { const k = (y * SW + x) * 3; return Math.abs(data[k] - 252) <= 6 && Math.abs(data[k + 1] - 239) <= 7 && Math.abs(data[k + 2] - 224) <= 8; };
const COLS = [856, 982, 1108], ROWS = [228, 354, 480, 606, 732, 858];
let n = 0;
for (const y of ROWS) for (const x of COLS) {
  n++;
  const c = cutOut([x + 6, y + 6, 104, 104], CREAM, null, 0, [252, 239, 224]);
  peelRim(c, 3);
  await save(c, OUT + `dress/${n}.webp`, 240);
}
console.log('cut', n, 'dresses');

// 3. accessories along the bottom bar
const ACC = [[270, 1138, 76, 70], [372, 1138, 76, 70], [474, 1138, 76, 70], [576, 1138, 76, 70], [676, 1138, 76, 70], [778, 1138, 76, 70], [878, 1138, 76, 70]];
// the bottom bar's buttons are a slightly different cream
const BAR = (x, y) => { const k = (y * SW + x) * 3; return data[k] > 228 && data[k + 1] > 214 && data[k + 2] > 196 && lum(x, y) > 222; };
for (let i = 0; i < ACC.length; i++) {
  const [ax, ay] = ACC[i], k = (ay * SW + ax) * 3;
  await save(cutOut(ACC[i], BAR, null, 0, [data[k], data[k + 1], data[k + 2]]), OUT + `acc/${i + 1}.webp`, 120);
}
console.log('cut', ACC.length, 'accessories');

if (process.argv.includes('check')) {
  const tiles = [{ input: await sharp(OUT + 'doll.webp').resize({ height: 500 }).png().toBuffer(), left: 10, top: 10 }];
  for (let i = 0; i < 18; i++) tiles.push({ input: await sharp(OUT + `dress/${i + 1}.webp`).resize(110, 110, { fit: 'inside' }).png().toBuffer(), left: 300 + (i % 6) * 120, top: 10 + Math.floor(i / 6) * 120 });
  for (let i = 0; i < 7; i++) tiles.push({ input: await sharp(OUT + `acc/${i + 1}.webp`).resize(90, 90, { fit: 'inside' }).png().toBuffer(), left: 300 + i * 100, top: 390 });
  await sharp({ create: { width: 1040, height: 520, channels: 3, background: '#5d8f8a' } }).composite(tiles).png().toFile(here('dressup-check.png'));
}

// 4. the doll's arm (her right arm, which isn't behind her hair) → arm.webp, used for full arms
//    under every dress's sleeves. Skin plus its outline; the hair beside it is left out.
{
  const dollImg = await sharp(OUT + 'doll.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const D = dollImg.data, DW = dollImg.info.width;
  const [ax, ay, aw, ah] = [238, 288, 52, 184];
  const skin = (x, y) => { const k = ((ay + y) * DW + ax + x) * 4; const [r, g, b, a] = [D[k], D[k + 1], D[k + 2], D[k + 3]]; return a > 0 && r > 205 && g > 160 && b > 140 && r >= g && g >= b - 6; };
  const out = Buffer.alloc(aw * ah * 4);
  for (let y = 0; y < ah; y++) for (let x = 0; x < aw; x++) {
    let take = skin(x, y);
    if (!take) {   // the outline right next to the skin
      for (let dy = -2; dy <= 2 && !take; dy++) for (let dx = -2; dx <= 2; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < aw && yy >= 0 && yy < ah && skin(xx, yy)) { take = true; break; }
      }
    }
    if (!take) continue;
    const k = ((ay + y) * DW + ax + x) * 4, o = (y * aw + x) * 4;
    out[o] = D[k]; out[o + 1] = D[k + 1]; out[o + 2] = D[k + 2]; out[o + 3] = D[k + 3];
  }
  // only the arm itself: the biggest joined-up piece (drops loose bits of hair)
  const N = aw * ah, lab = new Int32Array(N).fill(-1), q = new Int32Array(N);
  let big = -1, bigSize = 0;
  for (let s0 = 0, id = 0; s0 < N; s0++) {
    if (!out[s0 * 4 + 3] || lab[s0] >= 0) continue;
    let h = 0, t = 0, size = 0; q[t++] = s0; lab[s0] = id;
    while (h < t) {
      const i = q[h++], x = i % aw; size++;
      for (const j of [x > 0 ? i - 1 : -1, x < aw - 1 ? i + 1 : -1, i >= aw ? i - aw : -1, i < N - aw ? i + aw : -1]) {
        if (j >= 0 && out[j * 4 + 3] && lab[j] < 0) { lab[j] = id; q[t++] = j; }
      }
    }
    if (size > bigSize) { bigSize = size; big = id; }
    id++;
  }
  for (let i = 0; i < N; i++) if (lab[i] !== big) out[i * 4 + 3] = 0;
  await sharp(out, { raw: { width: aw, height: ah, channels: 4 } }).webp({ quality: 92, alphaQuality: 100 }).toFile(OUT + 'arm.webp');
}

// 5. where each dress's sleeves end, so the arms come out of them: for each side, the bottom
//    of the sleeve and the middle of its opening, as parts of the dress picture (0..1)
{
  const anchors = [];
  for (let n = 1; n <= 18; n++) {
    const { data: P, info: I } = await sharp(OUT + `dress/${n}.webp`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = I.width, H = I.height, solid = (x, y) => P[(y * W + x) * 4 + 3] > 100;
    const edge = (y, fromLeft) => {
      for (let i = 0; i < W; i++) { const x = fromLeft ? i : W - 1 - i; if (solid(x, y)) return i; }
      return W;
    };
    const side = fromLeft => {
      // the sleeve sticks out furthest in the top half; it ends where the outline jumps back in
      let best = W, bestY = 0;
      for (let y = Math.round(H * 0.08); y < H * 0.5; y++) { const e = edge(y, fromLeft); if (e < best) { best = e; bestY = y; } }
      let endY = bestY, inner = best;
      for (let y = bestY; y < H * 0.75; y++) {
        const e = edge(y, fromLeft);
        if (e > best + W * 0.07) { endY = y; inner = e; break; }
        endY = y;
      }
      const mid = (best + inner) / 2;
      return [+((fromLeft ? mid : W - 1 - mid) / W).toFixed(3), +(endY / H).toFixed(3)];
    };
    anchors.push({ left: side(true), right: side(false) });
  }
  fs.writeFileSync(OUT + 'sleeves.json', JSON.stringify(anchors));
  console.log('arm and sleeve points done');
}

// 6. the buttons from the design, used as they are on the Dress Up screen → ui/<name>.webp
{
  fs.mkdirSync(OUT + 'ui', { recursive: true });
  const UI = {
    back: [35, 25, 87, 87], dress: [16, 150, 110, 118], hair: [16, 280, 110, 116], makeup: [16, 412, 110, 120],
    accessories: [16, 546, 112, 118], background: [16, 680, 112, 122], save: [16, 812, 112, 120], done: [995, 1115, 232, 96]
  };
  for (const [name, [left, top, width, height]] of Object.entries(UI)) {
    await sharp(SRC).extract({ left, top, width, height }).webp({ quality: 90 }).toFile(OUT + `ui/${name}.webp`);
  }
  console.log('cut', Object.keys(UI).length, 'buttons');
}
