// Checks a typed answer. Small differences (capital letters, punctuation, extra spaces)
// never matter. Missing accents still count, but the user gets a reminder.

import type { LanguageCode } from './languages';
import { findNumbers, heardDigits } from './numbers';

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

// Compares what the phone heard with the expected sentence. Accents, capitals and punctuation
// don't matter: speech recognition is not perfect. Numbers count when the phone wrote them as
// digits („Eleven, twelve“ heard as „11 12“ or even „1112“).
// Returns, for each written word of the sentence, its plain parts and whether each was heard.
// One written word can be several plain ones ("I'm" = "i am") or none ("–").
function compareSpoken(heard: string, expected: string, lang?: LanguageCode) {
  const plainWords = (text: string) => withoutAccents(tidy(text, lang)).split(' ').filter(Boolean);
  const written = expected.split(/\s+/).filter(Boolean);
  const parts = written.flatMap((word, wordIndex) => plainWords(word).map((plain) => ({ plain, wordIndex })));
  const got = plainWords(heard);
  const digits = heardDigits(got);

  const found = parts.map(({ plain }) => {
    const index = got.indexOf(plain);
    if (index === -1) return false;
    got.splice(index, 1);
    return true;
  });

  // Numbers not heard as words: look for their value among the digits, in order.
  let from = 0;
  for (const number of findNumbers(parts.map((p) => p.plain), lang)) {
    const range = found.slice(number.start, number.end);
    if (range.every(Boolean)) continue;
    const at = digits.indexOf(String(number.value), from);
    if (at === -1) continue;
    from = at + String(number.value).length;
    found.fill(true, number.start, number.end);
  }

  return { written, parts, found };
}

// How much of the expected sentence the phone heard, from 0 to 1.
export function spokenMatch(heard: string, expected: string, lang?: LanguageCode): number {
  const { found } = compareSpoken(heard, expected, lang);
  return found.length === 0 ? 0 : found.filter(Boolean).length / found.length;
}

export type HeardWord = { word: string; heard: boolean };

// The words of the expected sentence as written, each marked whether the phone heard it,
// so the speaking exercise can show which words to practise.
export function heardWords(heard: string, expected: string, lang?: LanguageCode): HeardWord[] {
  const { written, parts, found } = compareSpoken(heard, expected, lang);
  return written.map((word, wordIndex) => ({
    word,
    heard: parts.every((p, i) => p.wordIndex !== wordIndex || found[i]),
  }));
}
