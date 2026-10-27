import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CourseHeader } from '@/components/CourseHeader';
import { Screen } from '@/components/Screen';
import { TextKey, useT } from '@/i18n';
import { chatAvailable } from '@/lib/chat';
import type { Unit } from '@/lib/content';
import { useAccent, useCourse } from '@/lib/course';
import { useProgress } from '@/lib/progress';
import { useSettings } from '@/lib/settings';
import { UNIT_TEST_SIZE } from '@/lib/tests';
import { colors, font, radius, spacing, tapTarget } from '@/lib/theme';

// The course map: every unit with its lessons, read from /content.
export default function CourseScreen() {
  const t = useT();
  const { course } = useCourse();
  const { accent, accentLight } = useAccent();
  const { progress } = useProgress();
  const { settings } = useSettings();
  // The conversation is a family feature: shown only once the family code is entered.
  const showChat = chatAvailable() && settings.chatCode !== '';
  const isDone = (lessonId: string) => lessonId in progress.completedLessons;
  // The first unfinished lesson gets a "continue here" marker.
  const nextLessonId = course.lessons.find((l) => !isDone(l.id))?.id;

  return (
    <Screen>
      <CourseHeader />

      <ScrollView contentContainerStyle={styles.content}>
        {course.units.length === 0 && <Text style={styles.empty}>{t('course.empty')}</Text>}
        {course.units.map((unit, unitIndex) => {
          const doneCount = unit.lessons.filter((l) => isDone(l.id)).length;
          // A heading before the first unit of each level (A1, A2, B1).
          const newLevel = unitIndex === 0 || course.units[unitIndex - 1].level !== unit.level;
          const complete = doneCount === unit.lessons.length;
          return (
            <View key={unit.id} style={styles.unitBlock}>
              {newLevel && (
                <Text style={[styles.levelHeading, { color: accent }]} accessibilityRole="header">
                  {t('level.heading', { level: unit.level, name: t(`level.${unit.level}` as TextKey) })}
                </Text>
              )}
              <View style={styles.unit}>
                <View style={styles.unitHeader}>
                  <View style={[styles.unitNumber, { backgroundColor: complete ? colors.success : accent }]}>
                    {complete ? (
                      <Ionicons name="checkmark" size={28} color="#fff" />
                    ) : (
                      <Text style={styles.unitNumberText}>{unitIndex + 1}</Text>
                    )}
                  </View>
                  <View style={styles.unitTitles}>
                    <Text style={styles.unitTitle}>{unit.title}</Text>
                    <Text style={[styles.unitTitleTarget, { color: accent }]}>{unit.titleTarget}</Text>
                  </View>
                  <Text style={styles.unitCount}>{t('course.lessonsDone', { done: doneCount, total: unit.lessons.length })}</Text>
                </View>
                <Text style={styles.unitDescription}>{unit.description}</Text>

                {unit.lessons.map((lesson, lessonIndex) => {
                  const isNext = lesson.id === nextLessonId;
                  return (
                    <Pressable
                      key={lesson.id}
                      accessibilityRole="button"
                      onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })}
                      style={({ pressed }) => [
                        styles.lesson,
                        isNext && { borderWidth: 2, borderColor: accent, backgroundColor: accentLight },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.lessonNumber, { color: accent }]}>{lessonIndex + 1}</Text>
                      <View style={styles.lessonTitles}>
                        {isNext && <Text style={[styles.nextLabel, { color: accent }]}>{t('course.continueHere')}</Text>}
                        <Text style={styles.lessonTitle}>{lesson.title}</Text>
                        <Text style={styles.lessonTitleTarget}>{lesson.titleTarget}</Text>
                      </View>
                      {isDone(lesson.id) ? (
                        <Ionicons name="checkmark-circle" size={34} color={colors.success} accessibilityLabel={t('course.lessonDone')} />
                      ) : (
                        <Ionicons name={isNext ? 'play-circle' : 'chevron-forward'} size={isNext ? 38 : 26} color={isNext ? accent : colors.textMuted} />
                      )}
                    </Pressable>
                  );
                })}

                <UnitTestRow unit={unit} />
                {complete && showChat && <ChatRow unit={unit} />}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

// The unit test at the end of each unit: a star once passed, otherwise the best score so far.
function UnitTestRow({ unit }: { unit: Unit }) {
  const t = useT();
  const { accent } = useAccent();
  const { progress } = useProgress();
  const record = progress.unitTests[unit.id];
  const passed = !!record?.passedAt;
  const size = Math.min(UNIT_TEST_SIZE, unit.lessons.flatMap((l) => l.words).length);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/test/[unitId]', params: { unitId: unit.id } })}
      style={({ pressed }) => [styles.lesson, styles.testRow, pressed && styles.pressed]}
    >
      <Ionicons name="school" size={26} color={accent} />
      <View style={styles.lessonTitles}>
        <Text style={styles.lessonTitle}>{t('course.unitTest')}</Text>
        <Text style={styles.lessonTitleTarget}>
          {record ? t('course.unitTestBest', { score: record.bestScore, total: record.total }) : t('course.unitTestInfo', { count: size })}
        </Text>
      </View>
      {passed ? (
        <Ionicons name="star" size={34} color={colors.star} />
      ) : (
        <Ionicons name="chevron-forward" size={26} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

// The AI conversation partner for a finished unit (only when the server is set up).
function ChatRow({ unit }: { unit: Unit }) {
  const t = useT();
  const { accent } = useAccent();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/chat/[unitId]', params: { unitId: unit.id } })}
      style={({ pressed }) => [styles.lesson, styles.testRow, pressed && styles.pressed]}
    >
      <Ionicons name="chatbubbles" size={26} color={accent} />
      <View style={styles.lessonTitles}>
        <Text style={styles.lessonTitle}>{t('chat.open')}</Text>
        <Text style={styles.lessonTitleTarget}>{t('chat.openHint')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={26} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingTop: spacing.sm, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  empty: { fontSize: font.large, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, lineHeight: 30 },
  unitBlock: { gap: spacing.md },
  levelHeading: { fontSize: font.large + 2, fontWeight: '800', marginTop: spacing.sm },
  unit: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  unitNumber: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  unitNumberText: { color: '#fff', fontSize: font.large, fontWeight: '800' },
  unitTitles: { flex: 1 },
  unitTitle: { fontSize: font.large, fontWeight: '800', color: colors.text },
  unitTitleTarget: { fontSize: font.body, fontStyle: 'italic', fontWeight: '600' },
  unitCount: { fontSize: font.small, fontWeight: '700', color: colors.textMuted },
  unitDescription: { fontSize: font.body, color: colors.textMuted, lineHeight: 26 },
  lesson: {
    minHeight: tapTarget + 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  testRow: { borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed' },
  nextLabel: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
  pressed: { opacity: 0.7 },
  lessonNumber: { fontSize: font.large, fontWeight: '800', width: 24, textAlign: 'center' },
  lessonTitles: { flex: 1 },
  lessonTitle: { fontSize: font.body, fontWeight: '700', color: colors.text },
  lessonTitleTarget: { fontSize: font.small, color: colors.textMuted, fontStyle: 'italic' },
});
