import PaymentStamp from "@/components/PaymentStamp";
import { getOrdersApi } from "@/features/orders/orders.api";
import { getCustomerPickups } from "@/features/pickups/pickup.api";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
  LayoutChangeEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OrdersScreenSkeleton } from "../../../../components/SkeletonLoader";
import { useTheme } from "../../../../context/ThemeContext";
import AppLoader from "@/components/AppLoader";
/* ================= TYPES ================= */

type OrderStatus = "Active" | "Completed";
type FilterType = "All" | "Active" | "Completed" | "Awaiting";

const FILTERS: FilterType[] = ["All", "Active", "Completed", "Awaiting"];

const getOrderId = (o: any): string | undefined =>
  o?.order_id ?? o?.orderId ?? o?.id ?? o?._id;



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

const mapFilterStatus = (status: string): OrderStatus =>
  status === "delivered" ? "Completed" : "Active";

/* ================= SCROLLABLE SLIDING TAB BAR ================= */
function SlidingFilterTabs({
  active, onChange, theme, isDark,
}: {
  active: FilterType;
  onChange: (f: FilterType) => void;
  theme: any;
  isDark: boolean;
}) {
  const [tabLayouts, setTabLayouts] = useState<{ x: number; width: number }[]>([]);
  const slideX = useRef(new Animated.Value(0)).current;
  const slideW = useRef(new Animated.Value(60)).current;
  const labelAnims = useRef(FILTERS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const activeIndex = FILTERS.indexOf(active);

  useEffect(() => {
    const layout = tabLayouts[activeIndex];
    if (!layout) return;
    Animated.parallel([
      Animated.spring(slideX, {
        toValue: layout.x,
        tension: 60,
        friction: 10,
        useNativeDriver: false, // width/left can't use native driver
      }),
      Animated.spring(slideW, {
        toValue: layout.width,
        tension: 60,
        friction: 10,
        useNativeDriver: false,
      }),
      // Crossfade labels
      ...FILTERS.map((_, idx) =>
        Animated.timing(labelAnims[idx], {
          toValue: idx === activeIndex ? 1 : 0,
          duration: 200,
          useNativeDriver: true,
        })
      ),
    ]).start();
  }, [activeIndex, tabLayouts]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 2 }}
    >
      <View style={[styles.tabBarWrapper, { backgroundColor: isDark ? "#0F1720" : "#0F1720" }]}>

        {/* ── Sliding gradient pill ── */}
        <Animated.View
          style={[
            styles.slidingPill,
            {
              left: slideX,
              width: slideW,
              overflow: "hidden",
              shadowColor: "#56BFAB",
              shadowOpacity: 0.45,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 3 },
              elevation: 6,
            },
          ]}
        >
          <LinearGradient
            colors={["#56BFAB", "#005B47"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* ── Tab labels ── */}
        {FILTERS.map((filter, i) => {
          const isActive = active === filter;
          return (
            <TouchableOpacity
              key={filter}
              activeOpacity={0.8}
              onLayout={(e: LayoutChangeEvent) => {
                const { x, width } = e.nativeEvent.layout;
                setTabLayouts((prev) => {
                  const next = [...prev];
                  next[i] = { x, width };
                  return next;
                });
              }}
              onPress={() => onChange(filter)}
              style={styles.tabItem}
            >
              {/* Explicit elevated wrapper so text always sits above pill on Android */}
              <View style={{ zIndex: 10, elevation: 10 }}>
                <Animated.Text
                  style={{
                    fontWeight: isActive ? "800" : "600",
                    fontSize: 13,
                    color: labelAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: ["#6B7280", "#ffffff"],
                    }),
                  }}
                >
                  {filter}
                </Animated.Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
/* ================= MAIN COMPONENT ================= */

export default function Orders() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [pickups, setPickups] = useState<any[]>([]);

  const cardAnims = useRef<Animated.Value[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  if (!user) return <OrdersScreenSkeleton />;

  const rawPhone = user?.user?.phone ?? user?.phone ?? "";
  const phoneWithout91 = rawPhone.startsWith("91")
    ? rawPhone.slice(2)
    : rawPhone;
  const phoneWith91 = rawPhone.startsWith("91") ? rawPhone : `91${rawPhone}`;

  /* ================= HELPERS ================= */

  const formatOrderDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const datePart = date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timePart = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${datePart} • ${timePart}`;
  };

  /* ================= FILTERED ORDERS ================= */

  const filteredOrders = useMemo(() => {
    if (activeFilter === "Awaiting")
      return pickups.map((p) => ({ ...p, type: "pickup" }));
    if (activeFilter === "All") {
      return [
        ...orders.map((o) => ({ ...o, type: "order" })),
        ...pickups.map((p) => ({ ...p, type: "pickup" })),
      ];
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

  const cancelPickupApi = async (pickupId: string) =>
    new Promise((resolve) => setTimeout(() => resolve(true), 500));

  const reschedulePickupApi = async (pickupId: string) =>
    new Promise((resolve) => setTimeout(() => resolve(true), 500));

  useFocusEffect(
    useCallback(() => {
      getCustomerOrders();
      getCustomerPickupList();
    }, []),
  );

  /* ================= ANIMATIONS ================= */

  useEffect(() => {
    cardAnims.current = filteredOrders.map(
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
      100,
      cardAnims.current.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [filteredOrders]);

  if (loading) return <AppLoader />;

  /* ================= EMPTY STATE ================= */

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={{ fontSize: 40 }}>📭</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        No orders here
      </Text>
      <Text style={{ color: theme.subText, textAlign: "center" }}>
        {activeFilter === "Awaiting"
          ? "No scheduled pickups"
          : `No ${activeFilter.toLowerCase()} orders found`}
      </Text>
    </View>
  );

  /* ================= UI ================= */

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <Animated.View
          style={[
            styles.headerContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                My Orders
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.subText }]}>
                Total Orders: {orders.length}
              </Text>
            </View>
            <View
              style={[
                styles.statsBox,
                {
                  backgroundColor: isDark ? "#0F1720" : "#0F1720",
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.statsNumber, { color: theme.primary }]}>
                {orders.filter((o) => o.status !== "delivered").length}
              </Text>
              <Text style={[styles.statsLabel, { color: theme.subText }]}>
                Active
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? "#1F2937" : "#1F2937" },
            ]}
          />
        </Animated.View>

        {/* SCROLLABLE SLIDING FILTER TABS */}
        <SlidingFilterTabs
          active={activeFilter}
          onChange={setActiveFilter}
          theme={theme}
          isDark={isDark}
        />

        {filteredOrders.length === 0 && renderEmpty()}

        {/* CARDS */}
        {filteredOrders.map((o: any, index: number) => {
          console.log("Payment Status:", o?.payment?.status);
          const anim = cardAnims.current[index] || new Animated.Value(1);
          const animStyle = {
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          };

          /* ── PICKUP CARD ── */
          if (o.type === "pickup") {
            return (
              <Animated.View key={o._id || index} style={animStyle}>
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.card, borderLeftColor: "#fcc601" },
                  ]}
                >
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.row}>
                      {/* Purple status dot */}
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: "#8B5CF622" },
                        ]}
                      >
                        <Ionicons
                          name="cube-outline"
                          size={13}
                          color="#fcc601"
                        />
                      </View>
                      <Text
                        style={{
                          fontWeight: "600",
                          color: "#fcc601",
                          marginLeft: 8,
                        }}
                      >
                        Pickup Scheduled
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.dateBadge,
                        { backgroundColor: isDark ? "#1F2937" : "#1F2937" },
                      ]}
                    >
                      <Text style={{ fontSize: 11, color: theme.subText }}>
                        {formatOrderDateTime(o.pickup_date)}
                      </Text>
                    </View>
                  </View>

                  {/* Body */}
                  <View style={styles.cardBody}>
                    <Text style={[styles.orderIdText, { color: theme.text }]}>
                      Pickup Request
                    </Text>
                    <View style={styles.row}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={theme.subText}
                        style={{ marginTop: 4 }}
                      />
                      <Text
                        style={{
                          color: theme.subText,
                          marginTop: 4,
                          marginLeft: 4,
                          flex: 1,
                        }}
                      >
                        {o.Address}
                      </Text>
                    </View>
                    {o.note ? (
                      <View
                        style={[
                          styles.noteBadge,
                          { backgroundColor: isDark ? "#1F2937" : "#1F2937" },
                        ]}
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={13}
                          color={theme.primary}
                        />
                        <Text
                          style={{
                            color: theme.primary,
                            fontWeight: "600",
                            marginLeft: 4,
                            fontSize: 12,
                          }}
                        >
                          {o.note}
                        </Text>
                      </View>
                    ) : null}

                    {/* Action buttons */}
                    <View style={{ flexDirection: "row", marginTop: 14, gap: 8 }}>

                      {/* Reschedule — subtle teal ghost */}
                      <TouchableOpacity
                        style={styles.actionBtn}
                        activeOpacity={0.82}
                        onPress={() => {
                          reschedulePickupApi(o._id);
                          router.push(`/pickups/reschedule/${o._id}`);
                        }}
                      >
                        <LinearGradient
                          colors={["#56BFAB", "#005B47"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
                        />
                        <Ionicons name="calendar-outline" size={13} color="#fff" />
                        <Text style={styles.actionBtnText}>Reschedule</Text>
                      </TouchableOpacity>

                      {/* Cancel — muted slate, NOT red */}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.cancelBtn]}
                        activeOpacity={0.82}
                        onPress={async () => {
                          await cancelPickupApi(o._id);
                          setPickups((prev) => prev.filter((p) => p._id !== o._id));
                        }}
                      >
                        <LinearGradient
                          colors={["#ad5555", "#591f1f"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
                        />
                        <Ionicons name="close-outline" size={13} color="#fff" />
                        <Text style={[styles.actionBtnText, { color: "#fff" }]}>Cancel</Text>
                      </TouchableOpacity>


                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          }

          /* ── ORDER CARD ── */
          const sc = getStatusConfig(o.status);
          const orderId = getOrderId(o);

          return (
            <Animated.View key={orderId || index} style={animStyle}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => {
                  if (orderId) router.push(`/orders/${orderId}`);
                }}
              >
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.card, borderLeftColor: sc.bg },
                  ]}
                >
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.row}>
                      {/* Coloured status dot — different colour per status */}
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: sc.bg + "22" },
                        ]}
                      >
                        <Ionicons name={sc.icon} size={13} color={sc.bg} />
                      </View>
                      <Text
                        style={{
                          fontWeight: "700",
                          color: sc.bg,
                          marginLeft: 8,
                        }}
                      >
                        {sc.label}
                      </Text>
                    </View>

                    {/* Item count pill */}
                    <View
                      style={[
                        styles.itemPill,
                        { backgroundColor: isDark ? "#1F2937" : "#1F2937" },
                      ]}
                    >
                      <Ionicons
                        name="shirt-outline"
                        size={12}
                        color={theme.subText}
                      />
                      <Text
                        style={{
                          color: theme.subText,
                          marginLeft: 4,
                          fontSize: 12,
                        }}
                      >
                        {o.items?.length || 0} items
                      </Text>
                    </View>
                  </View>

                  {/* Body */}
                  <View style={styles.cardBody}>
                    {/* 🔥 TOP ROW (LEFT + RIGHT) */}
                    <View style={styles.orderTopRow}>
                      {/* LEFT SIDE */}
                      <View style={styles.orderInfo}>
                        <Text
                          style={[styles.orderIdText, { color: theme.text }]}
                        >
                          Order #{orderId}
                        </Text>
                        <Text style={styles.orderDate}>
                          Placed on {formatOrderDateTime(o.createdAt)}
                        </Text>
                      </View>

                      {/* RIGHT SIDE (STAMP) */}
                      <View style={styles.stampWrapper}>
                        <PaymentStamp status={o?.payment?.status} />
                      </View>
                    </View>

                    {/* Divider */}
                    <View
                      style={[
                        styles.innerDivider,
                        { backgroundColor: isDark ? "#1F2937" : "#1F2937" },
                      ]}
                    />

                    {/* Price row */}
                    <View style={styles.totalRow}>
                      <View style={styles.row}>
                        <Ionicons
                          name="receipt-outline"
                          size={14}
                          color={theme.subText}
                        />
                        <Text style={{ color: theme.subText, marginLeft: 4 }}>
                          Total
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontWeight: "900",
                          color: sc.bg,
                          fontSize: 16,
                        }}
                      >
                        ₹{o.price}
                      </Text>
                    </View>
                  </View>

                  {/* Tap hint */}
                  <View
                    style={[
                      styles.tapHint,
                      { borderTopColor: isDark ? "#1F2937" : "#1F2937" },
                    ]}
                  >
                    <Text style={{ fontSize: 11, color: theme.subText }}>
                      Tap to view receipt
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={12}
                      color={theme.subText}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { padding: 16, marginTop: 20 },
  headerContainer: { marginBottom: 0 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "800" },
  headerSubtitle: { marginTop: 4, fontSize: 13 },
  statsBox: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statsNumber: { fontSize: 16, fontWeight: "800" },
  statsLabel: { fontSize: 11 },
  divider: { height: 1, marginTop: 10 },

  /* Tabs */
  tabBarWrapper: {
    flexDirection: "row",
    borderRadius: 30,
    padding: 4,
    position: "relative",
  },
  slidingPill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: 26,
    elevation: 1,      // ← keep low so text stays above

    zIndex: 1,
  },
  tabItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "center",
    zIndex: 2,
    position: "relative",   // ← makes zIndex work on Android
  },

  /* Cards */
  card: {
    borderRadius: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardBody: { paddingHorizontal: 16, paddingBottom: 12 },
  row: { flexDirection: "row", alignItems: "center" },

  /* Status dot — coloured circle with icon */
  statusDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Item count pill */
  itemPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },

  /* Date badge */
  dateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },

  /* Note badge */
  noteBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  orderIdText: { fontSize: 16, fontWeight: "700", marginBottom: 2 },

  innerDivider: { height: 1, marginVertical: 10 },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },

  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10,
    overflow: "hidden",
    position: "relative",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.2,
  },
  cancelBtn: {
    backgroundColor: "#a64e4e",   // dark muted slate
    borderWidth: 1,
    borderColor: "#2D3A47",       // very subtle border
    overflow: "visible",
  },

  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },

  orderTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "stretch", // ✅ key for equal height
  },

  orderInfo: {
    justifyContent: "space-between",
  },

  orderDate: {
    color: "#6B7280", // or theme.subText
    fontSize: 12,
    marginTop: 4,
  },

  stampWrapper: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 45, // adjust based on your UI
  },
});
