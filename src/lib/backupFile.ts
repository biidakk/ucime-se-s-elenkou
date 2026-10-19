// Sharing and opening backup files: native (iOS/Android) version.
// The web version is in backupFile.web.ts.
import { Share } from 'react-native';

export type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

// Native: share the backup text (Mail, Notes, Messages…). A file could be added later
// with expo-sharing + expo-file-system.
export async function shareBackupFile(_fileName: string, text: string): Promise<ShareResult> {
  try {
    const result = await Share.share({ message: text });
    return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
  } catch {
    return 'failed';
  }
}

export async function copyText(_text: string): Promise<boolean> {
  return false; // not available without expo-clipboard; the share sheet offers "Copy"
}

export function canCopyText(): boolean {
  return false;
}

// Native: no file picker yet; restoring works by pasting the text.
export async function pickBackupFile(): Promise<string | null> {
  return null;
}

export function canPickFile(): boolean {
  return false;
}
