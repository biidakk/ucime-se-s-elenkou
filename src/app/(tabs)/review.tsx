import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { Celebration } from '@/components/Celebration';
import { LessonHeader } from '@/components/LessonHeader';
import { Screen } from '@/components/Screen';
import { SpeakButton } from '@/components/SpeakButton';
import { useT } from '@/i18n';
import { getWord } from '@/lib/content';
import { useAccent, useCourse } from '@/lib/course';
import { useInsets } from '@/lib/insets';
import { useProgress } from '@/lib/progress';
import { useSpeak } from '@/lib/speech';
import { dueWordIds, MAX_BOX } from '@/lib/srs';
import { colors, font, radius, spacing } from '@/lib/theme';

const SESSION_SIZE = 20; // at most this many cards per session, so a break never piles up

type Session = {
  queue: string[]; // word ids still to show (unknown ones are added again at the end)
  position: number;
  graded: string[]; // word ids already graded in this session (graded only once)
  known: number;
  unknown: number;
};

// Review: flashcards with spaced repetition (Leitner boxes).
export default function ReviewScreen() {
  const t = useT();
  const { accent } = useAccent();
  const { course } = useCourse();
  const { progress, reviewWord, recordActivity } = useProgress();
  const [session, setSession] = useState<Session | null>(null);
  const [finished, setFinished] = useState<{ known: number; unknown: number } | null>(null);

  // Only words that still exist in the course (content may change).
  const cards = Object.fromEntries(Object.entries(progress.cards).filter(([id]) => getWord(course, id)));
  const due = dueWordIds(cards);
  const totalCards = Object.keys(cards).length;

  const start = () => {
    setFinished(null);
    setSession({ queue: due.slice(0, SESSION_SIZE), position: 0, graded: [], known: 0, unknown: 0 });
  };

  const answer = (knewIt: boolean) => {
    if (!session) return;
    const wordId = session.queue[session.position];
    const firstTime = !session.graded.includes(wordId);
    if (firstTime) reviewWord(wordId, knewIt);

    const next: Session = {
      queue: knewIt ? session.queue : [...session.queue, wordId],
      position: session.position + 1,
      graded: firstTime ? [...session.graded, wordId] : session.graded,
      known: session.known + (firstTime && knewIt ? 1 : 0),
      unknown: session.unknown + (firstTime && !knewIt ? 1 : 0),
    };

    if (next.position >= next.queue.length) {
      recordActivity();
      setFinished({ known: next.known, unknown: next.unknown });
      setSession(null);
    } else {
      setSession(next);
    }
  };

  if (session) {
    return (
      <Screen>
        <LessonHeader
          onClose={() => setSession(null)}
          progress={session.position / session.queue.length}
          counter={t('review.counter', { n: session.position + 1, total: session.queue.length })}
        />
        <Flashcard key={session.position} wordId={session.queue[session.position]} onAnswer={answer} />
      </Screen>
    );
  }

  // Count how many cards are in each box (1 to 5).
  const boxes = Array.from({ length: MAX_BOX }, (_, i) => Object.values(cards).filter((c) => c.box === i + 1).length);

  return (
    <Screen title={t('review.title')}>
      <ScrollView contentContainerStyle={styles.content}>
        {finished && (
          <View style={[styles.card, styles.centered]}>
            <Text style={styles.emoji}>🎉</Text>
            <Text style={styles.title}>{t('review.finished')}</Text>
            <Text style={styles.body}>{t('review.finishedText', finished)}</Text>
          </View>
        )}

        {totalCards === 0 ? (
          <View style={[styles.card, styles.centered]}>
            <Text style={styles.emoji}>📚</Text>
            <Text style={styles.title}>{t('review.noCards')}</Text>
            <Text style={styles.body}>{t('review.noCardsText')}</Text>
          </View>
        ) : due.length === 0 ? (
          !finished && (
            <View style={[styles.card, styles.centered]}>
              <Text style={styles.emoji}>✅</Text>
              <Text style={styles.title}>{t('review.nothingDue')}</Text>
              <Text style={styles.body}>{t('review.nothingDueText')}</Text>
            </View>
          )
        ) : (
          <View style={[styles.card, styles.centered]}>
            <Text style={[styles.bigNumber, { color: accent }]}>{due.length}</Text>
            <Text style={styles.title}>{t('review.due', { count: due.length })}</Text>
            <View style={styles.stretch}>
              <BigButton label={t('review.start')} icon="play" onPress={start} />
            </View>
          </View>
        )}

        {totalCards > 0 && (
          <View style={styles.card}>
            <Text style={styles.subtitle}>{t('review.boxes')}</Text>
            <Text style={styles.bodyLeft}>{t('review.boxesText')}</Text>
            <View style={styles.boxes}>
              {boxes.map((count, i) => (
                <View key={i} style={styles.box}>
                  <Text style={styles.boxCount}>{count}</Text>
                  <Text style={styles.boxLabel}>{t('review.box', { n: i + 1 })}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      {finished && <Celebration />}
    </Screen>
  );
}

type FlashcardProps = {
  wordId: string;
  onAnswer: (knewIt: boolean) => void;
};

// One flashcard: the word in the language being learned first (read aloud);
// tap to see the meaning, then say whether you knew it.
function Flashcard({ wordId, onAnswer }: FlashcardProps) {
  const t = useT();
  const insets = useInsets();
  const speak = useSpeak();
  const { course } = useCourse();
  const { accent } = useAccent();
  const word = getWord(course, wordId);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (word) speak(word.target);
    // Only when a new card appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordId]);

  const footer = { paddingBottom: spacing.md + insets.bottom };

  if (!word) {
    return (
      <View style={[styles.session, footer]}>
        <BigButton label={t('review.next')} onPress={() => onAnswer(true)} />
      </View>
    );
  }

  return (
    <View style={[styles.session, footer]}>
      <View style={[styles.card, styles.flashcard]}>
        <Text style={[styles.target, { color: accent }]}>{word.target}</Text>
        <View style={styles.speakRow}>
          <SpeakButton text={word.target} />
          <SpeakButton text={word.target} slow />
        </View>
        {revealed && (
          <View style={styles.answer}>
            <Text style={styles.native}>{word.native}</Text>
            {word.note && <Text style={styles.note}>{word.note}</Text>}
          </View>
        )}
      </View>
      {revealed ? (
        <View style={styles.gradeButtons}>
          <BigButton label={t('review.know')} variant="success" icon="checkmark" onPress={() => onAnswer(true)} />
          <BigButton label={t('review.dontKnow')} variant="secondary" icon="refresh" onPress={() => onAnswer(false)} />
        </View>
      ) : (
        <BigButton label={t('review.show')} icon="eye" onPress={() => setRevealed(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  session: { flex: 1, padding: spacing.md, gap: spacing.md, justifyContent: 'space-between', maxWidth: 720, width: '100%', alignSelf: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  centered: { alignItems: 'center' },
  stretch: { alignSelf: 'stretch', marginTop: spacing.sm },
  emoji: { fontSize: 52 },
  title: { fontSize: font.large, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: font.large, fontWeight: '800', color: colors.text },
  body: { fontSize: font.body, color: colors.textMuted, textAlign: 'center', lineHeight: 27 },
  bodyLeft: { fontSize: font.body, color: colors.textMuted, lineHeight: 27 },
  bigNumber: { fontSize: 64, fontWeight: '800' },
  boxes: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  box: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.background },
  boxCount: { fontSize: font.large, fontWeight: '800', color: colors.text },
  boxLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600', textAlign: 'center' },
  flashcard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  target: { fontSize: 40, fontWeight: '800', textAlign: 'center' },
  speakRow: { flexDirection: 'row', gap: spacing.lg },
  answer: { alignItems: 'center', gap: spacing.sm },
  native: { fontSize: font.title + 2, fontWeight: '700', color: colors.text, textAlign: 'center' },
  note: { fontSize: font.body, color: colors.textMuted, textAlign: 'center', lineHeight: 27 },
  gradeButtons: { gap: spacing.sm },
});
