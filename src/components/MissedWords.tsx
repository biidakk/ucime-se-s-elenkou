import { StyleSheet, Text, View } from 'react-native';
import { SpeakButton } from '@/components/SpeakButton';
import { useT } from '@/i18n';
import type { Word } from '@/lib/content';
import { useAccent } from '@/lib/course';
import { colors, font, radius, spacing } from '@/lib/theme';

// The words answered wrong in a test, to look at once more.
export function MissedWords({ words }: { words: Word[] }) {
  const t = useT();
  const { accent } = useAccent();
  if (words.length === 0) return null;
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{t('test.missedTitle')}</Text>
      {words.map((w) => (
        <View key={w.id} style={styles.row}>
          <View style={styles.texts}>
            <Text style={[styles.target, { color: accent }]}>{w.target}</Text>
            <Text style={styles.native}>{w.native}</Text>
          </View>
          <SpeakButton text={w.target} />
        </View>
      ))}
      <Text style={styles.hint}>{t('test.missedHint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: 'stretch',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  title: { fontSize: font.large, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  texts: { flex: 1, gap: 2 },
  target: { fontSize: font.large, fontWeight: '700' },
  native: { fontSize: font.body, color: colors.text },
  hint: { fontSize: font.small, color: colors.textMuted },
});
