import { Modal, StyleSheet, Text, View } from 'react-native';
import { BigButton } from '@/components/BigButton';
import { colors, font, radius, spacing } from '@/lib/theme';

type Props = {
  visible: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

// A simple question with two big buttons. (React Native's Alert does nothing on the web.)
// The safe choice is the first, larger button.
export function ConfirmDialog({ visible, title, text, confirmLabel, cancelLabel, onConfirm, onCancel, danger }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.box} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.text}>{text}</Text>
          <View style={styles.buttons}>
            <BigButton label={cancelLabel} onPress={onCancel} />
            <BigButton label={confirmLabel} onPress={onConfirm} variant={danger ? 'danger' : 'secondary'} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 25, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  box: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { fontSize: font.title - 2, fontWeight: '800', color: colors.text },
  text: { fontSize: font.body, color: colors.text, lineHeight: 27 },
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
});
