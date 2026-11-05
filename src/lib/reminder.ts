import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// The daily reminder, made on the phone itself: nothing goes through a server.
// Each day is planned separately, so a day that is already practised can stay quiet, and the
// reminders end by themselves two weeks after the app was last opened instead of nagging forever.
// The web version is in reminder.web.ts.

export const REMINDER_SUPPORTED = true;

const CHANNEL = 'reminders';
const DAYS_AHEAD = 14;

type Plan = { hour: number | null; practisedToday: boolean; title: string; body: string; channelName: string };

async function createChannel(name: string) {
  // Android 13+ only asks for the permission once a channel exists.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name, importance: Notifications.AndroidImportance.DEFAULT });
  }
}

export async function remindersAllowed(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

// Shows the phone's permission question if it hasn't been answered yet.
export async function askForReminders(channelName: string): Promise<boolean> {
  await createChannel(channelName);
  if (await remindersAllowed()) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

async function plan({ hour, practisedToday, title, body, channelName }: Plan) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (hour === null || !(await remindersAllowed())) return;
  await createChannel(channelName);
  const now = new Date();
  for (let offset = practisedToday ? 1 : 0; offset < DAYS_AHEAD; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hour);
    if (date <= now) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL },
    });
  }
}

// One at a time: a later plan must not mix with one still being written.
let queue: Promise<void> = Promise.resolve();

export function planReminders(next: Plan) {
  queue = queue.then(() => plan(next)).catch(() => {});
}
