import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Things only the web version (the Home Screen app) needs: keeping its storage and updates.

// Ask the browser to keep this app's data even when the phone is short of space.
// iPhone decides by itself (it favours apps added to the Home Screen) and never asks the user.
export function requestPersistentStorage() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return;
  navigator.storage?.persist?.().catch(() => {});
}

// The service worker (public/register-sw.js) tells us when a new version is downloaded.
// Returns a function that switches to it, or null when there is nothing new.
export function useUpdateReady(): (() => void) | null {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const w = window as Window & { __swWaiting?: ServiceWorker };
    if (w.__swWaiting) setWaiting(w.__swWaiting);
    const onReady = (event: Event) => setWaiting((event as CustomEvent<ServiceWorker>).detail);
    window.addEventListener('sw-update-ready', onReady);
    return () => window.removeEventListener('sw-update-ready', onReady);
  }, []);

  if (!waiting) return null;
  return () => {
    // The new worker takes over, then the page reloads with the new version.
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
    waiting.postMessage({ type: 'SKIP_WAITING' });
  };
}
