// App icon, splash screen and link-preview card for Kawaii Corner, all from Aiman's
// thumbnail picture (assets/design/thumbnail.jpg, 1024 x 1024):
//  - icon: her whole picture (Aiman wants the full group with the title as the icon)
//  - splash: the whole picture with its "Kawaii Corner" title, on a soft pink card
//  - public/img/og-image.jpg: the title and the group, for the preview card when the link is shared
// Run: node assets/make-images.mjs, then npx capacitor-assets generate --android,
// then node assets/shrink-splash.mjs (the splash screens come out huge otherwise)
import sharp from 'sharp';

const here = name => new URL(name, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = here('design/thumbnail.jpg');
const crop = (left, top, width, height) => sharp(SRC).extract({ left, top, width, height });

const icon = await sharp(SRC).resize(1024, 1024, { kernel: 'lanczos3' }).png().toBuffer();
await sharp(icon).toFile(here('icon-only.png'));
// adaptive icon: Android shows only the middle ~2/3 (a circle or squircle), so the picture is
// shrunk into that safe middle on a background in her room's soft pink
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#F6DCE6' } })
  .composite([{ input: await sharp(icon).resize(680, 680).png().toBuffer(), left: 172, top: 172 }]).png().toFile(here('icon-foreground.png'));
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: '#F6DCE6' } }).png().toFile(here('icon-background.png'));
await sharp(icon).resize(256, 256).png().toFile(here('icon-preview.png'));

// splash: the whole picture in a rounded card in the middle
const group = await sharp(SRC).resize(1900, 1900).png().toBuffer();
const mask = Buffer.from('<svg width="1900" height="1900"><rect width="1900" height="1900" rx="180" fill="#fff"/></svg>');
const card = await sharp(group).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
for (const name of ['splash.png', 'splash-dark.png']) {
  await sharp({ create: { width: 2732, height: 2732, channels: 3, background: '#F6DCE6' } })
    .composite([{ input: card, left: 416, top: 416 }]).png().toFile(here(name));
}

// link preview card (1200 x 630)
await crop(0, 30, 1024, 539).resize(1200, 630).jpeg({ quality: 86 }).toFile(here('../public/img/og-image.jpg'));
console.log('made icon, splash and preview card');
