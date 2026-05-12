import AppLoader from "@/components/AppLoader";
import CartSheet from "@/components/CartSheet";
import FloatingCart from "@/components/FloatingCart";
import LearnExploreSection from "@/components/home/Learnexploresection";
import NotificationsTopSheet from "@/components/layout/NotificationsTopSheet";
import { TabBar } from "@/components/layout/TabBar";
import HomeActiveOrderCard from "@/components/orders/HomeActiveOrderCard";
import PickupStatusCard from "@/components/orders/OrderCard";
import ProductServicePopup from "@/components/ProductServicePopup";
import { getMeApi } from "@/features/auth/auth.api";
import { getAllSearchedActiveItems } from "@/features/catalog/catalog.api";
import { getActivePickupOrOrder } from "@/features/pickups/pickup.api";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
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
import { useTheme } from "../../../../context/ThemeContext";
import { useAddress } from "@/context/AddressContext";
import { useNotifications } from "@/context/NotificationContext";
import UnserviceableArea from "@/components/UnserviceableArea";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

type HomeOrder = {
  _id?: string;
  order_id?: string;
  status?: string;
  isPaid?: boolean;
  totalAmount?: number;
  price?: number;
  items?: Array<unknown>;
  createdAt?: string;
  updatedAt?: string;
};

// Type for API search result items
type SearchResultItem = {
  _id: string;
  label: string;
  price: number;
  displayPrice: string;
  unit: string;
  type: string;
  mainHeading: string;
  mainDescription: string;
  images: Array<{ url: string }>;
  process: Array<{
    step: number;
    heading: string;
    description: string;
  }>;
  category: {
    _id: string;
    label: string;
    slug: string;
  };
};

