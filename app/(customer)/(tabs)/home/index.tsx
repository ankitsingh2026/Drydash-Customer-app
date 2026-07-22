

import AppLoader from "@/components/AppLoader";
import CartSheet from "@/components/CartSheet";
import FloatingCart from "@/components/FloatingCart";
import LearnExploreSection from "@/components/home/Learnexploresection";
import NotificationsTopSheet from "@/components/layout/NotificationsTopSheet";
import { TabBar } from "@/components/layout/TabBar";
import HomeActiveOrderCard from "@/components/orders/HomeActiveOrderCard";
import PickupStatusCard from "@/components/orders/OrderCard";
import ProductServicePopup from "@/components/ProductServicePopup";
import DelayBanner from "@/components/home/DelayBanner";
import RainBackground from "@/components/home/RainBackground";
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
import SlotPicker from "@/components/SlotPicker";
import SwipeToAction from "@/components/SwipeToAction";
import ShoesIcon from "../../../../assets/homeicons/Shoes.svg";
import DrycleanIcon from "../../../../assets/homeicons/DryClean-logo.svg";
import LaundryIcon from "../../../../assets/homeicons/Laundry-logo.svg";
import LeatherIcon from "../../../../assets/homeicons/leather.svg";
import OnsiteIcon from "../../../../assets/homeicons/on-site.svg";
import CarwashIcon from "../../../../assets/homeicons/car-wash.svg";
import ExpressIcon from "../../../../assets/homeicons/8-hours-delivery.svg";
import Banner from "../../../../assets/homeicons/Banner1.svg";
import LottieView from "lottie-react-native";
import { DotLottie } from '@lottiefiles/dotlottie-react-native';

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
    label: "SHOE SPA",
    subtitle: "Deep Clean and restore",
    timelineText: "Up to 24 hours",
    icon: ShoesIcon,
    featured: true,
  },
  {
    key: "Dry Clean",
    slug: "dryclean",
    label: "APPAREL DRY CLEAN",
    subtitle: "Gentle and premium care",
    timelineText: "Up to 8 hours",
    icon: DrycleanIcon,
  },
  // {
  //   key: "Laundry",
  //   slug: "laundry",
  //   label: "LAUNDRY",
  //   subtitle: "Fresh & hygienic",
  //   timelineText: "Up to 24 hours",
  //   icon: LaundryIcon,
  // },
  {
    key: "Leather",
    slug: "leather",
    label: "LEATHER & LUXURY",
    subtitle: "Specialized care for leather",
    timelineText: "Up to 48 hours",
    icon: LeatherIcon,
  },
  {
    key: "Onsite",
    slug: "onsite",
    label: "On-Site",
    subtitle: "At-home service",
    icon: OnsiteIcon,
  },
  {
    key: "carwash",
    slug: "carwash",
    label: "Car-Wash",
    subtitle: "At-home service",
    icon: CarwashIcon,
  },
  {
    key: "express",
    slug: "express",
    label: "8-Hour Delivery",
    subtitle: "Express Delivery",
    icon: ExpressIcon,
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
  const styles = makeStyles(theme);
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
  const TAB_BAR_HEIGHT = 0;

  // Search states
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  // inside the component
  const { zoneData, serviceData, serviceLoading, selectedAddress: contextSelectedAddress, loading: addressLoading } = useAddress();
  const delayInfo = serviceData?.data?.zoneInfo?.delayInfo;

  const { notifications, cancelledData } = useNotifications();

  // Force DotLottie to re-mount every time this screen gains focus
  const [lottieKey, setLottieKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setLottieKey((prev) => prev + 1);
    }, [])
  );



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
  }, [user, cancelledData]);

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
  }, [refreshBooking, cancelledData]);

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
  const SWIPE_THRESHOLD = MAX_DRAG * 0.25;

  const heroAnims = useRef(
    Array.from({ length: HERO_SLIDES.length }).map(() => new Animated.Value(0)),
  ).current;

  const shoeSpaPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!addressLoading && zoneData !== null) {
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
      }, 500);

      return () => clearTimeout(t);
    }
  }, [addressLoading, zoneData]);

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
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(-1);
  const [selectedSlotData, setSelectedSlotData] = useState<any>(null);
  const [hasAvailableSlots, setHasAvailableSlots] = useState(true);
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

  // const completeSwipe = useCallback(() => {
  //   Animated.parallel([
  //     Animated.timing(dragXNative, {
  //       toValue: MAX_DRAG,
  //       duration: 100,
  //       easing: Easing.out(Easing.quad),
  //       useNativeDriver: true,
  //     }),
  //     Animated.timing(dragXJS, {
  //       toValue: MAX_DRAG,
  //       duration: 500,
  //       easing: Easing.out(Easing.quad),
  //       useNativeDriver: false,
  //     }),
  //   ]).start(() => {
  //     router.push("/book-pickup");
  //     setTimeout(resetDrag, 2000);
  //   });
  // }, [resetDrag]);

  const completeSwipe = useCallback(() => {
    Animated.parallel([
      Animated.timing(dragXNative, {
        toValue: MAX_DRAG,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(dragXJS, {
        toValue: MAX_DRAG,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(() => {
      router.push("/book-pickup");
      setTimeout(resetDrag, 500);
    });
  }, [resetDrag]);

  const completeSwipeRef = useRef(completeSwipe);
  const resetDragRef = useRef(resetDrag);
  useEffect(() => {
    completeSwipeRef.current = completeSwipe;
    resetDragRef.current = resetDrag;
  }, [completeSwipe, resetDrag]);

  // const onPressBook = () => {
  //   const animate = (val: Animated.Value, useNative: boolean) =>
  //     Animated.timing(val, {
  //       toValue: SWIPE_THRESHOLD + 0,
  //       duration: 200,
  //       easing: Easing.out(Easing.cubic),
  //       useNativeDriver: useNative,
  //     });

  //   Animated.parallel([
  //     animate(dragXNative, true),
  //     animate(dragXJS, false),
  //   ]).start(() => completeSwipeRef.current());
  // };

  const onPressBook = () => {
    Animated.parallel([
      Animated.timing(dragXNative, {
        toValue: MAX_DRAG * 0.25,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(dragXJS, {
        toValue: MAX_DRAG * 0.25,
        duration: 120,
        useNativeDriver: false,
      }),
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
        if (
          current >= SWIPE_THRESHOLD || // 25%
          vx > 0.35                     // quick flick
        ) {
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

  const PRIMARY = theme.primary;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
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
          style={theme.statusBar}
          backgroundColor={theme.background}
          translucent={false}
        />

        {!serviceLoading && zoneData?.zoneFound === false ? (
          <UnserviceableArea />
        ) : (
          <>
            {delayInfo?.isDelay && delayInfo?.category === 'WEATHER' && (
              <RainBackground />
            )}
            <ScrollView style={[styles.root, { backgroundColor: delayInfo?.isDelay && delayInfo?.category === 'WEATHER' ? 'transparent' : theme.background }]} contentContainerStyle={{ paddingBottom: 100 }}
            // showsVerticalScrollIndicator={false}
            // keyboardShouldPersistTaps="handled"
            // nestedScrollEnabled={true}
            // bounces={false}            
            // overScrollMode="never"        
            >
              <View>

                {/* ── SEARCH BAR ── */}
                <View style={{ position: "relative", zIndex: 1000 }}>
                  <Animated.View
                    style={[styles.searchBarWrap, { opacity: fadeAnim }]}
                  >
                    <View
                      style={[
                        styles.searchBar,
                        { backgroundColor: theme.inputBackground, borderColor: theme.border },
                      ]}
                    >
                      <Ionicons
                        name="search-outline"
                        size={18}
                        color={theme.textSecondary}
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
                          <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity>
                          {/* <Ionicons name="mic-outline" size={18} color={theme.textSecondary} /> */}
                        </TouchableOpacity>
                      )}
                    </View>
                  </Animated.View>

                  {showSearchResults && (
                    <View
                      style={[
                        styles.searchResultsContainer,
                        { backgroundColor: theme.modalBackground, borderColor: theme.border },
                      ]}
                    >
                      {searchLoading ? (
                        <View style={styles.loadingContainer}>
                          <Ionicons name="reload-outline" size={30} color={theme.primary} />
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
                        // keyboardShouldPersistTaps="handled"
                        // bounces={false}

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

                {delayInfo?.isDelay && (
                  <DelayBanner delayInfo={delayInfo} />
                )}

                <TouchableOpacity
                  activeOpacity={0.92}
                  style={{
                    height: 130,
                    width: "100%",
                    paddingHorizontal: 16,
                  }}
                >
                  <DotLottie
                    key={lottieKey}
                    source={require("../../../../assets/Anim_Banner.lottie")}
                    autoPlay
                    loop
                    style={{ width: "100%", height: "100%" }}
                  />
                    {/* <Banner
                    width="100%"
                    height={130}
                    preserveAspectRatio="xMidYMid meet"
                  /> */}
                </TouchableOpacity>
                {/* ── AVAILABLE SLOTS ── */}
                {activeType === 'none' && !bookingLoading && (
                  <View style={{ marginHorizontal: 12 }}>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: 11,
                        fontWeight: "800",
                        letterSpacing: 0.7,
                        // marginBottom: 0,
                      }}
                    >
                      AVAILABLE SLOTS
                    </Text>

                    {contextSelectedAddress?.latitude && contextSelectedAddress?.longitude ? (
                      <SlotPicker
                        lat={contextSelectedAddress.latitude}
                        lng={contextSelectedAddress.longitude}
                        zoneId={zoneData?.zoneId}
                        selectedSlot={selectedSlotIndex}
                        autoScroll={selectedSlotIndex < 0}
                        onSelect={(index: number, slot: any) => {
                          setSelectedSlotIndex(index);
                          setSelectedSlotData(slot);
                          // Navigate to book-pickup with pre-selected slot
                          router.push({
                            pathname: "/(customer)/book-pickup",
                            params: {
                              preSelectedSlotIndex: String(index),
                              preSelectedSlotTime: slot?.time ?? "",
                            },
                          });
                        }}
                        onSlotsUpdate={(slots: any[]) => {
                          const available = slots.some(
                            (s: any) =>
                              s.enabled && s.status !== "expired" && s.availableCapacity > 0
                          );
                          setHasAvailableSlots(available);
                          console.log("ALL SLOTS", slots.length);

                        }}
                        renderSlots={(slots: any[]) => {
                          const visible = slots.filter((s) => s.enabled && s.status !== "expired");
                          const shown = visible.slice(0, 2);
                          const remaining = visible.length - 2;
                          console.log(
                            "VISIBLE",
                            visible.map((s) => ({
                              time: s.time,
                              enabled: s.enabled,
                              status: s.status,
                            }))
                          );
                          return (
                            <View style={{ flexDirection: "row", alignItems: "stretch", gap: 10 }}>
                              {shown.map((slot, i) => {
                                const isFull = slot.availableCapacity === 0;
                                const isFilling =
                                  slot.availableCapacity > 0 && slot.availableCapacity <= 3;
                                return (
                                  <TouchableOpacity
                                    key={i}
                                    activeOpacity={0.88}
                                    disabled={isFull}
                                    onPress={() => {
                                      router.push({
                                        pathname: "/(customer)/book-pickup",
                                        params: {
                                          preSelectedSlotIndex: String(slots.indexOf(slot)),
                                          preSelectedSlotTime: slot?.time ?? "",
                                        },
                                      });
                                    }}
                                    style={{
                                      flex: 1,
                                      minHeight: 86,
                                      backgroundColor: theme.card,
                                      borderRadius: 18,
                                      borderWidth: 1.2,
                                      borderColor: isFull ? theme.border : theme.lightborder,
                                      paddingHorizontal: 14,
                                      paddingVertical: 12,
                                      opacity: isFull ? 0.45 : 1,
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: isFull ? theme.textSecondary : theme.text,
                                        fontSize: 15,
                                        fontWeight: "800",
                                        letterSpacing: 0.2,
                                      }}
                                    >
                                      {slot.time}
                                    </Text>

                                    {isFull ? (
                                      <Text
                                        style={{
                                          color: "#FF6B6B",
                                          fontSize: 11,
                                          fontWeight: "700",
                                          marginTop: 8,
                                        }}
                                      >
                                        Slot Full
                                      </Text>
                                    ) : (
                                      <View
                                        style={{
                                          flexDirection: "row",
                                          alignItems: "center",
                                          marginTop: 8,
                                          gap: 5,
                                        }}
                                      >
                                        <Text style={{ fontSize: 12, color: theme.subText }}>⚡</Text>
                                        <Text
                                          style={{
                                            color: theme.subText,
                                            fontSize: 11,
                                            fontWeight: "700",
                                          }}
                                        >
                                          {isFilling ? "Filling fast" : "Available"}
                                        </Text>
                                      </View>
                                    )}
                                  </TouchableOpacity>
                                );
                              })}

                              {remaining > 0 && (
                                <TouchableOpacity
                                  activeOpacity={0.9}
                                  onPress={() => router.push("/(customer)/book-pickup")}
                                  style={{
                                    width: 64,
                                    minHeight: 86,
                                    backgroundColor: theme.card,
                                    borderRadius: 18,
                                    borderWidth: 1.2,
                                    borderColor: theme.lightborder,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    paddingHorizontal: 8,
                                  }}
                                >
                                  <Text
                                    style={{
                                      color: theme.text,
                                      fontSize: 20,
                                      fontWeight: "900",
                                      lineHeight: 24,
                                    }}
                                  >
                                    +{remaining}
                                  </Text>
                                  <Text
                                    style={{
                                      color: theme.textSecondary,
                                      fontSize: 11,
                                      fontWeight: "700",
                                      marginTop: 2,
                                    }}
                                  >
                                    More
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        }}
                      />
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push("/(customer)/book-pickup")}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          backgroundColor: theme.card,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: theme.border,
                          padding: 14,
                          gap: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: theme.inputBackground,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="location-outline" size={16} color={theme.subText} />
                        </View>
                        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: "600" }}>
                          Select a pickup address to view today's slots
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                {/* ── ACTIVE ORDER / PICKUP STATUS CARD OR SWIPE TO BOOK STRIP ── */}
                {activeType === "pickup" && activeBooking ? (
                  <View style={{ marginHorizontal: 16 }}>
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
                  <View style={{ marginHorizontal: 16 }}>
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
                ) : null}

                {/* ── SERVICES ── */}
                <Animated.View style={{ opacity: fadeAnim }}>
                  <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 0.7 }}>OUR SERVICES </Text>
                      <TouchableOpacity onPress={() => router.push('/services')}>
                        <Text style={{ color: theme.subText, fontSize: 12, fontWeight: '600' }}>VIEW ALL </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {QUICK_SERVICES.slice(0, 3).map((s) => {
                        const isFeatured = s.key === "Shoe Spa";
                        const Icon = s.icon;
                        return (
                          // Replace only the inner card JSX (the TouchableOpacity and its children)
                          <TouchableOpacity
                            key={s.key}
                            style={{
                              flex: 1,
                              backgroundColor: theme.card,
                              borderColor: theme.border,
                              borderWidth: 1,
                              borderRadius: 16,
                              overflow: 'hidden',   // clips icon to card bounds
                            }}
                            activeOpacity={0.85}
                            onPress={() => {
                              if (["shoe", "leather", "dryclean"].includes(s.slug)) {
                                router.push({ pathname: "/services/[service]", params: { service: s.slug as any } });
                              } else {
                                router.push(`/services/${s.slug}`);
                              }
                            }}
                          >
                            {/* Icon area — fills top ~65% of card */}
                            <Animated.View
                              style={{
                                width: "100%",
                                aspectRatio: 1,
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Icon width="80%" height="80%" />
                            </Animated.View>

                            {/* Text area — sits below icon */}
                            <View style={{ paddingHorizontal: 8, paddingBottom: 10, paddingTop: 4 }}>
                              <Text
                                style={{
                                  color: theme.text,
                                  fontSize: 13,
                                  fontWeight: '800',
                                  letterSpacing: 0.6,
                                  marginBottom: 2,
                                }}
                                numberOfLines={1}
                              >
                                {s.label}
                              </Text>
                              {s.timelineText ? (
                                <View
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 5,
                                    marginTop: 0,
                                  }}
                                >
                                  <Ionicons
                                    name="time-outline"
                                    size={12}
                                    color={theme.textSecondary}
                                  />
                                  <Text
                                    style={{
                                      color: theme.textSecondary,
                                      fontSize: 9,
                                      fontWeight: "600",
                                      lineHeight: 11,
                                    }}
                                    numberOfLines={1}
                                  >
                                    {s.timelineText}
                                  </Text>
                                </View>
                              ) : (
                                <Text
                                  style={{
                                    color: theme.textSecondary,
                                    fontSize: 9,
                                    fontWeight: "500",
                                    lineHeight: 11,
                                  }}
                                  numberOfLines={2}
                                >
                                  {s.subtitle}
                                </Text>
                              )}
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
                  colors={theme.ordergradient}
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


            {activeType === 'none' && !bookingLoading && (
              <View style={{
                position: 'absolute',
                bottom: 0,           // anchor to bottom edge
                left: 0,
                right: 0,
                zIndex: 50,
                paddingHorizontal: 16,
                paddingBottom: TAB_BAR_HEIGHT + 2,
                // + (insets.bottom > 0 ? insets.bottom + 8 : 4)
              }}>
                <Animated.View style={{
                  opacity: fadeAnim,
                  transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
                }}>
                  <SwipeToAction
                    title="SWIPE FOR INSTANT PICKUP"
                    threshold={0.25}
                    onComplete={() => router.push("/book-pickup")}
                  />
                </Animated.View>
              </View>
            )}
            <FloatingCart
              onOpen={() => setCartOpen(true)}
              bottomOffset={
                activeType === "none"
                  ? 60
                  : 12
              }
            />
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
          </>
        )}
        <NotificationsTopSheet visible={open} onClose={() => setOpen(false)} />
      </SafeAreaProvider>

      {(loading || serviceLoading) && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 99999, elevation: 99999 }]}>
          <AppLoader />
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
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
    shadowColor: theme.background,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    backgroundColor: theme.modalBackground,
    borderColor: theme.border,
  },
  searchResultsList: {
    maxHeight: 400,
  },
  searchResultItem: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  searchResultImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 12,
    backgroundColor: theme.border,
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
    color: theme.text,
  },
  searchResultCategory: {
    fontSize: 11,
    marginBottom: 2,
    color: theme.textSecondary,
  },
  searchResultPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.subText,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    marginTop: 10,
    color: theme.textSecondary,
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
    color: theme.text,
  },
  noResultsSubtext: {
    fontSize: 12,
    textAlign: "center",
    color: theme.textSecondary,
  },
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingBottom: 1,
    paddingTop: 5,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    backgroundColor: theme.inputBackground,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    paddingVertical: 0,
    color: theme.text,
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
    color: theme.placeholderText,
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
    backgroundColor: theme.primary,
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
    backgroundColor: theme.card,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.text,
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
    color: theme.text,
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
  section: { marginTop: 14, paddingHorizontal: 16 },
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
    backgroundColor: theme.card,
    borderColor: theme.border,
  },
  serviceIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: { fontSize: 14, fontWeight: "800", marginBottom: 2, color: theme.text },
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
    color: theme.subText,
    marginBottom: 10,
    fontWeight: "700",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: theme.text,
    lineHeight: 28,
    marginBottom: 12,
  },
  desc: {
    fontSize: 13,
    color: theme.textSecondary,
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
    borderColor: theme.card,
  },
});