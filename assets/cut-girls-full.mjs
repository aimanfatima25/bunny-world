// Cuts the 22 full-body girls out of Aiman's sheet (assets/design/friends/girls-full.webp,
// 1536 x 1024, two rows of 11 on a white background) into transparent pictures:
// public/img/standing/girl-<n>.webp, used for the girl standing in the cottage.
// The white around each girl is removed by spreading from the edges; only the biggest
// shape is kept, which drops the number labels and bits of the neighbouring girls.
// Run: node assets/cut-girls-full.mjs
import sharp from 'sharp';
import fs from 'node:fs';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = here('design/friends/girls-full.webp');
const OUT = here('../public/img/standing/');
fs.mkdirSync(OUT, { recursive: true });

const COLS = 11, SLOT = 1536 / COLS;
const ROWS = [[90, 472], [555, 912]];   // top and bottom of each row of girls (above the numbers)
const WHITE = 40;                       // how far from pure white still counts as background

const { data, info } = await sharp(SRC).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const SW = info.width;

for (let row = 0; row < 2; row++) {
  for (let col = 0; col < COLS; col++) {
    const n = row * COLS + col + 1;
    const x0 = Math.round(col * SLOT), x1 = Math.round((col + 1) * SLOT);
    const [y0, y1] = ROWS[row];
    const W = x1 - x0, H = y1 - y0, N = W * H;
    const px = i => { const x = i % W, y = (i - x) / W; return ((y0 + y) * SW + x0 + x) * 3; };
    const isWhite = i => { const k = px(i); return 765 - data[k] - data[k + 1] - data[k + 2] < WHITE; };

    // spread "background" from the slot's edges across white pixels
    const bg = new Uint8Array(N), queue = new Int32Array(N);
    let head = 0, tail = 0;
    const seed = i => { if (!bg[i] && isWhite(i)) { bg[i] = 1; queue[tail++] = i; } };
    for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
    while (head < tail) {
      const i = queue[head++], x = i % W, y = (i - x) / W;
      if (x > 0) seed(i - 1); if (x < W - 1) seed(i + 1); if (y > 0) seed(i - W); if (y < H - 1) seed(i + W);
    }

    // keep the biggest shape
    const label = new Int32Array(N).fill(-1);
    let best = -1, bestSize = 0;
    for (let s = 0, id = 0; s < N; s++) {
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

    // transparent everywhere else, then trim to the girl
    let minX = W, minY = H, maxX = 0, maxY = 0;
    const out = Buffer.alloc(N * 4);
    for (let i = 0; i < N; i++) {
      const k = px(i);
      out[i * 4] = data[k]; out[i * 4 + 1] = data[k + 1]; out[i * 4 + 2] = data[k + 2];
      if (label[i] === best) {
        out[i * 4 + 3] = 255;
        const x = i % W, y = (i - x) / W;
        if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    await sharp(out, { raw: { width: W, height: H, channels: 4 } })
      .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
      .resize({ height: 700, kernel: 'lanczos3' })
      .webp({ quality: 90, alphaQuality: 95 })
      .toFile(OUT + `girl-${n}.webp`);
  }
}
console.log('cut 22 standing girls');
