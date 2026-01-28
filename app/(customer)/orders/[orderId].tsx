import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";

export default function OrderReceipt() {
  const { orderId } = useLocalSearchParams();
  const { theme, isDark } = useTheme();

  // 🔹 mock data (replace with API later)
  const order = {
    id: orderId ?? "2479",
    status: "Completed",
    orderDate: "Nov 24, 2023 at 3:15 PM",
    deliveryDate: "Nov 24, 2023 at 6:30 PM",
    address: "123 Main St, Apt 4B, City, ZIP",
    payment: "•••• •••• •••• 4242 (Visa)",
    items: [
      { name: "Standard Wash & Fold (10 lbs)", price: 25 },
      { name: "Delicate Cycle (1 item)", price: 10 },
      { name: "Ironing Service (2 shirts)", price: 8 },
    ],
    subtotal: 43,
    deliveryFee: 5,
    tax: 4.75,
    total: 52.75,
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Order #{order.id} Receipt
        </Text>

        <Ionicons name="person-circle-outline" size={26} color={theme.subText} />
      </View>

      {/* CARD */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {/* STATUS */}
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Order #{order.id}
          </Text>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{order.status}</Text>
          </View>
        </View>

        {/* DETAILS */}
        <View style={styles.detailBlock}>
          <Text style={styles.label}>Order Date</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {order.orderDate}
          </Text>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.label}>Delivery Date</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {order.deliveryDate}
          </Text>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.label}>Delivery Address</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {order.address}
          </Text>
        </View>

        <View style={styles.detailBlock}>
          <Text style={styles.label}>Payment Method</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {order.payment}
          </Text>
        </View>

        {/* ITEMS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Items
        </Text>

        {order.items.map((item, i) => (
          <View key={i} style={styles.rowBetween}>
            <Text style={[styles.itemText, { color: theme.subText }]}>
              {item.name}
            </Text>
            <Text style={[styles.itemPrice, { color: theme.text }]}>
              ${item.price.toFixed(2)}
            </Text>
          </View>
        ))}

        {/* COST BREAKDOWN */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Cost Breakdown
        </Text>

        <View style={styles.rowBetween}>
          <Text style={styles.muted}>Subtotal</Text>
          <Text style={styles.muted}>${order.subtotal.toFixed(2)}</Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.muted}>Delivery Fee</Text>
          <Text style={styles.muted}>${order.deliveryFee.toFixed(2)}</Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.muted}>Tax</Text>
          <Text style={styles.muted}>${order.tax.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.rowBetween}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>
            Total
          </Text>
          <Text style={[styles.totalValue, { color: theme.text }]}>
            ${order.total.toFixed(2)}
          </Text>
        </View>

        {/* RATING */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Rate your order
        </Text>

        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons
              key={s}
              name="star-outline"
              size={26}
              color="#94a3b8"
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex:1,
    paddingBottom: 0,
  },

  header: {
    paddingTop: 45,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
  },

  card: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  statusBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#022c22",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },

  detailBlock: {
    marginTop: 10,
  },

  label: {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 2,
  },

  value: {
    fontSize: 13,
    fontWeight: "600",
  },

  sectionTitle: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: "800",
  },

  itemText: {
    fontSize: 13,
    marginTop: 6,
  },

  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
  },

  muted: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 6,
  },

  divider: {
    height: 1,
    backgroundColor: "#1f2937",
    marginVertical: 12,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
  },

  totalValue: {
    fontSize: 18,
    fontWeight: "900",
  },

  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 20,
  },
});
