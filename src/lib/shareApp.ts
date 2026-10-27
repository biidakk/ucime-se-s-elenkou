// Recommending the app to someone: native (iOS/Android) version.
// The web version is in shareApp.web.ts.
import { Share } from 'react-native';

// One link for everyone: the page picks the App Store, Google Play or the web app
// (public/app.html), so it can change without a new app version.
export const SHARE_URL = 'https://biidakk.github.io/ucime-se-s-elenkou/app.html';

export type ShareAppResult = 'shared' | 'copied' | 'cancelled' | 'failed';

// Opens the phone's share sheet (Messages, WhatsApp, e-mail…) with a short text and the link.
export async function shareApp(text: string): Promise<ShareAppResult> {
  try {
    const result = await Share.share({ message: `${text}\n${SHARE_URL}` });
    return result.action === Share.dismissedAction ? 'cancelled' : 'shared';
  } catch {
    return 'failed';
  }
}
