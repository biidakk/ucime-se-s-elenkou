import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { CourseHeader } from '@/components/CourseHeader';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { WeekDots } from '@/components/WeekDots';
import { useT } from '@/i18n';
import { chatAvailable } from '@/lib/chat';
import { getWord } from '@/lib/content';
import { useAccent, useCourse } from '@/lib/course';
import { dayKey } from '@/lib/dates';
import { useProgress } from '@/lib/progress';
import { useSettings } from '@/lib/settings';
import { shareApp } from '@/lib/shareApp';
import { dueWordIds } from '@/lib/srs';
import { colors, font, radius, spacing } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

// The home screen, the first thing after the intro: one big "continue" button for the next
// lesson, the practice of this week, shortcuts to everything else, and a way to recommend the app.
export default function HomeScreen() {
  const t = useT();
  const { course } = useCourse();
  const { accent } = useAccent();
  const { progress, activity } = useProgress();
  const { settings } = useSettings();
  const [shareNote, setShareNote] = useState('');

  const isDone = (lessonId: string) => lessonId in progress.completedLessons;
  const nextLesson = course.lessons.find((l) => !isDone(l.id));
  const nextUnitIndex = nextLesson ? course.units.findIndex((u) => u.lessons.some((l) => l.id === nextLesson.id)) : -1;
  const nextUnit = course.units[nextUnitIndex];
  const started = course.lessons.some((l) => isDone(l.id));
  const doneCount = course.lessons.filter((l) => isDone(l.id)).length;

  const cards = Object.fromEntries(Object.entries(progress.cards).filter(([id]) => getWord(course, id)));
  const due = dueWordIds(cards).length;
  const practisedToday = activity.activeDays.includes(dayKey());

  // The conversation (a family feature) for the last finished unit.
  const finishedUnits = course.units.filter((u) => u.lessons.every((l) => isDone(l.id)));
  const chatUnit = chatAvailable() && settings.chatCode !== '' ? finishedUnits[finishedUnits.length - 1] : undefined;

  const share = async () => {
    const result = await shareApp(t('share.message'));
    setShareNote(result === 'copied' ? t('share.copied') : result === 'failed' ? t('share.failed') : '');
  };

  return (
    <Screen>
      <CourseHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.greeting}>
          <Text style={styles.hello} accessibilityRole="header">
            {t(greetingKey())}
          </Text>
          <Text style={styles.helloText}>{practisedToday ? t('progress.today') : t('progress.notToday')}</Text>
        </View>

        {nextLesson && nextUnit ? (
          <View style={[styles.continueCard, { backgroundColor: accent }]}>
            <Text style={styles.continueLabel}>{started ? t('home.continue') : t('home.start')}</Text>
            <Text style={styles.continueUnit}>
              {t('course.unit', { n: nextUnitIndex + 1 })} · {nextUnit.title}
            </Text>
            <Text style={styles.continueTitle}>{nextLesson.title}</Text>
            <Text style={styles.continueTitleTarget}>{nextLesson.titleTarget}</Text>
            <View style={styles.continueBar}>
              <ProgressBar
                value={nextUnit.lessons.filter((l) => isDone(l.id)).length / nextUnit.lessons.length}
                color="#fff"
                track="rgba(255,255,255,0.3)"
                height={10}
              />
            </View>
            <Pressable
              onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: nextLesson.id } })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
            >
              <Ionicons name="play" size={28} color={accent} />
              <Text style={[styles.continueButtonText, { color: accent }]}>
                {started ? t('home.continueButton') : t('home.startButton')}
              </Text>
            </Pressable>
          </View>
        ) : (
          course.lessons.length > 0 && (
            <View style={[styles.continueCard, { backgroundColor: colors.success }]}>
              <Text style={styles.continueTitle}>{t('home.allDone')}</Text>
              <Text style={styles.continueTitleTarget}>{t('home.allDoneText')}</Text>
            </View>
          )
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('home.week')}</Text>
          <WeekDots />
        </View>

        <View style={styles.tiles}>
          <Tile
            icon="repeat"
            title={t('tabs.review')}
            detail={due > 0 ? `${due} ${t('review.due', { count: due })}` : t('review.nothingDue')}
            badge={due > 0 ? due : undefined}
            href="/review"
          />
          <Tile
            icon="map"
            title={t('home.wholeCourse')}
            detail={t('home.lessonsDone', { done: doneCount, total: course.lessons.length })}
            href="/course"
          />
          <Tile icon="stats-chart" title={t('tabs.progress')} detail={t('home.progressDetail')} href="/progress" />
          {chatUnit && (
            <Tile
              icon="chatbubbles"
              title={t('chat.open')}
              detail={chatUnit.title}
              href={{ pathname: '/chat/[unitId]', params: { unitId: chatUnit.id } }}
            />
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.shareHead}>
            <Ionicons name="heart" size={30} color={colors.error} />
            <Text style={[styles.cardTitle, styles.shareTitle]}>{t('share.title')}</Text>
          </View>
          <Text style={styles.text}>{t('share.text')}</Text>
          <BigButton label={t('share.button')} icon="share-social" onPress={share} />
          {shareNote !== '' && (
            <Text style={styles.note} accessibilityLiveRegion="polite">
              {shareNote}
            </Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

// "Good morning" until 11, "Good evening" from 18.
function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 11) return 'home.morning' as const;
  if (hour < 18) return 'home.day' as const;
  return 'home.evening' as const;
}

// A big shortcut on the home screen.
function Tile({ icon, title, detail, badge, href }: { icon: IconName; title: string; detail: string; badge?: number; href: Href }) {
  const { accent, accentLight } = useAccent();
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={[styles.tileIcon, { backgroundColor: accentLight }]}>
        <Ionicons name={icon} size={32} color={accent} />
        {badge !== undefined && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileDetail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingTop: spacing.sm, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  greeting: { gap: spacing.xs },
  hello: { fontSize: font.title, fontWeight: '800', color: colors.text },
  helloText: { fontSize: font.body, color: colors.textMuted, lineHeight: 26 },
  continueCard: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  continueLabel: { fontSize: 15, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.9 },
  continueUnit: { fontSize: font.body, color: '#fff', fontWeight: '600', opacity: 0.9 },
  continueTitle: { fontSize: font.title, fontWeight: '800', color: '#fff', marginTop: spacing.xs },
  continueTitleTarget: { fontSize: font.large, color: '#fff', fontStyle: 'italic', opacity: 0.95 },
  continueBar: { flexDirection: 'row', marginTop: spacing.md },
  continueButton: {
    marginTop: spacing.md,
    minHeight: 64,
    borderRadius: radius.md,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  continueButtonText: { fontSize: font.large, fontWeight: '800' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: font.large, fontWeight: '800', color: colors.text },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexGrow: 1,
    flexBasis: '40%',
    minHeight: 150,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  tileTitle: { fontSize: font.large, fontWeight: '800', color: colors.text },
  tileDetail: { fontSize: font.small, color: colors.textMuted, fontWeight: '600', lineHeight: 21 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 6,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  shareHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  shareTitle: { flex: 1 },
  text: { fontSize: font.body, color: colors.text, lineHeight: 27 },
  note: { fontSize: font.body, color: colors.success, fontWeight: '700', textAlign: 'center' },
  pressed: { opacity: 0.8 },
});
