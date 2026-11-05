// Browsers can't plan a notification for later without a server, so the web version has no reminder.

export const REMINDER_SUPPORTED = false;

export async function remindersAllowed(): Promise<boolean> {
  return false;
}

export async function askForReminders(_channelName: string): Promise<boolean> {
  return false;
}

export function planReminders(_next: { hour: number | null; practisedToday: boolean; title: string; body: string; channelName: string }) {}
