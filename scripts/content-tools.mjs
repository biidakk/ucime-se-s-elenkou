// Shared helpers for the content scripts: load all courses and check them for mistakes.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONTENT_DIR = path.join(ROOT, 'content');

// The courses that have a folder in /content, e.g. ["cs-de", "cs-en", "cs-ro"].
export function courseIds() {
  return fs
    .readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^[a-z]{2}-[a-z]{2}$/.test(d.name))
    .map((d) => d.name)
    .sort();
}

// All unit files of one course, in number order (unit1-…, unit2-…, unit10-…).
export function loadUnits(courseId) {
  const dir = path.join(CONTENT_DIR, courseId);
  return fs
    .readdirSync(dir)
    .filter((name) => /^unit\d+-.*\.json$/.test(name))
    .sort((a, b) => parseInt(a.slice(4), 10) - parseInt(b.slice(4), 10))
    .map((file) => {
      const text = fs.readFileSync(path.join(dir, file), 'utf8');
      try {
        return { file: `${courseId}/${file}`, unit: JSON.parse(text) };
      } catch (error) {
        throw new Error(`${courseId}/${file} is not valid JSON: ${error.message}`);
      }
    });
}

// The word tiles of a "build" exercise: the words of the answer, without punctuation.
// Keep in sync with tilesOf() in src/lib/answers.ts.
export function tilesOf(sentence) {
  return sentence
    .replace(/[.,!?;:„“”"«»…¿¡]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Letters allowed in text of each language (besides digits, spaces and punctuation).
const LETTERS = {
  cs: 'a-zA-ZáčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ',
  en: 'a-zA-Zéè', // é for café, résumé
  de: 'a-zA-ZäöüÄÖÜßé',
  ro: 'a-zA-ZăâîșțĂÂÎȘȚ',
};
const PUNCTUATION = String.raw`0-9\s.,!?;:'’‘"„“”‚‘«»()\[\]\-–…/%€£$+=&_→←·*`;

function badCharacters(text, lang, alsoLang) {
  const letters = LETTERS[lang] + (alsoLang ? LETTERS[alsoLang] : '');
  const allowed = new RegExp(`[^${letters}${PUNCTUATION}]`, 'gu');
  return [...new Set(String(text).match(allowed) ?? [])];
}

// Limits that keep exercises easy to read for an older learner.
const MAX_OPTIONS = 4;
const MAX_TIP_LENGTH = 700;
const MAX_TILES = 10;

// Returns { errors, warnings } (empty lists = everything is fine).
export function checkCourse(courseId, units) {
  const [nativeLang, targetLang] = courseId.split('-');
  const errors = [];
  const warnings = [];
  const seenIds = new Map();
  const seenWords = new Map();

  const error = (where, message) => errors.push(`${where}: ${message}`);
  const warn = (where, message) => warnings.push(`${where}: ${message}`);
  const text = (where, value, field) => {
    if (typeof value !== 'string' || value.trim() === '') {
      error(where, `"${field}" is missing or empty`);
      return false;
    }
    if (value !== value.trim() || /\s{2,}/.test(value)) error(where, `"${field}" has extra spaces`);
    if (/[şţŞŢ]/.test(value)) error(where, `"${field}" uses ş/ţ with a cedilla; Romanian needs ș/ț (comma below)`);
    return true;
  };
  // Text in one language: check that it has no letters from another alphabet.
  // Text in the learner's language may quote words of the language being learned.
  const inLang = (where, value, field, lang) => {
    if (!text(where, value, field)) return;
    const bad = badCharacters(value, lang, lang === nativeLang ? targetLang : undefined);
    if (bad.length) error(where, `"${field}" has letters that don't belong in ${lang}: ${bad.join(' ')}`);
  };
  const target = (where, value, field) => inLang(where, value, field, targetLang);
  const native = (where, value, field) => inLang(where, value, field, nativeLang);
  const reviewed = (where, item) => {
    if (typeof item.reviewed !== 'boolean') error(where, '"reviewed" must be true or false');
  };
  const uniqueId = (where, id, prefix) => {
    text(where, id, 'id');
    if (seenIds.has(id)) error(where, `id "${id}" is also used in ${seenIds.get(id)}`);
    seenIds.set(id, where);
    if (prefix && !String(id).startsWith(prefix)) error(where, `id should start with "${prefix}"`);
  };
  const options = (where, ex, lang) => {
    if (!Array.isArray(ex.options) || ex.options.length < 2) return error(where, 'needs at least 2 options');
    if (ex.options.length > MAX_OPTIONS) error(where, `at most ${MAX_OPTIONS} options`);
    if (new Set(ex.options.map((o) => String(o).toLowerCase())).size !== ex.options.length) {
      error(where, 'the options contain duplicates');
    }
    ex.options.forEach((o, i) => inLang(where, o, `options[${i}]`, lang));
    if (!ex.options.includes(ex.answer)) error(where, `the answer "${ex.answer}" is not one of the options`);
  };
  const noDuplicates = (where, list, what) => {
    if (new Set(list).size !== list.length) error(where, `the ${what} contain duplicates`);
  };

  for (const { file, unit } of units) {
    uniqueId(file, unit.id);
    native(file, unit.title, 'title');
    target(file, unit.titleTarget, 'titleTarget');
    native(file, unit.description, 'description');
    if (!['A1', 'A2', 'B1'].includes(unit.level)) error(file, '"level" must be "A1", "A2" or "B1"');
    reviewed(file, unit);
    const expectedId = `u${parseInt(path.basename(file).slice(4), 10)}`;
    if (unit.id !== expectedId) error(file, `unit id should be "${expectedId}" (from the file name)`);
    if (!Array.isArray(unit.lessons) || unit.lessons.length === 0) {
      error(file, '"lessons" must be a non-empty list');
      continue;
    }

    for (const lesson of unit.lessons) {
      const at = `${file} › ${lesson.id}`;
      uniqueId(at, lesson.id, `${unit.id}-l`);
      native(at, lesson.title, 'title');
      target(at, lesson.titleTarget, 'titleTarget');
      reviewed(at, lesson);

      if (!lesson.tip) error(at, 'the lesson has no tip');
      else {
        const t = `${at} › tip`;
        native(t, lesson.tip.title, 'title');
        text(t, lesson.tip.text, 'text');
        if (String(lesson.tip.text).length > MAX_TIP_LENGTH) {
          warn(t, `the tip is long (${lesson.tip.text.length} characters, aim for under ${MAX_TIP_LENGTH})`);
        }
        reviewed(t, lesson.tip);
        for (const [i, ex] of (lesson.tip.examples ?? []).entries()) {
          target(t, ex.target, `examples[${i}].target`);
          text(t, ex.native, `examples[${i}].native`);
        }
      }

      const words = lesson.words ?? [];
      if (words.length < 4) error(at, 'the lesson needs at least 4 words');
      if (words.length > 10) warn(at, `many words for one lesson (${words.length}); aim for 6–9`);
      for (const word of words) {
        const w = `${at} › ${word.id}`;
        uniqueId(w, word.id, `${lesson.id}-w`);
        target(w, word.target, 'target');
        native(w, word.native, 'native');
        if (word.note !== undefined) text(w, word.note, 'note');
        reviewed(w, word);
        const key = String(word.target).toLowerCase();
        if (seenWords.has(key)) error(w, `the word "${word.target}" is already taught in ${seenWords.get(key)}`);
        seenWords.set(key, word.id);
      }
      // Tests ask "what does it mean?" with 3 options, so meanings in a lesson must differ.
      noDuplicates(at, words.map((w) => w.native), 'meanings ("native") of the words');

      const exercises = lesson.exercises ?? [];
      if (exercises.length < 6) error(at, `the lesson needs at least 6 exercises (has ${exercises.length})`);
      if (exercises.length > 12) warn(at, `many exercises (${exercises.length}); aim for 8–10`);
      const types = new Set(exercises.map((e) => e.type));
      if (!types.has('listen')) warn(at, 'no "listen" exercise');

      for (const ex of exercises) {
        const e = `${at} › ${ex.id}`;
        uniqueId(e, ex.id, `${lesson.id}-e`);
        if (ex.prompt !== undefined) native(e, ex.prompt, 'prompt');
        reviewed(e, ex);

        if (ex.type === 'choice') {
          if (ex.questionLang === 'target') {
            target(e, ex.question, 'question');
            options(e, ex, nativeLang);
          } else if (ex.questionLang === 'native') {
            native(e, ex.question, 'question');
            options(e, ex, targetLang);
          } else error(e, '"questionLang" must be "target" or "native"');
          // If the question is a word of the course, the answer must be that word's meaning.
          const lookup = ex.questionLang === 'target' ? 'target' : 'native';
          const other = ex.questionLang === 'target' ? 'native' : 'target';
          const word = words.find((w) => w[lookup] === ex.question);
          if (word && word[other] !== ex.answer) {
            warn(e, `the answer "${ex.answer}" differs from the word list ("${word[other]}")`);
          }
        } else if (ex.type === 'listen') {
          target(e, ex.audio, 'audio');
          // Either "what did you hear" (options in the target language) or "what does it mean".
          const sameLang = ex.options?.includes(ex.audio);
          options(e, ex, sameLang ? targetLang : nativeLang);
          if (sameLang && ex.answer !== ex.audio) error(e, 'the answer must be the text that is heard');
        } else if (ex.type === 'match') {
          if (!Array.isArray(ex.pairs) || ex.pairs.length < 3) error(e, 'needs at least 3 pairs');
          else {
            if (ex.pairs.length > 5) error(e, 'at most 5 pairs (they must fit on a phone screen)');
            noDuplicates(e, ex.pairs.map((p) => p.target), 'target sides of the pairs');
            noDuplicates(e, ex.pairs.map((p) => p.native), 'native sides of the pairs');
            ex.pairs.forEach((p, i) => {
              target(e, p.target, `pairs[${i}].target`);
              native(e, p.native, `pairs[${i}].native`);
            });
          }
        } else if (ex.type === 'type') {
          native(e, ex.question, 'question');
          target(e, ex.answer, 'answer');
          for (const [i, a] of (ex.accept ?? []).entries()) target(e, a, `accept[${i}]`);
          if (/[/…()]/.test(ex.answer)) error(e, 'the answer must be one plain answer (put alternatives in "accept")');
        } else if (ex.type === 'build') {
          native(e, ex.question, 'question');
          target(e, ex.answer, 'answer');
          const tiles = tilesOf(String(ex.answer));
          if (tiles.length < 3) error(e, 'the answer needs at least 3 words to build');
          if (tiles.length + (ex.extra?.length ?? 0) > MAX_TILES) error(e, `at most ${MAX_TILES} tiles in total`);
          for (const t of ex.extra ?? []) {
            target(e, t, 'extra');
            if (tiles.map((x) => x.toLowerCase()).includes(t.toLowerCase())) error(e, `extra tile "${t}" is also in the answer`);
          }
          // Capitals don't matter: another word order may start with a different word.
          const sameTiles = (s) => tilesOf(s).map((t) => t.toLowerCase()).sort().join(' ');
          for (const a of ex.accept ?? []) {
            if (sameTiles(a) !== sameTiles(ex.answer)) error(e, `accepted answer "${a}" must use the same tiles`);
          }
        } else if (ex.type === 'fill') {
          target(e, ex.sentence, 'sentence');
          native(e, ex.translation, 'translation');
          if (String(ex.sentence).split('___').length !== 2) error(e, 'the sentence needs exactly one ___');
          options(e, ex, targetLang);
          if (ex.explain !== undefined) text(e, ex.explain, 'explain');
        } else if (ex.type === 'speak') {
          target(e, ex.text, 'text');
          native(e, ex.native, 'native');
          if (/\d/.test(ex.text)) error(e, 'write numbers as words, the phone may hear them as digits');
          if (tilesOf(String(ex.text)).length > 8) warn(e, 'long sentence to say; aim for at most 8 words');
        } else {
          error(e, `unknown exercise type "${ex.type}"`);
        }
      }
    }
  }
  return { errors, warnings };
}
