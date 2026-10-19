import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccent } from '@/lib/course';
import { colors, font, radius, spacing, tapTarget } from '@/lib/theme';

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

type Props = {
  label: string;
  state: OptionState;
  onPress: () => void;
  emphasis?: boolean; // text in the language being learned: shown in the course colour
};

// One answer option in a multiple-choice style exercise. Right and wrong answers also get
// an icon, so the result doesn't depend on seeing colours.
export function OptionButton({ label, state, onPress, emphasis = false }: Props) {
  const { accent, accentLight } = useAccent();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: state === 'selected' }}
      style={({ pressed }) => [
        styles.option,
        styles[state],
        state === 'selected' && { borderColor: accent, backgroundColor: accentLight },
        pressed && state === 'idle' && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          emphasis && { color: accent },
          state === 'dimmed' && styles.dimmedLabel,
        ]}
      >
        {label}
      </Text>
      {state === 'correct' && (
        <View style={[styles.badge, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark" size={20} color="#fff" />
        </View>
      )}
      {state === 'wrong' && (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Ionicons name="close" size={20} color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    minHeight: tapTarget,
    borderRadius: radius.md,
    borderWidth: 2,
    borderBottomWidth: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  idle: { borderColor: colors.border, backgroundColor: colors.card },
  selected: {},
  correct: { borderColor: colors.successBorder, backgroundColor: colors.successLight },
  wrong: { borderColor: colors.errorBorder, backgroundColor: colors.errorLight },
  dimmed: { borderColor: colors.border, backgroundColor: colors.card, opacity: 0.6 },
  pressed: { opacity: 0.7 },
  label: { flex: 1, fontSize: font.large, color: colors.text, fontWeight: '600' },
  dimmedLabel: { color: colors.textMuted },
  badge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
