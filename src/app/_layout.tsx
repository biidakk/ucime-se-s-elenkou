import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Intro } from '@/components/Intro';
import { UpdateBanner } from '@/components/UpdateBanner';
import { useT } from '@/i18n';
import { dayKey } from '@/lib/dates';
import { ProgressProvider, useProgress } from '@/lib/progress';
import { SettingsProvider, useSettings } from '@/lib/settings';
import { getCourseInfo, LANGUAGES } from '@/lib/languages';
import { planReminders } from '@/lib/reminder';
import { primeSpeechOnFirstTap, voicesFor } from '@/lib/speech';
import { colors } from '@/lib/theme';
import { requestPersistentStorage } from '@/lib/webApp';

// The phone's launch screen stays until the animated intro takes over from it.
SplashScreen.preventAutoHideAsync().catch(() => {});
primeSpeechOnFirstTap();
requestPersistentStorage();

// The root of the app: the welcome screens the first time, then the main tabs.
export default function RootLayout() {
  const [intro, setIntro] = useState(true);
  return (
    <SettingsProvider>
      <ProgressProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <RootStack />
          <UpdateBanner />
          {intro && <IntroWhileLoading onDone={() => setIntro(false)} />}
        </View>
        <StatusBar style={intro ? 'light' : 'dark'} />
      </ProgressProvider>
    </SettingsProvider>
  );
}

// The intro stays until the saved settings and progress are read, so the app never shows empty.
function IntroWhileLoading({ onDone }: { onDone: () => void }) {
  const { loaded } = useSettings();
  const { ready } = useProgress();
  return <Intro ready={loaded && ready} onDone={onDone} />;
}

function RootStack() {
  const t = useT();
  const { loaded, settings } = useSettings();
  const { ready, activity } = useProgress();
  const practisedToday = activity.activeDays.includes(dayKey());

  // Plan the next reminders on every start, and again after practising or changing the time.
  useEffect(() => {
    if (!loaded || !ready) return;
    planReminders({
      hour: settings.reminderHour,
      practisedToday,
      title: 'Elenka',
      body: t('reminder.notification'),
      channelName: t('reminder.channel'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, ready, settings.reminderHour, practisedToday, t.lang]);

  // Find the voices of the language being learned early, so the first word already uses the right one.
  useEffect(() => {
    if (settings.courseId) voicesFor(LANGUAGES[getCourseInfo(settings.courseId).target].speech);
  }, [settings.courseId]);

  // Wait until the saved settings and progress have been read from the phone.
  if (!loaded || !ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={settings.onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="test/[unitId]" />
        <Stack.Screen name="courses" />
        <Stack.Screen name="progress" />
        <Stack.Screen name="pronunciation" />
        <Stack.Screen name="chat/[unitId]" />
      </Stack.Protected>
      <Stack.Protected guard={!settings.onboarded}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
    </Stack>
  );
}
