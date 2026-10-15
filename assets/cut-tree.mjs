// The magic tree for the home scene, lifted out of Aiman's home-screen mockup
// (assets/design/home-tree.jpg, 800 x 1335). Her mockup is our home screen with the tree
// painted in, so wherever her picture differs from our plain cottage wall is the tree.
// Steps: line her picture up with our wall (found by matching: same size, our pixel (x, y) is
// her (x + 42, y + 49)), mark the pixels that differ, tidy the marks into one solid shape,
// leave out her chick (our animal friend is drawn separately), and save it see-through
// → public/img/ui/scene-tree.webp, the same size as our scene at 718 px wide.
// Needs: assets/scene-wall-718.png, our scene with no girl, animal or top bar, rendered at
// 360 x 640 css px and 1.994 device pixels (made by the test page; see HANDOFF).
// Run: node assets/cut-tree.mjs   (add "check" for assets/tree-check.png)
import sharp from 'sharp';
import fs from 'node:fs';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OX = 42, OY = 49;
const ours = await sharp(here('scene-wall-718.png')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = ours.info.width, H = Math.min(ours.info.height, 1335 - OY);
const hers = await sharp(here('design/home-tree.jpg')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const HW = hers.info.width;
const O = ours.data, P = hers.data, N = W * H;
const at = (x, y) => ((y + OY) * HW + x + OX) * 3;

// 1. pixels that differ from the wall (blurred a little first so tiny JPEG noise doesn't count)
const diff = new Float32Array(N);
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
  let s = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const a = ((y + dy) * W + x + dx) * 3, b = at(x + dx, y + dy);
    s += Math.abs(O[a] - P[b]) + Math.abs(O[a + 1] - P[b + 1]) + Math.abs(O[a + 2] - P[b + 2]);
  }
  diff[y * W + x] = s / 9;
}
let mask = new Uint8Array(N);
for (let i = 0; i < N; i++) mask[i] = diff[i] > 70 ? 1 : 0;

// 2. only the area where the tree is (top of the canopy to the ledge)
const AREA = { x0: 60, x1: 660, y0: 110, y1: 698 };
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (x < AREA.x0 || x > AREA.x1 || y < AREA.y0 || y > AREA.y1) mask[y * W + x] = 0;
}
// 3. tidy: close small gaps, keep big pieces, fill holes inside the shape
const grow = (m, k) => { let a = m; for (let n = 0; n < k; n++) { const b = a.slice(); for (let i = W; i < N - W; i++) if (!a[i] && (a[i - 1] || a[i + 1] || a[i - W] || a[i + W])) b[i] = 1; a = b; } return a; };
const shrink = (m, k) => { let a = m; for (let n = 0; n < k; n++) { const b = a.slice(); for (let i = W; i < N - W; i++) if (a[i] && !(a[i - 1] && a[i + 1] && a[i - W] && a[i + W])) b[i] = 0; a = b; } return a; };
mask = shrink(grow(mask, 4), 4);
const label = new Int32Array(N).fill(-1), q = new Int32Array(N);
const pieces = [];
for (let s = 0; s < N; s++) {
  if (!mask[s] || label[s] >= 0) continue;
  let h = 0, t = 0; q[t++] = s; label[s] = pieces.length;
  while (h < t) { const i = q[h++], x = i % W; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N && mask[j] && label[j] < 0) { label[j] = pieces.length; q[t++] = j; } }
  pieces.push(t);
}
const keep = pieces.map(n => n > 1500);
for (let i = 0; i < N; i++) if (mask[i] && !keep[label[i]]) mask[i] = 0;
// holes: background not reachable from the edge
const out = new Uint8Array(N); let h = 0, t = 0;
const seed = i => { if (!mask[i] && !out[i]) { out[i] = 1; q[t++] = i; } };
for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
while (h < t) { const i = q[h++], x = i % W; for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W]) if (j >= 0 && j < N) seed(j); }
for (let i = 0; i < N; i++) if (!out[i]) mask[i] = 1;

// her chick (pale yellow, bottom right) stays out: our animal friend stands there instead.
// Its yellow body plus the dark outline around it, inside its box.
const CHICK = { x0: 400, x1: 540, y0: 570, y1: 712 };
const yellow = new Uint8Array(N);
for (let y = CHICK.y0; y <= CHICK.y1; y++) for (let x = CHICK.x0; x <= CHICK.x1; x++) {
  const b = at(x, y), [r, g, bl] = [P[b], P[b + 1], P[b + 2]];
  if (r > 215 && g > 195 && r - bl > 25 && g - bl > 15) yellow[y * W + x] = 1;
}
for (let y = CHICK.y0; y <= CHICK.y1; y++) for (let x = CHICK.x0; x <= CHICK.x1; x++) {
  let near = false;
  for (let dy = -6; dy <= 6 && !near; dy++) for (let dx = -6; dx <= 6; dx++) if (yellow[(y + dy) * W + x + dx]) { near = true; break; }
  if (near) mask[y * W + x] = 0;
}

// 4. her pixels inside the shape, with a soft 2-pixel edge
const img = Buffer.alloc(N * 4);
const soft = grow(shrink(mask, 2), 0);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x; if (!mask[i]) continue;
  const b = at(x, y);
  img[i * 4] = P[b]; img[i * 4 + 1] = P[b + 1]; img[i * 4 + 2] = P[b + 2];
  img[i * 4 + 3] = soft[i] ? 255 : 150;
}
await sharp(img, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 90, alphaQuality: 100 }).toFile(here('../public/img/ui/scene-tree.webp'));
console.log('tree cut', W, 'x', H);
if (process.argv.includes('check')) {
  await sharp(here('scene-wall-718.png')).resize(W, H, { fit: 'cover', position: 'top' })
    .composite([{ input: here('../public/img/ui/scene-tree.webp') }]).png().toFile(here('tree-check.png'));
  await sharp(img, { raw: { width: W, height: H, channels: 4 } }).flatten({ background: '#3b6b8a' }).png().toFile(here('tree-alone.png'));
}

// trim to the tree itself and print where it sits in the scene (css px: our scene is 360 wide,
// and at 640 tall it is 384 tall; the tree is placed from the scene's bottom-left)
{
  const file = here('../public/img/ui/scene-tree.webp');
  const buf = fs.readFileSync(file);
  const { info } = await sharp(buf).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
  const left = -info.trimOffsetLeft, top = -info.trimOffsetTop;
  fs.writeFileSync(file, await sharp(buf).extract({ left, top, width: info.width, height: info.height }).webp({ quality: 90, alphaQuality: 100 }).toBuffer());
  const k = 1.994, sceneH = 384;
  console.log(`css: left ${(left / k).toFixed(1)}px, bottom ${(sceneH - (top + info.height) / k).toFixed(1)}px, width ${(info.width / k).toFixed(1)}px`);
}
