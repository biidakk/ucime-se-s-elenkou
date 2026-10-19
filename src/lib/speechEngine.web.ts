// Text-to-speech in the browser, using speechSynthesis directly.
// (expo-speech on the web falls back to the phone's FIRST voice, often English, when it can't
// find the requested one: a Romanian word could then be read by an English voice.)
import type { RawVoice } from './speechEngine';

export type { RawVoice } from './speechEngine';

const synth = (): SpeechSynthesis | undefined =>
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined;

// On iPhone the voiceURI is not always unique, so a voice is identified by name + language.
const idOf = (v: SpeechSynthesisVoice) => `${v.name}|${v.lang}`;

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

// Safari and Chrome may fill the voice list a little after the page loads.
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const s = synth();
  if (!s) return Promise.resolve([]);
  const now = s.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  if (!voicesPromise) {
    voicesPromise = new Promise((resolve) => {
      let tries = 0;
      const finish = () => {
        const list = s.getVoices();
        if (list.length > 0 || tries >= 12) {
          s.removeEventListener('voiceschanged', finish);
          voicesPromise = null;
          resolve(list);
        } else {
          tries++;
          setTimeout(finish, 250);
        }
      };
      s.addEventListener('voiceschanged', finish);
      finish();
    });
  }
  return voicesPromise;
}

export async function getVoices(): Promise<RawVoice[]> {
  return (await loadVoices()).map((v) => ({
    id: idOf(v),
    name: v.name,
    language: v.lang,
    enhanced: /enhanced|premium|vylepšen|prémiov/i.test(v.name),
  }));
}

export function speakText(text: string, locale: string, voiceId: string | undefined, rate: number) {
  const s = synth();
  if (!s) return;
  s.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  // Always set the language: Safari uses it to pick a voice when ours isn't available,
  // and some versions ignore utterance.voice unless the language matches too.
  utterance.lang = locale;
  utterance.rate = rate;
  const voice = voiceId ? s.getVoices().find((v) => idOf(v) === voiceId) : undefined;
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  s.speak(utterance);
}

export function stopSpeaking() {
  synth()?.cancel();
}
