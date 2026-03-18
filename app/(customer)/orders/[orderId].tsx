import { getSingleOrderDetailssApi } from "@/features/orders/orders.api";
import {
  razorpayPaymentInitiate,
  verifyRazorpayPayment,
} from "@/features/payment/payment.api";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { CircleCheckBig } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import RazorpayWebView from "./RazorpayWebView"; // adjust path as needed

// Define types for order details (adjust according to your API response)
interface OrderItem {
  heading: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  _id: string;
  createdAt: string;
  status: string;
  statusHistory?: {
    delivered?: string;
  };
  address: string;
  items: OrderItem[];
  price: number;
  payment?: {
    status: string;
  };
}

export default function OrderReceipt() {
  const params = useLocalSearchParams();
  const orderId =
    typeof params.orderId === "string" ? params.orderId : undefined;

  console.log("this is the orderId okay", orderId);

  const { theme } = useTheme();
  const { user } = useAuth();

  const [singleOrderDetails, setSingleOrderDetails] =
    useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [razorpayData, setRazorpayData] = useState<any>(null);

  // Safely extract user info
  if (!user) return null;
  const User = user?.user ? user?.user : user;
  const email = User?.email ?? "test@example.com";
  const phone = User?.phone ?? User?.mobile ?? "9999999999";
  const name = User?.name ?? User?.fullName ?? "Test User";

  // ---------- Payment Handlers ----------
  const handleRazorpayPayNow = async () => {
    try {
      setPaymentLoading(true);

      console.log("this si the id==>>", orderId);

      const res = await razorpayPaymentInitiate(orderId);

      if (!res?.data?.success) {
        throw new Error("Payment initiation failed");
      }

      setRazorpayData(res.data);

      setShowPaymentWebView(true);
    } catch (error) {
      console.log("payment initiate error", error);
    } finally {
      setPaymentLoading(false);
    }
  };
  const handlePaymentSuccess = async (data: any) => {
    try {
      setPaymentLoading(true);

      const verifyRes = await verifyRazorpayPayment({
        razorpay_order_id: data.orderId,
        razorpay_payment_id: data.paymentId,
        razorpay_signature: data.signature,
      });

      if (!verifyRes?.success) {
        throw new Error("Verification failed");
      }

      router.replace({
        pathname: "/(customer)/orders/payment-success",
        params: {
          orderId,
          amount: String(singleOrderDetails?.price),
          paymentId: data.paymentId,
        },
      });
    } catch (error) {
      router.replace({
        pathname: "/(customer)/orders/payment-failure",
        params: {
          orderId,
          amount: String(singleOrderDetails?.price),
          reason: "Payment verification failed",
        },
      });
    } finally {
      setPaymentLoading(false);
      setShowPaymentWebView(false);
    }
  };

  const handlePaymentFailure = (reason: string) => {
    setShowPaymentWebView(false);
    setPaymentLoading(false);
    router.replace({
      pathname: "/(customer)/orders/payment-failure",
      params: {
        orderId,
        amount: String(singleOrderDetails?.price),
        reason,
      },
    });
  };

  const handlePaymentCancel = () => {
    setShowPaymentWebView(false);
    setPaymentLoading(false);
    // Optionally show a toast or just return
  };

  // ---------- Data Fetching ----------
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

  const calculateSubtotal = (items: OrderItem[] = []) =>
    items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useFocusEffect(
    useCallback(() => {
      getSingleOrderDetails();
    }, [orderId]),
  );

  // ---------- Loading / Error States ----------
  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!singleOrderDetails) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Order not found</Text>
      </View>
    );
  }

  const status =
    singleOrderDetails.status === "processing" ? "Active" : "Completed";
  const isPaid = singleOrderDetails?.payment?.status === "success";
  const subtotal = calculateSubtotal(singleOrderDetails?.items);
  const discountProvided = subtotal - singleOrderDetails?.price;

  // ---------- UI ----------
  return (
    <>
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
            color={theme.subText || theme.text}
          />
        </View>

        {/* TEST BANNER */}
        {/* <View style={styles.testBanner}>
          <Ionicons name="flask-outline" size={14} color="#92400e" />
          <Text style={styles.testBannerText}>
            TEST MODE — card: 4111 1111 1111 1111 | CVV: 123 | OTP: 1234
          </Text>
        </View> */}

        {/* CARD */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.rowBetween}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Order #{orderId}
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>

          <View style={styles.detailBlock}>
            <Text style={styles.label}>Order Date</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {new Date(singleOrderDetails.createdAt).toLocaleString("en-US")}
            </Text>
          </View>

          {singleOrderDetails.status === "delivered" && (
            <View style={styles.detailBlock}>
              <Text style={styles.label}>Delivery Date</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {new Date(
                  singleOrderDetails?.statusHistory?.delivered!,
                ).toLocaleString("en-US")}
              </Text>
            </View>
          )}

          <View style={styles.detailBlock}>
            <Text style={styles.label}>Delivery Address</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {singleOrderDetails.address}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Items
          </Text>
          {(singleOrderDetails.items || []).map((item, index) => (
            <View key={index} style={styles.rowBetween}>
              <Text
                style={[
                  styles.itemText,
                  { color: theme.subText || theme.text },
                ]}
              >
                {item.heading} × {item.quantity}
              </Text>
              <Text style={[styles.itemPrice, { color: theme.text }]}>
                ₹{item.price.toFixed(2)}
              </Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Cost Breakdown
          </Text>
          <View style={styles.rowBetween}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text style={styles.muted}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.muted}>Discount</Text>
            <Text style={styles.muted}>₹{discountProvided.toFixed(2)}</Text>
          </View>

          {isPaid ? (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Payment Details
              </Text>
              <View style={styles.rowBetween}>
                <Text style={styles.muted}>Payment Id</Text>
                <Text style={styles.muted}>
                  {singleOrderDetails?.payment?.paymentId}
                </Text>
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.muted}>Payment Mode</Text>
                <Text style={styles.muted}>
                  {(singleOrderDetails?.payment?.paymentMode).toUpperCase()}
                </Text>
              </View>
            </>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.rowBetween}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>
              Total
            </Text>
            <Text style={[styles.totalValue, { color: theme.text }]}>
              ₹{singleOrderDetails.price.toFixed(2)}
            </Text>
          </View>

          {/* PAY NOW BUTTON */}
          {!isPaid ? (
            <TouchableOpacity
              onPress={handleRazorpayPayNow}
              disabled={paymentLoading}
              style={[
                styles.payBtn,
                {
                  backgroundColor: theme.primary,
                  opacity: paymentLoading ? 0.6 : 1,
                },
              ]}
            >
              {paymentLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={styles.payBtnText}>
                  Pay Now ₹{singleOrderDetails.price.toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.payBtn,
                { backgroundColor: theme.primary, opacity: 0.5 },
              ]}
            >
              <View style={styles.payBtnContent}>
                <CircleCheckBig size={18} color="#0c0101" />
                <Text style={styles.payBtnText}>
                  Paid ₹{singleOrderDetails.price.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Payment WebView Modal */}
      <Modal visible={showPaymentWebView} animationType="slide">
        {razorpayData && (
          <RazorpayWebView
            amount={razorpayData.amount}
            orderId={razorpayData.orderId}
            razorpayOrderId={razorpayData.razorpayOrderId}
            razorpayKey={razorpayData.key}
            email={email}
            phone={phone}
            name={name}
            themeColor={theme.primary}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
            onCancel={handlePaymentCancel}
          />
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 45,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  testBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  testBannerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400e",
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
  payBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  payBtnContent: {
    flexDirection: "row", // ✅ horizontal
    alignItems: "center",
    justifyContent: "center",
    gap: 6, // ✅ spacing (or use marginRight)
  },

  payBtnText: {
    color: "#0c0101",
    fontWeight: "700",
    fontSize: 16,
  },
});
