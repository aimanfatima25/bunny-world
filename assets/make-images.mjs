// Draws the app icon and splash screen as PNGs: a group of cute animal friends
// (bunny, capybara, lion, tiger, bear, panda, ice bear and a fish in a bubble)
// in front of a pastel castle town with a rainbow and sparkles.
// Run: node assets/make-images.mjs   then   npx capacitor-assets generate --android
import sharp from 'sharp';

const INK = '#3B2F4A';
const sw = r => (r * 0.075).toFixed(1); // outline width that grows with the head

// ---------- faces ----------

function eyes(x, y, r, { sleepy = false, dots = false, color = INK, dx = 0.32 } = {}) {
  const e = r * 0.1;
  return [-1, 1].map(s => {
    const ex = x + s * r * dx;
    if (sleepy) return `<path d="M${ex - e} ${y} Q${ex} ${y + e * 1.1} ${ex + e} ${y}" fill="none" stroke="${INK}" stroke-width="${sw(r)}" stroke-linecap="round"/>`;
    if (dots) return `<circle cx="${ex}" cy="${y}" r="${e * 0.7}" fill="${color}"/>`;
    return `<circle cx="${ex}" cy="${y}" r="${e}" fill="${color}"/><circle cx="${ex + e * 0.35}" cy="${y - e * 0.35}" r="${e * 0.35}" fill="#fff"/>`;
  }).join('');
}
const cheeks = (x, y, r, dx = 0.55) =>
  [-1, 1].map(s => `<ellipse cx="${x + s * r * dx}" cy="${y}" rx="${r * 0.15}" ry="${r * 0.09}" fill="#FFB3CB"/>`).join('');
const smile = (x, y, r) =>
  `<path d="M${x - r * 0.13} ${y} Q${x - r * 0.065} ${y + r * 0.1} ${x} ${y} Q${x + r * 0.065} ${y + r * 0.1} ${x + r * 0.13} ${y}" fill="none" stroke="${INK}" stroke-width="${sw(r) * 0.8}" stroke-linecap="round"/>`;
