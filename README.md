# Učíme se s Elenkou

A private language-learning app for Czech speakers: **English (British)**, **German** and
**Romanian**, levels A1, A2 and B1. The whole interface is in Czech, with large text and buttons,
no timers and nothing locked. Built with Expo (React Native) as a web app (PWA) that is
installed on the iPhone Home Screen. No accounts, no server: progress stays on the phone.

**The app:** https://biidakk.github.io/ucime-se-s-elenkou/

## Install on an iPhone

1. Open the link above in **Safari** (not Chrome).
2. Tap **Sdílet** (the square with an arrow pointing up) at the bottom of the screen.
3. Scroll down and tap **Přidat na plochu**, then **Přidat**.
4. Open the app from the **Elenka** icon on the Home Screen, not from Safari: the Home
   Screen app has its own storage and works offline after the first start.

**Updates** arrive by themselves: when a new version has been downloaded, a banner says
„Je k dispozici nová verze aplikace“. Tap **Aktualizovat**. (It never switches in the middle
of a lesson.) If no banner appears, close the app completely and open it again.

**Backup:** progress lives only on the phone, and deleting the icon may delete it. Now and
then use **Nastavení → Záloha pokroku → Uložit zálohu** (save to Files or send by e-mail).
To restore: **Obnovit ze souboru** or **Obnovit z textu**.

**Sound:** the voice comes from the iPhone. A Home Screen app can only use the basic
built-in voices (Romanian: Ioana). If there is no sound, check the volume and silent mode.
If a language has no voice: Nastavení iPhonu → Zpřístupnění → Čtení a mluvení (iOS 18:
Předčítání obsahu) → Hlasy. The voice can be chosen in the app: Nastavení → Zvuk.

**Speaking exercises** appear only when the browser offers speech recognition, and can always
be skipped („Teď nemůžu mluvit“). If listening fails (common in iPhone Home Screen apps), the
app switches them off by itself; they can be switched on again in Nastavení.

## Edit the lessons

All lesson content is in **`content/`**, one folder per course (native language → language to
learn): `content/cs-en`, `content/cs-de`, `content/cs-ro`. Each has a `SYLLABUS.md` (the plan)
and one JSON file per unit. **Read `content/CONTENT_GUIDE.md`** before editing: it describes
the format, the exercise types and the quality rules.

```
npm run check-content   # finds mistakes (duplicate words, answers not among the options, …)
npm run review          # rebuilds CONTENT_REVIEW.md and review/<course>.md for reviewers
```

**Native-speaker review:** `CONTENT_REVIEW.md` links to a checklist per course; every item is
`"reviewed": false` until checked. Open questions from the authors are in
`docs/REVIEW_NOTES.md`. When an item is fine, set `"reviewed": true` and run `npm run review`.

**Pronunciation:** if the phone's voice reads a word wrongly, find a spelling it reads
correctly (in the app: Nastavení → Zvuk → Kontrola výslovnosti) and add it to
`content/pronunciation/<language>.json`. Example: Ioana reads „ziua“ as „ziuna“, so the app
sends her „zi-ua“. The learner still sees „ziua“.

## Develop

```
npm install
npm run web            # development server (Expo)
npm run typecheck      # TypeScript
npm run check-i18n     # every UI text exists in the translation files
npm run build:web      # production build into dist/ (with the offline service worker)
npm run serve:web      # serve dist/ at http://localhost:8090/ucime-se-s-elenkou/
npm run play-all       # play every lesson in headless Chrome (needs serve:web running)
npm run icons          # redraw the app icon in all sizes
```

Every push to `main` runs the checks and publishes to GitHub Pages
(`.github/workflows/deploy.yml`).

```
src/app/            screens (Expo Router): welcome, (tabs)/ course · review · progress · settings,
                    lesson/[id], test/[unitId], courses, pronunciation
src/components/     buttons, cards, the 7 exercise types, feedback, celebration
src/lib/            content loading, progress (per course), settings, spaced repetition,
                    tests, speech (speechEngine.web.ts), speech recognition, backup
src/i18n/cs.json    every interface text (add ro.json for a Romanian interface)
content/            all lessons, pronunciation fixes, the writing guide
scripts/            content checker, review generator, web build, play-all test
docs/               RESEARCH.md (sources and decisions), REVIEW_NOTES.md
```

- **Languages and courses** are listed in `src/lib/languages.ts`. A course is a pair
  `native → target` with neutral field names (`target`, `native`), so any pair fits.
- **Progress** is saved per course (`progress:cs-en` …); the streak is shared (`activity`).
- **Tests** are generated from each lesson's words: a 5-question quiz after each lesson,
  a 15-question unit test (80 % to pass). Missed words go to the flashcards (Leitner boxes:
  1, 2, 4, 7, 14 days).
- **Native app later:** the code also runs on iOS/Android (`npx expo run:ios`). Speech
  recognition then needs `expo-speech-recognition` (see `src/lib/recognition.ts`).
- **Moving the old Romanian → Czech app in:** see `MIGRATION.md`.
- **AI conversation partner:** see `docs/CHAT_PLAN.md`; app side in `src/app/chat/` and `src/lib/chat.ts`, server in `server/chat/` (setup steps in its README).
