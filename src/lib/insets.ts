// The space taken by the notch, the status bar and the home bar ("safe area").
// Native: from react-native-safe-area-context. Web: see insets.web.ts.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type Insets = { top: number; bottom: number; left: number; right: number };

export function useInsets(): Insets {
  return useSafeAreaInsets();
}
