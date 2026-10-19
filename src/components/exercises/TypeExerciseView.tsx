import { ComponentRef, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useT } from '@/i18n';
import { checkTypedAnswer } from '@/lib/answers';
import type { TypeExercise } from '@/lib/content';
import { useAccent, useCourse } from '@/lib/course';
import { useSpeak } from '@/lib/speech';
import { colors, font, radius, spacing, tapTarget } from '@/lib/theme';
import { ExerciseLayout } from './ExerciseLayout';
import type { ExerciseResult } from './types';

type Props = {
  exercise: TypeExercise;
  onResult: (result: ExerciseResult) => void;
};

// Type the answer: see the meaning, write it in the language being learned.
// Buttons under the text box add letters the keyboard may not have (ä, ș, ă …).
export function TypeExerciseView({ exercise, onResult }: Props) {
  const t = useT();
  const speak = useSpeak();
  const { target } = useCourse();
  const { accent, accentLight } = useAccent();
  const [text, setText] = useState('');
  const [checked, setChecked] = useState(false);
  const selection = useRef({ start: 0, end: 0 });
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  const check = () => {
    if (!text.trim() || checked) return;
    Keyboard.dismiss();
    setChecked(true);
    const outcome = checkTypedAnswer(text, [exercise.answer, ...(exercise.accept ?? [])], target.code);
    speak(exercise.answer);
    onResult({
      correct: outcome !== 'wrong',
      correctAnswer: exercise.answer,
      note: outcome === 'accents' ? t('feedback.accents', { answer: exercise.answer }) : undefined,
    });
  };

  // Put a special letter where the cursor is.
  const addLetter = (letter: string) => {
    const { start, end } = selection.current;
    const at = Math.min(start, text.length);
    const next = text.slice(0, at) + letter + text.slice(Math.min(end, text.length));
    setText(next);
    selection.current = { start: at + letter.length, end: at + letter.length };
    input.current?.focus();
  };

  return (
    <ExerciseLayout exercise={exercise} onCheck={check} canCheck={!!text.trim()} checked={checked}>
      <Text style={styles.question}>{exercise.question}</Text>
      <TextInput
        ref={input}
        value={text}
        onChangeText={setText}
        onSelectionChange={(e) => {
          selection.current = e.nativeEvent.selection;
        }}
        editable={!checked}
        placeholder={t('exercise.typePlaceholder')}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        returnKeyType="done"
        onSubmitEditing={check}
        style={[styles.input, { color: accent }]}
        accessibilityLabel={t('exercise.typePlaceholder')}
      />
      {!checked && target.specialLetters.length > 0 && (
        <View style={styles.lettersBox}>
          <Text style={styles.hint}>{t('exercise.specialLetters')}</Text>
          <View style={styles.letters}>
            {target.specialLetters.map((letter) => (
              <Pressable
                key={letter}
                onPress={() => addLetter(letter)}
                accessibilityRole="button"
                accessibilityLabel={letter}
                style={({ pressed }) => [styles.letter, { backgroundColor: accentLight }, pressed && styles.pressed]}
              >
                <Text style={[styles.letterText, { color: accent }]}>{letter}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </ExerciseLayout>
  );
}

const styles = StyleSheet.create({
  question: { fontSize: font.huge, fontWeight: '800', color: colors.text },
  input: {
    minHeight: tapTarget + 4,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    fontSize: font.large + 2,
    fontWeight: '600',
  },
  lettersBox: { gap: spacing.sm },
  hint: { fontSize: font.small, color: colors.textMuted },
  letters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  letter: { minWidth: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  letterText: { fontSize: font.large + 2, fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
