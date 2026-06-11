import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
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
  description?: string;   // add this
  bullets: string[];
};

// ─── ADD / REPLACE YOUR SECTIONS HERE ────────────────────────────────────────
const SECTIONS: Section[] = [
  {
    icon: "information-circle-outline",
    title: "General Terms",
    description: "Our laundry and shoe cleaning services are subject to the following professional standards",
    bullets: [
      "By using DryDash, you agree to comply with all listed service guidelines and legal regulations.",
      "Users must be at least 18 years of age or have legal parental consent to create an account.",
    ],
  },
  {
    icon: "shield-checkmark-outline",
    title: "Service Policy",
    description: "Our laundry and shoe cleaning services are subject to the following professional standards ",
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
    description: "Our laundry and shoe cleaning services are subject to the following professional standards ",

    bullets: [
      'Drivers will wait for a maximum of 10 minutes at the designated location before marking a "no-show".',
      "Contactless pickup and delivery options are available via settings in the mobile application.",
    ],
  },
  {
    icon: "card-outline",
    title: "Pricing & Payment",
    description: "Our laundry and shoe cleaning services are subject to the following professional standards ",

    bullets: [
      "Payments are processed securely via integrated third-party providers. No card data is stored on our servers.",
      "Final pricing is confirmed after item inspection; any discrepancies will be notified via push notification.",
    ],
  },
  {
    icon: "warning-outline",
    title: "Damage & Liability",
    description: "Our laundry and shoe cleaning services are subject to the following professional standards ",

    bullets: [
      "Liability for lost or damaged items is limited to 2x the cleaning price of that specific item.",
      "Claims must be filed within 24 hours of delivery with photographic evidence of the issue.",
    ],
  },
  {
    icon: "person-outline",
    title: "Customer Responsibility",
    description: "Our laundry and shoe cleaning services are subject to the following professional standards ",

    bullets: [
      "Customers must check all pockets and remove jewelry or loose items prior to pickup.",
      "Accurate labeling of delicate items or specific washing instructions must be provided in-app.",
    ],
  },
  {
    icon: "lock-closed-outline",
    title: "Privacy Policy",
    description: "Our laundry and shoe cleaning services are subject to the following professional standards ",

    bullets: [
      "We collect minimal personal data required to provide and improve our specialized laundry services.",
      "Location data is used solely for the duration of active pickup or delivery logistics tracking.",
    ],
  },


];
// ─────────────────────────────────────────────────────────────────────────────

// ── Accordion Card ────────────────────────────────────────────────────────────
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
  const maxHeight = React.useRef(new Animated.Value(0)).current;
  const fade = React.useRef(new Animated.Value(0)).current;
  const [bodyHeight, setBodyHeight] = useState(0);

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
  }, [expanded, maxHeight, fade]);

  const contentHeight = maxHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, bodyHeight || 1],
  });

  const rotate = maxHeight.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={[styles.cardOuter, { borderColor: colors.border }]}>
      <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
        <View
          style={[
            styles.cardHeader,
            expanded && styles.cardHeaderOpen,
            {
              backgroundColor: expanded ? colors.primarySoft : colors.card,
            },
          ]}
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
        </View>
      </TouchableOpacity>

      <Animated.View style={[styles.collapsible, { height: contentHeight }]}>
        <Animated.View style={{ opacity: fade }}>
          <View
            onLayout={(e) => {
              if (bodyHeight === 0) {
                setBodyHeight(e.nativeEvent.layout.height);
              }
            }}
          >
            <View
              style={[
                styles.collapsibleInner,
                { backgroundColor: colors.card2 },
              ]}
            >
              {section.description && (
                <Text style={[styles.description, 
                  
                ]}>
                  {section.description}
                </Text>
              )}

              {section.bullets.map((bullet, index) => (
                <View key={index} style={styles.bulletRow}>
                  <View
                    style={[
                      styles.bulletDot,
                      { backgroundColor: "#fff" },
                    ]}
                  />
                  <Text style={[styles.bulletText, { color: "#fff" }]}>
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
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

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>
            Terms & Conditions
          </Text>


        </View>

        {/* spacer keeps title centred */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >


        {/* ── Accordion List ── */}
        <View style={styles.list}>
          {SECTIONS.map((section, index) => (
            <AccordionCard
              key={section.title}
              section={section}
              expanded={openIndex === index}
              onPress={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
              colors={colors}
            />
          ))}
        </View>



      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1 },

  // header
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
   
    alignItems: "center",
    justifyContent: "center",
   
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerSpacer: { width: 40, height: 40 },
  pageTitle: { fontSize: 18, fontWeight: "900", letterSpacing: 0.2 },
  pageSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
    fontWeight: "500",
    color:"#fff"
  },

  // scroll content
  content: { paddingHorizontal: 14, paddingBottom: 28 },

  // hero
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
  heroBadgeText: { fontSize: 11, fontWeight: "700" },
  heroTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    marginBottom: 8,
  },
  heroText: { fontSize: 13, lineHeight: 20, fontWeight: "500" },

  // accordion list
  list: { gap: 12 },

  // card
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
  cardTitle: { fontSize: 15, fontWeight: "900", lineHeight: 20 },
  cardSubtitle: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // collapsible body
  collapsible: { overflow: "hidden" },
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
  bulletText: { flex: 1, fontSize: 13, lineHeight: 20, fontWeight: "500" },

  // footer
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
  footerTitle: { fontSize: 15, fontWeight: "900", marginBottom: 4 },
  footerText: { fontSize: 13, lineHeight: 20, fontWeight: "500" },
});