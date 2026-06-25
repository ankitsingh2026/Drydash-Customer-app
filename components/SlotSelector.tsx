import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "@/lib/api/client";
import { useTheme } from "../context/ThemeContext";

interface Slot {
  time: string;
  isActive: boolean;
  enabled: boolean;
  availableCapacity?: number;
  status?: string;
}

interface SlotSelectorProps {
  lat: number;
  lng: number;
  onSlotSelect?: (slot: Slot | null) => void;
}

export const SlotSelector: React.FC<SlotSelectorProps> = ({ lat, lng, onSlotSelect }) => {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);

  useEffect(() => {
    const fetchZone = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${BASE_URL}/api/v1/slots/location/resolve?lat=${lat}&lng=${lng}`
        );
        const data = await res.json();
        setZone(data);

        if (data.zoneFound) {
          const serviceRes = await fetch(
            `${BASE_URL}/api/v1/slots/service/check`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ zoneId: data.zoneId }),
            }
          );
          const serviceData = await serviceRes.json();
          setService(serviceData);
        } else {
          setService(null);
        }
      } catch (e) {
        setZone(null);
        setService(null);
      }
      setLoading(false);
    };
    fetchZone();
  }, [lat, lng]);

  const slots: Slot[] = service?.data?.allSlots || [];
  const noSlots = slots.length === 0;
  const serviceAvailable = zone?.zoneFound && service?.serviceAvailable;

  useEffect(() => {
    if (onSlotSelect) {
      if (selectedSlotIdx !== null && slots[selectedSlotIdx]) {
        onSlotSelect(slots[selectedSlotIdx]);
      } else {
        onSlotSelect(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlotIdx]);

  if (loading) {
    return <ActivityIndicator color={theme.primary} />;
  }

  if (!zone?.zoneFound) {
    return (
      <View style={styles.noSlotBox}>
        <Ionicons name="alert-circle-outline" size={18} color="#FFD600" />
        <Text style={styles.noSlotText}>
          {zone?.message || "Location not within any service zone"}
        </Text>
      </View>
    );
  }

  if (noSlots) {
    return (
      <View style={styles.noSlotBox}>
        <Ionicons name="alert-circle-outline" size={18} color="#FFD600" />
        <Text style={styles.noSlotText}>No Pickup Slots Available for Today</Text>
        <Text style={styles.noSlotSubText}>
          High demand in your area. Please check after some time or schedule for next day.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.slotRow}>
      {slots.map((slot, idx) => (
        <TouchableOpacity
          key={slot.time}
          style={[
            styles.slotBtn,
            slot.isActive && styles.slotActive,
            selectedSlotIdx === idx && styles.slotSelected,
            !slot.enabled && styles.slotDisabled,
          ]}
          disabled={!slot.enabled}
          onPress={() => setSelectedSlotIdx(idx)}
        >
          <Text
            style={[
              styles.slotText,
              slot.isActive && { color: "#FFD600" },
              !slot.enabled && { color: theme.textSecondary },
            ]}
          >
            {slot.time}
          </Text>
          {slot.isActive && <Text style={styles.fillingFast}>Filling fast</Text>}
          {slot.enabled && slot.availableCapacity !== undefined && (
            <Text style={styles.slotCapacity}>{slot.availableCapacity} slots left</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const makeStyles = (theme: any, isDark?: boolean) => StyleSheet.create({
  slotRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slotBtn: {
    minWidth: 120,
    padding: 12,
    borderRadius: 10,
    backgroundColor: theme.background,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.card,
  },
  slotActive: { borderColor: "#FFD600" },
  slotSelected: { borderColor: theme.primary, backgroundColor: theme.background },
  slotDisabled: { backgroundColor: theme.card },
  slotText: { color: theme.text, fontWeight: "700" },
  fillingFast: { color: "#FFD600", fontSize: 12, marginTop: 2 },
  slotCapacity: { color: theme.primary, fontSize: 12, marginTop: 2 },
  noSlotBox: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  noSlotText: { color: "#FFD600", fontWeight: "700", marginTop: 6 },
  noSlotSubText: { color: theme.textSecondary, fontSize: 12, marginTop: 4, textAlign: "center" },
});
