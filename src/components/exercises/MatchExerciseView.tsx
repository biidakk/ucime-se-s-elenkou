import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { MatchExercise } from '@/lib/content';
import { shuffle } from '@/lib/shuffle';
import { useSpeak } from '@/lib/speech';
import { spacing } from '@/lib/theme';
import { ExerciseLayout } from './ExerciseLayout';
import { OptionButton, OptionState } from './OptionButton';
import type { ExerciseResult } from './types';

type Props = {
  exercise: MatchExercise;
  onResult: (result: ExerciseResult) => void;
};

// Match pairs: tap a word on the left, then its meaning on the right (or the other way round).
// A wrong pair just flashes red; there is no penalty.
export function MatchExerciseView({ exercise, onResult }: Props) {
  const speak = useSpeak();
  const targets = useMemo(() => shuffle(exercise.pairs.map((p) => p.target)), [exercise]);
  const natives = useMemo(() => shuffle(exercise.pairs.map((p) => p.native)), [exercise]);

  const [pickedTarget, setPickedTarget] = useState<string | null>(null);
  const [pickedNative, setPickedNative] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]); // target sides already matched
  const [showWrong, setShowWrong] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const matchedNative = exercise.pairs.filter((p) => matched.includes(p.target)).map((p) => p.native);

  const tryPair = (target: string, native: string) => {
    const isPair = exercise.pairs.some((p) => p.target === target && p.native === native);
    if (isPair) {
      const nowMatched = [...matched, target];
      setMatched(nowMatched);
      setPickedTarget(null);
      setPickedNative(null);
      if (nowMatched.length === exercise.pairs.length) onResult({ correct: true, correctAnswer: '' });
    } else {
      // Show both in red for a moment, then let the user try again.
      setShowWrong(true);
      timer.current = setTimeout(() => {
        setShowWrong(false);
        setPickedTarget(null);
        setPickedNative(null);
      }, 800);
    }
  };

  const pickTarget = (target: string) => {
    if (showWrong || matched.includes(target)) return;
    speak(target);
    setPickedTarget(target);
    if (pickedNative) tryPair(target, pickedNative);
  };

  const pickNative = (native: string) => {
    if (showWrong || matchedNative.includes(native)) return;
    setPickedNative(native);
    if (pickedTarget) tryPair(pickedTarget, native);
  };

  const stateFor = (value: string, picked: string | null, done: string[]): OptionState => {
    if (done.includes(value)) return 'correct';
    if (value === picked) return showWrong ? 'wrong' : 'selected';
    return 'idle';
  };

  return (
    <ExerciseLayout exercise={exercise}>
      <View style={styles.columns}>
        <View style={styles.column}>
          {targets.map((target) => (
            <OptionButton
              key={target}
              label={target}
              emphasis
              state={stateFor(target, pickedTarget, matched)}
              onPress={() => pickTarget(target)}
            />
          ))}
        </View>
        <View style={styles.column}>
          {natives.map((native) => (
            <OptionButton
              key={native}
              label={native}
              state={stateFor(native, pickedNative, matchedNative)}
              onPress={() => pickNative(native)}
            />
          ))}
        </View>
      </View>
    </ExerciseLayout>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', gap: spacing.sm },
  column: { flex: 1, gap: spacing.sm },
});
