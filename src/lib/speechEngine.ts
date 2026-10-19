// The phone's text-to-speech, behind a small interface: native (iOS/Android) version.
// The web version is in speechEngine.web.ts.
import * as Speech from 'expo-speech';

export type RawVoice = {
  id: string; // stable id to remember the user's choice
  name: string;
  language: string; // e.g. "ro-RO"
  enhanced: boolean;
};

// Every voice installed on the phone. Empty list = the phone hasn't listed them (yet).
export async function getVoices(): Promise<RawVoice[]> {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices.map((v) => ({
    id: v.identifier,
    name: v.name,
    language: v.language,
    enhanced: v.quality === Speech.VoiceQuality.Enhanced,
  }));
}

export function speakText(text: string, locale: string, voiceId: string | undefined, rate: number) {
  Speech.stop();
  Speech.speak(text, { language: locale, voice: voiceId, rate });
}

export function stopSpeaking() {
  Speech.stop();
}
