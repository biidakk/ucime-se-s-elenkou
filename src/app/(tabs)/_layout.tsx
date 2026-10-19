import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { useT } from '@/i18n';
import { useAccent } from '@/lib/course';
import { useInsets } from '@/lib/insets';
import { colors } from '@/lib/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

// The four big tabs at the bottom of the screen, always with a label under the icon.
export default function TabLayout() {
  const t = useT();
  const { accent } = useAccent();
  const insets = useInsets();
  const icon = (name: IconName) =>
    function TabIcon({ color }: { color: ColorValue }) {
      return <Ionicons name={name} color={typeof color === 'string' ? color : undefined} size={30} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 14, fontWeight: '700' },
        tabBarStyle: {
          height: 72 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 8,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.course'), tabBarIcon: icon('map') }} />
      <Tabs.Screen name="review" options={{ title: t('tabs.review'), tabBarIcon: icon('repeat') }} />
      <Tabs.Screen name="progress" options={{ title: t('tabs.progress'), tabBarIcon: icon('stats-chart') }} />
      <Tabs.Screen name="settings" options={{ title: t('tabs.settings'), tabBarIcon: icon('settings-sharp') }} />
    </Tabs>
  );
}
