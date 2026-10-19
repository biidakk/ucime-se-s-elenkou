// Builds the web app (the iPhone Home Screen app) into /dist, ready for GitHub Pages.
// Run with:  npm run build:web
//   1. expo export (the app itself)
//   2. fills in the web address in index.html and writes the web app manifest
//   3. 404.html = index.html, so links like …/lesson/u1-l1 also work after a reload
//   4. a service worker (Workbox) that keeps every file, so the app works offline

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { generateSW } from 'workbox-build';
import { ROOT } from './content-tools.mjs';

const DIST = path.join(ROOT, 'dist');
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')).expo;
// The site lives in a sub-folder on GitHub Pages: https://biidakk.github.io/ucime-se-s-elenkou/
const BASE = `${(appJson.experiments?.baseUrl ?? '').replace(/\/$/, '')}/`;

console.log(`› Exporting the web app (base path ${BASE}) …`);
execSync('npx expo export --platform web --clear', { cwd: ROOT, stdio: 'inherit' });

// index.html: the placeholders for the base path.
const indexFile = path.join(DIST, 'index.html');
const html = fs.readFileSync(indexFile, 'utf8').replaceAll('__BASE__', BASE);
fs.writeFileSync(indexFile, html);
fs.writeFileSync(path.join(DIST, '404.html'), html);
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

// The web app manifest: name, icon and "standalone" (opens without the browser bars).
const manifest = {
  id: BASE,
  name: appJson.web?.name ?? appJson.name,
  short_name: appJson.web?.shortName ?? appJson.name,
  description: 'Angličtina, němčina a rumunština pro česky mluvící.',
  lang: appJson.web?.lang ?? 'cs',
  start_url: BASE,
  scope: BASE,
  display: 'standalone',
  orientation: 'portrait',
  theme_color: '#F6F8FB',
  background_color: '#F6F8FB',
  icons: [
    { src: `${BASE}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${BASE}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
    { src: `${BASE}icons/maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
fs.writeFileSync(path.join(DIST, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

// The service worker: precaches every file of this version. A new version is downloaded in
// the background and switched on only when the user taps "Update" (skipWaiting: false).
const { count, size, warnings } = await generateSW({
  globDirectory: DIST,
  globPatterns: ['**/*.{js,css,html,json,png,jpg,svg,ttf,otf,woff,woff2,ico,webmanifest}'],
  globIgnores: ['404.html', 'sw.js', 'workbox-*.js'],
  swDest: path.join(DIST, 'sw.js'),
  maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
  navigateFallback: `${BASE}index.html`,
  dontCacheBustURLsMatching: /-[0-9a-f]{16,}\.|\.[0-9a-f]{20,}\./,
  cleanupOutdatedCaches: true,
  inlineWorkboxRuntime: true,
  skipWaiting: false,
  clientsClaim: false,
  sourcemap: false,
});
for (const w of warnings) console.log(`  ! ${w}`);
console.log(`✓ Service worker: ${count} files (${(size / 1024 / 1024).toFixed(1)} MB) kept for offline use.`);
console.log(`✓ Web app built in dist/ for ${BASE}`);
