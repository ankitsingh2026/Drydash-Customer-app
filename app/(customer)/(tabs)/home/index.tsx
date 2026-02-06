// app/(customer)/(tabs)/home/index.tsx
import { useAuthContext } from "@/context/AuthContext";
import { getMeApi } from "@/features/auth/auth.api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Truck } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

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
  status: "Active" | "Completed" | "Awaiting";
  subtitle: string;
  total: string;
};

// const QUICK_SERVICES = [
//   { key: "Shoe Spa", label: "Shoe Spa", icon: "sparkles", featured: true },
//   { key: "Dry Clean", label: "Dry Clean", icon: "shirt", featured: false },
//   { key: "Laundry", label: "Laundry", icon: "water", featured: false },
//   { key: "On Site", label: "On Site", icon: "hammer", featured: false },
// ];
const QUICK_SERVICES = [
  {
    key: "Shoe Spa",
    slug: "shoe",
    label: "Shoe Spa",
    icon: "sparkles",
    featured: true,
  },
  {
    key: "Dry Clean",
    slug: "iron",
    label: "Dry Clean",
    icon: "shirt",
    featured: false,
  },
  {
    key: "Laundry",
    slug: "laundry",
    label: "Laundry",
    icon: "water",
    featured: false,
  },
  {
    key: "On Site",
    slug: "onsite",
    label: "On Site",
    icon: "hammer",
    featured: false,
  },
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

const HERO_SLIDES = [
  {
    key: "shoe-1",
    tag: "SHOE SPA",
    title: "Premium Shoe Cleaning",
    subtitle: "Deep clean • Deodorize • Restore",
    image: require("../../../../assets/images/hero/shoespa.png"),
  },
  {
    key: "shoe-2",
    tag: "SHOE CARE",
    title: "Sneaker & Leather Care",
    subtitle: "Whitening • Polishing • Protection",
    image: require("../../../../assets/images/hero/shoespa1.jpg"),
  },
  {
    key: "laundry-1",
    tag: "LAUNDRY",
    title: "Dry Cleaning & Steam Press",
    subtitle: "Formal • Ethnic • Delicates",
    image: require("../../../../assets/images/hero/laundry2.png"),
  },
  {
    key: "onsite-1",
    tag: "ON-SITE",
    title: "Onsite Cleaning Service",
    subtitle: "Carpets • Sofas • Mattresses",
    image: require("../../../../assets/images/hero/onsite.png"),
  },
  //   {
  //   key: "wash-1",
  //   tag: "WASH & FOLD",
  //   title: "Everyday Laundry",
  //   subtitle: "Fresh • Hygienic • Affordable",
  //   image: require("../../../../assets/images/hero/onsite.png"),
  // },
  {
    key: "laundry-2",
    tag: "PREMIUM",
    title: "Luxury Garment Care",
    subtitle: "Silk • Wool • Designer Wear",
    image: require("../../../../assets/images/hero/premium.png"),
  },
];

export default function Home() {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Order[]>(ORDERS);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const { setAuthUser, logout } = useAuthContext();

  // const { user } = useAuth();

  // if (!user) return null;

  // const phone = `91${user?.user?.phone}`;

  // const [activity, setActivity] = useState<any>([]);

  // const setOrdersAndPickups = async () => {
  //   const data = await getOrdersApi(phone);

  //   setActivity(data);
  // };

  // useFocusEffect(
  //   useCallback(() => {
  //     setOrdersAndPickups();
  //   }, []),
  // );

  // console.log("this is the activityeeeeee==>>", activity);

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
    Array.from({ length: HERO_SLIDES.length }).map(() => new Animated.Value(0)),
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
        const next = (prev + 1) % HERO_SLIDES.length;
        scrollViewRef.current?.scrollTo({
          x: next * (CARD_WIDTH + 16),
          animated: true,
        });
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    heroAnims[currentIndex].setValue(0);

    Animated.timing(heroAnims[currentIndex], {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [currentIndex]);

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
  const getUnifiedStatus = (status: string) => {
    const activeStatuses = ["Washing", "Picked Up", "In Transit", "Processing"];
    const completedStatuses = ["Delivered"];
    const pickupStatuses = ["Pickup"];

    if (activeStatuses.includes(status)) return "Active";
    if (completedStatuses.includes(status)) return "Completed";
    if (pickupStatuses.includes(status)) return "Awaiting";

    return "Active"; // fallback
  };

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
    <SafeAreaProvider>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={theme.background}
        translucent={false} // safer: content won't draw under status bar
      />
      <SafeAreaView
        style={[styles.root, { backgroundColor: theme.background }]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={{ height: 12 }} />

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
            {HERO_SLIDES.map((slide, i) => {
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
                  <Animated.Image
                    source={slide.image}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />

                  <View style={styles.heroOverlay} />

                  <View style={styles.heroTextWrap}>
                    <Text style={styles.heroTag}>{slide.tag}</Text>

                    <Text style={styles.heroTitle}>{slide.title}</Text>

                    {slide.subtitle && (
                      <Text style={styles.heroSubtitle}>{slide.subtitle}</Text>
                    )}
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
                WELCOME OFFER
              </Text>
              <Text style={[styles.offerTitle, { color: theme.text }]}>
                20% Off on Your First Order
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
                      onPress={() =>
                        router.push(`/(customer)/services/${s.slug}`)
                      }
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
            <View style={[styles.section, { marginTop: 20 }]}>
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
                      </View>

                      {(() => {
                        const unifiedStatus = getUnifiedStatus(o.status);
                        let pillStyle;
                        if (unifiedStatus === "Active") {
                          pillStyle = { bg: "#FEF3C7", text: "#92400E" }; // amber
                        } else if (unifiedStatus === "Completed") {
                          pillStyle = { bg: "#ECFDF5", text: "#065F46" }; // green
                        } else if (unifiedStatus === "Awaiting") {
                          pillStyle = { bg: "#E0E7FF", text: "#3730A3" }; // blue/purple
                        }

                        return (
                          <View
                            style={[
                              styles.statusPill,
                              { backgroundColor: pillStyle.bg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.statusText,
                                { color: pillStyle.text },
                              ]}
                            >
                              {unifiedStatus}
                            </Text>
                          </View>
                        );
                      })()}
                    </View>
                    {/* Rich Status Visual */}
                    <View style={{ marginTop: 12 }}>
                      {renderStatusVisual(o)}
                    </View>

                    <View style={styles.orderFooter}>
                      <View style={styles.orderActions}>
                        {[
                          "Active",
                          "In Transit",
                          "Washing",
                          "Processing",
                        ].includes(o.status)}

                        <TouchableOpacity
                          style={[
                            styles.secondarySmall,
                            {
                              backgroundColor: isDark ? "#0e1925" : "#c6ecd7",
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
                            <Text style={[styles.paidBadgeText]}>Paid</Text>
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
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 160, paddingTop: 8 },
  header: { paddingHorizontal: 16, paddingTop: 8, marginBottom: 12 },
  brand: { fontSize: 12, letterSpacing: 2, fontWeight: "700", marginBottom: 2 },
  heading: { fontSize: 26, fontWeight: "800" },

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
    height: 38,
    minWidth: 78,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    backgroundColor: "#12af80",
  },

  payNowText: { fontWeight: "600", color: "#000" },

  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d4e5ee",
    backgroundColor: "#2c332d",
  },

  paidBadgeText: {
    marginLeft: 6,
    fontWeight: "700",
    fontSize: 12,
    color: "#fff",
  },
  heroTextWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 1,
    alignSelf: "flex-start",
  },

  heroTag: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
    color: "#E6FFFA",
  },

  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
    color: "#FFFFFF",
  },

  heroSubtitle: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#D1FAE5",
  },
});
