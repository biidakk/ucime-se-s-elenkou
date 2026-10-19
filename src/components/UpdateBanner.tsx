import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useT } from '@/i18n';
import { useInsets } from '@/lib/insets';
import { colors, font, radius, spacing } from '@/lib/theme';
import { useUpdateReady } from '@/lib/webApp';

// A banner at the top when a new version of the app has been downloaded (web only).
export function UpdateBanner() {
  const t = useT();
  const insets = useInsets();
  const applyUpdate = useUpdateReady();
  if (!applyUpdate) return null;
  return (
    <View style={[styles.wrap, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
      <View style={styles.banner}>
        <Ionicons name="sparkles" size={26} color="#fff" />
        <Text style={styles.text}>{t('update.text')}</Text>
        <Pressable onPress={applyUpdate} accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>{t('update.button')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.md, right: spacing.md, zIndex: 10 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  text: { flex: 1, color: '#fff', fontSize: font.body, fontWeight: '600' },
  button: { backgroundColor: '#fff', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pressed: { opacity: 0.8 },
  buttonText: { color: colors.text, fontSize: font.body, fontWeight: '800' },
});
