import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useInsets } from '@/lib/insets';
import { colors, font, spacing } from '@/lib/theme';

type Props = {
  children: ReactNode;
  title?: string; // a large heading at the top
  right?: ReactNode; // something next to the heading (e.g. a button)
  edges?: ('top' | 'bottom')[]; // which sides to keep clear of the notch and home bar
};

// Every screen: keeps clear of the notch and the home bar, and shows a big, simple heading.
export function Screen({ children, title, right, edges = ['top'] }: Props) {
  const insets = useInsets();
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {(title || right) && (
        <View style={styles.header}>
          {title ? (
            <Text style={styles.title} accessibilityRole="header" numberOfLines={2}>
              {title}
            </Text>
          ) : (
            <View style={styles.spacer} />
          )}
          {right}
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: { flex: 1, fontSize: font.title, fontWeight: '800', color: colors.text },
  spacer: { flex: 1 },
  body: { flex: 1 },
});
