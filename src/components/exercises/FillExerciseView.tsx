import { StyleSheet, Text, View } from 'react-native';
import type { FillExercise } from '@/lib/content';
import { useAccent } from '@/lib/course';
import { useSpeak } from '@/lib/speech';
import { colors, font, spacing } from '@/lib/theme';
import { ExerciseLayout } from './ExerciseLayout';
import { OptionButton } from './OptionButton';
import type { ExerciseResult } from './types';
import { useSingleChoice } from './useSingleChoice';

type Props = {
  exercise: FillExercise;
  onResult: (result: ExerciseResult) => void;
};

// Fill the gap: a sentence with one missing word or ending, pick the right one.
export function FillExerciseView({ exercise, onResult }: Props) {
  const speak = useSpeak();
  const { accent, accentLight } = useAccent();
  const [before, after] = exercise.sentence.split('___');
  const full = `${before}${exercise.answer}${after}`;
  const { options, selected, checked, select, check, stateFor } = useSingleChoice(
    exercise.options,
    exercise.answer,
    (result) => {
      speak(full);
      onResult({ ...result, correctAnswer: full, note: exercise.explain });
    },
  );

  return (
    <ExerciseLayout exercise={exercise} onCheck={check} canCheck={!!selected} checked={checked}>
      <Text style={[styles.sentence, { color: accent }]}>
        {before}
        <Text style={[styles.gap, selected ? { color: colors.text, backgroundColor: accentLight } : null]}>
          {selected ?? ' ____ '}
        </Text>
        {after}
      </Text>
      <Text style={styles.translation}>{exercise.translation}</Text>
      <View style={styles.options}>
        {options.map((option) => (
          <OptionButton key={option} label={option} state={stateFor(option)} onPress={() => select(option)} emphasis />
        ))}
      </View>
    </ExerciseLayout>
  );
}

const styles = StyleSheet.create({
  sentence: { fontSize: font.title, fontWeight: '800', lineHeight: 42 },
  gap: { color: colors.textMuted, backgroundColor: colors.border },
  translation: { fontSize: font.body, color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing.sm },
  options: { gap: spacing.sm },
});
