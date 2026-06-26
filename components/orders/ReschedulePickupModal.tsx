import { useTheme } from "@/context/ThemeContext";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import SlotPicker from "@/components/SlotPicker";
import { useAddress } from "@/context/AddressContext";

type ReschedulePickupModalProps = {
  visible: boolean;
  /** currently scheduled date (yyyy-mm-dd) */
  initialDate?: string | null;
  loading?: boolean;
  onClose: () => void;
  /** callback must receive new date (yyyy-mm-dd). If you also want slot, update signature in parent. */
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

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getNextDays(count: number) {
  const days: Date[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function ReschedulePickupModal({
  visible,
  initialDate,
  loading = false,
  onClose,
  onConfirm,
}: ReschedulePickupModalProps) {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);

  const defaultDate = useMemo(() => toDefaultDate(initialDate), [initialDate]);
  const [selectedDate, setSelectedDate] = useState(defaultDate);

  const [showIosPicker, setShowIosPicker] = useState(false);
  const minimumDate = new Date();

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(-1);
  const [selectedSlotData, setSelectedSlotData] = useState<any>(null);
  const [hasAvailableSlots, setHasAvailableSlots] = useState(true);

  // Use pickup address to resolve zone & fetch slots.
  const {
    selectedAddress: contextSelectedAddress,
    serviceData,
    zoneData,
  } = useAddress();

  useEffect(() => {
    if (!visible) return;

    const resetDate = toDefaultDate(initialDate);
    setSelectedDate(resetDate);

    // reset slot when date changes / modal opens
    setSelectedSlotIndex(-1);
    setSelectedSlotData(null);
    setHasAvailableSlots(true);

    setShowIosPicker(false);
  }, [visible, initialDate]);

  const selectedLat = contextSelectedAddress?.latitude;
  const selectedLng = contextSelectedAddress?.longitude;

  const nextDays = useMemo(() => getNextDays(21), []);

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "dismissed") return;
    if (date) {
      setSelectedDate(date);
      setSelectedSlotIndex(-1);
      setSelectedSlotData(null);
      setHasAvailableSlots(true);
    }
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
    // You currently only pass date back per prop signature.
    // Parent can optionally re-fetch the slot by calling slot time from API.
    onConfirm(formatDateInput(selectedDate));
  };

  const canSubmit =
    !loading && selectedSlotIndex !== -1 && !!hasAvailableSlots && !selectedSlotData?.availableCapacity?.toString()?.includes("0");

  const slotDateForApi = formatDateInput(selectedDate);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={styles.title}>Reschedule Pickup</Text>
              <Text style={styles.message}>
                Choose a date and then pick an available pickup slot.
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.iconClose}
            >
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pickup Date</Text>

            <TouchableOpacity
              style={styles.dateSelector}
              onPress={openPicker}
              disabled={loading}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={styles.calIcon}>
                  <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                </View>
                <Text style={styles.dateValue}>{formatDateInput(selectedDate)}</Text>
              </View>

              <Ionicons
                name={showIosPicker ? "chevron-up" : "chevron-down"}
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>

            {Platform.OS === "ios" && showIosPicker ? (
              <View style={styles.iosPickerWrap}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                 display="spinner"
                  minimumDate={minimumDate}
                  onChange={handleDateChange}
                  textColor={theme.text}
                  accentColor={theme.primary}
                />
              </View>
            ) : null}

            {/* Quick date chips (professional & fast UX) */}
            <View style={styles.quickDaysHeader}>
              <Text style={styles.quickDaysLabel}>
                Or choose quickly
              </Text>
              <Text style={styles.quickDaysSub}>
                {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 10 }}
              contentContainerStyle={{ paddingRight: 4 }}
            >
              {Array.from(
                new Set([
                  defaultDate.getTime(),
                  ...nextDays.map((x) => x.getTime()),
                ]),
              )
                .map((t) => new Date(t))
                // Deduplicate by yyyy-mm-dd to avoid same-day duplicates
                .filter(
                  (d, i, arr) =>
                    arr.findIndex(
                      (x) => formatDateInput(x) === formatDateInput(d),
                    ) === i,
                )
                // ensure selected date is visible (and first) if present
                .sort((a, b) => {
                  const aSel = formatDateInput(a) === formatDateInput(selectedDate);
                  const bSel = formatDateInput(b) === formatDateInput(selectedDate);
                  if (aSel === bSel) return 0;
                  return aSel ? -1 : 1;
                })
                .slice(0, 7)
                .map((d) => {
                  const isSelected = formatDateInput(d) === formatDateInput(selectedDate);
                  return (
                    <TouchableOpacity
                      key={formatDateInput(d)}
                      onPress={() => {
                        setSelectedDate(d);
                        setSelectedSlotIndex(-1);
                        setSelectedSlotData(null);
                        setHasAvailableSlots(true);
                      }}
                      activeOpacity={0.85}
                      style={{ marginRight: 10 }}
                    >
                      <View
                        style={[
                          styles.dateChip,
                          {
                            borderColor: isSelected ? theme.primary : theme.border,
                            backgroundColor: isSelected
                              ? theme.inputBackground
                              : theme.card,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateChipDay,
                            {
                              color: isSelected
                                ? theme.primary
                                : theme.textSecondary,
                            },
                          ]}
                        >
                          {DAY_NAMES[d.getDay()]}
                        </Text>
                        <Text
                          style={[
                            styles.dateChipNum,
                            { color: theme.text },
                          ]}
                        >
                          {d.getDate()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>

          {/* Slots */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Available Slots</Text>

            {selectedLat && selectedLng ? (
              <SlotPicker
                lat={selectedLat}
                lng={selectedLng}
                zoneId={zoneData?.zoneId}
                date={slotDateForApi}
                selectedSlot={selectedSlotIndex}
                onSelect={(index, slot) => {
                  setSelectedSlotIndex(index);
                  setSelectedSlotData(slot);
                }}
                onSlotsUpdate={(slots: any[]) => {
                  const available = slots.some(
                    (s) =>
                      s.enabled &&
                      s.status !== "expired" &&
                      (s.availableCapacity ?? 0) > 0,
                  );
                  setHasAvailableSlots(available);
                }}
              />
            ) : (
              <View style={styles.noSlotBox}>
                <View style={styles.noSlotIconWrap}>
                  <Ionicons name="location-outline" size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.noSlotTitle}>Location Required</Text>
                  <Text style={styles.noSlotSub}>
                    Select pickup location to view slot availability.
                  </Text>
                </View>
              </View>
            )}

            {hasAvailableSlots && selectedSlotData?.availableCapacity === 0 ? (
              <Text style={styles.warningText}>Selected slot is fully booked.</Text>
            ) : null}
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.btn, styles.secondaryBtn]}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.secondaryText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.primaryBtn,
                { opacity: canSubmit ? 1 : 0.55 },
              ]}
              onPress={submit}
              disabled={!canSubmit}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.background} />
              ) : (
                <Text style={styles.primaryText}>Update Date</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.backdrop,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 18,
    },
    sheet: {
      width: "100%",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.card,
      backgroundColor: theme.background,
      padding: 16,
      gap: 12,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    title: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "900",
      letterSpacing: 0.2,
    },
    message: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
    },
    iconClose: {
      width: 36,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
    },

    section: {
      gap: 10,
      paddingVertical: 2,
    },
    sectionLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.5,
    },

    dateSelector: {
      height: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    calIcon: {
      width: 30,
      height: 30,
      borderRadius: 10,
      backgroundColor: theme.inputBackground,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    dateValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "900",
    },
    iosPickerWrap: {
      marginTop: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.card,
      overflow: "hidden",
      backgroundColor: theme.background,
    },

    quickDaysHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    quickDaysLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "800",
    },
    quickDaysSub: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "800",
    },

    dateChip: {
      width: 62,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.card,
    },
    dateChipDay: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.4,
    },
    dateChipNum: {
      marginTop: 4,
      fontSize: 22,
      fontWeight: "900",
    },

    noSlotBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
      gap: 12,
      marginTop: 6,
    },
    noSlotIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    noSlotTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
    },
    noSlotSub: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 4,
      lineHeight: 18,
    },

    actionsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 2,
    },

    btn: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    secondaryBtn: {
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    primaryBtn: {
      borderColor: theme.border,
      backgroundColor: theme.primary,
    },
    secondaryText: {
      color: theme.text,
      fontWeight: "800",
      fontSize: 13,
    },
    primaryText: {
      color: theme.background,
      fontWeight: "900",
      fontSize: 13,
    },

    warningText: {
      marginTop: 8,
      color: "#FFB86B",
      fontWeight: "800",
      fontSize: 12,
    },
  });

