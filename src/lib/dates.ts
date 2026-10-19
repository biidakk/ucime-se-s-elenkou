// Dates as simple text keys like "2026-10-11", using the phone's local time.

export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysAgo(n: number, from: Date = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() - n);
}

// How many days in a row the user has practised. If they haven't practised yet today,
// the streak from yesterday still counts (it is only lost after a full day is missed).
export function currentStreak(activeDays: string[], today: Date = new Date()): number {
  const days = new Set(activeDays);
  let offset = days.has(dayKey(today)) ? 0 : 1;
  let streak = 0;
  while (days.has(dayKey(daysAgo(offset, today)))) {
    streak++;
    offset++;
  }
  return streak;
}

// Romanian plural: "1 zi", "2 zile", "20 de zile".

// How many of the last 7 days (today included) had practice.
export function daysThisWeek(activeDays: string[], today: Date = new Date()): number {
  const days = new Set(activeDays);
  return [0, 1, 2, 3, 4, 5, 6].filter((n) => days.has(dayKey(daysAgo(n, today)))).length;
}
