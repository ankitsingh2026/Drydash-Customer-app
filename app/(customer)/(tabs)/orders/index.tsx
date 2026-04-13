import PaymentStamp from "@/components/PaymentStamp";
import { getOrdersApi } from "@/features/orders/orders.api";
import { getCustomerPickups } from "@/features/pickups/pickup.api";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OrdersScreenSkeleton } from "../../../../components/SkeletonLoader";

/* ================= TYPES ================= */

type OrderStatus = "Active" | "Completed";
type FilterType = "All" | "Active" | "Completed" | "Awaiting";

const getOrderId = (o: any): string | undefined => o?.order_id;

const STATUS_CONFIG = {
  active: { bg: "#10B981", icon: "time-outline" as const, label: "Active" },
  delivered: {
    bg: "#3B82F6",
    icon: "checkmark-done-outline" as const,
    label: "Delivered",
  },
  cancelled: {
    bg: "#EF4444",
    icon: "close-circle-outline" as const,
    label: "Cancelled",
  },
};

const getStatusConfig = (status: string) =>
  STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? {
    bg: "#0EA5A4",
    icon: "navigate-outline" as const,
    label: status === "processing" ? "Active" : "Completed",
  };

const mapFilterStatus = (status: string): OrderStatus => {
  if (status === "delivered") return "Completed";
  if (status === "cancelled") return "Completed";
  return "Active";
};
/* ─── Accent palette — matches Home.tsx exactly ─── */
const ACCENT = "#00C896";
const SURFACE = "#0D1F1C";
const BG = "#001714";
const BORDER = "#1A3330";
const MUTED = "#6B7280";

/* ================= FILTER TAB ================= */

/* ================= STAGE PROGRESS BAR ================= */

function StageProgress({ stage }: { stage?: string }) {
  const stages = ["WASHING", "DRYING & FOLDING", "READY", "OUT FOR DELIVERY"];
  const current = stages.findIndex((s) =>
    (stage ?? "").toUpperCase().includes(s.split(" ")[0]),
  );
  const idx = current === -1 ? 0 : current;
  const pct = ((idx + 1) / stages.length) * 100;
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={{ marginTop: 5 }}>
      <View style={progressStyles.track}>
        <Animated.View
          style={[
            progressStyles.fill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
        {/* glow dot */}
        <Animated.View
          style={[
            progressStyles.dot,
            {
              left: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "97%"],
              }),
            },
          ]}
        />
      </View>
      <Text style={progressStyles.label}>
        STAGE: {(stage ?? "PROCESSING").toUpperCase()}
      </Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  track: {
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 4,
    overflow: "visible",
    position: "relative",
  },
  fill: {
    height: 4,
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  dot: {
    position: "absolute",
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: ACCENT,
    borderWidth: 2,
    borderColor: SURFACE,
    shadowColor: ACCENT,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 1,
    color: MUTED,
    fontWeight: "700",
  },
});

/* ================= STATUS BADGE ================= */

