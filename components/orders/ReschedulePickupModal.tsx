import DateTimePicker, {
    DateTimePickerAndroid,
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type ReschedulePickupModalProps = {
  visible: boolean;
  initialDate?: string | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (newDate: string) => void;
};

const toDefaultDate = (source?: string | null) => {
  const base = source ? new Date(source) : new Date();
  if (Number.isNaN(base.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    return fallback;
  }

  if (!source) {
    base.setDate(base.getDate() + 1);
  }

  return base;
};

const formatDateInput = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export default function ReschedulePickupModal({
  visible,
  initialDate,
  loading = false,
  onClose,
  onConfirm,
}: ReschedulePickupModalProps) {
  const defaultDate = useMemo(() => toDefaultDate(initialDate), [initialDate]);

  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [showIosPicker, setShowIosPicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const resetDate = toDefaultDate(initialDate);
    setSelectedDate(resetDate);
    setShowIosPicker(false);
  }, [visible, initialDate]);

  const minimumDate = new Date();

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "dismissed") return;
    if (date) setSelectedDate(date);
  };

  const openPicker = () => {
    if (loading) return;

    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        value: selectedDate,
        minimumDate,
        onChange: handleDateChange,
      });
      return;
    }

    setShowIosPicker((prev) => !prev);
  };

  const submit = () => {
    onConfirm(formatDateInput(selectedDate));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Reschedule Pickup</Text>
          <Text style={styles.message}>
            Select the new pickup date for this order.
          </Text>

          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Pickup Date</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={openPicker}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.dateValue}>{formatDateInput(selectedDate)}</Text>
              <View style={styles.dateIconWrap}>
                <Text style={styles.dateIconText}>📅</Text>
              </View>
            </TouchableOpacity>

            {Platform.OS === "ios" && showIosPicker ? (
              <View style={styles.iosPickerWrap}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                 display="spinner"
                  minimumDate={minimumDate}
                  onChange={handleDateChange}
                  textColor="#fff"
                  accentColor="#29E6B0"
                />
              </View>
            ) : null}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.btn, styles.secondaryBtn]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.secondaryText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.primaryBtn]}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#00382D" />
              ) : (
                <Text style={styles.primaryText}>Update Pickup</Text>
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
  inputBlock: {
    gap: 6,
  },
  inputLabel: {
    color: "#9CCFC0",
    fontSize: 12,
    fontWeight: "600",
  },
  dateSelector: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#23453E",
    backgroundColor: "#122D27",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateValue: {
    color: "#D4F7EC",
    fontSize: 13,
    fontWeight: "600",
  },
  dateIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A4F45",
    backgroundColor: "#123329",
    alignItems: "center",
    justifyContent: "center",
  },
  dateIconText: {
    fontSize: 14,
  },
  iosPickerWrap: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#23453E",
    overflow: "hidden",
    backgroundColor: "#122D27",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
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
  primaryBtn: {
    borderColor: "#2A715D",
    backgroundColor: "#29E6B0",
  },
  secondaryText: {
    color: "#A5F5D7",
    fontWeight: "700",
    fontSize: 13,
  },
  primaryText: {
    color: "#00382D",
    fontWeight: "800",
    fontSize: 13,
  },
});
