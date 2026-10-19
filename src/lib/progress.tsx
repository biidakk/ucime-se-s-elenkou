import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { getCourse, getLesson } from './content';
import { dayKey } from './dates';
import type { CourseId } from './languages';
import { useSettings } from './settings';
import { Card, gradeCard, newCard } from './srs';
import { loadValue, removeValue, saveValue } from './storage';

// The user's progress, saved on the phone.
//   - per course ("progress:cs-en", …): finished lessons, test scores and flashcards
//   - for the learner ("activity"): the days they practised, whatever the course (the streak)

export const ACTIVITY_KEY = 'activity';
export const progressKey = (courseId: CourseId) => `progress:${courseId}`;

export type LessonRecord = {
  completedAt: string; // day key, e.g. "2026-10-19"
  bestScore: number; // exercises right on the first try
  total: number;
};

export type TestRecord = {
  bestScore: number; // questions right
  total: number;
  passedAt?: string; // unit tests only: day key of the first pass
};

export type Progress = {
  completedLessons: Record<string, LessonRecord>;
  cards: Record<string, Card>; // flashcards, by word id
  lessonQuizzes: Record<string, TestRecord>; // by lesson id
  unitTests: Record<string, TestRecord>; // by unit id
};

export type Activity = { activeDays: string[] };

const EMPTY: Progress = { completedLessons: {}, cards: {}, lessonQuizzes: {}, unitTests: {} };
const NO_ACTIVITY: Activity = { activeDays: [] };

type ProgressState = {
  loaded: boolean; // the progress of the current course is loaded
  ready: boolean; // something has been loaded once (the app can start)
  courseId: CourseId | null;
  progress: Progress;
  activity: Activity;
  completeLesson: (lessonId: string, score: number, total: number) => void;
  saveTestResult: (kind: 'lesson' | 'unit', id: string, score: number, total: number, passed: boolean) => void;
  reviewWord: (wordId: string, knewIt: boolean) => void;
  recordActivity: () => void;
  resetProgress: () => void;
  reload: () => Promise<void>;
};

const ProgressContext = createContext<ProgressState | null>(null);

function withToday(activeDays: string[]): string[] {
  const today = dayKey();
  return activeDays.includes(today) ? activeDays : [...activeDays, today];
}

// Make sure every word of every finished lesson has a flashcard.
function withCardsForLessons(courseId: CourseId, cards: Record<string, Card>, lessonIds: string[]) {
  const course = getCourse(courseId);
  const result = { ...cards };
  for (const lessonId of lessonIds) {
    for (const word of getLesson(course, lessonId)?.words ?? []) {
      if (!result[word.id]) result[word.id] = newCard();
    }
  }
  return result;
}

// The saved progress of any course (also used by the course picker).
export async function loadCourseProgress(courseId: CourseId): Promise<Progress> {
  return { ...EMPTY, ...(await loadValue<Partial<Progress>>(progressKey(courseId), {})) };
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const courseId = settings.courseId;
  const [loadedFor, setLoadedFor] = useState<CourseId | null | undefined>(undefined);
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [activity, setActivity] = useState<Activity>(NO_ACTIVITY);

  const reload = useCallback(async () => {
    const savedActivity = await loadValue<Activity>(ACTIVITY_KEY, NO_ACTIVITY);
    setActivity({ ...NO_ACTIVITY, ...savedActivity });
    if (courseId) {
      const saved = await loadCourseProgress(courseId);
      saved.cards = withCardsForLessons(courseId, saved.cards, Object.keys(saved.completedLessons));
      setProgress(saved);
    } else {
      setProgress(EMPTY);
    }
    setLoadedFor(courseId);
  }, [courseId]);

  // Load again whenever the user switches to another course.
  useEffect(() => {
    reload();
  }, [reload]);

  // Change the progress of the current course and save it to the phone straight away.
  const update = (change: (old: Progress) => Progress) => {
    if (!courseId) return;
    setProgress((old) => {
      const next = change(old);
      saveValue(progressKey(courseId), next);
      return next;
    });
  };

  const recordActivity = () => {
    setActivity((old) => {
      const next = { activeDays: withToday(old.activeDays) };
      saveValue(ACTIVITY_KEY, next);
      return next;
    });
  };

  const completeLesson = (lessonId: string, score: number, total: number) => {
    if (!courseId) return;
    update((old) => {
      const previous = old.completedLessons[lessonId];
      const record: LessonRecord = {
        completedAt: dayKey(),
        bestScore: Math.max(score, previous?.bestScore ?? 0),
        total,
      };
      return {
        ...old,
        completedLessons: { ...old.completedLessons, [lessonId]: record },
        cards: withCardsForLessons(courseId, old.cards, [lessonId]),
      };
    });
    recordActivity();
  };

  const saveTestResult = (kind: 'lesson' | 'unit', id: string, score: number, total: number, passed: boolean) => {
    update((old) => {
      const field = kind === 'lesson' ? 'lessonQuizzes' : 'unitTests';
      const previous = old[field][id];
      const record: TestRecord = {
        bestScore: Math.max(score, previous?.bestScore ?? 0),
        total,
        passedAt: previous?.passedAt ?? (passed ? dayKey() : undefined),
      };
      return { ...old, [field]: { ...old[field], [id]: record } };
    });
    recordActivity();
  };

  const reviewWord = (wordId: string, knewIt: boolean) => {
    update((old) => {
      const card = old.cards[wordId] ?? newCard();
      return { ...old, cards: { ...old.cards, [wordId]: gradeCard(card, knewIt) } };
    });
  };

  const resetProgress = () => {
    if (!courseId) return;
    setProgress(EMPTY);
    removeValue(progressKey(courseId));
  };

  return (
    <ProgressContext.Provider
      value={{
        loaded: loadedFor === courseId,
        ready: loadedFor !== undefined,
        courseId,
        progress,
        activity,
        completeLesson,
        saveTestResult,
        reviewWord,
        recordActivity,
        resetProgress,
        reload,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressState {
  const state = useContext(ProgressContext);
  if (!state) throw new Error('useProgress must be used inside ProgressProvider');
  return state;
}
