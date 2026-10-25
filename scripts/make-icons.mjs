// Draws the app icon and saves it in every size the app needs.  Run with:  npm run icons
//   assets/icon.png (1024, native app), assets/favicon.png, assets/splash-icon.png (launch screen),
//   public/icons/apple-touch-icon.png (180, iPhone Home Screen), icon-192/512 and a
//   "maskable" icon with extra margin (Android crops it into a circle or squircle).

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ROOT } from './content-tools.mjs';

// A white speech bubble with "Aa" on the app blue, and a small yellow star.
// Without the background it is the logo of the launch screen (src/components/Intro.tsx draws the same).
function iconSvg({ margin = 0, background = true } = {}) {
  const scale = 1 - margin * 2;
  const offset = 1024 * margin;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2A6BC2"/>
      <stop offset="1" stop-color="#143A75"/>
    </linearGradient>
  </defs>
  ${background ? '<rect width="1024" height="1024" fill="url(#bg)"/>' : ''}
  <g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="M300 690 L250 860 L470 700 Z" fill="#FFFFFF"/>
    <rect x="160" y="200" width="704" height="520" rx="160" fill="#FFFFFF"/>
    <text x="512" y="575" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
          font-weight="700" font-size="330" fill="#1E5AA8">Aa</text>
    <path transform="translate(800 230) scale(1.25)"
          d="M0 -80 L23 -25 L82 -25 L35 10 L52 66 L0 33 L-52 66 L-35 10 L-82 -25 L-23 -25 Z"
          fill="#F2B705" stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round"/>
  </g>
</svg>`;
}

const outputs = [
  { file: 'assets/icon.png', size: 1024 },
  { file: 'assets/favicon.png', size: 48 },
  { file: 'assets/splash-icon.png', size: 1024, background: false },
  { file: 'public/icons/apple-touch-icon.png', size: 180 },
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'public/icons/icon-512.png', size: 512 },
  { file: 'public/icons/maskable-512.png', size: 512, margin: 0.1 },
];

for (const { file, size, margin, background } of outputs) {
  const target = path.join(ROOT, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  await sharp(Buffer.from(iconSvg({ margin, background }))).resize(size, size).png().toFile(target);
  console.log(`✓ ${file} (${size}×${size})`);
}
