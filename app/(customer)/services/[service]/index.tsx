import ProductServicePopup from "@/components/ProductServicePopup";
import { catalogData } from "@/constants/catalog";
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
import React, { useRef, useState } from "react";
import { Animated, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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

};

export default function ServiceDetail() {
  const { service } = useLocalSearchParams<{ service: string }>();
  const { theme } = useTheme();
  const cart = useCart();
  const insets = useSafeAreaInsets();
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);

  // ── Tab transition animations ──
  const slideAnim = useRef(new Animated.Value(0)).current;
  const labelAnims = useRef(TABS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const pillWidth = useRef(0);  // stores actual measured pill width

  const [selectedProduct, setSelectedProduct] = useState<Item | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredItems, setFilteredItems] = useState(items);

  const switchTab = (i: number) => {
    Animated.parallel([
      // Slide the pill
      Animated.spring(slideAnim, {
        toValue: i,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
        mass: 0.6,
      }),
      // Crossfade labels
      ...TABS.map((_, idx) =>
        Animated.timing(labelAnims[idx], {
          toValue: idx === i ? 1 : 0,
          duration: 180,
          useNativeDriver: true,
        })
      ),
    ]).start();
    setTab(i);
  };

  const [layoutReady, setLayoutReady] = useState(false);

  React.useEffect(() => {
    if (!layoutReady) return;

    const index = TABS.findIndex(t => t.key === service);
    if (index !== -1) {
      switchTab(index);
    }
  }, [service, layoutReady]);


  const activeTab = TABS[tab];
  // console.log("key ", activeTab.key)
  const items = catalogData[activeTab.key] || [];

  // Filter items based on search query
  React.useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, items]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackVisible: false,
          title: "Service Catalog".toUpperCase(),
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
        {/* ── Sliding gradient pill ── */}
        <Animated.View
          style={[
            styles.slidingPill,
            {
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [0, 1, 2].map(i =>
                    i * (pillWidth.current + 8)  // pillWidth + gap
                  ),
                }),
              }],
              width: pillWidth.current || `${100 / TABS.length}%` as any,
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

        {/* ── Tab buttons ── */}
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
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={18} color={theme.subText} style={{ marginRight: 8 }} />
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

      {/* Show results count when searching */}
      {searchQuery.length > 0 && (
        <Text style={[styles.resultsCount, { color: theme.subText }]}>
          Found {filteredItems.length} {filteredItems.length === 1 ? 'product' : 'products'}
        </Text>
      )}

      {/* ---------- CATEGORY ---------- */}
      {/* <Text style={[styles.category, { color: theme.text }]}>
        {activeTab.label}
      </Text> */}

      {/* ---------- LIST ---------- */}
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
            <TouchableOpacity
              onPress={() => {
                setSelectedProduct(item);
                setPopupVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.row,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                {/* IMAGE PLACEHOLDER */}

                {brokenImages.has(item.id) ? (
                  /* ── Placeholder ── */
                  <View style={[styles.imagePlaceholder, { backgroundColor: theme.card }]}>
                    <View style={styles.placeholderIconWrap}>
                      <Text style={styles.placeholderEmoji}>
                        {item.category === "Shoe Spa" ? "👟"
                          : item.category === "Laundry" ? "👕"
                            : item.category === "DryClean" ? "✨"
                              : "🧺"}
                      </Text>
                    </View>
                    <Text style={[styles.placeholderLabel, { color: theme.subText }]} numberOfLines={1}>
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

                {/* TEXT */}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Text style={{ color: theme.subText, marginTop: 2 }}>
                    ₹{item.price}
                  </Text>
                </View>

                {/* ACTION */}
                {qty === 0 ? (
                  <TouchableOpacity
                    onPress={() =>
                      cart.addItem({
                        id: item.id,
                        title: item.title,
                        price: item.price,
                        image: item.image,
                      })
                    }
                    style={[styles.addBtn,]}
                  >
                    <Text style={{ fontWeight: "600", color: "#ffffff" }}><Plus size={20} color="#ffffff" /></Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.qtyBox}>
                    <TouchableOpacity
                      onPress={() => cart.removeItem(item.id)}
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
                        })
                      }
                      style={styles.qtyBtn}
                    >
                      <Plus size={14} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
      {/* Empty state when no search results */}
      {searchQuery.length > 0 && filteredItems.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={60} color={theme.subText} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No products found
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
            Try searching with different keywords
          </Text>
        </View>
      )}

      <FloatingCart onOpen={() => setOpen(true)} />
      <CartSheet visible={open} onClose={() => setOpen(false)} />
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
    position: "relative",   // ← needed for absolute pill
  },

  slidingPill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 6,
    width: `${100 / TABS.length}%` as any,  // each tab = equal width
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
    zIndex: 1,              // ← labels sit above the pill
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
  // image: {
  //   width: 50,
  //   height: 50,
  //   borderRadius: 12,
  //   alignItems: "center",
  //   justifyContent: "center",
  //   marginRight: 12,
  // },

  itemTitle: {
    fontSize: 12,
    fontWeight: "700",
  },

  addBtn: {
    height: 30,
    paddingHorizontal: 10,
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
    backgroundColor: "#E5E7EB", // fallback while loading
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
});
