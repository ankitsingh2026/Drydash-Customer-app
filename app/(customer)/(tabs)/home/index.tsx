// app/(customer)/(tabs)/home/index.tsx
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Truck } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../../../../context/ThemeContext";
// optional, only if you want the nicer gradient overlay:

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;

type Order = {
  id: string;
  status: "Active" | "Pending" | "Completed";
  subtitle: string;
  total: string;
};

const QUICK_SERVICES = [
  { key: "shoe", label: "Shoe Spa", icon: "water" },
  { key: "dry", label: "Dry Clean", icon: "cloud-upload" },
  { key: "iron", label: "Laundry", icon: "hardware-chip" },
  { key: "alter", label: "Alteration", icon: "hammer" },
];

const ORDERS: Order[] = [
  {
    id: "2481",
    status: "Active",
    subtitle: "Pickup Scheduled • Today 4 PM",
    total: "$38.50",
  },
  {
    id: "2480",
    status: "Pending",
    subtitle: "Scheduled • Mon, Nov 27",
    total: "$25.00",
  },
  {
    id: "2479",
    status: "Completed",
    subtitle: "Delivered • Nov 24, 2023",
    total: "$52.75",
  },
];

export default function Home() {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Order[]>(ORDERS); // placeholder
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Swipe button animated value
  const swipeX = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const swipeContainerWidth = width - 32; // some space
  const SWIPE_THRESHOLD = swipeContainerWidth * 0.55;

  // Hero card entrance anims
  const heroAnims = useRef(
    Array.from({ length: 3 }).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // simulate loading (in real app, swap with real API call)
    const t = setTimeout(() => {
      setLoading(false);
      // fade in sections and hero card entrance
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      Animated.stagger(
        80,
        heroAnims.map((a) =>
          Animated.timing(a, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          })
        )
      ).start();
    }, 900);

    return () => clearTimeout(t);
  }, []);

  // simple pulsating skeleton loop
  const pulse = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const onPressBook = () => {
    // quick tap fallback
    Animated.sequence([
      Animated.timing(swipeX, {
        toValue: SWIPE_THRESHOLD,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(swipeX, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push("/book-pickup");
    });
  };

  // Pan responder for the swipe button
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragX.setOffset((dragX as any)._value || 0);
        dragX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = Math.max(0, gestureState.dx); // only allow right drag
        dragX.setValue(dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        dragX.flattenOffset();
        const finalX = (dragX as any)._value || 0;
        if (finalX > SWIPE_THRESHOLD * 0.9) {
          // complete
          Animated.timing(dragX, {
            toValue: SWIPE_THRESHOLD,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            // navigate and reset after small delay
            router.push("/book-pickup");
            setTimeout(() => {
              dragX.setValue(0);
            }, 400);
          });
        } else {
          // reset
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const getStatusStyle = (status: Order["status"]) => {
    switch (status) {
      case "Active":
        return { bg: "#0EA5A4", text: "#042F2E" }; // teal-ish active
      case "Pending":
        return { bg: "#F59E0B", text: "#3B2F00" }; // amber
      case "Completed":
        return { bg: "#10B981", text: "#042F1F" }; // green
      default:
        return { bg: theme.border, text: theme.text };
    }
  };
  const HERO_IMAGES = [
    require("../../../../assets/images/hero/1st.png"),
    require("../../../../assets/images/hero/2nd.jpg"),
    require("../../../../assets/images/hero/premium.png"),
  ];

  /* ---------------- Skeleton small component ---------------- */
  const SkeletonBox = ({ style }: { style?: any }) => (
    <Animated.View
      style={[
        {
          backgroundColor: isDark ? "#0B1220" : "#F1F5F9",
          opacity: pulse,
        },
        style,
      ]}
    />
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ height: 12 }} />

        {/* Header text */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={[styles.brand, { color: theme.primary }]}>
            DRY DASH
          </Text>
          <Text style={[styles.heading, { color: theme.text }]}>
            Premium Laundry Care
          </Text>
        </Animated.View>

        {/* HERO CARDS */}
        <ScrollView
          horizontal
          pagingEnabled
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {[0, 1, 2].map((i) => {
            const heroStyle = {
              transform: [
                {
                  scale: heroAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1],
                  }),
                },
                {
                  translateY: heroAnims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
              opacity: heroAnims[i],
            };

            return loading ? (
              <View
                key={i}
                style={[
                  styles.heroCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
              >
                <SkeletonBox
                  style={{
                    width: "80%",
                    height: 18,
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                />
                <SkeletonBox
                  style={{ width: "90%", height: 22, borderRadius: 10 }}
                />
              </View>
            ) : (
              <Animated.View
                key={i}
                style={[
                  styles.heroCard,
                  heroStyle,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.heroBg}>
                  {/* IMAGE LAYER */}
                  <Animated.Image
                    source={HERO_IMAGES[i]}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />

                  {/* OVERLAY */}
                  <View style={styles.heroOverlay} />

                  {/* CONTENT */}
                  <Text style={[styles.heroTag, { color: "#E6FFFA" }]}>
                    {i === 0 ? "FEATURED" : i === 1 ? "PREMIUM" : "FAST"}
                  </Text>
                  <Text style={[styles.heroTitle, { color: "#FFFFFF" }]}>
                    {i === 0
                      ? "24/7 Pickup & Delivery"
                      : i === 1
                        ? "Dry Cleaning & Steam Press"
                        : "Express Delivery < 24 Hrs"}
                  </Text>
                </View>

              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Swipe to Book */}
        <Animated.View
          style={[
            styles.swipeContainerWrap,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={[styles.sectionTitleSmall, { color: theme.text }]}>
            Quick Action
          </Text>

          <View
            style={[
              styles.swipeContainer,
              {
                backgroundColor: isDark ? "#071018" : "#F3F4F6",
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.swipeTextWrap}>
              <Text style={[styles.swipeHint, { color: theme.subText }]}>
                Swipe to Book Pickup
              </Text>
            </View>

            {/* draggable button */}
            <Animated.View
              style={[
                styles.swipeDraggable,
                {
                  transform: [{ translateX: dragX }],
                  backgroundColor: theme.primary,
                },
              ]}
              {...panResponder.panHandlers}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onPressBook}
                style={{
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Truck size={20} color="#000" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Offer Card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View
            style={[
              styles.offerCard,
              {
                backgroundColor: isDark ? "#0F1720" : "#F8FAFC",
                borderColor: "#D4AF37",
              },
            ]}
          >
            <Text style={[styles.offerTag, { color: "#D4AF37" }]}>
              LIMITED OFFER
            </Text>
            <Text style={[styles.offerTitle, { color: theme.text }]}>
              First Order 20% OFF
            </Text>
          </View>
        </Animated.View>

        {/* Quick Services */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Quick Services
              </Text>
             
            </View>

            <View style={styles.servicesRow}>
              {QUICK_SERVICES.map((s) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.serviceBox, { backgroundColor: theme.card }]}
                  activeOpacity={0.85}
                  onPress={() =>
                   router.push(`/(customer)/services/${s.key}`)
                  }
                >
                  <View
                    style={[
                      styles.serviceIconWrapper,
                      { backgroundColor: isDark ? "#062B2A" : "#E6FFFA" },
                    ]}
                  >
                    <Ionicons
                      name={s.icon as any}
                      size={20}
                      color={theme.primary}
                    />
                  </View>

                  <Text
                    style={[styles.serviceLabel, { color: theme.subText }]}
                  >
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[styles.section, { marginTop: 6 }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Recent Activity
              </Text>
              <TouchableOpacity onPress={() => router.push("/orders")}>
                <Text style={[styles.viewAll, { color: theme.primary }]}>
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            {/* Order list */}
            {loading
              ? // skeleton order cards
              [0, 1].map((n) => (
                <View
                  key={n}
                  style={[
                    styles.orderCard,
                    {
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <SkeletonBox
                    style={{
                      width: "55%",
                      height: 14,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  />
                  <SkeletonBox
                    style={{
                      width: "80%",
                      height: 12,
                      borderRadius: 8,
                      marginBottom: 12,
                    }}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <SkeletonBox
                      style={{ width: "35%", height: 18, borderRadius: 8 }}
                    />
                    <SkeletonBox
                      style={{ width: 96, height: 36, borderRadius: 10 }}
                    />
                  </View>
                </View>
              ))
              : messages.map((o) => {
                const statusStyle = getStatusStyle(o.status);
                return (
                  <View
                    key={o.id}
                    style={[
                      styles.orderCard,
                      {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <View style={styles.orderRow}>
                      <View>
                        <Text style={[styles.orderId, { color: theme.text }]}>
                          Order #{o.id}
                        </Text>
                        <Text
                          style={[
                            styles.orderSubtitle,
                            { color: theme.subText },
                          ]}
                        >
                          {o.subtitle}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: statusStyle.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: statusStyle.text },
                          ]}
                        >
                          {o.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderFooter}>
                      <Text
                        style={[styles.orderTotal, { color: theme.text }]}
                      >
                        Total: {o.total}
                      </Text>

                      <View style={styles.orderActions}>
                        {o.status === "Active" && (
                          <TouchableOpacity
                            style={[
                              styles.primarySmall,
                              { backgroundColor: theme.primary },
                            ]}
                            onPress={() => router.push(`/orders/${o.id}`)}
                          >
                            <Text style={styles.primarySmallText}>Track</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[
                            styles.secondarySmall,
                            {
                              backgroundColor: isDark ? "#0F1720" : "#F3F4F6",
                            },
                          ]}
                          onPress={() => router.push(`/orders/${o.id}`)}
                        >
                          <Text
                            style={[
                              styles.secondarySmallText,
                              { color: theme.text },
                            ]}
                          >
                            View Details
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
          </View>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

/* ============== Styles ============== */
const styles = StyleSheet.create({
  root: { flex: 1 },

  scrollContent: {
    paddingBottom: 160,
    paddingTop: 8,
  },

  header: { paddingHorizontal: 16, paddingTop: 8, marginBottom: 12 },
  brand: { fontSize: 12, letterSpacing: 2, fontWeight: "700", marginBottom: 2 },
  heading: { fontSize: 26, fontWeight: "800" },

  heroTag: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 0,
    letterSpacing: 1,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", lineHeight: 28 },
  heroBg: {
    width: CARD_WIDTH,
    height: 220,
    overflow: "hidden",
    padding: 20,
    justifyContent: "flex-end",

  },

  heroImage: {
    position: "absolute",
    marginTop: 52,
    width: "115%",
    height: "109%",
    borderRadius: 0,
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.40)",
  },



  // tweak heroCard shadow to be slightly greenish
  heroCard: {
    width: CARD_WIDTH,
    height: 197,
    marginRight: 16,
    borderRadius: 25,
    justifyContent: "flex-end",
    borderWidth: 1,
    padding: 0,               // 👈 IMPORTANT
    overflow: "hidden",
  },

  /* Swipe to book */
  swipeContainerWrap: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitleSmall: { fontSize: 14, fontWeight: "800", marginBottom: 8 },
  swipeContainer: {
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    padding: 8,
    overflow: "hidden",
    justifyContent: "center",
  },
  swipeTextWrap: {
    position: "absolute",
    left: 66,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  swipeHint: { fontWeight: "700", fontSize: 14 },

  swipeDraggable: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },

  ctaButton: {
    marginHorizontal: 16,
    marginTop: 24,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 0.4,
  },

  offerCard: { margin: 16, padding: 18, borderRadius: 18, borderWidth: 1 },
  offerTag: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  offerTitle: { fontSize: 18, fontWeight: "800", marginTop: 6 },

  /* Quick services */
  section: { marginTop: 8, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  viewAll: { fontSize: 13, fontWeight: "700" },

  servicesRow: { flexDirection: "row", justifyContent: "space-between" },
  serviceBox: {
    width: "23%",
    aspectRatio: 1,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  serviceLabel: { fontSize: 12, textAlign: "center" },

  /* Orders list */
  orderCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: { fontSize: 16, fontWeight: "700" },
  orderSubtitle: { marginTop: 6, fontSize: 12 },

  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "700" },

  orderFooter: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTotal: { fontSize: 14, fontWeight: "700" },

  orderActions: { flexDirection: "row", gap: 8 },
  primarySmall: {
    height: 40,
    minWidth: 92,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  primarySmallText: { fontWeight: "800", color: "#000" },

  secondarySmall: {
    height: 40,
    minWidth: 92,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondarySmallText: { fontWeight: "700" },
});
