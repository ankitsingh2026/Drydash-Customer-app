import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function SuccessModal({
  visible,
  address,
  orderId,
  onHome,
  onTrack,
}: {
  visible: boolean;
  address?: string;
  orderId?: string;
  onHome: () => void;
  onTrack?: () => void;
}) {
  const insets = useSafeAreaInsets();

  // Animation refs
  const bgGlow      = useRef(new Animated.Value(0)).current;
  const circleScale = useRef(new Animated.Value(0)).current;
  const circleGlow  = useRef(new Animated.Value(0)).current;
  const checkScale  = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const titleY      = useRef(new Animated.Value(24)).current;
  const titleOpacity= useRef(new Animated.Value(0)).current;
  const addrY       = useRef(new Animated.Value(20)).current;
  const addrOpacity = useRef(new Animated.Value(0)).current;
  const btnY        = useRef(new Animated.Value(40)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;
  // Pulse loop for circle glow
  const pulseAnim   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    // Reset
    [bgGlow, circleScale, circleGlow, checkScale, checkRotate,
     titleY, titleOpacity, addrY, addrOpacity, btnY, btnOpacity].forEach(
      (a) => a.setValue(typeof a === "object" ? 0 : 0)
    );
    bgGlow.setValue(0); circleScale.setValue(0); circleGlow.setValue(0);
    checkScale.setValue(0); checkRotate.setValue(0);
    titleY.setValue(24); titleOpacity.setValue(0);
    addrY.setValue(20); addrOpacity.setValue(0);
    btnY.setValue(40); btnOpacity.setValue(0);
    pulseAnim.setValue(1);

  Animated.sequence([
  // 1. Background glow
  Animated.timing(bgGlow, {
    toValue: 1, duration: 400,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true,
  }),
  // 2. Circle springs in
  Animated.spring(circleScale, {
    toValue: 1, friction: 5, tension: 60,
    useNativeDriver: true,
  }),
  // 3. Checkmark bounces in
  Animated.parallel([
    Animated.spring(checkScale, {
      toValue: 1, friction: 4, tension: 80,
      useNativeDriver: true,
    }),
    Animated.timing(checkRotate, {
      toValue: 1, duration: 300,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1), // replaces Easing.back(1.5)
      useNativeDriver: true,
    }),
  ]),
  // 4. Title slides up
  Animated.parallel([
    Animated.timing(titleOpacity, {
      toValue: 1, duration: 320,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(titleY, {
      toValue: 0, duration: 320,
      easing: Easing.bezier(0.33, 1, 0.68, 1), // replaces Easing.cubic
      useNativeDriver: true,
    }),
  ]),
  // 5. Address fades in
  Animated.parallel([
    Animated.timing(addrOpacity, {
      toValue: 1, duration: 280,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.timing(addrY, {
      toValue: 0, duration: 280,
      easing: Easing.bezier(0.33, 1, 0.68, 1),
      useNativeDriver: true,
    }),
  ]),
  // 6. Button slides up
  Animated.parallel([
    Animated.timing(btnOpacity, {
      toValue: 1, duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
    Animated.spring(btnY, {
      toValue: 0, friction: 7, tension: 50,
      useNativeDriver: true,
    }),
  ]),
]).start(() => {
  // Pulse loop — replaces Easing.sine
  Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.18, duration: 1000,
        easing: Easing.bezier(0.45, 0, 0.55, 1),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1, duration: 1000,
        easing: Easing.bezier(0.45, 0, 0.55, 1),
        useNativeDriver: true,
      }),
    ])
  ).start();
    setTimeout(() => {
    onHome();
  }, 1000);
});
  }, [visible]);

  const checkSpin = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-20deg", "0deg"],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[s.root, { paddingTop: insets.top + 90, paddingBottom: insets.bottom + 24 }]}>

        {/* Radial glow behind circle */}
        <Animated.View
          style={[s.radialGlow, { opacity: bgGlow, transform: [{ scale: pulseAnim }] }]}
        />

        {/* ── TOP ── */}
        <View style={s.topContent}>

          {/* Outer pulse ring */}
          <Animated.View style={[s.pulseRing, { transform: [{ scale: pulseAnim }] }]} />

          {/* Circle */}
          <Animated.View style={[s.circle, { transform: [{ scale: circleScale }] }]}>
            <Animated.View style={{ transform: [{ scale: checkScale }, { rotate: checkSpin }] }}>
              <Ionicons name="checkmark" size={46} color="#ffffff" />
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
            <Ionicons name="location-outline" size={16} color="#7FAF9B" style={{ marginTop: 1 }} />
            <Text style={s.addrText} numberOfLines={2}>
              {address ?? "742 Evergreen Terrace, Springfield"}
            </Text>
          </Animated.View>

        </View>

        {/* ── BOTTOM ── */}
        <Animated.View
          style={[s.btnWrap, { opacity: btnOpacity, transform: [{ translateY: btnY }] }]}
        >
          <TouchableOpacity style={s.btnPrimary} onPress={onHome} activeOpacity={0.85}>
            <Text style={s.btnPrimaryText}>Back to Home</Text>
          </TouchableOpacity>

          {onTrack && (
            <TouchableOpacity style={s.btnSecondary} onPress={onTrack} activeOpacity={0.7}>
              <Text style={s.btnSecondaryText}>Track Order</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#021410",
    justifyContent: "space-between",
    paddingHorizontal: 28,
  },

  // Soft radial green glow in background
  radialGlow: {
    position: "absolute",
    top: "14%",
    alignSelf: "center",
    width: 300,
    height: 300,
    borderRadius: 170,
    backgroundColor: "rgba(39,226,164,0.07)",
    // layered shadow trick for radial feel
    shadowColor: "#27E2A4",
    shadowOpacity: 0.45,
    shadowRadius: 80,
    elevation: 0,
  },

  topContent: {
    alignItems: "center",
    marginTop: 60,
  },

  // Pulsing outer ring (larger, transparent)
  pulseRing: {
    position: "absolute",
    top: -18,
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: "rgba(39,226,164,0.18)",
  },

  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#27E2A4",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#27E2A4",
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 14,
  },

  title: {
    color: "#CFFFF1",
    fontSize:24,
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
  color: "#7FAF9B",
  fontSize: 18,
  lineHeight: 20,
  textAlign: "center",   // ✅ add this
  flexShrink: 1,         // ✅ replaces flex:1 — shrinks if needed but won't expand
},

  btnWrap: {
    gap: 12,
  },

  btnPrimary: {
    backgroundColor: "#27E2A4",
    borderRadius: 50,
    paddingVertical: 17,
    alignItems: "center",
    shadowColor: "#27E2A4",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },

  btnPrimaryText: {
    fontWeight: "800",
    fontSize: 16,
    color: "#052B25",
    letterSpacing: 0.3,
  },

  btnSecondary: {
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#12332A",
  },

  btnSecondaryText: {
    color: "#7FAF9B",
    fontWeight: "700",
    fontSize: 15,
  },
});