const circle = (x, y, r, fill, w) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${INK}" stroke-width="${w}"/>`;
const ellipse = (x, y, rx, ry, fill, w, rot = 0) =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${w ? `stroke="${INK}" stroke-width="${w}"` : ''} transform="rotate(${rot} ${x} ${y})"/>`;
const nose = (x, y, r, fill = INK) => ellipse(x, y, r * 0.11, r * 0.075, fill);

// ---------- animals (head centred on x, y with radius r) ----------

const animals = {
  bunny(x, y, r) {
    const w = sw(r);
    return [-1, 1].map(s => ellipse(x + s * r * 0.36, y - r * 1.05, r * 0.27, r * 0.68, '#fff', w, s * 12)
        + ellipse(x + s * r * 0.36, y - r * 1.05, r * 0.12, r * 0.45, '#FFC2D6', 0, s * 12)).join('')
      + circle(x, y, r, '#fff', w)
      + `<path d="M${x - r * 0.55} ${y - r * 0.7} l${-r * 0.36} ${-r * 0.24} v${r * 0.48} Z M${x - r * 0.55} ${y - r * 0.7} l${r * 0.36} ${-r * 0.24} v${r * 0.48} Z" fill="#FF7FAF" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`
      + circle(x - r * 0.55, y - r * 0.7, r * 0.13, '#FF7FAF', w)
      + eyes(x, y, r) + cheeks(x, y + r * 0.28, r) + smile(x, y + r * 0.3, r);
  },
  capybara(x, y, r) {
    const w = sw(r);
    return [-1, 1].map(s => circle(x + s * r * 0.66, y - r * 0.7, r * 0.18, '#B07A4A', w)).join('')
      + ellipse(x, y, r * 1.08, r * 0.92, '#C8925E', w)
      + ellipse(x, y + r * 0.34, r * 0.5, r * 0.3, '#B5814F')
      + ellipse(x - r * 0.16, y + r * 0.24, r * 0.07, r * 0.045, INK, 0, -20) + ellipse(x + r * 0.16, y + r * 0.24, r * 0.07, r * 0.045, INK, 0, 20)
      + `<path d="M${x} ${y + r * 0.3} v${r * 0.12} M${x - r * 0.14} ${y + r * 0.42} Q${x - r * 0.07} ${y + r * 0.52} ${x} ${y + r * 0.42} Q${x + r * 0.07} ${y + r * 0.52} ${x + r * 0.14} ${y + r * 0.42}" fill="none" stroke="${INK}" stroke-width="${w * 0.7}" stroke-linecap="round"/>`
      + eyes(x, y - r * 0.15, r, { sleepy: true, dx: 0.42 }) + cheeks(x, y + r * 0.12, r, 0.75)
      // a little yuzu on its head, like the famous relaxing capybaras
      + circle(x + r * 0.05, y - r * 0.98, r * 0.24, '#F7A23B', w)
      + ellipse(x + r * 0.2, y - r * 1.22, r * 0.14, r * 0.07, '#4FA35A', w * 0.8, -25);
  },
  lion(x, y, r) {
    const w = sw(r);
    let mane = '';
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      mane += circle(x + Math.cos(a) * r * 0.98, y + Math.sin(a) * r * 0.98, r * 0.36, '#D9792B', w);
    }
    return mane + circle(x, y, r * 0.98, '#D9792B', 0)
      + [-1, 1].map(s => circle(x + s * r * 0.6, y - r * 0.62, r * 0.2, '#F7C548', w)).join('')
      + circle(x, y, r * 0.8, '#F7C548', w)
      + ellipse(x, y + r * 0.32, r * 0.36, r * 0.24, '#FFE7A8')
      + nose(x, y + r * 0.2, r) + eyes(x, y - r * 0.05, r, { dx: 0.3 }) + cheeks(x, y + r * 0.25, r, 0.5) + smile(x, y + r * 0.36, r);
  },
  tiger(x, y, r) {
    const w = sw(r);
    const stripe = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"/>`;
    return [-1, 1].map(s => circle(x + s * r * 0.66, y - r * 0.66, r * 0.26, '#F28C28', w) + circle(x + s * r * 0.66, y - r * 0.66, r * 0.12, '#fff', 0)).join('')
      + circle(x, y, r, '#F28C28', w)
      + stripe(`M${x} ${y - r * 0.95} V${y - r * 0.68} M${x - r * 0.22} ${y - r * 0.92} L${x - r * 0.16} ${y - r * 0.72} M${x + r * 0.22} ${y - r * 0.92} L${x + r * 0.16} ${y - r * 0.72}`)
      + stripe(`M${x - r * 0.98} ${y + r * 0.05} L${x - r * 0.72} ${y + r * 0.1} M${x - r * 0.95} ${y + r * 0.28} L${x - r * 0.72} ${y + r * 0.26} M${x + r * 0.98} ${y + r * 0.05} L${x + r * 0.72} ${y + r * 0.1} M${x + r * 0.95} ${y + r * 0.28} L${x + r * 0.72} ${y + r * 0.26}`)
      + ellipse(x, y + r * 0.36, r * 0.45, r * 0.32, '#fff')
      + nose(x, y + r * 0.2, r, '#FF7FAF') + eyes(x, y - r * 0.08, r) + smile(x, y + r * 0.36, r);
  },
  bear(x, y, r) {
    const w = sw(r);
    return [-1, 1].map(s => circle(x + s * r * 0.68, y - r * 0.66, r * 0.28, '#A9714B', w) + circle(x + s * r * 0.68, y - r * 0.66, r * 0.14, '#E3B98F', 0)).join('')
      + circle(x, y, r, '#A9714B', w)
      + ellipse(x, y + r * 0.33, r * 0.42, r * 0.3, '#E3B98F')
      + nose(x, y + r * 0.2, r) + eyes(x, y - r * 0.08, r) + cheeks(x, y + r * 0.22, r, 0.6) + smile(x, y + r * 0.36, r);
  },
  panda(x, y, r) {
    const w = sw(r);
    return [-1, 1].map(s => circle(x + s * r * 0.66, y - r * 0.68, r * 0.27, INK, 0)).join('')
      + circle(x, y, r, '#fff', w)
      + ellipse(x - r * 0.33, y, r * 0.2, r * 0.27, INK, 0, 25) + ellipse(x + r * 0.33, y, r * 0.2, r * 0.27, INK, 0, -25)
      + eyes(x, y - r * 0.03, r, { color: '#fff', dots: true })
      + nose(x, y + r * 0.26, r) + cheeks(x, y + r * 0.32, r, 0.62) + smile(x, y + r * 0.4, r);
  },
  iceBear(x, y, r) {
    const w = sw(r);
    return [-1, 1].map(s => circle(x + s * r * 0.6, y - r * 0.74, r * 0.2, '#F4F8FB', w)).join('')
      + ellipse(x, y, r * 1.02, r * 0.94, '#F4F8FB', w)
      + ellipse(x, y + r * 0.2, r * 0.17, r * 0.11, INK)
      + eyes(x, y - r * 0.05, r, { dots: true, dx: 0.38 }) + cheeks(x, y + r * 0.22, r, 0.62) + smile(x, y + r * 0.34, r);
  },
  fishBubble(x, y, r) {
    const w = sw(r);
    return circle(x, y, r, 'rgba(214,240,255,.75)', w)
      + `<path d="M${x - r * 0.62} ${y + r * 0.02} l${-r * 0.24} ${-r * 0.22} v${r * 0.44} Z" fill="#F28C28" stroke="${INK}" stroke-width="${w * 0.8}" stroke-linejoin="round"/>`
      + ellipse(x, y + r * 0.02, r * 0.55, r * 0.42, '#F28C28', w * 0.8)
      + `<path d="M${x - r * 0.12} ${y - r * 0.38} q${-r * 0.06} ${r * 0.4} 0 ${r * 0.8}" fill="none" stroke="#fff" stroke-width="${w * 1.6}"/>`
      + circle(x + r * 0.28, y - r * 0.05, r * 0.07, INK, 0)
      + `<path d="M${x - r * 0.62} ${y - r * 0.45} A${r * 0.78} ${r * 0.78} 0 0 1 ${x - r * 0.1} ${y - r * 0.78}" fill="none" stroke="#fff" stroke-width="${w * 1.4}" stroke-linecap="round"/>`;
  }
};

