import { useTheme } from "@/context/ThemeContext";
import { Stack, router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const STEPS = [
  { icon: "📦", step: "01", label: "Place Order", desc: "Book anytime, anywhere" },
  { icon: "🧺", step: "02", label: "We Collect", desc: "Pickup from your door" },
  { icon: "⚡", step: "03", label: "Express Clean", desc: "Priority processing" },
  { icon: "🚀", step: "04", label: "8H Delivery", desc: "Back before you know it" },
];

export default function Express() {
  const { theme } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const boltAnim = useRef(new Animated.Value(0)).current;
  const stepAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const timerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.stagger(
      100,
      stepAnims.map((a, i) =>
        Animated.timing(a, { toValue: 1, duration: 400, delay: 400 + i * 120, useNativeDriver: true })
      )
    ).start();

    // Bolt bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(boltAnim, { toValue: -6, duration: 400, useNativeDriver: true }),
        Animated.timing(boltAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ])
    ).start();

    // Badge pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Timer countdown visual
    Animated.loop(
      Animated.timing(timerAnim, { toValue: 1, duration: 8000, useNativeDriver: false })
    ).start();
  }, []);

  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <Animated.View
        style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={theme.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Express Delivery</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <Animated.View
          style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Animated.Text
            style={[styles.heroIcon, { transform: [{ translateY: boltAnim }] }]}
          >
            ⚡
          </Animated.Text>
          <Text style={styles.heroTitle}>8 Hour Express</Text>
          <Text style={styles.heroSub}>Order now, delivered same day</Text>

          <Animated.View style={[styles.comingSoonBadge, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.badgeDot} />
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </Animated.View>
        </Animated.View>

        {/* Timer Visual */}
        <Animated.View style={[styles.timerCard, { opacity: fadeAnim }]}>
          <Text style={styles.timerLabel}>Guaranteed delivery within</Text>
          <View style={styles.timerRow}>
            {["08", ":", "00", ":", "00"].map((seg, i) => (
              <View key={i} style={seg === ":" ? styles.timerColon : styles.timerBlock}>
                <Text style={seg === ":" ? styles.timerColonText : styles.timerDigit}>{seg}</Text>
                {seg !== ":" && (
                  <Text style={styles.timerUnit}>{i === 0 ? "HRS" : i === 2 ? "MIN" : "SEC"}</Text>
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Coming Soon Card */}
        <Animated.View style={[styles.comingSoonCard, { opacity: fadeAnim }]}>
          <Text style={styles.cardTitle}>Lightning fast laundry ⚡</Text>
          <Text style={styles.cardDesc}>
            Drop it off or schedule a pickup — your freshly cleaned clothes will be back at your
            door within 8 hours. We're putting the final speed tests in place.
          </Text>
          <TouchableOpacity style={styles.notifyBtn} activeOpacity={0.8}>
            <Text style={styles.notifyBtnText}>🔔  Get Early Access</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* How it Works */}
        <Text style={styles.sectionTitle}>How It Works</Text>
        {STEPS.map((item, i) => (
          <Animated.View
            key={item.step}
            style={[
              styles.stepRow,
              {
                opacity: stepAnims[i],
                transform: [
                  {
                    translateX: stepAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-24, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.stepLeft}>
              <Text style={styles.stepEmoji}>{item.icon}</Text>
              {i < STEPS.length - 1 && <View style={styles.stepLine} />}
            </View>
            <View style={styles.stepContent}>
              <View style={styles.stepTopRow}>
                <Text style={styles.stepNumber}>STEP {item.step}</Text>
              </View>
              <Text style={styles.stepLabel}>{item.label}</Text>
              <Text style={styles.stepDesc}>{item.desc}</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, paddingTop: 52 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: theme.card ?? "#1e2e2b",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    hero: { alignItems: "center", paddingVertical: 28, paddingHorizontal: 24 },
    heroIcon: { fontSize: 64, marginBottom: 12 },
    heroTitle: {
      color: theme.text,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    heroSub: {
      color: theme.textSecondary ?? "#7a9e97",
      fontSize: 13,
      marginTop: 6,
      textAlign: "center",
    },
    comingSoonBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.primary + "22",
      borderWidth: 1.5,
      borderColor: theme.primary,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
      marginTop: 14,
    },
    badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.primary },
    comingSoonText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    timerCard: {
      marginHorizontal: 16,
      backgroundColor: theme.primary + "18",
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.primary + "40",
    },
    timerLabel: {
      color: theme.textSecondary ?? "#7a9e97",
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 14,
    },
    timerRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
    timerBlock: { alignItems: "center" },
    timerDigit: {
      color: theme.primary,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -1,
    },
    timerUnit: {
      color: theme.textSecondary ?? "#7a9e97",
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.5,
      marginTop: 2,
    },
    timerColon: { paddingBottom: 14 },
    timerColonText: {
      color: theme.primary,
      fontSize: 28,
      fontWeight: "800",
    },
    comingSoonCard: {
      marginHorizontal: 16,
      backgroundColor: theme.card ?? "#1a2e2a",
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.primary + "30",
    },
    cardTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
    },
    cardDesc: {
      color: theme.textSecondary ?? "#7a9e97",
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 16,
    },
    notifyBtn: {
      backgroundColor: theme.primary,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: "center",
    },
    notifyBtnText: { color: "#000", fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "700",
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    stepRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      marginBottom: 4,
    },
    stepLeft: { alignItems: "center", marginRight: 16, width: 44 },
    stepEmoji: { fontSize: 28, marginBottom: 4 },
    stepLine: {
      width: 2,
      flex: 1,
      backgroundColor: theme.primary + "30",
      marginBottom: 4,
      minHeight: 28,
    },
    stepContent: { flex: 1, paddingBottom: 20 },
    stepTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
    stepNumber: {
      color: theme.primary,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1,
    },
    stepLabel: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 3,
    },
    stepDesc: { color: theme.textSecondary ?? "#7a9e97", fontSize: 13 },
  });