// Builds the tests from the words of the course, so tests need no extra content.
//   - Lesson quiz: 5 questions after each lesson, some from earlier lessons so old words don't fade.
//   - Unit test: 15 questions over the whole unit, passed at 80%.
// The questions have no "prompt": the screen shows the standard instruction of each type.

import type { Course, Exercise, Lesson, Unit, Word } from './content';
import { shuffle } from './shuffle';

export const LESSON_QUIZ_SIZE = 5;
export const LESSON_QUIZ_OLD_WORDS = 2; // how many quiz questions come from earlier lessons
export const UNIT_TEST_SIZE = 15;
export const UNIT_TEST_PASS = 0.8;

// One test question, with the word it checks (so mistakes can be listed and practised).
export type TestQuestion = { exercise: Exercise; word: Word };

type Kind = 'meaning' | 'say' | 'listen' | 'type';
const KINDS: Kind[] = ['meaning', 'say', 'listen', 'type'];

// Only ask to type words without alternatives ("a / b"), gaps ("…") or brackets.
function isTypeable(word: Word): boolean {
  return !/[/…(]/.test(word.target) && word.target.length <= 40;
}

// Other answers the lessons already accept for this text (e.g. formal and informal forms).
function acceptedAlternatives(course: Course): Map<string, string[]> {
  const result = new Map<string, string[]>();
  for (const lesson of course.lessons) {
    for (const ex of lesson.exercises) {
      if (ex.type === 'type' && ex.accept) {
        result.set(ex.answer, [...(result.get(ex.answer) ?? []), ...ex.accept]);
      }
    }
  }
  return result;
}

// Wrong options: other words' text in the same language, never equal to the answer.
// Words with the same meaning are skipped too, or there would be two right options.
function distractors(word: Word, pool: Word[], side: 'target' | 'native', count: number): string[] {
  const otherSide = side === 'target' ? 'native' : 'target';
  const result: string[] = [];
  for (const other of pool) {
    if (result.length === count) break;
    const text = other[side];
    if (other.id === word.id) continue;
    if (text.toLowerCase() === word[side].toLowerCase() || other[otherSide] === word[otherSide]) continue;
    if (!result.some((r) => r.toLowerCase() === text.toLowerCase())) result.push(text);
  }
  return result;
}

function makeQuestion(word: Word, kind: Kind, pool: Word[], id: string, accept: Map<string, string[]>): TestQuestion {
  // Closest words first (same unit), so the wrong options look plausible.
  const unitOf = (w: Word) => w.id.split('-')[0];
  const near = shuffle(pool.filter((w) => unitOf(w) === unitOf(word)));
  const far = shuffle(pool.filter((w) => unitOf(w) !== unitOf(word)));
  const others = [...near, ...far];
  const base = { id, reviewed: true };

  let exercise: Exercise;
  if (kind === 'type' && isTypeable(word)) {
    const alternatives = accept.get(word.target);
    exercise = { ...base, type: 'type', question: word.native, answer: word.target, ...(alternatives && { accept: alternatives }) };
  } else if (kind === 'say') {
    const options = shuffle([word.target, ...distractors(word, others, 'target', 2)]);
    exercise = { ...base, type: 'choice', question: word.native, questionLang: 'native', options, answer: word.target };
  } else if (kind === 'listen') {
    const options = shuffle([word.native, ...distractors(word, others, 'native', 2)]);
    exercise = { ...base, type: 'listen', audio: word.target, options, answer: word.native };
  } else {
    const options = shuffle([word.native, ...distractors(word, others, 'native', 2)]);
    exercise = { ...base, type: 'choice', question: word.target, questionLang: 'target', options, answer: word.native };
  }
  return { exercise, word };
}

// Turns a list of words into questions, mixing the four kinds.
function makeQuestions(course: Course, words: Word[], pool: Word[], idPrefix: string): TestQuestion[] {
  const kinds = shuffle(KINDS);
  const accept = acceptedAlternatives(course);
  return words.map((word, i) => makeQuestion(word, kinds[i % kinds.length], pool, `${idPrefix}-q${i + 1}`, accept));
}

export function lessonQuiz(course: Course, lesson: Lesson): TestQuestion[] {
  const index = course.lessons.findIndex((l) => l.id === lesson.id);
  const earlierWords = course.lessons.slice(0, Math.max(index, 0)).flatMap((l) => l.words);
  const oldCount = Math.min(LESSON_QUIZ_OLD_WORDS, earlierWords.length);
  const words = shuffle([
    ...shuffle(lesson.words).slice(0, LESSON_QUIZ_SIZE - oldCount),
    ...shuffle(earlierWords).slice(0, oldCount),
  ]);
  return makeQuestions(course, words, [...lesson.words, ...earlierWords], `${lesson.id}-quiz`);
}

export function unitTest(course: Course, unit: Unit): TestQuestion[] {
  const unitWords = unit.lessons.flatMap((l) => l.words);
  const words = shuffle(unitWords).slice(0, UNIT_TEST_SIZE);
  return makeQuestions(course, words, course.lessons.flatMap((l) => l.words), `${unit.id}-test`);
}

export function passesUnitTest(score: number, total: number): boolean {
  return total > 0 && score / total >= UNIT_TEST_PASS;
}

// The smallest score that passes a unit test of this size (12 of 15).
export function unitTestPassMark(total: number): number {
  return Math.ceil(total * UNIT_TEST_PASS);
}
