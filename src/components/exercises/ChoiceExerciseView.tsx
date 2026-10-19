import { StyleSheet, Text, View } from 'react-native';
import { SpeakButton } from '@/components/SpeakButton';
import type { ChoiceExercise } from '@/lib/content';
import { useAccent } from '@/lib/course';
import { colors, font, spacing } from '@/lib/theme';
import { ExerciseLayout } from './ExerciseLayout';
import { OptionButton } from './OptionButton';
import type { ExerciseResult } from './types';
import { useSingleChoice } from './useSingleChoice';

type Props = {
  exercise: ChoiceExercise;
  onResult: (result: ExerciseResult) => void;
};

// Multiple choice: read the question, pick one of the answers.
export function ChoiceExerciseView({ exercise, onResult }: Props) {
  const { accent } = useAccent();
  const { options, selected, checked, select, check, stateFor } = useSingleChoice(
    exercise.options,
    exercise.answer,
    onResult,
  );
  const questionIsTarget = exercise.questionLang === 'target';

  return (
    <ExerciseLayout exercise={exercise} onCheck={check} canCheck={!!selected} checked={checked}>
      <View style={styles.questionRow}>
        <Text style={[styles.question, questionIsTarget && { color: accent }]}>{exercise.question}</Text>
        {questionIsTarget && <SpeakButton text={exercise.question} />}
      </View>
      <View style={styles.options}>
        {options.map((option) => (
          <OptionButton
            key={option}
            label={option}
            state={stateFor(option)}
            onPress={() => select(option)}
            emphasis={!questionIsTarget}
          />
        ))}
      </View>
    </ExerciseLayout>
  );
}

const styles = StyleSheet.create({
  questionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  question: { flexShrink: 1, fontSize: font.huge, fontWeight: '800', color: colors.text },
  options: { gap: spacing.sm },
});
