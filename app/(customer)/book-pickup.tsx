import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

const TIME_SLOTS = [
  "9:00 – 11:00 AM",
  "11:00 – 1:00 PM",
  "2:00 – 4:00 PM",
  "4:00 – 6:00 PM",
];

export default function BookPickup() {
  const { theme, isDark } = useTheme();

  const [slot, setSlot] = useState(3);
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("Home Address (Saved)");

  
  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.stackHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={26}
              color={theme.primary}
            />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Book Pickup
          </Text>

          <View style={{ width: 26 }} />
        </View>

        {/* TITLE */}
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: theme.primary }]}>
            SCHEDULE SERVICE
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            Pickup Details
          </Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Choose pickup time and address
          </Text>
        </View>

        {/* PICKUP TIME */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardHeading, { color: theme.text }]}>
            Pickup Time
          </Text>

          <View style={styles.slotWrap}>
            {TIME_SLOTS.map((t, i) => {
              const active = slot === i;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setSlot(i)}
                  style={[
                    styles.slot,
                    {
                      backgroundColor: active
                        ? theme.primary
                        : isDark
                        ? "#0B1220"
                        : "#F1F5F9",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      fontSize: 12,
                      color: active ? "#000" : theme.text,
                    }}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ADDRESS */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardHeading, { color: theme.text }]}>
            Pickup Address
          </Text>

          <View style={styles.addressRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color={theme.primary}
            />
            <Text style={{ color: theme.text, fontWeight: "700" }}>
              {address}
            </Text>
          </View>

          <TextInput
            placeholder="Enter Pincode"
            placeholderTextColor={theme.subText}
            keyboardType="number-pad"
            value={pincode}
            onChangeText={setPincode}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? "#0B1220" : "#F1F5F9",
                color: theme.text,
              },
            ]}
          />

          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: theme.border }]}
          >
            <Text style={{ color: theme.primary, fontWeight: "700" }}>
              Fetch Address
            </Text>
          </TouchableOpacity>
        </View>


        {/* CTA */}
        <View style={styles.bottom}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.primaryText}>Confirm Pickup</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.cancel, { color: theme.subText }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ---------- SMALL COMPONENT ---------- */
function Info({ icon, label, theme }: any) {
  return (
    <View style={{ alignItems: "center" }}>
      <Ionicons name={icon} size={22} color={theme.primary} />
      <Text
        style={{
          color: theme.subText,
          fontSize: 12,
          marginTop: 6,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 40 },

  stackHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 16, fontWeight: "800" },

  header: { marginBottom: 28 },
  kicker: { fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { marginTop: 6, fontSize: 14 },

  card: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
  },
  cardHeading: { fontSize: 15, fontWeight: "800", marginBottom: 12 },

  slotWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  slot: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  input: {
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  secondaryBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 18,
  },

  bottom: { marginTop: "auto", paddingBottom: 60 },
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#000", fontSize: 16, fontWeight: "900" },
  cancel: { textAlign: "center", fontSize: 14, marginTop: 16 },
});
