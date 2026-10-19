// Backup of everything the app has saved (settings, streak and the progress of every course),
// as one JSON text. The user can keep it as a file or as copied text, and restore it later:
// phone storage can be lost (e.g. when the Home Screen icon is deleted).

import { dayKey } from './dates';
import { allKeys, loadValue, saveValue } from './storage';

export const BACKUP_APP = 'ucime-se-s-elenkou';
const BACKUP_VERSION = 1;

export type Backup = {
  app: typeof BACKUP_APP;
  version: number;
  createdAt: string; // day key
  data: Record<string, unknown>; // storage key → saved value
};

// Only these keys are ours (and worth restoring).
const isAppKey = (key: string) => key === 'settings' || key === 'activity' || key.startsWith('progress:');

export async function createBackup(): Promise<Backup> {
  const data: Record<string, unknown> = {};
  for (const key of (await allKeys()).filter(isAppKey)) {
    data[key] = await loadValue<unknown>(key, null);
  }
  return { app: BACKUP_APP, version: BACKUP_VERSION, createdAt: dayKey(), data };
}

export function backupToText(backup: Backup): string {
  return JSON.stringify(backup);
}

export function backupFileName(backup: Backup): string {
  return `elenka-zaloha-${backup.createdAt}.json`;
}

// Reads a backup from text (a file or pasted). Returns null if it isn't one of ours.
export function parseBackup(text: string): Backup | null {
  try {
    // Pasted text may have extra words around it: take the part between the outer braces.
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    const value = JSON.parse(text.slice(start, end + 1));
    if (value?.app !== BACKUP_APP || typeof value.data !== 'object' || value.data === null) return null;
    if (typeof value.version !== 'number' || value.version > BACKUP_VERSION) return null;
    return value as Backup;
  } catch {
    return null;
  }
}

// Writes the backup into the phone's storage. The caller reloads settings and progress.
export async function restoreBackup(backup: Backup): Promise<void> {
  for (const [key, value] of Object.entries(backup.data)) {
    if (isAppKey(key) && value !== null) await saveValue(key, value);
  }
}
