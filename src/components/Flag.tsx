import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Polygon, Rect } from 'react-native-svg';
import type { LanguageCode } from '@/lib/languages';
import { colors } from '@/lib/theme';

// A small flag for a language, drawn as a picture (emoji flags don't show on every phone).
// All flags are shown in the same 3:2 box with rounded corners.
export function Flag({ lang, width = 48 }: { lang: LanguageCode; width?: number }) {
  const height = Math.round((width * 2) / 3);
  return (
    <View style={[styles.box, { width, height, borderRadius: Math.max(4, width / 10) }]}>
      <Svg width={width} height={height} viewBox={lang === 'en' ? '0 0 60 30' : '0 0 6 4'} preserveAspectRatio="xMidYMid slice">
        <FlagShapes lang={lang} />
      </Svg>
    </View>
  );
}

function FlagShapes({ lang }: { lang: LanguageCode }) {
  const id = useId().replace(/:/g, '');
  switch (lang) {
    case 'cs':
      return (
        <>
          <Rect x="0" y="0" width="6" height="2" fill="#FFFFFF" />
          <Rect x="0" y="2" width="6" height="2" fill="#D7141A" />
          <Polygon points="0,0 3,2 0,4" fill="#11457E" />
        </>
      );
    case 'de':
      return (
        <>
          <Rect x="0" y="0" width="6" height="1.34" fill="#000000" />
          <Rect x="0" y="1.33" width="6" height="1.34" fill="#DD0000" />
          <Rect x="0" y="2.66" width="6" height="1.34" fill="#FFCE00" />
        </>
      );
    case 'ro':
      return (
        <>
          <Rect x="0" y="0" width="2.01" height="4" fill="#002B7F" />
          <Rect x="2" y="0" width="2.01" height="4" fill="#FCD116" />
          <Rect x="4" y="0" width="2" height="4" fill="#CE1126" />
        </>
      );
    case 'en':
      // The Union Jack (the course teaches British English).
      return (
        <>
          <Defs>
            <ClipPath id={`${id}t`}>
              <Path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
            </ClipPath>
          </Defs>
          <Rect x="0" y="0" width="60" height="30" fill="#012169" />
          <Path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
          <G clipPath={`url(#${id}t)`}>
            <Path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
          </G>
          <Path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
          <Path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
        </>
      );
  }
}

const styles = StyleSheet.create({
  box: { overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
});
