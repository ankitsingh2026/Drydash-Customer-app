import CouponCard, { COUPONS } from "@/components/CouponCard";
import { getSingleOrderDetailssApi } from "@/features/orders/orders.api";
import {
  razorpayPaymentInitiate,
  verifyRazorpayPayment,
} from "@/features/payment/payment.api";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import RazorpayWebView from "./RazorpayWebView";
// ─── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  heading: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  _id: string;
  orderId?: string;
  createdAt: string;
  status: string;
  statusHistory?: { delivered?: string };
  address: string;
  items: OrderItem[];
  price: number;
  payment?: {
    status: string;
    paymentId?: string;
    paymentMode?: string;
  };
}



// ─── Item icon helper ──────────────────────────────────────────────────────────
function ItemIcon({ heading, color }: { heading: string; color: string }) {
  const h = heading.toLowerCase();
  if (h.includes("shoe") || h.includes("footwear") || h.includes("boot") || h.includes("sneaker")) {
    return <MaterialCommunityIcons name="shoe-sneaker" size={20} color={color} />;
  }
  if (h.includes("laundry") || h.includes("wash") || h.includes("wearable") || h.includes("shirt") || h.includes("tee")) {
    return <MaterialCommunityIcons name="tshirt-crew-outline" size={20} color={color} />;
  }
  return <MaterialCommunityIcons name="washing-machine" size={20} color={color} />;
}

// ─── Coupon Bottom Sheet ───────────────────────────────────────────────────────
// function CouponSheet({
//   visible,
//   onClose,
//   onApply,
//   appliedCode,
//   subtotal,
// }: {
//   visible: boolean;
//   onClose: () => void;
//   onApply: (coupon: Coupon) => void;
//   appliedCode: string;
//   subtotal: number;
// }) {
//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="slide"
//       statusBarTranslucent
//       onRequestClose={onClose}
//     >
//       <Pressable style={cs.overlay} onPress={onClose}>
//         <Pressable style={cs.sheet} onPress={() => {}}>
//           {/* Drag handle */}
//           <View style={cs.handle} />

//           <View style={cs.sheetHeader}>
//             <Text style={cs.sheetTitle}>Available Coupons</Text>
//             <TouchableOpacity onPress={onClose} hitSlop={10}>
//               <Ionicons name="close" size={22} color="#DEE5FF" />
//             </TouchableOpacity>
//           </View>

//           <ScrollView showsVerticalScrollIndicator={false}>
//             {COUPONS.map((coupon) => {
//               const isApplied = appliedCode === coupon.code;
//               const eligible =
//                 coupon.minOrder === 0 || subtotal >= coupon.minOrder;
//               return (
//                 <View key={coupon.code} style={cs.couponCard}>
//                   <View style={cs.couponLeft}>
//                     <View style={cs.couponTagRow}>
//                       <View style={cs.couponTag}>
//                         <Text style={cs.couponTagText}>{coupon.tag}</Text>
//                       </View>
//                     </View>
//                     <Text style={cs.couponTitle}>{coupon.title}</Text>
//                     <Text style={cs.couponDesc}>{coupon.description}</Text>
//                   </View>
//                   <TouchableOpacity
//                     onPress={() => eligible && onApply(coupon)}
//                     style={[
//                       cs.applyBtn,
//                       isApplied && cs.applyBtnActive,
//                       !eligible && cs.applyBtnDisabled,
//                     ]}
//                   >
//                     <Text
//                       style={[
//                         cs.applyBtnText,
//                         isApplied && cs.applyBtnTextActive,
//                       ]}
//                     >
//                       {isApplied ? "REMOVE" : "APPLY"}
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
//               );
//             })}
//           </ScrollView>
//         </Pressable>
//       </Pressable>
//     </Modal>
//   );
// }

