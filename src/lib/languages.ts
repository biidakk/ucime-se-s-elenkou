// The languages the app knows about, and the courses (native language → language to learn).
// Names of languages are not here: they are UI text, in the translation files (i18n).

export type LanguageCode = 'cs' | 'en' | 'de' | 'ro';

// Languages the interface can be shown in (one translation file each in src/i18n).
export type UiLanguage = 'cs' | 'ro';
export const UI_LANGUAGES: UiLanguage[] = ['cs', 'ro'];
// Shown on the first screen as "coming soon", so the choice is visible from the start.
export const UI_LANGUAGES_SOON: LanguageCode[] = [];

export type LanguageInfo = {
  code: LanguageCode;
  speech: string; // locale for text-to-speech and speech recognition
  accent: string; // the course colour: buttons, headings, words in this language
  accentDark: string;
  accentLight: string; // light background in the same colour
  // Letters the phone keyboard may not offer easily: shown as buttons under the text box.
  specialLetters: string[];
};

export const LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  cs: {
    code: 'cs',
    speech: 'cs-CZ',
    accent: '#1E5AA8',
    accentDark: '#123E78',
    accentLight: '#E8F0FB',
    specialLetters: ['á', 'č', 'ď', 'é', 'ě', 'í', 'ň', 'ó', 'ř', 'š', 'ť', 'ú', 'ů', 'ý', 'ž'],
  },
  en: {
    code: 'en',
    speech: 'en-GB',
    accent: '#1F4FA0',
    accentDark: '#14346B',
    accentLight: '#E7EEFA',
    specialLetters: [],
  },
  de: {
    code: 'de',
    speech: 'de-DE',
    accent: '#8A5A00',
    accentDark: '#5E3D00',
    accentLight: '#FBF1DC',
    specialLetters: ['ä', 'ö', 'ü', 'ß'],
  },
  ro: {
    code: 'ro',
    speech: 'ro-RO',
    accent: '#6A3FA0',
    accentDark: '#47276E',
    accentLight: '#F1EAFA',
    specialLetters: ['ă', 'â', 'î', 'ș', 'ț'],
  },
};

export type CourseId = 'cs-en' | 'cs-de' | 'cs-ro' | 'ro-cs';

export type CourseInfo = {
  id: CourseId;
  native: LanguageCode; // the learner's language (= interface language)
  target: LanguageCode; // the language being learned
};

export const COURSES: CourseInfo[] = [
  { id: 'cs-en', native: 'cs', target: 'en' },
  { id: 'cs-de', native: 'cs', target: 'de' },
  { id: 'cs-ro', native: 'cs', target: 'ro' },
  { id: 'ro-cs', native: 'ro', target: 'cs' }, // moved in from the old app „Cehă pentru români“
];

export function coursesFor(native: LanguageCode): CourseInfo[] {
  return COURSES.filter((c) => c.native === native);
}

export function getCourseInfo(courseId: CourseId): CourseInfo {
  return COURSES.find((c) => c.id === courseId) ?? COURSES[0];
}

export function isCourseId(value: unknown): value is CourseId {
  return COURSES.some((c) => c.id === value);
}

// Each language's name in itself, for the very first screen (before the interface language
// is known). These are names, not interface text.
export const ENDONYMS: Record<LanguageCode, string> = {
  cs: 'Čeština',
  en: 'English',
  de: 'Deutsch',
  ro: 'Română',
};
