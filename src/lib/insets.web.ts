// On the web, Expo Router reports zero safe-area insets, so we measure the CSS values
// env(safe-area-inset-*) ourselves. On an iPhone Home Screen app they cover the notch and
// the home bar (the page uses viewport-fit=cover, see public/index.html).
import { useEffect, useState } from 'react';
import type { Insets } from './insets';

export type { Insets } from './insets';

const ZERO: Insets = { top: 0, bottom: 0, left: 0, right: 0 };

function measure(): Insets {
  if (typeof document === 'undefined') return ZERO;
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;' +
    'padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);' +
    'padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right);';
  document.body.appendChild(probe);
  const style = getComputedStyle(probe);
  const insets = {
    top: parseFloat(style.paddingTop) || 0,
    bottom: parseFloat(style.paddingBottom) || 0,
    left: parseFloat(style.paddingLeft) || 0,
    right: parseFloat(style.paddingRight) || 0,
  };
  probe.remove();
  return insets;
}

let current: Insets | null = null;
const listeners = new Set<(insets: Insets) => void>();

function refresh() {
  current = measure();
  listeners.forEach((listener) => listener(current!));
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', refresh);
}

export function useInsets(): Insets {
  const [insets, setInsets] = useState<Insets>(() => current ?? (current = measure()));
  useEffect(() => {
    listeners.add(setInsets);
    return () => {
      listeners.delete(setInsets);
    };
  }, []);
  return insets;
}