// ─── Main Component ────────────────────────────────────────────────────────────
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

  // Coupon state
  const [showCouponSheet, setShowCouponSheet] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  if (!user) return null;
  const User = user?.user ? user?.user : user;
  const email = User?.email ?? "test@example.com";
  const phone = User?.phone ?? User?.mobile ?? "9999999999";
  const name = User?.name ?? User?.fullName ?? "Test User";

  // ── Payment Handlers (logic unchanged) ───────────────────────────────────
  const handleRazorpayPayNow = async () => {
    try {
      setPaymentLoading(true);
      console.log("this si the id==>>", orderId);
      const res = await razorpayPaymentInitiate(orderId);
      if (!res?.data?.success) throw new Error("Payment initiation failed");
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
      if (!verifyRes?.success) throw new Error("Verification failed");
      router.replace({
        pathname: "/(customer)/orders/payment-success",
        params: {
          orderId,
          amount: String(singleOrderDetails?.price),
          paymentId: data.paymentId,
        },
      });
    } catch {
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
      params: { orderId, amount: String(singleOrderDetails?.price), reason },
    });
  };

  const handlePaymentCancel = () => {
    setShowPaymentWebView(false);
    setPaymentLoading(false);
  };

  // ── Data Fetching (unchanged) ─────────────────────────────────────────────
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

  // ── Coupon handlers ───────────────────────────────────────────────────────
  const handleApplyCoupon = (coupon: Coupon) => {
    if (appliedCoupon?.code === coupon.code) {
      // Remove
      setAppliedCoupon(null);
      setCouponInput("");
      setCouponError("");
      setShowCouponSheet(false);
      return;
    }
    setAppliedCoupon(coupon);
    setCouponInput(coupon.code);
    setCouponError("");
    setShowCouponSheet(false);
  };

  const handleManualApply = () => {
    const match = COUPONS.find(
      (c) => c.code === couponInput.trim().toUpperCase()
    );
    if (!match) {
      setCouponError("Invalid coupon code");
      return;
    }
    const subtotal = calculateSubtotal(singleOrderDetails?.items);
    if (match.minOrder > 0 && subtotal < match.minOrder) {
      setCouponError(`Minimum order ₹${match.minOrder} required`);
      return;
    }
    setAppliedCoupon(match);
    setCouponError("");
  };

  const getCouponDiscount = (coupon: Coupon | null, subtotal: number) => {
    if (!coupon) return 0;
    if (coupon.type === "flat") return coupon.value;
    if (coupon.type === "percent") {
      const disc = Math.round((subtotal * coupon.value) / 100);
      return Math.min(disc, (coupon as any).maxDiscount ?? disc);
    }
    return 0; // delivery type - show as label
  };

  // ── Loading / Error States ────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!singleOrderDetails) {
    return (
      <View style={[s.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Order not found</Text>
      </View>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const isPaid = singleOrderDetails?.payment?.status === "success";
  const isActive =
    singleOrderDetails.status === "processing" ||
    singleOrderDetails.status === "active";

  const statusLabel = isActive
    ? "Active"
    : singleOrderDetails.status.charAt(0).toUpperCase() +
    singleOrderDetails.status.slice(1);

  const subtotal = calculateSubtotal(singleOrderDetails.items);
  const baseDiscount = subtotal - singleOrderDetails.price;
  const couponDiscount = getCouponDiscount(appliedCoupon, subtotal);
  const totalDiscount = baseDiscount + couponDiscount;
  const finalTotal = Math.max(0, subtotal - totalDiscount);

  const displayOrderId = `#${(orderId ?? singleOrderDetails._id.slice(-6)).toUpperCase()}`;

  const scheduledDate = new Date(singleOrderDetails.createdAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.container,
            { backgroundColor: theme.background },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── HEADER ── */}
          <View style={s.header}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: theme.text }]}>Receipt</Text>
            <View style={[s.avatarCircle, { backgroundColor: theme.card }]}>
              <Ionicons
                name="person-outline"
                size={16}
                color={theme.primary}
              />
            </View>
          </View>

          {/* ── ORDER ID + STATUS + TRACKING BADGE ── */}
          <View style={s.orderCard}>
            <View style={s.orderTopRow}>
              <View>
                <Text style={s.orderSmallId}>ORDER #{displayOrderId}</Text>
                <Text style={[s.activeLabel, { color: theme.text }]}>
                  {statusLabel}
                </Text>
              </View>

              <View style={s.liveTrackingBadge}>
                <View style={s.liveDot} />
                <Text style={s.liveTrackingText}>LIVE TRACKING</Text>
              </View>
            </View>

            <View style={s.infoBlock}>
              <View style={s.infoRow}>
                <View style={[s.infoIconBox, { backgroundColor: theme.card }]}>
                  <Ionicons name="calendar-outline" size={16} color={theme.primary} />
                </View>

                <View style={s.infoTextWrap}>
                  <Text style={s.infoLabel}>Scheduled Date</Text>
                  <Text style={[s.infoValue, { color: theme.text }]}>
                    {scheduledDate} • 10:00 AM
                  </Text>
                </View>
              </View>

              <View style={[s.infoSep, { backgroundColor: theme.border }]} />

              <View style={s.infoRow}>
                <View style={[s.infoIconBox, { backgroundColor: theme.card }]}>
                  <Ionicons name="location-outline" size={16} color={theme.primary} />
                </View>

                <View style={s.infoTextWrap}>
                  <Text style={s.infoLabel}>Address</Text>
                  <Text style={[s.infoValue, { color: theme.text }]}>
                    {singleOrderDetails.address}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── ORDER DETAILS ── */}
          <Text style={[s.sectionHeading, { color: theme.text }]}>
            Order Details
          </Text>

          {(singleOrderDetails.items || []).map((item, index) => (
            <View
              key={index}
              style={[s.itemCard, { backgroundColor: theme.card }]}
            >
              <View
                style={[s.itemIconBox, { backgroundColor: theme.background }]}
              >
                <ItemIcon heading={item.heading} color={theme.primary} />
              </View>
              <View style={s.itemInfo}>
                <Text style={[s.itemName, { color: theme.text }]}>
                  {item.heading}
                </Text>
                <Text style={s.itemSub}>
                  {item.quantity}{" "}
                  {item.heading.toLowerCase().includes("shoe") ||
                    item.heading.toLowerCase().includes("boot")
                    ? "Pair"
                    : "Shirt/Tee"}
                </Text>
              </View>
              <Text style={[s.itemPrice, { color: theme.text }]}>
                ₹{(item.price * item.quantity).toFixed(0)}
              </Text>
            </View>
          ))}

          {/* ── AVAILABLE OFFERS ── */}
          <View style={s.offersHeader}>
            <Text style={s.offersLabel}>AVAILABLE OFFERS</Text>
            <TouchableOpacity onPress={() => setShowCouponSheet(true)}>
              <Text style={[s.viewAllText, { color: theme.primary }]}>
                VIEW ALL &rsaquo;
              </Text>
            </TouchableOpacity>
          </View>

          {/* Coupon Input */}
          <View style={[s.couponInputRow, { backgroundColor: "#00110E" }]}>
            <MaterialCommunityIcons
              name="ticket-percent-outline"
              size={18}
              color="#64748b"
              style={{ marginRight: 8 }}
            />
            <TextInput
              value={couponInput}
              onChangeText={(t) => {
                setCouponInput(t);
                setCouponError("");
                if (!t) setAppliedCoupon(null);
              }}
              placeholder="Coupon Code"
              placeholderTextColor="#475569"
              style={[s.couponInput, { color: theme.text }]}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              onPress={handleManualApply}
              style={[s.couponApplyBtn, { backgroundColor: "#22EBAB" }]}
            >
              <Text style={s.couponApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {couponError ? (
            <Text style={s.couponError}>{couponError}</Text>
          ) : null}

          {/* Best coupon suggestion card */}
          {!appliedCoupon && (
            <View style={[s.suggestionCard, { backgroundColor: theme.card }]}>
              <View style={s.suggestionLeft}>
                <View style={s.suggestionTagRow}>
                  <View style={s.codeTag}>
                    <Text style={s.codeTagText}>SAVE50</Text>
                  </View>
                  <View style={s.bestValueTag}>
                    <Text style={s.bestValueText}>BEST VALUE</Text>
                  </View>
                </View>
                <Text style={[s.suggestionDesc, { color: "#94a3b8" }]}>
                  ₹50 OFF on this order
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  const coupon = COUPONS?.find((c) => c.code === "SAVE50");
                  if (!coupon) return;

                  handleApplyCoupon(coupon);
                }}
                style={[s.suggestionApplyBtn, { backgroundColor: "#22EBAB" }]}
              >
                <Text style={s.suggestionApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Applied coupon pill */}
          {appliedCoupon && (
            <View style={[s.appliedPill, { backgroundColor: "#0B3326" }]}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={14}
                color={theme.primary}
              />
              <Text style={[s.appliedPillText, { color: theme.primary }]}>
                "{appliedCoupon.code}" applied!
                {couponDiscount > 0 ? ` Save ₹${couponDiscount}` : " Free delivery!"}
              </Text>
              <TouchableOpacity onPress={() => { setAppliedCoupon(null); setCouponInput(""); }}>
                <Ionicons name="close-circle" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          )}

          {/* ── BILL SUMMARY ── */}
          <View style={[s.billCard, { backgroundColor: theme.card }]}>
            <View style={s.billRow}>
              <Text style={s.billLabel}>Subtotal</Text>
              <Text style={[s.billValue, { color: theme.text }]}>
                ₹{subtotal.toFixed(0)}
              </Text>
            </View>
            <View style={s.billRow}>
              <Text style={s.billLabel}>Discount</Text>
              <Text style={s.discountValue}>-₹{totalDiscount.toFixed(0)}</Text>
            </View>

            {totalDiscount > 0 && (
              <View style={s.savingsPill}>
                <Text style={s.savingsPillText}>
                  Woohoo! You saved ₹{totalDiscount.toFixed(0)}!
                </Text>
              </View>
            )}

            <View style={[s.billDivider, { backgroundColor: theme.border }]} />

            <View style={s.totalRow}>
              <Text style={[s.totalLabel, { color: theme.text }]}>
                Total Amount
              </Text>
              <Text style={[s.totalAmount, { color: theme.primary }]}>
                ₹{finalTotal.toFixed(0)}
              </Text>
            </View>
          </View>

          {/* ── SECURE PAYMENT ICONS ── */}
          <View style={s.secureSection}>
            <Ionicons name="lock-closed-outline" size={12} color="#64748b" />
            <Text style={s.secureText}> SECURE PAYMENT</Text>
          </View>
          <View style={s.paymentIconsRow}>
            <MaterialCommunityIcons
              name="credit-card-outline"
              size={26}
              color="#475569"
            />
            <MaterialCommunityIcons
              name="bank-outline"
              size={26}
              color="#475569"
            />
            <MaterialCommunityIcons
              name="cellphone"
              size={26}
              color="#475569"
            />
          </View>

          {/* Spacer for fixed button */}
          <View style={{ height: 90 }} />
        </ScrollView>

        {/* ── PAY NOW FIXED BUTTON ── */}
        <View
          style={[s.payBtnWrapper, { backgroundColor: theme.background }]}
        >
          {isPaid ? (
            <View
              style={[
                s.payBtn,
                { backgroundColor: theme.primary, opacity: 0.6 },
              ]}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={20}
                color="#001714"
              />
              <Text style={s.payBtnText}>
                Paid ₹{singleOrderDetails.price.toFixed(0)}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleRazorpayPayNow}
              disabled={paymentLoading}
              style={[
                s.payBtn,
                {
                  backgroundColor: theme.primary,
                  opacity: paymentLoading ? 0.7 : 1,
                },
              ]}
            >
              {paymentLoading ? (
                <ActivityIndicator size="small" color="#001714" />
              ) : (
                <>
                  <Text style={s.payBtnText}>Pay ₹{finalTotal.toFixed(0)} Now</Text>
                  <Ionicons name="arrow-forward" size={18} color="#001714" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ── COUPON BOTTOM SHEET ── */}
      <CouponCard
        visible={showCouponSheet}
        onClose={() => setShowCouponSheet(false)}
        onApply={handleApplyCoupon}
        appliedCode={appliedCoupon?.code ?? ""}
        subtotal={subtotal}
      />

      {/* ── PAYMENT WEBVIEW MODAL (logic unchanged) ── */}
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


const s = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: { width: 36, height: 36, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  // Order top row
  orderCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#0D2B24", // darker + richer

    // 👇 subtle border like image
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },

  infoBlock: {
    marginTop: 12,
    paddingTop: 10,
  },

  orderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  orderSmallId: {
    fontSize: 11,
    color: "#7F948A",
    fontWeight: "600",
    letterSpacing: 0.7,
    marginBottom: 6,
  },

  activeLabel: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 0.2,
    lineHeight: 34,
  },

  liveTrackingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B3326",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
    marginTop: 4,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#9FFFD3",
  },

  liveTrackingText: {
    fontSize: 10,
    color: "#9FFFD3",
    fontWeight: "700",
    letterSpacing: 0.7,
  },



  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoSep: {
    height: 1,
    marginVertical: 14,
    opacity: 0.7,
  },

  infoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  infoTextWrap: {
    marginLeft: 12,
    flex: 1,
  },

  infoLabel: {
    fontSize: 10,
    color: "#7F948A",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  // Section heading
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 10,
  },

  // Item cards
  itemCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 16, fontWeight: "700" },
  itemSub: { fontSize: 14, color: "#64748b", marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: "700" },

  // Available Offers
  offersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  offersLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "700",
    letterSpacing: 1,
  },
  viewAllText: { fontSize: 12, fontWeight: "700" },

  // Coupon input row
  couponInputRow: {
    marginHorizontal: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 10,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: "#000"
  },
  couponInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 8,
    borderRadius: 8,

  },
  couponApplyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  couponApplyText: {
    color: "#001714",
    fontWeight: "700",
    fontSize: 13,
  },
  couponError: {
    color: "#f87171",
    fontSize: 11,
    marginHorizontal: 24,
    marginBottom: 6,
  },

  // Suggestion card (best coupon)
  suggestionCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 4,
  },
  suggestionLeft: { flex: 1 },
  suggestionTagRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  codeTag: {
    backgroundColor: "#1E3A34",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  codeTagText: {
    color: "#9FFFD3",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  bestValueTag: {
    backgroundColor: "#422006",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  bestValueText: {
    color: "#fb923c",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  suggestionDesc: { fontSize: 12, fontWeight: "500" },
  suggestionApplyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
  },
  suggestionApplyText: {
    color: "#001714",
    fontWeight: "700",
    fontSize: 13,
  },

  // Applied coupon pill
  appliedPill: {
    marginHorizontal: 20,
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  appliedPillText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },

  // Bill card
  billCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  billLabel: { fontSize: 13, color: "#64748b" },
  billValue: { fontSize: 13, fontWeight: "600" },
  discountValue: { fontSize: 13, fontWeight: "700", color: "#f87171" },
  savingsPill: {
    alignSelf: "center",
    backgroundColor: "#0B3326",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  savingsPillText: {
    color: "#9FFFD3",
    fontSize: 11,
    fontWeight: "700",
  },
  billDivider: { height: 1, marginVertical: 12 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 15, fontWeight: "700" },
  totalAmount: { fontSize: 26, fontWeight: "700" },

  // Secure payment
  secureSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  secureText: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  paymentIconsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 10,
  },

  // Pay button
  payBtnWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    paddingTop: 12,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 50,
  },
  payBtnText: {
    color: "#001714",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
