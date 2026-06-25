import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";
import { router } from "expo-router";

export function SuccessModal({
  visible,
  address,
  orderId,
  onHome,
}: {
  visible: boolean;
  address?: string;
  orderId?: string;
  onHome: () => void;
}) {
  const { theme, isDark } = useTheme()
  const styles = makeStyles(theme, isDark);
  const s = makeStyles(theme, isDark);
  const insets = useSafeAreaInsets();

  // Animation refs
  const bgGlow = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const circleGlow = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const addrY = useRef(new Animated.Value(20)).current;
  const addrOpacity = useRef(new Animated.Value(0)).current;

  // const btnOpacity = useRef(new Animated.Value(0)).current;
  // Pulse loop for circle glow
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse loop — replaces Easing.sine
  useEffect(() => {
    if (!visible) return;

    // RESET
    bgGlow.setValue(0);
    circleScale.setValue(0);
    checkScale.setValue(0);
    checkRotate.setValue(0);
    titleY.setValue(24);
    titleOpacity.setValue(0);
    addrY.setValue(20);
    addrOpacity.setValue(0);

    // btnOpacity.setValue(0);

    // FAST + SMOOTH ANIMATION
    Animated.parallel([
      Animated.spring(circleScale, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),

      Animated.spring(checkScale, {
        toValue: 1,
        friction: 4,
        tension: 200, // 🔥 faster
        useNativeDriver: true,
      }),

      Animated.timing(checkRotate, {
        toValue: 1,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),

      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(titleY, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),

      Animated.timing(addrOpacity, {
        toValue: 1,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(addrY, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),



    ]).start();
  }, [visible]);


useEffect(() => {
  if (!visible) return;

  const t = setTimeout(() => {
    router.replace({
      pathname: "/(customer)/(tabs)/home",
      params: { orderPlaced: "1" },
    });
  }, 1200); // enough time for the animation to be seen

  return () => clearTimeout(t);
}, [visible]);

  const checkSpin = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-20deg", "0deg"],
  });

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={[s.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24, opacity:1 }]}>
        <View style={s.topContent}>
          <Animated.View style={[s.circle, { transform: [{ scale: circleScale }] }]}>
            <Animated.View style={{ transform: [{ scale: checkScale }, { rotate: checkSpin }] }}>
              <Ionicons name="checkmark" size={46} color={theme.background} />
            </Animated.View>
          </Animated.View>

          {/* Title */}
          <Animated.Text
            style={[s.title, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
          >
            Pickup{"\n"}Confirmed!
          </Animated.Text>

          {/* Address row */}
          <Animated.View
            style={[s.addrRow, { opacity: addrOpacity, transform: [{ translateY: addrY }] }]}
          >
            <Ionicons name="location-outline" size={16} color={theme.textSecondary} style={{ marginTop: 1 }} />
            <Text style={s.addrText} numberOfLines={2}>
              {address ?? ""}
            </Text>
          </Animated.View>

        </View>

        {/* ── BOTTOM ── */}

      </View>
    </Modal>
  );

}

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: "center",   // 🔥 FIX
    alignItems: "center",
    paddingHorizontal: 44,
  }, btnWrap: {
    gap: 12,
    marginTop: 10, // 👈 spacing from center
    width: "100%",
  },

  // Soft radial green glow in background
  radialGlow: {
    position: "absolute",
    top: "14%",
    alignSelf: "center",
    width: 300,
    height: 300,
    borderRadius: 170,
    backgroundColor: theme.card,
    // layered shadow trick for radial feel
    shadowColor: theme.primary,
    shadowOpacity: 0.45,
    shadowRadius: 80,
    elevation: 0,
  },

  topContent: {
    alignItems: "center",
    marginTop: 20,
  },

  // Pulsing outer ring (larger, transparent)
  pulseRing: {
    position: "absolute",
    top: -18,
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: theme.card,
  },

  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.primary,
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 14,
  },

  title: {
    color: theme.text,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 28,
    lineHeight: 30,
    letterSpacing: 0.4,
  },

  addrRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 68,
    gap: 6,
    paddingHorizontal: 1,  // keeps it from touching screen edges
  },

  addrText: {
    color: theme.textSecondary,
    fontSize: 18,
    lineHeight: 20,
    textAlign: "center",   // ✅ add this
    flexShrink: 1,         // ✅ replaces flex:1 — shrinks if needed but won't expand
  },


  btnPrimary: {
    backgroundColor: theme.primary,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: theme.primary,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },

  btnPrimaryText: {
    fontWeight: "900",
    fontSize: 16,
    color: theme.background,
    letterSpacing: 0.4,
  },

  btnSecondary: {
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.card,
    backgroundColor: theme.card,
  },

  btnSecondaryText: {
    color: theme.primary,
    fontWeight: "800",
    fontSize: 15,
  },
});