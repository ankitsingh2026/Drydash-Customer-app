import PaymentWebView from "@/components/payments/PaymentWebView";
import { getSingleOrderDetailssApi } from "@/features/orders/orders.api";
<<<<<<< HEAD
import { createOrderPaymentApi } from "@/features/payment/payment.api";
=======
>>>>>>> 9323aae2f07c7faa1817a307a7be4355de27fc8a
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
  const orderId = typeof params.orderId === "string" ? params.orderId : undefined;

  console.log("this is the orderId", orderId);

  const { theme } = useTheme();
  const { user } = useAuth();

  const [singleOrderDetails, setSingleOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
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
=======
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
>>>>>>> 9323aae2f07c7faa1817a307a7be4355de27fc8a

  // Safely extract user info
  if (!user) return null;
  const User = user?.user ? user?.user : user;
  const email = User?.email ?? "test@example.com";
  const phone = User?.phone ?? User?.mobile ?? "9999999999";
  const name = User?.name ?? User?.fullName ?? "Test User";

<<<<<<< HEAD
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

=======
  // ---------- Payment Handlers ----------
  const handleRazorpayPayNow = () => {
    setPaymentLoading(true);
    setShowPaymentWebView(true);
  };

  const handlePaymentSuccess = (paymentId: string) => {
    setShowPaymentWebView(false);
    setPaymentLoading(false);
    router.replace({
      pathname: "/(customer)/orders/payment-success",
      params: {
        orderId,
        amount: String(singleOrderDetails?.price),
        paymentId,
      },
    });
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
>>>>>>> 9323aae2f07c7faa1817a307a7be4355de27fc8a
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
    }, [orderId])
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

<<<<<<< HEAD
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
=======
  const status = singleOrderDetails.status === "delivered" ? "Completed" : "Active";
  const isPaid = singleOrderDetails?.payment?.status === "success";
  const subtotal = calculateSubtotal(singleOrderDetails?.items);
  const discountProvided = subtotal - singleOrderDetails?.price;
>>>>>>> 9323aae2f07c7faa1817a307a7be4355de27fc8a

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
          <Ionicons name="person-circle-outline" size={26} color={theme.subText || theme.text} />
        </View>

        {/* TEST BANNER */}
        <View style={styles.testBanner}>
          <Ionicons name="flask-outline" size={14} color="#92400e" />
          <Text style={styles.testBannerText}>
            TEST MODE — card: 4111 1111 1111 1111 | CVV: 123 | OTP: 1234
          </Text>
        </View>

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
<<<<<<< HEAD
        ) : (
          <View></View>
        )}
=======
>>>>>>> 9323aae2f07c7faa1817a307a7be4355de27fc8a

          {singleOrderDetails.status === "delivered" && (
            <View style={styles.detailBlock}>
              <Text style={styles.label}>Delivery Date</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {new Date(singleOrderDetails?.statusHistory?.delivered!).toLocaleString("en-US")}
              </Text>
            </View>
          )}

          <View style={styles.detailBlock}>
            <Text style={styles.label}>Delivery Address</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {singleOrderDetails.address}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Items</Text>
          {(singleOrderDetails.items || []).map((item, index) => (
            <View key={index} style={styles.rowBetween}>
              <Text style={[styles.itemText, { color: theme.subText || theme.text }]}>
                {item.heading} × {item.quantity}
              </Text>
              <Text style={[styles.itemPrice, { color: theme.text }]}>
                ₹{item.price.toFixed(2)}
              </Text>
            </View>
          ))}

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Cost Breakdown</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text style={styles.muted}>₹{subtotal.toFixed(2)}</Text>
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

          {/* PAY NOW BUTTON */}
          {!isPaid ? (
            <TouchableOpacity
              onPress={handleRazorpayPayNow}
              disabled={paymentLoading}
              style={[
                styles.payBtn,
                { backgroundColor: theme.primary, opacity: paymentLoading ? 0.6 : 1 },
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
            <View style={[styles.payBtn, { backgroundColor: theme.primary, opacity: 0.5 }]}>
              <Text style={styles.payBtnText}>
                ✅ Paid ₹{singleOrderDetails.price.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

<<<<<<< HEAD
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
=======
      {/* Payment WebView Modal */}
      <Modal visible={showPaymentWebView} animationType="slide">
        <RazorpayWebView
          amount={singleOrderDetails.price}
          orderId={orderId!}
          email={email}
          phone={phone}
          name={name}
          themeColor={theme.primary}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onCancel={handlePaymentCancel}
        />
      </Modal>
    </>
>>>>>>> 9323aae2f07c7faa1817a307a7be4355de27fc8a
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
  payBtnText: {
    color: "#0c0101",
    fontWeight: "700",
    fontSize: 16,
  },
});