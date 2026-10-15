// The splash screens from capacitor-assets are photo-sized PNGs (38 MB in all). This squeezes
// each one into a much smaller PNG with a limited palette (it looks the same on a phone).
// Run after: npx capacitor-assets generate --android
import sharp from 'sharp';
import fs from 'node:fs';
sharp.cache(false);
const RES = new URL('../android/app/src/main/res/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
let before = 0, after = 0;
for (const dir of fs.readdirSync(RES)) {
  const file = RES + dir + '/splash.png';
  if (!fs.existsSync(file)) continue;
  const input = fs.readFileSync(file);
  const out = await sharp(input).png({ palette: true, quality: 80, compressionLevel: 9, effort: 8 }).toBuffer();
  before += input.length; after += out.length;
  fs.writeFileSync(file, out);
}
console.log(`splash screens: ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB`);
