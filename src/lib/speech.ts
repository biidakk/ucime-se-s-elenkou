import { Platform } from 'react-native';
import { useCourse } from './course';
import type { LanguageCode } from './languages';
import { forVoice } from './pronunciation';
import { SpeechRate, useSettings } from './settings';
import { getVoices, RawVoice, speakText, stopSpeaking } from './speechEngine';

// Text-to-speech with the voices built into the phone, in the language of the course.
// The best voice is chosen automatically; the user can pick another one in Settings.

export type VoiceOption = { id: string; name: string; language: string; exact: boolean };
export type VoiceChoice = VoiceOption | null; // null = no voice for this language

// Voices that sound silly or robotic on Apple devices: used only if nothing else exists.
const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox)/i;
const ELOQUENCE = /^(Eddy|Flo|Grandma|Grandpa|Jacques|Reed|Rocko|Sandy|Shelley)\b/i;
// Natural-sounding voices that are usually installed, per language.
const PREFERRED: Record<string, RegExp> = {
  en: /^(Daniel|Kate|Serena|Arthur|Martha|Oliver|Stephen|Jamie|Google UK English|Microsoft (George|Hazel|Susan|Libby|Ryan|Sonia))/i,
  de: /^(Anna|Helena|Markus|Petra|Yannick|Google Deutsch|Microsoft (Hedda|Katja|Stefan|Conrad))/i,
  ro: /^(Ioana|Google română|Microsoft (Andrei|Alina|Emil))/i,
  cs: /^(Zuzana|Iveta|Google čeština|Microsoft (Jakub|Vlasta|Antonin))/i,
};

const normalizeLocale = (locale: string) => locale.replace('_', '-').toLowerCase();

function score(voice: RawVoice, locale: string): number {
  const lang = normalizeLocale(voice.language);
  const wanted = normalizeLocale(locale);
  const base = wanted.split('-')[0];
  if (lang.split('-')[0] !== base) return -1; // another language: never used
  let points = 10;
  if (lang === wanted) points += 100;
  if (PREFERRED[base]?.test(voice.name)) points += 50;
  if (voice.enhanced) points += 20;
  if (ELOQUENCE.test(voice.name)) points -= 30;
  if (NOVELTY.test(voice.name)) points -= 9;
  return points;
}

const lists = new Map<string, VoiceOption[]>();
const pending = new Map<string, Promise<VoiceOption[] | undefined>>();

// All voices for a language, best first. undefined = the phone hasn't listed its voices yet.
export function voicesFor(locale: string): Promise<VoiceOption[] | undefined> {
  const cached = lists.get(locale);
  if (cached) return Promise.resolve(cached);
  let job = pending.get(locale);
  if (!job) {
    job = getVoices()
      .then((voices) => {
        if (voices.length === 0) return undefined;
        const ranked = voices
          .map((v) => ({ v, points: score(v, locale) }))
          .filter((x) => x.points > 0)
          .sort((a, b) => b.points - a.points)
          .map(({ v }) => ({
            id: v.id,
            name: v.name,
            language: v.language,
            exact: normalizeLocale(v.language) === normalizeLocale(locale),
          }));
        lists.set(locale, ranked);
        return ranked;
      })
      .catch(() => undefined)
      .finally(() => pending.delete(locale));
    pending.set(locale, job);
  }
  return job;
}

// The voice used for a language: the user's choice if it still exists, otherwise the best one.
export async function findVoice(locale: string, chosenId?: string): Promise<VoiceChoice | undefined> {
  const list = await voicesFor(locale);
  if (list === undefined) return undefined;
  return list.find((v) => v.id === chosenId) ?? list[0] ?? null;
}

function pickNow(locale: string, chosenId?: string): VoiceOption | undefined {
  const list = lists.get(locale);
  return list?.find((v) => v.id === chosenId) ?? list?.[0];
}

const RATES: Record<SpeechRate, number> = { normal: 0.9, slow: 0.72 };
const SLOW_FACTOR = 0.7; // the turtle button

// raw = read the text exactly as written, without the pronunciation fixes (for trying spellings).
export function speak(text: string, locale: string, rate: SpeechRate, slow = false, chosenId?: string, raw = false) {
  if (!text.trim()) return;
  const speed = RATES[rate] * (slow ? SLOW_FACTOR : 1);
  // With no voice for the language, stay silent: the phone would read the text with a voice of
  // another language (e.g. Romanian with a Czech voice), which teaches a wrong pronunciation.
  // The listening exercises then explain how to get the voice (VoiceNotice).
  const say = () => {
    const voice = pickNow(locale, chosenId);
    if (!voice && lists.has(locale)) return;
    const lang = normalizeLocale(locale).split('-')[0] as LanguageCode;
    speakText(raw ? text : forVoice(text, lang, voice?.name), locale, voice?.id, speed);
  };
  if (lists.has(locale)) say(); // voices known: speak straight away (iPhone prefers this after a tap)
  else voicesFor(locale).then(say);
}

export function stopSpeech() {
  stopSpeaking();
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

// Speak text in the language being learned, with the chosen voice and speed.
export function useSpeak(): (text: string, slow?: boolean) => void {
  const { target } = useCourse();
  const { settings } = useSettings();
  return (text, slow = false) => speak(text, target.speech, settings.speechRate, slow, settings.voices[target.code]);
}
