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
import React, { useMemo, useRef, useState } from "react";
import { Animated, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

  React.useEffect(() => {
    const index = TABS.findIndex(t => t.key === service);
    if (index !== -1) switchTab(index);
  }, [service]);


  /* ---------- DATA ---------- */
  const S3_BASE =
    "https://drydash-app-images.s3.ap-south-1.amazonaws.com/cart-images";

  const data = useMemo<Record<string, Item[]>>(
    () => ({
      shoe: [
        // {
        //   id: "shoe-1",
        //   title: "Basic Shoe Cleaning",
        //   price: 299,
        //   category: "Shoe Spa",
        //   image: `${S3_BASE}/sheo-spa/shoe_1.jpg`,
        // },
        // {
        //   id: "shoe-2",
        //   title: "Premium Shoe Care",
        //   price: 499,
        //   category: "Shoe Spa",
        //   image: `${S3_BASE}/sheo-spa/shoe_2.jpg`,
        // },
        // {
        //   id: "shoe-3",
        //   title: "Polish & Shine",
        //   price: 199,
        //   category: "Shoe Spa",
        //   image: `${S3_BASE}/sheo-spa/shoe_3.jpg`,
        // },
        {
          id: "shoe-4",
          title: "Sport Shoes / Sneakers",
          price: 500,
          category: "Shoe Spa",
          image: `${S3_BASE}/sheo-spa/shoe_1.jpg`,
        },
        {
          id: "shoe-5",
          title: "Leather Shoes",
          price: 600,
          category: "Shoe Spa",
          image: `${S3_BASE}/sheo-spa/shoe_2.jpg`,
        },
        {
          id: "shoe-6",
          title: "Suede Shoes",
          price: 600,
          category: "Shoe Spa",
          image: `${S3_BASE}/sheo-spa/shoe_3.jpg`,
        },
        {
          id: "shoe-7",
          title: "Boots",
          price: 700,
          category: "Shoe Spa",
          image: `${S3_BASE}/sheo-spa/shoe_7.jpg`,
        },
        {
          id: "shoe-8",
          title: "Stilettos",
          price: 600,
          category: "Shoe Spa",
          image: `${S3_BASE}/sheo-spa/shoe_8.jpg`,
        },
        {
          id: "shoe-9",
          title: "Sliders",
          price: 250,
          category: "Shoe Spa",
          image: `${S3_BASE}/sheo-spa/shoe_9.jpg`,
        },
        {
          id: "shoe-10",
          title: "Sandals",
          price: 300,
          category: "Shoe Spa",
          image: `${S3_BASE}/sheo-spa/shoe_10.jpg`,
        },
      ],

      laundry: [
        {
          id: "laundry-1",
          title: "W & F (Wearables)",
          price: 80,
          category: "Laundry",
          image: `${S3_BASE}/laundry/laundry_1.jpg`,
        },
        {
          id: "laundry-2",
          title: "W & F (Non-Wearables)",
          price: 100,
          category: "Laundry",
          image: `${S3_BASE}/laundry/laundry_2.jpg`,
        },
        {
          id: "laundry-3",
          title: "W & I (Wearables)",
          price: 100,
          category: "Laundry",
          image: `${S3_BASE}/laundry/laundry_3.jpg`,
        },
        {
          id: "laundry-4",
          title: "W & I (Non-Wearables)",
          price: 120,
          category: "Laundry",
          image: `${S3_BASE}/laundry/laundry_4.jpg`,
        },
      ],

      dryclean: [
        {
          id: "dryclean-1",
          title: "Shirt/T-shirt",
          price: 100,
          category: "DryClean",
          image: `https://drydash-app-images.s3.ap-south-1.amazonaws.com/cart-images/dryclean/dryclean_1.jpg`,
        },
        {
          id: "dryclean-2",
          title: "Jeans",
          price: 120,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_2.jpg`,
        },
        {
          id: "dryclean-3",
          title: "Trousers",
          price: 100,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_3.jpg`,
        },
        {
          id: "dryclean-4",
          title: "Blazer/Jacket",
          price: 250,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_4.jpg`,
        },
        {
          id: "dryclean-5",
          title: "3 Piece Suit",
          price: 450,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_5.jpg`,
        },
        {
          id: "dryclean-6",
          title: "2 Piece Suit",
          price: 300,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_6.jpg`,
        },
        {
          id: "dryclean-7",
          title: "Long Blazer",
          price: 350,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_7.jpg`,
        },
        {
          id: "dryclean-8",
          title: "Sweatshirt / Hoodie",
          price: 250,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_8.jpg`,
        },
        {
          id: "dryclean-9",
          title: "Winter Jacket",
          price: 350,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_9.jpg`,
        },
        {
          id: "dryclean-10",
          title: "Heavy Saree",
          price: 350,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_10.jpg`,
        },
        {
          id: "dryclean-11",
          title: "Medium Saree",
          price: 300,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_11.jpg`,
        },
        {
          id: "dryclean-12",
          title: "Saree",
          price: 250,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_12.jpg`,
        },
        {
          id: "dryclean-13",
          title: "Blouse",
          price: 80,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_13.jpg`,
        },
        {
          id: "dryclean-14",
          title: "Heavy Blouse",
          price: 120,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_14.jpg`,
        },
        {
          id: "dryclean-15",
          title: "Lehnga",
          price: 250,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_15.jpg`,
        },
        {
          id: "dryclean-16",
          title: "Medium Lehnga",
          price: 500,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_16.jpg`,
        },
        {
          id: "dryclean-17",
          title: "Heavy Lehnga",
          price: 700,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_17.jpg`,
        },
        {
          id: "dryclean-18",
          title: "Heavy Dress",
          price: 500,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_18.jpg`,
        },
        {
          id: "dryclean-19",
          title: "Dress",
          price: 350,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_19.jpg`,
        },
        {
          id: "dryclean-20",
          title: "Heavy Gown",
          price: 300,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_20.jpg`,
        },
        {
          id: "dryclean-21",
          title: "Gown",
          price: 200,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_21.jpg`,
        },
        {
          id: "dryclean-22",
          title: "Dupatta",
          price: 80,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_22.jpg`,
        },
        {
          id: "dryclean-23",
          title: "Heavy Dupatta",
          price: 100,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_23.jpg`,
        },
        {
          id: "dryclean-24",
          title: "Kurta Pyjama",
          price: 250,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_24.jpg`,
        },
        {
          id: "dryclean-25",
          title: "Shawl",
          price: 200,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_25.jpg`,
        },
        {
          id: "dryclean-26",
          title: "Sweater / Cardigan",
          price: 200,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_26.jpg`,
        },
        {
          id: "dryclean-27",
          title: "Shrug",
          price: 200,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_27.jpg`,
        },
        {
          id: "dryclean-28",
          title: "Leather Jackets",
          price: 450,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_28.jpg`,
        },
        {
          id: "dryclean-29",
          title: "Belt",
          price: 150,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_29.jpg`,
        },
        {
          id: "dryclean-30",
          title: "Leather Belt",
          price: 250,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_30.jpg`,
        },
        {
          id: "dryclean-31",
          title: "Pillow Cover",
          price: 50,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_31.jpg`,
        },
        {
          id: "dryclean-32",
          title: "Large Pillow",
          price: 100,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_32.jpg`,
        },
        {
          id: "dryclean-33",
          title: "Small Pillow",
          price: 60,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_33.jpg`,
        },
        {
          id: "dryclean-34",
          title: "Blanket (Single)",
          price: 300,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_34.jpg`,
        },
        {
          id: "dryclean-35",
          title: "Blanket (Double)",
          price: 400,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_35.jpg`,
        },
        {
          id: "dryclean-36",
          title: "Duvet (Single)",
          price: 300,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_36.jpg`,
        },
        {
          id: "dryclean-37",
          title: "Duvet (Double)",
          price: 400,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_37.jpg`,
        },
        {
          id: "dryclean-38",
          title: "Quilt (Single)",
          price: 350,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_38.jpg`,
        },
        {
          id: "dryclean-39",
          title: "Quilt (Double)",
          price: 450,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_39.jpg`,
        },
        {
          id: "dryclean-40",
          title: "Bed Cover (Single)",
          price: 250,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_40.jpg`,
        },
        {
          id: "dryclean-41",
          title: "Bed Cover (Double)",
          price: 350,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_41.jpg`,
        },
        {
          id: "dryclean-42",
          title: "Bed Sheet (Single)",
          price: 200,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_42.jpg`,
        },
        {
          id: "dryclean-43",
          title: "Bed Sheet (Double)",
          price: 300,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_43.jpg`,
        },
        {
          id: "dryclean-44",
          title: "Handbag (Small)",
          price: 300,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_44.jpg`,
        },
        {
          id: "dryclean-45",
          title: "Handbag (Medium)",
          price: 450,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_45.jpg`,
        },
        {
          id: "dryclean-46",
          title: "Handbag (Large)",
          price: 450,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_46.jpg`,
        },
        {
          id: "dryclean-47",
          title: "Sports Bag",
          price: 400,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_47.jpg`,
        },
        {
          id: "dryclean-48",
          title: "Leather Bag (Small)",
          price: 400,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_48.jpg`,
        },
        {
          id: "dryclean-49",
          title: "Leather Bag (Large)",
          price: 700,
          category: "DryClean",
          image: `${S3_BASE}/dryclean/dryclean_49.jpg`,
        },
      ],

      // iron: [
      //   {
      //     id: "iron-1",
      //     title: "Shirt (Iron)",
      //     price: 59,
      //     category: "Ironing",
      //     image: `${S3_BASE}/laundry/laundry_5.jpg`,
      //   },
      //   {
      //     id: "iron-2",
      //     title: "Pant (Iron)",
      //     price: 79,
      //     category: "Ironing",
      //     image: `${S3_BASE}/laundry/laundry_6.jpg`,
      //   },
      //   {
      //     id: "iron-3",
      //     title: "Kurta (Iron)",
      //     price: 99,
      //     category: "Ironing",
      //     image: `${S3_BASE}/laundry/laundry_7.jpg`,
      //   },
      // ],
    }),
    []
  );
  const activeTab = TABS[tab];
  // console.log("key ", activeTab.key)
  const items = data[activeTab.key];

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
          pillWidth.current = (totalWidth - padding * 2 - gap * (TABS.length - 1)) / TABS.length;
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

      {/* ---------- CATEGORY ---------- */}
      {/* <Text style={[styles.category, { color: theme.text }]}>
        {activeTab.label}
      </Text> */}

      {/* ---------- LIST ---------- */}
      <FlatList
        data={items}
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
                  style={[styles.addBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ fontWeight: "800", color: "#000" }}>Add</Text>
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
          );
        }}
      />

      <FloatingCart onOpen={() => setOpen(true)} />
      <CartSheet visible={open} onClose={() => setOpen(false)} />
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
    backgroundColor: "#E5E7EB", // fallback while loading
  }
});
