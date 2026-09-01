import ProductServicePopup from "@/components/ProductServicePopup";
import { CatalogSkeleton } from "@/components/skeleton";
import { catalogData, Item } from "@/constants/catalog";
import { getCatalogApi, getCatalogCategoriesApi } from "@/features/catalog/catalog.api";
import {
  getCustomerSinglePickupDetails,
} from "@/features/pickups/pickup.api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  LucideShovel,
  Minus,
  Plus,
  Shirt,
  Sparkles,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  PanResponder,
  StatusBar,
} from "react-native";
import { SvgUri } from "react-native-svg";
import ShoesIcon from "@/assets/homeicons/Shoes.svg";
import DrycleanIcon from "@/assets/homeicons/DryClean-logo.svg";
import LaundryIcon from "@/assets/homeicons/Laundry-logo.svg";
import OnsiteIcon from "@/assets/homeicons/on-site.svg";
import CarwashIcon from "@/assets/homeicons/car-wash.svg";
import ExpressIcon from "@/assets/homeicons/8-hours-delivery.svg";
import LeatherIcon from "@/assets/homeicons/leather.svg";
import BtoBIcon from "@/assets/homeicons/B2B.svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_COLS = 3;
const GRID_GAP = 8;
const GRID_H_PAD = 16; // matches root paddingHorizontal
const CARD_W = (SCREEN_WIDTH - GRID_H_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CartSheet from "../../../../components/CartSheet";
import FloatingCart from "../../../../components/FloatingCart";
import { useCart } from "../../../../context/CartContext";
import { useTheme } from "../../../../context/ThemeContext";
/* ---------- DYNAMIC CATEGORIES ---------- */
export type DynamicCategory = {
  id: string;
  key: string;
  slug: string;
  label: string;
  coverImage?: string;
  itemCount?: number;
  mainHeading?: string;
  mainDescription?: string;
};

const DEFAULT_CATEGORIES: DynamicCategory[] = [
  { id: "shoe", key: "shoe", slug: "shoespa", label: "Shoe Spa" },
  { id: "laundry", key: "laundry", slug: "laundry", label: "Laundry" },
  { id: "leather", key: "leather", slug: "leather", label: "Leather" },
  { id: "dryclean", key: "dryclean", slug: "dryclean", label: "Dry Clean" },
];

const LOCAL_CATEGORY_SVG_MAP: Record<string, React.FC<any>> = {
  "shoe-spa": ShoesIcon,
  "shoespa": ShoesIcon,
  "shoe": ShoesIcon,
  "shoes": ShoesIcon,
  "dry-clean": DrycleanIcon,
  "dryclean": DrycleanIcon,
  "dry": DrycleanIcon,
  "laundry": LaundryIcon,
  "wash": LaundryIcon,
  "leather-luxury": LeatherIcon,
  "leather": LeatherIcon,
  "on-site": OnsiteIcon,
  "onsite": OnsiteIcon,
  "car-wash": CarwashIcon,
  "carwash": CarwashIcon,
  "b2b-services": BtoBIcon,
  "b2b": BtoBIcon,
  "8-hours-delivery": ExpressIcon,
  "express": ExpressIcon,
};

const isSvgUrl = (url?: string): boolean => {
  if (!url) return false;
  const clean = url.split("?")[0].trim().toLowerCase();
  return clean.endsWith(".svg") || clean.includes(".svg");
};

const renderCategoryIcon = (slug = "", label = "", active = false, theme: any) => {
  const s = (slug || label).toLowerCase().trim();
  const color = active ? theme.primary : theme.subText;
  const size = 24;

  // 1. Check local SVG icon map first
  const matchedKey = Object.keys(LOCAL_CATEGORY_SVG_MAP).find(
    (k) => s === k || s.includes(k)
  );
  if (matchedKey) {
    const LocalSvg = LOCAL_CATEGORY_SVG_MAP[matchedKey];
    return <LocalSvg width={36} height={36} />;
  }

  // 2. Vector icon fallbacks
  if (s.includes("shoe")) {
    return <LucideShovel size={size} color={color} />;
  }
  if (s.includes("laundry") || s.includes("wash")) {
    return <Shirt size={size} color={color} />;
  }
  if (s.includes("leather")) {
    return <Ionicons name="briefcase-outline" size={size} color={color} />;
  }
  if (s.includes("dry") || s.includes("clean")) {
    return <Sparkles size={size} color={color} />;
  }
  if (s.includes("linen")) {
    return <Ionicons name="shirt-outline" size={size} color={color} />;
  }
  if (s.includes("travel") || s.includes("bag")) {
    return <Ionicons name="bag-handle-outline" size={size} color={color} />;
  }
  if (s.includes("bed") || s.includes("curtain") || s.includes("decor") || s.includes("home")) {
    return <Ionicons name="bed-outline" size={size} color={color} />;
  }
  if (s.includes("gift")) {
    return <Ionicons name="gift-outline" size={size} color={color} />;
  }
  if (s.includes("beauty")) {
    return <Ionicons name="color-palette-outline" size={size} color={color} />;
  }
  if (s.includes("pharma") || s.includes("med")) {
    return <Ionicons name="medkit-outline" size={size} color={color} />;
  }
  if (s.includes("electr") || s.includes("gadget")) {
    return <Ionicons name="headset-outline" size={size} color={color} />;
  }

  return <Ionicons name="sparkles-outline" size={size} color={color} />;
};


type ProcessStep = {
  step: number;
  heading: string;
  description: string;
};

type APIItem = {
  _id: string;
  label: string;
  price: number;
  displayPrice: string;
  unit: string;
  type: string;
  images: Array<{ url: string }>;
  process: ProcessStep[];
  mainHeading?: string;
  mainDescription?: string;
};

const EMPTY_ARRAY: Item[] = [];

export default function ServiceDetail() {
  const { service, pickupId, mode } = useLocalSearchParams<{
    service: string;
    pickupId?: string;
    mode?: string;
  }>();
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme);
  const cart = useCart();
  const insets = useSafeAreaInsets();
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  const [categories, setCategories] = useState<DynamicCategory[]>(DEFAULT_CATEGORIES);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  const categoryScrollRef = useRef<ScrollView>(null);

  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);

  // API data states
  const [apiData, setApiData] = useState<Record<string, Item[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});

  const [selectedProduct, setSelectedProduct] = useState<Item | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortBy, setSortBy] = useState<"none" | "price_asc" | "price_desc">("none");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const isEditMode = mode === "edit" && Boolean(pickupId);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  const tabRef = useRef(tab);
  tabRef.current = tab;

  const switchTab = (i: number) => {
    setTab(i);
    const targetCat = categories[i];
    if (targetCat) {
      fetchCatalogData(targetCat.slug);
    }
    // Reset filters and search when switching category tabs
    setSortBy("none");
    setMinPrice("");
    setMaxPrice("");
    setTypeFilter("all");
    setSearchQuery("");

    categoryScrollRef.current?.scrollTo({
      x: Math.max(0, i * 78 - SCREEN_WIDTH / 2 + 39),
      animated: true,
    });
  };


  // Dynamic catalog data fetcher
  const fetchCatalogData = async (slug: string) => {
    if (!slug) return;
    const apiSlug = slug === "shoe" ? "shoespa" : slug;

    setLoading((prev) => ({ ...prev, [slug]: true, [apiSlug]: true }));
    setError((prev) => ({ ...prev, [slug]: null, [apiSlug]: null }));

    try {
      const response = await getCatalogApi(apiSlug);
      if (response?.data?.data?.items) {
        const items = response.data.data.items;
        const catLabel =
          categories.find((c) => c.slug === slug || c.key === slug)?.label || slug;

        const transformedItems: Item[] = items.map((item: APIItem) => ({
          id: item._id,
          title: item.label,
          price: item.price,
          mainHeading: item.mainHeading || item.label,
          category: catLabel,
          image: item.images?.[0]?.url || getFallbackImage(slug),
          description:
            item.mainDescription || getDefaultDescription(slug),
          process: item.process || [],
          displayPrice: item.displayPrice,
          unit: item.unit,
          type: item.type,
        }));

        setApiData((prev) => ({
          ...prev,
          [slug]: transformedItems,
          [apiSlug]: transformedItems,
        }));
      } else if (catalogData[slug] || (slug === "shoespa" && catalogData["shoe"])) {
        const fallback = catalogData[slug] || catalogData["shoe"];
        setApiData((prev) => ({ ...prev, [slug]: fallback, [apiSlug]: fallback }));
      }
    } catch (err) {
      console.error(`Error fetching ${slug} catalog data:`, err);
      if (catalogData[slug] || (slug === "shoespa" && catalogData["shoe"])) {
        const fallback = catalogData[slug] || catalogData["shoe"];
        setApiData((prev) => ({ ...prev, [slug]: fallback, [apiSlug]: fallback }));
      } else {
        setError((prev) => ({
          ...prev,
          [slug]: "Failed to load data",
          [apiSlug]: "Failed to load data",
        }));
      }
    } finally {
      setLoading((prev) => ({ ...prev, [slug]: false, [apiSlug]: false }));
    }
  };

  // Helper function for default descriptions
  const getDefaultDescription = (serviceType: string): string => {
    const descriptions = {
      laundry: "Fresh and hygienic wash, fold, and iron service.",
      leather: "Specialized leather care with gentle cleaning and conditioning.",
      dryclean: "Premium dry cleaning service using eco-friendly solvents.",
      shoe: "Expert shoe cleaning and restoration service.",
      shoespa: "Expert shoe cleaning and restoration service.",
    };
    return (
      descriptions[serviceType as keyof typeof descriptions] ||
      "Premium service with expert care."
    );
  };

  // Get fallback image based on service type
  const getFallbackImage = (serviceType: string): string => {
    const S3_BASE =
      "https://drydash-app-images.s3.ap-south-1.amazonaws.com/cart-images";
    switch (serviceType) {
      case "shoe":
      case "shoespa":
        return `${S3_BASE}/sheo-spa/shoe_1.jpg`;
      case "laundry":
        return `https://drydash-app-images.s3.ap-south-1.amazonaws.com/service-catalog/laundry/laundry_1.png`;
      case "leather":
        return `${S3_BASE}/leather/leather.jpg`;
      case "dryclean":
        return `${S3_BASE}/dryclean/dryclean_1.png`;
      default:
        return "";
    }
  };

  const formatDisplayPrice = (item: Item) => {
    if (item.displayPrice) {
      const trimmed = item.displayPrice.trim();
      if (trimmed.startsWith("₹")) return trimmed;
      if (trimmed.startsWith("/")) return `₹${item.price}${trimmed}`;
      return `₹${trimmed}`;
    }
    return `₹${item.price}`;
  };

  // Load dynamic categories on mount
  useEffect(() => {
    let isMounted = true;

    const loadDynamicCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await getCatalogCategoriesApi();
        if (response?.data?.data && Array.isArray(response.data.data)) {
          const apiCats = response.data.data;
          if (apiCats.length > 0 && isMounted) {
            const mapped: DynamicCategory[] = apiCats
              .filter((cat: any) => cat.isActive !== false)
              .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((cat: any) => ({
                id: cat._id || cat.slug || cat.label,
                key: cat.slug || cat.label?.toLowerCase(),
                slug: cat.slug || cat.label?.toLowerCase(),
                label: cat.label || cat.mainHeading || cat.slug,
                coverImage: cat.coverImage ? String(cat.coverImage).trim() : "",
                itemCount: cat.itemCount,
                mainHeading: cat.mainHeading,
                mainDescription: cat.mainDescription,
              }));
            setCategories(mapped);

            let initialIdx = 0;
            if (service) {
              const matchedIdx = mapped.findIndex(
                (c) =>
                  c.slug.toLowerCase() === service.toLowerCase() ||
                  c.key.toLowerCase() === service.toLowerCase() ||
                  (service === "shoe" && c.slug === "shoespa") ||
                  (service === "shoespa" && c.slug === "shoe")
              );
              if (matchedIdx !== -1) initialIdx = matchedIdx;
            }

            setTab(initialIdx);
            fetchCatalogData(mapped[initialIdx].slug);

            setTimeout(() => {
              categoryScrollRef.current?.scrollTo({
                x: Math.max(0, initialIdx * 78 - SCREEN_WIDTH / 2 + 39),
                animated: true,
              });
            }, 150);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load catalog categories from API:", err);
      } finally {
        if (isMounted) setCategoriesLoading(false);
      }

      // If API fails or returns empty, fallback to default categories
      let fallbackIdx = 0;
      if (service) {
        const matched = DEFAULT_CATEGORIES.findIndex(
          (c) =>
            c.slug.toLowerCase() === service.toLowerCase() ||
            c.key.toLowerCase() === service.toLowerCase() ||
            (service === "shoe" && c.slug === "shoespa")
        );
        if (matched !== -1) fallbackIdx = matched;
      }
      setTab(fallbackIdx);
      fetchCatalogData(DEFAULT_CATEGORIES[fallbackIdx].slug);
    };

    loadDynamicCategories();
    return () => {
      isMounted = false;
    };
  }, [service]);


  /* ---------- EDIT MODE: FETCH EXISTING ITEMS AND LOAD INTO CART ---------- */
  // In edit mode, we fetch existing pickup items and load them into the cart
  // so users can see what was previously selected and modify quantities
  useEffect(() => {
    if (!isEditMode || !pickupId) return;

    const fetchPickup = async () => {
      try {
        setPickupLoading(true);
        setPickupError(null);
        const res = await getCustomerSinglePickupDetails(pickupId);
        const details = res?.pickup_details;

        if (!details) {
          setPickupError("Pickup not found");
          return;
        }

        // Load existing items into cart so user can see and modify them
        if (details?.items?.length) {
          // Clear cart first to avoid duplicates
          cart.clear();

          // Deduplicate items by itemId, summing quantities
          const deduped: Record<string, any> = {};
          details.items.forEach((item: any) => {
            const itemId = item.itemId?._id || item.itemId;
            if (!deduped[itemId]) {
              deduped[itemId] = {
                id: itemId,
                title: item.label,
                price: item.price,
                qty: 0,
                image: item.itemId?.images?.[0]?.url || getFallbackImage(service || "shoe"),
                type: item.itemId?.type || item.type,
              };
            }
            deduped[itemId].qty += item.quantity || 1;
          });

          // Add each unique item to cart
          Object.values(deduped).forEach((item: any) => {
            if (item.id && item.qty > 0) {
              cart.addItem(item, item.qty);
            }
          });
        }
      } catch (err: any) {
        setPickupError(err?.message || "Failed to load pickup details");
      } finally {
        setPickupLoading(false);
      }
    };

    fetchPickup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, pickupId, service]);

  /* ---------- STATIC DATA FOR OTHER SERVICES ---------- */
  const S3_BASE =
    "https://drydash-app-images.s3.ap-south-1.amazonaws.com/cart-images";
  const BASE =
    "https://drydash-app-images.s3.ap-south-1.amazonaws.com/cart-images/dryclean";

  const staticData = useMemo<Record<string, Item[]>>(
    () => ({
      shoe: [], // Will be populated by API
      laundry: [], // Will be populated by API
      leather: [], // Will be populated by API
      dryclean: [], // Will be populated by API
      // Add other services here if needed
    }),
    [],
  );

  const activeCategory = categories[tab] || categories[0] || DEFAULT_CATEGORIES[0];

  // Get current items (API data with static catalog fallback)
  const currentItems = useMemo(() => {
    const slug = activeCategory?.slug;
    const key = activeCategory?.key;
    if (!slug && !key) return EMPTY_ARRAY;
    const apiItems = apiData[slug] || (key ? apiData[key] : null);
    if (apiItems && apiItems.length > 0) return apiItems;
    return (
      (slug ? catalogData[slug] : null) ||
      (key ? catalogData[key] : null) ||
      (slug === "shoespa" || key === "shoe" ? catalogData["shoe"] : null) ||
      EMPTY_ARRAY
    );
  }, [activeCategory?.slug, activeCategory?.key, apiData]);

  // Derive available types for the active tab
  const availableTypes = useMemo(() => {
    const types = Array.from(new Set(currentItems.map((i) => i.unit || i.type || "").filter(Boolean)));
    return types;
  }, [currentItems]);

  const activeFilterCount = [
    sortBy !== "none",
    minPrice !== "" || maxPrice !== "",
    typeFilter !== "all",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSortBy("none");
    setMinPrice("");
    setMaxPrice("");
    setTypeFilter("all");
  };

  // Filter items based on search query + active filters
  const filteredItems = useMemo(() => {
    let items = currentItems;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => item.title.toLowerCase().includes(q));
    }
    const min = minPrice !== "" ? parseFloat(minPrice) : null;
    const max = maxPrice !== "" ? parseFloat(maxPrice) : null;
    if (min !== null && !isNaN(min)) items = items.filter((i) => i.price >= min);
    if (max !== null && !isNaN(max)) items = items.filter((i) => i.price <= max);
    if (typeFilter !== "all") items = items.filter((i) => (i.unit || i.type || "") === typeFilter);
    if (sortBy === "price_asc") items = [...items].sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") items = [...items].sort((a, b) => b.price - a.price);
    return items;
  }, [searchQuery, currentItems, sortBy, minPrice, maxPrice, typeFilter]);

  const isLoading =
    activeCategory?.slug
      ? Boolean(loading[activeCategory.slug] || (activeCategory.key && loading[activeCategory.key]))
      : false;

  const hasError =
    activeCategory?.slug
      ? error[activeCategory.slug] || (activeCategory.key ? error[activeCategory.key] : null)
      : null;

  const handleAddToCart = () => {
    if (!pickupId) return;
    // Navigate back to order-tracking with a timestamp to force reload and fetch updated cart items
    router.replace({
      pathname: "/(customer)/order-tracking",
      params: { pickupId, _t: Date.now().toString() },
    });
  };

  const screenOptions = useMemo(
    () => ({
      headerShown: true,
      headerBackVisible: false,
      title: isEditMode ? "EDIT ITEMS" : "SERVICE CATALOG",
      headerStyle: {
        backgroundColor: theme.background,
      },
      headerShadowVisible: false,
      headerTitleAlign: "center" as const,
      headerTitleStyle: {
        fontWeight: "800" as const,
        fontSize: 16,
        color: theme.text,
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 8,
          //  marginLeft: 8,
            borderRadius: 12,
            backgroundColor: theme.card,
          }}
          
        >
          <ArrowLeft size={20} color={theme.text} />
        </TouchableOpacity>
      ),
    }),
    [isEditMode, theme.background, theme.card, theme.text]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <Stack.Screen options={screenOptions} />

      {/* ---------- BLINKIT-STYLE HORIZONTAL CATEGORIES CAROUSEL ---------- */}
      <View style={styles.categoryBarWrapper}>
        <ScrollView
          ref={categoryScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {categories.map((cat, i) => {
            const active = tab === i;
            return (
              <TouchableOpacity
                key={cat.id || cat.slug || i}
                onPress={() => switchTab(i)}
                activeOpacity={0.75}
                style={styles.categoryItem}
              >
                {/* Category Icon - SVG / Remote Image / Local Fallback */}
                <View style={styles.categoryIconWrap}>
                  {cat.coverImage && !brokenImages.has(cat.slug || cat.id) ? (
                    isSvgUrl(cat.coverImage) ? (
                      <SvgUri
                        uri={cat.coverImage}
                        width={20}
                        height={20}
                        onError={() => {
                          setBrokenImages((prev) => new Set(prev).add(cat.slug || cat.id));
                        }}
                      />
                    ) : (
                      <Image
                        source={{ uri: cat.coverImage }}
                        style={styles.categoryCoverImg}
                        resizeMode="contain"
                        onError={() => {
                          setBrokenImages((prev) => new Set(prev).add(cat.slug || cat.id));
                        }}
                      />
                    )
                  ) : (
                    renderCategoryIcon(cat.slug, cat.label, active, theme)
                  )}
                </View>

                {/* Category Name below Icon */}
                <Text
                  numberOfLines={2}
                  style={[
                    styles.categoryItemText,
                    {
                      color: active ? theme.primary : theme.text,
                      fontWeight: active ? "800" : "600",
                    },
                  ]}
                >
                  {cat.label}
                </Text>

                {/* Active Indicator Underline */}
                {active && (
                  <View
                    style={[
                      styles.categoryActiveIndicator,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ---------- SEARCH + FILTER BAR (BELOW CATEGORY) ---------- */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.card, borderColor: theme.border, flex: 1 },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.subText} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search in ${activeCategory?.label || "products"}...`}
            placeholderTextColor="#4B5563"
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={theme.subText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter button */}
        <TouchableOpacity
          onPress={() => setFilterVisible(true)}
          style={[
            styles.filterBtn,
            {
              backgroundColor: activeFilterCount > 0 ? theme.primary : theme.card,
              borderColor: activeFilterCount > 0 ? theme.primary : theme.border,
            },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={19}
            color={activeFilterCount > 0 ? theme.background : theme.text}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active filter pills */}
      {activeFilterCount > 0 && (
        <View style={styles.activePillsRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activePillsContent}
          >
            {sortBy !== "none" && (
              <TouchableOpacity
                style={[
                  styles.activePill,
                  { borderColor: theme.primary, backgroundColor: isDark ? "rgba(0,163,116,0.15)" : "rgba(0,117,88,0.08)" },
                ]}
                onPress={() => setSortBy("none")}
              >
                <Text style={[styles.activePillText, { color: theme.primary }]}>
                  {sortBy === "price_asc" ? "Low → High" : "High → Low"}
                </Text>
                <View style={[styles.pillClose, { backgroundColor: theme.primary }]}>
                  <Ionicons name="close" size={9} color={theme.background} />
                </View>
              </TouchableOpacity>
            )}
            {(minPrice !== "" || maxPrice !== "") && (
              <TouchableOpacity
                style={[
                  styles.activePill,
                  { borderColor: theme.primary, backgroundColor: isDark ? "rgba(0,163,116,0.15)" : "rgba(0,117,88,0.08)" },
                ]}
                onPress={() => { setMinPrice(""); setMaxPrice(""); }}
              >
                <Text style={[styles.activePillText, { color: theme.primary }]}>
                  {minPrice !== "" && maxPrice !== ""
                    ? `₹${minPrice}–₹${maxPrice}`
                    : minPrice !== ""
                    ? `Min ₹${minPrice}`
                    : `Max ₹${maxPrice}`}
                </Text>
                <View style={[styles.pillClose, { backgroundColor: theme.primary }]}>
                  <Ionicons name="close" size={9} color={theme.background} />
                </View>
              </TouchableOpacity>
            )}
            {typeFilter !== "all" && (
              <TouchableOpacity
                style={[
                  styles.activePill,
                  { borderColor: theme.primary, backgroundColor: isDark ? "rgba(0,163,116,0.15)" : "rgba(0,117,88,0.08)" },
                ]}
                onPress={() => setTypeFilter("all")}
              >
                <Text style={[styles.activePillText, { color: theme.primary }]}>{typeFilter}</Text>
                <View style={[styles.pillClose, { backgroundColor: theme.primary }]}>
                  <Ionicons name="close" size={9} color={theme.background} />
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Notice Banner for Laundry service */}
      {(activeCategory?.slug === "laundry" || activeCategory?.key === "laundry") && (
        <View
          style={[
            styles.laundryNoticeCard,
            {
              backgroundColor: isDark ? "rgba(245, 158, 11, 0.12)" : "#FEF3C7",
              borderColor: isDark ? "#D97706" : "#F59E0B",
            },
          ]}
        >
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={isDark ? "#FBBF24" : "#D97706"}
            style={{ marginRight: 8, marginTop: 1 }}
          />
          <Text
            style={[
              styles.laundryNoticeText,
              { color: isDark ? "#FDE68A" : "#92400E" },
            ]}
          >
            <Text style={{ fontWeight: "800" }}>Note: </Text>
            For laundry-only orders, a minimum order of 5 kg is required.
          </Text>
        </View>
      )}

      {searchQuery.length > 0 && (
        <Text style={[styles.resultsCount, { color: theme.subText }]}>
          Found {filteredItems.length}{" "}
          {filteredItems.length === 1 ? "product" : "products"}
        </Text>
      )}

      {/* Skeleton Loading State */}
      {(isLoading || pickupLoading) && (
        <CatalogSkeleton
          count={9}
          // showNotice={activeTab?.key === "laundry"}
        />
      )}

      {/* Error State */}
      {(hasError || pickupError) && !(isLoading || pickupLoading) && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={"#FF6B6B"} />
          <Text style={[styles.errorText, { color: theme.text }]}>
            {pickupError || hasError}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (pickupError) {
                setPickupError(null);
                setPickupLoading(true);
                getCustomerSinglePickupDetails(pickupId!)
                  .then((res) => {
                    const details = res?.pickup_details;
                    if (!details) {
                      setPickupError("Pickup not found");
                      setPickupLoading(false);
                      return;
                    }
                    // Load existing items into cart
                    if (details?.items?.length) {
                      cart.clear();
                      const deduped: Record<string, any> = {};
                      details.items.forEach((item: any) => {
                        const itemId = item.itemId?._id || item.itemId;
                        if (!deduped[itemId]) {
                          deduped[itemId] = {
                            id: itemId,
                            title: item.label,
                            price: item.price,
                            qty: 0,
                            image: item.itemId?.images?.[0]?.url || getFallbackImage(service || "shoe"),
                          };
                        }
                        deduped[itemId].qty += item.quantity || 1;
                      });
                      Object.values(deduped).forEach((item: any) => {
                        if (item.id && item.qty > 0) {
                          cart.addItem(item, item.qty);
                        }
                      });
                    }
                    setPickupLoading(false);
                  })
                  .catch((err: any) => {
                    setPickupError(err?.message || "Failed to load pickup details");
                    setPickupLoading(false);
                  });
              } else {
                const currentTabSlug = activeCategory?.slug || activeCategory?.key;
                if (currentTabSlug) {
                  fetchCatalogData(currentTabSlug);
                }
              }
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ---------- 3-COLUMN GRID ---------- */}
      {!isLoading && !pickupLoading && !hasError && !pickupError && (
        <FlatList
          style={{ flex: 1 }}
          data={filteredItems}
          keyExtractor={(i) => i.id}
          numColumns={GRID_COLS}
          columnWrapperStyle={{ gap: GRID_GAP }}
          contentContainerStyle={{
            paddingBottom: 100 + insets.bottom,
            gap: GRID_GAP,
          }}
          renderItem={({ item }) => {
            const qty = cart.getQty(item.id);
            const isBroken = brokenImages.has(item.id);
            const emoji =
              item.category === "Shoe Spa" ? "👟"
              : item.category === "Leather" ? "👜"
              : item.category === "DryClean" ? "✨"
              : "🧺";

            return (
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                {/* ── Image / placeholder ── */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => { setSelectedProduct(item); setPopupVisible(true); }}
                  style={styles.cardImageWrap}
                >
                  {isBroken ? (
                    <View style={[styles.cardImagePlaceholder, { backgroundColor: theme.inputBackground }]}>
                      <Text style={{ fontSize: 28 }}>{emoji}</Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.cardImage}
                      resizeMode="cover"
                      onError={() => setBrokenImages((prev) => new Set([...prev, item.id]))}
                    />
                  )}
                </TouchableOpacity>

                {/* ── Title + price ── */}
                <View style={styles.cardBody}>
                  <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.cardPrice, { color: theme.subText }]} numberOfLines={1}>
                    {formatDisplayPrice(item)}
                  </Text>
                </View>

                {/* ── Add / qty stepper ── */}
                <View style={styles.cardFooter}>
                  {qty === 0 ? (
                    <TouchableOpacity
                      onPress={() => cart.addItem({ id: item.id, title: item.title, price: item.price, image: item.image, type: item.type })}
                      style={[styles.gridAddBtn, { borderColor: theme.border }]}
                    >
                      <Plus size={16} color={theme.primary} />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.gridQtyBox, { borderColor: theme.border }]}>
                      <TouchableOpacity onPress={() => cart.decreaseQty(item.id)} style={styles.gridQtyBtn}>
                        <Minus size={12} color={theme.text} />
                      </TouchableOpacity>
                      <Text style={[styles.gridQtyText, { color: theme.text }]}>{qty}</Text>
                      <TouchableOpacity
                        onPress={() => cart.addItem({ id: item.id, title: item.title, price: item.price, image: item.image, type: item.type })}
                        style={styles.gridQtyBtn}
                      >
                        <Plus size={12} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            searchQuery.length > 0 && filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={60} color={theme.subText} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No products found</Text>
                <Text style={[styles.emptySubtitle, { color: theme.subText }]}>Try searching with different keywords</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* ═══════════ FILTER BOTTOM SHEET ═══════════ */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={() => setFilterVisible(false)}>
            <View style={[StyleSheet.absoluteFillObject, styles.filterBackdrop]} />
          </TouchableWithoutFeedback>

          {/* Sheet */}
          <View style={[styles.filterSheet, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
            {/* Handle */}
            <View style={[styles.filterHandle, { backgroundColor: theme.border }]} />

            {/* Header */}
            <View style={styles.filterHeader}>
              <Text style={[styles.filterHeaderTitle, { color: theme.text }]}>Filters</Text>
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={[styles.filterClearAll, { color: theme.primary }]}>Clear all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

              {/* ── SORT BY ── */}
              <Text style={[styles.filterSectionTitle, { color: theme.textSecondary }]}>SORT BY</Text>
              <View style={styles.filterChipRow}>
                {([
                  { label: "Default",            value: "none"       },
                  { label: "Price: Low \u2192 High", value: "price_asc"  },
                  { label: "Price: High \u2192 Low", value: "price_desc" },
                ] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setSortBy(opt.value)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: sortBy === opt.value ? theme.primary : theme.card,
                        borderColor:     sortBy === opt.value ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.filterChipText, { color: sortBy === opt.value ? theme.background : theme.text }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── PRICE RANGE ── */}
              <Text style={[styles.filterSectionTitle, { color: theme.textSecondary }]}>PRICE RANGE</Text>
              <View style={styles.filterChipRow}>
                {([
                  { label: "Any",            min: "",     max: ""     },
                  { label: "Under \u20b9100",    min: "",     max: "100"  },
                  { label: "\u20b9100\u2013\u20b9500",    min: "100",  max: "500"  },
                  { label: "\u20b9500\u2013\u20b91000",   min: "500",  max: "1000" },
                  { label: "Above \u20b91000",   min: "1000", max: ""     },
                ] as const).map((opt) => {
                  const active = minPrice === opt.min && maxPrice === opt.max;
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      onPress={() => { setMinPrice(opt.min); setMaxPrice(opt.max); }}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: active ? theme.primary : theme.card,
                          borderColor:     active ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.filterChipText, { color: active ? theme.background : theme.text }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom min / max */}
              <View style={styles.priceInputRow}>
                <View style={[styles.priceInputWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.priceInputPrefix, { color: theme.textSecondary }]}>{"\u20b9"}</Text>
                  <TextInput
                    value={minPrice}
                    onChangeText={(v) => setMinPrice(v.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder="Min"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.priceInput, { color: theme.text }]}
                    returnKeyType="done"
                  />
                </View>
                <View style={[styles.priceSeparator, { backgroundColor: theme.border }]} />
                <View style={[styles.priceInputWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.priceInputPrefix, { color: theme.textSecondary }]}>{"\u20b9"}</Text>
                  <TextInput
                    value={maxPrice}
                    onChangeText={(v) => setMaxPrice(v.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad"
                    placeholder="Max"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.priceInput, { color: theme.text }]}
                    returnKeyType="done"
                  />
                </View>
              </View>

              {/* ── TYPE (dynamic, only when >1 unit type) ── */}
              {availableTypes.length > 1 && (
                <>
                  <Text style={[styles.filterSectionTitle, { color: theme.textSecondary }]}>TYPE</Text>
                  <View style={styles.filterChipRow}>
                    {(["all", ...availableTypes] as string[]).map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setTypeFilter(t)}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: typeFilter === t ? theme.primary : theme.card,
                            borderColor:     typeFilter === t ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text style={[styles.filterChipText, { color: typeFilter === t ? theme.background : theme.text }]}>
                          {t === "all" ? "All" : t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Apply / show results button */}
            <TouchableOpacity
              style={[styles.filterApplyBtn, { backgroundColor: theme.primary }]}
              onPress={() => setFilterVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={[styles.filterApplyText, { color: theme.background }]}>
                Show {filteredItems.length} result{filteredItems.length !== 1 ? "s" : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isEditMode ? (
        <View style={[styles.editFooter, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.editFooterInner}>
            <View style={styles.editFooterInfo}>
              <Text style={styles.editFooterQty}>
                {cart.items.reduce((s, i) => s + i.qty, 0)} items
              </Text>
              <Text style={styles.editFooterTotal}>
                ₹{cart.total()}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleAddToCart}
              disabled={cart.items.length === 0}
              style={[
                styles.updateBtn,
                {
                  opacity: cart.items.length === 0 ? 0.55 : 1,
                },
              ]}
            >
              <Text style={styles.updateBtnText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <FloatingCart onOpen={() => setOpen(true)} />
          <CartSheet visible={open} onClose={() => setOpen(false)} />
        </>
      )}
      <ProductServicePopup
        visible={popupVisible}
        onClose={() => setPopupVisible(false)}
        onOpenCart={() => setOpen(true)}
        product={selectedProduct}
      />
    </View>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
    root: {
      flex: 1,
      paddingHorizontal: 16,
    },
    // ── Blinkit-Style Horizontal Category Scroll ──
    categoryBarWrapper: {
      marginHorizontal: -16,
      marginTop: 8,
      marginBottom: 10,
    },
    categoryScrollContent: {
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    categoryItem: {
      alignItems: "center",
      width: 72,
    },
    categoryIconWrap: {
      width: 46,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryCoverImg: {
      width: 42,
      height: 42,
    },
    categoryItemText: {
      fontSize: 11,
      lineHeight: 14,
      textAlign: "center",
      // marginTop: 6,
    },
    categoryActiveIndicator: {
      width: 20,
      height: 3,
      borderRadius: 2,
      marginTop: 4,
    },

    category: {
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 12,
    },
    // ── 3-column grid card (Blinkit/Zepto style) ──
    card: {
      width: CARD_W,
      borderRadius: 12,
      borderWidth: 1,
      overflow: "hidden",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
    },
    cardImageWrap: {
      width: "100%",
      aspectRatio: 1,
      backgroundColor: "transparent",
    },
    cardImage: {
      width: "100%",
      height: "100%",
    },
    cardImagePlaceholder: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    cardBody: {
      paddingHorizontal: 7,
      paddingTop: 6,
      paddingBottom: 4,
    },
    cardTitle: {
      fontSize: 11,
      fontWeight: "700",
      lineHeight: 14,
      marginBottom: 2,
    },
    cardPrice: {
      fontSize: 11,
      fontWeight: "600",
    },
    cardFooter: {
      paddingHorizontal: 7,
      paddingBottom: 8,
      paddingTop: 2,
      alignItems: "flex-end",
    },
    gridAddBtn: {
      width: 32,
      height: 28,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    gridQtyBox: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      borderWidth: 1,
      overflow: "hidden",
      height: 28,
    },
    gridQtyBtn: {
      width: 26,
      height: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    gridQtyText: {
      minWidth: 22,
      textAlign: "center",
      fontSize: 12,
      fontWeight: "800",
    },
    // ── kept for any remaining references ──
    imagePlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 12,
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: "dashed",
      gap: 2,
    },
    placeholderIconWrap: { alignItems: "center", justifyContent: "center" },
    placeholderEmoji: { fontSize: 20 },
    placeholderLabel: { fontSize: 8, fontWeight: "600", letterSpacing: 0.2 },
    itemTitle: { fontSize: 15, fontWeight: "700" },
    addBtn: { height: 34, paddingHorizontal: 16, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    qtyBox: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: theme.border, overflow: "hidden" },
    qtyBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
    qtyText: { minWidth: 28, textAlign: "center", fontWeight: "800" },
    image: { width: 56, height: 56, borderRadius: 12, marginRight: 12, backgroundColor: theme.isDark ? theme.card : "#E5E7EB" },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      marginTop: 4,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      height: 44,
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
    resultsCount: {
      fontSize: 12,
      marginTop: 8,
      marginBottom: 4,
      paddingLeft: 4,
    },
    laundryNoticeCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
    },
    laundryNoticeText: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginTop: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      textAlign: "center",
      paddingHorizontal: 40,
    },
    loadingContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      zIndex: 999,
      // keep a bit of vertical padding for aesthetic spacing when header is present
      paddingVertical: 60,
    },
    loadingText: {
      fontSize: 14,
      fontWeight: "500",
    },
    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      gap: 16,
    },
    errorText: {
      fontSize: 16,
      fontWeight: "500",
      textAlign: "center",
    },
    retryButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 12,
      marginTop: 8,
    },
    retryButtonText: {
      color: theme.text,
      fontWeight: "600",
      fontSize: 14,
    },
    editFooter: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.card,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    editFooterInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    editFooterInfo: {
      flex: 1,
    },
    editFooterQty: {
      color: theme.subText,
      fontSize: 12,
      fontWeight: "600",
    },
    editFooterTotal: {
      color: theme.primary,
      fontSize: 18,
      fontWeight: "900",
      marginTop: 2,
    },
    updateBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      minWidth: 120,
      alignItems: "center",
      justifyContent: "center",
    },
    updateBtnText: {
      color: theme.background,
      fontWeight: "800",
      fontSize: 14,
    },

    // ── Search + Filter row ──────────────────────────────────────────────────
    filterBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
      position: "relative",
    },
    filterBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: "#EF4444",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    filterBadgeText: {
      color: "#fff",
      fontSize: 9,
      fontWeight: "800",
    },

    // ── Active filter pills ──────────────────────────────────────────────────
    activePillsRow: {
      flexGrow: 0,
      marginBottom: 10,
    },
    activePillsContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 2,
    },
    activePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
    },
    activePillText: {
      fontSize: 12,
      fontWeight: "700",
    },
    pillClose: {
      width: 16,
      height: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },

    // ── Filter bottom sheet ──────────────────────────────────────────────────
    filterBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    filterSheet: {
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      borderTopWidth: 1,
      paddingHorizontal: 20,
      paddingBottom: 32,
      paddingTop: 12,
      maxHeight: "80%",
    },
    filterHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 16,
    },
    filterHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    filterHeaderTitle: {
      fontSize: 18,
      fontWeight: "800",
    },
    filterClearAll: {
      fontSize: 13,
      fontWeight: "700",
    },
    filterSectionTitle: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1.2,
      marginBottom: 10,
      marginTop: 6,
    },
    filterChipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 18,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
    },
    filterChipText: {
      fontSize: 13,
      fontWeight: "600",
    },
    filterApplyBtn: {
      marginTop: 8,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    filterApplyText: {
      fontSize: 15,
      fontWeight: "800",
    },

    // ── Custom price inputs ──────────────────────────────────────────────────
    priceInputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 18,
      marginTop: 4,
    },
    priceInputWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 12,
      height: 46,
    },
    priceInputPrefix: {
      fontSize: 16,
      fontWeight: "700",
      marginRight: 4,
    },
    priceInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      paddingVertical: 0,
    },
    priceSeparator: {
      width: 16,
      height: 2,
      borderRadius: 1,
    },
  });
