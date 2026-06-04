import ProductServicePopup from "@/components/ProductServicePopup";
import { catalogData } from "@/constants/catalog";
import { getCatalogApi } from "@/features/catalog/catalog.api";
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
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CartSheet from "../../../../components/CartSheet";
import FloatingCart from "../../../../components/FloatingCart";
import { useCart } from "../../../../context/CartContext";
import { useTheme } from "../../../../context/ThemeContext";

/* ---------- TABS ---------- */
const TABS = [
  { key: "shoe", label: "Shoe Spa", icon: LucideShovel },
  { key: "laundry", label: "Laundry", icon: Shirt },
  { key: "dryclean", label: "Dry Clean", icon: Sparkles },
];

type Item = {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string;
  type?: string;
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

export default function ServiceDetail() {
  const { service, pickupId, mode } = useLocalSearchParams<{
    service: string;
    pickupId?: string;
    mode?: string;
  }>();
  const { theme } = useTheme();
  const cart = useCart();
  const insets = useSafeAreaInsets();
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);

  // API data states
  const [apiData, setApiData] = useState<Record<string, Item[]>>({
    shoe: [],
    laundry: [],
    dryclean: [],
  });
  const [loading, setLoading] = useState<Record<string, boolean>>({
    shoe: false,
    laundry: false,
    dryclean: false,
  });
  const [error, setError] = useState<Record<string, string | null>>({
    shoe: null,
    laundry: null,
    dryclean: null,
  });

  // ── Tab transition animations ──
  const slideAnim = useRef(new Animated.Value(0)).current;
  const labelAnims = useRef(
    TABS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0)),
  ).current;
  const pillWidth = useRef(0);

  const [selectedProduct, setSelectedProduct] = useState<Item | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);

  const isEditMode = mode === "edit" && Boolean(pickupId);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  const tabRef = useRef(tab);
  tabRef.current = tab;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 30 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          if (tabRef.current < TABS.length - 1) switchTab(tabRef.current + 1);
        } else if (gestureState.dx > 50) {
          if (tabRef.current > 0) switchTab(tabRef.current - 1);
        }
      },
    })
  ).current;

  const switchTab = (i: number) => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: i,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
        mass: 0.6,
      }),
      ...TABS.map((_, idx) =>
        Animated.timing(labelAnims[idx], {
          toValue: idx === i ? 1 : 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ),
    ]).start();
    setTab(i);
  };

  const [layoutReady, setLayoutReady] = useState(false);

  // Update the transform function in fetchCatalogData
  const fetchCatalogData = async (serviceType: string, slug: string) => {
    const serviceKeys = ["shoe", "laundry", "dryclean"];
    if (!serviceKeys.includes(serviceType)) return;

    setLoading((prev) => ({ ...prev, [serviceType]: true }));
    setError((prev) => ({ ...prev, [serviceType]: null }));

    try {
      const response = await getCatalogApi(slug);
      if (response?.data?.data?.items) {
        const items = response.data.data.items;

        // Transform API items to match Item type with full data
        const transformedItems: Item[] = items.map((item: APIItem) => ({
          id: item._id,
          title: item.label,
          price: item.price,
          category:
            TABS.find((tab) => tab.key === serviceType)?.label || serviceType,
          image: item.images?.[0]?.url || getFallbackImage(serviceType),
          description:
            item.mainDescription || getDefaultDescription(serviceType),
          process: item.process || [], // Store the process steps
          displayPrice: item.displayPrice,
          unit: item.unit,
          type: item.type,
        }));

        setApiData((prev) => ({ ...prev, [serviceType]: transformedItems }));
      }
    } catch (err) {
      console.error(`Error fetching ${serviceType} data:`, err);
      setError((prev) => ({ ...prev, [serviceType]: "Failed to load data" }));
    } finally {
      setLoading((prev) => ({ ...prev, [serviceType]: false }));
    }
  };

  // Helper function for default descriptions
  const getDefaultDescription = (serviceType: string): string => {
    const descriptions = {
      laundry:
        "Professional laundry service with careful handling of your garments.",
      dryclean: "Premium dry cleaning service using eco-friendly solvents.",
      shoe: "Expert shoe cleaning and restoration service.",
    };
    return (
      descriptions[serviceType as keyof typeof descriptions] ||
      "Premium service with expert care."
    );
  };

  type Item = {
    id: string;
    title: string;
    price: number;
    category: string;
    image: string;
    description?: string;
    process?: ProcessStep[];
    displayPrice?: string;
    unit?: string;
    type?: string;
  };

  // Get fallback image based on service type
  const getFallbackImage = (serviceType: string): string => {
    const S3_BASE =
      "https://drydash-app-images.s3.ap-south-1.amazonaws.com/cart-images";
    switch (serviceType) {
      case "shoe":
        return `${S3_BASE}/sheo-spa/shoe_1.jpg`;
      case "laundry":
        return `${S3_BASE}/laundry/laundry_1.jpg`;
      case "dryclean":
        return `${S3_BASE}/dryclean/dryclean_1.png`;
      default:
        return "";
    }
  };

  // Fetch data when tab changes or on initial load
  useEffect(() => {
    if (layoutReady) {
      const currentTabKey = TABS[tab]?.key;
      if (
        currentTabKey &&
        ["shoe", "laundry", "dryclean"].includes(currentTabKey)
      ) {
        const slug = currentTabKey === "shoe" ? "shoespa" : currentTabKey;
        fetchCatalogData(currentTabKey, slug);
      }
    }
  }, [tab, layoutReady]);

  // Initial fetch based on service param
  useEffect(() => {
    if (!layoutReady) return;

    const index = TABS.findIndex((t) => t.key === service);
    if (index !== -1) {
      switchTab(index);
      if (service && ["shoe", "laundry", "dryclean"].includes(service)) {
        const slug = service === "shoe" ? "shoespa" : service;
        fetchCatalogData(service, slug);
      }
    }
  }, [service, layoutReady]);

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
      dryclean: [], // Will be populated by API
      // Add other services here if needed
    }),
    [],
  );

  // Get current items (API data for shoe/laundry/dryclean, static for others)
  const activeTab = TABS[tab];
  const currentItems =
    activeTab?.key && ["shoe", "laundry", "dryclean"].includes(activeTab.key)
      ? apiData[activeTab.key]
      : catalogData[activeTab?.key] || [];

  // Filter items based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(currentItems);
    } else {
      const filtered = currentItems.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, currentItems]);

  const isLoading =
    activeTab?.key && ["shoe", "laundry", "dryclean"].includes(activeTab.key)
      ? loading[activeTab.key]
      : false;

  const hasError =
    activeTab?.key && ["shoe", "laundry", "dryclean"].includes(activeTab.key)
      ? error[activeTab.key]
      : null;