const QUICK_SERVICES = [
  {
    key: "Shoe Spa",
    slug: "shoe",
    label: "Shoe-Spa",
    subtitle: "Sneakers & Shoe care",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/icons/shoes.svg",
    featured: true,
  },
  {
    key: "Dry Clean",
    slug: "dryclean",
    label: "Dry-Clean",
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
    label: "On-Site",
    subtitle: "At-home service",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/icons/onsite.svg",
  },
  {
    key: "carwash",
    slug: "carwash",
    label: "Car-Wash",
    subtitle: "At-home service",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/icons/carwash.svg",
  },
  {
    key: "express",
    slug: "express",
    label: "8-Hour Delivery",
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
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/h_shoe.png",
    },
  },
  {
    key: "shoe-2",
    tag: "SHOFA CARE",
    title: "Sofa Deep Cleaning",
    subtitle: "Whitening • Polishing • Protection",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/h_sofa.png",
    },
  },
  {
    key: "premium-1",
    tag: "Silk • Wool • Designer Wear",
    title: "Luxury Garment Care",
    subtitle: "Deep cleaning for high-end fabrics",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/h_suit.png",
    },
  },
  {
    key: "onsite-1",
    tag: "ON-SITE",
    title: "Doorstep Cleaning Service",
    subtitle: "Carpets • Sofas • Mattresses",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/h_onsite.png",
    },
  },
  {
    key: "laundry-2",
    tag: "Charges",
    title: "",
    subtitle: "",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/h_offer.png",
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
  const { user, setAuthUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const params = useLocalSearchParams<{ orderPlaced?: string }>();
  const [offerVisible, setOfferVisible] = useState(true);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [activeType, setActiveType] = useState<"none" | "pickup" | "order">("none");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Search states
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  // inside the component
  const { zoneData, serviceData, serviceLoading } = useAddress();
  const { notifications } = useNotifications();

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

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await getAllSearchedActiveItems(query);
      if (response?.data?.data && Array.isArray(response.data.data)) {
        setSearchResults(response.data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Handle search input with debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowSearchResults(text.length > 0);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search to avoid too many API calls
    if (text.length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(text);
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  // Transform API search result to match ProductServicePopup format
  const transformSearchResult = (item: SearchResultItem) => {
    const categoryMap: Record<string, string> = {
      dryclean: "DryClean",
      laundry: "Laundry",
      shoe: "Shoe Spa",
    };

    const categoryLabel =
      item.category?.label || categoryMap[item.type] || item.type;

    return {
      id: item._id,
      title: item.label,
      price: item.price,
      category: categoryLabel,
      image: item.images?.[0]?.url || "",
      description: item.mainDescription,
      process: item.process,
      displayPrice: item.displayPrice,
      unit: item.unit,
    };
  };

  const handleProductPress = (item: SearchResultItem) => {
    const transformedProduct = transformSearchResult(item);
    setSelectedProduct(transformedProduct);
    setPopupVisible(true);
    setShowSearchResults(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const refreshBooking = useCallback(async () => {
    const phone = user?.user?.phone ?? user?.phone ?? "";
    if (!phone) {
      setActiveType("none");
      setActiveBooking(null);
      setBookingLoading(false);
      return;
    }
    const phoneWithCountryCode = `91${phone}`;

    try {
      setBookingLoading(true);
      const res = await getActivePickupOrOrder(phoneWithCountryCode);
      const type = res?.data?.type;
      const data = res?.data?.data;

      if (type === "pickup" && data) {
        setActiveType("pickup");
        setActiveBooking(data);
      } else if (type === "order" && data && !data.isArchived) {
        setActiveType("order");
        setActiveBooking(data);
      } else {
        setActiveType("none");
        setActiveBooking(null);
      }

      // if (__DEV__) {
      //   console.log("[home] active booking refresh", { type, data });
      // }
    } catch (error) {
      console.log("Home active booking refresh error:", error);
      setActiveType("none");
      setActiveBooking(null);
    } finally {
      setBookingLoading(false);
    }
  }, [user]);

  const words = ["Shoe Spa", "Laundry", "Dry Cleaning"];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderAnim = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);
  const PLACEHOLDER_LINE_HEIGHT = 20;

  useEffect(() => {
    if (isFocused || searchQuery.length > 0) return;

    const timer = setTimeout(() => {
      Animated.timing(placeholderAnim, {
        toValue: -PLACEHOLDER_LINE_HEIGHT,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setPlaceholderIndex((prev) => (prev + 1) % words.length);
        placeholderAnim.setValue(0);
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [placeholderIndex, isFocused, searchQuery, placeholderAnim]);

  useEffect(() => {
    refreshBooking();
  }, [refreshBooking]);

  const lastNotificationIdRef = useRef<string | null>(null);

  // Refresh booking card in real-time on new notifications
  useEffect(() => {
    if (!notifications?.length) return;

    const latestNotification = notifications[0];

    if (lastNotificationIdRef.current === latestNotification?.id) {
      return;
    }

    lastNotificationIdRef.current = latestNotification?.id;

    if (
      [
        "pickup_Created",
        "pickup_Assigned",
        "pickup_Rescheduled",
        "pickup_Updated",
        "pickup_Completed",
        "out_for_Delivery",
        "order_Delivered",
        "system",
      ].includes(latestNotification?.kind)
    ) {
      refreshBooking();
    }
  }, [notifications]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // ─── Constants ────────────────────────────────────────────────────────────────
  const THUMB_SIZE = 44;
  const PADDING = 4;
  const swipeContainerWidth = width - 32;
  const MAX_DRAG = swipeContainerWidth - THUMB_SIZE - PADDING * 2 - 8;
  const SWIPE_THRESHOLD = MAX_DRAG * 0.5;

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

  // ─── Two animated values: native for thumb, JS for fill ───────────────────────
  const dragXNative = useRef(new Animated.Value(0)).current;
  const dragXJS = useRef(new Animated.Value(0)).current;
  const dragXValue = useRef(0);

  const trackFillWidth = dragXJS.interpolate({
    inputRange: [0, MAX_DRAG],
    outputRange: [THUMB_SIZE + PADDING * 2, swipeContainerWidth - 8],
    extrapolate: "clamp",
  });

  const trackFillOpacity = dragXJS.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.2, SWIPE_THRESHOLD],
    outputRange: [0, 0.18, 0.38],
    extrapolate: "clamp",
  });

  const thumbScale = dragXNative.interpolate({
    inputRange: [0, 10, SWIPE_THRESHOLD],
    outputRange: [1, 1.06, 1.12],
    extrapolate: "clamp",
  });

  const swipeTextOpacity = dragXNative.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.3, SWIPE_THRESHOLD],
    outputRange: [1, 0.1, 0],
    extrapolate: "clamp",
  });

  const swipeTextTranslateX = dragXNative.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 16],
    extrapolate: "clamp",
  });

  const setDrag = (val: number) => {
    const clamped = Math.max(0, Math.min(val, MAX_DRAG));
    dragXNative.setValue(clamped);
    dragXJS.setValue(clamped);
    dragXValue.current = clamped;
  };

  const resetDrag = useCallback(() => {
    Animated.parallel([
      Animated.spring(dragXNative, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 50,
        mass: 0.5,
      }),
      Animated.spring(dragXJS, {
        toValue: 0,
        useNativeDriver: false,
        damping: 20,
        stiffness: 250,
        mass: 0.5,
      }),
    ]).start(() => {
      dragXValue.current = 0;
    });
  }, []);

  const completeSwipe = useCallback(() => {
    Animated.parallel([
      Animated.timing(dragXNative, {
        toValue: MAX_DRAG,
        duration: 100,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(dragXJS, {
        toValue: MAX_DRAG,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }),
    ]).start(() => {
      router.push("/book-pickup");
      setTimeout(resetDrag, 2000);
    });
  }, [resetDrag]);

  const completeSwipeRef = useRef(completeSwipe);
  const resetDragRef = useRef(resetDrag);
  useEffect(() => {
    completeSwipeRef.current = completeSwipe;
    resetDragRef.current = resetDrag;
  }, [completeSwipe, resetDrag]);

  const onPressBook = () => {
    const animate = (val: Animated.Value, useNative: boolean) =>
      Animated.timing(val, {
        toValue: SWIPE_THRESHOLD + 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: useNative,
      });

    Animated.parallel([
      animate(dragXNative, true),
      animate(dragXJS, false),
    ]).start(() => completeSwipeRef.current());
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 5,
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 5,

      onPanResponderGrant: () => {
        dragXNative.stopAnimation();
        dragXJS.stopAnimation();
      },

      onPanResponderMove: (_, { dx }) => {
        setDrag(dx);
      },

      onPanResponderRelease: (_, { dx, vx }) => {
        const current = dragXValue.current;
        if (current >= SWIPE_THRESHOLD || vx > 0.8) {
          completeSwipeRef.current();
        } else {
          resetDragRef.current();
        }
      },

      onPanResponderTerminate: () => {
        resetDragRef.current();
      },
    }),
  ).current;

  useFocusEffect(
    useCallback(() => {
      dragXJS.setValue(0);
      refreshBooking();
      if (params.orderPlaced === "1") {
        router.setParams({ orderPlaced: undefined });
      }
    }, [params.orderPlaced, refreshBooking]),
  );

  if (loading) return <AppLoader />;

  if (!serviceLoading && zoneData?.zoneFound === false) {
    return (
      <>
        <TabBar
          onOpenNotifications={() => setOpen(true)}
          onWalletPress={() => router.push("/(customer)/wallet")}
          style={{
            backgroundColor: theme.card,
            borderBottomColor: theme.border,
          }}
        />
        <StatusBar style="dark" backgroundColor={theme.background} translucent={false} />
        <UnserviceableArea />
        {/* ✅ Add notifications sheet */}
        <NotificationsTopSheet visible={open} onClose={() => setOpen(false)} />
      </>
    );
  }

  const PRIMARY = theme.primary;

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
        <View>
          {/* ── SEARCH BAR ── */}
          <View style={{ position: "relative", zIndex: 1000 }}>
            <Animated.View
              style={[styles.searchBarWrap, { opacity: fadeAnim }]}
            >
              <View
                style={[
                  styles.searchBar,
                  { backgroundColor: "#0D1F1C", borderColor: "#1A3330" },
                ]}
              >
                <Ionicons
                  name="search-outline"
                  size={18}
                  color="#6B7280"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder=""
                  style={[styles.searchInput, { color: theme.text }]}
                />
                {searchQuery === "" && !isFocused && (
                  <View style={styles.placeholderTicker} pointerEvents="none">
                    <Animated.View
                      style={{
                        transform: [{ translateY: placeholderAnim }],
                      }}
                    >
                      <Text style={styles.placeholderText}>
                        {`Search "${words[placeholderIndex]}"`}
                      </Text>
                      <Text style={styles.placeholderText}>
                        {`Search "${words[(placeholderIndex + 1) % words.length]}"`}
                      </Text>
                    </Animated.View>
                  </View>
                )}
                {searchQuery.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                      setShowSearchResults(false);
                      setSearchResults([]);
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color="#6B7280" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity>
                    {/* <Ionicons name="mic-outline" size={18} color="#6B7280" /> */}
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            {showSearchResults && (
              <View
                style={[
                  styles.searchResultsContainer,
                  { backgroundColor: "#0D1F1C", borderColor: "#1A3330" },
                ]}
              >
                {searchLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="reload-outline" size={30} color="#56BFAB" />
                    <Text
                      style={[styles.loadingText, { color: theme.subText }]}
                    >
                      Searching...
                    </Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  <ScrollView
                    style={styles.searchResultsList}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {searchResults.map((item) => (
                      <TouchableOpacity
                        key={item._id}
                        style={styles.searchResultItem}
                        onPress={() => handleProductPress(item)}
                      >
                        <View style={styles.searchResultImageContainer}>
                          <Image
                            source={{ uri: item.images?.[0]?.url || "" }}
                            style={styles.searchResultImage}
                            resizeMode="cover"
                          />
                        </View>
                        <View style={styles.searchResultContent}>
                          <Text
                            style={[
                              styles.searchResultTitle,
                              { color: theme.text },
                            ]}
                          >
                            {item.label}
                          </Text>
                          <Text
                            style={[
                              styles.searchResultCategory,
                              { color: theme.subText },
                            ]}
                          >
                            {item.category?.label || item.type}
                          </Text>
                          <Text
                            style={[
                              styles.searchResultPrice,
                              { color: theme.primary },
                            ]}
                          >
                            {item.displayPrice || `₹${item.price}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="search-outline" size={40} color="#4B5563" />
                    <Text
                      style={[styles.noResultsText, { color: theme.subText }]}
                    >
                      No products found
                    </Text>
                    <Text
                      style={[styles.noResultsSubtext, { color: "#4B5563" }]}
                    >
                      Try searching for "Shoe Spa" or "Dry Clean"
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

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
                  {slide.image.uri.endsWith(".svg") ? (
                    <SvgUri uri={slide.image.uri} width="100%" height="100%" />
                  ) : (
                    <Animated.Image
                      source={slide.image}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                  )}
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

          {/* ── ACTIVE ORDER / PICKUP STATUS CARD OR SWIPE TO BOOK STRIP ── */}
          {activeType === "pickup" && activeBooking ? (
            <View style={{ marginHorizontal: 16, marginTop: 14 }}>
              <PickupStatusCard
                pickup={activeBooking}
                onPress={() =>
                  router.push({
                    pathname: "/(customer)/order-tracking",
                    params: {
                      pickupId: activeBooking?._id,
                    },
                  })
                }
                onActionComplete={refreshBooking}
              />
            </View>
          ) : activeType === "order" && activeBooking ? (
            <View style={{ marginHorizontal: 16, marginTop: 14 }}>
              <HomeActiveOrderCard
                order={activeBooking}
                onPress={() =>
                  activeBooking.order_id
                    ? router.push(`/orders/${activeBooking.order_id}`)
                    : router.push("/(customer)/(tabs)/orders")
                }
                onClose={() => {
                  setActiveType("none");
                  setActiveBooking(null);
                }}
                onRefresh={refreshBooking}
              />
            </View>
          ) : bookingLoading ? null : (
            <View
              collapsable={false}
              style={{ marginHorizontal: 16, marginTop: 14 }}
            >
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
                <View
                  style={[
                    styles.swipeContainer,
                    { backgroundColor: "#071018" },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.swipeTrackFill,
                      {
                        width: trackFillWidth,
                        opacity: trackFillOpacity,
                      },
                    ]}
                    pointerEvents="none"
                  />

                  <Animated.View
                    style={[
                      styles.swipeDraggable,
                      {
                        backgroundColor: PRIMARY,
                        transform: [
                          { translateX: dragXNative },
                          { scale: thumbScale },
                        ],
                      },
                    ]}
                    {...panResponder.panHandlers}
                  >
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={onPressBook}
                      style={styles.swipeDraggableInner}
                    >
                      <Ionicons
                        name="bag-check-outline"
                        size={20}
                        color="#000"
                      />
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.swipeTextWrap,
                      {
                        opacity: swipeTextOpacity,
                        transform: [{ translateX: swipeTextTranslateX }],
                      },
                    ]}
                    pointerEvents="none"
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <Text style={styles.swipeHint}>
                        SWIPE FOR INSTANT PICKUP
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={14}
                        color="#4B5563"
                      />
                    </View>
                  </Animated.View>
                </View>
              </Animated.View>
            </View>
          )}

          {/* ── SERVICES ── */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.section}>
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
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Animated.View>
        </View>
        <LearnExploreSection />

        <View style={styles.wrapper}>
          <LinearGradient
            colors={["#001A17", "#00332B", "#004D3F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.7 }}
            style={styles.card}
          >
            <View style={styles.glowCircle} />

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

      <FloatingCart onOpen={() => setCartOpen(true)} />

      <NotificationsTopSheet visible={open} onClose={() => setOpen(false)} />

      <ProductServicePopup
        visible={popupVisible}
        onOpenCart={() => setCartOpen(true)}
        onClose={() => {
          setPopupVisible(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      <CartSheet visible={cartOpen} onClose={() => setCartOpen(false)} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  searchResultsContainer: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    maxHeight: 400,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 1001,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchResultsList: {
    maxHeight: 400,
  },
  searchResultItem: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A3330",
  },
  searchResultImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: "#1A3330",
  },
  searchResultImage: {
    width: "100%",
    height: "100%",
  },
  searchResultContent: {
    flex: 1,
    justifyContent: "center",
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  searchResultCategory: {
    fontSize: 11,
    marginBottom: 2,
  },
  searchResultPrice: {
    fontSize: 13,
    fontWeight: "700",
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    marginTop: 10,
  },
  noResultsContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 12,
    textAlign: "center",
  },
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingBottom: 15,
    paddingTop: 10,
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
  placeholderTicker: {
    position: "absolute",
    left: 36,
    right: 46,
    top: 14,
    height: 18,
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  placeholderText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
    includeFontPadding: false,
  },
  swipeTrackFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 34,
    backgroundColor: "#00C896",
  },
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
  heroTextWrap: {
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
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
    marginLeft: 30,
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
  section: { marginTop: 20, paddingHorizontal: 16 },
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