// ---------- background ----------

const sparkle = (x, y, s, fill = '#fff') =>
  `<path d="M${x} ${y - s} Q${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z" fill="${fill}"/>`;

function tower(x, top, base, w, roof) {
  return `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${base - top}" rx="6" fill="#FFE3EE" stroke="${INK}" stroke-width="6"/>`
    + `<path d="M${x - w / 2 - 12} ${top + 4} L${x} ${top - w * 1.1} L${x + w / 2 + 12} ${top + 4} Z" fill="${roof}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`
    + `<path d="M${x} ${top - w * 1.1} v-46" stroke="${INK}" stroke-width="5"/><path d="M${x} ${top - w * 1.1 - 46} l34 12 l-34 12 Z" fill="#FF7FAF" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`
    + `<rect x="${x - 11}" y="${top + 40}" width="22" height="32" rx="11" fill="#9FC9F2" stroke="${INK}" stroke-width="4"/>`;
}

function house(x, base, w, h, wall, roof) {
  return `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${wall}" stroke="${INK}" stroke-width="5"/>`
    + `<path d="M${x - 8} ${base - h} L${x + w / 2} ${base - h - w * 0.55} L${x + w + 8} ${base - h} Z" fill="${roof}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`
    + `<rect x="${x + w / 2 - 9}" y="${base - h + 18}" width="18" height="18" rx="3" fill="#FFF0B8" stroke="${INK}" stroke-width="3"/>`;
}

