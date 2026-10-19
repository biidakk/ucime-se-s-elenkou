import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@/components/ProgressBar';
import { useT } from '@/i18n';
import { colors, font, spacing } from '@/lib/theme';

type Props = {
  onClose: () => void;
  progress?: number; // 0–1, omitted = no bar
  title?: string;
  counter?: string; // e.g. "3/15"
};

// The top of a lesson or test: a big close button, then the progress bar or a title.
export function LessonHeader({ onClose, progress, title, counter }: Props) {
  const t = useT();
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        hitSlop={10}
        style={({ pressed }) => [styles.close, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={34} color={colors.textMuted} />
      </Pressable>
      {progress !== undefined ? (
        <ProgressBar value={progress} />
      ) : (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      )}
      {counter && <Text style={styles.counter}>{counter}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  close: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26 },
  pressed: { backgroundColor: colors.border },
  title: { flex: 1, fontSize: font.large, fontWeight: '800', color: colors.text },
  counter: { fontSize: font.body, fontWeight: '700', color: colors.textMuted },
});
