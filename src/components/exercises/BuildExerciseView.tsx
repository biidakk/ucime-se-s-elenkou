import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useT } from '@/i18n';
import { buildAnswers, checkTypedAnswer, tilesOf } from '@/lib/answers';
import type { BuildExercise } from '@/lib/content';
import { useAccent, useCourse } from '@/lib/course';
import { shuffle } from '@/lib/shuffle';
import { useSpeak } from '@/lib/speech';
import { colors, font, radius, spacing } from '@/lib/theme';
import { ExerciseLayout } from './ExerciseLayout';
import type { ExerciseResult } from './types';

type Props = {
  exercise: BuildExercise;
  onResult: (result: ExerciseResult) => void;
};

// Build a sentence: tap the word tiles in the right order. Tap a placed tile to take it back.
export function BuildExerciseView({ exercise, onResult }: Props) {
  const t = useT();
  const speak = useSpeak();
  const { target } = useCourse();
  const { accent } = useAccent();
  // Tiles are kept by position, because a word can appear twice in a sentence.
  const tiles = useMemo(() => shuffle([...tilesOf(exercise.answer), ...(exercise.extra ?? [])]), [exercise]);
  const [placed, setPlaced] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);

  const place = (index: number) => {
    if (!checked) setPlaced((p) => [...p, index]);
  };
  const takeBack = (index: number) => {
    if (!checked) setPlaced((p) => p.filter((i) => i !== index));
  };

  const check = () => {
    if (placed.length === 0 || checked) return;
    setChecked(true);
    const built = placed.map((i) => tiles[i]).join(' ');
    const outcome = checkTypedAnswer(built, buildAnswers(exercise.answer, exercise.accept, exercise.optional), target.code);
    speak(exercise.answer);
    onResult({ correct: outcome === 'correct', correctAnswer: exercise.answer });
  };

  return (
    <ExerciseLayout exercise={exercise} onCheck={check} canCheck={placed.length > 0} checked={checked}>
      <Text style={styles.question}>{exercise.question}</Text>
      <View style={styles.answerLine}>
        {placed.length === 0 && <Text style={styles.empty}>{t('exercise.buildEmpty')}</Text>}
        {placed.map((i) => (
          <Tile key={i} label={tiles[i]} color={accent} onPress={() => takeBack(i)} />
        ))}
      </View>
      <View style={styles.bank}>
        {tiles.map((label, i) =>
          placed.includes(i) ? (
            <View key={i} style={[styles.tile, styles.tileGhost]}>
              <Text style={[styles.tileLabel, styles.ghostLabel]}>{label}</Text>
            </View>
          ) : (
            <Tile key={i} label={label} color={accent} onPress={() => place(i)} />
          ),
        )}
      </View>
    </ExerciseLayout>
  );
}

function Tile({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <Text style={[styles.tileLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  question: { fontSize: font.title, fontWeight: '800', color: colors.text },
  answerLine: {
    minHeight: 76,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  empty: { fontSize: font.small, color: colors.textMuted, fontStyle: 'italic' },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tile: {
    minHeight: 54,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  tileGhost: { backgroundColor: colors.border, borderColor: colors.border },
  tileLabel: { fontSize: font.large, fontWeight: '700' },
  ghostLabel: { color: colors.border },
  pressed: { opacity: 0.7 },
});
