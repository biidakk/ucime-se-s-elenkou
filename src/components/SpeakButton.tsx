import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useT } from '@/i18n';
import { useAccent } from '@/lib/course';
import { useSpeak } from '@/lib/speech';
import { colors, font, spacing } from '@/lib/theme';

type Props = {
  text: string; // the text to say, in the language being learned
  size?: 'normal' | 'large';
  slow?: boolean;
  showLabel?: boolean; // a word under the large buttons ("Poslechnout", "Pomalu")
};

// A round button that reads a word or sentence out loud. The slow one has a turtle.
export function SpeakButton({ text, size = 'normal', slow = false, showLabel = false }: Props) {
  const t = useT();
  const speak = useSpeak();
  const { accent } = useAccent();
  const large = size === 'large';
  const label = slow ? t('common.listenSlow') : t('common.listen');
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => speak(text, slow)}
        accessibilityRole="button"
        accessibilityLabel={label}
        hitSlop={8}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: accent },
          large && styles.large,
          slow && styles.slow,
          pressed && styles.pressed,
        ]}
      >
        {slow ? (
          <Text style={[styles.turtle, large && styles.turtleLarge]}>🐢</Text>
        ) : (
          <Ionicons name="volume-high" size={large ? 48 : 28} color="#fff" />
        )}
      </Pressable>
      {showLabel && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs },
  button: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  large: { width: 104, height: 104, borderRadius: 52 },
  slow: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
  pressed: { opacity: 0.7, transform: [{ scale: 0.95 }] },
  turtle: { fontSize: font.large + 4 },
  turtleLarge: { fontSize: 44 },
  label: { fontSize: font.small, color: colors.textMuted, fontWeight: '700' },
});
