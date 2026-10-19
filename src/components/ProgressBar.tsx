import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/lib/theme';

// A thick, rounded progress bar (value from 0 to 1).
export function ProgressBar({ value, color = colors.successBorder, height = 14 }: { value: number; color?: string; height?: number }) {
  const percent = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
    >
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, backgroundColor: colors.border, overflow: 'hidden', borderRadius: radius.md },
  fill: { height: '100%' },
});
