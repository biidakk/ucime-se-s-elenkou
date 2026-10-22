// Takes the screenshots for the App Store and Google Play from the built web app, with some
// progress filled in, in the sizes the stores ask for. Written to store/screenshots/<store>/.
// Needs the built app being served:  npm run build:web  and  npm run serve:web  (other terminal)
// Run with:  node scripts/store-screenshots.mjs

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { loadUnits, ROOT } from './content-tools.mjs';

const APP = process.env.APP_URL ?? 'http://localhost:8090/ucime-se-s-elenkou/';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) =>
  fs.existsSync(p),
);
const OUT = path.join(ROOT, 'store', 'screenshots');

// App Store: iPhone 6.9" (1320 × 2868). Google Play: phone, 9:16 (1080 × 1920).
const SIZES = {
  'app-store': { width: 440, height: 956, deviceScaleFactor: 3 },
  'google-play': { width: 360, height: 640, deviceScaleFactor: 3 },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const day = (offset) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);

// A learner a few weeks in: the first units done, a streak of 5 days.
function state(nativeLanguage, courseId, lessonsDone) {
  const allLessons = loadUnits(courseId).flatMap(({ unit }) => unit.lessons);
  const lessons = allLessons.map((l) => l.id);
  // Flashcards spread over the five boxes; every fourth one due today.
  const words = allLessons.slice(0, lessonsDone).flatMap((l) => l.words ?? []);
  const cards = Object.fromEntries(words.map((w, i) => [w.id, { box: 1 + (i % 5), due: i % 4 === 0 ? day(0) : day(-3) }]));
  const completedLessons = Object.fromEntries(
    lessons.slice(0, lessonsDone).map((id, i) => [id, { completedAt: day(Math.max(0, 12 - i)), bestScore: 9, total: 10 }]),
  );
  return {
    settings: { nativeLanguage, courseId, onboarded: true, speechRate: 'normal', micEnabled: false, installHintSeen: true, lastBackup: day(0), voices: {}, chatCode: '' },
    [`progress:${courseId}`]: { completedLessons, cards, lessonQuizzes: {}, unitTests: {} },
    activity: { activeDays: [0, 1, 2, 3, 4, 7, 8, 10].map(day) },
  };
}

// Each shot: the learner's state, the page, and what to do before the picture.
const SHOTS = [
  { name: '1-course', state: state('cs', 'cs-en', 6), url: '' },
  { name: '2-lesson', state: state('cs', 'cs-en', 6), url: 'lesson/u2-l3', action: 'start' },
  { name: '3-review', state: state('cs', 'cs-en', 6), url: 'review' },
  { name: '4-progress', state: state('cs', 'cs-en', 6), url: 'progress' },
  { name: '5-courses', state: state('cs', 'cs-en', 6), url: 'courses' },
  { name: '6-romanian', state: state('ro', 'ro-cs', 5), url: '' },
];

const START = {
  cs: JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'i18n', 'cs.json'), 'utf8'))['lesson.start'],
  ro: JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'i18n', 'ro.json'), 'utf8'))['lesson.start'],
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
for (const [store, viewport] of Object.entries(SIZES)) {
  fs.mkdirSync(path.join(OUT, store), { recursive: true });
  for (const shot of SHOTS) {
    const page = await browser.newPage();
    await page.emulate({
      viewport: { ...viewport, isMobile: true, hasTouch: true },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
    });
    await page.goto(APP, { waitUntil: 'networkidle0' });
    await page.evaluate((s) => {
      localStorage.clear();
      for (const [k, v] of Object.entries(s)) localStorage.setItem(k, JSON.stringify(v));
    }, shot.state);
    await page.goto(APP + shot.url, { waitUntil: 'networkidle0' });
    await sleep(800);
    if (shot.action === 'start') {
      const label = START[shot.state.settings.nativeLanguage];
      await page.evaluate((text) => {
        const b = [...document.querySelectorAll('[role="button"]')].find((el) => el.innerText.includes(text));
        b?.click();
      }, label);
      await sleep(800);
    }
    await page.screenshot({ path: path.join(OUT, store, `${shot.name}.png`) });
    await page.close();
    console.log(`✓ ${store}/${shot.name}.png`);
  }
}
await browser.close();
