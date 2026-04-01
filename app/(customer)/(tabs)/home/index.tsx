import FloatingOfferCard from "@/components/FloatingOfferCard";
import NotificationsTopSheet from "@/components/layout/NotificationsTopSheet";
import { TabBar } from "@/components/layout/TabBar";
import { useAuthContext } from "@/context/AuthContext";
import { getMeApi } from "@/features/auth/auth.api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets
} from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
import { HomeScreenSkeleton } from "../../../../components/SkeletonLoader";
import { useTheme } from "../../../../context/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

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
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/hero_shoespa.png",
    },
  },
  {
    key: "shoe-2",
    tag: "SHOFA CARE",
    title: "Sofa Deep Cleaning",
    subtitle: "Whitening • Polishing • Protection",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/hero_sofa.png",
    },
  },
  {
    key: "premium-1",
    tag: "Silk • Wool • Designer Wear",
    title: "Luxury Garment Care",
    subtitle: "Deep cleaning for high-end fabrics",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/hero_premiumgarment.png",
    },
  },
  {
    key: "onsite-1",
    tag: "ON-SITE",
    title: "Doorstep Cleaning Service",
    subtitle: "Carpets • Sofas • Mattresses",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/hero_onsite.png",
    },
  },
  {
    key: "laundry-2",
    tag: "PREMIUM",
    title: "Luxury Garment Care",
    subtitle: "Silk • Wool • Designer Wear",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/hero_wel.png",
    },
  },
];

// ─── Active Order Status Card ──────────────────────────────────────────────
function ActiveOrderCard({ onDismiss }: { onDismiss: () => void }) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const STATUS_STEPS = ["PICKED UP", "IN TRANSIT", "DELIVERED"];
  const currentStep = 1; // IN TRANSIT

  return (
    <Animated.View
      style={[
        styles.activeOrderCard,
        { opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Header row */}
      <View style={styles.activeOrderHeader}>
        <View style={styles.activeOrderBadgeRow}>
          <View style={styles.activeDot} />
          <Text style={styles.activeOrderLabel}>ACTIVE ORDER</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Status text */}
      <View style={styles.activeOrderStatusRow}>
        <View>
          <Text style={styles.activeOrderTitle}>Rider is on the way</Text>
          <Text style={styles.activeOrderEta}>Expected arrival in 8 mins</Text>
        </View>
        {/* Bike icon */}
        <View style={styles.bikeIconWrap}>
          <Ionicons name="bicycle" size={22} color="#00C896" />
        </View>
      </View>

      {/* Progress tracker */}
      <View style={styles.progressRow}>
        {STATUS_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          return (
            <View key={step} style={styles.progressStepWrap}>
              {/* Connector line before */}
              {idx > 0 && (
                <View
                  style={[
                    styles.progressLine,
                    { backgroundColor: idx <= currentStep ? "#00C896" : "#1E3530" },
                  ]}
                />
              )}
              <View
                style={[
                  styles.progressDot,
                  isCompleted || isActive
                    ? { backgroundColor: "#00C896", borderColor: "#00C896" }
                    : { backgroundColor: "transparent", borderColor: "#1E3530" },
                ]}
              >
                {isCompleted && (
                  <Ionicons name="checkmark" size={10} color="#000" />
                )}
                {isActive && <View style={styles.progressDotInner} />}
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  { color: isCompleted || isActive ? "#00C896" : "#4B5563" },
                ]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Divider */}
      <View style={styles.activeOrderDivider} />

      {/* Rider info */}
      <View style={styles.riderRow}>
        {/* Avatar */}
        <View style={styles.riderAvatar}>
          <Text style={styles.riderAvatarText}>RS</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.riderName}>Rahul Sharma</Text>
          <View style={styles.riderRatingRow}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.riderRating}> 4.92 · Professional Partner</Text>
          </View>
        </View>
        {/* Actions */}
        <TouchableOpacity style={styles.riderActionBtn}>
          <Ionicons name="call-outline" size={18} color="#00C896" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.riderActionBtn, { marginLeft: 8 }]}>
          <Ionicons name="chatbubble-outline" size={18} color="#00C896" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
