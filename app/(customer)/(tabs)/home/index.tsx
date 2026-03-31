// app/(customer)/(tabs)/home/index.tsx
import FloatingOfferCard from "@/components/FloatingOfferCard";
import NotificationsTopSheet from "@/components/layout/NotificationsTopSheet";
import { TabBar } from "@/components/layout/TabBar";
import { useAuthContext } from "@/context/AuthContext";
import { getMeApi } from "@/features/auth/auth.api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
import { HomeScreenSkeleton } from "../../../../components/SkeletonLoader";
import { useTheme } from "../../../../context/ThemeContext";
import AppLoader from "@/components/AppLoader";
const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32; // full width cards with 16px padding each side

const QUICK_SERVICES = [
  {
    key: "Shoe Spa",
    slug: "shoe",
    label: "Shoe Spa",
    subtitle: "Sneakers & Shoe care",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/icons/shoes.svg",
    featured: true,
  },
  {
    key: "Dry Clean",
    slug: "dryclean",
    label: "Dry Clean",
    subtitle: "Silk & Suits",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/icons/dryclean.svg",
  },
  {
    key: "Laundry",
    slug: "laundry",
    label: "Laundry",
    subtitle: "Everyday clothes",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/icons/laundry.svg",
  },
  {
    key: "Onsite",
    slug: "onsite",
    label: "Onsite",
    subtitle: "At-home service",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/icons/onsite.svg", // ✅ FIXED
  },
  {
    key: "carwash",
    slug: "carwash",
    label: "Car Wash",
    subtitle: "At-home service",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/icons/carwash.svg",
  },
  {
    key: "express",
    slug: "express",
    label: "8 Hour Delivery",
    subtitle: "Express Delivery",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/icons/express.svg",
  },
];
const HERO_SLIDES = [
  {
    key: "shoe-1",
    tag: "SHOE SPA",
    title: "Premium Shoe Cleaning",
    subtitle: "Deep clean • Deodorize • Restore",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/one.jpg",
    },
  },
  {
    key: "shoe-2",
    tag: "SHOE CARE",
    title: "Sneaker & Leather Care",
    subtitle: "Whitening • Polishing • Protection",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/two.jpg",
    },
  },
  {
    key: "premium-1",
    tag: "PREMIUM CARE",
    title: "Sofa Deep Cleaning",
    subtitle: "Deep cleaning for high-end fabrics",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/three.jpg",
    },
  },
  {
    key: "onsite-1",
    tag: "ON-SITE",
    title: "Doorstep Cleaning Service",
    subtitle: "Carpets • Sofas • Mattresses",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/four.jpg",
    },
  },
  {
    key: "laundry-2",
    tag: "PREMIUM",
    title: "Luxury Garment Care",
    subtitle: "Silk • Wool • Designer Wear",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/five.gif",
    },
  },
];

