// Pronunciation fixes for text-to-speech voices that read some words wrongly.
// Example: Apple's Romanian voice "Ioana" reads „ziua“ as „ziuna“. The fix sends the voice a
// respelled text that it pronounces correctly; the learner still sees the real spelling.
//
// The fixes live in content/pronunciation/<language>.json:
//   { "fixes": [ { "write": "ziua", "say": "…", "voices": "Ioana", "note": "…" } ] }
//   write  – the word as written (whole word, capitals don't matter)
//   say    – what to send to the voice instead
//   voices – optional: only for voices whose name matches this (a regular expression)
// and optionally "try": spellings to try out on the pronunciation check screen.

import type { LanguageCode } from './languages';

type Fix = { write: string; say: string; voices?: string; note?: string };
type FixFile = { fixes: Fix[]; try?: string[] };

const files = require.context('../../content/pronunciation', false, /\.json$/);

function fileFor(lang: LanguageCode): FixFile {
  const key = `./${lang}.json`;
  return files.keys().includes(key) ? (files(key) as FixFile) : { fixes: [] };
}

// Spellings to try out on the pronunciation check screen.
export function spellingsToTry(lang: LanguageCode): string[] {
  return fileFor(lang).try ?? [];
}

const cache = new Map<string, { pattern: RegExp; say: string; voices?: RegExp }[]>();

function fixesFor(lang: LanguageCode) {
  let fixes = cache.get(lang);
  if (!fixes) {
    fixes = fileFor(lang).fixes.map((f) => ({
      // Whole words only: letters of any language count as word characters.
      pattern: new RegExp(`(?<![\\p{L}])${f.write.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'giu'),
      say: f.say,
      voices: f.voices ? new RegExp(f.voices, 'i') : undefined,
    }));
    cache.set(lang, fixes);
  }
  return fixes;
}

// The text to send to the voice.
export function forVoice(text: string, lang: LanguageCode, voiceName: string | undefined): string {
  let result = text;
  for (const fix of fixesFor(lang)) {
    if (fix.voices && !(voiceName && fix.voices.test(voiceName))) continue;
    result = result.replace(fix.pattern, (match) =>
      // Keep a capital first letter, so the voice keeps the sentence intonation.
      match[0] === match[0].toUpperCase() ? fix.say[0].toUpperCase() + fix.say.slice(1) : fix.say,
    );
  }
  return result;
}
