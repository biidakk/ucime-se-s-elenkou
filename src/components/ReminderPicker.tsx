import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Segmented } from '@/components/Segmented';
import { useT } from '@/i18n';
import { askForReminders, remindersAllowed } from '@/lib/reminder';
import { DEFAULT_REMINDER_HOUR, REMINDER_HOURS, useSettings } from '@/lib/settings';
import { colors, font } from '@/lib/theme';

// The daily reminder in Settings: on or off, and at which hour.
export function ReminderPicker() {
  const t = useT();
  const { settings, update } = useSettings();
  const [denied, setDenied] = useState(false);
  const hour = settings.reminderHour;

  // Turned off in the phone's settings, or restored from a backup on another phone.
  useEffect(() => {
    if (hour !== null) remindersAllowed().then((allowed) => setDenied(!allowed));
  }, [hour]);

  const choose = async (next: number) => {
    const allowed = await askForReminders(t('reminder.channel'));
    setDenied(!allowed);
    update({ reminderAsked: true, reminderHour: allowed ? next : null });
  };

  return (
    <>
      <Text style={styles.text}>{t('settings.reminderText')}</Text>
      <Segmented<'on' | 'off'>
        value={hour === null ? 'off' : 'on'}
        onChange={(value) => {
          if (value === 'off') {
            setDenied(false);
            update({ reminderHour: null });
          } else if (hour === null) choose(DEFAULT_REMINDER_HOUR);
        }}
        options={[
          { value: 'on', label: t('settings.reminderOn') },
          { value: 'off', label: t('settings.reminderOff') },
        ]}
      />
      {hour !== null && (
        <>
          <Text style={styles.label}>{t('settings.reminderTime')}</Text>
          <Segmented<string>
            value={String(hour)}
            onChange={(value) => choose(Number(value))}
            options={REMINDER_HOURS.map((h) => ({ value: String(h), label: `${h}:00` }))}
          />
        </>
      )}
      {denied && <Text style={styles.denied}>{t('settings.reminderDenied')}</Text>}
    </>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: font.body, color: colors.text, lineHeight: 27 },
  label: { fontSize: font.body, fontWeight: '700', color: colors.textMuted },
  denied: { fontSize: font.body, color: colors.error, fontWeight: '600', lineHeight: 27 },
});
