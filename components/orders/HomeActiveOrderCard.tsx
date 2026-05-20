import { DarkTheme } from "@/app/(customer)/order-tracking";
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

const ACCENT = "#29E6B0";
const BORDER = "#1A3330";
const SURFACE = "#0D1F1C";
const MUTED = "#6B7280";

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

const statusMeta = (status?: string) => {
  const s = normalizeKey(status);

  if (s === "delivered") {
    return {
      label: "Order Completed",
      accent: ACCENT,
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
      accent: "#EF4444",
      icon: "close-circle-outline" as const,
      title: "This order was cancelled",
      subtitle: "You can book a new pickup anytime.",
      actionText: "Book Again",
      showClose: false,
    };
  }

  if (
    s === "intransit" ||
    s === "readyfordelivery" ||
    s === "deliveryriderassigned" ||
    s === "outfordelivery"
  ) {
    return {
      label: "Out For Delivery",
      accent: ACCENT,
      icon: "bicycle-outline" as const,
      title: "Your order is on the way",
      subtitle: "Complete payment to continue delivery.",
      actionText: "Pay Now",
      showClose: false,
    };
  }

  return {
    label: "Active Order",
    accent: ACCENT,
    icon: "time-outline" as const,
    title: "Processing your order",
    subtitle: "Pay now to choose delivery slot.",
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
  const { user } = useAuth();

  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [razorpayData, setRazorpayData] = useState<any>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const meta = statusMeta(order.status);
  const amount = order.totalAmount ?? order.price ?? 0;
  const itemCount = Array.isArray(order.items) ? order.items.length : 0;
  const statusKey = normalizeKey(order.status);
  const isDelivered = statusKey === "delivered";
  const isCancelled =
    statusKey === "cancelled" || statusKey === "canceled" || statusKey === "deleted";
  const isOutForDelivery =
    statusKey === "deliveryriderassigned" ||
    statusKey === "deliverriderassigned" ||
    statusKey === "outfordelivery" ||
    statusKey === "readyfordelivery";
  const riderName = String(order.riderName ?? "").trim() || "Your rider";
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
                <ActivityIndicator size="small" color="#88A79D" />
              ) : (
                <Ionicons name="close" size={22} color="#88A79D" />
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
              <View style={styles.rightHeaderRow}>
                {!isCancelled ? (
                  <OrderStatusBadge
                    label={order.isPaid ? "Paid" : "Payment Pending"}
                    accent={order.isPaid ? ACCENT : "#F59E0B"}
                    icon={
                      order.isPaid
                        ? "checkmark-circle-outline"
                        : "wallet-outline"
                    }
                  />
                ) : null}
                {meta.showClose && !archiveLoading ? (
                  <TouchableOpacity
                    onPress={handleClosePress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.closeBtn}
                  >
                    {archiveLoading ? (
                      <ActivityIndicator size="small" color="#31423D" />
                    ) : (
                      <Ionicons name="close" size={18} color="#31423D" />
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <Text style={styles.title}>{meta.title}</Text>
            {meta.subtitle ? (
              <Text style={styles.subtitle}>{meta.subtitle}</Text>
            ) : null}

            {isOutForDelivery ? (
              <>
                <View style={styles.riderRow}>
                  <Ionicons
                    name="person-circle-outline"
                    size={20}
                    color="#7DA79D"
                  />
                  <Text style={styles.riderText}>
                    <Text style={{ fontWeight: "600", color: "#E9F8F3" }}>
                      {riderName}
                    </Text>{" "}
                    is on the way to deliver.
                  </Text>
                </View>
                <Text style={styles.deliveryMetaText}>
                  {orderCode}
                  {cardTime ? ` • ${cardTime}` : ""}
                </Text>
              </>
            ) : null}

            <View style={styles.midRow}>
              <View style={styles.itemAvatarGroup}>
                <View style={styles.circleIcon}>
                  <Ionicons name="shirt-outline" size={18} color="#9EE8D1" />
                </View>
                <View style={[styles.circleIcon, { marginLeft: -10 }]}>
                  <Ionicons
                    name="pricetag-outline"
                    size={18}
                    color="#9EE8D1"
                  />
                </View>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>
                  {itemCount} Items{" "}
                  {isDelivered
                    ? "Delivered"
                    : statusKey === "processing"
                      ? "Processing"
                      : "In Your Cart"}
                </Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              {isDelivered ? (
                <View style={styles.reviewWrap}>
                  <View style={styles.reviewRow}>
                    <Ionicons name="star" size={18} color={ACCENT} />
                    <Ionicons name="star" size={18} color={ACCENT} />
                    <Ionicons name="star" size={18} color={ACCENT} />
                    <Ionicons name="star" size={18} color={ACCENT} />
                    <Ionicons name="star" size={18} color="#31423D" />
                  </View>
                  <Text style={styles.reviewCta}>{meta.actionText}</Text>
                </View>
              ) : !order.isPaid || isOutForDelivery ? (
                <TouchableOpacity
                  // onPress={handleRazorpayPayNow}
                  onPress={onPress}
                  disabled={paymentLoading}
                  activeOpacity={0.85}
                  style={[
                    styles.primaryCta,
                    { opacity: paymentLoading ? 0.7 : 1 },
                  ]}
                >
                  {paymentLoading ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <Text style={styles.primaryCtaText}>
                        {meta.actionText}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#000" />
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <Text style={styles.successText}>
                  Payment successful. Sit back and relax.
                </Text>
              )}
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() =>
                  router.push("/(customer)/(assistant)/chat")
                }
              >
                <View style={styles.chatBtn}>
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={25}
                    color={DarkTheme.card}
                  />
                </View>
              </TouchableOpacity>
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
            themeColor={ACCENT}
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
  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    position: "relative",
  },
  closeFloatingBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 35, 30, 0.9)",
    borderWidth: 1,
    borderColor: "#24463F",
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
    gap: 10,
  },
  rightHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    flexShrink: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  orderId: {
    color: "#D1D5DB",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#7DA79D",
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
  riderText: {
    color: "#7DA79D",
    fontSize: 16,
    lineHeight: 20,
    flex: 1,
  },
  deliveryMetaText: {
    color: "#95B6AD",
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  midRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 1,
  },
  itemAvatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  circleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#16332E",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  countPill: {
    minHeight: 28,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#37655B",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(10, 35, 30, 0.7)",
  },
  countPillText: {
    color: "#9EE8D1",
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: 0.3,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#071A17",
  },
  pillText: {
    color: "#A7B8B2",
    fontSize: 11,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
  primaryCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: ACCENT,
  },
  primaryCtaText: {
    color: "#000",
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
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: ACCENT,
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
});

