import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { useCourse } from './course';
import { SpeechRate, useSettings } from './settings';

// Text-to-speech with the voices built into the phone, in the language of the course.
// On the web this is the browser's speechSynthesis (expo-speech wraps it).

export type VoiceChoice = { id: string; name: string } | null; // null = no voice for this language

// Voices that sound silly or robotic on Apple devices: used only if nothing else exists.
const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox)/i;
const ELOQUENCE = /^(Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)/i;
// Natural-sounding voices that are usually installed, per language.
const PREFERRED: Record<string, RegExp> = {
  en: /^(Daniel|Kate|Serena|Arthur|Martha|Oliver|Stephen|Google UK English)/i,
  de: /^(Anna|Helena|Markus|Petra|Yannick|Google Deutsch)/i,
  ro: /^(Ioana|Google română)/i,
  cs: /^(Zuzana|Google čeština)/i,
};

type RawVoice = { id: string; name: string; language: string; enhanced: boolean };

const normalizeLocale = (locale: string) => locale.replace('_', '-').toLowerCase();

async function webVoices(): Promise<RawVoice[]> {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  if (!synth) return [];
  const read = () =>
    synth.getVoices().map((v) => ({ id: v.voiceURI, name: v.name, language: v.lang, enhanced: /enhanced|premium/i.test(v.name) }));
  let voices = read();
  // Safari and Chrome may fill the list a little later.
  for (let i = 0; voices.length === 0 && i < 10; i++) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    voices = read();
  }
  return voices;
}

async function nativeVoices(): Promise<RawVoice[]> {
  const voices = await Speech.getAvailableVoicesAsync();
  return voices.map((v) => ({
    id: v.identifier,
    name: v.name,
    language: v.language,
    enhanced: v.quality === Speech.VoiceQuality.Enhanced,
  }));
}

function score(voice: RawVoice, locale: string): number {
  const lang = normalizeLocale(voice.language);
  const wanted = normalizeLocale(locale);
  const base = wanted.split('-')[0];
  if (!lang.startsWith(base)) return -1;
  let points = 1;
  if (lang === wanted) points += 100;
  if (PREFERRED[base]?.test(voice.name)) points += 50;
  if (voice.enhanced) points += 20;
  if (ELOQUENCE.test(voice.name)) points -= 30;
  if (NOVELTY.test(voice.name)) points -= 90;
  return points;
}

const chosen = new Map<string, Promise<VoiceChoice | undefined>>();

// The best voice for a locale like "de-DE". undefined = the phone hasn't listed its voices.
export function findVoice(locale: string): Promise<VoiceChoice | undefined> {
  let pending = chosen.get(locale);
  if (!pending) {
    pending = (Platform.OS === 'web' ? webVoices() : nativeVoices())
      .then((voices) => {
        if (voices.length === 0) return undefined;
        const ranked = voices
          .map((v) => ({ v, points: score(v, locale) }))
          .filter((x) => x.points > 0)
          .sort((a, b) => b.points - a.points);
        return ranked.length ? { id: ranked[0].v.id, name: ranked[0].v.name } : null;
      })
      .catch(() => undefined)
      .then((result) => {
        if (result === undefined) chosen.delete(locale); // try again next time
        return result;
      });
    chosen.set(locale, pending);
  }
  return pending;
}

const RATES: Record<SpeechRate, number> = { normal: 0.9, slow: 0.72 };
const SLOW_FACTOR = 0.7; // the turtle button

export function speak(text: string, locale: string, rate: SpeechRate, slow = false) {
  if (!text.trim()) return;
  Speech.stop();
  findVoice(locale).then((voice) => {
    Speech.speak(text, {
      language: locale,
      voice: voice?.id,
      rate: RATES[rate] * (slow ? SLOW_FACTOR : 1),
    });
  });
}

export function stopSpeech() {
  Speech.stop();
}

// iPhone Safari only speaks after the user has tapped something. Speaking a silent, empty
// sound on the first tap "unlocks" speech, so later words can play by themselves.
let primed = false;
export function primeSpeechOnFirstTap() {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || primed) return;
  const prime = () => {
    if (primed || !window.speechSynthesis) return;
    primed = true;
    const utterance = new SpeechSynthesisUtterance(' ');
    utterance.volume = 0;
    window.speechSynthesis.speak(utterance);
    window.removeEventListener('touchend', prime);
    window.removeEventListener('click', prime);
  };
  window.addEventListener('touchend', prime);
  window.addEventListener('click', prime);
}

// Speak text in the language being learned, at the speed chosen in the settings.
export function useSpeak(): (text: string, slow?: boolean) => void {
  const { target } = useCourse();
  const { settings } = useSettings();
  return (text, slow = false) => speak(text, target.speech, settings.speechRate, slow);
}
