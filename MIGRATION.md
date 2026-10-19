# Moving the Romanian → Czech app into this app (course `ro-cs`)

**Status (2026-10-19): done.** The Android app „Cehă pentru români“ 2.0.0 (versionCode 3, built with `APP_VARIANT=ro`, profile `preview-ro`) was installed over the old app on the learner's phone and kept her progress. Same signing certificate as 1.1.0 (SHA-256 e71a788b…51d86). New versions: `APP_VARIANT=ro npx eas-cli@latest build --platform android --profile preview-ro`, after raising `versionCode` in `app.config.js`.

The old app **Cehă pentru români** (`C:\Users\ander\czech-ro-app`, Android package
`com.biidakk.cehapentruromani`, versionCode 2) teaches Czech to Romanian speakers. This plan
moves it into this app as the course **`ro-cs`** (native Romanian → learning Czech) without
anyone losing their progress. Nothing in the old app needs to change.

## 1. Content

The formats differ only in field names: the old app names the languages (`cs`, `ro`), this app
names their role (`target` = the language being learned, `native` = the learner's language).
For `ro-cs`, Czech is the target and Romanian the native language.

| Old app | This app |
|---|---|
| unit/lesson `titleCs` | `titleTarget` |
| word `cs`, `ro` | `target`, `native` |
| tip example `{ cs, ro }` | `{ target, native }` |
| `choice.questionLang`: `"cs"` / `"ro"` | `"target"` / `"native"` |
| `match.pairs[]`: `{ cs, ro }` | `{ target, native }` |
| `speak.ro` | `speak.native` |
| `type`, `listen`, `build`, `fill` | unchanged |

`scripts/import-ro-app.mjs` does this conversion. It only reads the old app:

```
node scripts/import-ro-app.mjs ../czech-ro-app content/ro-cs
npm run check-content -- ro-cs
```

All ids (`u1`, `u1-l1`, `u1-l1-w1`, `u1-l1-e1` …) stay the same. That is what makes the
progress transfer below work.

**Tested on 2026-10-19** with the old app's 24 units: the conversion works, and the content
checker finds 3 small things to fix by hand in the converted copy:
- `u10-l3-e3`: the question „2+kk” is Czech but is marked `"questionLang": "ro"`. Change it
  to `"target"` (it was a harmless quirk in the old app).
- 8 warnings where a choice answer differs slightly from the word list; check each one.
- Exercise prompts are kept (in Romanian). They can be deleted to use the standard prompts
  from `src/i18n/ro.json` instead.

## 2. Code changes for the new course

1. **Romanian interface:** copy `src/i18n/cs.json` to `src/i18n/ro.json` and translate it.
   Add `ro` to `TRANSLATIONS` in `src/i18n/index.ts` and to `UI_LANGUAGES` in
   `src/lib/languages.ts` (and remove it from `UI_LANGUAGES_SOON`). `npm run check-i18n`
   checks that no key or `{placeholder}` is missing.
2. **The course:** add `'ro-cs'` to the `CourseId` type and
   `{ id: 'ro-cs', native: 'ro', target: 'cs' }` to `COURSES` in `src/lib/languages.ts`.
   Czech is already defined there (voice `cs-CZ`, the letters á č ď é ě í ň ó ř š ť ú ů ý ž
   as buttons under the text box).
3. Add the Czech sample sentence for "test the voice" if missing (it is already in
   `VOICE_SAMPLE` in `src/app/(tabs)/settings.tsx`).
4. Romanian speakers will choose **Română** on the first screen; the app then shows only the
   courses whose native language is Romanian.

## 3. An Android build that replaces the old app

To install over the old app (same icon, same data), the new build must have **the same
package id** and **the same signing key**, and a **higher versionCode**.

1. Turn `app.json` into `app.config.js` with a variant switch, so one code base makes both apps:

   ```js
   // app.config.js
   const ro = process.env.APP_VARIANT === 'ro';
   module.exports = ({ config }) => ({
     ...config,
     name: ro ? 'Cehă pentru români' : config.name,
     android: {
       ...config.android,
       package: ro ? 'com.biidakk.cehapentruromani' : config.android.package,
       versionCode: ro ? 3 : config.android.versionCode, // must be higher than the old app's 2
     },
     extra: { ...config.extra, defaultNative: ro ? 'ro' : 'cs', defaultCourse: ro ? 'ro-cs' : null },
   });
   ```

   In the welcome screen, skip the language choice when `extra.defaultNative` is set.
2. **Signing key:** the old APK was built with EAS project `cb022d93-4bed-4b8b-b48b-bade58edbe68`
   (account biidakk), which holds its Android keystore. Either build the Romanian variant in
   that same EAS project (set `extra.eas.projectId` to it for `APP_VARIANT=ro`), or download
   the keystore with `npx eas-cli@latest credentials` in the old project and upload it to the
   new one. **Without the same key, Android refuses the update** and the old app (with its
   data) would have to be uninstalled first.
3. Add an EAS build profile, e.g. `"preview-ro": { "env": { "APP_VARIANT": "ro" }, "distribution": "internal", "android": { "buildType": "apk" } }`,
   then `npx eas-cli@latest build --platform android --profile preview-ro`.
4. **Speech recognition:** the old app used `expo-speech-recognition` (a native module). In this
   app `src/lib/recognition.ts` is the native placeholder; implement it with
   `ExpoSpeechRecognitionModule` (same three callbacks: result, error, end) and add the plugin
   with its permission texts to the app config, as in the old `app.json`.

## 4. Keeping the user's progress

On Android, an update with the same package keeps the app's storage, so the new app can read
what the old one saved. The old app stored (AsyncStorage, same library version 2.2.0):

| Old key | Contents |
|---|---|
| `progress` | `{ completedLessons, activeDays, cards, lessonQuizzes, unitTests }` |
| `onboardingDone` | `true` |

This app stores `settings`, `activity` (`{ activeDays }`) and `progress:<course>`
(`{ completedLessons, cards, lessonQuizzes, unitTests }`). Since the ids are identical, the
transfer is a copy. Add a one-time step at start-up (e.g. in `SettingsProvider`, before
reading the settings):

```ts
// If the old app's progress is there and hasn't been moved yet, move it into course ro-cs.
const old = await loadValue<OldProgress | null>('progress', null);
if (old && !(await loadValue('progress:ro-cs', null))) {
  const { activeDays = [], ...courseProgress } = old;
  await saveValue('progress:ro-cs', courseProgress);
  await saveValue('activity', { activeDays });
  await saveValue('settings', { nativeLanguage: 'ro', courseId: 'ro-cs', onboarded: true });
  // Keep the old 'progress' key as a safety copy; it is ignored from now on.
}
```

The flashcard boxes, best scores, passed unit tests and the streak all carry over. Test it
once on a phone: install the old APK, finish a lesson, install the new APK over it, and check
that the lesson shows as done.

**iPhone:** the old app was never on iPhone, so there is nothing to move there.
