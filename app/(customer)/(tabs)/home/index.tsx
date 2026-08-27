import AppLoader from "@/components/AppLoader";
import CartSheet from "@/components/CartSheet";
import FloatingCart from "@/components/FloatingCart";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import LearnExploreSection from "@/components/home/Learnexploresection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import NotificationsTopSheet from "@/components/layout/NotificationsTopSheet";
import { TabBar } from "@/components/layout/TabBar";
import HomeActiveOrderCard from "@/components/orders/HomeActiveOrderCard";
import PickupStatusCard from "@/components/orders/OrderCard";
import ProductServicePopup from "@/components/ProductServicePopup";
import DelayBanner from "@/components/home/DelayBanner";
import RainBackground from "@/components/home/RainBackground";
import PromoNotificationBanner from "@/components/notifications/PromoNotificationBanner";
import { getMeApi } from "@/features/auth/auth.api";
import { getAllSearchedActiveItems } from "@/features/catalog/catalog.api";
import { getActivePickupOrOrder } from "@/features/pickups/pickup.api";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { PERMISSIONS, request } from "react-native-permissions";
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
import BtoBIcon from "../../../../assets/homeicons/B2B.svg";
import { SvgUri } from "react-native-svg";
import { DotLottie } from '@lottiefiles/dotlottie-react-native';
import { useCart } from "@/context/CartContext";
import { useHomeData } from "@/context/HomeDataContext";
import { ContentServiceItem } from "@/features/content/content.types";

const { width } = Dimensions.get("window");

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

const ICON_MAP: Record<string, React.FC<any>> = {
  "shoe-spa": ShoesIcon,
  "shoe": ShoesIcon,
  "dry-clean": DrycleanIcon,
  "dryclean": DrycleanIcon,
  "leather-luxury": LeatherIcon,
  "leather": LeatherIcon,
  "laundry": LaundryIcon,
  "on-site": OnsiteIcon,
  "onsite": OnsiteIcon,
  "car-wash": CarwashIcon,
  "carwash": CarwashIcon,
  "b2b-services": BtoBIcon,
  "b2b": BtoBIcon,
  "8-hours-delivery": ExpressIcon,
  "express": ExpressIcon,
};

export const normalizeServiceSlug = (slug: string = ""): string => {
  const s = slug.toLowerCase().trim();
  if (s === "shoe-spa" || s === "shoe") return "shoe";
  if (s === "dry-clean" || s === "dryclean") return "dryclean";
  if (s === "leather-luxury" || s === "leather") return "leather";
  if (s === "laundry") return "laundry";
  if (s === "on-site" || s === "onsite") return "onsite";
  if (s === "car-wash" || s === "carwash") return "carwash";
  if (s === "b2b-services" || s === "b2b") return "b2b";
  if (s === "8-hours-delivery" || s === "express") return "express";
  return s;
};

const QUICK_SERVICES: ContentServiceItem[] = [
  {
    _id: "shoe",
    slug: "shoe-spa",
    title: "SHOE SPA",
    subtitle: "Deep Clean and restore",
    deliveryHours: "24",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "dryclean",
    slug: "dry-clean",
    title: "DRY CLEAN",
    subtitle: "Gentle and premium care",
    deliveryHours: "24",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "leather",
    slug: "leather-luxury",
    title: "LEATHER & LUXURY",
    subtitle: "Specialized care for leather",
    deliveryHours: "48",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "laundry",
    slug: "laundry",
    title: "LAUNDRY",
    subtitle: "Fresh & hygienic",
    deliveryHours: "24",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "onsite",
    slug: "on-site",
    title: "ON-SITE",
    subtitle: "At-home service",
    deliveryHours: "",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "carwash",
    slug: "car-wash",
    title: "CAR-WASH",
    subtitle: "At-home service",
    deliveryHours: "",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "b2b",
    slug: "b2b-services",
    title: "B2B SERVICES",
    subtitle: "Tailored solutions",
    deliveryHours: "",
    mediaUrl: "",
    mediaType: "image",
  },
];

