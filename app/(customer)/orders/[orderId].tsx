import CouponCard, { Coupon } from "@/components/CouponCard";
import {
  applyCouponApi,
  confirmCouponApi,
  fetchAllValidCoupons,
  removeCouponApi,
} from "@/features/coupons/coupons.api";
import { getOrdersApi, getSingleOrderDetailsApi } from "@/features/orders/orders.api";
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
  unit?: string;
  type?: string;
  category?: string;
}

interface OrderDetails {
  _id: string;
  order_id?: string;
  orderId?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  plantName?: string;
  note?: string;
  customerName?: string;
  riderName?: string;
  totalAmount?: number;
  deliveryCharges?: number;
  taxAmount?: number;
  discountAmount?: number;
  isPaid?: boolean;
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

function toSafeNumber(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toSafeText(value: any, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeOrderDetails(raw: any): OrderDetails | null {
  if (!raw || typeof raw !== "object") return null;

  const normalizedItems: OrderItem[] = Array.isArray(raw.items)
    ? raw.items.map((item: any, index: number) => {
        const typeLabel = toSafeText(item?.type);
        return {
          heading: toSafeText(
            item?.heading ?? item?.label ?? item?.name,
            typeLabel || `Item ${index + 1}`,
          ),
          quantity: Math.max(1, toSafeNumber(item?.quantity, 1)),
          price: toSafeNumber(item?.price, 0),
          unit: toSafeText(item?.unit),
          type: typeLabel,
          category: toSafeText(item?.category),
        };
      })
    : [];

  return {
    _id: toSafeText(raw._id),
    order_id: toSafeText(raw.order_id),
    orderId: toSafeText(raw.orderId),
    createdAt: toSafeText(raw.createdAt, new Date().toISOString()),
    updatedAt: toSafeText(raw.updatedAt),
    status: toSafeText(raw.status, "processing"),
    plantName: toSafeText(raw.plantName, "Green Park"),
    note: toSafeText(raw.note),
    customerName: toSafeText(raw.customerName),
    riderName: toSafeText(raw.riderName),
    totalAmount: toSafeNumber(raw.totalAmount, 0),
    deliveryCharges: toSafeNumber(raw.deliveryCharges, 0),
    taxAmount: toSafeNumber(raw.taxAmount, 0),
    discountAmount: toSafeNumber(raw.discountAmount, 0),
    isPaid: Boolean(raw.isPaid),
    statusHistory: raw.statusHistory,
    address: toSafeText(raw.address, "Address not available"),
    items: normalizedItems,
    price: toSafeNumber(raw.price, 0),
    payment: raw.payment,
  };
}

function getItemUnitLabel(item: OrderItem) {
  const explicit = toSafeText(item.unit);
  if (explicit) return explicit;

  const key = `${item.heading} ${item.type || ""}`.toLowerCase();
  if (key.includes("shoe") || key.includes("boot") || key.includes("sandal")) {
    return "Pair";
  }
  if (key.includes("kg")) return "Kg";
  return "Item";
}

export default function OrderReceipt() {
  const params = useLocalSearchParams();
  const orderId = String(params.orderId || "");
  console.log("this is the orderId from params========>>>>>", orderId);
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
  console.log("Single order details:===>", singleOrderDetails);

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
      const data = await getSingleOrderDetailsApi(orderId);

      let rawOrderDetails =
        data?.order_details ||
        data?.order ||
        (Array.isArray(data?.orders)
          ? data.orders.find(
              (row: any) => row?.order_id === orderId || row?._id === orderId,
            ) || data.orders[0]
          : null);

      if (!rawOrderDetails) {
        try {
          const listRes = await getOrdersApi(phone);
          const rows = Array.isArray(listRes?.orders) ? listRes.orders : [];
          rawOrderDetails =
            rows.find((row: any) => row?.order_id === orderId || row?._id === orderId) ||
            rows[0] ||
            null;
        } catch {
          // fallback handled by null check below
        }
      }

      const orderDetails = normalizeOrderDetails(rawOrderDetails);

      setSingleOrderDetails(orderDetails ? { ...orderDetails } : null);

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
      console.log("razorpayPaymentInitiate response======>>>", res);

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

  const paymentStatus = String(singleOrderDetails?.payment?.status ?? "").toLowerCase();
  const isPaid = Boolean(singleOrderDetails?.isPaid) || paymentStatus === "success";
  const normalizedStatus = String(singleOrderDetails?.status ?? "processing")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  const isReadyForDelivery = ["readyfordelivery", "readytodeliver"].includes(normalizedStatus);
  const isOutForDelivery = ["outfordelivery", "intransit", "deliveryriderassigned"].includes(
    normalizedStatus,
  );
  const isDelivered = normalizedStatus === "delivered";
  const showPayNow = !isPaid && !isDelivered;
  const isProcessing = normalizedStatus === "processing";
  const isInProgressOrder = isProcessing || isReadyForDelivery || isOutForDelivery;
  const isActive = ["processing", "active", "intransit", "readyfordelivery"].includes(
    normalizedStatus,
  );

  const statusLabel = isActive
    ? "Active"
    : normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  const subtotal = calculateSubtotal(singleOrderDetails.items);
  const baseDiscount = subtotal - singleOrderDetails.price;
  // const couponDiscount = getCouponDiscount(appliedCoupon, subtotal);
  // const totalDiscount = baseDiscount + couponDiscount;
  // const finalTotal = Math.max(0, subtotal - totalDiscount);

  console.log("this is the singleOrderDetails", singleOrderDetails);

  const finalTotal =
    singleOrderDetails?.totalAmount || singleOrderDetails?.price || 0;

  const totalDiscount = singleOrderDetails?.discountAmount || 0;

  const displayOrderId = `#${(
    singleOrderDetails.order_id ||
    orderId ||
    singleOrderDetails._id?.slice(-6) ||
    "NA"
  ).toUpperCase()}`;

  const scheduledDate = new Date(
    singleOrderDetails.createdAt,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  console.log("this is the isPaid-->>", isPaid, orderId);

  const inProgressTitle = isOutForDelivery
    ? "Out for Delivery"
    : isReadyForDelivery
      ? "Ready for Delivery"
      : "Processing";

  const deliveredAt = new Date(
    singleOrderDetails?.statusHistory?.delivered || singleOrderDetails.updatedAt || singleOrderDetails.createdAt,
  ).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isInProgressOrder) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.container,
            { backgroundColor: theme.background, paddingBottom: showPayNow ? 140 : 40 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.processingHeader}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={[s.processingTitle, { color: theme.text }]} numberOfLines={1}>
                {singleOrderDetails.plantName || "Green Park"}
              </Text>
              <Text style={s.processingSubTitle} numberOfLines={1}>
                {singleOrderDetails.address}
              </Text>
            </View>

            <View style={[s.avatarCircle, { backgroundColor: theme.card }]}> 
              <Ionicons
                name="notifications-outline"
                size={16}
                color={theme.primary}
              />
            </View>
          </View>

          <View style={s.processingSectionHeader}>
            <Text style={s.processingSectionLabel}>ORDERED ITEMS</Text>
            <Text style={s.processingOrderId}>Order {displayOrderId}</Text>
          </View>

          <View style={s.processingStatusPill}>
            <Text style={s.processingStatusText}>{inProgressTitle}</Text>
          </View>

          {(singleOrderDetails.items || []).map((item, index) => (
            <View
              key={index}
              style={[s.processingItemCard, { backgroundColor: theme.card }]}
            >
              <View style={[s.itemIconBox, { backgroundColor: theme.background }]}> 
                <ItemIcon heading={item.heading} color={theme.primary} />
              </View>

              <View style={s.itemInfo}>
                <Text style={[s.itemName, { color: theme.text }]}>{item.heading}</Text>
                <Text style={s.processingItemSub}>Qty {item.quantity} | ₹{item.price}</Text>
              </View>

              <Text style={[s.itemPrice, { color: theme.text }]}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}

          <View style={s.processingPaidRow}>
            <View style={s.processingPaidLeft}>
              <Ionicons
                name={isPaid ? "checkmark-circle" : "time-outline"}
                size={20}
                color={theme.primary}
              />
              <Text style={[s.processingPaidText, { color: theme.text }]}>
                {isPaid ? "Paid Via UPI" : "Payment Pending"}
              </Text>
            </View>
            <Text style={s.processingReceiptText}>Download Receipt</Text>
          </View>

          <View style={[s.billCard, { backgroundColor: theme.card, marginTop: 8 }]}> 
            <View style={s.billRow}>
              <Text style={[s.totalLabel, { color: theme.text }]}>Bill Details</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.primary} />
            </View>

            <View style={[s.billDivider, { backgroundColor: theme.border }]} />

            <View style={s.totalRow}>
              <Text style={[s.totalLabel, { color: theme.text }]}>Total Bill</Text>
              <Text style={[s.totalAmount, { color: theme.primary }]}>₹{finalTotal?.toFixed(0)}</Text>
            </View>
          </View>

          <View style={s.processingCheckRow}>
            <Ionicons name="checkbox" size={18} color={theme.primary} />
            <Text style={s.processingCheckText}>Delivery Location Same As Pickup Location</Text>
          </View>

          <Text style={[s.offersLabel, { paddingHorizontal: 20, marginTop: 4 }]}>SPECIAL INSTRUCTIONS</Text>
          <TextInput
            value={singleOrderDetails.note || ""}
            placeholder="Any specific requirements for your wash?"
            placeholderTextColor="#4E665F"
            multiline
            editable={false}
            textAlignVertical="top"
            style={[s.processingSpecialInput, { color: theme.text }]}
          />

          <View style={s.processingTagsRow}>
            <View style={s.processingTag}><Text style={s.processingTagText}># Fragile</Text></View>
            <View style={s.processingTag}><Text style={s.processingTagText}># Eco-Wash</Text></View>
            <View style={s.processingTag}><Text style={s.processingTagText}># Hypoallergenic</Text></View>
          </View>

          <TouchableOpacity style={s.processingActionCard} activeOpacity={0.85}>
            <View style={s.processingActionLeft}>
              <Ionicons name="time-outline" size={18} color={theme.primary} />
              <View>
                <Text style={s.processingActionTitle}>Choose Delivery Slot</Text>
                <Text style={s.processingActionSub}>Pick a convenient time for drop-off</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7F948A" />
          </TouchableOpacity>

          <TouchableOpacity style={s.processingActionCard} activeOpacity={0.85}>
            <View style={s.processingActionLeft}>
              <Ionicons name="pause-circle-outline" size={18} color={theme.primary} />
              <View>
                <Text style={s.processingActionTitle}>Hold Delivery for Today</Text>
                <Text style={s.processingActionSub}>Keep clothes at hub until further notice</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#7F948A" />
          </TouchableOpacity>
       </ScrollView>

{showPayNow && (
  <View style={[s.payBtnWrapper, { backgroundColor: theme.background }]}>
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
  </View>
)}

  <Modal visible={showPaymentWebView} animationType="slide">
        {razorpayData && (
          <RazorpayWebView
            amount={razorpayData.amount}
            orderId={razorpayData.razorpayOrderId}
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

</KeyboardAvoidingView>
    );
  }

  if (isDelivered) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            s.container,
            { backgroundColor: theme.background, paddingBottom: 120 },
          ]}
        >
          <View style={s.processingHeader}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={[s.processingTitle, { color: theme.text }]} numberOfLines={1}>
                {singleOrderDetails.plantName || "Green Park"}
              </Text>
              <Text style={s.processingSubTitle} numberOfLines={1}>
                {singleOrderDetails.address}
              </Text>
            </View>

            <View style={[s.avatarCircle, { backgroundColor: theme.card }]}> 
              <Ionicons
                name="notifications-outline"
                size={16}
                color={theme.primary}
              />
            </View>
          </View>

          <View style={s.deliveredBanner}>
            <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[s.deliveredBannerTitle, { color: theme.text }]}>Order was delivered at {deliveredAt}</Text>
              <Text style={s.deliveredBannerSub}>Successfully picked up & delivered</Text>
            </View>
          </View>

          <Text style={[s.sectionHeading, { color: theme.text, marginTop: 6 }]}>Items</Text>

          {(singleOrderDetails.items || []).map((item, index) => (
            <View
              key={index}
              style={[s.processingItemCard, { backgroundColor: theme.card }]}
            >
              <View style={[s.itemIconBox, { backgroundColor: theme.background }]}> 
                <ItemIcon heading={item.heading} color={theme.primary} />
              </View>

              <View style={s.itemInfo}>
                <Text style={[s.itemName, { color: theme.text }]}>{item.heading}</Text>
                <Text style={s.processingItemSub}>Qty {item.quantity} | ₹{item.price}</Text>
              </View>

              <Text style={[s.itemPrice, { color: theme.text }]}>₹{(item.price * item.quantity).toFixed(0)}</Text>
            </View>
          ))}

          <View style={s.deliveredRatingCard}>
            <Ionicons name="star" size={16} color={theme.primary} />
            <Text style={[s.deliveredRatingText, { color: theme.text }]}>How Were Your Ordered Items?</Text>
            <TouchableOpacity style={s.deliveredRateBtn}>
              <Text style={s.deliveredRateBtnText}>Rate Now</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.billCard, { backgroundColor: theme.card, marginTop: 8 }]}> 
            <Text style={[s.totalLabel, { color: theme.text, marginBottom: 10 }]}>Bill Details</Text>
            <View style={s.billRow}>
              <Text style={s.billLabel}>Subtotal</Text>
              <Text style={[s.billValue, { color: theme.text }]}>₹{subtotal.toFixed(0)}</Text>
            </View>
            <View style={s.billRow}>
              <Text style={s.billLabel}>Delivery Handling</Text>
              <Text style={[s.billValue, { color: theme.text }]}>₹{Number(singleOrderDetails.deliveryCharges || 0).toFixed(0)}</Text>
            </View>
            <View style={s.billRow}>
              <Text style={s.billLabel}>Service Charge</Text>
              <Text style={[s.billValue, { color: theme.text }]}>₹{Number(singleOrderDetails.taxAmount || 0).toFixed(0)}</Text>
            </View>
            <View style={s.billRow}>
              <Text style={s.billLabel}>Item Discount</Text>
              <Text style={[s.billValue, { color: theme.primary }]}>-₹{Number(singleOrderDetails.discountAmount || 0).toFixed(0)}</Text>
            </View>
            <View style={[s.billDivider, { backgroundColor: theme.border }]} />
            <View style={s.totalRow}>
              <Text style={[s.totalLabel, { color: theme.text }]}>Total Bill</Text>
              <Text style={[s.totalAmount, { color: theme.primary }]}>₹{finalTotal?.toFixed(0)}</Text>
            </View>
          </View>

          <View style={s.deliveredOrderDetailsCard}>
            <View style={s.deliveredOrderTop}>
              <Text style={s.processingSectionLabel}>ORDER DETAILS</Text>
              <Text style={s.processingReceiptText}>Download Receipt</Text>
            </View>

            <View style={s.deliveredOrderGrid}>
              <View style={s.deliveredOrderCell}>
                <Text style={s.deliveredLabel}>ORDER ID</Text>
                <Text style={s.deliveredValue}>{displayOrderId.replace("#", "")}</Text>
              </View>
              <View style={s.deliveredOrderCell}>
                <Text style={s.deliveredLabel}>PAYMENT</Text>
                <Text style={s.deliveredValue}>{isPaid ? "Paid via UPI" : "Payment Pending"}</Text>
              </View>
              <View style={s.deliveredOrderCell}>
                <Text style={s.deliveredLabel}>DELIVERED TO</Text>
                <Text style={s.deliveredValue}>{singleOrderDetails.customerName || name}</Text>
              </View>
              <View style={s.deliveredOrderCell}>
                <Text style={s.deliveredLabel}>DELIVERED BY</Text>
                <Text style={s.deliveredValue}>{singleOrderDetails.riderName || "Rider"}</Text>
              </View>
            </View>

            <View style={{ marginTop: 8 }}>
              <Text style={s.deliveredLabel}>DELIVERY ADDRESS</Text>
              <Text style={s.deliveredValue}>{singleOrderDetails.address}</Text>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={s.deliveredLabel}>ORDER PLACED DATE & TIME</Text>
              <Text style={s.deliveredValue}>{scheduledDate}</Text>
            </View>
          </View>

          <Text style={s.deliveredHelpLabel}>NEED HELP ?</Text>
        </ScrollView>

        <View style={s.deliveredBottomCtaWrap}>
          <TouchableOpacity activeOpacity={0.9} style={s.deliveredBottomCtaBtn}>
            <Text style={s.deliveredBottomCtaTitle}>Repeat Order</Text>
            <Text style={s.deliveredBottomCtaSub}>View Cart On Next Step</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

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
                    {scheduledDate}
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
                  Qty {item.quantity} • {getItemUnitLabel(item)}
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

         <View style={{ height: showPayNow ? 100 : 40 }} />
        </ScrollView>

        {/* {showPayNow && (
  <View style={[s.payBtnWrapper, { backgroundColor: theme.background }]}>
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
  </View>
)} */}
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

  processingHeader: {
    paddingTop: 54,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  processingTitle: {
    fontSize: 30 / 1.8,
    fontWeight: "800",
  },
  processingSubTitle: {
    color: "#7F948A",
    fontSize: 12,
    marginTop: 2,
  },
  processingSectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  processingSectionLabel: {
    fontSize: 11,
    color: "#7F948A",
    fontWeight: "700",
    letterSpacing: 1,
  },
  processingOrderId: {
    fontSize: 14,
    color: "#9BB0A7",
    fontWeight: "600",
  },
  processingStatusPill: {
    marginHorizontal: 20,
    marginBottom: 10,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34, 235, 171, 0.3)",
    backgroundColor: "#0B3326",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  processingStatusText: {
    color: "#9FFFD3",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  processingItemCard: {
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  processingItemSub: {
    fontSize: 14,
    color: "#22EBAB",
    marginTop: 2,
    fontWeight: "700",
  },
  processingPaidRow: {
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  processingPaidLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  processingPaidText: {
    fontSize: 28 / 2,
    fontWeight: "800",
  },
  processingReceiptText: {
    color: "#9BB0A7",
    fontSize: 13,
    fontWeight: "600",
  },
  processingCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 10,
  },
  processingCheckText: {
    color: "#BCD7CE",
    fontSize: 13,
    fontWeight: "600",
  },
  processingSpecialInput: {
    marginHorizontal: 20,
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E3A34",
    backgroundColor: "#061612",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    marginBottom: 12,
  },
  processingTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  processingTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#21453D",
    backgroundColor: "#123329",
  },
  processingTagText: {
    color: "#B4D5C9",
    fontSize: 12,
    fontWeight: "700",
  },
  processingActionCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#21453D",
    backgroundColor: "#0A251F",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  processingActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  processingActionTitle: {
    color: "#D9F1E9",
    fontSize: 15,
    fontWeight: "700",
  },
  processingActionSub: {
    color: "#8AA39B",
    fontSize: 12,
    marginTop: 2,
  },

  deliveredBanner: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(34,235,171,0.15)",
    backgroundColor: "#0A251F",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deliveredBannerTitle: {
    fontSize: 16 / 1.1,
    fontWeight: "800",
  },
  deliveredBannerSub: {
    color: "#8AA39B",
    fontSize: 12,
    marginTop: 2,
  },
  deliveredRatingCard: {
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(34,235,171,0.12)",
    backgroundColor: "#0A251F",
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deliveredRatingText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
  },
  deliveredRateBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(34,235,171,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  deliveredRateBtnText: {
    color: "#9FFFD3",
    fontSize: 12,
    fontWeight: "700",
  },
  deliveredOrderDetailsCard: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0B3326",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  deliveredOrderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  deliveredOrderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  deliveredOrderCell: {
    width: "50%",
    marginBottom: 10,
    paddingRight: 8,
  },
  deliveredLabel: {
    color: "#8AA39B",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  deliveredValue: {
    color: "#E8F4EF",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  deliveredHelpLabel: {
    paddingHorizontal: 20,
    color: "#8AA39B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  deliveredBottomCtaWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    backgroundColor: "rgba(0,23,20,0.96)",
    borderTopWidth: 1,
    borderTopColor: "#1E3A34",
  },
  deliveredBottomCtaBtn: {
    backgroundColor: "#22EBAB",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  deliveredBottomCtaTitle: {
    color: "#001714",
    fontSize: 16,
    fontWeight: "900",
  },
  deliveredBottomCtaSub: {
    color: "#0B4D3C",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
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
