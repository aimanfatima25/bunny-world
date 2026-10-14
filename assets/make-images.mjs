// Draws the app icon and splash screen (the bunny with the pink bow) as PNGs.
// Run: node assets/make-images.mjs   then   npx capacitor-assets generate --android
import sharp from 'sharp';

const INK = '#3B2F4A';

// The bunny, drawn in a 120 x 120 box (same as the home screen)
const bunny = `
  <ellipse cx="45" cy="32" rx="10" ry="26" fill="#fff" stroke="${INK}" stroke-width="3" transform="rotate(-12 45 32)"/>
  <ellipse cx="45" cy="32" rx="4.5" ry="17" fill="#FFC2D6" transform="rotate(-12 45 32)"/>
  <ellipse cx="75" cy="32" rx="10" ry="26" fill="#fff" stroke="${INK}" stroke-width="3" transform="rotate(12 75 32)"/>
  <ellipse cx="75" cy="32" rx="4.5" ry="17" fill="#FFC2D6" transform="rotate(12 75 32)"/>
  <circle cx="60" cy="72" r="32" fill="#fff" stroke="${INK}" stroke-width="3"/>
  <path d="M40 48 L28 40 L28 56 Z M40 48 L52 40 L52 56 Z" fill="#FF7FAF" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
  <circle cx="40" cy="48" r="4.5" fill="#FF7FAF" stroke="${INK}" stroke-width="2.5"/>
  <circle cx="49" cy="70" r="4" fill="${INK}"/><circle cx="71" cy="70" r="4" fill="${INK}"/>
  <circle cx="50.5" cy="68.5" r="1.3" fill="#fff"/><circle cx="72.5" cy="68.5" r="1.3" fill="#fff"/>
  <ellipse cx="42" cy="80" rx="5" ry="3" fill="#FFB3CB"/><ellipse cx="78" cy="80" rx="5" ry="3" fill="#FFB3CB"/>
  <path d="M55 80 Q60 85 65 80" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;

// scale s, with the bunny's centre (60, 66) placed at (cx, cy)
const place = (cx, cy, s) => `<g transform="translate(${cx - 60 * s} ${cy - 66 * s}) scale(${s})">${bunny}</g>`;

const sky = size => `
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9FC9F2"/><stop offset="1" stop-color="#FBE3D2"/>
  </linearGradient></defs>
  <rect width="${size}" height="${size}" fill="url(#sky)"/>
  <circle cx="${size * 0.2}" cy="${size * 0.22}" r="${size * 0.05}" fill="#fff" opacity=".9"/>
  <circle cx="${size * 0.28}" cy="${size * 0.2}" r="${size * 0.065}" fill="#fff" opacity=".9"/>
  <circle cx="${size * 0.36}" cy="${size * 0.23}" r="${size * 0.045}" fill="#fff" opacity=".9"/>`;

const svg = (size, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`);

const images = {
  // full icon (older Android, and the Play Store)
  'icon-only.png': svg(1024, sky(1024) + place(512, 560, 6.6)),
  // adaptive icon: Android crops the outside, so the bunny stays in the middle
  'icon-foreground.png': svg(1024, place(512, 520, 4.4)),
  'icon-background.png': svg(1024, sky(1024)),
  // splash screen while the app opens
  'splash.png': svg(2732, `<rect width="2732" height="2732" fill="#241B33"/>` + place(1366, 1366, 7)),
  'splash-dark.png': svg(2732, `<rect width="2732" height="2732" fill="#241B33"/>` + place(1366, 1366, 7))
};

for (const [name, data] of Object.entries(images)) {
  await sharp(data).png().toFile(new URL(name, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
  console.log('made', name);
}
