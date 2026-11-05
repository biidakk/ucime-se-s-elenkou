import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { useT } from '@/i18n';
import { useAccent } from '@/lib/course';
import { askForReminders } from '@/lib/reminder';
import { DEFAULT_REMINDER_HOUR, useSettings } from '@/lib/settings';
import { colors, font, radius, spacing } from '@/lib/theme';

// Asked once on the home screen, after the first lessons; later it is only in Settings.
export function ReminderOffer() {
  const t = useT();
  const { accent } = useAccent();
  const { update } = useSettings();

  const accept = async () => {
    const allowed = await askForReminders(t('reminder.channel'));
    update({ reminderAsked: true, reminderHour: allowed ? DEFAULT_REMINDER_HOUR : null });
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="notifications" size={30} color={accent} />
        <Text style={styles.title}>{t('reminder.title')}</Text>
      </View>
      <Text style={styles.text}>{t('reminder.offer')}</Text>
      <BigButton label={t('reminder.offerYes', { time: `${DEFAULT_REMINDER_HOUR}:00` })} onPress={accept} />
      <BigButton label={t('reminder.offerNo')} variant="secondary" onPress={() => update({ reminderAsked: true })} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: font.large, fontWeight: '800', color: colors.text },
  text: { fontSize: font.body, color: colors.text, lineHeight: 27 },
});
