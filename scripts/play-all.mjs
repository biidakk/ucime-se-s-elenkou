// Plays every lesson of every course in headless Chrome (as an iPhone), answering each
// exercise correctly, and reports any lesson that can't be finished or shows an error.
// Needs the built app being served:  npm run build:web  and  npm run serve:web  (other terminal)
// Run with:  npm run play-all            (or: npm run play-all -- cs-de   for one course)
// Needs Google Chrome installed, and puppeteer-core (npm i -D puppeteer-core).

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { courseIds, loadUnits, tilesOf } from './content-tools.mjs';

const APP = process.env.APP_URL ?? 'http://localhost:8090/ucime-se-s-elenkou/';
const CHROME =
  process.env.CHROME_PATH ??
  ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) =>
    fs.existsSync(p),
  );
const only = process.argv[2];
const NAMES = { 'cs-en': 'cs-en', 'cs-de': 'cs-de', 'cs-ro': 'cs-ro' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage();
await page.emulate({
  viewport: { width: 393, height: 852, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
});
let pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

// Visible text of an element, without the icon-font characters.
const cleanText = (el) =>
  [...el.innerText].filter((c) => c.charCodeAt(0) < 0xe000 || c.charCodeAt(0) > 0xf8ff).join('').trim();

async function buttons() {
  const handles = await page.$$('[role="button"], [role="radio"]');
  const result = [];
  for (const h of handles) {
    const info = await h.evaluate((el, fn) => {
      const clean = new Function('el', `return (${fn})(el)`);
      return { visible: el.checkVisibility(), text: clean(el) };
    }, cleanText.toString());
    if (info.visible) result.push({ h, text: info.text });
  }
  return result;
}

async function click(text, { first = false } = {}) {
  const matches = (await buttons()).filter((b) => b.text === text || b.text.split('\n')[0].trim() === text);
  if (!matches.length) throw new Error(`no button "${text}"`);
  await (first ? matches[0] : matches[matches.length - 1]).h.click();
  await sleep(120);
}

async function answer(ex) {
  switch (ex.type) {
    case 'choice':
    case 'listen':
    case 'fill':
      await click(ex.answer);
      await click('Zkontrolovat');
      break;
    case 'match':
      for (const p of ex.pairs) {
        await click(p.target, { first: true });
        await click(p.native);
        await sleep(80);
      }
      break;
    case 'type':
      await page.type('input', ex.answer);
      await click('Zkontrolovat');
      break;
    case 'build':
      for (const tile of tilesOf(ex.answer)) await click(tile);
      await click('Zkontrolovat');
      break;
    case 'speak':
      await click('Teď nemůžu mluvit');
      break;
  }
}

const problems = [];
let lessons = 0;
for (const courseId of courseIds().filter((c) => (!only || c === only) && NAMES[c])) {
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await page.evaluate((id) => {
    localStorage.clear();
    localStorage.setItem(
      'settings',
      JSON.stringify({ nativeLanguage: 'cs', courseId: id, onboarded: true, speechRate: 'normal', micEnabled: null, installHintSeen: true, lastBackup: null, voices: {} }),
    );
  }, courseId);

  for (const { unit } of loadUnits(courseId)) {
    for (const lesson of unit.lessons) {
      lessons++;
      pageErrors = [];
      try {
        await page.goto(`${APP}lesson/${lesson.id}`, { waitUntil: 'networkidle0' });
        await click('Rozumím, začneme!');
        for (const ex of lesson.exercises) {
          await sleep(150);
          try {
            await answer(ex);
            // Every answer we give is correct, so the green banner must appear.
            const text = await page.evaluate(() => document.body.innerText);
            if (text.includes('Ne tak docela')) throw new Error('marked as wrong');
            await click('Pokračovat');
          } catch (error) {
            throw new Error(`${ex.id} (${ex.type}): ${error.message}`);
          }
        }
        await sleep(200);
        const done = await page.evaluate(() => document.body.innerText.includes('Cvičení jsou hotová'));
        if (!done) throw new Error('did not reach the end of the exercises');
        if (pageErrors.length) throw new Error(`page error: ${pageErrors[0]}`);
        process.stdout.write('.');
      } catch (error) {
        problems.push(`${courseId} ${lesson.id}: ${error.message}`);
        process.stdout.write('✗');
      }
    }
  }
}
await browser.close();

console.log(`\n${lessons} lessons played.`);
if (problems.length) {
  for (const p of problems) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log('✓ Every lesson can be finished with the expected answers.');
