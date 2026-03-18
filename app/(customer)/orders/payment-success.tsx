import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";

export default function PaymentSuccess() {
  const { theme } = useTheme();
  const { orderId, amount, paymentId } = useLocalSearchParams<{
    orderId: string;
    amount: string;
    paymentId: string;
  }>();

  // bounce animation for checkmark
  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* SUCCESS ICON */}
      <Animated.View
        style={[styles.iconCircle, { transform: [{ scale }], opacity: fade }]}
      >
        <Ionicons name="checkmark" size={64} color="#fff" />
      </Animated.View>

      {/* TEXT */}
      <Animated.View style={{ opacity: fade, alignItems: "center" }}>
        <Text style={[styles.title, { color: theme.text }]}>
          Payment Successful!
        </Text>
        <Text style={[styles.sub, { color: theme.subText }]}>
          Your payment has been received !
        </Text>

        {/* DETAILS CARD */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Row label="Order ID" value={`#${orderId}`} theme={theme} />
          <Row label="Amount Paid" value={`₹${amount}`} theme={theme} />
          {paymentId ? (
            <Row label="Payment ID   " value={paymentId} theme={theme} />
          ) : null}
        </View>
      </Animated.View>

      {/* BUTTONS */}
      <View style={styles.btnGroup}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.primary }]}
          onPress={() =>
            router.replace({
              pathname: "/(customer)/orders/[orderId]",
              params: { orderId },
            })
          }
        >
          <Text style={styles.btnText}>View Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnOutline, { borderColor: theme.border }]}
          onPress={() => router.replace("/(customer)/home")}
        >
          <Text style={[styles.btnOutlineText, { color: theme.text }]}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Row({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: any;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: { fontSize: 26, fontWeight: "900", marginBottom: 6 },
  sub: { fontSize: 14, marginBottom: 4 },
  card: {
    marginTop: 16,
    width: "100%",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { fontSize: 13, color: "#94a3b8" },
  rowValue: { fontSize: 13, fontWeight: "700" },
  btnGroup: { width: "100%", gap: 12 },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontWeight: "900", fontSize: 15, color: "#000" },
  btnOutline: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutlineText: { fontWeight: "700", fontSize: 15 },
});
