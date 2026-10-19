import { Platform } from 'react-native';

// Small facts about the phone and how the app was opened.

// An iPhone or iPad (also in the browser: iPadOS pretends to be a Mac, but has touch).
export function isApple(): boolean {
  if (Platform.OS === 'ios') return true;
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

// Opened from the Home Screen (as an app), not in a browser tab. A native app always is.
export function isInstalled(): boolean {
  if (Platform.OS !== 'web') return true;
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

// Show the "Add to Home Screen" steps: iPhone/iPad Safari, not yet installed.
export function shouldShowInstallHint(): boolean {
  return Platform.OS === 'web' && isApple() && !isInstalled();
}
