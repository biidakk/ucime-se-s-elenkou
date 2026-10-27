import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Flag } from '@/components/Flag';
import { TextKey, useT } from '@/i18n';
import { useAccent, useCourse } from '@/lib/course';
import { currentStreak } from '@/lib/dates';
import { useProgress } from '@/lib/progress';
import { colors, font, radius, spacing, tapTarget } from '@/lib/theme';

// The top of the home screen and the course map: the language being learned (tap to change it)
// and the streak.
export function CourseHeader() {
  const t = useT();
  const { target } = useCourse();
  const { accent } = useAccent();
  const { activity } = useProgress();
  const streak = currentStreak(activity.activeDays);

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.push('/courses')}
        accessibilityRole="button"
        accessibilityLabel={t('course.change')}
        style={({ pressed }) => [styles.coursePicker, pressed && styles.pressed]}
      >
        <Flag lang={target.code} width={48} />
        <View style={styles.courseTexts}>
          <Text style={[styles.courseName, { color: accent }]} numberOfLines={1}>
            {t(`lang.${target.code}.name` as TextKey)}
          </Text>
          <Text style={styles.courseChange}>
            {t('course.change')} <Ionicons name="chevron-down" size={14} />
          </Text>
        </View>
      </Pressable>
      {streak > 0 && (
        <View style={styles.streak} accessibilityLabel={t('streak.days', { count: streak })}>
          <Text style={styles.streakText}>🔥 {streak}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  coursePicker: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: tapTarget },
  courseTexts: { flex: 1 },
  courseName: { fontSize: font.title, fontWeight: '800' },
  courseChange: { fontSize: font.small, color: colors.textMuted, fontWeight: '700' },
  streak: { backgroundColor: '#FFF1E0', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  streakText: { fontSize: font.large, fontWeight: '800', color: '#B4530A' },
  pressed: { opacity: 0.7 },
});
