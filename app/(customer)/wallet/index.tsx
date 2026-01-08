// app/(customer)/wallet/index.tsx
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Plus, Wallet } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";

export default function WalletPage() {
  const { theme } = useTheme();
  const router = useRouter();

  // Entry animation
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Wallet
        </Text>

        <View style={{ width: 22 }} />
      </View>

      <Animated.View
        style={{
          opacity: fade,
          transform: [{ translateY: slide }],
        }}
      >
        {/* BALANCE CARD */}
        <View
          style={[
            styles.balanceCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.balanceRow}>
            <Wallet size={22} color={theme.primary} />
            <Text style={[styles.balanceLabel, { color: theme.subText }]}>
              Wallet Balance
            </Text>
          </View>

          <Text style={[styles.balance, { color: theme.text }]}>
            ₹ 1,240
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.topUpBtn, { backgroundColor: theme.primary }]}
          >
            <Plus size={16} color="#000" />
            <Text style={styles.topUpText}>Top Up Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* TRANSACTIONS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Transactions
          </Text>

          <View
            style={[
              styles.transactionCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={{ color: theme.subText }}>
              No recent transactions
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    marginTop:40,
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
  },

  balanceCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },

  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  balanceLabel: {
    fontSize: 13,
    fontWeight: "700",
  },

  balance: {
    fontSize: 36,
    fontWeight: "900",
    marginVertical: 14,
  },

  topUpBtn: {
    height: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  topUpText: {
    fontWeight: "900",
    color: "#000",
    fontSize: 14,
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },

  transactionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
});
