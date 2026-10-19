import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccent } from '@/lib/course';
import { colors, font, radius, spacing, tapTarget } from '@/lib/theme';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
};

// Two or three big buttons side by side; the chosen one is filled. Easier than a small switch.
export function Segmented<T extends string>({ options, value, onChange, disabled = false }: Props<T>) {
  const { accent } = useAccent();
  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: active, disabled }}
            style={({ pressed }) => [
              styles.option,
              active && { backgroundColor: accent, borderColor: accent },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  disabled: { opacity: 0.5 },
  option: {
    flex: 1,
    minHeight: tapTarget - 4,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  pressed: { opacity: 0.8 },
  label: { fontSize: font.body, fontWeight: '700', color: colors.text, textAlign: 'center' },
  activeLabel: { color: '#fff' },
});
