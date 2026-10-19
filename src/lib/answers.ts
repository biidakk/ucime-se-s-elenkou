// Checks a typed answer. Small differences (capital letters, punctuation, extra spaces)
// never matter. Missing accents still count, but the user gets a reminder.

import type { LanguageCode } from './languages';

const PLAIN_LETTERS: Record<string, string> = {
  // Czech
  á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n', ó: 'o',
  ř: 'r', š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z',
  // German
  ä: 'a', ö: 'o', ü: 'u',
  // Romanian
  ă: 'a', â: 'a', î: 'i', ș: 's', ț: 't',
  // French loanwords in English (café)
  è: 'e',
};

// Different ways to write the same thing: these always count as fully correct.
const SAME_LETTERS: Record<string, string> = {
  ş: 'ș', ţ: 'ț', // Romanian with a cedilla (old keyboards) = with a comma
  '’': "'", '‘': "'", ʼ: "'", // curly apostrophes from the iPhone keyboard
};

// English short forms: "I'm" is as good as "I am".
const ENGLISH_SHORT_FORMS: [RegExp, string][] = [
  [/\b(he|she|it)'s got\b/g, '$1 has got'],
  [/\bi'm\b/g, 'i am'],
  [/\b(you|we|they)'re\b/g, '$1 are'],
  [/\b(he|she|it|that|what|where|who|there|here)'s\b/g, '$1 is'],
  [/\b(i|you|we|they)'ve\b/g, '$1 have'],
  [/\b(i|you|he|she|we|they|it)'ll\b/g, '$1 will'],
  [/\b(i|you|he|she|we|they)'d\b/g, '$1 would'],
  [/\bcan't\b/g, 'cannot'],
  [/\bcan not\b/g, 'cannot'],
  [/\bwon't\b/g, 'will not'],
  [/\bshan't\b/g, 'shall not'],
  [/\b(\w+)n't\b/g, '$1 not'],
  [/\blet's\b/g, 'let us'],
];

function tidy(text: string, lang?: LanguageCode): string {
  let result = [...text.toLowerCase()].map((ch) => SAME_LETTERS[ch] ?? ch).join('');
  if (lang === 'en') {
    for (const [pattern, full] of ENGLISH_SHORT_FORMS) result = result.replace(pattern, full);
  }
  if (lang === 'de') result = result.replace(/ß/g, 'ss');
  return result
    .replace(/[.,!?;:„“”"'«»…\-–¿¡]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function withoutAccents(text: string): string {
  return [...text].map((ch) => PLAIN_LETTERS[ch] ?? ch).join('');
}

export type TypedAnswerResult = 'correct' | 'accents' | 'wrong';

export function checkTypedAnswer(input: string, acceptedAnswers: string[], lang?: LanguageCode): TypedAnswerResult {
  const typed = tidy(input, lang);
  const accepted = acceptedAnswers.map((a) => tidy(a, lang));
  if (accepted.includes(typed)) return 'correct';
  const typedPlain = withoutAccents(typed);
  if (accepted.some((a) => withoutAccents(a) === typedPlain)) return 'accents';
  return 'wrong';
}

// The word tiles of a "build" exercise: the words of the answer, without punctuation.
// Keep in sync with tilesOf() in scripts/content-tools.mjs.
export function tilesOf(sentence: string): string[] {
  return sentence
    .replace(/[.,!?;:„“”"«»…¿¡]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// All correct sentences of a "build" exercise: the answer, the accepted orders, and each of
// them without any combination of the optional words (e.g. "that" in "She said that …").
export function buildAnswers(answer: string, accept: string[] = [], optional: string[] = []): string[] {
  const results = new Set<string>();
  const sentences = [answer, ...accept];
  const combos = 1 << Math.min(optional.length, 4);
  for (const sentence of sentences) {
    for (let mask = 0; mask < combos; mask++) {
      const drop = optional.filter((_, i) => mask & (1 << i)).map((w) => w.toLowerCase());
      results.add(tilesOf(sentence).filter((t) => !drop.includes(t.toLowerCase())).join(' '));
    }
  }
  return [...results];
}

// How much of the expected sentence the phone heard, from 0 to 1.
// Accents, capitals and punctuation don't matter: speech recognition is not perfect.
export function spokenMatch(heard: string, expected: string, lang?: LanguageCode): number {
  const plainWords = (text: string) => withoutAccents(tidy(text, lang)).split(' ').filter(Boolean);
  const want = plainWords(expected);
  const got = plainWords(heard);
  if (want.length === 0) return 0;
  let found = 0;
  for (const word of want) {
    const index = got.indexOf(word);
    if (index !== -1) {
      found++;
      got.splice(index, 1);
    }
  }
  return found / want.length;
}
