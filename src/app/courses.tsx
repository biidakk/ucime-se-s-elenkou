import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { LanguageCard } from '@/components/LanguageCard';
import { LessonHeader } from '@/components/LessonHeader';
import { Screen } from '@/components/Screen';
import { TextKey, useT } from '@/i18n';
import { getCourse, hasContent } from '@/lib/content';
import { CourseId, coursesFor, ENDONYMS } from '@/lib/languages';
import { loadCourseProgress } from '@/lib/progress';
import { useSettings } from '@/lib/settings';
import { colors, font, spacing } from '@/lib/theme';

// Choose which language to learn. The progress of every language is kept separately.
export default function CoursesScreen() {
  const t = useT();
  const { settings, update } = useSettings();
  const courses = coursesFor(settings.nativeLanguage ?? 'cs');
  const [done, setDone] = useState<Partial<Record<CourseId, number>>>({});

  useEffect(() => {
    Promise.all(
      courses.map(async (c) => [c.id, Object.keys((await loadCourseProgress(c.id)).completedLessons).length] as const),
    ).then((entries) => setDone(Object.fromEntries(entries)));
    // Load once when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (courseId: CourseId) => {
    update({ courseId });
    router.back();
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <LessonHeader onClose={() => router.back()} title={t('courses.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        {courses.map((c) => {
          const total = hasContent(c.id) ? getCourse(c.id).lessons.length : 0;
          const current = c.id === settings.courseId;
          return (
            <LanguageCard
              key={c.id}
              lang={c.target}
              title={t(`lang.${c.target}.name` as TextKey)}
              subtitle={`${ENDONYMS[c.target]} · ${t(`lang.${c.target}.variant` as TextKey)}`}
              detail={
                current
                  ? t('courses.current')
                  : total > 0
                    ? t('courses.progress', { done: done[c.id] ?? 0, total })
                    : t('common.comingSoon')
              }
              selected={current}
              onPress={() => choose(c.id)}
            />
          );
        })}
        <Text style={styles.hint}>{t('welcome.targetHint')}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  hint: { fontSize: font.body, color: colors.textMuted, lineHeight: 27 },
});
