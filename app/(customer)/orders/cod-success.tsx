import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { useTheme } from "../../../context/ThemeContext";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
  icon?: keyof typeof Ionicons.glyphMap;
  imageUrl?: string;
};

export default function CodSuccess() {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme);

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
    address?: string;
    items?: string;
  }>();

  const receipt = useMemo(() => {
    const totalPaid = Number(params.amount ?? "50");
    const discount = Number(params.discount ?? "50");
    const subtotal = Number(params.subtotal ?? String(totalPaid + discount));

    let parsedItems: ReceiptItem[] = [];
    try {
      if (params.items) {
        const rawItems = JSON.parse(params.items);
        parsedItems = rawItems.map((it: any) => ({
          name: it.heading || it.name || "Item",
          qty: Number(it.quantity || it.qty || 1),
          price: Number(it.price || 0),
          icon: "shirt-outline",
          imageUrl: it.imageUrl || undefined,
        }));
      }
    } catch(e) {}

    if (parsedItems.length === 0) {
      parsedItems = [
        {
          name: params.itemName ?? "W & I (Wearables)",
          qty: Number(params.itemQty ?? "1"),
          price: Number(params.itemPrice ?? "100"),
          icon: "shirt-outline",

        } as ReceiptItem,
      ];
    }

    return {
      orderId: params.orderId ?? "WZ2296",
      date: params.date ?? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      subtotal,
      discount,
      totalPaid,
      addressTitle: params.addressTitle ?? "Delivery Location",
      addressLine1: params.address || (params.addressLine1 ?? "Address details pending"),
      addressLine2: params.addressLine2 ?? "",
      items: parsedItems,
    };
  }, [params]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      <View style={styles.root}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.replace("/(customer)/(tabs)/home")}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.7 },
            ]}
            hitSlop={12}
          >
            <Ionicons name="home" size={20} color={theme.text} />
          </Pressable>

          <Text style={styles.headerTitle}>Order Confirmed</Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* Payment successful pill */}
          <View style={styles.successPillWrap}>
            <View style={styles.successPill}>
              <Ionicons name="cash" size={16} color="#F2C94C" />
              <Text style={styles.successPillText}>CASH ON DELIVERY</Text>
            </View>
            <Text style={styles.subtext}>Please keep exact change ready at delivery.</Text>
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
                {/* <Text style={styles.addressTitle}>{receipt.addressTitle}</Text> */}
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
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{ width: 36, height: 36, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <Ionicons name={item.icon || "cube"} size={18} color="#BFFFE8" />
                  )}
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
            {receipt.discount > 0 && (
              <Row
                label="Discount"
                value={`-₹${receipt.discount.toFixed(2)}`}
                valueStyle={styles.discountValue}
              />
            )}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>AMOUNT TO PAY</Text>
              <Text style={styles.totalValue}>
                ₹{receipt.totalPaid.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Button */}
          <LinearGradient
            colors={[theme.primary, theme.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.downloadBtn}
          >
            <Pressable
              onPress={() => {
                router.replace("/(customer)/(tabs)/home");
              }}
              style={styles.downloadPressable}
            >
              <Ionicons name="home-outline" size={18} color={theme.background} />
              <Text style={styles.downloadText}>Return to Home</Text>
            </Pressable>
          </LinearGradient>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}



const makeStyles = (theme: any) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.background,
  },
  root: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 28,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 10 : 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.card,
  },
  headerTitle: {
    color: theme.text,
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
    borderColor: theme.card,
    backgroundColor: theme.card,
  },
  successPillText: {
    color: "#F2C94C",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  subtext: {
    color: theme.textSecondary,
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },

  orderBlock: {
    alignItems: "center",
    marginBottom: 18,
  },
  orderId: {
    color: theme.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  orderDate: {
    marginTop: 4,
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },

  card: {
    backgroundColor: theme.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
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
    backgroundColor: theme.inputBackground,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  addressContent: {
    flex: 1,
  },
  sectionLabel: {
    color: theme.textSecondary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  addressTitle: {
    color: theme.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  addressLine: {
    color: theme.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },

  groupLabel: {
    color: theme.textSecondary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginLeft: 4,
    marginBottom: 10,
  },

  itemCard: {
    backgroundColor: theme.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  itemQty: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  itemPrice: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "700",
  },

  summaryCard: {
    backgroundColor: theme.card,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  summaryValue: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "700",
  },
  discountValue: {
    color: theme.border,
  },
  divider: {
    height: 1,
    backgroundColor: theme.card,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 2,
  },
  totalLabel: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
  totalValue: {
    color: theme.border,
    fontSize: 28,
    fontWeight: "900",
  },

  downloadBtn: {
    borderRadius: 14,
    shadowColor: theme.border,
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
    color: theme.background,
    fontSize: 15,
    fontWeight: "800",
  },
});