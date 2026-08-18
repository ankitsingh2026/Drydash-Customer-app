import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import GroundSvg from "@/assets/bookAnim/GroundNew.svg";
import RiderSvg from "@/assets/bookAnim/Rider.svg";

const { width: W, height: SCREEN_H } = Dimensions.get("window");
const GLOBE_W = 1000;
const GLOBE_H = (1691 / 1710) * GLOBE_W;

// ── Rider dimensions (SVG static image) ──────────────────────────────────
const RIDER_W = 160;
const RIDER_H = 120;

// ── Colours ───────────────────────────────────────────────────────────────
const C = {
  green: "#007558",
  lightBg: "#F4F9F7",
  white: "#FFFFFF",
  textDark: "#0A251E",
  textMuted: "#6B7280",
  cardBorder: "#E5E7EB",
  pillBg: "#F9FAFB",
};

interface Props {
  /** Whether the modal is open */
  visible: boolean;
  /** Set to true when the booking API succeeds -> triggers phase 2 */
  confirmed: boolean;
  /** Pickup address string shown in both phases */
  address?: string;
  /** Pickup slot string, e.g. "Today before 3 PM" */
  slotLabel?: string;
  /**
   * Called when screen expansion finishes to trigger navigation to home screen
   */
  onNavigate?: () => void;
  /** Called after the exit animation fully completes — hide the overlay here */
  onDismiss: () => void;
}

