import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
export default function FloatingCart({
  onOpen,
  bottomOffset = 20,
}: {
  onOpen: () => void;
  bottomOffset?: number;
}) {
  const { items } = useCart();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);

  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  // 🔥 Animation (smooth entry like Blinkit)
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (totalQty > 0) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [totalQty]);

  if (totalQty === 0) return null;

  return (
    <Animated.View
      style={[
        styles.outerWrapper,
        {
         bottom: insets.bottom + bottomOffset,
          transform: [{ translateY }],
        },
      ]}
    >
      <LinearGradient
        colors={[theme.primary, theme.card, theme.primary, theme.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBorder}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push("/book-pickup")}
          style={styles.innerWrapper}
        >
          <BlurView intensity={70} tint="dark" style={styles.blur}>

            {/* <View style={styles.topLine} /> */}

            {/* ICON + BADGE */}
            <View style={styles.iconWrap}>
              <Ionicons name="bag-outline" size={22} color="#fff" />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalQty}</Text>
              </View>
            </View>

            <Text style={styles.label}>Checkout</Text>

            <Ionicons name="arrow-forward" size={14} color="#fff" />
          </BlurView>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

/* ================= STYLES ================= */

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({

  outerWrapper: {
    position: "absolute",   // ✅ REQUIRED (makes it floating)
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,           // ✅ above everything
    elevation: 50,          // ✅ Android fix
  },

  gradientBorder: {
    borderRadius: 50,
    padding: 2,
    shadowColor: theme.primary,
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
  },

  topLine: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 0.5,
    backgroundColor: theme.card,
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
    backgroundColor: theme.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: theme.card,
  },

  badgeText: {
    color: theme.primary,
    fontSize: 8,
    fontWeight: "700",
  },

  label: {
    color: "#EDFAF6",
    fontSize: 13,
    fontWeight: "800",
  },
});