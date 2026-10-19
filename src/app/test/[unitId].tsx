import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { Celebration } from '@/components/Celebration';
import { LessonHeader } from '@/components/LessonHeader';
import { MissedWords } from '@/components/MissedWords';
import { Screen } from '@/components/Screen';
import { TestRunner } from '@/components/TestRunner';
import { useT } from '@/i18n';
import type { Word } from '@/lib/content';
import { useCourse } from '@/lib/course';
import { useInsets } from '@/lib/insets';
import { useProgress } from '@/lib/progress';
import { stopSpeech } from '@/lib/speech';
import { passesUnitTest, unitTest, unitTestPassMark } from '@/lib/tests';
import { colors, font, spacing } from '@/lib/theme';

type Phase = 'intro' | 'test' | 'result';

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// The test at the end of a unit: 15 questions over the whole unit, passed at 80%.
// Failing never locks anything; it only shows which words to practise.
export default function UnitTestScreen() {
  const t = useT();
  const insets = useInsets();
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const { course } = useCourse();
  const unit = course.units.find((u) => u.id === unitId);
  const { progress, saveTestResult } = useProgress();

  const [phase, setPhase] = useState<Phase>('intro');
  const [questions, setQuestions] = useState(() => (unit ? unitTest(course, unit) : []));
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<Word[]>([]);
  const [attempt, setAttempt] = useState(0); // a new attempt starts the test runner afresh

  // Stop any audio when leaving the test.
  useEffect(() => stopSpeech, []);

  if (!unit) {
    return (
      <Screen>
        <LessonHeader onClose={goBack} />
        <View style={styles.center}>
          <Text style={styles.text}>{t('common.notFound')}</Text>
        </View>
      </Screen>
    );
  }

  const total = questions.length;
  const passMark = unitTestPassMark(total);
  const record = progress.unitTests[unit.id];
  const passed = passesUnitTest(score, total);
  const bottom = { paddingBottom: spacing.md + insets.bottom };

  const handleFinish = (finalScore: number, missedWords: Word[]) => {
    setScore(finalScore);
    setMissed(missedWords);
    saveTestResult('unit', unit.id, finalScore, total, passesUnitTest(finalScore, total));
    setPhase('result');
  };

  const retry = () => {
    setQuestions(unitTest(course, unit));
    setAttempt((n) => n + 1);
    setPhase('test');
  };

  return (
    <Screen>
      {phase === 'intro' && (
        <>
          <LessonHeader onClose={goBack} title={t('course.unitTest')} />
          <ScrollView contentContainerStyle={styles.center}>
            <Text style={styles.emoji}>📝</Text>
            <Text style={styles.title}>{t('unitTest.title', { title: unit.title })}</Text>
            <Text style={styles.text}>{t('unitTest.info', { total, pass: passMark })}</Text>
            {record && (
              <Text style={styles.text}>
                {t('unitTest.best', { score: record.bestScore, total: record.total })}
                {record.passedAt ? ' ⭐' : ''}
              </Text>
            )}
          </ScrollView>
          <View style={[styles.footer, bottom]}>
            <BigButton label={t('unitTest.start')} icon="arrow-forward" onPress={() => setPhase('test')} />
          </View>
        </>
      )}

      {phase === 'test' && <TestRunner key={attempt} questions={questions} onFinish={handleFinish} onClose={goBack} />}

      {phase === 'result' && (
        <>
          <ScrollView contentContainerStyle={[styles.center, bottom]}>
            <Text style={styles.emoji}>{passed ? '⭐' : '💪'}</Text>
            <Text style={styles.title}>{passed ? t('unitTest.passed') : t('unitTest.failed')}</Text>
            <Text style={styles.text}>{t('unitTest.score', { score, total })}</Text>
            {!passed && <Text style={styles.text}>{t('unitTest.needed', { pass: passMark })}</Text>}
            <MissedWords words={missed} />
            <View style={styles.buttons}>
              {!passed && <BigButton label={t('unitTest.retry')} icon="refresh" onPress={retry} />}
              <BigButton label={t('lesson.backToCourse')} variant={passed ? 'primary' : 'secondary'} onPress={goBack} />
            </View>
          </ScrollView>
          {passed && <Celebration />}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, maxWidth: 720, width: '100%', alignSelf: 'center' },
  emoji: { fontSize: 72 },
  title: { fontSize: font.title, fontWeight: '800', color: colors.text, textAlign: 'center' },
  text: { fontSize: font.large, color: colors.textMuted, textAlign: 'center', lineHeight: 30 },
  buttons: { alignSelf: 'stretch', marginTop: spacing.md, gap: spacing.sm },
});
