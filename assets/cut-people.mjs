// Cuts the full-body girls and guys out of Aiman's sheets (1536 x 1024, two rows of 11 on a
// white background, numbers underneath) into clean transparent pictures:
//   assets/design/friends/girls-full.webp → public/img/standing/girl-<n>.webp
//   assets/design/friends/guys-full.webp  → public/img/standing/guy-<n>.webp
// Used for the person standing in the cottage, the Shop cubbies and the cooking-game customers.
// Same clean edge as assets/cut-animals.mjs: the white is found by spreading from the edges,
// then the outline fades softly (with the white taken out of its colour), so there's no
// "paper cut-out" rim. Small pieces next to the person (a keychain, a straw) stay with them.
// Run: node assets/cut-people.mjs
import sharp from 'sharp';
import fs from 'node:fs';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = here('../public/img/standing/');
fs.mkdirSync(OUT, { recursive: true });

const SHEETS = [
  { src: 'design/friends/girls-full.webp', prefix: 'girl', rows: [[90, 472], [555, 912]] },
  { src: 'design/friends/guys-full.webp', prefix: 'guy', rows: [[80, 470], [545, 912]] }
];
const COLS = 11, SLOT = 1536 / COLS;
const BG = 30;     // how far from pure white still counts as background
const SOFT = 70;   // edge pixels this far from white become fully solid
const NEAR = 25;   // loose pieces this close to the person are kept

for (const sheet of SHEETS) {
  const { data, info } = await sharp(here(sheet.src)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const SW = info.width;

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < COLS; col++) {
      const n = row * COLS + col + 1;
      const x0 = Math.round(col * SLOT), x1 = Math.round((col + 1) * SLOT);
      const [y0, y1] = sheet.rows[row];
      const W = x1 - x0, H = y1 - y0, N = W * H;
      const px = i => { const x = i % W, y = (i - x) / W; return ((y0 + y) * SW + x0 + x) * 3; };
      const dist = i => { const k = px(i); return 765 - data[k] - data[k + 1] - data[k + 2]; };

      // background: spread from the slot's edges over near-white pixels
      const bg = new Uint8Array(N), queue = new Int32Array(N);
      let head = 0, tail = 0;
      const seed = i => { if (!bg[i] && dist(i) < BG) { bg[i] = 1; queue[tail++] = i; } };
      for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
      for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
      while (head < tail) {
        const i = queue[head++], x = i % W, y = (i - x) / W;
        if (x > 0) seed(i - 1); if (x < W - 1) seed(i + 1); if (y > 0) seed(i - W); if (y < H - 1) seed(i + W);
      }

      // joined-up shapes; keep the biggest (the person) and pieces close to it
      const label = new Int32Array(N).fill(-1), shapes = [];
      for (let s = 0; s < N; s++) {
        if (bg[s] || label[s] >= 0) continue;
        const b = { id: shapes.length, size: 0, x0: W, y0: H, x1: 0, y1: 0 };
        head = tail = 0; queue[tail++] = s; label[s] = b.id;
        while (head < tail) {
          const i = queue[head++], x = i % W, y = (i - x) / W;
          b.size++; if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y;
          for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
            if (j >= 0 && !bg[j] && label[j] < 0) { label[j] = b.id; queue[tail++] = j; }
          }
        }
        shapes.push(b);
      }
      const main = shapes.reduce((a, b) => (b.size > a.size ? b : a));
      const gap = b => Math.max(0, main.x0 - b.x1, b.x0 - main.x1) + Math.max(0, main.y0 - b.y1, b.y0 - main.y1);
      const keep = new Uint8Array(shapes.length);
      // (pieces touching the slot's side are bits of the neighbours, so they go)
      const side = b => b.x0 === 0 || b.x1 === W - 1;
      shapes.forEach(b => { if (b === main || (b.size > 80 && gap(b) <= NEAR && !side(b))) keep[b.id] = 1; });

      // soft see-through edge, then trim to the person
      let minX = W, minY = H, maxX = 0, maxY = 0;
      const out = Buffer.alloc(N * 4);
      for (let i = 0; i < N; i++) {
        if (bg[i] || !keep[label[i]]) continue;
        const x = i % W, y = (i - x) / W;
        let edge = false;
        for (let dy = -2; dy <= 2 && !edge; dy++) for (let dx = -2; dx <= 2; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && xx < W && yy >= 0 && yy < H && bg[yy * W + xx]) { edge = true; break; }
        }
        const a = edge ? Math.min(1, Math.max(0, (dist(i) - BG) / SOFT)) : 1;
        if (a <= 0) continue;
        const k = px(i);
        for (let c = 0; c < 3; c++) out[i * 4 + c] = Math.max(0, Math.min(255, Math.round((data[k + c] - (1 - a) * 255) / a)));
        out[i * 4 + 3] = Math.round(a * 255);
        if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      await sharp(out, { raw: { width: W, height: H, channels: 4 } })
        .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
        .resize({ height: 700, kernel: 'lanczos3' })
        .webp({ quality: 90, alphaQuality: 100 })
        .toFile(OUT + `${sheet.prefix}-${n}.webp`);
    }
  }
  console.log(`cut 22 ${sheet.prefix}s`);
}
