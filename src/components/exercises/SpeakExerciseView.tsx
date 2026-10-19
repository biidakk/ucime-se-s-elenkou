import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { SpeakButton } from '@/components/SpeakButton';
import { useT } from '@/i18n';
import { spokenMatch } from '@/lib/answers';
import type { SpeakExercise } from '@/lib/content';
import { useAccent, useCourse } from '@/lib/course';
import { listenOnce } from '@/lib/recognition';
import { useSettings } from '@/lib/settings';
import { stopSpeech } from '@/lib/speech';
import { colors, font, radius, spacing } from '@/lib/theme';
import { ExerciseLayout } from './ExerciseLayout';
import type { ExerciseResult } from './types';

type Props = {
  exercise: SpeakExercise;
  onResult: (result: ExerciseResult) => void;
};

const GOOD_ENOUGH = 0.8; // share of the words the phone must hear
const MAX_TRIES = 3;

type Status = 'idle' | 'listening' | 'unavailable';

// Say it: read the sentence out loud and the phone checks what it heard.
// Recognition is not perfect, so there are 3 tries, and skipping is always possible
// (no microphone, a noisy room, or the phone can't do it). It never blocks the lesson.
export function SpeakExerciseView({ exercise, onResult }: Props) {
  const t = useT();
  const { target } = useCourse();
  const { accent } = useAccent();
  const { update } = useSettings();
  const [status, setStatus] = useState<Status>('idle');
  const [heard, setHeard] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [done, setDone] = useState(false);
  const stop = useRef<(() => void) | null>(null);
  const triesRef = useRef(0);

  // Stop listening when the exercise goes away.
  useEffect(() => () => stop.current?.(), []);

  const finish = (result: ExerciseResult) => {
    stop.current?.();
    setDone(true);
    onResult(result);
  };

  const listen = () => {
    stopSpeech();
    setHeard(null);
    setStatus('listening');
    stop.current = listenOnce(target.speech, {
      onResult: (transcripts) => {
        const best = Math.max(0, ...transcripts.map((x) => spokenMatch(x, exercise.text, target.code)));
        setHeard(transcripts[0] ?? '');
        const tryCount = triesRef.current + 1;
        triesRef.current = tryCount;
        setTries(tryCount);
        if (best >= GOOD_ENOUGH) finish({ correct: true, correctAnswer: exercise.text });
        else if (tryCount >= MAX_TRIES) finish({ correct: true, correctAnswer: exercise.text, note: t('speak.tryLater') });
      },
      onError: (error) => {
        if (error === 'not-allowed' || error === 'unavailable') {
          // The phone can't listen: switch these exercises off, and let her go on.
          setStatus('unavailable');
          update({ micEnabled: false });
        }
      },
      onEnd: () => setStatus((s) => (s === 'listening' ? 'idle' : s)),
    });
  };

  const skip = () => finish({ correct: true, correctAnswer: exercise.text, note: t('speak.skipped') });

  const listening = status === 'listening';
  const triesLeft = MAX_TRIES - tries;

  return (
    <ExerciseLayout
      exercise={exercise}
      footer={!done && <BigButton label={t('speak.skip')} variant="secondary" onPress={skip} />}
    >
      <View style={styles.textRow}>
        <Text style={[styles.text, { color: accent }]}>{exercise.text}</Text>
        <SpeakButton text={exercise.text} />
      </View>
      <Text style={styles.native}>{exercise.native}</Text>

      {status === 'unavailable' ? (
        <Text style={styles.notice}>{t('speak.unavailable')}</Text>
      ) : (
        <View style={styles.micArea}>
          <Pressable
            onPress={listening ? () => stop.current?.() : listen}
            disabled={done}
            accessibilityRole="button"
            accessibilityLabel={listening ? t('speak.stop') : t('speak.tap')}
            style={({ pressed }) => [
              styles.mic,
              { backgroundColor: listening ? colors.error : accent },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name={listening ? 'stop' : 'mic'} size={48} color="#fff" />
          </Pressable>
          <Text style={styles.micLabel}>{listening ? t('speak.listening') : t('speak.tap')}</Text>
        </View>
      )}

      {heard !== null && !done && status !== 'unavailable' && (
        <Text style={styles.heard}>
          {heard ? t('speak.heard', { heard }) : t('speak.notUnderstood')} {t('speak.triesLeft', { count: triesLeft })}
        </Text>
      )}
    </ExerciseLayout>
  );
}

const styles = StyleSheet.create({
  textRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flexShrink: 1, fontSize: font.huge, fontWeight: '800' },
  native: { fontSize: font.large, color: colors.textMuted, fontStyle: 'italic' },
  micArea: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  mic: { width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.8 },
  micLabel: { fontSize: font.body, color: colors.textMuted, fontWeight: '700', textAlign: 'center' },
  heard: { fontSize: font.body, color: colors.text, textAlign: 'center', lineHeight: 27 },
  notice: {
    fontSize: font.body,
    color: colors.text,
    backgroundColor: colors.tipBackground,
    borderRadius: radius.md,
    padding: spacing.md,
    lineHeight: 27,
  },
});
