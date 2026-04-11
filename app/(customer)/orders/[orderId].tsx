import CouponCard, { Coupon } from "@/components/CouponCard";
import {
  applyCouponApi,
  confirmCouponApi,
  fetchAllValidCoupons,
  removeCouponApi,
} from "@/features/coupons/coupons.api";
import { getSingleOrderDetailssApi } from "@/features/orders/orders.api";
import {
  razorpayPaymentInitiate,
  verifyRazorpayPayment,
} from "@/features/payment/payment.api";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
  View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import RazorpayWebView from "./RazorpayWebView";

interface OrderItem {
  heading: string;
  quantity: number;
  price: number;
  type?: string;
  category?: string;
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

function ItemIcon({ heading, color }: { heading: string; color: string }) {
  const h = heading.toLowerCase();

  if (
    h.includes("shoe") ||
    h.includes("footwear") ||
    h.includes("boot") ||
    h.includes("sneaker")
  ) {
    return (
      <MaterialCommunityIcons name="shoe-sneaker" size={20} color={color} />
    );
  }

  if (
    h.includes("laundry") ||
    h.includes("wash") ||
    h.includes("wearable") ||
    h.includes("shirt") ||
    h.includes("tee")
  ) {
    return (
      <MaterialCommunityIcons
        name="tshirt-crew-outline"
        size={20}
        color={color}
      />
    );
  }

  return (
    <MaterialCommunityIcons name="washing-machine" size={20} color={color} />
  );
}

export default function OrderReceipt() {
  const params = useLocalSearchParams();
  const orderId =
    typeof params.orderId === "string" ? params.orderId : undefined;

  const { theme } = useTheme();
  const { user } = useAuth();

  const [singleOrderDetails, setSingleOrderDetails] =
    useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [razorpayData, setRazorpayData] = useState<any>(null);

  const [showCouponSheet, setShowCouponSheet] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [isPaymentDone, setIsPaymentDone] = useState(false);

  if (!user) return null;

  const User = user?.user ? user?.user : user;
  const email = User?.email ?? "test@example.com";
  const phone = User?.phone ?? User?.mobile ?? "9999999999";
  const name = User?.name ?? User?.fullName ?? "Test User";

  console.log("this is the userrr---->>>>", User?.id);

  const calculateSubtotal = (items: OrderItem[] = []) =>
    items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getOrderCategory = (order: OrderDetails | null) => {
    if (!order?.items?.length) return "";

    const firstItem = order.items[0];

    const rawCategory =
      firstItem?.type || firstItem?.category || firstItem?.heading || "";

    const normalized = rawCategory.toUpperCase().trim();

    if (normalized.includes("SHOE")) return "SHOESPA";
    if (normalized.includes("DRY")) return "DRYCLEAN";
    if (normalized.includes("LAUNDRY") || normalized.includes("WASH")) {
      return "LAUNDRY";
    }

    return normalized;
  };

  const getSingleOrderDetails = async () => {
    if (!orderId) return null;

    try {
      setLoading(true);
      const data = await getSingleOrderDetailssApi(orderId);
      const orderDetails = data?.order_details || null;

      setSingleOrderDetails({ ...orderDetails }); // 🔥 force re-render

      // ✅ AUTO APPLY COUPON FROM BACKEND
      if (orderDetails?.Coupon?.coupon?.code) {
        setAppliedCoupon({
          code: orderDetails.Coupon.coupon.code,
        } as Coupon);

        setCouponInput(orderDetails.Coupon.coupon.code);
      } else {
        setAppliedCoupon(null);
        setCouponInput("");
      }

      return orderDetails;
    } catch (error) {
      console.log("Single order error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCoupons = async (orderData?: OrderDetails | null) => {
    try {
      const order = orderData || singleOrderDetails;
      if (!order) return;

      setCouponLoading(true);

      const subtotal = calculateSubtotal(order.items || []);
      const category = getOrderCategory(order);

      console.log("this is the category and cartAmount--->>>>>", {
        subtotal,
        category,
      });

      const res = await fetchAllValidCoupons(subtotal, category);
      const couponsFromApi: Coupon[] = Array.isArray(res?.data) ? res.data : [];

      const now = new Date();

      const filteredCoupons = couponsFromApi.filter((coupon) => {
        const activeCheck = coupon?.isActive === true;

        const minOrderCheck = subtotal >= Number(coupon?.minOrder || 0);

        const categoryCheck =
          !category ||
          !coupon?.categories?.length ||
          coupon.categories.includes(category);

        const startCheck = coupon?.startDate
          ? new Date(coupon.startDate) <= now
          : true;

        const expiryCheck = coupon?.expiryDate
          ? new Date(coupon.expiryDate) >= now
          : true;

        const limitCheck =
          typeof coupon?.totalLimit === "number"
            ? (coupon.usedCount || 0) + (coupon.reservedCount || 0) <
              coupon.totalLimit
            : true;

        return (
          activeCheck &&
          minOrderCheck &&
          categoryCheck &&
          startCheck &&
          expiryCheck &&
          limitCheck
        );
      });

      const sortedCoupons = filteredCoupons.sort((a, b) => {
        return (
          calculateCouponValue(b, subtotal) - calculateCouponValue(a, subtotal)
        );
      });

      setAvailableCoupons(sortedCoupons);

      setAppliedCoupon((prev) => {
        if (!prev) return null;
        const stillExists = sortedCoupons.find((c) => c.code === prev.code);
        return stillExists || null;
      });
    } catch (error) {
      console.log("this is the error", error);
      setAvailableCoupons([]);
    } finally {
      setCouponLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        const orderData = await getSingleOrderDetails();
        if (orderData && isActive) {
          await fetchAvailableCoupons(orderData);
        }
      };

      loadData();

      // 🔥 CLEANUP WHEN USER LEAVES SCREEN
      return () => {
        isActive = false;

        // ✅ REMOVE COUPON IF APPLIED
        if (appliedCoupon && orderId && !isPaid) {
          try {
            removeCouponApi({ orderId });
          } catch (error) {
            console.log("this is the error==>", error);
          }
        }
      };
    }, [orderId]),
  );

  const handleRazorpayPayNow = async () => {
    try {
      setPaymentLoading(true);
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

      // ✅ CONFIRM COUPON
      if (orderId) {
        await confirmCouponApi({ orderId });
      }

      setIsPaymentDone(true);

      router.replace({
        pathname: "/(customer)/orders/payment-success",
        params: {
          orderId,
          amount: String(singleOrderDetails?.totalAmount),
          paymentId: data.paymentId,
        },
      });
    } catch {
      router.replace({
        pathname: "/(customer)/orders/payment-failure",
        params: {
          orderId,
          amount: String(singleOrderDetails?.totalAmount),
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

  const handleCouponAction = async (
    coupon: Coupon,
    action: "apply" | "remove",
  ) => {
    try {
      if (!orderId) return;

      setCouponLoading(true);

      if (action === "apply") {
        await applyCouponApi({
          orderId,
          code: coupon.code,
          userId: User?.id,
        });
      } else {
        await removeCouponApi({ orderId });
      }

      // ✅ REFRESH ORDER
      const updatedOrder = await getSingleOrderDetails();
      setSingleOrderDetails({ ...updatedOrder });

      setShowCouponSheet(false);
      setCouponError("");
    } catch (err: any) {
      console.log("Coupon error", err);
      setCouponError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = (coupon: Coupon) => {
    if (appliedCoupon?.code === coupon.code) {
      setAppliedCoupon(null);
      setCouponInput("");
      setCouponError("");
      setShowCouponSheet(false);
      return;
    }

    const subtotal = calculateSubtotal(singleOrderDetails?.items || []);
    if (Number(coupon.minOrder || 0) > subtotal) {
      setCouponError(`Minimum order ₹${coupon.minOrder} required`);
      return;
    }

    setAppliedCoupon(coupon);
    setCouponInput(coupon.code);
    setCouponError("");
    setShowCouponSheet(false);
  };

  // const handleManualApply = () => {
  //   const enteredCode = couponInput.trim().toUpperCase();

  //   if (!enteredCode) {
  //     setCouponError("Please enter coupon code");
  //     return;
  //   }

  //   const match = availableCoupons.find(
  //     (coupon) => coupon.code.toUpperCase() === enteredCode,
  //   );

  //   if (!match) {
  //     setCouponError("Invalid coupon code");
  //     return;
  //   }

  //   const subtotal = calculateSubtotal(singleOrderDetails?.items || []);

  //   if (Number(match.minOrder || 0) > subtotal) {
  //     setCouponError(`Minimum order ₹${match.minOrder} required`);
  //     return;
  //   }

  //   setAppliedCoupon(match);
  //   setCouponInput(match.code);
  //   setCouponError("");
  // };

  const handleManualApply = async () => {
    const enteredCode = couponInput.trim().toUpperCase();

    if (!enteredCode) {
      setCouponError("Please enter coupon code");
      return;
    }

    const match = availableCoupons.find(
      (coupon) => coupon.code.toUpperCase() === enteredCode,
    );

    if (!match) {
      setCouponError("Invalid coupon code");
      return;
    }

    await handleCouponAction(match, "apply");
  };

  const calculateCouponValue = (coupon: Coupon, subtotal: number) => {
    if (coupon.type === "flat") {
      return Number(coupon.discount || 0);
    }

    if (coupon.type === "discount") {
      const percentage = Math.min(Number(coupon.discount || 0), 100);
      const calculated = Math.round((subtotal * percentage) / 100);

      const maxCap = Number(coupon.maxCap || 0);

      return maxCap > 0 ? Math.min(calculated, maxCap) : calculated;
    }

    return 0;
  };

  const getCouponDiscount = (coupon: Coupon | null, subtotal: number) => {
    if (!coupon) return 0;

    if (coupon.type === "flat") {
      return Number(coupon.discount || 0);
    }

    if (coupon.type === "discount") {
      const disc = Math.round((subtotal * Number(coupon.discount || 0)) / 100);
      const maxCap = Number(coupon.maxCap || 0);
      return maxCap > 0 ? Math.min(disc, maxCap) : disc;
    }

    return 0;
  };

  const bestCoupon = useMemo(() => {
    return availableCoupons.length ? availableCoupons[0] : null;
  }, [availableCoupons]);

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
  // const couponDiscount = getCouponDiscount(appliedCoupon, subtotal);
  // const totalDiscount = baseDiscount + couponDiscount;
  // const finalTotal = Math.max(0, subtotal - totalDiscount);

  console.log("this is the singleOrderDetails", singleOrderDetails);

  const finalTotal =
    singleOrderDetails?.totalAmount || singleOrderDetails?.price || 0;

  const totalDiscount = singleOrderDetails?.discountAmount || 0;

  const displayOrderId = `#${(orderId ?? singleOrderDetails._id.slice(-6)).toUpperCase()}`;

  const scheduledDate = new Date(
    singleOrderDetails.createdAt,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  console.log("this is the isPaid-->>", isPaid);

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
          <View style={s.header}>
            <TouchableOpacity
              onPress={async () => {
                try {
                  if (appliedCoupon && orderId && !isPaid) {
                    await removeCouponApi({ orderId });
                  }
                } catch (err) {
                  console.log("Back remove error", err);
                } finally {
                  router.back();
                }
              }}
              style={s.backBtn}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={[s.headerTitle, { color: theme.text }]}>Receipt</Text>
            <View style={[s.avatarCircle, { backgroundColor: theme.card }]}>
              <Ionicons name="person-outline" size={16} color={theme.primary} />
            </View>
          </View>

          <View style={s.orderCard}>
            <View style={s.orderTopRow}>
              <View>
                <Text style={s.orderSmallId}>ORDER {displayOrderId}</Text>
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
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={theme.primary}
                  />
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
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={theme.primary}
                  />
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

          {!isPaid && (
            <View style={s.offersHeader}>
              <Text style={s.offersLabel}>AVAILABLE OFFERS</Text>
              <TouchableOpacity
                onPress={async () => {
                  await fetchAvailableCoupons();
                  setShowCouponSheet(true);
                }}
              >
                <Text style={[s.viewAllText, { color: theme.primary }]}>
                  VIEW ALL &rsaquo;
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {!isPaid && (
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
                  setCouponInput(t.toUpperCase());
                  setCouponError("");
                  if (!t.trim()) {
                    setAppliedCoupon(null);
                  }
                }}
                placeholder="Coupon Code"
                placeholderTextColor="#475569"
                style={[s.couponInput, { color: theme.text }]}
                autoCapitalize="characters"
              />
              {appliedCoupon ? (
                <View
                  style={[
                    s.couponAppliedTag,
                    { backgroundColor: "#0B3326", borderColor: "#22EBAB" },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={14}
                    color="#22EBAB"
                  />
                  <Text style={s.couponAppliedText}>APPLIED</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleManualApply}
                  style={[s.couponApplyBtn, { backgroundColor: "#22EBAB" }]}
                >
                  <Text style={s.couponApplyText}>Apply</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {couponError ? (
            <Text style={s.couponError}>{couponError}</Text>
          ) : null}

          {!appliedCoupon && bestCoupon && !isPaid && (
            <View style={[s.suggestionCard, { backgroundColor: theme.card }]}>
              <View style={s.suggestionLeft}>
                <View style={s.suggestionTagRow}>
                  <View style={s.codeTag}>
                    <Text style={s.codeTagText}>{bestCoupon.code}</Text>
                  </View>
                  <View style={s.bestValueTag}>
                    <Text style={s.bestValueText}>BEST VALUE</Text>
                  </View>
                </View>

                <Text style={[s.suggestionDesc, { color: "#94a3b8" }]}>
                  Save ₹{calculateCouponValue(bestCoupon, subtotal)} on this
                  order
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleCouponAction(bestCoupon, "apply")}
                style={[s.suggestionApplyBtn, { backgroundColor: "#22EBAB" }]}
              >
                <Text style={s.suggestionApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          )}

          {appliedCoupon && !isPaid && (
            <View style={[s.appliedPill, { backgroundColor: "#0B3326" }]}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={14}
                color={theme.primary}
              />
              <Text style={[s.appliedPillText, { color: theme.primary }]}>
                "{appliedCoupon.code}" applied!
                {totalDiscount > 0
                  ? ` Save ₹${totalDiscount?.toFixed(0)}`
                  : " Offer applied!"}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  appliedCoupon && handleCouponAction(appliedCoupon, "remove")
                }
              >
                <Ionicons name="close-circle" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={[s.billCard, { backgroundColor: theme.card }]}>
            <View style={s.billRow}>
              <Text style={s.billLabel}>Subtotal</Text>
              <Text style={[s.billValue, { color: theme.text }]}>
                ₹{subtotal.toFixed(0)}
              </Text>
            </View>

            <View style={s.billRow}>
              <Text style={s.billLabel}>Discount</Text>
              <Text style={s.discountValue}>-₹{totalDiscount?.toFixed(0)}</Text>
            </View>

            {totalDiscount > 0 && (
              <View style={s.savingsPill}>
                <Text style={s.savingsPillText}>
                  Woohoo! You saved ₹{totalDiscount?.toFixed(0)}!
                </Text>
              </View>
            )}

            <View style={[s.billDivider, { backgroundColor: theme.border }]} />

            <View style={s.totalRow}>
              <Text style={[s.totalLabel, { color: theme.text }]}>
                Total Amount
              </Text>
              <Text style={[s.totalAmount, { color: theme.primary }]}>
                ₹{finalTotal?.toFixed(0)}
              </Text>
            </View>
          </View>

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

          <View style={{ height: 90 }} />
        </ScrollView>

        <View style={[s.payBtnWrapper, { backgroundColor: theme.background }]}>
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
                Paid ₹{singleOrderDetails.price?.toFixed(0)}
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
                  <Text style={s.payBtnText}>
                    Pay ₹{singleOrderDetails?.totalAmount?.toFixed(0)} Now
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#001714" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <CouponCard
        visible={showCouponSheet}
        onClose={() => setShowCouponSheet(false)}
        onApply={handleCouponAction}
        appliedCode={appliedCoupon?.code ?? ""}
        subtotal={subtotal}
        coupons={availableCoupons}
        loading={couponLoading}
      />

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

  orderCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#0D2B24",
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

  couponAppliedTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },

  couponAppliedText: {
    color: "#22EBAB",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.5,
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

  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 10,
  },

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

  offersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
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
    borderColor: "#000",
  },
  couponInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    paddingVertical: 8,
    borderRadius: 8,
  },
  couponApplyBtn: {
    paddingHorizontal: 30,
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
