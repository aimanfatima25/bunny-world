// Makes the "Choose Your Guy" sign for the Shop: Aiman's "Choose Your Girl" header with the
// words wiped off the wooden plaque (each row of the plaque is blended smoothly from the
// clean wood beside the hearts). The page writes "Choose Your Guy" on it in the game font.
// Run: node assets/make-header-guy.mjs
import sharp from 'sharp';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = here('../public/img/choose/header-girl.webp');
const OUT = here('../public/img/choose/header-guy.webp');
const X0 = 446, X1 = 768, Y0 = 118, Y1 = 182;   // the lettering, between the two hearts

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, C = 4;
const at = (x, y) => (y * W + x) * C;
const light = (x, y) => { const k = at(x, y); return data[k] + data[k + 1] + data[k + 2] > 560; };
for (let y = Y0; y <= Y1; y++) {
  // only rows where both ends are clean plaque wood
  if (!light(X0, y) || !light(X1, y)) continue;
  const a = at(X0, y), b = at(X1, y);
  for (let x = X0 + 1; x < X1; x++) {
    const t = (x - X0) / (X1 - X0), k = at(x, y);
    // keep the wood's own soft grain a little, mostly the clean blend
    for (let c = 0; c < 3; c++) {
      const blend = data[a + c] * (1 - t) + data[b + c] * t;
      data[k + c] = Math.round(blend);
    }
  }
}
await sharp(data, { raw: { width: W, height: info.height, channels: C } }).webp({ quality: 92 }).toFile(OUT);
console.log('wrote public/img/choose/header-guy.webp');
