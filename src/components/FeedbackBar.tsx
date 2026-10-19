import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import type { ExerciseResult } from '@/components/exercises/types';
import { useT } from '@/i18n';
import { useInsets } from '@/lib/insets';
import { colors, font, radius, spacing } from '@/lib/theme';

type Props = {
  result: ExerciseResult;
  onContinue: () => void;
  retryLater?: boolean; // lesson exercises come back at the end when answered wrong
};

// The green/red banner shown at the bottom after answering an exercise.
export function FeedbackBar({ result, onContinue, retryLater = false }: Props) {
  const t = useT();
  const insets = useInsets();
  const praise = useMemo(() => {
    const list = t.list('feedback.correct');
    return list[Math.floor(Math.random() * list.length)];
    // A new word of praise for each answer, not for each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  return (
    <View
      style={[styles.bar, result.correct ? styles.correct : styles.wrong, { paddingBottom: spacing.md + insets.bottom }]}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.titleRow}>
        <View style={[styles.icon, { backgroundColor: result.correct ? colors.success : colors.error }]}>
          <Ionicons name={result.correct ? 'checkmark' : 'close'} size={28} color="#fff" />
        </View>
        <Text style={[styles.title, { color: result.correct ? colors.success : colors.error }]}>
          {result.correct ? praise : t('feedback.wrong')}
        </Text>
      </View>
      {!result.correct && result.correctAnswer !== '' && <Text style={styles.answer}>{result.correctAnswer}</Text>}
      {result.note && <Text style={styles.note}>{result.note}</Text>}
      {!result.correct && retryLater && <Text style={styles.note}>{t('feedback.retryLater')}</Text>}
      <BigButton label={t('common.continue')} onPress={onContinue} variant={result.correct ? 'success' : 'danger'} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 3,
  },
  correct: { backgroundColor: colors.successLight, borderTopColor: colors.successBorder },
  wrong: { backgroundColor: colors.errorLight, borderTopColor: colors.errorBorder },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: font.large + 2, fontWeight: '800' },
  answer: { fontSize: font.large, fontWeight: '700', color: colors.text },
  note: { fontSize: font.body, color: colors.text, lineHeight: 26 },
});
