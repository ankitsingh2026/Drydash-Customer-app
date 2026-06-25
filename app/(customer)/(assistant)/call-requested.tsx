import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    BackHandler,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";

/* ─── pulsing ring ─── */
function buildCallColors(theme: any, isDark: boolean) {
  return {
    bg: theme.background,
    card: theme.card,
    border: theme.border,
    primary: theme.primary,
    primaryDim: isDark ? theme.card : theme.background,
    text: theme.text,
    subText: theme.textSecondary,
    muted: theme.textSecondary,
  };
}

function PulseRing() {
  const { theme, isDark } = useTheme();
  const C = buildCallColors(theme, isDark);
  const styles = makeCallStyles(C);
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(v, { toValue: 1, duration: 1800, useNativeDriver: true }),
          ]),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    anim(ring1, 0).start();
    anim(ring2, 900).start();
  }, []);

  const ringStyle = (v: Animated.Value) => ({
    position: "absolute" as const,
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: C.primary,
    opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.5, 0] }),
    transform: [
      {
        scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }),
      },
    ],
  });

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={ringStyle(ring1)} />
      <Animated.View style={ringStyle(ring2)} />

      {/* center circle */}
      <LinearGradient
        colors={[C.primary + "33", C.primary + "11"]}
        style={styles.pulseCenter}
      >
        <View style={styles.pulseInner}>
          <Ionicons name="call" size={34} color={C.primary} />
        </View>
      </LinearGradient>
    </View>
  );
}

/* ─── screen ─── */
export default function CallRequested() {
    const { theme, isDark } = useTheme();
    const C = buildCallColors(theme, isDark);
  const styles = makeCallStyles(C);
  const fade  = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,   { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, friction: 9, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.replace("/(tabs)");
      return true;
    });
    return () => sub.remove();
  }, []);

  /* random support ID */
  const supportId = useRef(`ID: D0-${Math.floor(900 + Math.random() * 99)}-PX`).current;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Call Requested</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* body */}
        <Animated.View
          style={[
            styles.body,
            { opacity: fade, transform: [{ translateY: slideY }] },
          ]}
        >
          {/* pulse animation */}
          <PulseRing />

          {/* title */}
          <Text style={styles.title}>Call Requested!</Text>
          <Text style={styles.subtitle}>
            A specialist is reviewing your request and will contact you within{" "}
            <Text style={{ color: C.primary, fontWeight: "800" }}>5 minutes</Text>
          </Text>

          {/* status card */}
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Queue Active</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.supportId}>Support {supportId}</Text>
          </View>

          <View style={{ flex: 1 }} />

          {/* go home */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.replace("/(tabs)")}
            style={styles.homeOuter}
          >
            <LinearGradient
              colors={[C.primary, C.primaryDim]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.homeBtn}
            >
              <Text style={styles.homeBtnText}>Go to Home</Text>
              <Ionicons name="arrow-forward" size={18} color={C.bg} />
            </LinearGradient>
          </TouchableOpacity>

          {/* footer icons */}
          <View style={styles.footerIcons}>
            {(["shield-checkmark-outline", "happy-outline", "call-outline"] as const).map(
              (icon, i) => (
                <View key={i} style={styles.footerIcon}>
                  <Ionicons name={icon} size={20} color={C.muted} />
                </View>
              )
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const makeCallStyles = (C: ReturnType<typeof buildCallColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: C.text },

  body: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    paddingBottom: 32,
  },

  /* pulse */
  pulseContainer: {
    width: 160, height: 160,
    alignItems: "center", justifyContent: "center",
    marginTop: 24, marginBottom: 32,
  },
  pulseCenter: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: "center", justifyContent: "center",
  },
  pulseInner: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: C.card,
    borderWidth: 1.5, borderColor: C.primary + "50",
    alignItems: "center", justifyContent: "center",
    shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 20,
    elevation: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: C.text,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: C.subText,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },

  /* status */
  statusCard: {
    marginTop: 32,
    width: "100%",
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 8,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: C.subText,
    letterSpacing: 1.2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOpacity: 1, shadowRadius: 5,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "800",
    color: C.text,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 2,
  },
  supportId: {
    fontSize: 11,
    color: C.subText,
    fontWeight: "600",
  },

  /* home btn */
  homeOuter: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    marginBottom: 24,
  },
  homeBtn: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  homeBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: C.bg,
  },

  /* footer icons */
  footerIcons: {
    flexDirection: "row",
    gap: 28,
    alignItems: "center",
  },
  footerIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
});