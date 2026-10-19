// Sharing and opening backup files in the browser.
// On iPhone the share sheet lets the user save the file to Files, mail it, or send it.

export type ShareResult = 'shared' | 'downloaded' | 'cancelled' | 'failed';

export async function shareBackupFile(fileName: string, text: string): Promise<ShareResult> {
  const file = new File([text], fileName, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: fileName });
      return 'shared';
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return 'cancelled';
      // Fall through to a plain download.
    }
  }
  try {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return 'downloaded';
  } catch {
    return 'failed';
  }
}

export function canCopyText(): boolean {
  return !!navigator.clipboard?.writeText;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function canPickFile(): boolean {
  return true;
}

// Opens the file picker and returns the text of the chosen file (null if none).
export function pickBackupFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json,text/plain';
    input.style.display = 'none';
    input.onchange = async () => {
      const file = input.files?.[0];
      input.remove();
      resolve(file ? await file.text() : null);
    };
    input.oncancel = () => {
      input.remove();
      resolve(null);
    };
    document.body.appendChild(input);
    input.click();
  });
}
