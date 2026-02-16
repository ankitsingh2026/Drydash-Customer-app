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
    key: "Doorstep",
    slug: "doorstep",
    label: "Doorstep",
    icon: "hammer",
    featured: false,
  },
];


const HERO_SLIDES = [
  {
    key: "shoe-1",
    tag: "SHOE SPA",
    title: "Premium Shoe Cleaning",
    subtitle: "Deep clean • Deodorize • Restore",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero_shoespa.jpg",
    },
  },
  {
    key: "shoe-2",
    tag: "SHOE CARE",
    title: "Sneaker & Leather Care",
    subtitle: "Whitening • Polishing • Protection",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/shoespa1.jpg",
    },
  },
  {
    key: "laundry-1",
    tag: "LAUNDRY",
    title: "Dry Cleaning & Steam Press",
    subtitle: "Formal • Ethnic • Delicates",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/laundry2.jpg",
    },
  },
  {
    key: "onsite-1",
    tag: "ON-SITE",
    title: "Doorstep Cleaning Service",
    subtitle: "Carpets • Sofas • Mattresses",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero_onsite.jpg",
    },
  },
  {
    key: "laundry-2",
    tag: "PREMIUM",
    title: "Luxury Garment Care",
    subtitle: "Silk • Wool • Designer Wear",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/premium.jpg",
    },
  },
];

export default function Home() {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

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

 
  // Show skeleton loader while loading
  if (loading) {
    return <HomeScreenSkeleton />;
  }
 
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
        <View
       style={styles.scrollContent}
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
          event.nativeEvent.contentOffset.x / (CARD_WIDTH + 16)
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
          {/* Offer Card */}
       

          {/* Quick Services - Shoe Spa Featured */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Service Catalog
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
              <TouchableOpacity activeOpacity={0.8} style={styles.claimBtn}>
                <Text style={styles.claimText}>Claim Now</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={{ height: 60 }} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {  
  paddingTop: 2, },
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
  claimBtn: {
    backgroundColor: "#D4AF37",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",

    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  claimText: {
    color: "#0B1F1A",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
  },
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
