import { Stack, useLocalSearchParams } from "expo-router";
import { LucideShovel, Minus, Plus, Shirt, Sparkles } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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
  { key: "iron", label: "Ironing", icon: Sparkles },
];

type Item = {
  id: string;
  title: string;
  price: number;
  category: string;
};

export default function ServiceDetail() {
  const { service } = useLocalSearchParams<{ service: string }>();
  const { theme, isDark } = useTheme();
  const cart = useCart();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState(0);
  const [open, setOpen] = useState(false);

  /* ---------- DATA ---------- */
  const data = useMemo<Record<string, Item[]>>(() => ({
    shoe: [
      { id: "shoe-basic", title: "Basic Shoe Cleaning", price: 299, category: "Shoe Spa" },
      { id: "shoe-premium", title: "Premium Shoe Care", price: 499, category: "Shoe Spa" },
      { id: "shoe-polish", title: "Polish & Shine", price: 199, category: "Shoe Spa" },
    ],
    laundry: [
      { id: "shirt", title: "Shirt", price: 199, category: "Laundry" },
      { id: "tshirt", title: "T-Shirt", price: 149, category: "Laundry" },
      { id: "jeans", title: "Jeans", price: 249, category: "Laundry" },
    ],
    iron: [
      { id: "iron-shirt", title: "Shirt (Iron)", price: 59, category: "Ironing" },
      { id: "iron-pant", title: "Pant (Iron)", price: 79, category: "Ironing" },
      { id: "iron-kurta", title: "Kurta (Iron)", price: 99, category: "Ironing" },
    ],
  }), []);

  const activeTab = TABS[tab];
  const items = data[activeTab.key];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* <TabBar /> */}

      <Stack.Screen options={{ title: service?.toUpperCase() }} />

      {/* ---------- SEGMENTED TABS ---------- */}
      <View style={[styles.tabsWrap, { backgroundColor: theme.card }]}>
        {TABS.map((t, i) => {
          const active = tab === i;
          const Icon = t.icon;

          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(i)}
              style={[
                styles.tab,
                { backgroundColor: active ? theme.primary : "transparent" },
              ]}
            >
              <Icon size={16} color={active ? "#000" : theme.subText} />
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 12,
                  marginTop: 4,
                  color: active ? "#000" : theme.subText,
                }}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ---------- CATEGORY ---------- */}
      <Text style={[styles.category, { color: theme.text }]}>
        {activeTab.label}
      </Text>

      {/* ---------- LIST ---------- */}
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{
          paddingBottom: 100 + insets.bottom,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
              <View
                style={[
                  styles.image,
                  { backgroundColor: isDark ? "#0B1220" : "#E5E7EB" },
                ]}
              >
                <Text style={{ color: theme.subText, fontSize: 12 }}>
                  Image
                </Text>
              </View>

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
                    })
                  }
                  style={[
                    styles.addBtn,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={{ fontWeight: "800", color: "#000" }}>
                    Add
                  </Text>
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
    justifyContent: "space-between",
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: "center",
  },

  category: {
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },

  image: {
    width: 54,
    height: 54,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
});
