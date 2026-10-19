import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TextKey, useT } from '@/i18n';
import { useCourse } from '@/lib/course';
import { isApple } from '@/lib/device';
import { useSettings } from '@/lib/settings';
import { findVoice } from '@/lib/speech';
import { colors, font, radius, spacing } from '@/lib/theme';

// Explains what to do if the phone has no voice for the language being learned,
// and otherwise reminds that silent mode or low volume mutes the voice.
export function VoiceNotice() {
  const t = useT();
  const { target } = useCourse();
  const { settings } = useSettings();
  const chosen = settings.voices[target.code];
  const [hasVoice, setHasVoice] = useState<boolean | null>(null);

  useEffect(() => {
    findVoice(target.speech, chosen).then((voice) => setHasVoice(voice === undefined ? null : voice !== null));
  }, [target.speech, chosen]);

  if (hasVoice === false) {
    return (
      <View style={styles.warning}>
        <Text style={styles.warningTitle}>
          {t('speech.noVoice', { language: t(`lang.${target.code}.accusative` as TextKey) })}
        </Text>
        <Text style={styles.text}>{t(isApple() ? 'speech.noVoiceIos' : 'speech.noVoiceOther')}</Text>
      </View>
    );
  }
  return <Text style={styles.hint}>{t('speech.silentHint')}</Text>;
}

const styles = StyleSheet.create({
  warning: { backgroundColor: colors.tipBackground, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  warningTitle: { fontSize: font.body, fontWeight: '800', color: colors.text },
  text: { fontSize: font.small, color: colors.text, lineHeight: 23 },
  hint: { fontSize: font.small, color: colors.textMuted, textAlign: 'center' },
});
