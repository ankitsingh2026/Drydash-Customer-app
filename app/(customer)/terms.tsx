import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Animated,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ANIM_DURATION = 220;

type Section = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  bullets: string[];
  accent?: boolean;
};

const SECTIONS: Section[] = [
  {
    icon: "information-circle-outline",
    title: "General Terms",
    bullets: [
      "By using DryDash, you agree to comply with all listed service guidelines and legal regulations.",
      "Users must be at least 18 years of age or have legal parental consent to create an account.",
    ],
  },
  {
    icon: "shield-checkmark-outline",
    title: "Service Policy",
    bullets: [
      "Our laundry and shoe cleaning services are subject to the following professional standards:",
      "Items are inspected upon arrival; any existing damage will be documented and shared via the app.",
      "DryDash uses eco-friendly premium cleaning agents specifically chosen for delicate fabrics and shoe materials.",
      "Turnaround times are estimates and may vary based on material complexity or peak demand periods.",
    ],
  },
  {
    icon: "car-sport-outline",
    title: "Pickup & Delivery",
    bullets: [
      'Drivers will wait for a maximum of 10 minutes at the designated location before marking a "no-show".',
      "Contactless pickup and delivery options are available via settings in the mobile application.",
    ],
  },
  {
    icon: "card-outline",
    title: "Pricing & Payment",
    bullets: [
      "Payments are processed securely via integrated third-party providers. No card data is stored on our servers.",
      "Final pricing is confirmed after item inspection; any discrepancies will be notified via push notification.",
    ],
  },
  {
    icon: "warning-outline",
    title: "Damage & Liability",
    bullets: [
      "Liability for lost or damaged items is limited to 2x the cleaning price of that specific item.",
      "Claims must be filed within 24 hours of delivery with photographic evidence of the issue.",
    ],
  },
  {
    icon: "person-outline",
    title: "Customer Responsibility",
    bullets: [
      "Customers must check all pockets and remove jewelry or loose items prior to pickup.",
      "Accurate labeling of delicate items or specific washing instructions must be provided in-app.",
    ],
  },
  {
    icon: "lock-closed-outline",
    title: "Privacy Policy",
    bullets: [
      "We collect minimal personal data required to provide and improve our specialized laundry services.",
      "Location data is used solely for the duration of active pickup or delivery logistics tracking.",
    ],
  },
  {
    icon: "shield-outline",
    title: "Guaranteed Cloth Protection Program",
    subtitle: "Signature Security",
    accent: true,
    bullets: [
      "2X Refund Protection: Full reimbursement up to four times the service cost for any documented loss.",
      "Free Re-processing: Not satisfied with the finish? We provide complimentary re-processing within 48 hours.",
      "30-Day Window: Extended claim window to ensure your complete peace of mind after delivery.",
    ],
  },
];

function AccordionCard({
  section,
  expanded,
  onPress,
  colors,
}: {
  section: Section;
  expanded: boolean;
  onPress: () => void;
  colors: {
    bg: string;
    card: string;
    card2: string;
    border: string;
    primary: string;
    primarySoft: string;
    text: string;
    subText: string;
    gradientA: string;
    gradientB: string;
    gradientC: string;
  };
}) {
  const maxHeight = useState(new Animated.Value(0))[0];
  const fade = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(maxHeight, {
        toValue: expanded ? 1 : 0,
        duration: ANIM_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(fade, {
        toValue: expanded ? 1 : 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, [expanded]);

  const contentHeight = maxHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 320],
  });

  const rotate = maxHeight.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={[styles.cardOuter, { borderColor: colors.border }]}>
      <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
        <LinearGradient
          colors={
            expanded || section.accent
              ? [colors.gradientA, colors.gradientB, colors.gradientC]
              : [colors.card, colors.card2]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.cardHeader, expanded && styles.cardHeaderOpen]}
        >
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.primarySoft, borderColor: colors.border },
            ]}
          >
            <Ionicons name={section.icon} size={18} color={colors.primary} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            {section.subtitle ? (
              <Text style={[styles.cardSubtitle, { color: colors.primary }]}>
                {section.subtitle}
              </Text>
            ) : null}
          </View>

          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={18} color={colors.primary} />
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>

      <Animated.View style={[styles.collapsible, { height: contentHeight, opacity: fade }]}>
        <View style={[styles.collapsibleInner, { backgroundColor: colors.card2, borderTopColor: colors.border }]}>
          {section.bullets.map((bullet, index) => (
            <View key={index} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.bulletText, { color: colors.subText }]}>{bullet}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

export default function TermsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [openIndex, setOpenIndex] = useState<number | null>(1);

  const colors = {
    bg: theme.background,
    card: theme.card,
    card2: theme.card || "#0A251E",
    border: theme.border || "#0E3A2F",
    primary: theme.primary,
    primarySoft: `${theme.primary}1F`,
    text: theme.text,
    subText: theme.subText,
    gradientA: theme.gradient?.[0] ?? theme.primary,
    gradientB: theme.gradient?.[1] ?? theme.primary,
    gradientC: theme.gradient?.[2] ?? theme.primary,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Terms & Conditions</Text>
          <Text style={[styles.pageSub, { color: colors.subText }]}>Clear policies for safe pickup, cleaning, and delivery</Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[colors.gradientA, colors.gradientB, colors.gradientC]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { borderColor: colors.border }]}
        >
          <View style={styles.heroTopRow}>
            <View style={[styles.heroBadge, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="time-outline" size={14} color={colors.subText} />
              <Text style={[styles.heroBadgeText, { color: colors.subText }]}>Last updated: January 2026</Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: colors.text }]}>Transparent service rules for a safer experience.</Text>
          <Text style={[styles.heroText, { color: colors.subText }]}>These terms explain how DryDash works, what we expect from users, and how we protect your items during pickup, cleaning, and delivery.</Text>
        </LinearGradient>

        <View style={styles.list}>
          {SECTIONS.map((section, index) => (
            <AccordionCard
              key={section.title}
              section={section}
              expanded={openIndex === index}
              onPress={() => setOpenIndex(openIndex === index ? null : index)}
              colors={colors}
            />
          ))}
        </View>

        <LinearGradient
          colors={[colors.gradientA, colors.gradientB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.footerCard, { borderColor: colors.border }]}
        >
          <View style={[styles.footerIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.footerTitle, { color: colors.text }]}>Need help with a clause?</Text>
            <Text style={[styles.footerText, { color: colors.subText }]}>Reach out through the DryDash support chat for clarification on any policy or service condition.</Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 0,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  pageSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
    textAlign: "center",
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 28,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
  list: {
    gap: 12,
  },
  cardOuter: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  cardHeaderOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  collapsible: {
    overflow: "hidden",
  },
  collapsibleInner: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
  footerCard: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  footerIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  footerTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },
});