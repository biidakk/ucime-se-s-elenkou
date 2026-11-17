# Učíme se s Elenkou

A language-learning app for Czech speakers: **English (British)**, **German** and
**Romanian**, levels A1, A2 and B1, plus a **Czech course for Romanian speakers** (`ro-cs`).
The interface is in Czech (or Romanian), with large text and buttons, no timers and nothing
locked. Built with Expo (React Native). No accounts: progress stays on the phone.

**Where to get it** (current version: **1.0.4**)

| | Link |
|---|---|
| App Store (iPhone) | https://apps.apple.com/app/id6825768857 — „Elenka – učíme se jazyky“ |
| Google Play (Android) | https://play.google.com/store/apps/details?id=com.biidakk.ucimeseselenkou |
| Web app (any browser) | https://biidakk.github.io/ucime-se-s-elenkou/ |
| Share link | `public/app.html`: sends iPhone and Android visitors to their store |

**Features:** lessons with 7 exercise types, a quiz after each lesson and a test after each
unit, flashcards for missed words, a home screen with the next lesson, this week's practice days and course progress, an optional
daily reminder (local notification, nothing sent to a server), a rating request after a passed
unit test, sharing the app, backup and restore, and an AI conversation partner („Konverzace“)
that appears only after a family code is entered.

## Install the web app on an iPhone (without the App Store)

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

**Speaking exercises** appear only where speech recognition really works. In the iPhone Home Screen app it does not (the browser reports it but never hears anything), so they are hidden there automatically. Elsewhere they can always be skipped („Teď nemůžu mluvit“), and if listening produces nothing within a few seconds the app stops it and switches these exercises off (Nastavení can switch them on again).

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
- **Native apps:** the same code runs on iOS and Android. Native-only parts have a `.web.ts`
  twin: speech recognition (`expo-speech-recognition`), reminders (`expo-notifications`),
  backup files and sharing.
- **The Romanian → Czech app** („Cehă pentru români“, Android only) is the same code built
  with `APP_VARIANT=ro` (`app.config.js`); see `MIGRATION.md`.
- **AI conversation partner:** see `docs/CHAT_PLAN.md`; app side in `src/app/chat/` and `src/lib/chat.ts`, server in `server/chat/` (setup steps in its README).

## Release a new version to the stores

Builds are made in the cloud with EAS (`npx eas-cli@latest …`); the `ios/` and `android/`
folders are generated and never edited by hand.

1. In `app.json` raise `version` (e.g. 1.0.5), `ios.buildNumber` and `android.versionCode`.
   Both stores need a higher number for every upload, and Apple needs a new `version` once
   the previous one has been released.
2. Build:
   - iPhone: `npx eas-cli@latest build -p ios --profile production-ios`, then
     `npx eas-cli@latest submit -p ios --profile production-ios` (goes to TestFlight).
   - Android: `npx eas-cli@latest build -p android --profile production-android`; upload
     the `.aab` in Play Console → Production (it is too big for most other tools).
   - Romanian Android app: raise `versionCode` in `app.config.js`, then
     `APP_VARIANT=ro npx eas-cli@latest build -p android --profile preview-ro`.
3. In App Store Connect / Play Console add the „What's new“ text (cs, ro, en) and send the
   version for review.

Store texts, form answers and review notes: `store/STORE_LISTING.md` and
`store/APP_REVIEW_INFO.md`. Screenshots: `node scripts/store-screenshots.mjs`; graphics:
`node scripts/store-graphics.mjs`. Privacy policy: `public/privacy.html`.

**Never commit secrets** (the repository is public): API keys, the chat family code, App Store
Connect keys (`.p8`), and downloaded builds (`.aab`, `.ipa`) are kept out of git
(`.gitignore`).
