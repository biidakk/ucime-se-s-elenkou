import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { UpdateBanner } from '@/components/UpdateBanner';
import { ProgressProvider, useProgress } from '@/lib/progress';
import { SettingsProvider, useSettings } from '@/lib/settings';
import { primeSpeechOnFirstTap } from '@/lib/speech';
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

  // Wait until the saved settings and progress have been read from the phone.
  if (!loaded || !ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={settings.onboarded}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lesson/[id]" />
        <Stack.Screen name="test/[unitId]" />
        <Stack.Screen name="courses" />
      </Stack.Protected>
      <Stack.Protected guard={!settings.onboarded}>
        <Stack.Screen name="welcome" />
      </Stack.Protected>
    </Stack>
  );
}
