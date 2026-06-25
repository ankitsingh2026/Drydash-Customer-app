import { useTheme } from "@/context/ThemeContext";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type CancelPickupConfirmModalProps = {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CancelPickupConfirmModal({
  visible,
  loading = false,
  onClose,
  onConfirm,
}: CancelPickupConfirmModalProps) {
  const { theme, isDark } = useTheme()
  const styles = makeStyles(theme, isDark);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Cancel Pickup?</Text>
          <Text style={styles.message}>
            Are you sure you want to cancel this pickup? You can reschedule it
            instead if needed.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.btn, styles.secondaryBtn]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.secondaryText}>Keep Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.dangerBtn]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.text} />
              ) : (
                <Text style={styles.dangerText}>Cancel Pickup</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.backdrop,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  sheet: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.card,
    backgroundColor: theme.background,
    padding: 16,
    gap: 10,
  },
  title: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
  },
  message: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  btn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  secondaryBtn: {
    borderColor: theme.lightborder,
    backgroundColor: theme.background,
  },
  dangerBtn: {
    borderColor: theme.error,
    backgroundColor: theme.danger,
  },
  secondaryText: {
    color: theme.text,
    fontWeight: "700",
    fontSize: 13,
  },
  dangerText: {
    color: theme.text,
    fontWeight: "700",
    fontSize: 13,
  },
});
