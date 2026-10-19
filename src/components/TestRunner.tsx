import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ExerciseView } from '@/components/exercises/ExerciseView';
import type { ExerciseResult } from '@/components/exercises/types';
import { FeedbackBar } from '@/components/FeedbackBar';
import { LessonHeader } from '@/components/LessonHeader';
import type { Word } from '@/lib/content';
import { useInsets } from '@/lib/insets';
import { useProgress } from '@/lib/progress';
import type { TestQuestion } from '@/lib/tests';
import { spacing } from '@/lib/theme';

type Props = {
  questions: TestQuestion[];
  onFinish: (score: number, missedWords: Word[]) => void;
  onClose: () => void;
};

// Runs a test: one try per question, no second chances (unlike the lesson exercises).
// A missed word goes back to box 1 of the flashcards, so it comes up in review soon.
export function TestRunner({ questions, onFinish, onClose }: Props) {
  const [position, setPosition] = useState(0);
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [missed, setMissed] = useState<Word[]>([]);
  const { reviewWord } = useProgress();
  const insets = useInsets();

  const current = questions[position];

  const handleResult = (r: ExerciseResult) => {
    setResult(r);
    if (!r.correct) {
      setMissed((m) => [...m, current.word]);
      reviewWord(current.word.id, false);
    }
  };

  const handleContinue = () => {
    setResult(null);
    if (position + 1 >= questions.length) {
      onFinish(questions.length - missed.length, missed);
    } else {
      setPosition((p) => p + 1);
    }
  };

  if (!current) return null;
  const progress = (position + (result ? 1 : 0)) / questions.length;

  return (
    <View style={styles.area}>
      <LessonHeader onClose={onClose} progress={progress} counter={`${position + 1}/${questions.length}`} />
      {/* Scrolls on small phones. "handled" lets buttons work on the first tap while the keyboard is open. */}
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.md + insets.bottom }]} keyboardShouldPersistTaps="handled">
        <ExerciseView key={position} exercise={current.exercise} onResult={handleResult} />
      </ScrollView>
      {result && <FeedbackBar result={result} onContinue={handleContinue} />}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: spacing.md },
});
