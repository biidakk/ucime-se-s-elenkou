import { dayKey, daysAgo } from './dates';

// Spaced repetition with "Leitner boxes".
// Every word is a card in one of 5 boxes. Knowing a word moves it up a box, so it comes
// back later and later. Not knowing it sends it back to box 1, so it comes back soon.

export type Card = {
  box: number; // 1 to 5
  due: string; // day key: the card should be reviewed on or after this day
};

export const MAX_BOX = 5;

// Days to wait before showing a card again, for each box (index = box number).
export const DAYS_UNTIL_NEXT = [0, 1, 2, 4, 7, 14];

function inDays(n: number): string {
  return dayKey(daysAgo(-n));
}

// A word the user has just learned: box 1, ready for review today.
export function newCard(): Card {
  return { box: 1, due: dayKey() };
}

export function gradeCard(card: Card, knewIt: boolean): Card {
  if (!knewIt) return { box: 1, due: inDays(DAYS_UNTIL_NEXT[1]) };
  const box = Math.min(card.box + 1, MAX_BOX);
  return { box, due: inDays(DAYS_UNTIL_NEXT[box]) };
}

// The words to review today: lowest boxes (hardest words) first.
export function dueWordIds(cards: Record<string, Card>, today: string = dayKey()): string[] {
  return Object.entries(cards)
    .filter(([, card]) => card.due <= today)
    .sort(([, a], [, b]) => a.box - b.box || a.due.localeCompare(b.due))
    .map(([id]) => id);
}
