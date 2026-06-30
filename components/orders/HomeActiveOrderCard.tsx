import { useTheme } from "@/context/ThemeContext";
import RazorpayWebView from "@/app/(customer)/orders/RazorpayWebView";
import OrderStatusBadge from "@/components/orders/OrderStatusBadge";
import { confirmCouponApi } from "@/features/coupons/coupons.api";
import {
  razorpayPaymentInitiate,
  verifyRazorpayPayment,
} from "@/features/payment/payment.api";
import { removeDeliveredOrderApi } from "@/features/orders/orders.api";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type HomeOrder = {
  _id?: string;
  order_id?: string;
  status?: string;
  isPaid?: boolean;
  totalAmount?: number;
  price?: number;
  customerName?: string;
  address?: string;
  riderName?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: Array<unknown>;
};

type HomeActiveOrderCardProps = {
  order: HomeOrder;
  onPress?: () => void;
  onClose?: () => void;
  onRefresh?: () => void;
};

// Theme values must be derived inside the component (no module-scope `theme`).


const normalize = (status?: string) =>
  String(status ?? "").trim().toLowerCase();
const normalizeKey = (status?: string) =>
  normalize(status).replace(/[^a-z]/g, "");

const formatCardTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const statusMeta = (theme: any, status?: string, isPaid?: boolean) => {
  const s = normalizeKey(status);

  if (s === "delivered") {
    return {
      label: "Order Completed",
      accent: theme.primary,
      icon: "checkmark-done-outline" as const,
      title: "Delivered Successfully",
      subtitle: "Your order has been successfully delivered to your doorstep.",
      actionText: "Write a Review",
      showClose: true,
    };
  }

  if (s === "cancelled" || s === "canceled" || s === "deleted") {
    return {
      label: "Order Cancelled",
      accent: "#FF6B6B",
      icon: "close-circle-outline" as const,
      title: "This order was cancelled",
      subtitle: "You can book a new pickup anytime.",
      actionText: "Book Again",
      showClose: false,
    };
  }

  if (s === "intransit") {
    return {
      label: "In Transit",
      accent: theme.primary,
      icon: "bicycle-outline" as const,
      title: "Your pickup has been completed",
      subtitle: "Your items are on the way to our facility.",
      actionText: "Pay Now",
      showClose: false,
    };
  }

  if (
    s === "readyfordelivery" ||
    s === "deliveryriderassigned" ||
    s === "outfordelivery"
  ) {
    return {
      label: "Out For Delivery",
      accent: theme.primary,
      icon: "bicycle-outline" as const,
      title: "Your order is on the way",
      subtitle: isPaid ? "Sit back and relax, your order will reach you shortly." : "Complete payment to continue delivery.",
      actionText: "Pay Now",
      showClose: false,
    };
  }

  return {
    label: "Active Order",
    accent: theme.primary,
    icon: "time-outline" as const,
    title: "Processing your order",
    subtitle: isPaid ? "Your items are being processed." : "Pay now to choose delivery slot.",
    actionText: "Pay Now",
    showClose: false,
  };
};

