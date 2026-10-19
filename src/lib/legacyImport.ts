// One-time move of the progress saved by the old app „Cehă pentru români“ (czech-ro-app).
// The Android version of this app replaces that app (same package id and signing key), so the
// phone's storage still holds its data under the old keys. On the first start we copy it into
// the course "ro-cs" (the lesson, word and unit ids are identical) and keep the old key as a
// safety copy. On the web, and on phones without the old app, there is nothing to do.

import { dayKey } from './dates';
import { loadValue, saveValue } from './storage';

const OLD_PROGRESS_KEY = 'progress';
const DONE_KEY = 'legacyImportDone';

type OldProgress = {
  completedLessons?: Record<string, unknown>;
  activeDays?: string[];
  cards?: Record<string, unknown>;
  lessonQuizzes?: Record<string, unknown>;
  unitTests?: Record<string, unknown>;
};

export async function importLegacyProgress(): Promise<void> {
  if (await loadValue<boolean>(DONE_KEY, false)) return;
  const old = await loadValue<OldProgress | null>(OLD_PROGRESS_KEY, null);
  if (old && typeof old === 'object' && (await loadValue<unknown>('progress:ro-cs', null)) === null) {
    await saveValue('progress:ro-cs', {
      completedLessons: old.completedLessons ?? {},
      cards: old.cards ?? {},
      lessonQuizzes: old.lessonQuizzes ?? {},
      unitTests: old.unitTests ?? {},
    });
    const activity = await loadValue<{ activeDays: string[] }>('activity', { activeDays: [] });
    const days = [...new Set([...activity.activeDays, ...(old.activeDays ?? [])])].sort();
    await saveValue('activity', { activeDays: days });
    // She used the old app in Romanian, learning Czech: start straight in that course.
    const settings = await loadValue<Record<string, unknown>>('settings', {});
    if (!settings.onboarded) {
      await saveValue('settings', { ...settings, nativeLanguage: 'ro', courseId: 'ro-cs', onboarded: true, installHintSeen: true });
    }
  }
  await saveValue(DONE_KEY, dayKey());
}
