const sharp = require('sharp');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="104" viewBox="0 0 60 52">
  <rect width="60" height="52" fill="#FBEEDE"/>
  <g fill="none" stroke="#8B5E4A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 14 Q12 10 16 10 H44 Q48 10 48 14 V38 Q48 42 44 42 H16 Q12 42 12 38 Z" fill="#F7E6E0"/>
    <path d="M12 18 H48" opacity=".7"/>
    <path d="M10 42 H50"/>
  </g>
  <path d="M22 29 Q27 23 33 27 Q36 29 33 31 Q27 35 22 29 Z" fill="#F6B39A" stroke="#8B5E4A" stroke-width="2" stroke-linejoin="round"/>
  <path d="M33 29 L38 25 L38 33 Z" fill="#F6B39A" stroke="#8B5E4A" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="26" cy="28" r="1.2" fill="#6E4A3A"/>
  <circle cx="40" cy="20" r="1.6" fill="none" stroke="#8B5E4A" stroke-width="1.2"/>
  <circle cx="43" cy="16" r="1" fill="none" stroke="#8B5E4A" stroke-width="1"/>
</svg>`;
sharp(Buffer.from(svg)).webp({ quality: 92 }).toFile('public/img/ui/nav-aquarium.webp').then(() => console.log('made nav-aquarium'));
