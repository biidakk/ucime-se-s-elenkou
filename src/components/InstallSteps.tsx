import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { useT } from '@/i18n';
import { useAccent } from '@/lib/course';
import { colors, font, radius, spacing } from '@/lib/theme';

// The three steps to add the app to the iPhone Home Screen from Safari.
export function InstallSteps() {
  const t = useT();
  const { accent } = useAccent();
  const steps = [
    { icon: 'share-outline' as const, text: t('install.step1') },
    { icon: 'add-circle-outline' as const, text: t('install.step2') },
    { icon: 'checkmark-circle-outline' as const, text: t('install.step3') },
  ];
  return (
    <View style={styles.list}>
      {steps.map((step, i) => (
        <View key={i} style={styles.step}>
          <View style={[styles.number, { backgroundColor: accent }]}>
            <Text style={styles.numberText}>{i + 1}</Text>
          </View>
          <Text style={styles.text}>{step.text}</Text>
          <Ionicons name={step.icon} size={32} color={accent} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  number: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: '#fff', fontSize: font.large, fontWeight: '800' },
  text: { flex: 1, fontSize: font.body, color: colors.text, lineHeight: 26 },
});
