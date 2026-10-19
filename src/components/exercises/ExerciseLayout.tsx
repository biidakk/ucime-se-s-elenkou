import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { TextKey, useT } from '@/i18n';
import type { Exercise } from '@/lib/content';
import { useCourse } from '@/lib/course';
import { colors, font, spacing } from '@/lib/theme';

// The standard instruction for an exercise, unless the content gives its own "prompt".
export function useExercisePrompt(exercise: Exercise): string {
  const t = useT();
  const { target } = useCourse();
  if (exercise.prompt) return exercise.prompt;
  const adverb = t(`lang.${target.code}.adverb` as TextKey);
  switch (exercise.type) {
    case 'choice':
      return exercise.questionLang === 'target' ? t('exercise.choice.target') : t('exercise.choice.native', { adverb });
    case 'listen':
      return exercise.options.includes(exercise.audio) ? t('exercise.listen.heard') : t('exercise.listen.meaning');
    case 'match':
      return t('exercise.match');
    case 'type':
      return t('exercise.type', { adverb });
    case 'build':
      return t('exercise.build', { adverb });
    case 'fill':
      return t('exercise.fill');
    case 'speak':
      return t('exercise.speak', { adverb });
  }
}

type Props = {
  exercise: Exercise;
  children: ReactNode;
  // The "check" button at the bottom (always in the same place). Hidden once answered.
  onCheck?: () => void;
  canCheck?: boolean;
  checked?: boolean;
  footer?: ReactNode; // something else at the bottom instead of the check button
};

// Every exercise looks the same: the instruction on top, the task, the button at the bottom.
export function ExerciseLayout({ exercise, children, onCheck, canCheck = true, checked = false, footer }: Props) {
  const t = useT();
  const prompt = useExercisePrompt(exercise);
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.prompt}>{prompt}</Text>
        {children}
      </View>
      {footer}
      {onCheck && !checked && <BigButton label={t('common.check')} onPress={onCheck} disabled={!canCheck} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', gap: spacing.lg },
  top: { gap: spacing.md },
  prompt: { fontSize: font.body, color: colors.textMuted, fontWeight: '700' },
});
