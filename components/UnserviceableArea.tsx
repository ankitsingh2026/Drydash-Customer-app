import { useTheme } from "../context/ThemeContext";
// components/UnserviceableArea.tsx
import { useAddress } from "@/context/AddressContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SERVED_AREAS = [
  { name: "Delhi", latitude: 28.6139, longitude: 77.209, icon: "business-outline" as const },
  { name: "Gurugram", latitude: 28.4595, longitude: 77.0266, icon: "location-outline" as const },
  { name: "Noida", latitude: 28.5355, longitude: 77.391, icon: "storefront-outline" as const },
];

export default function UnserviceableArea() {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);
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
          <Ionicons name="location-outline" size={44} color={theme.primary} style={{ opacity: 0.7 }} />
        </View>
        <View style={styles.crossBadge}>
          <Ionicons name="close" size={14} color={theme.text} />
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
      <ServedAreasCard theme={theme} isDark={isDark} />

      {/* Primary CTA */}
      <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
        <Text style={styles.primaryButtonText}>Try a different pincode</Text>
      </TouchableOpacity>

      {/* Secondary CTA */}
      <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
        <Ionicons name="notifications-outline" size={16} color={theme.primary} style={{ opacity: 0.8 }} />
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

/* ------------------------------------------------------------------ */
/*  "We currently serve" — redesigned card                            */
/* ------------------------------------------------------------------ */

type Area = { name: string; latitude: number; longitude: number; icon: keyof typeof Ionicons.glyphMap };

function ServedAreasCard({
  theme,
  isDark,
}: {
  theme: any;
  isDark?: boolean;
}) {
  const styles = makeStyles(theme, isDark);

  // one Animated.Value pair (opacity + translateY) per area, for staggered entrance
  const anims = useRef(SERVED_AREAS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      110,
      anims.map((val) =>
        Animated.spring(val, {
          toValue: 1,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  return (
    <View style={styles.areasCard}>
      <View style={styles.areasHeaderRow}>
        <View style={styles.liveDot} />
        <Text style={styles.areasLabel}>WE CURRENTLY SERVE</Text>
      </View>

      <View style={styles.areasList}>
        {SERVED_AREAS.map((area, i) => (
          <Animated.View
            key={area.name}
            style={{
              opacity: anims[i],
              transform: [
                {
                  translateY: anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
                {
                  scale: anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.92, 1],
                  }),
                },
              ],
            }}
          >
            <AreaCard area={area} theme={theme} isDark={isDark} />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function AreaCard({
  area,
  theme,
  isDark,
}: {
  area: Area;
  theme: any;
  isDark?: boolean;
}) {
  const styles = makeStyles(theme, isDark);

  return (
    <LinearGradient
      colors={
        isDark
          ? ["#1F2A22", "#182019"]
          : ["#F3FAF6", "#E7F5ED"]
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.areaCard}
    >
      <View style={styles.areaIconCircle}>
        <Ionicons name={area.icon} size={18} color={theme.primary} />
      </View>

      <View style={styles.areaTextWrap}>
        <Text style={styles.areaCardTitle}>{area.name}</Text>
        <View style={styles.areaStatusRow}>
          <View style={styles.areaStatusDot} />
          <Text style={styles.areaStatusText}>Serving now</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const makeStyles = (theme: any, isDark?: boolean) => StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
    backgroundColor: theme.background,
  },
  brandPill: {
    backgroundColor: theme.card,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 28,
  },
  brandPillText: {
    color: theme.primary,
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
    backgroundColor: theme.card,
    borderWidth: 1.5,
    borderColor: theme.card,
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
    backgroundColor: "#FF6B6B",
    borderWidth: 2.5,
    borderColor: theme.background,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.text,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  addressHighlight: {
    color: theme.textSecondary,
    fontWeight: "600",
  },

  /* ---------- served areas card ---------- */
  areasCard: {
    width: "100%",
    backgroundColor: theme.card,
    borderWidth: 0.5,
    borderColor: theme.lightborder,
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: isDark ? 0.25 : 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  areasHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3FBE7A",
  },
  areasLabel: {
    fontSize: 10,
    color: "#4E7060",
    letterSpacing: 1,
    fontWeight: "700",
  },
  areasList: {
    gap: 10,
  },
  areaCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 0.5,
    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
  },
  areaIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  areaTextWrap: {
    flex: 1,
  },
  areaCardTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 3,
  },
  areaStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  areaStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#3FBE7A",
  },
  areaStatusText: {
    fontSize: 11,
    color: "#4E7060",
    fontWeight: "500",
  },
  primaryButton: {
    width: "100%",
    backgroundColor: theme.primary,
    paddingVertical: 15,
    borderRadius: 40,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: theme.background,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: theme.lightborder,
    borderRadius: 40,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 32,
  },
  secondaryButtonText: {
    color: theme.primary,
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
    backgroundColor: theme.card,
  },
});