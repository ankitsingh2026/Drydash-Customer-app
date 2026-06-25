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

export default function PaymentFailure() {
  
  const { theme } = useTheme();
  const styles = makeStyles(theme);

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

  const { orderId, amount, reason } = useLocalSearchParams<{
    orderId: string;
    amount: string;
    reason: string;
  }>();

  const parsedReason = React.useMemo(() => {
    if (!reason) return "Something went wrong. Please try again.";
    try {
      const parsed = JSON.parse(reason);
      if (parsed?.error?.description) {
        return parsed.error.description;
      }
      if (parsed?.error?.reason) {
        return parsed.error.reason;
      }
      if (parsed?.message) {
        return parsed.message;
      }
      return reason;
    } catch (e) {
      return reason;
    }
  }, [reason]);

  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
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

      {/* FAILURE ICON */}
      <Animated.View
        style={[
          styles.iconCircle,
          { transform: [{ scale }], opacity: fade },
        ]}
      >
        <Ionicons name="close" size={64} color={theme.text} />
      </Animated.View>

      {/* TEXT */}
      <Animated.View style={{ opacity: fade, alignItems: "center" }}>
        <Text style={[styles.title, { color: theme.text }]}>
          Payment Failed
        </Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          {parsedReason}
        </Text>

        {/* DETAILS CARD */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Row label="Order ID" value={`#${orderId}`} theme={theme} />
          <Row label="Amount" value={`₹${amount}`} theme={theme} />
          <Row label="Status" value="Failed ❌" theme={theme} />
        </View>
      </Animated.View>

      {/* BUTTONS */}
      <View style={styles.btnGroup}>
        {/* Try Again — goes back to order receipt */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: theme.primary }]}
          onPress={() =>
            router.replace({
              pathname: "/(customer)/orders/[orderId]",
              params: { orderId },
            })
          }
        >
          <Text style={styles.btnText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btnOutline, { borderColor: theme.border }]}
          onPress={() => router.replace("/(customer)/home" as any)}
        >
          <Text style={[styles.btnOutlineText, { color: theme.text }]}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
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
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B6B",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  title: { fontSize: 26, fontWeight: "900", marginBottom: 6 },
  sub: { fontSize: 14, marginBottom: 4, textAlign: "center", marginHorizontal: 20, lineHeight: 22 },
  card: {
    marginTop: 24,
    width: "100%",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: { fontSize: 13, color: theme.textSecondary },
  rowValue: { fontSize: 13, fontWeight: "700" },
  btnGroup: { width: "100%", gap: 12 },
  btn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontWeight: "900", fontSize: 15, color: theme.background },
  btnOutline: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  btnOutlineText: { fontWeight: "700", fontSize: 15 },
});