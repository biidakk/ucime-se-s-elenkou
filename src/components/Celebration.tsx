import { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';

const COLORS = ['#F2B705', '#2E9E5B', '#1E5AA8', '#D7141A', '#8A5A00', '#6A3FA0', '#FF8A3D'];
const PIECES = 36;

// A short burst of confetti when a lesson or a unit test is finished.
// It never blocks taps, and it is skipped when the phone asks for reduced motion.
export function Celebration() {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        x: Math.random() * width,
        drift: (Math.random() - 0.5) * 120,
        delay: Math.random() * 0.25,
        size: 8 + Math.random() * 8,
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 360),
        color: COLORS[i % COLORS.length],
        round: i % 3 === 0,
      })),
    [width],
  );

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled || reduce) return;
        Animated.timing(progress, {
          toValue: 1,
          duration: 2600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      });
    return () => {
      cancelled = true;
    };
  }, [progress]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const start = p.delay;
        const translateY = progress.interpolate({
          inputRange: [0, start, 1],
          outputRange: [-40, -40, height * 0.9],
        });
        const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] });
        const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.spin}deg`] });
        const opacity = progress.interpolate({ inputRange: [0, 0.02, 0.8, 1], outputRange: [0, 1, 1, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: 0,
              width: p.size,
              height: p.round ? p.size : p.size * 0.5,
              borderRadius: p.round ? p.size / 2 : 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
