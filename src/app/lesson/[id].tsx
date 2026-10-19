import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { Celebration } from '@/components/Celebration';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ExerciseView } from '@/components/exercises/ExerciseView';
import type { ExerciseResult } from '@/components/exercises/types';
import { FeedbackBar } from '@/components/FeedbackBar';
import { LessonHeader } from '@/components/LessonHeader';
import { MissedWords } from '@/components/MissedWords';
import { Screen } from '@/components/Screen';
import { TestRunner } from '@/components/TestRunner';
import { TipCard } from '@/components/TipCard';
import { useT } from '@/i18n';
import { Exercise, getLesson, getNextLesson, getUnitOfLesson, Word } from '@/lib/content';
import { useCourse } from '@/lib/course';
import { useInsets } from '@/lib/insets';
import { useMicExercises } from '@/lib/mic';
import { useProgress } from '@/lib/progress';
import { stopSpeech } from '@/lib/speech';
import { lessonQuiz } from '@/lib/tests';
import { colors, font, spacing } from '@/lib/theme';

type Phase = 'tip' | 'exercises' | 'quizIntro' | 'quiz' | 'done';

// Leave the lesson: back to the course map (also when the page was opened directly).
function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// One lesson: tip card, then the exercises, then a short quiz, then a summary.
// A wrong exercise comes back at the end; nothing is ever locked.
export default function LessonScreen() {
  const t = useT();
  const insets = useInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { course } = useCourse();
  const lesson = getLesson(course, id);
  const mic = useMicExercises();

  const [phase, setPhase] = useState<Phase>('tip');
  // Speaking exercises are left out when the phone can't listen (or they're switched off).
  const [queue, setQueue] = useState<Exercise[]>(() =>
    (lesson?.exercises ?? []).filter((e) => e.type !== 'speak' || mic.enabled),
  );
  const [initialCount] = useState(queue.length);
  const [position, setPosition] = useState(0);
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [wrongIds, setWrongIds] = useState<Set<string>>(new Set());
  const [quiz] = useState(() => (lesson ? lessonQuiz(course, lesson) : []));
  const [quizScore, setQuizScore] = useState(0);
  const [quizMissed, setQuizMissed] = useState<Word[]>([]);
  const [confirmClose, setConfirmClose] = useState(false);
  const { completeLesson, saveTestResult } = useProgress();

  // Stop any audio when leaving the lesson.
  useEffect(() => stopSpeech, []);

  if (!lesson) {
    return (
      <Screen>
        <LessonHeader onClose={goBack} />
        <View style={styles.center}>
          <Text style={styles.doneText}>{t('common.notFound')}</Text>
        </View>
      </Screen>
    );
  }

  const current = queue[position];
  const nextLesson = getNextLesson(course, lesson.id);
  // After the last lesson of a unit, the next step is the unit test.
  const unit = getUnitOfLesson(course, lesson.id);
  const isLastOfUnit = unit?.lessons[unit.lessons.length - 1]?.id === lesson.id;
  const firstTry = initialCount - wrongIds.size;
  // Leaving after the exercises keeps the lesson as finished, so no question is needed then.
  const close = () => (phase === 'tip' || phase === 'exercises' ? setConfirmClose(true) : goBack());

  const handleResult = (r: ExerciseResult) => {
    setResult(r);
    if (!r.correct) {
      // A wrong answer: remember it, and ask the same exercise again at the end.
      setWrongIds((ids) => new Set(ids).add(current.id));
      setQueue((q) => [...q, current]);
    }
  };

  const handleContinue = () => {
    setResult(null);
    if (position + 1 >= queue.length) {
      // The lesson counts as finished now, even if the quiz is left halfway.
      completeLesson(lesson.id, firstTry, initialCount);
      setPhase('quizIntro');
    } else {
      setPosition((p) => p + 1);
    }
  };

  const handleQuizFinish = (score: number, missed: Word[]) => {
    setQuizScore(score);
    setQuizMissed(missed);
    saveTestResult('lesson', lesson.id, score, quiz.length, true);
    setPhase('done');
  };

  const progress = queue.length === 0 ? 0 : (position + (result ? 1 : 0)) / queue.length;
  const bottom = { paddingBottom: spacing.md + insets.bottom };

  return (
    <Screen>
      {phase === 'tip' && (
        <>
          <LessonHeader onClose={close} title={lesson.title} />
          <ScrollView contentContainerStyle={styles.padded}>
            <TipCard tip={lesson.tip} />
          </ScrollView>
          <View style={[styles.footer, bottom]}>
            <BigButton label={t('lesson.start')} icon="arrow-forward" onPress={() => setPhase('exercises')} />
          </View>
        </>
      )}

      {phase === 'exercises' && current && (
        <>
          <LessonHeader onClose={close} progress={progress} />
          {/* Scrolls on small phones. "handled" lets buttons work on the first tap while the keyboard is open. */}
          <ScrollView
            style={styles.exerciseScroll}
            contentContainerStyle={[styles.exerciseScrollContent, bottom]}
            keyboardShouldPersistTaps="handled"
          >
            <ExerciseView key={position} exercise={current} onResult={handleResult} />
          </ScrollView>
          {result && <FeedbackBar result={result} onContinue={handleContinue} retryLater />}
        </>
      )}

      {(phase === 'quizIntro' || (phase === 'exercises' && !current)) && (
        <>
          <LessonHeader onClose={close} title={lesson.title} />
          <ScrollView contentContainerStyle={styles.center}>
            <Text style={styles.doneEmoji}>✅</Text>
            <Text style={styles.doneTitle}>{t('lesson.exercisesDone')}</Text>
            <Text style={styles.doneText}>{t('lesson.firstTry', { score: firstTry, total: initialCount })}</Text>
            <Text style={styles.doneText}>{t('lesson.quizIntro', { count: quiz.length })}</Text>
          </ScrollView>
          <View style={[styles.footer, bottom]}>
            <BigButton label={t('lesson.startQuiz')} icon="arrow-forward" onPress={() => setPhase('quiz')} />
          </View>
        </>
      )}

      {phase === 'quiz' && <TestRunner questions={quiz} onFinish={handleQuizFinish} onClose={close} />}

      {phase === 'done' && (
        <>
          <ScrollView contentContainerStyle={[styles.center, bottom]}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneTitle}>{t('lesson.doneTitle')}</Text>
            <Text style={styles.doneText}>{t('lesson.doneExercises', { score: firstTry, total: initialCount })}</Text>
            <Text style={styles.doneText}>{t('lesson.doneQuiz', { score: quizScore, total: quiz.length })}</Text>
            <MissedWords words={quizMissed} />
            <View style={styles.doneButtons}>
              {isLastOfUnit && unit ? (
                <BigButton
                  label={t('lesson.toUnitTest')}
                  icon="school"
                  onPress={() => router.replace({ pathname: '/test/[unitId]', params: { unitId: unit.id } })}
                />
              ) : (
                nextLesson && (
                  <BigButton
                    label={t('lesson.next')}
                    icon="arrow-forward"
                    onPress={() => router.replace({ pathname: '/lesson/[id]', params: { id: nextLesson.id } })}
                  />
                )
              )}
              <BigButton
                label={t('lesson.backToCourse')}
                variant={nextLesson || isLastOfUnit ? 'secondary' : 'primary'}
                onPress={goBack}
              />
            </View>
          </ScrollView>
          <Celebration />
        </>
      )}

      <ConfirmDialog
        visible={confirmClose}
        title={t('lesson.closeTitle')}
        text={t('lesson.closeText')}
        cancelLabel={t('lesson.closeStay')}
        confirmLabel={t('lesson.closeLeave')}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          goBack();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  padded: { padding: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, maxWidth: 720, width: '100%', alignSelf: 'center' },
  exerciseScroll: { flex: 1 },
  exerciseScrollContent: { flexGrow: 1, padding: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  doneEmoji: { fontSize: 72 },
  doneTitle: { fontSize: font.title, fontWeight: '800', color: colors.text, textAlign: 'center' },
  doneText: { fontSize: font.large, color: colors.textMuted, textAlign: 'center', lineHeight: 30 },
  doneButtons: { alignSelf: 'stretch', marginTop: spacing.md, gap: spacing.sm },
});
