// app/(customer)/(tabs)/home/index.tsx
import { useAuthContext } from "@/context/AuthContext";
import { getMeApi } from "@/features/auth/auth.api";
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
  View,
} from "react-native";
import { HomeScreenSkeleton } from "../../../../components/SkeletonLoader";
import { useTheme } from "../../../../context/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;

type Order = {
  id: string;
  status: "Active" | "Pending" | "Completed";
  subtitle: string;
  total: string;
};

const QUICK_SERVICES = [
  { key: "Shoe Spa", label: "Shoe Spa", icon: "sparkles", featured: true },
  { key: "Dry Clean", label: "Dry Clean", icon: "shirt", featured: false },
  { key: "Laundry", label: "Laundry", icon: "water", featured: false },
  { key: "On Site", label: "On Site", icon: "hammer", featured: false },
];

const ORDERS: Order[] = [
  {
    id: "2481",
    status: "Washing",
    subtitle: "2 items • Cotton",
    total: "$38.50",
    paid: false,
    progress: 0.35,
  },
  {
    id: "2480",
    status: "In Transit",
    subtitle: "3 items • Dry Clean",
    total: "$25.00",
    paid: true,
    progress: 0.8,
  },
  {
    id: "2479",
    status: "Delivered",
    subtitle: "Delivered • Nov 24",
    total: "$52.75",
    paid: true,
    progress: 1,
  },
];

const HERO_IMAGES = [
  require("../../../../assets/images/hero/1st.png"),
  require("../../../../assets/images/hero/2nd.jpg"),
  require("../../../../assets/images/hero/premium.png"),
];