const handleAddToCart = () => {
    if (!pickupId) return;
    // Navigate back to order-tracking with a timestamp to force reload and fetch updated cart items
    router.replace({
      pathname: "/(customer)/order-tracking",
      params: { pickupId, _t: Date.now().toString() },
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]} {...panResponder.panHandlers}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackVisible: false,
          title: isEditMode ? "EDIT ITEMS" : "Service Catalog".toUpperCase(),
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerShadowVisible: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 16,
            color: theme.text,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                padding: 8,
                marginLeft: 8,
                borderRadius: 12,
                backgroundColor: theme.card,
              }}
            >
              <ArrowLeft size={20} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {/* ---------- SEGMENTED TABS ---------- */}
      <View
        style={[styles.tabsWrap, { backgroundColor: theme.card }]}
        onLayout={(e) => {
          const totalWidth = e.nativeEvent.layout.width;
          const gap = 8;
          const padding = 6;
          pillWidth.current =
            (totalWidth - padding * 2 - gap * (TABS.length - 1)) / TABS.length;
          setLayoutReady(true);
        }}
      >
        <Animated.View
          style={[
            styles.slidingPill,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, 1, 2].map(
                      (i) => i * (pillWidth.current + 8),
                    ),
                  }),
                },
              ],
              width: pillWidth.current || (`${100 / TABS.length}%` as any),
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={["#56BFAB", "#005B47"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {TABS.map((t, i) => {
          const active = tab === i;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => switchTab(i)}
              activeOpacity={0.85}
              style={styles.tabOuter}
            >
              <Animated.Text
                style={[
                  styles.tabLabel,
                  {
                    color: labelAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [theme.subText, "#fff"],
                    }),
                    fontWeight: active ? "800" : "600",
                  },
                ]}
              >
                {t.label}
              </Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ---------- SEARCH BAR ---------- */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.subText}
            style={{ marginRight: 8 }}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
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
      </View>

      {searchQuery.length > 0 && (
        <Text style={[styles.resultsCount, { color: theme.subText }]}>
          Found {filteredItems.length}{" "}
          {filteredItems.length === 1 ? "product" : "products"}
        </Text>
      )}

      {/* Loading State */}
      {(isLoading || pickupLoading) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#56BFAB" />
          <Text style={[styles.loadingText, { color: theme.subText }]}>
            {pickupLoading
              ? "Loading pickup details..."
              : `Loading ${activeTab?.label} services...`}
          </Text>
        </View>
      )}

