import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ReactNode, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { InstallSteps } from '@/components/InstallSteps';
import { LanguageCard } from '@/components/LanguageCard';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { VoicePicker } from '@/components/VoicePicker';
import { TextKey, useT } from '@/i18n';
import { Backup, backupFileName, backupToText, createBackup, parseBackup, restoreBackup } from '@/lib/backup';
import { canCopyText, canPickFile, copyText, pickBackupFile, shareBackupFile } from '@/lib/backupFile';
import { useCourse } from '@/lib/course';
import { dayKey } from '@/lib/dates';
import { shouldShowInstallHint } from '@/lib/device';
import { ENDONYMS } from '@/lib/languages';
import { useMicExercises } from '@/lib/mic';
import { useProgress } from '@/lib/progress';
import { SpeechRate, useSettings } from '@/lib/settings';
import { colors, font, radius, spacing } from '@/lib/theme';

// Formats a day key like "2026-10-19" for display (19. 10. 2026 in Czech).
function formatDay(key: string, lang: string): string {
  const [y, m, d] = key.split('-').map(Number);
  try {
    return new Date(y, m - 1, d).toLocaleDateString(lang);
  } catch {
    return key;
  }
}

export default function SettingsScreen() {
  const t = useT();
  const { target } = useCourse();
  const { settings, update, reload: reloadSettings } = useSettings();
  const { resetProgress, reload: reloadProgress } = useProgress();
  const mic = useMicExercises();
  const [message, setMessage] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState('');
  const [pendingRestore, setPendingRestore] = useState<Backup | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const languageName = t(`lang.${target.code}.name` as TextKey);

  const saveBackup = async () => {
    const backup = await createBackup();
    const result = await shareBackupFile(backupFileName(backup), backupToText(backup));
    if (result === 'shared' || result === 'downloaded') {
      update({ lastBackup: dayKey() });
      setMessage(t('settings.backupSaved'));
    }
  };

  const copyBackup = async () => {
    const backup = await createBackup();
    if (await copyText(backupToText(backup))) {
      update({ lastBackup: dayKey() });
      setMessage(t('settings.backupCopied'));
    }
  };

  const offerRestore = (text: string | null) => {
    if (text === null) return;
    const backup = parseBackup(text);
    if (!backup) setMessage(t('settings.restoreBad'));
    else setPendingRestore(backup);
  };

  const doRestore = async () => {
    if (!pendingRestore) return;
    await restoreBackup(pendingRestore);
    setPendingRestore(null);
    setPasting(false);
    setPasted('');
    await reloadSettings();
    await reloadProgress();
    setMessage(t('settings.restoreDone'));
  };

  return (
    <Screen title={t('settings.title')}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {message && (
          <View style={styles.message} accessibilityLiveRegion="polite">
            <Text style={styles.messageText}>{message}</Text>
          </View>
        )}

        <Section title={t('settings.languageSection')}>
          <Text style={styles.label}>{t('settings.learning')}</Text>
          <LanguageCard
            lang={target.code}
            title={languageName}
            subtitle={t(`lang.${target.code}.variant` as TextKey)}
            detail={t('course.change')}
            onPress={() => router.push('/courses')}
          />
          <Text style={styles.label}>{t('settings.myLanguage')}</Text>
          <Text style={styles.value}>{ENDONYMS[settings.nativeLanguage ?? 'cs']}</Text>
        </Section>

        <Section title={t('settings.soundSection')}>
          <Text style={styles.label}>{t('settings.speechRate')}</Text>
          <Segmented<SpeechRate>
            value={settings.speechRate}
            onChange={(speechRate) => update({ speechRate })}
            options={[
              { value: 'normal', label: t('settings.rateNormal') },
              { value: 'slow', label: t('settings.rateSlow') },
            ]}
          />
          <VoicePicker />
          <Text style={styles.small}>{t('pron.openHint')}</Text>
          <BigButton label={t('pron.open')} icon="ear-outline" variant="secondary" onPress={() => router.push('/pronunciation')} />
        </Section>

        <Section title={t('settings.micSection')}>
          <Segmented<'on' | 'off'>
            value={mic.enabled ? 'on' : 'off'}
            onChange={(value) => update({ micEnabled: value === 'on' })}
            disabled={!mic.supported}
            options={[
              { value: 'on', label: t('settings.micOn') },
              { value: 'off', label: t('settings.micOff') },
            ]}
          />
          <Text style={styles.small}>{mic.supported ? t('settings.micText') : t('settings.micUnsupported')}</Text>
        </Section>

        <Section title={t('settings.backupSection')}>
          <Text style={styles.text}>{t('settings.backupText')}</Text>
          <Text style={styles.small}>
            {settings.lastBackup
              ? t('settings.backupLast', { date: formatDay(settings.lastBackup, t.lang) })
              : t('settings.backupNever')}
          </Text>
          <BigButton label={t('settings.backupSave')} icon="share-outline" onPress={saveBackup} />
          {canCopyText() && <BigButton label={t('settings.backupCopy')} icon="copy-outline" variant="secondary" onPress={copyBackup} />}
          {canPickFile() && (
            <BigButton
              label={t('settings.restore')}
              icon="folder-open-outline"
              variant="secondary"
              onPress={() => pickBackupFile().then(offerRestore)}
            />
          )}
          <BigButton label={t('settings.restorePaste')} icon="clipboard-outline" variant="secondary" onPress={() => setPasting((p) => !p)} />
          {pasting && (
            <View style={styles.paste}>
              <Text style={styles.label}>{t('settings.restorePasteHint')}</Text>
              <TextInput
                value={pasted}
                onChangeText={setPasted}
                multiline
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.pasteInput}
                accessibilityLabel={t('settings.restorePasteHint')}
              />
              <BigButton label={t('settings.restoreDo')} disabled={!pasted.trim()} onPress={() => offerRestore(pasted)} />
            </View>
          )}
        </Section>

        {shouldShowInstallHint() && (
          <Section title={t('settings.installSection')}>
            <Text style={styles.text}>{t('install.text')}</Text>
            <InstallSteps />
          </Section>
        )}

        <Section title={t('settings.aboutSection')}>
          <Text style={styles.text}>{t('app.name')}</Text>
          <Text style={styles.small}>{t('settings.version', { version: Constants.expoConfig?.version ?? '' })}</Text>
          <Text style={styles.small}>{t('course.unreviewed')}</Text>
          <BigButton label={t('settings.reset', { language: languageName })} variant="secondary" onPress={() => setConfirmReset(true)} />
        </Section>
      </ScrollView>

      <ConfirmDialog
        visible={pendingRestore !== null}
        title={t('settings.restoreConfirmTitle')}
        text={t('settings.restoreConfirmText', { date: pendingRestore ? formatDay(pendingRestore.createdAt, t.lang) : '' })}
        confirmLabel={t('settings.restoreDo')}
        cancelLabel={t('common.cancel')}
        onConfirm={doRestore}
        onCancel={() => setPendingRestore(null)}
      />
      <ConfirmDialog
        visible={confirmReset}
        title={t('settings.resetTitle')}
        text={t('settings.resetText', { language: languageName })}
        confirmLabel={t('settings.resetDo')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          resetProgress();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { fontSize: font.large, fontWeight: '800', color: colors.text },
  label: { fontSize: font.body, fontWeight: '700', color: colors.textMuted },
  value: { fontSize: font.large, fontWeight: '700', color: colors.text },
  text: { fontSize: font.body, color: colors.text, lineHeight: 27 },
  small: { fontSize: font.small, color: colors.textMuted, lineHeight: 23 },
  message: { backgroundColor: colors.successLight, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.successBorder },
  messageText: { fontSize: font.body, color: colors.text, fontWeight: '600' },
  paste: { gap: spacing.sm },
  pasteInput: {
    minHeight: 120,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.small,
    color: colors.text,
    textAlignVertical: 'top',
  },
});
