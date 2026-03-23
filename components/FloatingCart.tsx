// components/FloatingCart.tsx
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCart } from "../context/CartContext";

export default function FloatingCart({ onOpen }: { onOpen: () => void }) {
  const { items } = useCart();

  const totalQty   = items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = items.reduce((s, i) => s + i.qty * i.price, 0);

  if (totalQty === 0) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onOpen}
      style={styles.wrapper}
    >
      {/* ── Frosted glass base ── */}
      <BlurView intensity={55} tint="dark" style={styles.blur}>

        {/* Thin top highlight line */}
        <View style={styles.topLine} pointerEvents="none" />

        {/* ── Left: price ── */}
        <View style={styles.priceRow}>
          <Text style={styles.rupee}>₹</Text>
          <Text style={styles.amount}>{totalPrice}</Text>
          <Text style={styles.estLabel}> Est. Total</Text>
        </View>

        {/* ── Right: gradient CTA ── */}
        <LinearGradient
          colors={["#56BFAB", "#005B47"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaBtn}
        >
          <Text style={styles.ctaText}>View Cart</Text>
        </LinearGradient>

      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 55,
    borderRadius: 18,
    overflow: "hidden",
    // Teal glow shadow
    shadowColor: "#56BFAB",
    shadowOpacity: 0.28,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 18,
    // Subtle teal border
    borderWidth: 1,
    borderColor: "rgba(86,191,171,0.22)",
  },

  blur: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 52,
    // Dark tint over blur for contrast
    backgroundColor: "rgba(10, 28, 24, 0.45)",
  },

  /* Top-edge highlight streak */
  topLine: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(86,191,171,0.35)",
    borderRadius: 1,
  },

  /* ── Price left ── */
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  rupee: {
    color: "#C5EDE5",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 1,
  },
  amount: {
    color: "#EDFAF6",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  estLabel: {
    color: "rgba(197,237,229,0.55)",
    fontSize: 11.5,
    fontWeight: "400",
    marginLeft: 4,
    letterSpacing: 0.1,
  },

  /* ── Gradient CTA pill ── */
  ctaBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ctaText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});