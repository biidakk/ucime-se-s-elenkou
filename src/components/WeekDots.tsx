import { StyleSheet, Text, View } from 'react-native';
import { useT } from '@/i18n';
import { useAccent } from '@/lib/course';
import { dayKey, daysAgo } from '@/lib/dates';
import { useProgress } from '@/lib/progress';
import { colors } from '@/lib/theme';

// The last 7 days as dots: green with a tick when practised, today with a ring.
export function WeekDots() {
  const t = useT();
  const { accent } = useAccent();
  const { activity } = useProgress();
  const weekdays = t.list('progress.weekdays');
  const lastWeek = [6, 5, 4, 3, 2, 1, 0].map((n) => daysAgo(n));

  return (
    <View style={styles.week}>
      {lastWeek.map((date) => {
        const active = activity.activeDays.includes(dayKey(date));
        const today = dayKey(date) === dayKey();
        return (
          <View key={dayKey(date)} style={styles.weekDay}>
            <View style={[styles.dot, active && styles.dotActive, today && !active && { borderColor: accent, borderWidth: 3 }]}>
              {active && <Text style={styles.dotCheck}>✓</Text>}
            </View>
            <Text style={[styles.weekLabel, today && { color: colors.text }]}>{weekdays[date.getDay()]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch' },
  weekDay: { alignItems: 'center', gap: 4 },
  dot: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: colors.successBorder },
  dotCheck: { color: '#fff', fontSize: 18, fontWeight: '800' },
  weekLabel: { fontSize: 15, color: colors.textMuted, fontWeight: '700' },
});
