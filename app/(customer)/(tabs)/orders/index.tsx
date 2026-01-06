import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../../context/ThemeContext";

type OrderStatus = "Active" | "Pending" | "Completed";

const ORDERS = [
  {
    id: "2481",
    status: "Active" as OrderStatus,
    subtitle: "Pickup Scheduled: Today, 4 PM",
    total: "$38.50",
  },
  {
    id: "2480",
    status: "Pending" as OrderStatus,
    subtitle: "Scheduled: Mon, Nov 27",
    total: "$25.00",
  },
  {
    id: "2479",
    status: "Completed" as OrderStatus,
    subtitle: "Delivered: Nov 24, 2023",
    total: "$52.75",
  },
  {
    id: "2478",
    status: "Completed" as OrderStatus,
    subtitle: "Delivered: Nov 20, 2023",
    total: "$15.00",
  },
];

export default function Orders() {
  const { theme, isDark } = useTheme();

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case "Active":
        return {
          bg: "#1E3A8A",
          text: "#93C5FD",
        };
      case "Pending":
        return {
          bg: "#3F3F22",
          text: "#FACC15",
        };
      case "Completed":
        return {
          bg: "#064E3B",
          text: "#6EE7B7",
        };
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Orders
        </Text>

        <Text style={[styles.headerSubtitle, { color: theme.subText }]}>
          Track and manage your orders
        </Text>

        <View
          style={[
            styles.headerDivider,
            { backgroundColor: isDark ? "#1F2937" : "#E5E7EB" },
          ]}
        />
      </View>


      {ORDERS.map((o) => {
        const statusStyle = getStatusStyle(o.status);

        return (
          <View
            key={o.id}
            style={[
              styles.card,
              { backgroundColor: theme.card },
            ]}
          >
            {/* TOP ROW */}
            <View style={styles.row}>
              <Text style={[styles.orderId, { color: theme.text }]}>
                Order #{o.id}
              </Text>

              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: statusStyle.bg },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: statusStyle.text },
                  ]}
                >
                  {o.status}
                </Text>
              </View>
            </View>

            {/* SUBTEXT */}
            <Text
              style={[
                styles.subtitle,
                { color: theme.subText },
              ]}
            >
              {o.subtitle}
            </Text>

            {/* TOTAL */}
            <Text
              style={[
                styles.total,
                { color: theme.primary },
              ]}
            >
              Total: {o.total}
            </Text>

            {/* ACTIONS */}
            <View style={styles.actionsRow}>
              {o.status === "Active" && (
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    Track Delivery
                  </Text>
                </TouchableOpacity>
              )}

              {o.status === "Pending" && (
                <TouchableOpacity
                  style={[
                    styles.secondaryBtn,
                    {
                      backgroundColor: isDark
                        ? "#1F2937"
                        : "#E5E7EB",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      { color: theme.text },
                    ]}
                  >
                    View Details
                  </Text>
                </TouchableOpacity>
              )}

              {o.status === "Completed" && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text style={styles.primaryBtnText}>
                      Reorder
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() =>
                      router.push(`/orders/${o.id}`)
                    }
                    style={[
                      styles.secondaryBtn,
                      {
                        backgroundColor: isDark
                          ? "#1F2937"
                          : "#E5E7EB",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.secondaryBtnText,
                        { color: theme.text },
                      ]}
                    >
                      View Details
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {

    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
  },

  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderId: {
    fontSize: 16,
    fontWeight: "700",
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 12,
  },

  total: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtnText: {
    fontWeight: "800",
    color: "#000",
  },

  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryBtnText: {
    fontWeight: "700",
  },
  headerContainer: {
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
  },

  headerDivider: {
    height: 1,
    marginTop: 12,
    borderRadius: 1,
  },

});
