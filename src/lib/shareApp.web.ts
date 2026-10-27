// Recommending the app to someone, in the browser: the share sheet where there is one
// (phones), otherwise the link is copied.

export const SHARE_URL = 'https://biidakk.github.io/ucime-se-s-elenkou/app.html';

export type ShareAppResult = 'shared' | 'copied' | 'cancelled' | 'failed';

export async function shareApp(text: string): Promise<ShareAppResult> {
  if (navigator.share) {
    try {
      await navigator.share({ text, url: SHARE_URL });
      return 'shared';
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return 'cancelled';
      // Fall through to copying.
    }
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${SHARE_URL}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