export default function PickupConfirmationModal({
  visible,
  confirmed,
  address,
  slotLabel,
  onNavigate,
  onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();

  // ── Phase tracking ─────────────────────────────────────────────────────
  const [phase, setPhase] = useState<"loading" | "confirmed">("loading");
  const dismissCalledRef = useRef(false);

  // ── Visibility – opacity-based so component stays mounted & assets stay warm
  const visibilityAnim = useRef(new Animated.Value(0)).current;

  // ── Ground rotation loop ──────────────────────────────────────────────
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateAnimLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ── Rider position (horizontal slide out to the right on confirm) ──────
  const riderX = useRef(new Animated.Value(0)).current;
  const riderOpacity = useRef(new Animated.Value(1)).current;

  // ── Confirmed-phase animations ─────────────────────────────────────────
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(15)).current;

  // Bottom sheet entrance (from bottom of screen)
  const cardEntranceAnim = useRef(new Animated.Value(180)).current;
  const cardEntranceOpacity = useRef(new Animated.Value(0)).current;

  // Upward expansion to make complete screen white (0 -> 1)
  const expandAnim = useRef(new Animated.Value(0)).current;

  // ── Lottie ref for confirmation checkmark ─────────────────────────────
  const confirmRef = useRef<LottieView>(null);
  const [showConfirmLottie, setShowConfirmLottie] = useState(false);

  // ─── Show / hide via opacity ─────────────────────────────────────────
  useEffect(() => {
    Animated.timing(visibilityAnim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 50 : 150,
      useNativeDriver: true,
    }).start();

    if (visible) {
      // Reset all state for fresh animation
      dismissCalledRef.current = false;
      setPhase("loading");
      setShowConfirmLottie(false);

      rotateAnim.setValue(0);
      riderX.setValue(0);
      riderOpacity.setValue(1);
      bgOpacity.setValue(0);
      titleOpacity.setValue(0);
      titleY.setValue(15);
      cardEntranceAnim.setValue(180);
      cardEntranceOpacity.setValue(0);
      expandAnim.setValue(0);

      // Start continuous ground rotation
      startGroundRotate();
    } else {
      rotateAnimLoop.current?.stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // ─── React to confirmed prop ────────────────────────────────────────────
  useEffect(() => {
    if (confirmed && phase === "loading") {
      triggerConfirmAnimation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmed]);

  // ─── Continuous Rotation Loop ─────────────────────────────────────────
  const startGroundRotate = () => {
    rotateAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateAnimLoop.current = loop;
    loop.start();
  };

  const groundRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  // ─── Phase-2 Fast & Smooth Sequence ──────────────────────────────────
  const triggerConfirmAnimation = () => {
    // 1. Snappy transition: Rider rides off (300ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(riderX, {
          toValue: W + 180,
          duration: 320,
          easing: Easing.bezier(0.4, 0, 1, 1),
          useNativeDriver: true,
        }),
        Animated.timing(riderOpacity, {
          toValue: 0,
          duration: 200,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        rotateAnimLoop.current?.stop();

        // 2. Switch to confirmed phase, fade in green bg (150ms)
        setPhase("confirmed");
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }).start(() => {
          // 3. Show checkmark + title + bottom sheet
          setShowConfirmLottie(true);
          confirmRef.current?.play();

          Animated.parallel([
            Animated.timing(titleOpacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(titleY, {
              toValue: 0,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(cardEntranceOpacity, {
              toValue: 1,
              duration: 220,
              useNativeDriver: false,
            }),
            Animated.spring(cardEntranceAnim, {
              toValue: 0,
              friction: 9,
              tension: 80,
              useNativeDriver: false,
            }),
          ]).start();

          // 4. Hold (1150ms) so the full checkbox/checkmark animation finishes and is clearly seen
          setTimeout(() => {
            // Card suddenly moves up with smooth animation
            Animated.timing(expandAnim, {
              toValue: 1,
              duration: 360,
              easing: Easing.bezier(0.2, 0.9, 0.25, 1),
              useNativeDriver: false,
            }).start(() => {
              if (dismissCalledRef.current) return;
              dismissCalledRef.current = true;

              // Suddenly redirect to Home screen with smooth seamless handoff
              onNavigate?.();
              setTimeout(() => {
                onDismiss();
              }, 30);
            });
          }, 1150);
        });
      });
    }, 100);
  };

  // ─── Slot display helper ───────────────────────────────────────────────
  const renderSlotFormatted = (label?: string) => {
    if (!label) {
      return <Text style={styles.slotTextBold}>Today</Text>;
    }

    const match = label.match(/^(Today before|Tomorrow before)\s+(.+)$/i);
    if (match) {
      return (
        <Text style={styles.slotText}>
          <Text style={styles.slotPrefix}>{match[1]} </Text>
          <Text style={styles.slotTimeHighlight}>{match[2]}</Text>
        </Text>
      );
    }
    return <Text style={styles.slotTextBold}>{label}</Text>;
  };

  // ─── Sheet expansion interpolations ────────────────────────────────────
  const restingSheetHeight = 230 + insets.bottom;
  const initialTop = SCREEN_H - restingSheetHeight;

  // Sheet top position moves from bottom resting spot all the way to 0
  const sheetTop = Animated.add(
    cardEntranceAnim,
    expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [initialTop, 0],
    })
  );

  // Border top radius flattens as sheet covers the top of the screen
  const sheetBorderRadius = expandAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [36, 16, 0],
  });

  // Scheduled card smoothly translates to upper-middle portion of screen on expansion
  const scheduledCardTranslateY = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_H * 0.30],
  });

  // Address pill fades out during upward expansion
  const addressOpacity = expandAnim.interpolate({
    inputRange: [0, 0.2],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const addressTranslateY = expandAnim.interpolate({
    inputRange: [0, 0.2],
    outputRange: [0, 12],
    extrapolate: "clamp",
  });

  // Top confirmed title & checkmark fade out as white sheet sweeps over them
  const topContentOpacity = expandAnim.interpolate({
    inputRange: [0, 0.3],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 99999,
          opacity: visibilityAnim,
          pointerEvents: visible ? "auto" : "none",
        },
      ]}
    >
      <View style={{ flex: 1, backgroundColor: C.lightBg }}>

        {/* ── PHASE 1: Loading / scheduling ── */}
        {phase === "loading" && (
          <View style={styles.loadingPhase}>
            {/* Top text */}
            <View style={[styles.topTextWrap, { paddingTop: insets.top + 28 }]}>
              <Text style={styles.schedulingTitle}>Scheduling your pickup</Text>
              <Text style={styles.schedulingSubtitle}>
                This will only take a few seconds.
              </Text>
            </View>

            {/* Rider SVG + Rotating Globe stage */}
            <View style={styles.stage}>
              {/* Solid green base fill */}
              <View style={styles.stageGreenBase} />

              {/* Rotating Globe SVG */}
              <Animated.View
                style={[
                  styles.globeWrap,
                  { transform: [{ rotate: groundRotation }] },
                ]}
              >
                <GroundSvg width={GLOBE_W} height={GLOBE_H} />
              </Animated.View>

              {/* Rider SVG */}
              <Animated.View
                style={[
                  styles.riderWrap,
                  {
                    transform: [{ translateX: riderX }],
                    opacity: riderOpacity,
                  },
                ]}
              >
                <RiderSvg width={RIDER_W} height={RIDER_H} />
              </Animated.View>
            </View>

            {/* Bottom green section with pickup address */}
            <View
              style={[
                styles.bottomAddrContainer,
                { paddingBottom: insets.bottom + 20 },
              ]}
            >
              <View style={styles.addrHeaderRow}>
                <Ionicons name="location-outline" size={18} color="#FFFFFF" />
                <Text style={styles.addrHeaderLabel}>PICKUP ADDRESS</Text>
              </View>
              <View style={styles.addrCardWhite}>
                <Text style={styles.addrCardText} numberOfLines={2}>
                  {address || ""}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── PHASE 2: Confirmed ── */}
        {phase === "confirmed" && (
          <Animated.View
            style={[styles.confirmedPhase, { opacity: bgOpacity }]}
          >
            {/* Top Header & Checkmark */}
            <Animated.View
              style={[
                styles.confirmedTop,
                {
                  paddingTop: insets.top + 32,
                  opacity: topContentOpacity,
                },
              ]}
            >
              {/* Title */}
              <Animated.Text
                style={[
                  styles.confirmedTitle,
                  {
                    opacity: titleOpacity,
                    transform: [{ translateY: titleY }],
                  },
                ]}
              >
                PICKUP{"\n"}CONFIRMED
              </Animated.Text>

              {/* Confirmation checkmark */}
              {showConfirmLottie ? (
                <LottieView
                  ref={confirmRef}
                  source={require("@/assets/bookAnim/Confirmation.json")}
                  style={styles.confirmLottie}
                  loop={false}
                  autoPlay
                  speed={1.2}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.checkCirclePlaceholder}>
                  <Ionicons name="checkmark" size={64} color="#FFFFFF" />
                </View>
              )}
            </Animated.View>

            {/* 
              ── EXPANDING WHITE SHEET CONTAINER ──
              Starts at the bottom with rounded corners (Image 1),
              then expands fast & smoothly up to make complete screen white (Image 2 & 3).
            */}
            <Animated.View
              style={[
                styles.expandingWhiteSheet,
                {
                  top: sheetTop,
                  height: SCREEN_H + 100,
                  borderTopLeftRadius: sheetBorderRadius,
                  borderTopRightRadius: sheetBorderRadius,
                  opacity: cardEntranceOpacity,
                },
              ]}
            >
              {/* Scheduled Card container */}
              <Animated.View
                style={[
                  styles.scheduledCardWrapper,
                  {
                    transform: [{ translateY: scheduledCardTranslateY }],
                  },
                ]}
              >
                {/* 1. PICKUP SCHEDULED Card */}
                <View style={styles.scheduledCard}>
                  <View style={styles.scheduledBadgeRow}>
                    <Ionicons name="checkmark-circle" size={17} color={C.green} />
                    <Text style={styles.scheduledBadgeText}>PICKUP SCHEDULED</Text>
                  </View>

                  <Text style={styles.pickupLabel}>Pickup</Text>
                  {renderSlotFormatted(slotLabel)}
                </View>

                {/* 2. Address Pill below card (fades out as card moves up) */}
                <Animated.View
                  style={[
                    styles.addressPill,
                    {
                      opacity: addressOpacity,
                      transform: [{ translateY: addressTranslateY }],
                    },
                  ]}
                >
                  <Text style={styles.addressPillText} numberOfLines={2}>
                    {address || "Address confirmed"}
                  </Text>
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Phase 1 ──────────────────────────────────────────────────────────
  loadingPhase: {
    flex: 1,
    backgroundColor: C.lightBg,
    justifyContent: "space-between",
  },
  topTextWrap: {
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 20,
  },
  schedulingTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: C.textDark,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  schedulingSubtitle: {
    fontSize: 16,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 22,
  },

  // Stage (globe + rider)
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  stageGreenBase: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 175,
    backgroundColor: C.green,
    zIndex: 1,
  },
  globeWrap: {
    position: "absolute",
    width: GLOBE_W,
    height: GLOBE_H,
    bottom: -570,
    alignSelf: "center",
    zIndex: 10,
  },
  riderWrap: {
    position: "absolute",
    bottom: 250,
    alignSelf: "center",
    zIndex: 100,
  },

  // Bottom green address section (Phase 1)
  bottomAddrContainer: {
    backgroundColor: C.green,
    paddingHorizontal: 18,
    paddingTop: 14,
    alignItems: "center",
    zIndex: 20,
  },
  addrHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  addrHeaderLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: C.white,
    letterSpacing: 1,
  },
  addrCardWhite: {
    backgroundColor: C.white,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  addrCardText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.textDark,
    textAlign: "center",
    lineHeight: 20,
  },

  // ── Phase 2 ──────────────────────────────────────────────────────────
  confirmedPhase: {
    flex: 1,
    backgroundColor: C.green,
  },
  confirmedTop: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    marginTop: 20,
  },
  confirmedTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: C.white,
    textAlign: "center",
    letterSpacing: 0.8,
    lineHeight: 40,
    marginBottom: 28,
  },
  confirmLottie: {
    width: 140,
    height: 140,
  },
  checkCirclePlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },

  // Expanding Sheet Container
  expandingWhiteSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: C.white,
    paddingHorizontal: 16,
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  scheduledCardWrapper: {
    width: "100%",
    gap: 12,
  },

  // Inner Scheduled Card
  scheduledCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  scheduledBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  scheduledBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: C.green,
    letterSpacing: 0.6,
  },
  pickupLabel: {
    fontSize: 13,
    color: C.textMuted,
    fontWeight: "500",
    marginTop: 4,
  },
  slotText: {
    fontSize: 17,
    marginTop: 4,
  },
  slotPrefix: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  slotTimeHighlight: {
    fontSize: 17,
    fontWeight: "800",
    color: C.green,
  },
  slotTextBold: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginTop: 4,
  },

  // Address pill
  addressPill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  addressPillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    lineHeight: 18,
  },
});
