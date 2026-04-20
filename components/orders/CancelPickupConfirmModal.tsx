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
                <ActivityIndicator size="small" color="#fff" />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  sheet: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1A3330",
    backgroundColor: "#0D1F1C",
    padding: 16,
    gap: 10,
  },
  title: {
    color: "#E9F8F3",
    fontSize: 18,
    fontWeight: "800",
  },
  message: {
    color: "#8FB5A9",
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
    borderColor: "#2A4F45",
    backgroundColor: "#123329",
  },
  dangerBtn: {
    borderColor: "#7A2E36",
    backgroundColor: "#6A2430",
  },
  secondaryText: {
    color: "#A5F5D7",
    fontWeight: "700",
    fontSize: 13,
  },
  dangerText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13,
  },
});
