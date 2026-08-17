
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import GroundSvg from "@/assets/bookAnim/Ground.svg";
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
  textMuted: "#5A736E",
  cardBorder: "#E0EDEA",
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
   * Called at the VERY START of the exit animation (before it finishes).
   * Use this to trigger router.replace so the home screen loads underneath
   * while the card is still animating upward.
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
  const titleY = useRef(new Animated.Value(20)).current;
  // Card sweeps up from below screen, exits by continuing upward on dismiss
  const cardY = useRef(new Animated.Value(SCREEN_H)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // ── Lottie ref for confirmation checkmark ─────────────────────────────
  const confirmRef = useRef<LottieView>(null);
  const [showConfirmLottie, setShowConfirmLottie] = useState(false);

  // ─── Exit: navigate first, then fade overlay after home is the active screen ───
  const animateOutAndDismiss = useCallback(() => {
    if (dismissCalledRef.current) return;
    dismissCalledRef.current = true;

    // ▶ Fire router.replace to home immediately
    onNavigate?.();

    // Keep overlay fully opaque while the stack transition commits.
    // Once home is the active screen (~150ms), fade the overlay out smoothly.
    // This ensures book-pickup NEVER shows through the fade.
    setTimeout(() => {
      Animated.timing(visibilityAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        onDismiss();
      });
    }, 150);
  }, [visibilityAnim, onNavigate, onDismiss]);

  // ─── Show / hide via opacity (component always stays mounted) ──────────
  useEffect(() => {
    Animated.timing(visibilityAnim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 60 : 200,
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
      titleY.setValue(20);
      cardY.setValue(SCREEN_H);
      cardOpacity.setValue(0);

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

  // ─── Phase-2 sequence ──────────────────────────────────────────────────
  const triggerConfirmAnimation = () => {
    // 1. Brief hold (500ms) — just enough to perceive the rider
    setTimeout(() => {
      // 2. Rider accelerates off to the right (700ms)
      Animated.parallel([
        Animated.timing(riderX, {
          toValue: W + 200,
          duration: 700,
          easing: Easing.bezier(0.4, 0, 1, 1),
          useNativeDriver: true,
        }),
        Animated.timing(riderOpacity, {
          toValue: 0,
          duration: 450,
          delay: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        rotateAnimLoop.current?.stop();

        // 3. Switch to confirmed phase, fade in green bg (250ms)
        setPhase("confirmed");
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          // 4. Show checkmark lottie + title (simultaneously, fast)
          setShowConfirmLottie(true);
          confirmRef.current?.play();

          Animated.parallel([
            Animated.timing(titleOpacity, {
              toValue: 1,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(titleY, {
              toValue: 0,
              duration: 250,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start();

          // 5. Card sweeps up from bottom of screen (spring, snappy)
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(cardOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.spring(cardY, {
                toValue: 0,
                friction: 7,
                tension: 72,
                useNativeDriver: true,
              }),
            ]).start();
          }, 150);

          // 6. Auto-dismiss after 1s on confirmed screen, then fast fade to home
          setTimeout(() => {
            animateOutAndDismiss();
          }, 1000);
        });
      });
    }, 500);
  };

  // ── Always rendered; visibility controlled via opacity ──────────────────
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

              {/* Rider SVG (replaces Lottie scooter) */}
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
            <View
              style={[
                styles.confirmedTop,
                { paddingTop: insets.top + 32 },
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

              {/* Confirmation checkmark lottie */}
              {showConfirmLottie && (
                <LottieView
                  ref={confirmRef}
                  source={require("@/assets/bookAnim/Confirmation.json")}
                  style={styles.confirmLottie}
                  loop={false}
                  autoPlay
                  speed={1.3}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Bottom pickup info card — sweeps up from below screen */}
            <Animated.View
              style={[
                styles.confirmedCard,
                {
                  opacity: cardOpacity,
                  transform: [{ translateY: cardY }],
                  paddingBottom: insets.bottom + 16,
                },
              ]}
            >
              {/* Pickup scheduled badge & slot */}
              <View style={styles.confirmedCardInner}>
                <View style={styles.scheduledBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={C.green} />
                  <Text style={styles.scheduledBadgeText}>PICKUP SCHEDULED</Text>
                </View>

                <Text style={styles.pickupLabel}>Pickup</Text>
                {slotLabel ? (
                  <Text style={styles.slotText}>{slotLabel}</Text>
                ) : null}
              </View>

              <View style={styles.divider} />

              <View style={styles.confirmedCardInner}>
                <Text style={styles.addrConfirmedText} numberOfLines={3}>
                  {address || ""}
                </Text>
              </View>

              {/* Manual dismiss — triggers the slide-up exit animation */}
              <TouchableOpacity
                style={styles.returnBtn}
                onPress={animateOutAndDismiss}
                activeOpacity={0.85}
              >
                <Text style={styles.returnBtnText}>Return to Home</Text>
              </TouchableOpacity>
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
    bottom: 272,        // sits on top of the green hill arc
    alignSelf: "center",
    zIndex: 100,
  },

  // Bottom green address section
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
    justifyContent: "space-between",
  },
  confirmedTop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  confirmedTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: C.white,
    textAlign: "center",
    letterSpacing: 1,
    lineHeight: 42,
    marginBottom: 24,
  },
  confirmLottie: {
    width: 140,
    height: 140,
  },

  // Bottom card — sweeps up on enter, slides further up on exit (into home)
  confirmedCard: {
    backgroundColor: C.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 22,
  },
  confirmedCardInner: {
    paddingVertical: 6,
  },
  scheduledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  scheduledBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: C.green,
    letterSpacing: 0.5,
  },
  pickupLabel: {
    fontSize: 14,
    color: C.textMuted,
    marginTop: 2,
  },
  slotText: {
    fontSize: 18,
    fontWeight: "800",
    color: C.textDark,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: C.cardBorder,
    marginVertical: 10,
  },
  addrConfirmedText: {
    fontSize: 15,
    color: C.textDark,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  returnBtn: {
    marginTop: 16,
    backgroundColor: C.green,
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
    marginHorizontal: 4,
    marginBottom: 4,
  },
  returnBtnText: {
    color: C.white,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
