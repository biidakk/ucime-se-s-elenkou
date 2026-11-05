import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { WeekDots } from '@/components/WeekDots';
import { TextKey, useT } from '@/i18n';
import { LEVELS } from '@/lib/content';
import { useAccent, useCourse } from '@/lib/course';
import { currentStreak, dayKey, daysThisWeek } from '@/lib/dates';
import { useProgress } from '@/lib/progress';
import { colors, font, radius, spacing } from '@/lib/theme';

// Progress: practice this week and the streak (shared by all languages), then finished
// lessons, words and unit tests of the current course.
// The streak is gentle: it shows the days practised this week, and never scolds.
export default function ProgressScreen() {
  const t = useT();
  const { accent } = useAccent();
  const { course, target } = useCourse();
  const { progress, activity } = useProgress();

  const streak = currentStreak(activity.activeDays);
  const thisWeek = daysThisWeek(activity.activeDays);
  const practisedToday = activity.activeDays.includes(dayKey());
  const doneCount = course.lessons.filter((l) => l.id in progress.completedLessons).length;
  const levels = LEVELS.filter((level) => course.units.some((u) => u.level === level));
  const testsPassed = course.units.filter((u) => progress.unitTests[u.id]?.passedAt).length;
  const words = Object.keys(progress.cards).length;

  return (
    <Screen title={t('progress.title')}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, styles.streakCard]}>
          <Text style={styles.streakEmoji}>{streak > 0 ? '🔥' : '🌱'}</Text>
          <Text style={styles.streakNumber}>
            {streak > 0 ? t('streak.days', { count: streak }) : t('progress.streakNone')}
          </Text>
          <Text style={styles.streakLabel}>{t('progress.week', { count: thisWeek })}</Text>
          <View style={styles.weekWrap}>
            <WeekDots />
          </View>
          <Text style={styles.streakHint}>{practisedToday ? t('progress.today') : t('progress.notToday')}</Text>
        </View>

        <Text style={[styles.courseLabel, { color: accent }]}>
          {t('progress.courseLabel', { language: t(`lang.${target.code}.name` as TextKey) })}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('progress.lessons')}</Text>
          <Text style={[styles.bigNumber, { color: accent }]}>
            {doneCount} <Text style={styles.ofTotal}>/ {course.lessons.length}</Text>
          </Text>
          {levels.map((level) => {
            const lessons = course.units.filter((u) => u.level === level).flatMap((u) => u.lessons);
            const levelDone = lessons.filter((l) => l.id in progress.completedLessons).length;
            const share = lessons.length ? levelDone / lessons.length : 0;
            return (
              <View key={level} style={styles.levelRow}>
                <View style={styles.levelRowText}>
                  <Text style={styles.levelName}>
                    {level} · {t(`level.${level}` as TextKey)}
                  </Text>
                  <Text style={styles.levelCount}>{Math.round(share * 100)} %</Text>
                </View>
                <View style={styles.barRow}>
                  <ProgressBar value={share} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.row}>
          <View style={[styles.card, styles.half]}>
            <Text style={styles.cardTitle}>{t('progress.words')}</Text>
            <Text style={[styles.bigNumber, { color: accent }]}>{words}</Text>
          </View>
          <View style={[styles.card, styles.half]}>
            <Text style={styles.cardTitle}>{t('progress.tests')}</Text>
            <Text style={[styles.bigNumber, { color: accent }]}>
              {testsPassed} <Text style={styles.ofTotal}>/ {course.units.length} ⭐</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakCard: { alignItems: 'center' },
  streakEmoji: { fontSize: 56 },
  streakNumber: { fontSize: font.title, fontWeight: '800', color: colors.text, textAlign: 'center' },
  streakLabel: { fontSize: font.large, color: colors.textMuted, fontWeight: '600' },
  streakHint: { fontSize: font.body, color: colors.text, textAlign: 'center', marginTop: spacing.sm },
  weekWrap: { alignSelf: 'stretch', marginTop: spacing.md },
  courseLabel: { fontSize: font.large, fontWeight: '800', marginTop: spacing.sm },
  cardTitle: { fontSize: font.large, fontWeight: '800', color: colors.text },
  bigNumber: { fontSize: font.huge, fontWeight: '800' },
  ofTotal: { fontSize: font.large, color: colors.textMuted, fontWeight: '600' },
  levelRow: { gap: spacing.xs, marginTop: spacing.sm },
  levelRowText: { flexDirection: 'row', justifyContent: 'space-between' },
  levelName: { fontSize: font.body, color: colors.text, fontWeight: '600' },
  levelCount: { fontSize: font.body, color: colors.textMuted, fontWeight: '600' },
  barRow: { flexDirection: 'row' },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },
});
