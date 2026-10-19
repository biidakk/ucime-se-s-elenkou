import { isRecognitionSupported } from './recognition';
import { useSettings } from './settings';

// Whether lessons include the "speak" exercises: only if the phone can recognise speech
// and the user hasn't switched them off. (Undecided = on, when supported.)
export function useMicExercises(): { supported: boolean; enabled: boolean } {
  const { settings } = useSettings();
  const supported = isRecognitionSupported();
  return { supported, enabled: supported && settings.micEnabled !== false };
}
