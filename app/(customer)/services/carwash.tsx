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

const FEATURES = [
  { icon: "🚿", label: "Exterior Wash", desc: "Full body foam wash" },
  { icon: "✨", label: "Interior Clean", desc: "Vacuum & wipe down" },
  { icon: "💧", label: "Wax & Polish", desc: "Shine protection coat" },
  { icon: "🪟", label: "Window Clean", desc: "Crystal clear glass" },
];

export default function CarWash() {
  const { theme } = useTheme();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Staggered card animations
    const cardSequence = cardAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 300 + i * 100,
        useNativeDriver: true,
      })
    );
    Animated.stagger(80, cardSequence).start();

    // Pulse badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Header */}
      <Animated.View
        style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={theme.text} size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Wash</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <Animated.View
          style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.heroIconCircle}>
            <Text style={styles.heroIcon}>🚗</Text>
          </View>
          <Text style={styles.heroTitle}>Car Wash</Text>
          <Text style={styles.heroSub}>At-home service • Doorstep convenience</Text>

          {/* Coming Soon Badge */}
          <Animated.View style={[styles.comingSoonBadge, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.badgeDot} />
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </Animated.View>
        </Animated.View>

        {/* Coming Soon Card */}
        <Animated.View style={[styles.comingSoonCard, { opacity: fadeAnim }]}>
          <Text style={styles.comingSoonCardTitle}>We're detailing the details 🔧</Text>
          <Text style={styles.comingSoonCardDesc}>
            Our at-home car wash service is being polished to perfection. Get notified the moment
            it's ready and be the first to book!
          </Text>
          <TouchableOpacity style={styles.notifyBtn} activeOpacity={0.8}>
            <Text style={styles.notifyBtnText}>🔔  Notify Me</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Features */}
        <Text style={styles.sectionTitle}>What's Included</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((item, i) => (
            <Animated.View
              key={item.label}
              style={[
                styles.featureCard,
                {
                  opacity: cardAnims[i],
                  transform: [
                    {
                      translateY: cardAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.featureIcon}>{item.icon}</Text>
              <Text style={styles.featureLabel}>{item.label}</Text>
              <Text style={styles.featureDesc}>{item.desc}</Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 52,
    },
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
    hero: {
      alignItems: "center",
      paddingVertical: 32,
      paddingHorizontal: 24,
    },
    heroIconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.primary + "22",
      borderWidth: 2,
      borderColor: theme.primary + "44",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    heroIcon: { fontSize: 44 },
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
      marginTop: 16,
    },
    badgeDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    comingSoonText: {
      color: theme.primary,
      fontSize: 13,
      fontWeight: "700",
      letterSpacing: 0.5,
      textTransform: "uppercase",
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
    comingSoonCardTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 8,
    },
    comingSoonCardDesc: {
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
    notifyBtnText: {
      color: "#000",
      fontWeight: "700",
      fontSize: 14,
      letterSpacing: 0.3,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "700",
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    featuresGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: 12,
      gap: 10,
    },
    featureCard: {
      width: (width - 44) / 2,
      backgroundColor: theme.card ?? "#1a2e2a",
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.primary + "20",
    },
    featureIcon: { fontSize: 28, marginBottom: 8 },
    featureLabel: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 3,
    },
    featureDesc: {
      color: theme.textSecondary ?? "#7a9e97",
      fontSize: 12,
    },
  });