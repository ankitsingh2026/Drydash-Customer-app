import { useTheme } from "@/context/ThemeContext";
import { Stack, router } from "expo-router";
import { ArrowLeft, Clock, MapPin, ShieldCheck, Sparkles } from "lucide-react-native";
import { useEffect, useRef } from "react";
import OnsiteIcon from "../../../assets/homeicons/on-site.svg";
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

const PERKS = [
  {
    icon: "🏠",
    label: "Zero Commute",
    desc: "We come to you — no trips, no hassle",
  },
  {
    icon: "⏰",
    label: "Time Slots",
    desc: "Book morning, afternoon or evening",
  },
  {
    icon: "👕",
    label: "All Garments",
    desc: "Shirts, suits, dresses & more",
  },
  {
    icon: "🔒",
    label: "Insured Service",
    desc: "Every item fully covered",
  },
  {
    icon: "💬",
    label: "Live Updates",
    desc: "Track your expert in real time",
  },
  {
    icon: "⭐",
    label: "Top Rated",
    desc: "Verified & background-checked pros",
  },
];

export default function Onsite() {
  const { theme } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const perkAnims = useRef(PERKS.map(() => new Animated.Value(0))).current;
  const ringAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.stagger(
      90,
      perkAnims.map((a, i) =>
        Animated.timing(a, { toValue: 1, duration: 380, delay: 350 + i * 100, useNativeDriver: true })
      )
    ).start();

    // Float house icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1600, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1600, useNativeDriver: true }),
      ])
    ).start();

    // Badge pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Ring expand
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1.4, duration: 1200, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
      ])
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
        <Text style={styles.headerTitle}>Onsite Service</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <Animated.View
          style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Animated rings */}
          <View style={styles.ringContainer}>
            <Animated.View
              style={[
                styles.ring,
                styles.ringOuter,
                { transform: [{ scale: ringAnim }], opacity: ringAnim.interpolate({ inputRange: [1, 1.4], outputRange: [0.4, 0] }) },
              ]}
            />
            <View style={[styles.ring, styles.ringMid]} />
           
           
              <OnsiteIcon width={100} height={100} />
           
          </View>

          <Text style={styles.heroTitle}>Onsite Service</Text>
          <Text style={styles.heroSub}>We come to your door • No travel needed</Text>

          <Animated.View style={[styles.comingSoonBadge, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.badgeDot} />
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </Animated.View>
        </Animated.View>

        {/* Coming Soon Card */}
        <Animated.View style={[styles.comingSoonCard, { opacity: fadeAnim }]}>
          <Text style={styles.cardTitle}>Your home. Our expertise. 🏠</Text>
          <Text style={styles.cardDesc}>
            Our certified cleaning professionals will arrive at your doorstep with all the
            equipment needed. Sit back and relax while we handle everything on-site.
          </Text>
          <View style={styles.cardRow}>
            <TouchableOpacity style={styles.notifyBtn} activeOpacity={0.8}>
              <Text style={styles.notifyBtnText}>🔔  Notify Me</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.learnBtn} activeOpacity={0.8}>
              <Text style={styles.learnBtnText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Perks Grid */}
        <Text style={styles.sectionTitle}>Why Onsite?</Text>
        <View style={styles.perksGrid}>
          {PERKS.map((item, i) => (
            <Animated.View
              key={item.label}
              style={[
                styles.perkCard,
                {
                  opacity: perkAnims[i],
                  transform: [
                    {
                      scale: perkAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.perkIcon}>{item.icon}</Text>
              <Text style={styles.perkLabel}>{item.label}</Text>
              <Text style={styles.perkDesc}>{item.desc}</Text>
            </Animated.View>
          ))}
        </View>
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
      backgroundColor: theme.card ?? theme.card,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      color: theme.text,
      fontSize: 17,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    hero: { alignItems: "center", paddingTop: 24, paddingBottom: 28, paddingHorizontal: 24 },
    ringContainer: {
      width: 120,
      height: 120,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    ring: {
      position: "absolute",
      borderRadius: 999,
      borderWidth: 1.5,
      borderColor: theme.primary + "40",
    },
    ringOuter: { width: 120, height: 120 },
    ringMid: { width: 100, height: 100 },
    heroIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.primary + "22",
      borderWidth: 2,
      borderColor: theme.primary + "55",
      alignItems: "center",
      justifyContent: "center",
    },
    heroIcon: { fontSize: 38 },
    heroTitle: {
      color: theme.text,
      fontSize: 26,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    heroSub: {
      color: theme.textSecondary ?? theme.textSecondary,
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
    comingSoonCard: {
      marginHorizontal: 16,
      backgroundColor: theme.card ?? theme.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.primary + "30",
    },
    cardTitle: { color: theme.text, fontSize: 16, fontWeight: "700", marginBottom: 8 },
    cardDesc: {
      color: theme.textSecondary ?? theme.textSecondary,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 16,
    },
    cardRow: { flexDirection: "row", gap: 10 },
    notifyBtn: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: "center",
    },
    notifyBtnText: { color: theme.background, fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },
    learnBtn: {
      flex: 1,
      backgroundColor: theme.primary + "18",
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.primary + "40",
    },
    learnBtnText: { color: theme.primary, fontWeight: "700", fontSize: 14, letterSpacing: 0.3 },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "700",
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    perksGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 12,
      gap: 10,
    },
    perkCard: {
      width: (width - 44) / 2,
      backgroundColor: theme.card ?? theme.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.primary + "20",
    },
    perkIcon: { fontSize: 26, marginBottom: 8 },
    perkLabel: { color: theme.text, fontSize: 14, fontWeight: "700", marginBottom: 3 },
    perkDesc: { color: theme.textSecondary ?? theme.textSecondary, fontSize: 12, lineHeight: 16 },
  });