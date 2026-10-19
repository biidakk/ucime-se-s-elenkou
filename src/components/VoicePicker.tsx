import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TextKey, useT } from '@/i18n';
import { useAccent, useCourse } from '@/lib/course';
import { isApple } from '@/lib/device';
import { useSettings } from '@/lib/settings';
import { speak, VoiceOption, voicesFor } from '@/lib/speech';
import { colors, font, radius, spacing, tapTarget } from '@/lib/theme';

// A sentence to try each voice with, in each language that can be learned.
const SAMPLE: Record<string, string> = {
  en: 'Hello! How are you today?',
  de: 'Guten Tag! Wie geht es Ihnen?',
  ro: 'Bună ziua! Ce mai faceți?',
  cs: 'Dobrý den! Jak se máte?',
};

// All the phone's voices for the language being learned. Tapping one plays a sample and
// chooses it. The first one is the app's automatic choice.
export function VoicePicker() {
  const t = useT();
  const { target } = useCourse();
  const { accent, accentLight } = useAccent();
  const { settings, update } = useSettings();
  const [voices, setVoices] = useState<VoiceOption[] | null | undefined>(undefined);

  useEffect(() => {
    voicesFor(target.speech).then((list) => setVoices(list ?? null));
  }, [target.speech]);

  const chosenId = settings.voices[target.code];
  const selected = voices?.find((v) => v.id === chosenId) ?? voices?.[0];
  const language = t(`lang.${target.code}.accusative` as TextKey);

  const choose = (voice: VoiceOption, index: number) => {
    // Choosing the recommended voice clears the choice, so a better voice installed later wins.
    update({ voices: { ...settings.voices, [target.code]: index === 0 ? undefined : voice.id } });
    speak(SAMPLE[target.code], target.speech, settings.speechRate, false, voice.id);
  };

  if (voices === undefined) return <Text style={styles.small}>{t('settings.voiceLoading')}</Text>;

  if (voices === null || voices.length === 0) {
    return (
      <View style={styles.warning}>
        <Text style={styles.warningTitle}>{t('speech.noVoice', { language })}</Text>
        <Text style={styles.small}>{t(isApple() ? 'speech.noVoiceIos' : 'speech.noVoiceOther')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      <Text style={styles.label}>{t('settings.voiceChoose', { language })}</Text>
      <Text style={styles.small}>{t('settings.voiceHint')}</Text>
      {voices.map((voice, index) => {
        const active = voice.id === selected?.id;
        return (
          <Pressable
            key={voice.id}
            onPress={() => choose(voice, index)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={({ pressed }) => [
              styles.row,
              active && { borderColor: accent, backgroundColor: accentLight },
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={28} color={active ? accent : colors.textMuted} />
            <View style={styles.texts}>
              <Text style={styles.name}>{voice.name}</Text>
              {index === 0 && <Text style={[styles.detail, { color: accent }]}>{t('settings.voiceAuto')}</Text>}
              {!voice.exact && <Text style={styles.detail}>{t('settings.voiceOtherVariant', { lang: voice.language })}</Text>}
            </View>
            <Ionicons name="volume-high" size={26} color={accent} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  label: { fontSize: font.body, fontWeight: '700', color: colors.textMuted },
  small: { fontSize: font.small, color: colors.textMuted, lineHeight: 23 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: tapTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pressed: { opacity: 0.8 },
  texts: { flex: 1 },
  name: { fontSize: font.body, fontWeight: '700', color: colors.text },
  detail: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  warning: { backgroundColor: colors.tipBackground, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  warningTitle: { fontSize: font.body, fontWeight: '800', color: colors.text },
});
