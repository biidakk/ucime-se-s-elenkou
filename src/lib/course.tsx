import { Course, getCourse } from './content';
import { COURSES, CourseInfo, getCourseInfo, LanguageInfo, LANGUAGES } from './languages';
import { useSettings } from './settings';
import { colors } from './theme';

// The course the user is learning now, with its content and its languages.
export type ActiveCourse = {
  info: CourseInfo;
  course: Course;
  target: LanguageInfo; // the language being learned
  native: LanguageInfo; // the learner's language
};

export function useCourse(): ActiveCourse {
  const { settings } = useSettings();
  const info = settings.courseId ? getCourseInfo(settings.courseId) : COURSES[0];
  return {
    info,
    course: getCourse(info.id),
    target: LANGUAGES[info.target],
    native: LANGUAGES[info.native],
  };
}

export type Accent = { accent: string; accentDark: string; accentLight: string };

// The course colour, used for buttons and highlights. Before a course is chosen: app blue.
export function useAccent(): Accent {
  const { settings } = useSettings();
  if (!settings.courseId) {
    return { accent: colors.primary, accentDark: colors.primaryDark, accentLight: colors.primaryLight };
  }
  const { accent, accentDark, accentLight } = LANGUAGES[getCourseInfo(settings.courseId).target];
  return { accent, accentDark, accentLight };
}
