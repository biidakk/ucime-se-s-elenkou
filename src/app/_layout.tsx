import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { UpdateBanner } from '@/components/UpdateBanner';
import { ProgressProvider, useProgress } from '@/lib/progress';
import { SettingsProvider, useSettings } from '@/lib/settings';
import { getCourseInfo, LANGUAGES } from '@/lib/languages';
import { primeSpeechOnFirstTap, voicesFor } from '@/lib/speech';
import { colors } from '@/lib/theme';
import { requestPersistentStorage } from '@/lib/webApp';

primeSpeechOnFirstTap();
requestPersistentStorage();

// The root of the app: the welcome screens the first time, then the main tabs.
export default function RootLayout() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <RootStack />
          <UpdateBanner />
        </View>
        <StatusBar style="dark" />
      </ProgressProvider>
    </SettingsProvider>
  );
}

function RootStack() {
  const { loaded, settings } = useSettings();
  const { ready } = useProgress();

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
        <Stack.Screen name="pronunciation" />
        <Stack.Screen name="chat/[unitId]" />
      </Stack.Protected>
      <Stack.Protected guard={!settings.onboarded}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
    </Stack>
  );
}
