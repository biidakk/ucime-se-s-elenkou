// The Google Play graphics: the 512 × 512 icon and the 1024 × 500 feature graphic.
// Written to store/graphics/.  Run with:  node scripts/store-graphics.mjs

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { ROOT } from './content-tools.mjs';

const OUT = path.join(ROOT, 'store', 'graphics');
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) =>
  fs.existsSync(p),
);
fs.mkdirSync(OUT, { recursive: true });

await sharp(path.join(ROOT, 'assets', 'icon.png')).resize(512, 512).png().toFile(path.join(OUT, 'icon-512.png'));
console.log('✓ icon-512.png');

// The feature graphic: the icon, the name and the four courses, in the app's colours.
const icon = fs.readFileSync(path.join(ROOT, 'assets', 'icon.png')).toString('base64');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin: 0; width: 1024px; height: 500px; overflow: hidden; font-family: "Segoe UI", system-ui, sans-serif;
         background: linear-gradient(135deg, #2A6CC4, #173F7E); color: #fff; display: flex; align-items: center; gap: 48px; padding: 0 64px; box-sizing: border-box; }
  img { width: 240px; height: 240px; border-radius: 52px; box-shadow: 0 12px 40px rgba(0,0,0,.3); }
  h1 { font-size: 58px; margin: 0 0 12px; line-height: 1.05; }
  p { font-size: 27px; margin: 0 0 22px; opacity: .92; }
  .langs { display: flex; gap: 12px; flex-wrap: wrap; }
  .langs span { background: rgba(255,255,255,.16); border: 2px solid rgba(255,255,255,.35); border-radius: 999px; padding: 8px 18px; font-size: 22px; font-weight: 600; }
</style></head><body>
  <img src="data:image/png;base64,${icon}">
  <div>
    <h1>Učíme se s Elenkou</h1>
    <p>Jazyky krok za krokem, v klidu a po česku</p>
    <div class="langs"><span>Angličtina</span><span>Němčina</span><span>Rumunština</span><span>Cehă · Čeština</span></div>
  </div>
</body></html>`;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1024, height: 500 });
await page.setContent(html);
await page.screenshot({ path: path.join(OUT, 'feature-graphic.png') });
await browser.close();
console.log('✓ feature-graphic.png');