interface ServiceTileProps {
  service: ContentServiceItem | (typeof QUICK_SERVICES)[number];
  cardColor: string;
  borderColor: string;
  textColor: string;
  subTextColor: string;
  onPress: (slug: string) => void;
}

const ServiceTile = React.memo(function ServiceTile({
  service,
  cardColor,
  borderColor,
  textColor,
  subTextColor,
  onPress,
}: ServiceTileProps) {
  const normalized = normalizeServiceSlug(service.slug);
  const FallbackIcon = ICON_MAP[service.slug] || ICON_MAP[normalized] || ShoesIcon;

  const mediaUrl = service.mediaUrl?.trim() || "";
  const isSvg = mediaUrl.endsWith(".svg") || mediaUrl.includes(".svg");
  const isHttp = mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://");

  const timelineText = service.deliveryHours ? `Up to ${service.deliveryHours} hours` : "";
  const subText = service.subtitle || (normalized === "onsite" || normalized === "carwash" ? "At-home service" : normalized === "b2b" ? "Tailored solutions" : "");

  return (
    <TouchableOpacity
      style={[serviceTileStyles.tile, { backgroundColor: cardColor, borderColor }]}
      activeOpacity={0.85}
      onPress={() => onPress(service.slug)}
    >
      <View style={serviceTileStyles.iconWrap}>
        {isHttp && isSvg ? (
          <SvgUri uri={mediaUrl} width="80%" height="80%" />
        ) : isHttp ? (
          <Image source={{ uri: mediaUrl }} style={{ width: "80%", height: "80%" }} resizeMode="contain" />
        ) : (
          <FallbackIcon width="80%" height="80%" />
        )}
      </View>
      <View style={serviceTileStyles.textWrap}>
        <Text style={[serviceTileStyles.label, { color: textColor }]} numberOfLines={1}>
          {service.title}
        </Text>
        {timelineText ? (
          <View style={serviceTileStyles.timelineRow}>
            <Ionicons name="time-outline" size={12} color={subTextColor} />
            <Text style={[serviceTileStyles.timelineText, { color: subTextColor }]} numberOfLines={1}>
              {timelineText}
            </Text>
          </View>
        ) : subText ? (
          <Text style={[serviceTileStyles.subtitle, { color: subTextColor }]} numberOfLines={2}>
            {subText}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

const serviceTileStyles = StyleSheet.create({
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  iconWrap: {
    width: "100%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    paddingHorizontal: 8,
    paddingBottom: 10,
    paddingTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  timelineText: {
    fontSize: 9,
    fontWeight: "600",
    lineHeight: 11,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "500",
    lineHeight: 11,
  },
});

export default function Home() {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(theme, isDark), [theme, isDark]);
  // Read params early so we can skip the AppLoader if coming from a booking redirect
  const params = useLocalSearchParams<{ orderPlaced?: string; justBooked?: string; bookingAddress?: string; bookingSlot?: string }>();
  const isFromBooking = params.justBooked === "1" || params.orderPlaced === "1";
  const [loading, setLoading] = useState(!isFromBooking);
  const fadeAnim = useRef(new Animated.Value(isFromBooking ? 1 : 0)).current;
  const [userName, setUserName] = useState("Ankit");
  const { user, setAuthUser, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState<any>(() =>
    isFromBooking && (params.bookingSlot || params.bookingAddress)
      ? {
          slot: params.bookingSlot,
          pickup_address: { address: params.bookingAddress },
        }
      : null
  );
  const [activeType, setActiveType] = useState<"none" | "pickup" | "order">(
    isFromBooking ? "pickup" : "none"
  );
  const [bookingLoading, setBookingLoading] = useState(false);
  const TAB_BAR_HEIGHT = 0;

  // Search states
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  // inside the component
  const { zoneData, serviceData, serviceLoading, selectedAddress: contextSelectedAddress, isNetworkError, refreshAddresses } = useAddress();
  const addressLoading = useAddress().loading;
  const delayInfo = serviceData?.data?.zoneInfo?.delayInfo;
  const [refreshing, setRefreshing] = useState(false);

  const { notifications, cancelledData, promoNotification, clearPromoNotification } = useNotifications();
  const { items: cartItems } = useCart();
  const cartTotalQty = cartItems.reduce((sum, item) => sum + item.qty, 0);

  // HomeData context – used to skip redundant fetches after a booking redirect
  const { skipNextFetch, setSkipNextFetch, layoutContent, fetchLayoutContent } = useHomeData();

  useEffect(() => {
    fetchLayoutContent();
  }, [fetchLayoutContent]);

  // Force DotLottie to re-mount every time this screen gains focus
  const [lottieKey, setLottieKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setLottieKey((prev) => prev + 1);
    }, [])
  );

  useEffect(() => {
    const checkAuth = async () => {
      // Skip the getMeApi call if we're coming from a fresh booking redirect;
      // the user object is already up-to-date in AuthContext.
      if (skipNextFetch) {
        // Populate userName from the cached user object instead of a network call
        const cachedName = (user as any)?.firstName || (user as any)?.user?.firstName || "";
        if (cachedName) setUserName(cachedName);
        return;
      }
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

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === "android") {
          await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        } else if (Platform.OS === "ios") {
          await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        }
      } catch (error) {
        console.log("Location permission error on Home screen:", error);
      }
    };
    requestLocationPermission();
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

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

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
    console.log('this is the user===>>>',user)
    const phone = user?.user?.phone ?? user?.phone ?? "";

    console.log('this is the phone====>',phone)
    if (!phone) {
      setActiveType("none");
      setActiveBooking(null);
      setBookingLoading(false);
      return;
    }
    const phoneWithCountryCode = `91${phone}`;

    console.log("this is the phonewithCountryCode============>>>>>>>>>>>", phoneWithCountryCode);

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
    } catch (error) {
      console.log("Home active booking refresh error:", error);
      setActiveType("none");
      setActiveBooking(null);
    } finally {
      setBookingLoading(false);
    }
  }, [user, cancelledData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refreshAddresses(),
        refreshBooking(),
        fetchLayoutContent(true),
      ]);
    } catch (e) {
      console.log("Pull to refresh error:", e);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAddresses, refreshBooking, fetchLayoutContent]);

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
    if (skipNextFetch) return;
    refreshBooking();
  }, [refreshBooking, cancelledData, skipNextFetch]);

  const lastNotificationIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Safety fallback timer so loader is NEVER trapped indefinitely
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 4000);
    return () => clearTimeout(safetyTimer);
  }, []);

  useEffect(() => {
    if (isFromBooking) {
      setLoading(false);
      fadeAnim.setValue(1);
      return;
    }
    if (!addressLoading) {
      const t = setTimeout(() => {
        setLoading(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, zoneData !== null ? 300 : 0);

      return () => clearTimeout(t);
    }
  }, [addressLoading, zoneData, isFromBooking]);

  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(-1);
  const [selectedSlotData, setSelectedSlotData] = useState<any>(null);
  const [hasAvailableSlots, setHasAvailableSlots] = useState(true);

  const onServicePress = useCallback(
    (rawSlug: string) => {
      const slug = normalizeServiceSlug(rawSlug);
      if (["shoe", "leather", "dryclean", "laundry"].includes(slug)) {
        router.push({ pathname: "/services/[service]", params: { service: slug as any } });
      } else {
        router.push(`/services/${slug}` as any);
      }
    },
    [router]
  );

  useFocusEffect(
    useCallback(() => {
      refreshBooking();
    }, [refreshBooking])
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaProvider>
        <TabBar
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
            <PromoNotificationBanner
              notification={promoNotification}
              onDismiss={clearPromoNotification}
            />

            <ScrollView
              style={[styles.root, { backgroundColor: delayInfo?.isDelay && delayInfo?.category === 'WEATHER' ? 'transparent' : theme.background }]}
              contentContainerStyle={{ paddingBottom: 50 }}
              scrollEnabled={true}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.primary}
                  colors={[theme.primary]}
                />
              }
            >
              <View>
                {isNetworkError && (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onRefresh}
                    style={{
                      marginHorizontal: 16,
                      marginTop: 12,
                      marginBottom: 6,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderRadius: 16,
                      backgroundColor: isDark ? "rgba(239, 68, 68, 0.12)" : "#FEF2F2",
                      borderWidth: 1,
                      borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#FECACA",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="cloud-offline-outline" size={20} color="#EF4444" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: theme.text }}>
                          Network Connection Error
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 2, lineHeight: 15 }}>
                          Unable to fetch data. Tap to retry or pull down.
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}

                {showSearchResults && (
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowSearchResults(false)}
                    style={{
                      position: "absolute",
                      top: -100,
                      left: -50,
                      right: -50,
                      bottom: -3000,
                      backgroundColor: "rgba(0, 0, 0, 0.45)",
                      zIndex: 999,
                    }}
                  />
                )}

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
                        <TouchableOpacity />
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

                {/* ── HERO BANNER ── */}
                {layoutContent?.herosection?.isActive !== false && layoutContent?.hero_banner?.isActive !== false && (() => {
                  const hero = layoutContent?.herosection || layoutContent?.hero_banner;
                  const mediaUrl = hero?.mediaUrl?.trim() || "";
                  const mediaType = hero?.mediaType?.toLowerCase() || (mediaUrl.endsWith(".lottie") ? "lottie" : "lottie");
                  const isLottie = mediaType === "lottie" || mediaUrl.endsWith(".lottie") || mediaUrl.endsWith(".json");
                  const isSvg = mediaUrl.endsWith(".svg") || mediaUrl.includes(".svg");

                  const handleHeroPress = () => {
                    if (!hero?.link?.trim()) return;
                    const link = hero.link.trim();
                    if (link.startsWith("http://") || link.startsWith("https://")) {
                      Linking.openURL(link);
                    } else {
                      router.push(link as any);
                    }
                  };

                  return (
                    <TouchableOpacity
                      activeOpacity={0.92}
                      onPress={handleHeroPress}
                      style={{
                        height: 250,
                        width: "100%",
                        paddingHorizontal: 16,
                        marginBottom: 6,
                        marginTop: 6,
                      }}
                    >
                      {isLottie || !mediaUrl ? (
                        <DotLottie
                          key={lottieKey + (mediaUrl || "default")}
                          source={mediaUrl ? { uri: mediaUrl } : require("../../../../assets/Anim_Banner.lottie")}
                          autoplay
                          loop
                          style={{ width: "100%", height: "100%" }}
                        />
                      ) : isSvg ? (
                        <SvgUri uri={mediaUrl} width="100%" height="100%" />
                      ) : (
                        <Image
                          source={{ uri: mediaUrl }}
                          style={{ width: "100%", height: "100%", borderRadius: 10 }}
                          resizeMode="cover"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })()}

                {/* ── AVAILABLE SLOTS ── */}
                {activeType === 'none' && !bookingLoading && (
                  <View style={{ marginHorizontal: 12 }}>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: 11,
                        fontWeight: "800",
                        letterSpacing: 0.7,
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
                          router.push({
                            pathname: "/(customer)/book-pickup",
                            params: {
                              preSelectedSlotIndex: String(index),
                              preSelectedSlotTime: slot?.time ?? "",
                              preSelectedDate: slot?.date ?? "",
                              preSelectedIsTomorrow: slot?.isTomorrow ? "true" : "false",
                            },
                          });
                        }}
                        onSlotsUpdate={(slots: any[]) => {
                          const available = slots.some(
                            (s: any) =>
                              s.enabled && s.status !== "expired" && s.availableCapacity > 0
                          );
                          setHasAvailableSlots(available);
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
                {layoutContent?.services_section?.isActive !== false && (() => {
                  const servicesList = (layoutContent?.services && layoutContent.services.length > 0)
                    ? layoutContent.services
                    : (layoutContent?.services_section?.services && layoutContent.services_section.services.length > 0)
                    ? layoutContent.services_section.services
                    : QUICK_SERVICES;
                  const sectionTitle = layoutContent?.services_section?.title?.trim() || "OUR SERVICES";

                  return (
                    <Animated.View style={{ opacity: fadeAnim }}>
                      <View style={styles.section}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 0.7 }}>
                            {sectionTitle.toUpperCase()}{" "}
                          </Text>
                          <TouchableOpacity
                            onPress={() => router.push('/services')}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Text style={{ color: theme.subText, fontSize: 12, fontWeight: '600' }}>VIEW ALL </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {servicesList.slice(0, 3).map((s: ContentServiceItem, index: number) => (
                            <ServiceTile
                              key={s._id || s.slug || String(index)}
                              service={s}
                              cardColor={theme.card}
                              borderColor={theme.border}
                              textColor={theme.text}
                              subTextColor={theme.textSecondary}
                              onPress={onServicePress}
                            />
                          ))}
                        </View>
                      </View>
                    </Animated.View>
                  );
                })()}

                {/* ── AD BANNER ── */}
                {layoutContent?.ad_banner && Boolean(layoutContent.ad_banner.mediaUrl?.trim()) && (() => {
                  const banner = layoutContent.ad_banner!;
                  const mediaUrl = banner.mediaUrl!.trim();
                  const isSvg = mediaUrl.endsWith(".svg") || mediaUrl.includes(".svg");
                  const isLottie = banner.mediaType === "lottie" || mediaUrl.endsWith(".lottie") || mediaUrl.endsWith(".json");

                  const handleBannerPress = () => {
                    if (!banner.link?.trim()) return;
                    const link = banner.link.trim();
                    if (link.startsWith("http://") || link.startsWith("https://")) {
                      Linking.openURL(link);
                    } else {
                      router.push(link as any);
                    }
                  };

                  return (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={handleBannerPress}
                      style={{
                        marginHorizontal: 16,
                        marginTop: 14,
                        borderRadius: 16,
                        overflow: "hidden",
                        height: 120,
                        borderWidth: 1,
                        borderColor: theme.border,
                        backgroundColor: theme.card,
                      }}
                    >
                      {isLottie ? (
                        <DotLottie
                          source={{ uri: mediaUrl }}
                          autoplay
                          loop
                          style={{ width: "100%", height: "100%" }}
                        />
                      ) : isSvg ? (
                        <SvgUri uri={mediaUrl} width="100%" height="100%" />
                      ) : (
                        <Image
                          source={{ uri: mediaUrl }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })()}

              </View>

              {/* ── HOW IT WORKS ── */}
              <HowItWorksSection
                sectionData={layoutContent?.process_section}
                processList={layoutContent?.process}
              />

              {/* ── LEARN & EXPLORE / EXPERIENCE THE CARE ── */}
              <LearnExploreSection
                sectionData={layoutContent?.midsection || layoutContent?.mid_section}
                recentBlogs={layoutContent?.recent_blogs}
              />

              {/* ── WHAT OUR CUSTOMERS SAY ── */}
              <TestimonialsSection
                sectionData={layoutContent?.testimonials_section}
                testimonialsList={layoutContent?.testimonials}
              />

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
                    Eco-Friendly Cleaning{"\n"}Solvents
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

            {activeType === 'none' && !bookingLoading && cartTotalQty === 0 && (
              <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                paddingHorizontal: 16,
                paddingBottom: TAB_BAR_HEIGHT + 2,
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
                activeType === "none" && cartTotalQty === 0
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

      {loading && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 99999, elevation: 99999 }]}>
          <AppLoader />
        </View>
      )}
    </View>
  );
}

const makeStyles = (theme: any, isDark: boolean = false) => StyleSheet.create({
  root: { flex: 1 },

  searchResultsContainer: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    maxHeight: 400,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    zIndex: 1001,
    elevation: 0,
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
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
  section: { marginTop: 14, paddingHorizontal: 16 },
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
    marginBottom: 0,
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