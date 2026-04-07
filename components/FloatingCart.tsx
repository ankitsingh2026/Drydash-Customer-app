import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCart } from "../context/CartContext";

export default function FloatingCart({ onOpen }: { onOpen: () => void }) {
  const { items } = useCart();
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  if (totalQty === 0) return null;

  return (
    <View style={styles.outerWrapper}>
      
      {/* 🔥 GRADIENT BORDER */}
      <LinearGradient
        colors={["#00E1A2", "#22EBAB", "#006B50", "#00E1A2"]}
        start={{ x: -1, y: -1 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        {/* INNER BUTTON */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onOpen}
          style={styles.innerWrapper}
        >
          <BlurView intensity={70} tint="dark" style={styles.blur}>
            
            {/* TOP LINE */}
            <View style={styles.topLine} />

            {/* ICON + BADGE */}
            <View style={styles.iconWrap}>
              <Ionicons name="bag-outline" size={22} color="#00E1A2" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalQty}</Text>
              </View>
            </View>

            {/* LABEL */}
            <Text style={styles.label}>View cart</Text>

            {/* ARROW */}
            <Ionicons name="arrow-forward" size={14} color="#00E1A2" />

          </BlurView>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({

  outerWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },

  gradientBorder: {
    borderRadius: 50,
    padding: 2,
    shadowColor: "#00E1A2",
    shadowOpacity: 0.7,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  innerWrapper: {
    borderRadius: 50,
    overflow: "hidden",
  },

  blur: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "rgba(8, 22, 18, 0.85)",
  },

  topLine: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 0.5,
    backgroundColor: "rgba(86,191,171,0.4)",
  },

  iconWrap: {
    position: "relative",
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#0F6E56",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(8,22,18,0.9)",
  },

  badgeText: {
    color: "#9FE1CB",
    fontSize: 8,
    fontWeight: "700",
  },

  label: {
    color: "#EDFAF6",
    fontSize: 13,
    fontWeight: "800",
  },
});