const scene = `
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#BFE3FF"/><stop offset=".6" stop-color="#E9DDF7"/><stop offset="1" stop-color="#FFE3EE"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#sky)"/>
  ${[['#FFB3CB', 330], ['#FFE08A', 302], ['#B9DDB0', 274], ['#9FC9F2', 246]].map(([c, rad]) =>
    `<path d="M${512 - rad} 560 A${rad} ${rad} 0 0 1 ${512 + rad} 560" fill="none" stroke="${c}" stroke-width="28" opacity=".85"/>`).join('')}
  <g fill="#fff" opacity=".95">
    <circle cx="210" cy="250" r="34"/><circle cx="250" cy="236" r="44"/><circle cx="292" cy="254" r="30"/>
    <circle cx="760" cy="200" r="28"/><circle cx="796" cy="188" r="36"/><circle cx="832" cy="204" r="26"/>
  </g>
  ${house(170, 560, 90, 90, '#FFF0B8', '#97C459')}
  ${house(764, 560, 90, 100, '#C9F0E1', '#ED93B1')}
  ${tower(352, 330, 560, 74, '#AFA9EC')}
  ${tower(672, 330, 560, 74, '#AFA9EC')}
  <rect x="392" y="380" width="240" height="180" fill="#FFF8F1" stroke="${INK}" stroke-width="6"/>
  <path d="M392 380 v-26 h34 v26 h28 v-26 h34 v26 h28 v-26 h34 v26 h28 v-26 h34 v26 h18" fill="#FFF8F1" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  ${tower(512, 260, 400, 90, '#FF7FAF')}
  <path d="M480 560 v-56 a32 32 0 0 1 64 0 v56 Z" fill="#C98F5A" stroke="${INK}" stroke-width="5"/>
  <path d="M0 600 Q260 520 512 580 Q770 520 1024 600 V1024 H0 Z" fill="#B9DDB0"/>
  ${sparkle(150, 400, 26)}${sparkle(880, 380, 30, '#FFF0B8')}${sparkle(300, 170, 20, '#FFF0B8')}${sparkle(640, 150, 24)}${sparkle(905, 600, 18)}${sparkle(110, 640, 20, '#FFF0B8')}`;

// back row, then the front row in front of it
const friends = scene
  + animals.lion(300, 610, 66) + animals.tiger(440, 600, 66) + animals.iceBear(584, 600, 66) + animals.bear(724, 610, 66)
  + animals.capybara(345, 745, 76) + animals.panda(683, 745, 76) + animals.bunny(512, 760, 84)
  + animals.fishBubble(822, 470, 52)
  + sparkle(205, 520, 22, '#FFF0B8') + sparkle(470, 470, 16) + sparkle(845, 760, 24, '#FFF0B8') + sparkle(170, 820, 16);

const svg = (size, body, view = size) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${view} ${view}">${body}</svg>`);

const splashArt = `<rect width="2732" height="2732" fill="#241B33"/>
  <clipPath id="card"><rect x="866" y="866" width="1000" height="1000" rx="220"/></clipPath>
  <g clip-path="url(#card)"><g transform="translate(866 866) scale(${1000 / 1024})">${friends}</g></g>`;

const images = {
  'icon-only.png': svg(1024, friends),
  // adaptive icon: the whole picture; Android trims the edges into a circle or squircle
  'icon-foreground.png': svg(1024, friends),
  'icon-background.png': svg(1024, '<rect width="1024" height="1024" fill="#E9DDF7"/>'),
  'splash.png': svg(2732, splashArt),
  'splash-dark.png': svg(2732, splashArt),
  'icon-preview.png': svg(256, friends, 1024)
};

const here = name => new URL(name, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
for (const [name, data] of Object.entries(images)) {
  await sharp(data).png().toFile(here(name));
  console.log('made', name);
}
