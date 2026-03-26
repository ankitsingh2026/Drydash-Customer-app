import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function PaymentSuccess() {
  const params = useLocalSearchParams<{
    orderId?: string;
    amount?: string;
    paymentId?: string;
    date?: string;
    subtotal?: string;
    discount?: string;
    addressTitle?: string;
    addressLine1?: string;
    addressLine2?: string;
    itemName?: string;
    itemQty?: string;
    itemPrice?: string;
  }>();

  const receipt = useMemo(() => {
    const totalPaid = Number(params.amount ?? "50");
    const discount = Number(params.discount ?? "50");
    const subtotal = Number(params.subtotal ?? String(totalPaid + discount));

    return {
      orderId: params.orderId ?? "WZ2296",
      date: params.date ?? "3/20/2026",
      subtotal,
      discount,
      totalPaid,
      addressTitle: params.addressTitle ?? "Main Residence",
      addressLine1: params.addressLine1 ?? "42 Biolume Grove, Emerald",
      addressLine2: params.addressLine2 ?? "District, Neo-Forest 4002",
      items: [
        {
          name: params.itemName ?? "W & I (Wearables)",
          qty: Number(params.itemQty ?? "1"),
          price: Number(params.itemPrice ?? "100"),
          icon: "shirt-outline",
        } as ReceiptItem,
      ],
    };
  }, [params]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#04150F" />

      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backBtn,
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={12}
            >
              <Ionicons name="arrow-back" size={22} color="#DFFFEF" />
            </Pressable>

            <Text style={styles.headerTitle}>Receipt</Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* Payment successful pill */}
          <View style={styles.successPillWrap}>
            <View style={styles.successPill}>
              <Ionicons name="checkmark-circle" size={14} color="#38F2B2" />
              <Text style={styles.successPillText}>PAYMENT SUCCESSFUL</Text>
            </View>
          </View>

          {/* Order ID + date */}
          <View style={styles.orderBlock}>
            <Text style={styles.orderId}>#{receipt.orderId}</Text>
            <Text style={styles.orderDate}>{receipt.date}</Text>
          </View>

          {/* Address card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.iconBox}>
                <Ionicons name="location" size={18} color="#BFFFE8" />
              </View>

              <View style={styles.addressContent}>
                <Text style={styles.sectionLabel}>DELIVERY ADDRESS</Text>
                <Text style={styles.addressTitle}>{receipt.addressTitle}</Text>
                <Text style={styles.addressLine}>{receipt.addressLine1}</Text>
                <Text style={styles.addressLine}>{receipt.addressLine2}</Text>
              </View>
            </View>
          </View>

          {/* Order items */}
          <Text style={styles.groupLabel}>ORDER ITEMS</Text>

          {receipt.items.map((item, idx) => (
            <View key={`${item.name}-${idx}`} style={styles.itemCard}>
              <View style={styles.itemLeft}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name={item.icon ?? "shirt-outline"}
                    size={18}
                    color="#38F2B2"
                  />
                </View>

                <View style={styles.itemTextWrap}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>Quantity: {item.qty}</Text>
                </View>
              </View>

              <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
            </View>
          ))}

          {/* Summary card */}
          <View style={styles.summaryCard}>
            <Row label="Subtotal" value={`₹${receipt.subtotal.toFixed(2)}`} />
            <Row
              label="Discount"
              value={`-₹${receipt.discount.toFixed(2)}`}
              valueStyle={styles.discountValue}
            />

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL PAID</Text>
              <Text style={styles.totalValue}>
                ₹{receipt.totalPaid.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Download button */}
          <LinearGradient
            colors={["#35F1B2", "#A4FFD5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.downloadBtn}
          >
            <Pressable
              onPress={() => {
                // Hook your invoice download API here
                // Example: downloadInvoice(receipt.orderId)
              }}
              style={styles.downloadPressable}
            >
              <Ionicons name="download-outline" size={18} color="#07261B" />
              <Text style={styles.downloadText}>Download Invoice</Text>
            </Pressable>
          </LinearGradient>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#04150F",
  },
  root: {
    flex: 1,
    backgroundColor: "#04150F",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 2,
    paddingBottom: 28,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  headerTitle: {
    color: "#DFFFEF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },

  successPillWrap: {
    alignItems: "center",
    marginBottom: 18,
  },
  successPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(56,242,178,0.25)",
    backgroundColor: "rgba(13, 61, 44, 0.95)",
  },
  successPillText: {
    color: "#38F2B2",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },

  orderBlock: {
    alignItems: "center",
    marginBottom: 18,
  },
  orderId: {
    color: "#DFFFEF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  orderDate: {
    marginTop: 4,
    color: "#8FA69A",
    fontSize: 13,
    fontWeight: "500",
  },

  card: {
    backgroundColor: "#0A241B",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    marginBottom: 18,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#173228",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  addressContent: {
    flex: 1,
  },
  sectionLabel: {
    color: "#5E7A6E",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  addressTitle: {
    color: "#E6FFF4",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  addressLine: {
    color: "#8CA69A",
    fontSize: 13,
    lineHeight: 19,
  },

  groupLabel: {
    color: "#6E8A7F",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginLeft: 4,
    marginBottom: 10,
  },

  itemCard: {
    backgroundColor: "#0A241B",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  itemTextWrap: {
    flex: 1,
  },
  itemName: {
    color: "#E6FFF4",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  itemQty: {
    color: "#80958B",
    fontSize: 12,
    fontWeight: "500",
  },
  itemPrice: {
    color: "#DFFFEF",
    fontSize: 14,
    fontWeight: "700",
  },

  summaryCard: {
    backgroundColor: "#0A241B",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    marginTop: 6,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  summaryLabel: {
    color: "#8AA196",
    fontSize: 13,
    fontWeight: "500",
  },
  summaryValue: {
    color: "#E6FFF4",
    fontSize: 13,
    fontWeight: "700",
  },
  discountValue: {
    color: "#38F2B2",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 2,
  },
  totalLabel: {
    color: "#8AA196",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  totalValue: {
    color: "#38F2B2",
    fontSize: 28,
    fontWeight: "900",
  },

  downloadBtn: {
    borderRadius: 14,
    shadowColor: "#38F2B2",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  downloadPressable: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  downloadText: {
    color: "#07261B",
    fontSize: 15,
    fontWeight: "800",
  },
});