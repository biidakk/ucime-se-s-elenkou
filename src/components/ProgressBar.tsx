import { StyleSheet, View } from 'react-native';
import { colors, radius } from '@/lib/theme';

// A thick, rounded progress bar (value from 0 to 1).
export function ProgressBar({
  value,
  color = colors.successBorder,
  track = colors.border,
  height = 14,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  const percent = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2, backgroundColor: track }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(percent) }}
    >
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flex: 1, overflow: 'hidden', borderRadius: radius.md },
  fill: { height: '100%' },
});