export default function Home() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState("Ankit");
  const [offerVisible, setOfferVisible] = useState(true);
  const offerSlide = useRef(new Animated.Value(0)).current;
  const { setAuthUser, logout } = useAuthContext();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const me = await getMeApi();
        await setAuthUser(me);
        if (me?.name) setUserName(me.name.split(" ")[0]);
      } catch (err) {
        await logout();
        router.replace("/(auth)/auth");
      }
    };
    checkAuth();
  }, []);

  const dragX = useRef(new Animated.Value(0)).current;
  const swipeContainerWidth = width - 32;
  const SWIPE_THRESHOLD = swipeContainerWidth * 0.55;

  const heroAnims = useRef(
    Array.from({ length: HERO_SLIDES.length }).map(() => new Animated.Value(0)),
  ).current;

  const shoeSpaPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
    }, 1500);

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
    }, 6000);
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

  useEffect(() => {
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
    Animated.timing(dragX, {
      toValue: SWIPE_THRESHOLD,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      router.push("/book-pickup");
      // Reset AFTER navigation, not before
      setTimeout(() => {
        Animated.spring(dragX, { toValue: 0, useNativeDriver: true }).start();
      }, 600);
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
          // ✅ Animate to full end, navigate, THEN reset after screen transition
          Animated.timing(dragX, {
            toValue: SWIPE_THRESHOLD,
            duration: 120,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start(() => {
            router.push("/book-pickup");
            setTimeout(() => {
              Animated.spring(dragX, {
                toValue: 0,
                useNativeDriver: true,
                damping: 15,
                stiffness: 180,
              }).start();
            }, 600); // after screen transition completes
          });
        } else {
          // Not enough — spring back smoothly
          Animated.spring(dragX, {
            toValue: 0,
            useNativeDriver: true,
            damping: 15,
            stiffness: 180,
            mass: 0.6,
          }).start();
        }
      },
    }),
  ).current;

  useFocusEffect(
    useCallback(() => {
      dragX.setValue(0);
    }, []),
  );
  if (loading) return <AppLoader />;

  const PRIMARY = theme.primary; // teal/green

  return (
    <SafeAreaProvider>
      <TabBar
        onOpenNotifications={() => setOpen(true)}
        onWalletPress={() => router.push("/(customer)/wallet")}
        style={{
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
        }}
      />
      <StatusBar
        style={"dark"}
        backgroundColor={theme.background}
        translucent={false}
      />
      <SafeAreaView
        style={[styles.root, { backgroundColor: theme.background }]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── HERO CAROUSEL ── */}
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled={false}
            snapToInterval={CARD_WIDTH + 12}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / (CARD_WIDTH + 12),
              );
              setCurrentIndex(index);
            }}
          >
            {HERO_SLIDES.map((slide, i) => {
              const heroStyle = {
                opacity: heroAnims[i],
                transform: [
                  {
                    scale: heroAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.97, 1],
                    }),
                  },
                ],
              };
              return (
                <Animated.View key={i} style={[styles.heroCard, heroStyle]}>
                  <Animated.Image
                    source={slide.image}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                  <View
                    style={[
                      styles.heroOverlay,
                      { backgroundColor: "rgba(0, 40, 30, 0.55)" },
                    ]}
                  />

                  {/* Tag badge - top left */}
                  <View
                    style={[styles.heroTagBadge, { backgroundColor: PRIMARY }]}
                  >
                    <Text style={styles.heroTagText}>{slide.tag}</Text>
                  </View>

                  {/* Text - bottom */}
                  <View style={styles.heroTextWrap}>
                    <Text style={styles.heroTitle}>{slide.title}</Text>
                    {slide.subtitle && (
                      <Text style={styles.heroSubtitle}>{slide.subtitle}</Text>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>

          {/* ── INSTANT PICKUP STRIP ── */}
          <Animated.View
            style={[
              styles.pickupCard,
              {
                opacity: fadeAnim,
                backgroundColor: "#0D1F1C",
                borderColor: "#1A3330",
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Top row: text + truck icon */}
            <View style={styles.pickupRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickupTitle, { color: theme.text }]}>
                  Instant Pickup
                </Text>
                <Text style={[styles.pickupSubtitle, { color: theme.subText }]}>
                  Professional care at your doorsteps
                </Text>
              </View>
              {/* <View style={[styles.truckIconWrap, { backgroundColor: PRIMARY }]}>
                <Truck size={18} color="#000" />
              </View> */}
            </View>

            {/* Divider */}
            <View
              style={[styles.pickupDivider, { backgroundColor: "#1A3330" }]}
            />

            {/* Swipe to Book */}
            <View
              style={[styles.swipeContainer, { backgroundColor: "#071018" }]}
            >
              <Animated.View
                style={[
                  styles.swipeDraggable,
                  {
                    transform: [{ translateX: dragX }],
                    backgroundColor: PRIMARY,
                  },
                ]}
                {...panResponder.panHandlers}
              >
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={onPressBook}
                  style={styles.swipeDraggableInner}
                >
                  <Ionicons name="chevron-forward" size={18} color="#000" />
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.swipeTextWrap} pointerEvents="none">
                <Text style={styles.swipeHint}>SWIPE TO BOOK</Text>
              </View>
            </View>
          </Animated.View>
          {/* ── SERVICES ── */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Our Services
                </Text>
                {/* <TouchableOpacity>
                  <Text style={[styles.viewAll, { color: PRIMARY }]}>View All</Text>
                </TouchableOpacity> */}
              </View>

              {/* 2-column grid */}
              <View style={styles.servicesGrid}>
                {QUICK_SERVICES.map((s) => {
                  const isFeatured = s.key === "Shoe Spa";
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[
                        styles.serviceCard,
                        {
                          backgroundColor: "#0D1F1C",
                          borderColor: "#1A3330",
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (["shoe", "laundry", "dryclean"].includes(s.slug)) {
                          // console.log("service param:");
                          router.push({
                            pathname: "/services/[service]",
                            params: {
                              service: s.slug as
                                | "shoe"
                                | "laundry"
                                | "dryclean",
                            },
                          });
                        } else {
                          router.push(`/services/${s.slug}`);
                        }
                      }}
                    >
                      <Animated.View
                        style={{
                          transform: [{ scale: isFeatured ? shoeSpaPulse : 1 }],
                        }}
                      >
                        <View
                          style={[
                            styles.serviceIconWrapper,
                            { backgroundColor: "#0A3D3C" },
                          ]}
                        >
                          <SvgUri uri={s.icon} width={32} height={32} />
                        </View>
                      </Animated.View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.serviceLabel, { color: theme.text }]}
                        >
                          {s.label}
                        </Text>
                        <Text
                          style={[
                            styles.serviceSubtitle,
                            { color: theme.subText },
                          ]}
                        >
                          {s.subtitle}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Animated.View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>

      <FloatingOfferCard
        visible={offerVisible}
        title="Welcome Offer"
        subtitle="Get 20% OFF on your first booking"
        imageUri="https://drydash-app-images.s3.ap-south-1.amazonaws.com/one.jpg"
        ctaText="CLAIM"
        onPress={() => {
          setOfferVisible(false);
          router.push("/book-pickup");
        }}
        onClose={() => setOfferVisible(false)}
      />
      <NotificationsTopSheet visible={open} onClose={() => setOpen(false)} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingTop: 0 },

  /* Hero */
  heroCard: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  heroTagBadge: {
    position: "absolute",
    bottom: 70,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 1,
  },
  heroTextWrap: {
    padding: 10,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 26,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#D1FAE5",
    marginTop: 4,
  },

  /* Instant Pickup Strip */
  pickupStrip: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  pickupTitle: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  pickupSubtitle: { fontSize: 12, fontWeight: "500" },
  truckIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  pickupCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
  },
  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickupDivider: {
    height: 1,
    marginHorizontal: -14,
    opacity: 0.6,
  },

  /* Swipe row (inside card, no outer wrap needed) */
  swipeContainer: {
    height: 52,
    borderRadius: 34,
    padding: 4,
    overflow: "hidden",
    justifyContent: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  swipeTextWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeHint: {
    fontWeight: "800",
    fontSize: 13,
    color: "#FFFFFF",
    letterSpacing: 1.5,
  },
  swipeDraggable: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    zIndex: 2,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  swipeDraggableInner: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Services */
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  viewAll: { fontSize: 13, fontWeight: "700" },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  serviceCard: {
    width: (width - 32 - 10) / 2,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  serviceIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  serviceSubtitle: { fontSize: 11, fontWeight: "500" },
});
