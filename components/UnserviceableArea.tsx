// components/UnserviceableArea.tsx
import { useAddress } from "@/context/AddressContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  StyleSheet, Text, TouchableOpacity, View, ScrollView,
} from "react-native";

const SERVED_AREAS = ["Delhi", "Gurgaon", "Noida", "Ghaziabad"];

export default function UnserviceableArea() {
  const { selectedAddress } = useAddress();

  const addressName = selectedAddress
    ? `${selectedAddress.line1?.split(",")[0]}, ${selectedAddress.city}`
    : "your area";

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand pill */}
      <View style={styles.brandPill}>
        <Text style={styles.brandPillText}>DRYDASH</Text>
      </View>

      {/* Icon cluster */}
      <View style={styles.iconWrapper}>
        <View style={styles.iconRing}>
          <Ionicons name="location-outline" size={44} color="#2FE6A6" style={{ opacity: 0.7 }} />
        </View>
        <View style={styles.crossBadge}>
          <Ionicons name="close" size={14} color="#FFF" />
        </View>
      </View>

      {/* Heading */}
      <Text style={styles.title}>We don't serve here yet</Text>
      <Text style={styles.subtitle}>
        Our shoe spa, laundry & dry cleaning services{"\n"}
        haven't reached{" "}
        <Text style={styles.addressHighlight}>{addressName}</Text>
        {"\n"}yet. We're expanding fast — stay tuned!
      </Text>

      {/* Served areas */}
      {/* <View style={styles.areasCard}>
        <Text style={styles.areasLabel}>WE CURRENTLY SERVE</Text>
        <View style={styles.pillsRow}>
          {SERVED_AREAS.map((area) => (
            <View key={area} style={styles.areaPill}>
              <Text style={styles.areaPillText}>{area}</Text>
            </View>
          ))}
        </View>
      </View> */}

      {/* Primary CTA */}
      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.85}
        onPress={() => router.push("/select-address-location")}
      >
        <Text style={styles.primaryButtonText}>Try a different pincode</Text>
      </TouchableOpacity>

      {/* Secondary CTA */}
      <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
        <Ionicons name="notifications-outline" size={16} color="#2FE6A6" style={{ opacity: 0.8 }} />
        <Text style={styles.secondaryButtonText}>Notify me when available</Text>
      </TouchableOpacity>

      {/* Trust badges */}
      <View style={styles.badges}>
        <View style={styles.badge}>
          <Ionicons name="time-outline" size={18} color="#4E7060" />
          <Text style={styles.badgeText}>24-hr delivery</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.badge}>
          <Ionicons name="shield-outline" size={18} color="#4E7060" />
          <Text style={styles.badgeText}>Eco-friendly</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.badge}>
          <Ionicons name="heart-outline" size={18} color="#4E7060" />
          <Text style={styles.badgeText}>100k+ happy Customers</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
    backgroundColor: "#031612",
  },
  brandPill: {
    backgroundColor: "rgba(47,230,166,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 28,
  },
  brandPillText: {
    color: "#2FE6A6",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  iconWrapper: {
    position: "relative",
    marginBottom: 28,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(47,230,166,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(47,230,166,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  crossBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FF4040",
    borderWidth: 2.5,
    borderColor: "#031612",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "#5E9080",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  addressHighlight: {
    color: "#8FB3A8",
    fontWeight: "600",
  },
  areasCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 0.5,
    borderColor: "rgba(47,230,166,0.12)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  areasLabel: {
    fontSize: 10,
    color: "#4E7060",
    letterSpacing: 1,
    fontWeight: "600",
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  areaPill: {
    backgroundColor: "rgba(47,230,166,0.08)",
    borderWidth: 0.5,
    borderColor: "rgba(47,230,166,0.2)",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  areaPillText: {
    color: "#2FE6A6",
    fontSize: 12,
    fontWeight: "500",
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#2FE6A6",
    paddingVertical: 15,
    borderRadius: 40,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#031612",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(47,230,166,0.18)",
    borderRadius: 40,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  secondaryButtonText: {
    color: "#2FE6A6",
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.85,
  },
  badges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  badge: {
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    color: "#4E7060",
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(47,230,166,0.1)",
  },
});