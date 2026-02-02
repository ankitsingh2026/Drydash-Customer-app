import { getOrdersApi } from "@/features/orders/orders.api";
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
type FilterType = "All" | "Active" | "Completed";

/* ================= COMPONENT ================= */

export default function Orders() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  const cardAnims = useRef<Animated.Value[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  if (!user) return null;

  const phone = `91${user?.user?.phone}`;

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
    if (activeFilter === "All") return orders;
    return orders.filter((o) => mapStatus(o.status) === activeFilter);
  }, [orders, activeFilter]);

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

  useFocusEffect(
    useCallback(() => {
      getCustomerOrders();
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
          {(["All", "Active", "Completed"] as FilterType[]).map((filter) => {
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
          })}
        </View>

        {/* ORDERS */}
        {filteredOrders.map((o, index) => {
          const anim = cardAnims.current[index] || new Animated.Value(1);
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
                      {o.items.length} items
                    </Text>
                  </View>

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
    marginVertical: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
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
