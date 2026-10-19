import { StyleSheet, Text, View } from 'react-native';
import { SpeakButton } from '@/components/SpeakButton';
import { useT } from '@/i18n';
import type { Tip } from '@/lib/content';
import { useAccent } from '@/lib/course';
import { colors, font, radius, spacing } from '@/lib/theme';

// The short explanation shown at the start of each lesson, in the learner's language.
export function TipCard({ tip }: { tip: Tip }) {
  const t = useT();
  const { accent } = useAccent();
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t('tip.label')}</Text>
      <Text style={styles.title} accessibilityRole="header">
        {tip.title}
      </Text>
      <Text style={styles.text}>{tip.text}</Text>
      {tip.examples && tip.examples.length > 0 && (
        <View style={styles.examples}>
          {tip.examples.map((example) => (
            <View key={example.target} style={styles.example}>
              <View style={styles.exampleText}>
                <Text style={[styles.exampleTarget, { color: accent }]}>{example.target}</Text>
                <Text style={styles.exampleNative}>{example.native}</Text>
              </View>
              <SpeakButton text={example.target} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.tipBackground,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.tipBorder,
  },
  label: { fontSize: font.body, fontWeight: '800', color: colors.tipLabel },
  title: { fontSize: font.title - 2, fontWeight: '800', color: colors.text },
  text: { fontSize: font.body + 1, color: colors.text, lineHeight: 30 },
  examples: { marginTop: spacing.sm, gap: spacing.sm },
  example: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  exampleText: { flex: 1 },
  exampleTarget: { fontSize: font.large, fontWeight: '800' },
  exampleNative: { fontSize: font.body, color: colors.textMuted, marginTop: 2 },
});