function StatusBadge({
  label,
  color,
  icon,
}: {
  label: string;
  color: string;
  icon: any;
}) {
  return (
    <View
      style={[
        badgeStyles.wrap,
        { backgroundColor: color + "1A", borderColor: color + "30" },
      ]}
    >
      <Ionicons name={icon} size={11} color={color} />
      <Text style={[badgeStyles.text, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
});

/* ================= MAIN COMPONENT ================= */

export default function Orders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [pickups, setPickups] = useState<any[]>([]);

  const cardAnims = useRef<Animated.Value[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const rawPhone = user?.user?.phone ?? user?.phone ?? "";
  const phoneWithout91 = rawPhone.startsWith("91")
    ? rawPhone.slice(2)
    : rawPhone;
  const phoneWith91 = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;

  /* ================= HELPERS ================= */

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // const formatOrderDateTime = (dateString: string) =>
  //   `${formatDate(dateString)} • ${formatTime(dateString)}`;

  /* ================= FILTERED ORDERS ================= */

  const filteredOrders = useMemo(() => {
    if (activeFilter === "Awaiting") return [];

    if (activeFilter === "All") {
      return orders.map((o) => ({ ...o, type: "order" }));
    }
    return orders
      .filter((o) => mapFilterStatus(o.status) === activeFilter)
      .map((o) => ({ ...o, type: "order" }));
  }, [orders, pickups, activeFilter]);

  /* ================= API ================= */

  const getCustomerOrders = async () => {
    try {
      setLoading(true);
      let res = await getOrdersApi(phoneWithout91);
      if (!res?.orders?.length) {
        res = await getOrdersApi(phoneWith91);
      }
      setOrders(res?.orders || []);
    } catch (e) {
      console.log("❌ Order fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerPickupList = async () => {
    try {
      const res = await getCustomerPickups(rawPhone, "pending,assigned");
      setPickups(res?.pickups || []);
    } catch (err) {
      console.log("❌ Pickup fetch error:", err);
    }
  };

  // const cancelPickupApi = async (pickupId: string) =>
  //   new Promise((resolve) => setTimeout(() => resolve(true), 500));

  // const reschedulePickupApi = async (pickupId: string) =>
  //   new Promise((resolve) => setTimeout(() => resolve(true), 500));

  useFocusEffect(
    useCallback(() => {
      getCustomerOrders();
      getCustomerPickupList();
    }, []),
  );

  /* ================= ANIMATIONS ================= */
  const uniqueOrders = useMemo(() => {
    const map = new Map();

    filteredOrders.forEach((item) => {
      const id = getOrderId(item) || item._id;

      if (!map.has(id)) {
        map.set(id, item);
      }
    });

    return Array.from(map.values());
  }, [filteredOrders]);

  useEffect(() => {
    cardAnims.current = uniqueOrders.map(
      (_, i) => cardAnims.current[i] || new Animated.Value(0),
    );
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    Animated.stagger(
      90,
      cardAnims.current.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [uniqueOrders]);

  /* ================= EMPTY STATE ================= */

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Text style={{ fontSize: 32 }}>📭</Text>
      </View>
      <Text style={[styles.emptyTitle, { color: "#fff" }]}>Nothing here</Text>
      <Text style={{ color: MUTED, textAlign: "center", fontSize: 13 }}>
        {activeFilter === "Awaiting"
          ? "No scheduled pickups"
          : `No ${activeFilter.toLowerCase()} orders found`}
      </Text>
    </View>
  );

  if (!user) return <OrdersScreenSkeleton />;
  if (loading) return <OrdersScreenSkeleton />;

  /* ================= UI ================= */

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <Animated.View
          style={[
            styles.headerContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>My Orders</Text>
              {/* <Text style={styles.headerSubtitle}>
                {activeFilter === "Awaiting"
                  ? "Upcoming Pickups"
                  : `${orders.length} total orders`}
              </Text> */}
            </View>

            {/* Active badge */}
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <View>
                <Text style={styles.headerSubtitle}>
                  {orders.length} total orders
                </Text>
              </View>
            </View>
          </View>

          {/* Filter tabs */}
        </Animated.View>

        {uniqueOrders.length === 0 && renderEmpty()}

        {/* ── CARDS ── */}
        {uniqueOrders.map((o: any, index: number) => {
          console.log("this is the o", o);
          const anim = cardAnims.current[index] || new Animated.Value(1);
          const animStyle = {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [24, 0],
                }),
              },
            ],
          };

          /* ── PICKUP CARD ---------------------------- ── */
          // if (o.type === "pickup") {
          //   return (
          //     <Animated.View key={o._id || index} style={animStyle}>
          //       <View style={styles.card}>
          //         {/* subtle top accent line */}
          //         <View style={[styles.cardAccentLine, { backgroundColor: "#fcc601" }]} />

          //         <View style={styles.cardInner}>
          //           {/* Status badge + icon */}
          //           <View style={styles.cardHeaderRow}>
          //             <StatusBadge
          //               label="Pickup Scheduled"
          //               color="#fcc601"
          //               icon="cube-outline"
          //             />
          //             <View style={styles.cardIconWrap}>
          //               <Ionicons name="calendar-outline" size={18} color="#fcc601" />
          //             </View>
          //           </View>

          //           {/* Date */}
          //           <Text style={styles.cardDate}>
          //             {formatDate(o.pickup_date)}
          //           </Text>
          //           <Text style={styles.cardTime}>
          //             {formatTime(o.pickup_date)}
          //           </Text>

          //           {/* Address */}
          //           <View style={styles.addressRow}>
          //             <Ionicons name="location-outline" size={13} color={MUTED} />
          //             <Text style={styles.addressText} numberOfLines={1}>
          //               {o.Address}
          //             </Text>
          //           </View>

          //           {/* Note */}
          //           {o.note ? (
          //             <View style={styles.noteBadge}>
          //               <Ionicons name="information-circle-outline" size={13} color={ACCENT} />
          //               <Text style={styles.noteText}>{o.note}</Text>
          //             </View>
          //           ) : null}

          //           <View style={styles.dividerLine} />

          //           {/* Action buttons */}
          //           <View style={styles.actionRow}>
          //             <TouchableOpacity
          //               style={styles.btnReschedule}
          //               activeOpacity={0.82}
          //               onPress={() => {
          //                 reschedulePickupApi(o._id);
          //                 router.push(`/pickups/reschedule/${o._id}`);
          //               }}
          //             >
          //               <Ionicons name="calendar-outline" size={14} color="#fff" />
          //               <Text style={styles.btnText}>Reschedule</Text>
          //             </TouchableOpacity>

          //             <TouchableOpacity
          //               style={styles.btnCancel}
          //               activeOpacity={0.82}
          //               onPress={async () => {
          //                 await cancelPickupApi(o._id);
          //                 setPickups((prev) => prev.filter((p) => p._id !== o._id));
          //               }}
          //             >
          //               <Ionicons name="close-circle-outline" size={14} color="#EF4444" />
          //               <Text style={[styles.btnText, { color: "#EF4444" }]}>Cancel</Text>
          //             </TouchableOpacity>
          //           </View>
          //         </View>
          //       </View>
          //     </Animated.View>
          //   );
          // }

          /* ── ORDER CARD ── */
          const sc = getStatusConfig(o.status);
          const orderId = getOrderId(o);
          const isDelivered = o.status === "delivered";
          const isProcessing =
            o.status === "processing" ||
            (!isDelivered && o.status !== "cancelled");

          return (
            <Animated.View key={orderId || o._id} style={animStyle}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  if (orderId) router.push(`/orders/${orderId}`);
                }}
              >
                <View style={styles.card}>
                  <View
                    style={[styles.cardAccentLine, { backgroundColor: sc.bg }]}
                  />

                  <View style={styles.cardInner}>
                    {/* Status badge + icon/stamp */}
                    <View style={styles.cardHeaderRow}>
                      <StatusBadge
                        label={sc.label}
                        color={sc.bg}
                        icon={sc.icon}
                      />
                      <View style={styles.cardIconWrap}>
                        {isDelivered ? (
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={20}
                            color={sc.bg}
                          />
                        ) : (
                          <Ionicons
                            name="shirt-outline"
                            size={18}
                            color={sc.bg}
                          />
                        )}
                      </View>
                    </View>

                    {/* Date */}
                    <Text style={styles.cardDate}>
                      {formatDate(o.createdAt)}
                    </Text>
                    <Text style={styles.cardTime}>
                      {formatTime(o.createdAt)}
                    </Text>

                    {/* Address (delivery address if exists) */}
                    {/* {o.address ? (
                      <View style={styles.addressRow}>
                        <Ionicons name="location-outline" size={13} color={MUTED} />
                        <Text style={styles.addressText} numberOfLines={1}>
                          {o.address}
                        </Text>
                      </View>
                    ) : null} */}

                    {/* Stage progress for active/processing orders */}
                    {isProcessing && !isDelivered && o.stage ? (
                      <StageProgress stage={o.stage} />
                    ) : isProcessing && !isDelivered ? (
                      <StageProgress stage="PROCESSING" />
                    ) : null}

                    <View style={styles.dividerLine} />

                    {/* Bottom row: items + price */}
                    <View style={styles.bottomRow}>
                      <View style={styles.itemPill}>
                        <Ionicons
                          name="shirt-outline"
                          size={12}
                          color={MUTED}
                        />
                        <Text style={styles.itemPillText}>
                          {o.items?.length || 0} items
                        </Text>
                      </View>

                      <View style={styles.priceWrap}>
                        <PaymentStamp status={o?.payment?.status} />
                        <Text style={[styles.priceText, { color: sc.bg }]}>
                          ₹{o.isPaid ? o.totalAmount : o.price}
                        </Text>
                      </View>
                    </View>

                    {/* Reorder for delivered */}
                    {isDelivered && (
                      <TouchableOpacity
                        style={styles.reorderBtn}
                        activeOpacity={0.85}
                        onPress={() => router.push(`/orders/${orderId}`)}
                      >
                        <Ionicons
                          name="refresh-outline"
                          size={14}
                          color={ACCENT}
                        />
                        <Text style={styles.reorderText}>Reorder Items</Text>
                      </TouchableOpacity>
                    )}

                    {/* Tap hint for non-delivered */}
                    {!isDelivered && (
                      <View style={styles.tapHint}>
                        <Text style={styles.tapHintText}>
                          Tap to view receipt
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={12}
                          color={MUTED}
                        />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  container: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },

  /* Header */
  headerContainer: { marginBottom: 7 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: { marginTop: 3, fontSize: 13, color: MUTED },

  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 2,
  },
  activeBadgeNum: {
    fontSize: 18,
    fontWeight: "600",
    color: ACCENT,
    lineHeight: 20,
  },
  activeBadgeLabel: { fontSize: 10, color: MUTED, fontWeight: "600" },

  /* Card */
  card: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardAccentLine: {
    height: 2,
    width: "100%",
  },
  cardInner: { paddingHorizontal: 13, paddingTop: 11, paddingBottom: 10 },

  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },

  cardDate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  cardTime: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
    marginBottom: 10,
    fontWeight: "500",
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 2,
  },
  addressText: {
    color: MUTED,
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },

  noteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    backgroundColor: ACCENT + "12",
    borderWidth: 1,
    borderColor: ACCENT + "25",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  noteText: {
    color: ACCENT,
    fontWeight: "600",
    fontSize: 12,
  },

  dividerLine: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 9,
  },
  /* Pickup action buttons */
  actionRow: { flexDirection: "row", gap: 10 },
  btnReschedule: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: ACCENT + "18",
    borderWidth: 1,
    borderColor: ACCENT + "40",
  },
  btnCancel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#EF444412",
    borderWidth: 1,
    borderColor: "#EF444430",
  },
  btnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },

  /* Order card bottom */
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  itemPillText: { color: MUTED, fontSize: 12, fontWeight: "600" },

  priceWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  priceText: { fontSize: 16, fontWeight: "900" },

  /* Reorder button */
  reorderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: ACCENT + "14",
    borderWidth: 1,
    borderColor: ACCENT + "35",
  },

  reorderText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* Tap hint */
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    marginTop: 7,
  },
  tapHintText: { fontSize: 11, color: MUTED },

  /* Empty */
  emptyContainer: { alignItems: "center", paddingVertical: 64, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
});
