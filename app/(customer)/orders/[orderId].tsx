import PaymentWebView from "@/components/payments/PaymentWebView";
import { getSingleOrderDetailssApi } from "@/features/orders/orders.api";
import { createOrderPaymentApi } from "@/features/payment/payment.api";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";

export default function OrderReceipt() {
  const params = useLocalSearchParams();
  const orderId =
    typeof params.orderId === "string" ? params.orderId : undefined;

  console.log("this is the orderId", orderId);

  const { theme } = useTheme();

  const [singleOrderDetails, setSingleOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [showPaymentWebview, setShowPaymentWebview] = useState(false);

  const { user } = useAuth();

  if (!user) return null;

  console.log("this is userrrr==>>", user);

  const User = user?.user ? user?.user : user;

  const email = User?.email;

  console.log("this is the email===>>", email);

  const paymentObj = {
    orderId,
    paymentMode: "upi",
    email,
  };

  /* ================= API ================= */

  const handlePayNow = async () => {
    try {
      const res = await createOrderPaymentApi(paymentObj);

      console.log("this is the ressss", res);

      let data = res?.paymentData;

      console.log("this is the dataaaa===>>>>>", data);

      if (!data?.hash) {
        alert("Payment init failed");
        return;
      }

      setPaymentData(data);
      setShowPaymentWebview(true);
    } catch (e) {
      console.log(e);
      alert("Payment error");
    }
  };

  const getSingleOrderDetails = async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const data = await getSingleOrderDetailssApi(orderId);
      setSingleOrderDetails(data.order_details);
    } catch (error) {
      console.log("Single order error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = (items: any[] = []) => {
    return items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  };

  const discountProvided =
    calculateSubtotal(singleOrderDetails?.items) - singleOrderDetails?.price;

  useFocusEffect(
    useCallback(() => {
      getSingleOrderDetails();
    }, [orderId]),
  );

  /* ================= LOADER ================= */

  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  /* ================= NO DATA ================= */

  if (!singleOrderDetails) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Order not found</Text>
      </View>
    );
  }

  /* ================= ADD STEP 4 HERE ================= */

  console.log("this is the paymentDatab 1222", showPaymentWebview, orderId);

  if (showPaymentWebview && paymentData && orderId) {
    return (
      <PaymentWebView
        paymentData={paymentData}
        orderId={orderId}
        onSuccess={() => {
          setShowPaymentWebview(false);
          alert("Payment successful ✅");
          getSingleOrderDetails();
        }}
        onFailure={() => {
          setShowPaymentWebview(false);
          alert("Payment failed");
        }}
      />
    );
  }

  /* ================= DERIVED DATA ================= */

  const status =
    singleOrderDetails.status === "delivered" ? "Completed" : "Active";

  /* ================= UI ================= */

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
          Order #{orderId} Receipt
        </Text>

        <Ionicons
          name="person-circle-outline"
          size={26}
          color={theme.subText}
        />
      </View>

      {/* CARD */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {/* STATUS */}
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Order #{orderId}
          </Text>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        {/* DETAILS */}
        <View style={styles.detailBlock}>
          <Text style={styles.label}>Order Date</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {new Date(singleOrderDetails.createdAt).toLocaleString("en-US")}
          </Text>
        </View>

        {singleOrderDetails.status === "delivered" ? (
          <View style={styles.detailBlock}>
            <Text style={styles.label}>Delivery Date</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {new Date(
                singleOrderDetails?.statusHistory?.delivered,
              ).toLocaleString("en-US")}
            </Text>
          </View>
        ) : (
          <View></View>
        )}

        <View style={styles.detailBlock}>
          <Text style={styles.label}>Delivery Address</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {singleOrderDetails.address}
          </Text>
        </View>

        {/* ITEMS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Items</Text>

        {(singleOrderDetails.items || []).map((item: any, i: number) => (
          <View key={i} style={styles.rowBetween}>
            <Text style={[styles.itemText, { color: theme.subText }]}>
              {item.heading} × {item.quantity}
            </Text>
            <Text style={[styles.itemPrice, { color: theme.text }]}>
              ₹{item.price.toFixed(2)}
            </Text>
          </View>
        ))}

        {/* COST */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Cost Breakdown
        </Text>

        <View style={styles.rowBetween}>
          <Text style={styles.muted}>Subtotal</Text>
          <Text style={styles.muted}>
            ₹{calculateSubtotal(singleOrderDetails?.items).toFixed(2)}
          </Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.muted}>Discount</Text>
          <Text style={styles.muted}>₹{discountProvided.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.rowBetween}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: theme.text }]}>
            ₹{singleOrderDetails.price.toFixed(2)}
          </Text>
        </View>

        {singleOrderDetails.paymentStatus !== "paid" && (
          <TouchableOpacity
            onPress={handlePayNow}
            style={{
              marginTop: 20,
              backgroundColor: theme.primary,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              Pay Now ₹{singleOrderDetails.price.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 0,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
});