export default function HomeActiveOrderCard({
  order,
  onPress,
  onClose,
  onRefresh,
}: HomeActiveOrderCardProps) {
  const { theme, isDark } = useTheme()
  const styles = makeStyles(theme, isDark);
  
  const { user } = useAuth();

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [razorpayData, setRazorpayData] = useState<any>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const meta = statusMeta(theme, order.status, order.isPaid);
  const amount = order.totalAmount ?? order.price ?? 0;
  const itemCount = Array.isArray(order.items) ? order.items.length : 0;
  const statusKey = normalizeKey(order.status);
  const isDelivered = statusKey === "delivered";
  const isCancelled =
    statusKey === "cancelled" || statusKey === "canceled" || statusKey === "deleted";
  const isInTransit = statusKey === "intransit";
  const isOutForDelivery =
    statusKey === "deliveryriderassigned" ||
    statusKey === "deliverriderassigned" ||
    statusKey === "outfordelivery" ||
    statusKey === "readyfordelivery";
  const riderName = String(order.riderName ?? "").trim() || "Rider";
  const pickupRiderName = order.assignedRider.pickup.riderName;
  const cardTime = formatCardTime(order.updatedAt || order.createdAt);
  const orderCode = order.order_id ? `Order #${order.order_id}` : "Order";

  const handleArchiveOrder = useCallback(async () => {
    if (!order._id || !isDelivered) return;

    try {
      setArchiveLoading(true);
      const res = await removeDeliveredOrderApi(order._id);
      if (res.success) {
        // Silent success - card auto-dismisses via onRefresh/onClose
        onRefresh?.();
        onClose?.();
      } else {
        console.error("Archive failed:", res.message);
      }
    } catch (error) {
      console.error("Archive error:", error);
    } finally {
      setArchiveLoading(false);
    }
  }, [order._id, isDelivered, onRefresh, onClose]);

  const handleClosePress = useCallback(async () => {
    if (isDelivered && order._id) {
      await handleArchiveOrder();
    } else {
      onClose?.();
    }
  }, [isDelivered, order._id, handleArchiveOrder, onClose]);

  const User: any = user?.user ? user?.user : user;
  const email = User?.email ?? "test@example.com";
  const phone = User?.phone ?? User?.mobile ?? "9999999999";
  const name = User?.name ?? User?.fullName ?? "Test User";

  const orderId = order.order_id || order._id || "";

  const handleRazorpayPayNow = async () => {
    if (!orderId) return;
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

  const handlePaymentSuccess = async (data: {
    paymentId: string;
    orderId: string;
    signature: string;
  }) => {
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

      if (orderId) {
        await confirmCouponApi({ orderId });
      }

      router.replace({
        pathname: "/(customer)/orders/payment-success",
        params: {
          orderId,
          amount: String(order?.totalAmount ?? order?.price ?? 0),
          paymentId: data.paymentId,
        },
      });
    } catch {
      router.replace({
        pathname: "/(customer)/orders/payment-failure",
        params: {
          orderId,
          amount: String(order?.price ?? 0),
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
        amount: String(order?.price ?? 0),
        reason,
      },
    });
  };

  const handlePaymentCancel = () => {
    setShowPaymentWebView(false);
    setPaymentLoading(false);
  };

  return (
    <>
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <View style={styles.card}>
          <View style={[{ backgroundColor: meta.accent }]} />
          {meta.showClose && !archiveLoading ? (
            <TouchableOpacity
              onPress={handleClosePress}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeFloatingBtn}
            >
              {archiveLoading ? (
                <ActivityIndicator size="small" color={theme.textSecondary} />
              ) : (
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          ) : null}
          <View style={styles.inner}>
            <View style={styles.headerRow}>
              <OrderStatusBadge
                label={meta.label}
                accent={meta.accent}
                icon={meta.icon}
              />
              {/* 1. HEADER ROW — replace rightHeaderRow content */}
              <View style={styles.rightHeaderRow}>
                {!isCancelled ? (
                  <OrderStatusBadge
                    label={order.isPaid ? "Paid" : "Payment Pending"}
                    accent={order.isPaid ? theme.primary : "#FFD600"}
                    icon={order.isPaid ? "checkmark-circle-outline" : "wallet-outline"}
                  />
                ) : null}

                {isDelivered ? (
                  <TouchableOpacity
                    onPress={handleClosePress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {/* {archiveLoading ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Text style={styles.dismissText}>DISMISS</Text>
                    )} */}
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.chatBtnHeader}
                    onPress={() => router.push("/(customer)/(assistant)/chat")}
                  >
                    <Ionicons name="chatbubble-ellipses" size={22} color={theme.background} />
                  </TouchableOpacity>
                )}
              </View>

            </View>


            {meta.subtitle && !isOutForDelivery && !isInTransit && !isDelivered ? (
              <View style={styles.subtitleAboveRow}>
                <Ionicons name="flash" size={12} color={theme.primary} />
                <Text style={styles.subtitleAbove}>
                  {meta.subtitle.toUpperCase()}
                </Text>
              </View>
            ) : null}

         { !isOutForDelivery && !isInTransit ? (
          <Text style={styles.title}>{meta.title}</Text>
         ): null}
            

            {meta.subtitle && isDelivered ? (
              <Text style={styles.subtitle}>{meta.subtitle}</Text>
            ) : null}

            {/* 3. RIDER ROW — replace existing riderRow block */}
            {isOutForDelivery ? (
              <>
                <View style={styles.riderRow}>
                  <Ionicons name="bicycle-outline" size={28} color={theme.primary} />
                  <Text style={styles.riderText}>
                    <Text style={styles.riderName}>{riderName}</Text>
                    {" on  the way with\nyour delivery"}
                  </Text>
                </View>
              </>
            ) : isInTransit ? (
              <>
                {/* <Text style={styles.title}>{meta.title}</Text> */}
                <View style={[styles.riderRow, { marginTop: 6 }]}>
                  <Ionicons name="checkmark-circle-outline" size={26} color={theme.primary} />
                  <Text style={styles.riderText}>
                    <Text style={styles.riderName}>{pickupRiderName}</Text>
                    {" has successfully picked up your items."}
                  </Text>
                </View>
              </>
            ) : null}

            <View style={styles.midRow}>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>
                  {isDelivered ? `Total items delivered: ${itemCount}` : `Total Items: ${itemCount}`}
                </Text>
              </View>
              {(isOutForDelivery || isDelivered) && cardTime ? (
                <Text style={styles.deliveryMetaText}>
                  {orderCode} • {cardTime}
                </Text>
              ) : null}
            </View>

            {/* 5. FOOTER ROW — replace entire footerRow block */}
           <View style={styles.footerRow}>
              {isDelivered ? (
                <>
                  <View style={styles.reviewWrap}>
                    <View style={styles.reviewRow}>
                      <Ionicons name="star" size={22} color={theme.primary} />
                      <Ionicons name="star" size={22} color={theme.primary} />
                      <Ionicons name="star" size={22} color={theme.primary} />
                      <Ionicons name="star" size={22} color={theme.primary} />
                      <Ionicons name="star-outline" size={22} color={theme.primary} />
                    </View>
                    <Text style={styles.reviewCta}>{meta.actionText}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.chatBtn}
                    onPress={() => router.push("/(customer)/(assistant)/chat")}
                  >
                    <Ionicons name="chatbubble-ellipses" size={20} color={theme.background} />
                  </TouchableOpacity>
                </>
              ) : !order.isPaid ? (
                <TouchableOpacity
                  onPress={onPress}
                  disabled={paymentLoading}
                  activeOpacity={0.85}
                  style={[styles.primaryCta, { opacity: paymentLoading ? 0.7 : 1 }]}
                >
                  {paymentLoading ? (
                    <ActivityIndicator size="small" color={theme.background} />
                  ) : (
                    <>
                      <Text style={styles.primaryCtaText}>{meta.actionText}</Text>
                      <Ionicons name="arrow-forward" size={16} color={theme.background} />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={styles.successText}>
                  Payment successful. Sit back and relax.
                </Text>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <Modal visible={showPaymentWebView} animationType="slide">
        {razorpayData && (
          <RazorpayWebView
            amount={razorpayData.amount}
            orderId={orderId}
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

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  card: {
    backgroundColor: theme.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.card,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  closeFloatingBtn: {
    position: "absolute",
    top: 0,
    right: 1,
    width: 34,
    height: 34,
   // borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  //  backgroundColor: theme.card,
  //  borderWidth: 1,
  //  borderColor: theme.card,
    zIndex: 5,
    elevation: 6,
  },

  inner: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 2,
  },
  rightHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 20,
    flexShrink: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
  //  borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  orderId: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "600",
  },

  subtitle: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: -2,
  },
  riderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -2,
  },

  deliveryMetaText: {
    color: "#95B6AD",
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },

  itemAvatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  circleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
  },
  countPill: {
    minHeight: 22,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.card,
  },
  countPillText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.3,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: theme.card,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.background,
  },
  pillText: {
    color: "#A7B8B2",
    fontSize: 11,
    fontWeight: "700",
  },


  primaryCtaText: {
    color: theme.background,
    fontWeight: "900",
    fontSize: 16,
  },
  successText: {
    color: "#9EE8D1",
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  chatBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  reviewWrap: {
    flex: 1,
    gap: 12,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reviewCta: {
    color: "#9EE8D1",
    fontSize: 16,
    fontWeight: "800",
  },

  // ADD these new styles:
  dismissText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  chatBtnHeader: {
  
    color: "#fff ",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitleAboveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  subtitleAbove: {
    color: theme.primary,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  riderName: {
    fontWeight: "600",
    color: theme.text,
    fontSize: 13,
    textTransform: "uppercase"
  },

  // CHANGE these existing styles:
  riderText: {
    color: theme.textSecondary,
    fontSize: 14,        // was 16
    lineHeight: 16,      // was 20
    flex: 1,
  },
  title: {
    color: theme.text,
    fontSize: 20,        // was 20
    lineHeight: 32,      // was 36
    fontWeight: "600",
    letterSpacing: -0.5,
    textTransform: "uppercase"
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: theme.primary,
    alignSelf: "flex-start",
  },
  midRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",  // was gap: 8
    gap: 8,
    marginTop: 1,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 2,

  },
});
