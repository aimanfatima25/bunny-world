// Cuts the decorations for the "Choose Your Girl" and "Choose Your Friend" pages out of
// Aiman's designs (assets/design/choose-girl.webp and choose-friend.webp, 1223 x 1286).
// The cubbies themselves are built in CSS so any number of characters fits.
// Run: node assets/cut-choose.mjs
import sharp from 'sharp';
import fs from 'node:fs';

const here = p => new URL(p, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = here('../public/img/choose/');
fs.mkdirSync(OUT, { recursive: true });

// [design, left, top, width, height]
const pieces = {
  // roof with the title sign, lantern, bunny and chick
  'header-girl.webp': ['choose-girl', 0, 0, 1223, 245],
  'header-friend.webp': ['choose-friend', 0, 0, 1223, 255],
  // pink gingham curtains for the sides of the cabinet
  'curtain-left.webp': ['choose-girl', 22, 200, 150, 820],
  'curtain-right.webp': ['choose-girl', 1052, 200, 150, 820],
  // wooden cabinet back, for behind the cubbies
  'wood.webp': ['choose-girl', 330, 405, 130, 20],
  // tab icons
  'tab-all.webp': ['choose-girl', 180, 1158, 60, 52],
  'tab-casual.webp': ['choose-girl', 356, 1160, 60, 50],
  'tab-cozy.webp': ['choose-girl', 513, 1158, 60, 52],
  'tab-elegant.webp': ['choose-girl', 674, 1160, 60, 50],
  'tab-school.webp': ['choose-girl', 836, 1160, 60, 50],
  'tab-fantasy.webp': ['choose-girl', 998, 1158, 60, 52],
  'tab-mammals.webp': ['choose-friend', 343, 1168, 60, 50],
  'tab-birds.webp': ['choose-friend', 508, 1166, 60, 52],
  'tab-reptiles.webp': ['choose-friend', 673, 1168, 60, 50],
  'tab-sea.webp': ['choose-friend', 840, 1168, 60, 50],
  'tab-others.webp': ['choose-friend', 1006, 1166, 60, 52]
};

for (const [name, [design, left, top, width, height]] of Object.entries(pieces)) {
  await sharp(here(`design/${design}.webp`)).extract({ left, top, width, height }).webp({ quality: 88 }).toFile(OUT + name);
  console.log('cut', name);
}
