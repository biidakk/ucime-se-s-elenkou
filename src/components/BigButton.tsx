import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAccent } from '@/lib/course';
import { colors, font, radius, spacing, tapTarget } from '@/lib/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
};

// A large, easy-to-tap button used across the app. "primary" uses the course colour.
export function BigButton({ label, onPress, variant = 'primary', disabled = false, icon }: Props) {
  const { accent } = useAccent();
  const isSecondary = variant === 'secondary';
  const textColor = isSecondary ? colors.text : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && { backgroundColor: accent },
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {icon && <Ionicons name={icon} size={26} color={isSecondary ? accent : '#fff'} />}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: tapTarget,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {},
  secondary: { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.border },
  success: { backgroundColor: colors.success },
  danger: { backgroundColor: colors.error },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.4 },
  label: { fontSize: font.large, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
});
