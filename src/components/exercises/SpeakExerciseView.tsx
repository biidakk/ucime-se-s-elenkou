import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { SpeakButton } from '@/components/SpeakButton';
import { useT } from '@/i18n';
import { heardWords, spokenMatch, type HeardWord } from '@/lib/answers';
import type { SpeakExercise } from '@/lib/content';
import { useAccent, useCourse } from '@/lib/course';
import { listenOnce } from '@/lib/recognition';
import { useSettings } from '@/lib/settings';
import { stopSpeech, useSpeak } from '@/lib/speech';
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
// While listening, a ring around the microphone grows with the voice and the words heard so far
// appear; afterwards the sentence shows which words the phone heard (green) and which not (red,
// tap to listen).
export function SpeakExerciseView({ exercise, onResult }: Props) {
  const t = useT();
  const { target } = useCourse();
  const { accent } = useAccent();
  const { update } = useSettings();
  const [status, setStatus] = useState<Status>('idle');
  const [heard, setHeard] = useState<string | null>(null);
  const [words, setWords] = useState<HeardWord[] | null>(null);
  const [partial, setPartial] = useState('');
  const [hearing, setHearing] = useState(false); // the microphone picks up a voice
  const [level] = useState(() => new Animated.Value(0));
  const speak = useSpeak();
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
    setWords(null);
    setPartial('');
    setHearing(false);
    setStatus('listening');
    stop.current = listenOnce(target.speech, {
      onPartial: setPartial,
      onVolume: (value) => {
        if (value > 0.15) setHearing(true);
        Animated.timing(level, { toValue: value, duration: 100, useNativeDriver: true }).start();
      },
      onResult: (transcripts) => {
        const scores = transcripts.map((x) => spokenMatch(x, exercise.text, target.code));
        const best = Math.max(0, ...scores);
        const bestTranscript = transcripts[scores.indexOf(best)] ?? transcripts[0] ?? '';
        setHeard(bestTranscript);
        setWords(bestTranscript ? heardWords(bestTranscript, exercise.text, target.code) : null);
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
      onEnd: () => {
        level.setValue(0);
        setStatus((s) => (s === 'listening' ? 'idle' : s));
      },
    });
  };

  const skip = () => finish({ correct: true, correctAnswer: exercise.text, note: t('speak.skipped') });

  const listening = status === 'listening';
  const triesLeft = MAX_TRIES - tries;
  const ringScale = level.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] });
  const missed = words?.some((w) => !w.heard) ?? false;

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
          <View style={styles.micWrap}>
            {listening && (
              <Animated.View style={[styles.ring, { transform: [{ scale: ringScale }] }]} />
            )}
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
          </View>
          <Text style={styles.micLabel}>
            {listening ? (hearing ? t('speak.hearing') : t('speak.listening')) : t('speak.tap')}
          </Text>
          {listening && partial !== '' && <Text style={styles.partial}>„{partial}…“</Text>}
        </View>
      )}

      {heard !== null && !listening && status !== 'unavailable' && (
        <View style={styles.result}>
          <Text style={styles.heard}>{heard ? t('speak.heard', { heard }) : t('speak.notUnderstood')}</Text>
          {words && (
            <View style={styles.words}>
              {words.map((w, i) => (
                <Pressable
                  key={i}
                  onPress={() => speak(w.word)}
                  accessibilityRole="button"
                  accessibilityLabel={`${w.word}: ${w.heard ? t('speak.wordHeard') : t('speak.wordMissed')}`}
                  style={[styles.word, w.heard ? styles.wordHeard : styles.wordMissed]}
                >
                  <Text style={[styles.wordText, { color: w.heard ? colors.success : colors.error }]}>{w.word}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {missed && <Text style={styles.hint}>{t('speak.missedHint')}</Text>}
          {!done && <Text style={styles.heard}>{t('speak.triesLeft', { count: triesLeft })}</Text>}
        </View>
      )}
    </ExerciseLayout>
  );
}

const styles = StyleSheet.create({
  textRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flexShrink: 1, fontSize: font.huge, fontWeight: '800' },
  native: { fontSize: font.large, color: colors.textMuted, fontStyle: 'italic' },
  micArea: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  micWrap: { width: 108, height: 108, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 108, height: 108, borderRadius: 54, backgroundColor: colors.error, opacity: 0.25 },
  mic: { width: 108, height: 108, borderRadius: 54, alignItems: 'center', justifyContent: 'center' },
  partial: { fontSize: font.large, color: colors.text, textAlign: 'center', fontStyle: 'italic' },
  result: { gap: spacing.sm, alignItems: 'center' },
  words: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  word: { borderRadius: radius.md, borderWidth: 2, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  wordHeard: { backgroundColor: colors.successLight, borderColor: colors.successBorder },
  wordMissed: { backgroundColor: colors.errorLight, borderColor: colors.errorBorder },
  wordText: { fontSize: font.large, fontWeight: '700' },
  hint: { fontSize: font.small, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
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