{/* Error State */}
      {(hasError || pickupError) && !(isLoading || pickupLoading) && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
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
                const currentTabKey = TABS[tab]?.key;
                if (currentTabKey) {
                  const slug =
                    currentTabKey === "shoe" ? "shoespa" : currentTabKey;
                  fetchCatalogData(currentTabKey, slug);
                }
              }
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ---------- LIST ---------- */}
      {!isLoading && !hasError && (
        <FlatList
          data={filteredItems}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{
            paddingBottom: 100 + insets.bottom,
            gap: 10,
          }}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          renderItem={({ item }) => {
            const qty = cart.getQty(item.id);
            return (
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setSelectedProduct(item);
                    setPopupVisible(true);
                  }}
                  activeOpacity={0.7}
                  style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
                >
                  {brokenImages.has(item.id) ? (
                  <View
                    style={[
                      styles.imagePlaceholder,
                      { backgroundColor: theme.card },
                    ]}
                  >
                    <View style={styles.placeholderIconWrap}>
                      <Text style={styles.placeholderEmoji}>
                        {item.category === "Shoe Spa"
                          ? "👟"
                          : item.category === "Laundry"
                            ? "👕"
                            : item.category === "DryClean"
                              ? "✨"
                              : "🧺"}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.placeholderLabel,
                        { color: theme.subText },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title.split(" ")[0]}
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={() =>
                      setBrokenImages((prev) => new Set([...prev, item.id]))
                    }
                  />
                )}

                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Text style={{ color: theme.subText, marginTop: 2 }}>
                    ₹{item.price}
                  </Text>
                </View>
                </TouchableOpacity>

                {qty === 0 ? (
                  <TouchableOpacity
                    onPress={() =>
                      cart.addItem({
                        id: item.id,
                        title: item.title,
                        price: item.price,
                        image: item.image,
                        type: item.type,
                      })
                    }
                    style={[styles.addBtn]}
                  >
                    <Text style={{ fontWeight: "600", color: "#ffffff" }}>
                      <Plus size={20} color="#ffffff" />
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.qtyBox}>
                    <TouchableOpacity
                      onPress={() => cart.decreaseQty(item.id)}
                      style={styles.qtyBtn}
                    >
                      <Minus size={14} color={theme.text} />
                    </TouchableOpacity>

                    <Text style={[styles.qtyText, { color: theme.text }]}>
                      {qty}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        cart.addItem({
                          id: item.id,
                          title: item.title,
                          price: item.price,
                          image: item.image,
                          type: item.type,
                        })
                      }
                      style={styles.qtyBtn}
                    >
                      <Plus size={14} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            searchQuery.length > 0 && filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search-outline"
                  size={60}
                  color={theme.subText}
                />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>
                  No products found
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
                  Try searching with different keywords
                </Text>
              </View>
            ) : null
          }
        />
      )}

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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 16,
  },
  tabsWrap: {
    flexDirection: "row",
    padding: 6,
    borderRadius: 22,
    marginVertical: 12,
    gap: 8,
    position: "relative",
  },
  slidingPill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 6,
    width: `${100 / TABS.length}%` as any,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#56BFAB",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  tabOuter: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 12,
    letterSpacing: 0.1,
  },
  category: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    borderRadius: 10,
    borderWidth: 1,
    elevation: 2,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1A3330",
    borderStyle: "dashed",
    gap: 2,
  },
  placeholderIconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 20,
  },
  placeholderLabel: {
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  addBtn: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    overflow: "hidden",
  },
  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    minWidth: 28,
    textAlign: "center",
    fontWeight: "800",
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: "#E5E7EB",
  },
  searchContainer: {
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
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
    backgroundColor: "#56BFAB",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  editFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0D1F1C",
    borderTopWidth: 1,
    borderTopColor: "#1A3330",
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
    color: "#8AA39B",
    fontSize: 12,
    fontWeight: "600",
  },
  editFooterTotal: {
    color: "#00E1A2",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  updateBtn: {
    backgroundColor: "#00D9A3",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  updateBtnText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 14,
  },
});
