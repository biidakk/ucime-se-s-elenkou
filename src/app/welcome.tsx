import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { InstallSteps } from '@/components/InstallSteps';
import { LanguageCard } from '@/components/LanguageCard';
import { Screen } from '@/components/Screen';
import { TextKey, useT } from '@/i18n';
import { shouldShowInstallHint } from '@/lib/device';
import { useInsets } from '@/lib/insets';
import { CourseId, coursesFor, ENDONYMS, UI_LANGUAGES, UI_LANGUAGES_SOON } from '@/lib/languages';
import { useSettings } from '@/lib/settings';
import { colors, font, radius, spacing } from '@/lib/theme';

type Step = 'native' | 'intro' | 'target' | 'install';

const POINTS = [
  { emoji: '⏱️', title: 'welcome.point1.title', text: 'welcome.point1.text' },
  { emoji: '🔊', title: 'welcome.point2.title', text: 'welcome.point2.text' },
  { emoji: '🌿', title: 'welcome.point3.title', text: 'welcome.point3.text' },
] as const;

// The first screens: choose your language, a short welcome, choose what to learn,
// and (on an iPhone in Safari) how to add the app to the Home Screen.
export default function WelcomeScreen() {
  const t = useT();
  const insets = useInsets();
  const { settings, update } = useSettings();
  const [step, setStep] = useState<Step>(settings.nativeLanguage ? 'intro' : 'native');
  const [courseId, setCourseId] = useState<CourseId | null>(settings.courseId);

  const native = settings.nativeLanguage ?? 'cs';
  const finish = () => update({ courseId, onboarded: true });

  const footer = (button: React.ReactNode) => (
    <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>{button}</View>
  );

  if (step === 'native') {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.hello}>{t('welcome.hello')}</Text>
          <Text style={styles.title}>{t('welcome.nativeQuestion')}</Text>
          <Text style={styles.hint}>{t('welcome.nativeHint')}</Text>
          {UI_LANGUAGES.map((lang) => (
            <LanguageCard
              key={lang}
              lang={lang}
              title={ENDONYMS[lang]}
              onPress={() => {
                update({ nativeLanguage: lang });
                setStep('intro');
              }}
            />
          ))}
          {UI_LANGUAGES_SOON.map((lang) => (
            <LanguageCard key={lang} lang={lang} title={ENDONYMS[lang]} subtitle="⏳ …" disabled onPress={() => {}} />
          ))}
        </ScrollView>
      </Screen>
    );
  }

  if (step === 'intro') {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.hello}>{t('welcome.hello')}</Text>
          <Text style={styles.title}>{t('welcome.title')}</Text>
          {POINTS.map((point) => (
            <View key={point.title} style={styles.card}>
              <Text style={styles.emoji}>{point.emoji}</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{t(point.title)}</Text>
                <Text style={styles.cardBody}>{t(point.text)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        {footer(<BigButton label={t('welcome.next')} icon="arrow-forward" onPress={() => setStep('target')} />)}
      </Screen>
    );
  }

  if (step === 'target') {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('welcome.targetQuestion')}</Text>
          {coursesFor(native).map((course) => (
            <LanguageCard
              key={course.id}
              lang={course.target}
              title={t(`lang.${course.target}.name` as TextKey)}
              subtitle={`${ENDONYMS[course.target]} · ${t(`lang.${course.target}.variant` as TextKey)}`}
              selected={courseId === course.id}
              onPress={() => setCourseId(course.id)}
            />
          ))}
          <Text style={styles.hint}>{t('welcome.targetHint')}</Text>
        </ScrollView>
        {footer(
          <BigButton
            label={t('welcome.start')}
            disabled={!courseId}
            onPress={() => (shouldShowInstallHint() && !settings.installHintSeen ? setStep('install') : finish())}
          />,
        )}
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('install.title')}</Text>
        <Text style={styles.hint}>{t('install.text')}</Text>
        <InstallSteps />
      </ScrollView>
      {footer(
        <View style={styles.buttons}>
          <BigButton
            label={t('install.done')}
            onPress={() => {
              update({ installHintSeen: true });
              finish();
            }}
          />
          <BigButton label={t('install.later')} variant="secondary" onPress={finish} />
        </View>,
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, maxWidth: 640, width: '100%', alignSelf: 'center' },
  hello: { fontSize: font.huge, fontWeight: '800', color: colors.primary, marginTop: spacing.md },
  title: { fontSize: font.title, fontWeight: '800', color: colors.text },
  hint: { fontSize: font.body, color: colors.textMuted, lineHeight: 27 },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: { fontSize: 34 },
  cardText: { flex: 1, gap: spacing.xs },
  cardTitle: { fontSize: font.large, fontWeight: '800', color: colors.text },
  cardBody: { fontSize: font.body, color: colors.textMuted, lineHeight: 27 },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, maxWidth: 640, width: '100%', alignSelf: 'center' },
  buttons: { gap: spacing.sm },
});
