import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { ComponentRef, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { LessonHeader } from '@/components/LessonHeader';
import { Screen } from '@/components/Screen';
import { SpeakButton } from '@/components/SpeakButton';
import { TextKey, useT } from '@/i18n';
import { ChatError, chatContext, ChatMessage, ChatReply, sendChat } from '@/lib/chat';
import { useAccent, useCourse } from '@/lib/course';
import { useInsets } from '@/lib/insets';
import { useMicExercises } from '@/lib/mic';
import { listenOnce } from '@/lib/recognition';
import { useSettings } from '@/lib/settings';
import { stopSpeech, useSpeak } from '@/lib/speech';
import { colors, font, radius, spacing, tapTarget } from '@/lib/theme';

// One bubble: the partner's lines keep the whole answer (for "Pomoc"); the learner's lines
// get the correction that came back with the next answer.
type Item =
  | { role: 'partner'; text: string; reply: ChatReply }
  | { role: 'learner'; text: string; correction?: string | null; explanation?: string | null };

const ERROR_KEYS: Record<ChatError, TextKey> = {
  offline: 'chat.err.offline',
  code: 'chat.err.code',
  limit: 'chat.err.limit',
  busy: 'chat.err.busy',
  error: 'chat.err.error',
};

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

// The AI conversation partner: a role-play that fits the unit, at the learner's level,
// with gentle corrections in the learner's language. Needs internet (docs/CHAT_PLAN.md).
export default function ChatScreen() {
  const t = useT();
  const insets = useInsets();
  const speak = useSpeak();
  const mic = useMicExercises();
  const { unitId } = useLocalSearchParams<{ unitId: string }>();
  const { course, info, target } = useCourse();
  const { accent, accentLight } = useAccent();
  const { settings } = useSettings();
  const unit = course.units.find((u) => u.id === unitId);

  const [items, setItems] = useState<Item[]>([]);
  const [text, setText] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<ChatError | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [listening, setListening] = useState(false);
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const stopListening = useRef<(() => void) | null>(null);

  const context = unit ? chatContext(course, unit, info.native, info.target) : null;
  const adverb = t(`lang.${target.code}.adverb` as TextKey);

  // Ask the server for the next line; "history" is the conversation including the learner's message.
  const ask = async (history: Item[]) => {
    if (!context) return;
    setWaiting(true);
    setError(null);
    setShowHelp(false);
    const messages: ChatMessage[] = history.map((i) => ({ role: i.role, text: i.text }));
    const result = await sendChat({ context, messages }, settings.chatCode);
    setWaiting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const { reply } = result;
    setItems(() => {
      const next = [...history];
      const last = next[next.length - 1];
      if (last?.role === 'learner') {
        next[next.length - 1] = { ...last, correction: reply.correction, explanation: reply.explanation };
      }
      return [...next, { role: 'partner', text: reply.reply, reply }];
    });
    speak(reply.reply);
  };

  // The partner opens the scene.
  useEffect(() => {
    ask([]);
    return () => {
      stopSpeech();
      stopListening.current?.();
    };
    // Only when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 100);
  }, [items, waiting, showHelp, error]);

  const send = () => {
    const message = text.trim();
    if (!message || waiting) return;
    setText('');
    const history: Item[] = [...items, { role: 'learner', text: message }];
    setItems(history);
    ask(history);
  };

  const retry = () => ask(items);

  const restart = () => {
    stopSpeech();
    setItems([]);
    ask([]);
  };

  const listen = () => {
    if (listening) {
      stopListening.current?.();
      return;
    }
    stopSpeech();
    setListening(true);
    stopListening.current = listenOnce(target.speech, {
      onResult: (transcripts) => {
        if (transcripts[0]) setText((old) => (old ? `${old} ${transcripts[0]}` : transcripts[0]));
      },
      onError: () => {},
      onEnd: () => setListening(false),
    });
  };

  if (!unit || !context) {
    return (
      <Screen>
        <LessonHeader onClose={goBack} />
        <Text style={styles.empty}>{t('common.notFound')}</Text>
      </Screen>
    );
  }

  const lastPartner = [...items].reverse().find((i): i is Extract<Item, { role: 'partner' }> => i.role === 'partner');

  return (
    <Screen>
      <LessonHeader onClose={goBack} title={`${t('chat.title')}: ${unit.title}`} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} style={styles.flex} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          <View style={[styles.situation, { backgroundColor: accentLight }]}>
            <Text style={[styles.situationLabel, { color: accent }]}>{t('chat.situation')}</Text>
            <Text style={styles.situationText}>{context.scenario.situation}</Text>
            <Text style={styles.small}>{t('chat.intro', { adverb })}</Text>
          </View>

          {items.map((item, index) =>
            item.role === 'partner' ? (
              <View key={index} style={styles.partnerRow}>
                <View style={[styles.bubble, styles.partnerBubble]}>
                  <Text style={[styles.bubbleText, { color: accent }]}>{item.text}</Text>
                </View>
                <SpeakButton text={item.text} />
              </View>
            ) : (
              <View key={index} style={styles.learnerBlock}>
                <View style={[styles.bubble, styles.learnerBubble, { backgroundColor: accent }]}>
                  <Text style={[styles.bubbleText, styles.learnerText]}>{item.text}</Text>
                </View>
                {item.correction && (
                  <View style={styles.correction}>
                    <Text style={styles.correctionText}>
                      <Text style={styles.correctionLabel}>{t('chat.better')} </Text>
                      {item.correction}
                    </Text>
                    {item.explanation && <Text style={styles.small}>{item.explanation}</Text>}
                  </View>
                )}
              </View>
            ),
          )}

          {waiting && (
            <View style={styles.waiting}>
              <ActivityIndicator color={accent} />
              <Text style={styles.small}>{t('chat.thinking')}</Text>
            </View>
          )}

          {error && (
            <View style={styles.error}>
              <Text style={styles.errorText}>{t(ERROR_KEYS[error])}</Text>
              {error !== 'limit' && error !== 'code' && (
                <BigButton label={t('chat.retry')} icon="refresh" variant="secondary" onPress={retry} />
              )}
            </View>
          )}

          {showHelp && lastPartner && (
            <View style={styles.help}>
              <Text style={styles.helpLabel}>{t('chat.helpTranslation')}</Text>
              <Text style={styles.helpText}>{lastPartner.reply.translation}</Text>
              <Text style={styles.helpLabel}>{t('chat.helpHint')}</Text>
              <View style={styles.hintRow}>
                <Text style={[styles.helpText, styles.flex, { color: accent }]}>{lastPartner.reply.hint}</Text>
                <SpeakButton text={lastPartner.reply.hint} />
              </View>
              <BigButton label={t('chat.useHint')} variant="secondary" onPress={() => setText(lastPartner.reply.hint)} />
            </View>
          )}

          <Text style={styles.note}>{t('chat.aiNote')}</Text>
        </ScrollView>

        <View style={[styles.composer, { paddingBottom: spacing.sm + insets.bottom }]}>
          <View style={styles.composerButtons}>
            <Pressable
              onPress={() => setShowHelp((s) => !s)}
              disabled={!lastPartner}
              accessibilityRole="button"
              style={({ pressed }) => [styles.smallButton, { borderColor: accent }, pressed && styles.pressed, !lastPartner && styles.disabled]}
            >
              <Ionicons name="help-buoy-outline" size={22} color={accent} />
              <Text style={[styles.smallButtonText, { color: accent }]}>{t('chat.help')}</Text>
            </Pressable>
            <Pressable
              onPress={restart}
              accessibilityRole="button"
              style={({ pressed }) => [styles.smallButton, { borderColor: colors.border }, pressed && styles.pressed]}
            >
              <Ionicons name="refresh" size={22} color={colors.textMuted} />
              <Text style={styles.smallButtonText}>{t('chat.restart')}</Text>
            </Pressable>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t('chat.placeholder')}
              placeholderTextColor={colors.textMuted}
              multiline
              style={[styles.input, { color: colors.text }]}
              accessibilityLabel={t('chat.placeholder')}
            />
            {mic.enabled && (
              <Pressable
                onPress={listen}
                accessibilityRole="button"
                accessibilityLabel={t('speak.tap')}
                style={({ pressed }) => [styles.roundButton, { backgroundColor: listening ? colors.error : colors.card, borderColor: accent }, pressed && styles.pressed]}
              >
                <Ionicons name={listening ? 'stop' : 'mic'} size={26} color={listening ? '#fff' : accent} />
              </Pressable>
            )}
            <Pressable
              onPress={send}
              disabled={!text.trim() || waiting}
              accessibilityRole="button"
              accessibilityLabel={t('chat.send')}
              style={({ pressed }) => [styles.roundButton, { backgroundColor: accent, borderColor: accent }, pressed && styles.pressed, (!text.trim() || waiting) && styles.disabled]}
            >
              <Ionicons name="send" size={24} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { fontSize: font.large, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  list: { padding: spacing.md, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  situation: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  situationLabel: { fontSize: font.small, fontWeight: '800', textTransform: 'uppercase' },
  situationText: { fontSize: font.large, fontWeight: '700', color: colors.text },
  small: { fontSize: font.small, color: colors.textMuted, lineHeight: 23 },
  partnerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start', maxWidth: '92%' },
  learnerBlock: { alignSelf: 'flex-end', maxWidth: '88%', gap: spacing.xs, alignItems: 'flex-end' },
  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, flexShrink: 1 },
  partnerBubble: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 6 },
  learnerBubble: { borderBottomRightRadius: 6 },
  bubbleText: { fontSize: font.large, fontWeight: '600', lineHeight: 30 },
  learnerText: { color: '#fff' },
  correction: { backgroundColor: colors.tipBackground, borderRadius: radius.md, padding: spacing.sm, gap: 2, borderWidth: 1, borderColor: colors.tipBorder },
  correctionText: { fontSize: font.body, color: colors.text, fontWeight: '600' },
  correctionLabel: { color: colors.tipLabel, fontWeight: '800' },
  waiting: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  error: { backgroundColor: colors.errorLight, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  errorText: { fontSize: font.body, color: colors.text, lineHeight: 26 },
  help: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.xs },
  helpLabel: { fontSize: font.small, color: colors.textMuted, fontWeight: '700' },
  helpText: { fontSize: font.large, color: colors.text, fontWeight: '600' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  note: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  composer: { borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingTop: spacing.sm, gap: spacing.sm },
  composerButtons: { flexDirection: 'row', gap: spacing.sm },
  smallButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 2, borderRadius: radius.md, paddingHorizontal: spacing.md, minHeight: 48 },
  smallButtonText: { fontSize: font.body, fontWeight: '700', color: colors.textMuted },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: tapTarget,
    maxHeight: 140,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: font.large,
    backgroundColor: colors.background,
  },
  roundButton: { width: tapTarget, height: tapTarget, borderRadius: tapTarget / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, flexShrink: 0 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
