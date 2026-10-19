// Loads the course content from the JSON files in /content.
// The screens never contain lesson text themselves; they always ask this file.
//
// A course is one pair "native language → language to learn", e.g. "cs-en" (Czech speakers
// learning English). Its units live in /content/<course id>/unit<N>-<name>.json.
// Field names are neutral ("target" = the language being learned, "native" = the learner's
// language), so any pair of languages fits the same format.

import { CourseId } from './languages';

// ---- The shape of the content (what fields each item has) ----

export type Word = {
  id: string;
  target: string; // in the language being learned
  native: string; // in the learner's language
  note?: string; // in the learner's language
  reviewed: boolean;
};

export type Tip = {
  title: string;
  text: string;
  examples?: { target: string; native: string }[];
  reviewed: boolean;
};

// "prompt" is optional: without it the app shows a standard instruction for the exercise type.
type ExerciseBase = { id: string; prompt?: string; reviewed: boolean };

export type ChoiceExercise = ExerciseBase & {
  type: 'choice';
  question: string;
  questionLang: 'target' | 'native';
  options: string[];
  answer: string;
};

export type MatchExercise = ExerciseBase & {
  type: 'match';
  pairs: { target: string; native: string }[];
};

export type TypeExercise = ExerciseBase & {
  type: 'type';
  question: string; // in the learner's language
  answer: string; // expected answer in the language being learned
  accept?: string[]; // other answers that also count as correct
};

export type ListenExercise = ExerciseBase & {
  type: 'listen';
  audio: string; // text in the language being learned, spoken aloud
  options: string[];
  answer: string;
};

// Build a sentence: tap the word tiles in the right order.
export type BuildExercise = ExerciseBase & {
  type: 'build';
  question: string; // the sentence in the learner's language
  answer: string; // the sentence in the language being learned; its words become the tiles
  extra?: string[]; // wrong tiles mixed in
  accept?: string[]; // other correct word orders
};

// Fill the gap: a sentence with "___", pick the missing word or ending.
export type FillExercise = ExerciseBase & {
  type: 'fill';
  sentence: string; // language being learned, with ___ where the answer goes
  translation: string; // the whole sentence in the learner's language
  options: string[];
  answer: string;
  explain?: string; // why, in the learner's language: shown after answering
};

// Say it: read a sentence out loud, the phone listens and checks it.
export type SpeakExercise = ExerciseBase & {
  type: 'speak';
  text: string; // what to say, in the language being learned
  native: string; // its meaning, shown under it
};

export type Exercise =
  | ChoiceExercise
  | MatchExercise
  | TypeExercise
  | ListenExercise
  | BuildExercise
  | FillExercise
  | SpeakExercise;

export type ExerciseType = Exercise['type'];

export type Lesson = {
  id: string;
  title: string; // in the learner's language
  titleTarget: string; // in the language being learned
  tip: Tip;
  words: Word[];
  exercises: Exercise[];
  reviewed: boolean;
};

export type Level = 'A1' | 'A2';
export const LEVELS: Level[] = ['A1', 'A2'];

export type Unit = {
  id: string;
  level: Level;
  title: string;
  titleTarget: string;
  description: string;
  lessons: Lesson[];
  reviewed: boolean;
};

export type Course = {
  id: CourseId;
  units: Unit[];
  lessons: Lesson[]; // all lessons in order
};

// ---- Loading ----

// Every JSON file under /content, bundled into the app (also works offline and on native).
const files = require.context('../../content', true, /\/unit\d+-[^/]+\.json$/);

function unitNumber(key: string): number {
  return parseInt(/unit(\d+)-/.exec(key)?.[1] ?? '0', 10);
}

const cache = new Map<string, Course>();

// The course with all its units, in order (unit1, unit2, … unit10). Loaded on first use.
export function getCourse(courseId: CourseId): Course {
  const cached = cache.get(courseId);
  if (cached) return cached;
  const units = files
    .keys()
    .filter((key) => key.startsWith(`./${courseId}/`))
    .sort((a, b) => unitNumber(a) - unitNumber(b))
    .map((key) => files(key) as Unit);
  const course: Course = { id: courseId, units, lessons: units.flatMap((u) => u.lessons) };
  cache.set(courseId, course);
  return course;
}

export function hasContent(courseId: CourseId): boolean {
  return files.keys().some((key) => key.startsWith(`./${courseId}/`));
}

export function getWord(course: Course, wordId: string): Word | undefined {
  for (const lesson of course.lessons) {
    const word = lesson.words.find((w) => w.id === wordId);
    if (word) return word;
  }
  return undefined;
}

export function getLesson(course: Course, lessonId: string): Lesson | undefined {
  return course.lessons.find((l) => l.id === lessonId);
}

// The lesson after this one (across units), or undefined for the very last lesson.
export function getNextLesson(course: Course, lessonId: string): Lesson | undefined {
  const index = course.lessons.findIndex((l) => l.id === lessonId);
  return index === -1 ? undefined : course.lessons[index + 1];
}

export function getUnitOfLesson(course: Course, lessonId: string): Unit | undefined {
  return course.units.find((u) => u.lessons.some((l) => l.id === lessonId));
}

// Every text the app reads aloud in one lesson (each once), in the order the lesson uses them.
// Used by the pronunciation check screen.
export function spokenTexts(lesson: Lesson): string[] {
  const texts: string[] = [];
  const add = (text: string | undefined) => {
    if (text && !texts.includes(text)) texts.push(text);
  };
  lesson.words.forEach((w) => add(w.target));
  lesson.tip.examples?.forEach((e) => add(e.target));
  for (const ex of lesson.exercises) {
    if (ex.type === 'choice' && ex.questionLang === 'target') add(ex.question);
    if (ex.type === 'listen') add(ex.audio);
    if (ex.type === 'match') ex.pairs.forEach((p) => add(p.target));
    if (ex.type === 'type' || ex.type === 'build') add(ex.answer);
    if (ex.type === 'fill') add(ex.sentence.replace('___', ex.answer));
    if (ex.type === 'speak') add(ex.text);
  }
  return texts;
}