export default function Home() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState("Ankit");
  const [orderBooked, setOrderBooked] = useState(false);
  const { setAuthUser, logout } = useAuthContext();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const params = useLocalSearchParams<{ orderPlaced?: string }>();
  const [offerVisible, setOfferVisible] = useState(true);

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


  //  const triggerBooking = () => {
  //     Animated.timing(dragX, {
  //       toValue: SWIPE_THRESHOLD,
  //       duration: 200,
  //       easing: Easing.out(Easing.quad),
  //       useNativeDriver: true,
  //     }).start(() => {
  //       router.push("/book-pickup");
  //       setTimeout(() => {
  //         Animated.spring(dragX, { toValue: 0, useNativeDriver: true }).start();
  //       }, 600);
  //     });
  //   };

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
            }, 400);
          });
        } else {
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
      // When returning from book-pickup with success flag, show order card
      if (params.orderPlaced === "1") {
        setOrderBooked(true);

        router.setParams({ orderPlaced: undefined });
      }
    }, [params.orderPlaced]),
  );

  if (loading) return <HomeScreenSkeleton />;

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
      <ScrollView style={[styles.root, { backgroundColor: theme.background }]}>
        <View
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* ── SEARCH BAR ── */}
          <Animated.View style={[styles.searchBarWrap, { opacity: fadeAnim }]}>
            <View style={[styles.searchBar, { backgroundColor: "#0D1F1C", borderColor: "#1A3330" }]}>
              <Ionicons name="search-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder='Search "Shoe Spa"'
                placeholderTextColor="#4B5563"
                style={[styles.searchInput, { color: theme.text }]}
                returnKeyType="search"
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#6B7280" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity>
                  <Ionicons name="mic-outline" size={18} color="#6B7280" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

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
                  {/* <View style={styles.heroOverlay} /> */}

                  {/* Tag badge */}
                  {/* <View style={[styles.heroTagBadge, { backgroundColor: PRIMARY }]}>
                    <Text style={styles.heroTagText}>{slide.tag}</Text>
                  </View> */}

                  {/* Text */}
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

          {/* Carousel dots */}
          <View style={styles.dotsRow}>
            {HERO_SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex
                    ? { backgroundColor: PRIMARY, width: 16 }
                    : { backgroundColor: "#1A3330", width: 6 },
                ]}
              />
            ))}
          </View>

          {/* ── ACTIVE ORDER CARD (shown after booking) ── */}
          {orderBooked && (
            <ActiveOrderCard onDismiss={() => setOrderBooked(false)} />
          )}

          {/* ── SWIPE TO BOOK STRIP ── */}
          {!orderBooked && <Animated.View
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
            {/* Top row: label */}
            {/* <View style={styles.pickupRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickupTitle, { color: theme.text }]}>
                  Instant Pickup
                </Text>
                <Text style={[styles.pickupSubtitle, { color: theme.subText }]}>
                  Professional care at your doorsteps
                </Text>
              </View>
            </View> */}

            {/* Divider */}
            {/* <View style={[styles.pickupDivider, { backgroundColor: "#1A3330" }]} /> */}

            {/* ── Swipe Button – Image 2 style ── */}
            <View style={[styles.swipeContainer, { backgroundColor: "#071018" }]}>
              {/* Draggable thumb */}
              <Animated.View
                style={[
                  styles.swipeDraggable,
                  { transform: [{ translateX: dragX }], backgroundColor: PRIMARY },
                ]}
                {...panResponder.panHandlers}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  // onPress={triggerBooking}
                  onPress={onPressBook}
                  style={styles.swipeDraggableInner}
                //delayPressIn={50}
                >
                  {/* Lightning bolt icon */}
                  <Ionicons name="flash" size={20} color="#000" />
                </TouchableOpacity>
              </Animated.View>

              {/* Label + arrow */}
              <View style={styles.swipeTextWrap} pointerEvents="none">
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.swipeHint}>SWIPE FOR INSTANT PICKUP</Text>
                  <Ionicons name="chevron-forward" size={14} color="#4B5563" />
                </View>
              </View>
            </View>
          </Animated.View>}

          {/* ── SERVICES ── */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                {/* <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Our Services
                </Text> */}
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
                            params: { service: s.slug as "shoe" | "laundry" | "dryclean" },
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
                          <SvgUri
                            uri={s.icon}
                            width={32}
                            height={32}
                          />
                        </View>
                      </Animated.View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.serviceLabel, { color: theme.text }]}
                        >
                          {s.label}
                        </Text>
                        {/* <Text
                          style={[styles.serviceSubtitle, { color: theme.subText }]}
                        >
                          {s.subtitle}
                        </Text> */}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.wrapper}>
          {/* Background Gradient */}
          <LinearGradient
            colors={["#001A17", "#00332B", "#004D3F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.7 }}
            style={styles.card}
          >
            {/* Soft Glow Circle (right bottom curve) */}
            <View style={styles.glowCircle} />

            {/* Content */}
            <Text style={styles.tag}>SUSTAINABLE CHOICE</Text>

            <Text style={styles.title}>
              Eco-Friendly{"\n"}Cleaning{"\n"}Solvents
            </Text>

            <Text style={styles.desc}>
              Gentle on your skin,{"\n"}
              gentler on the planet. Our{"\n"}
              green cleaning tech{"\n"}
              preserves fiber life by{"\n"}40%.
            </Text>

          </LinearGradient>
        </View>
      </ScrollView>

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



  searchBarWrap: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 10

  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 0,
  },

  /* ── Hero ── */
  heroCard: {
    width: CARD_WIDTH,
    height: 200,
    borderRadius: 14,
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
    backgroundColor: "rgba(0, 40, 30, 0.55)",
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
    padding: 12,
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

  /* Dots */
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },

  /* ── Active Order Card ── */
  activeOrderCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "#0D1F1C",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1A3330",
    padding: 14,
    gap: 10,
  },
  activeOrderHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeOrderBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#00C896",
  },
  activeOrderLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#00C896",
    letterSpacing: 1.2,
  },
  activeOrderStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeOrderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  activeOrderEta: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 2,
  },
  bikeIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#071A17",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1A3330",
  },

  /* Progress */
  progressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    position: "relative",
    marginTop: 2,
  },
  progressStepWrap: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    position: "relative",
  },
  progressLine: {
    position: "absolute",
    top: 9,
    right: "50%",
    left: "-50%",
    height: 2,
    zIndex: 0,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  progressDotInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#000",
  },
  progressLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  activeOrderDivider: {
    height: 1,
    backgroundColor: "#1A3330",
    marginHorizontal: -14,
  },

  /* Rider row */
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  riderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#00C896",
    alignItems: "center",
    justifyContent: "center",
  },
  riderAvatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#000",
  },
  riderName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  riderRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  riderRating: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  riderActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#071A17",
    borderWidth: 1,
    borderColor: "#1A3330",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Pickup Card ── */
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
  pickupTitle: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  pickupSubtitle: { fontSize: 12, fontWeight: "500" },
  pickupDivider: {
    height: 1,
    marginHorizontal: -14,
    opacity: 0.6,
  },

  /* ── Swipe button ── */
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
    fontSize: 12,
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
    gap: 8,
  },
  serviceCard: {
    width: (width - 32 - 10) / 2,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  serviceIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: { fontSize: 14, fontWeight: "800", marginBottom: 2 },
  serviceSubtitle: { fontSize: 11, fontWeight: "500" },


  wrapper: {
    padding: 16,
  },

  card: {
    borderRadius: 24,
    padding: 22,
    overflow: "hidden",
  },

  tag: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#6B9E7E",
    marginBottom: 10,
    fontWeight: "700",
  },

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#E6FFF4",
    lineHeight: 28,
    marginBottom: 12,
  },

  desc: {
    fontSize: 13,
    color: "#9CCFC0",
    lineHeight: 18,
    marginBottom: 16,
  },

  link: {
    fontSize: 13,
    color: "#33F0A2",
    fontWeight: "700",
  },

  /* Glow curve */
  glowCircle: {
    position: "absolute",
    right: -40,
    bottom: -40,
    width: 140,
    height: 140,
    borderRadius: 100,
    borderWidth: 18,
    borderColor: "rgba(51,240,162,0.15)",
  },

});