import * as StoreReview from 'expo-store-review';
import { dayKey } from './dates';
import { useSettings } from './settings';

// Asks for a rating with the phone's own window, after a passed unit test: a good moment, and
// never in the middle of a lesson. The phone decides whether the window really appears.

const DAYS_BETWEEN = 120;
const AFTER_CELEBRATION_MS = 2500;

const daysSince = (key: string) => (Date.now() - new Date(key).getTime()) / 86400000;

export function useReviewPrompt(): () => void {
  const { settings, update } = useSettings();
  return () => {
    if (settings.reviewAsked && daysSince(settings.reviewAsked) < DAYS_BETWEEN) return;
    setTimeout(async () => {
      try {
        if (!(await StoreReview.isAvailableAsync()) || !(await StoreReview.hasAction())) return;
        update({ reviewAsked: dayKey() });
        await StoreReview.requestReview();
      } catch {
        // No rating this time: nothing the learner needs to know about.
      }
    }, AFTER_CELEBRATION_MS);
  };
}
