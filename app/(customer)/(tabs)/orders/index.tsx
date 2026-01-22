import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

type OrderStatus = "Active" | "Completed";

const ORDERS = [
  {
    id: "2481",
    status: "Active" as OrderStatus,
    subtitle: "Pickup Scheduled: Today, 4 PM",
    total: "$38.50",
    items: 5,
  },

  {
    id: "2479",
    status: "Completed" as OrderStatus,
    subtitle: "Delivered: Nov 24, 2023",
    total: "$52.75",
    items: 8,
  },
];

export default function Orders() {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);

  // Header animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Card animations
  const cardAnims = useRef(ORDERS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Simulate API loading
    const timer = setTimeout(() => {
      setLoading(false);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      Animated.stagger(
        120,
        cardAnims.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
        ),
      ).start();
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <OrdersScreenSkeleton />;
  }

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case "Active":
        return { bg: "#0EA5A4", icon: "navigate" as const };
      case "Completed":
        return { bg: "#10B981", icon: "checkmark-done" as const };
    }
  };

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
                Total Orders: {ORDERS.length}
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
                {ORDERS.filter((o) => o.status === "Active").length}
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
          {["All", "Active", "Completed"].map((filter, idx) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                {
                  backgroundColor:
                    idx === 0 ? theme.primary : isDark ? "#1F2937" : "#F3F4F6",
                },
              ]}
            >
              <Text
                style={{
                  fontWeight: idx === 0 ? "800" : "600",
                  color: idx === 0 ? "#000" : theme.text,
                }}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ORDERS */}
        {ORDERS.map((o, index) => {
          const status = getStatusStyle(o.status);

          return (
            <Animated.View
              key={o.id}
              style={{
                opacity: cardAnims[index],
                transform: [
                  {
                    translateY: cardAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(`/orders/${o.id}`)}
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
                        {o.status}
                      </Text>
                    </View>
                    <Text style={{ color: theme.subText }}>
                      {o.items} items
                    </Text>
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={[styles.orderId, { color: theme.text }]}>
                      Order #{o.id}
                    </Text>
                    <Text style={{ color: theme.subText }}>{o.subtitle}</Text>

                    <View style={styles.totalRow}>
                      <Text style={{ color: theme.subText }}>Total</Text>
                      <Text style={{ fontWeight: "800", color: theme.primary }}>
                        {o.total}
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
    marginBottom: 16,
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
