// Serves the built web app from /dist on this computer, at the same path as on GitHub Pages,
// to try the production build (offline mode, service worker) before publishing.
// Run with:  npm run serve:web   →  http://localhost:8090/ucime-se-s-elenkou/

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { ROOT } from './content-tools.mjs';

const DIST = path.join(ROOT, 'dist');
const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')).expo;
const BASE = `${(appJson.experiments?.baseUrl ?? '').replace(/\/$/, '')}/`;
const PORT = Number(process.env.PORT ?? 8090);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (!url.startsWith(BASE)) {
      res.writeHead(302, { Location: BASE });
      return res.end();
    }
    let file = path.join(DIST, url.slice(BASE.length));
    if (!file.startsWith(DIST)) return res.writeHead(403).end();
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      const index = path.join(file, 'index.html');
      file = fs.existsSync(index) ? index : path.join(DIST, '404.html'); // like GitHub Pages
    }
    res.writeHead(file.endsWith('404.html') ? 404 : 200, {
      'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`Serving dist/ at http://localhost:${PORT}${BASE}`));
