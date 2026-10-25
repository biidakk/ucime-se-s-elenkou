import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { useT } from '@/i18n';
import { colors } from '@/lib/theme';

// The logo is drawn at the size and place of the launch screen logo (app.json, expo-splash-screen),
// so the phone's launch screen turns into this one without a jump.
const LOGO = 200;
const UNIT = LOGO / 1024; // the logo is drawn on a 1024 grid, like scripts/make-icons.mjs
const STAR = 230 * UNIT;
const SHOW_MS = 2500;
const ANIMATION_MS = 2300;
const FADE_MS = 400;

// Small twinkles around the risen logo (x, y within the logo box; the logo has moved 70 up).
const SPARKLES = [
  { x: -24, y: -14, size: 28, start: 0.5, color: '#FFFFFF' },
  { x: 232, y: 36, size: 20, start: 0.6, color: colors.star },
  { x: 205, y: -64, size: 22, start: 0.68, color: '#FFFFFF' },
  { x: -34, y: 64, size: 18, start: 0.76, color: '#FFFFFF' },
];

type Props = {
  ready: boolean; // the saved settings and progress are read, so the app can be shown
  onDone: () => void;
};

// A short animated logo when the app starts: the blue deepens into the icon's gradient, the bubble rises,
// the star spins, "Elenka" and a short line appear, small sparkles twinkle, then everything fades into the app.
// A tap skips it; with reduced motion only the fade remains.
export function Intro({ ready, onDone }: Props) {
  const t = useT();
  const [progress] = useState(() => new Animated.Value(0));
  const [fade] = useState(() => new Animated.Value(1));
  const [shown, setShown] = useState(false); // the animation has played (or was skipped)
  const leaving = useRef(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) progress.setValue(1);
        Animated.timing(progress, {
          toValue: 1,
          duration: reduce ? 0 : ANIMATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      });
    const timer = setTimeout(() => setShown(true), SHOW_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [progress]);

  useEffect(() => {
    if (!shown || !ready || leaving.current) return;
    leaving.current = true;
    Animated.timing(fade, { toValue: 0, duration: FADE_MS, useNativeDriver: Platform.OS !== 'web' }).start(onDone);
  }, [shown, ready, fade, onDone]);

  const at = (from: number, to: number, out: [number, number]) =>
    progress.interpolate({ inputRange: [from, to], outputRange: out, extrapolate: 'clamp' });

  const logoStyle = {
    transform: [
      { translateY: at(0.05, 0.45, [0, -70]) },
      { scale: progress.interpolate({ inputRange: [0, 0.2, 0.45], outputRange: [1, 1.08, 1], extrapolate: 'clamp' }) },
    ],
  };
  const starStyle = {
    transform: [
      { rotate: progress.interpolate({ inputRange: [0.3, 0.65], outputRange: ['0deg', '360deg'], extrapolate: 'clamp' }) },
      { scale: progress.interpolate({ inputRange: [0.3, 0.5, 0.65], outputRange: [1, 1.45, 1], extrapolate: 'clamp' }) },
    ],
  };
  const ring = (start: number) => ({
    opacity: progress.interpolate({ inputRange: [start, start + 0.05, start + 0.45], outputRange: [0, 0.35, 0], extrapolate: 'clamp' }),
    transform: [{ translateY: -70 }, { scale: at(start, start + 0.45, [0.9, 2.2]) }],
  });
  const gradientStyle = { opacity: at(0, 0.3, [0, 1]) };
  const sparkle = (start: number) => ({
    opacity: progress.interpolate({ inputRange: [start, start + 0.1, start + 0.3], outputRange: [0, 1, 0], extrapolate: 'clamp' }),
    transform: [{ scale: progress.interpolate({ inputRange: [start, start + 0.1, start + 0.3], outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' }) }],
  });
  const titleStyle = { opacity: at(0.4, 0.7, [0, 1]), transform: [{ translateY: at(0.4, 0.7, [16, 0]) }] };
  const taglineStyle = { opacity: at(0.6, 0.9, [0, 1]), transform: [{ translateY: at(0.6, 0.9, [12, 0]) }] };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} onLayout={() => SplashScreen.hide()}>
      <Pressable
        style={styles.screen}
        onPress={() => setShown(true)}
        accessibilityRole="button"
        accessibilityLabel={t('intro.skip')}
      >
        <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
          <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="introBg" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#2A6BC2" />
                <Stop offset="1" stopColor="#143A75" />
              </LinearGradient>
            </Defs>
            <Rect width={100} height={100} fill="url(#introBg)" />
          </Svg>
        </Animated.View>
        <Animated.View style={[styles.ring, ring(0.08)]} />
        <Animated.View style={[styles.ring, ring(0.22)]} />
        <View style={styles.center}>
          {SPARKLES.map((p, i) => (
            <Animated.View key={i} style={[styles.sparkle, { left: p.x - p.size / 2, top: p.y - p.size / 2 }, sparkle(p.start)]}>
              <Svg width={p.size} height={p.size} viewBox="-10 -10 20 20">
                <Path d="M0 -10 Q1.5 -1.5 10 0 Q1.5 1.5 0 10 Q-1.5 1.5 -10 0 Q-1.5 -1.5 0 -10 Z" fill={p.color} />
              </Svg>
            </Animated.View>
          ))}
          <Animated.View style={[styles.logo, logoStyle]}>
            <Svg width={LOGO} height={LOGO} viewBox="0 0 1024 1024">
              <Path d="M300 690 L250 860 L470 700 Z" fill="#FFFFFF" />
              <Rect x={160} y={200} width={704} height={520} rx={160} fill="#FFFFFF" />
              <SvgText
                x={512}
                y={575}
                textAnchor="middle"
                fontFamily={Platform.select({ ios: 'Arial', android: 'sans-serif', default: 'Arial, Helvetica, sans-serif' })}
                fontWeight="700"
                fontSize={330}
                fill={colors.primary}
              >
                Aa
              </SvgText>
            </Svg>
            <Animated.View style={[styles.star, starStyle]}>
              <Svg width={STAR} height={STAR} viewBox="-115 -115 230 230">
                <Path
                  transform="scale(1.25)"
                  d="M0 -80 L23 -25 L82 -25 L35 10 L52 66 L0 33 L-52 66 L-35 10 L-82 -25 L-23 -25 Z"
                  fill={colors.star}
                  stroke="#FFFFFF"
                  strokeWidth={14}
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          </Animated.View>
          <View style={styles.texts}>
            <Animated.Text style={[styles.title, titleStyle]}>Elenka</Animated.Text>
            <Animated.Text style={[styles.tagline, taglineStyle]}>{t('intro.tagline')}</Animated.Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  center: { width: LOGO, height: LOGO, alignItems: 'center' },
  logo: { width: LOGO, height: LOGO },
  // The star of the logo, centred where the icon has it (800, 230 on the 1024 grid).
  star: { position: 'absolute', left: 800 * UNIT - STAR / 2, top: 230 * UNIT - STAR / 2, width: STAR, height: STAR },
  sparkle: { position: 'absolute' },
  ring: {
    position: 'absolute',
    width: LOGO * 0.9,
    height: LOGO * 0.9,
    borderRadius: LOGO,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  // Below the logo once it has risen; laid out absolutely so the logo stays exactly centred.
  texts: { position: 'absolute', top: LOGO - 70, width: 320, alignItems: 'center' },
  title: { color: '#FFFFFF', fontSize: 44, fontWeight: '800', letterSpacing: 1 },
  tagline: { color: colors.primaryLight, fontSize: 20, marginTop: 6, textAlign: 'center' },
});
