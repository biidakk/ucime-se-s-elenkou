import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SpeakButton } from '@/components/SpeakButton';
import { VoiceNotice } from '@/components/VoiceNotice';
import type { ListenExercise } from '@/lib/content';
import { useSpeak } from '@/lib/speech';
import { spacing } from '@/lib/theme';
import { ExerciseLayout } from './ExerciseLayout';
import { OptionButton } from './OptionButton';
import type { ExerciseResult } from './types';
import { useSingleChoice } from './useSingleChoice';

type Props = {
  exercise: ListenExercise;
  onResult: (result: ExerciseResult) => void;
};

// Listen and choose: hear a word or sentence, pick what you heard or what it means.
export function ListenExerciseView({ exercise, onResult }: Props) {
  const speak = useSpeak();
  const { options, selected, checked, select, check, stateFor } = useSingleChoice(
    exercise.options,
    exercise.answer,
    onResult,
  );
  const optionsAreTarget = exercise.options.includes(exercise.audio);

  // Play the audio once as soon as the exercise appears.
  useEffect(() => {
    speak(exercise.audio);
    // Only when a new exercise appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise]);

  return (
    <ExerciseLayout exercise={exercise} onCheck={check} canCheck={!!selected} checked={checked}>
      <View style={styles.buttons}>
        <SpeakButton text={exercise.audio} size="large" showLabel />
        <SpeakButton text={exercise.audio} size="large" slow showLabel />
      </View>
      <VoiceNotice />
      <View style={styles.options}>
        {options.map((option) => (
          <OptionButton
            key={option}
            label={option}
            state={stateFor(option)}
            onPress={() => select(option)}
            emphasis={optionsAreTarget}
          />
        ))}
      </View>
    </ExerciseLayout>
  );
}

const styles = StyleSheet.create({
  buttons: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginVertical: spacing.sm },
  options: { gap: spacing.sm },
});