export default function Home() {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Order[]>(ORDERS);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const { setAuthUser, logout } = useAuthContext();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await getMeApi();
        await setAuthUser(me);
      } catch (err) {
        // Token invalid / expired
        await logout();
        router.replace("/(auth)/auth");
      }
    };

    checkAuth();
  }, []);

  // Swipe button animated value
  const swipeX = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const swipeContainerWidth = width - 32;
  const SWIPE_THRESHOLD = swipeContainerWidth * 0.55;

  const heroAnims = useRef(
    Array.from({ length: 3 }).map(() => new Animated.Value(0)),
  ).current;

  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const shoeSpaPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Simulate API call
    const t = setTimeout(() => {
      setLoading(false);
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
          }),
        ),
      ).start();
    }, 1500); // Simulate 1.5s loading time

    return () => clearTimeout(t);
  }, []);

  // Auto-rotating carousel
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % 3;
        scrollViewRef.current?.scrollTo({
          x: next * (CARD_WIDTH + 16),
          animated: true,
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [loading]);

  // Sparkle animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shoeSpaPulse, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shoeSpaPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const onPressBook = () => {
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragX.setOffset((dragX as any)._value || 0);
        dragX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = Math.max(0, gestureState.dx);
        dragX.setValue(dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        dragX.flattenOffset();
        const finalX = (dragX as any)._value || 0;
        if (finalX > SWIPE_THRESHOLD * 0.9) {
          Animated.timing(dragX, {
            toValue: SWIPE_THRESHOLD,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            router.push("/book-pickup");
            setTimeout(() => {
              dragX.setValue(0);
            }, 400);
          });
        } else {
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const getStatusStyle = (status: Order["status"], theme: any) => {
    // keep your existing getStatusStyle if you have it; fallback styles below
    const map = {
      Washing: { bg: "#E8F6FF", text: "#0369A1" },
      "Picked Up": { bg: "#FFF7ED", text: "#9A3412" },
      "In Transit": { bg: "#F3F4F6", text: "#374151" },
      Delivered: { bg: "#ECFBF1", text: "#065F46" },
      Cancelled: { bg: "#FEE2E2", text: "#991B1B" },
      Processing: { bg: "#F5F3FF", text: "#5B21B6" },
      default: {
        bg: theme.primary + "20" || "#E5E7EB",
        text: theme.text || "#111",
      },
    };
    return map[status] || map.default;
  };

  // Show skeleton loader while loading
  if (loading) {
    return <HomeScreenSkeleton />;
  }

  const renderStatusVisual = (o: Order) => {
    let icon: any = "ellipse-outline";

    if (o.status === "Washing") icon = "water-outline";
    else if (o.status === "Picked Up") icon = "arrow-up-circle-outline";
    else if (o.status === "In Transit") icon = "car-outline";
    else if (o.status === "Delivered") icon = "checkmark-done-circle-outline";
    else if (o.status === "Processing") icon = "time-outline";

    const statusStyle = getStatusStyle(o.status, theme);
    const progress = Math.max(0, Math.min(1, o.progress ?? 0));

    return (
      <View style={styles.statusContainer}>
        <View style={styles.statusLeft}>
          <View
            style={[
              styles.statusIconWrap,
              { backgroundColor: statusStyle.bg, borderColor: theme.border },
            ]}
          >
            <Ionicons name={icon} size={18} color={statusStyle.text} />
          </View>

          <View style={styles.statusTextBlock}>
            <Text style={[styles.statusLabel, { color: theme.text }]}>
              {o.status}
            </Text>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: theme.primary,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={{ height: 12 }} />

        {/* Header */}

        {/* HERO CAROUSEL */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x / (CARD_WIDTH + 16),
            );
            setCurrentIndex(index);
          }}
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

            return (
              <Animated.View
                key={i}
                style={[
                  styles.heroCard,
                  heroStyle,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={styles.heroBg}>
                  <Animated.Image
                    source={HERO_IMAGES[i]}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                  <View style={styles.heroOverlay} />
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

        {/* Carousel Indicators */}
        <View style={styles.indicatorContainer}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    currentIndex === i
                      ? theme.primary
                      : isDark
                        ? "#1F2937"
                        : "#D1D5DB",
                  width: currentIndex === i ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

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
              Welcome 20% OFF
            </Text>
          </View>
        </Animated.View>

        {/* Quick Services - Shoe Spa Featured */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Quick Services
              </Text>
            </View>

            <View style={styles.servicesRow}>
              {QUICK_SERVICES.map((s, index) => {
                const isShoeSpa = s.key === "Shoe Spa";
                return (
                  <TouchableOpacity
                    key={s.key}
                    style={[
                      styles.serviceBox,
                      {
                        backgroundColor: isShoeSpa
                          ? isDark
                            ? "#0A3D3C"
                            : "#D1FAE5"
                          : theme.card,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/(customer)/services/${s.key}`)}
                  >
                    <Animated.View
                      style={{
                        transform: [
                          {
                            scale: isShoeSpa ? shoeSpaPulse : 1,
                          },
                        ],
                      }}
                    >
                      <View
                        style={[
                          styles.serviceIconWrapper,
                          {
                            backgroundColor: isShoeSpa
                              ? theme.primary
                              : isDark
                                ? "#062B2A"
                                : "#E6FFFA",
                          },
                        ]}
                      >
                        <Ionicons
                          name={s.icon as any}
                          size={20}
                          color={isShoeSpa ? "#000" : theme.primary}
                        />
                      </View>
                    </Animated.View>

                    <Text
                      style={[
                        styles.serviceLabel,
                        {
                          color: isShoeSpa ? theme.primary : theme.subText,
                          fontWeight: isShoeSpa ? "800" : "600",
                        },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
            </View>

            {messages.map((o) => {
              const statusStyle = getStatusStyle(o.status, theme);
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
                        style={[styles.orderSubtitle, { color: theme.subText }]}
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
                        style={[styles.statusText, { color: statusStyle.text }]}
                      >
                        {o.status}
                      </Text>
                    </View>
                  </View>
                  {/* Rich Status Visual */}
                  <View style={{ marginTop: 12 }}>{renderStatusVisual(o)}</View>

                  <View style={styles.orderFooter}>
                    <Text style={[styles.orderTotal, { color: theme.text }]}>
                      Total: {o.total}
                    </Text>

                    <View style={styles.orderActions}>
                      {[
                        "Active",
                        "In Transit",
                        "Washing",
                        "Processing",
                      ].includes(o.status) && (
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

                      {!o.paid ? (
                        <TouchableOpacity
                          style={[styles.payNowButton]}
                          onPress={() => router.push(`/orders/${o.id}/pay`)}
                        >
                          <Text style={styles.payNowText}>Pay now</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.paidBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#10B981"
                          />
                          <Text
                            style={[
                              styles.paidBadgeText,
                              { color: theme.text },
                            ]}
                          >
                            Paid
                          </Text>
                        </View>
                      )}
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 160, paddingTop: 8 },
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
  heroCard: {
    width: CARD_WIDTH,
    height: 197,
    marginRight: 16,
    borderRadius: 25,
    justifyContent: "flex-end",
    borderWidth: 1,
    padding: 0,
    overflow: "hidden",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 6,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  swipeContainerWrap: { paddingHorizontal: 16, marginTop: 20 },
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
  offerCard: { margin: 16, padding: 18, borderRadius: 18, borderWidth: 1 },
  offerTag: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  offerTitle: { fontSize: 18, fontWeight: "800", marginTop: 6 },
  section: { marginTop: 8, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  servicesRow: { flexDirection: "row", justifyContent: "space-between" },
  serviceBox: {
    width: "23%",
    aspectRatio: 0.85,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  serviceIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    position: "relative",
  },
  sparkleContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkle1: {
    position: "absolute",
    top: -4,
    right: -4,
  },
  sparkle2: {
    position: "absolute",
    bottom: -2,
    left: -2,
  },
  serviceLabel: { fontSize: 12, textAlign: "center" },
  featuredBadge: {
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.5,
  },
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

  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statusLeft: { flexDirection: "row", alignItems: "center", flex: 1 },

  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
  },

  statusTextBlock: { flex: 1 },

  statusLabel: { fontWeight: "800", fontSize: 14 },

  progressBar: {
    marginTop: 8,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 6,
    width: "0%",
  },

  payNowButton: {
    height: 40,
    minWidth: 92,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "#FFB547",
  },

  payNowText: { fontWeight: "800", color: "#000" },

  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E6EEF2",
  },

  paidBadgeText: { marginLeft: 6, fontWeight: "700", fontSize: 12 },
});
