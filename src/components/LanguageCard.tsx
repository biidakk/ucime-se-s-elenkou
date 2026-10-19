import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Flag } from '@/components/Flag';
import type { LanguageCode } from '@/lib/languages';
import { LANGUAGES } from '@/lib/languages';
import { colors, font, radius, spacing } from '@/lib/theme';

type Props = {
  lang: LanguageCode;
  title: string;
  subtitle?: string;
  detail?: string; // a third line, e.g. progress
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

// A big card with a flag for choosing a language (welcome screen, course picker).
export function LanguageCard({ lang, title, subtitle, detail, selected = false, disabled = false, onPress }: Props) {
  const { accent, accentLight } = LANGUAGES[lang];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.card,
        selected && { borderColor: accent, backgroundColor: accentLight },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Flag lang={lang} width={60} />
      <View style={styles.texts}>
        <Text style={[styles.title, { color: disabled ? colors.textMuted : accent }]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {detail && <Text style={styles.detail}>{detail}</Text>}
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={36} color={accent} />
      ) : (
        !disabled && <Ionicons name="chevron-forward" size={28} color={colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 92,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.8 },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: font.large + 2, fontWeight: '800' },
  subtitle: { fontSize: font.body, color: colors.textMuted },
  detail: { fontSize: font.small, color: colors.textMuted, fontWeight: '600' },
});
