import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32; // matches paddingHorizontal:16

/* ✅ ONLY ACTIVE STATUSES */
const ACTIVE_STATUSES = ["Washing", "Picked Up", "In Transit", "Processing"];

/* ⭐ Dummy Orders */
const DUMMY_ORDERS = [
  {
    id: "2481",
    status: "Washing",
    subtitle: "2 items • Cotton",
    progress: 0.3,
    paid: false,
  },
  {
    id: "2482",
    status: "Picked Up",
    subtitle: "Driver collected your items",
    progress: 0.5,
    paid: false,
  },
  {
    id: "2483",
    status: "In Transit",
    subtitle: "Heading to facility",
    progress: 0.75,
    paid: true,
  },
  {
    id: "2484",
    status: "Processing",
    subtitle: "Cleaning in progress",
    progress: 0.9,
    paid: true,
  },
];

export default function RecentActivityCarousel({ messages = DUMMY_ORDERS }) {
  const { theme } = useTheme();

  // Filter only active ones (fallback to DUMMY_ORDERS)
  const list = (messages?.length ? messages : DUMMY_ORDERS).filter((o) =>
    ACTIVE_STATUSES.includes(o.status),
  );

  const translateX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  /* ⭐ AUTO SLIDE (slower/premium) */
  useEffect(() => {
    if (list.length <= 1) return;

    const timer = setInterval(() => {
      const next = (index + 1) % list.length;

      Animated.timing(translateX, {
        toValue: -next * CARD_WIDTH,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      setIndex(next);
    }, 4500);

    return () => clearInterval(timer);
  }, [index, list.length, translateX]);

  /* STATUS metadata (icon name plus colors) */
  const getStatusMeta = (status: string) => {
    switch (status) {
      case "Washing":
        return {
          icon: "water-outline",
          color: "#3B82F6",
          bg: "#DBEAFE",
        };

      case "Picked Up":
        return {
          icon: "cube-outline",
          color: "#7C3AED",
          bg: "#EDE9FE",
        };

      case "In Transit":
        return {
          icon: "car-outline",
          color: "#F59E0B",
          bg: "#FEF3C7",
        };

      default:
        return {
          icon: "time-outline",
          color: "#14B8A6",
          bg: "#CCFBF1",
        };
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
      ]}
    >
      <View style={{ width: "100%", paddingHorizontal: 1 }}>
        <Text style={styles.header}>Recent Activity</Text>
      </View>      
      <View style={{ overflow: "hidden", width: CARD_WIDTH }}>
        <Animated.View
          style={{
            flexDirection: "row",
            transform: [{ translateX }],
          }}
        >
          {list.map((o, i) => {
            const meta = getStatusMeta(o.status);

            return (
              <View
                key={o.id ?? `${i}`}
                style={[
                  styles.orderCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                    width: CARD_WIDTH,
                  },
                ]}
              >

                {/* ROW */}
                <View style={styles.orderRow}>
                  <Text style={[styles.orderId, { color: theme.text }]}>
                    Order #{o.id}
                  </Text>

                  <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.statusText, { color: meta.color }]}>
                      Active
                    </Text>
                  </View>
                </View>

                {/* STATUS VISUAL */}
                <View style={{ marginTop: 12 }}>
                  <View style={styles.statusContainer}>
                    <View style={styles.statusLeft}>
                      <View
                        style={[
                          styles.statusIconWrap,
                          {
                            backgroundColor: meta.bg,
                            borderColor: meta.bg,
                          },
                        ]}
                      >
                        <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                      </View>

                      <View style={styles.statusTextBlock}>
                        <Text style={[styles.statusLabel, { color: theme.text }]}>
                          {o.status}
                        </Text>

                        {/* PROGRESS BAR */}
                        <View style={styles.progressBar}>
                          <Animated.View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.max(0, Math.min(1, o.progress ?? 0)) * 100}%`,
                                backgroundColor: theme.primary,
                              },
                            ]}
                          />
                        </View>
                        {/* subtitle (optional) */}
                        {o.subtitle ? (
                          <Text style={{ color: theme.subText, marginTop: 8, fontSize: 12 }}>
                            {o.subtitle}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>

                {/* PAY / PAID UI */}
                <View style={styles.footer}>
                  {!o.paid ? (
                    <View style={styles.payButton}>
                      <Ionicons name="flash-outline" size={14} color="#000" />
                      <Text style={styles.payText}>Pay Now</Text>
                    </View>
                  ) : (
                    <View style={styles.paidBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.paidText}>Paid</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    borderTopWidth: 1,
    alignItems: "center",

    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -2 },
      },
      android: {
        elevation: 20,
      },
    }),
  },

  header: {
    fontSize: 16,
    marginBottom: 8,
    color: "#fff",
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    fontWeight: "700",
  },

  orderCard: {
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  orderRow: {
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

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
  },

  statusTextBlock: {
    flex: 1,
  },

  statusLabel: {
    fontWeight: "800",
    fontSize: 14,
  },

  progressBar: {
    marginTop: 8,
    height: 6,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 6,
  },

  footer: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  payButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22C55E",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
  },

  payText: {
    fontWeight: "800",
    color: "#000",
    marginLeft: 8,
  },

  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
  },

  paidText: {
    fontWeight: "700",
    color: "#065F46",
    marginLeft: 8,
  },
});
