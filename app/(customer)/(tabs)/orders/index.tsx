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
import { useTheme } from "../../../../context/ThemeContext";

/* ================= TYPES ================= */

type OrderStatus = "Active" | "Completed";
type FilterType = "All" | "Active" | "Completed" | "Awaiting";

/* ================= COMPONENT ================= */

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

  if (!user) return null;

  const phone = `91${user?.user?.phone ? user?.user?.phone : user?.phone}`;

  console.log("this is the phoneeee===>>>", phone);

  /* ================= HELPERS ================= */

  const mapStatus = (status: string): OrderStatus =>
    status === "delivered" ? "Completed" : "Active";

  const getStatusStyle = (status: OrderStatus) => {
    if (status === "Completed") {
      return { bg: "#10B981", icon: "checkmark-done" as const };
    }
    return { bg: "#0EA5A4", icon: "navigate" as const };
  };

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

  /* ================= FILTERED ORDERS (NO FUNCTIONS) ================= */

  const filteredOrders = useMemo(() => {
    if (activeFilter === "Awaiting") {
      return pickups.map((p) => ({
        ...p,
        type: "pickup",
      }));
    }

    if (activeFilter === "All") {
      return [
        ...orders.map((o) => ({ ...o, type: "order" })),
        ...pickups.map((p) => ({ ...p, type: "pickup" })),
      ];
    }

    return orders
      .filter((o) => mapStatus(o.status) === activeFilter)
      .map((o) => ({ ...o, type: "order" }));
  }, [orders, pickups, activeFilter]);

  /* ================= API ================= */

  const getCustomerOrders = async () => {
    try {
      setLoading(true);
      const res = await getOrdersApi(phone);
      setOrders(res?.orders || []);
    } catch (e) {
      console.log("Order fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerPickupList = async () => {
    try {
      const res = await getCustomerPickups(
        user?.user?.phone,
        "pending,assigned",
      );
      setPickups(res?.pickups || []);
    } catch (err) {
      console.log("Pickup fetch error", err);
    }
  };

  /* ================= DUMMY PICKUP ACTION APIs ================= */

  const cancelPickupApi = async (pickupId: string) => {
    console.log("🚨 Cancel pickup clicked:", pickupId);

    // TODO: replace with real API later
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("✅ Pickup cancelled (dummy)");
        resolve(true);
      }, 500);
    });
  };

  const reschedulePickupApi = async (pickupId: string) => {
    console.log("📅 Reschedule pickup clicked:", pickupId);

    // TODO: replace with real API later
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("✅ Navigate to reschedule screen (dummy)");
        resolve(true);
      }, 500);
    });
  };

  useFocusEffect(
    useCallback(() => {
      getCustomerOrders();
      getCustomerPickupList();
    }, []),
  );

  /* ================= ANIMATIONS ================= */

  useEffect(() => {
    // Ensure animation value exists for each item
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
      120,
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

  if (loading) {
    return <OrdersScreenSkeleton />;
  }

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
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
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
                  backgroundColor: isDark ? "#0F1720" : "#F8FAFC",
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
              { backgroundColor: isDark ? "#1F2937" : "#E5E7EB" },
            ]}
          />
        </Animated.View>

        {/* FILTER TABS */}
        <View style={styles.filterRow}>
          {(["All", "Active", "Completed", "Awaiting"] as FilterType[]).map(
            (filter) => {
              const isActive = activeFilter === filter;

              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={[
                    styles.filterTab,
                    {
                      backgroundColor: isActive
                        ? theme.primary
                        : isDark
                          ? "#1F2937"
                          : "#F3F4F6",
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: isActive ? "800" : "600",
                      color: isActive ? "#000" : theme.text,
                    }}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>

        {/* ORDERS */}
        {filteredOrders.map((o: any, index: number) => {
          const anim = cardAnims.current[index] || new Animated.Value(1);

          /* ================= PICKUP CARD (AWAITING) ================= */
          if (o.type === "pickup") {
            return (
              <Animated.View
                key={o._id}
                style={{
                  opacity: anim,
                  transform: [
                    {
                      translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                }}
              >
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.card,
                      borderLeftColor: "#8B5CF6",
                    },
                  ]}
                >
                  {/* HEADER */}
                  <View style={styles.cardHeader}>
                    <View style={styles.row}>
                      <Ionicons name="cube-outline" size={16} color="#8B5CF6" />
                      <Text
                        style={{
                          fontWeight: "800",
                          color: "#8B5CF6",
                          marginLeft: 6,
                        }}
                      >
                        Pickup Scheduled
                      </Text>
                    </View>

                    <Text style={{ color: theme.subText }}>
                      {formatOrderDateTime(o.pickup_date)}
                    </Text>
                  </View>

                  {/* BODY */}
                  <View style={styles.cardBody}>
                    <Text style={[styles.orderId, { color: theme.text }]}>
                      Pickup Request
                    </Text>

                    {/* ADDRESS */}
                    <Text style={{ color: theme.subText, marginTop: 4 }}>
                      📍 {o.Address}
                    </Text>

                    {/* NOTE */}
                    {o.note ? (
                      <Text
                        style={{
                          color: theme.primary,
                          marginTop: 8,
                          fontWeight: "600",
                        }}
                      >
                        Note: {o.note}
                      </Text>
                    ) : null}

                    {/* ACTION BUTTONS */}
                    <View
                      style={{
                        flexDirection: "row",
                        marginTop: 16,
                        gap: 10,
                      }}
                    >
                      {/* RESCHEDULE */}
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: isDark ? "#10B981" : "#F3F4F6",
                          paddingVertical: 12,
                          borderRadius: 10,
                          alignItems: "center",
                        }}
                        onPress={() => {
                          reschedulePickupApi(o._id);
                          console.log("👉 Navigate to reschedule screen");
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "700",
                            color: theme.text,
                          }}
                        >
                          Reschedule
                        </Text>
                      </TouchableOpacity>

                      {/* CANCEL */}
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          backgroundColor: "#b84747",
                          paddingVertical: 12,
                          borderRadius: 10,
                          alignItems: "center",
                        }}
                        onPress={async () => {
                          await cancelPickupApi(o._id);

                          // remove from UI instantly (optimistic)
                          setPickups((prev) =>
                            prev.filter((p) => p._id !== o._id),
                          );
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "800",
                            color: "#fff",
                          }}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Animated.View>
            );
          }

          /* ================= ORDER CARD ================= */
          const uiStatus = mapStatus(o.status);
          const status = getStatusStyle(uiStatus);

          return (
            <Animated.View
              key={o._id}
              style={{
                opacity: anim,
                transform: [
                  {
                    translateY: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(`/orders/${o.order_id}`)}
              >
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.card,
                      borderLeftColor: status.bg,
                    },
                  ]}
                >
                  {/* HEADER */}
                  <View style={styles.cardHeader}>
                    <View style={styles.row}>
                      <Ionicons
                        name={status.icon}
                        size={16}
                        color={status.bg}
                      />
                      <Text
                        style={{
                          fontWeight: "700",
                          color: status.bg,
                          marginLeft: 6,
                        }}
                      >
                        {uiStatus}
                      </Text>
                    </View>

                    <Text style={{ color: theme.subText }}>
                      {o.items?.length || 0} items
                    </Text>
                  </View>

                  {/* BODY */}
                  <View style={styles.cardBody}>
                    <Text style={[styles.orderId, { color: theme.text }]}>
                      Order #{o.order_id}
                    </Text>

                    <Text style={{ color: theme.subText }}>
                      Placed on {formatOrderDateTime(o.createdAt)}
                    </Text>

                    <View style={styles.totalRow}>
                      <Text style={{ color: theme.subText }}>Total</Text>
                      <Text
                        style={{
                          fontWeight: "800",
                          color: theme.primary,
                        }}
                      >
                        ₹{o.price}
                      </Text>
                    </View>
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
  container: {
    padding: 16,
    paddingBottom: 120,
  },
  headerContainer: {
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
  },
  statsBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: "800",
  },
  statsLabel: {
    fontSize: 11,
  },
  divider: {
    height: 1,
    marginTop: 16,
  },
  filterRow: {
    flexDirection: "row",
    marginVertical: 10,
  },
  filterTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderId: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  totalRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
