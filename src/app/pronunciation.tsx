import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { LessonHeader } from '@/components/LessonHeader';
import { Screen } from '@/components/Screen';
import { TextKey, useT } from '@/i18n';
import { canCopyText, copyText } from '@/lib/backupFile';
import { spokenTexts } from '@/lib/content';
import { useAccent, useCourse } from '@/lib/course';
import { useInsets } from '@/lib/insets';
import { forVoice, spellingsToTry } from '@/lib/pronunciation';
import { useSettings } from '@/lib/settings';
import { findVoice, speak } from '@/lib/speech';
import { loadValue, saveValue } from '@/lib/storage';
import { colors, font, radius, spacing, tapTarget } from '@/lib/theme';

// For a native speaker: listen to every sentence of the course, mark the ones the voice reads
// wrongly, and send the list. A box to try other spellings helps to find a fix
// (fixes go into content/pronunciation/<language>.json).
export default function PronunciationScreen() {
  const t = useT();
  const insets = useInsets();
  const { course, target, info } = useCourse();
  const { accent, accentLight } = useAccent();
  const { settings } = useSettings();
  const chosen = settings.voices[target.code];
  const [voiceName, setVoiceName] = useState('');
  const [marked, setMarked] = useState<string[]>([]);
  const [trial, setTrial] = useState('');
  const [copied, setCopied] = useState(false);
  const storageKey = `pronunciationReport:${info.id}`;

  useEffect(() => {
    findVoice(target.speech, chosen).then((v) => setVoiceName(v?.name ?? ''));
    loadValue<string[]>(storageKey, []).then(setMarked);
  }, [target.speech, chosen, storageKey]);

  const sections = useMemo(
    () =>
      course.units.flatMap((unit, u) =>
        unit.lessons.map((lesson, l) => ({
          title: t('pron.lesson', { unit: u + 1, lesson: l + 1, title: lesson.title }),
          data: spokenTexts(lesson),
        })),
      ),
    // The course content doesn't change while the screen is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [course],
  );

  const play = (text: string, raw = false) => speak(text, target.speech, settings.speechRate, false, chosen, raw);
  const toggle = (text: string) => {
    const next = marked.includes(text) ? marked.filter((m) => m !== text) : [...marked, text];
    setMarked(next);
    setCopied(false);
    saveValue(storageKey, next);
  };
  const report = [
    t('pron.reportHeader', { language: t(`lang.${target.code}.name` as TextKey), voice: voiceName || '?' }),
    ...marked.map((m) => `- ${m}`),
  ].join('\n');

  const header = (
    <View style={styles.headerBlock}>
      <Text style={styles.text}>{t('pron.intro')}</Text>
      {voiceName !== '' && <Text style={styles.small}>{t('settings.voice', { name: voiceName })}</Text>}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('pron.tryTitle')}</Text>
        <Text style={styles.small}>{t('pron.tryHint')}</Text>
        <View style={styles.tryRow}>
          <TextInput
            value={trial}
            onChangeText={setTrial}
            placeholder={t('pron.tryPlaceholder')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, { color: accent }]}
            accessibilityLabel={t('pron.tryPlaceholder')}
          />
          <Pressable
            onPress={() => play(trial, true)}
            accessibilityRole="button"
            accessibilityLabel={t('pron.tryPlay')}
            style={({ pressed }) => [styles.playBig, { backgroundColor: accent }, pressed && styles.pressed]}
          >
            <Ionicons name="volume-high" size={28} color="#fff" />
          </Pressable>
        </View>
        {spellingsToTry(target.code).length > 0 && (
          <>
            <Text style={styles.small}>{t('pron.suggestions')}</Text>
            <View style={styles.chips}>
              {spellingsToTry(target.code).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    setTrial(s);
                    play(s, true);
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.chip, { backgroundColor: accentLight }, pressed && styles.pressed]}
                >
                  <Ionicons name="volume-medium" size={18} color={accent} />
                  <Text style={[styles.chipText, { color: accent }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      {marked.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('pron.marked', { count: marked.length })}</Text>
          <Text selectable style={styles.report}>
            {report}
          </Text>
          {canCopyText() && (
            <BigButton
              label={copied ? t('pron.copied') : t('pron.copy')}
              icon="copy-outline"
              onPress={() => copyText(report).then(setCopied)}
            />
          )}
          <BigButton
            label={t('pron.clear')}
            variant="secondary"
            onPress={() => {
              setMarked([]);
              saveValue(storageKey, []);
            }}
          />
        </View>
      )}
    </View>
  );

  return (
    <Screen>
      <LessonHeader onClose={() => (router.canGoBack() ? router.back() : router.replace('/settings'))} title={t('pron.title')} />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item}-${index}`}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.list, { paddingBottom: spacing.lg + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
        renderItem={({ item }) => {
          const wrong = marked.includes(item);
          const fixed = forVoice(item, target.code, voiceName) !== item;
          return (
            <View style={[styles.row, wrong && styles.rowWrong]}>
              <Pressable
                onPress={() => play(item)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.rowText, pressed && styles.pressed]}
              >
                <Ionicons name="volume-high" size={24} color={accent} />
                <Text style={[styles.phrase, { color: accent }]}>
                  {item}
                  {fixed && <Text style={styles.fixed}>  ✓ {t('pron.fixed')}</Text>}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => toggle(item)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: wrong }}
                style={({ pressed }) => [styles.mark, wrong && styles.markOn, pressed && styles.pressed]}
              >
                <Ionicons name={wrong ? 'close-circle' : 'close-circle-outline'} size={22} color={wrong ? '#fff' : colors.error} />
                <Text style={[styles.markText, wrong && styles.markTextOn]}>{t('pron.wrong')}</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.sm, maxWidth: 720, width: '100%', alignSelf: 'center' },
  headerBlock: { gap: spacing.md, marginBottom: spacing.sm },
  text: { fontSize: font.body, color: colors.text, lineHeight: 27 },
  small: { fontSize: font.small, color: colors.textMuted, lineHeight: 23 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  cardTitle: { fontSize: font.large, fontWeight: '800', color: colors.text },
  tryRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: tapTarget,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: font.large,
    fontWeight: '600',
    backgroundColor: colors.card,
  },
  playBig: { flexShrink: 0, width: tapTarget, height: tapTarget, borderRadius: tapTarget / 2, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, minHeight: 48, borderRadius: radius.md },
  chipText: { fontSize: font.body, fontWeight: '700' },
  report: { fontSize: font.small, color: colors.text, backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md },
  section: { fontSize: font.body, fontWeight: '800', color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    minHeight: tapTarget,
    marginBottom: spacing.sm,
  },
  rowWrong: { borderColor: colors.errorBorder, backgroundColor: colors.errorLight },
  rowText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  phrase: { flex: 1, fontSize: font.body, fontWeight: '700' },
  fixed: { fontSize: 14, color: colors.success, fontWeight: '700' },
  mark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.errorBorder,
  },
  markOn: { backgroundColor: colors.error, borderColor: colors.error },
  markText: { fontSize: 15, fontWeight: '700', color: colors.error },
  markTextOn: { color: '#fff' },
  pressed: { opacity: 0.7 },
});
