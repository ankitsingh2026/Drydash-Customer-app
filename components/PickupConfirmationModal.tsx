
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import GroundSvg from "@/assets/bookAnim/ground.svg";

const { width: W } = Dimensions.get("window");
const GLOBE_W = 1000;
const GLOBE_H = (1691 / 1710) * GLOBE_W; 

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
  /** Called after phase-2 animation completes - parent should navigate */
  onDismiss: () => void;
}

export default function PickupConfirmationModal({
  visible,
  confirmed,
  address,
  slotLabel,
  onDismiss,
}: Props) {
  const insets = useSafeAreaInsets();

  // ── Phase tracking ─────────────────────────────────────────────────────
  const [phase, setPhase] = useState<"loading" | "confirmed">("loading");
  const dismissCalledRef = useRef(false);

  // ── Ground rotation loop ──────────────────────────────────────────────
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateAnimLoop = useRef<Animated.CompositeAnimation | null>(null);

  // ── Scooter position (horizontal slide out to the right on confirm) ────
  const scooterX = useRef(new Animated.Value(0)).current;
  const scooterOpacity = useRef(new Animated.Value(1)).current;

  // ── Confirmed-phase animations ─────────────────────────────────────────
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const cardY = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  // ── Lottie refs ────────────────────────────────────────────────────────
  const scooterRef = useRef<LottieView>(null);
  const confirmRef = useRef<LottieView>(null);
  const [showConfirmLottie, setShowConfirmLottie] = useState(false);

  // ─── Reset on open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      dismissCalledRef.current = false;
      setPhase("loading");
      setShowConfirmLottie(false);

      // Reset animated values
      rotateAnim.setValue(0);
      scooterX.setValue(0);
      scooterOpacity.setValue(1);
      bgOpacity.setValue(0);
      titleOpacity.setValue(0);
      titleY.setValue(20);
      cardY.setValue(60);
      cardOpacity.setValue(0);

      // Start continuous ground rotation
      startGroundRotate();

      // Play scooter lottie
      setTimeout(() => scooterRef.current?.play(), 100);
    } else {
      // Stop animations when hidden
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

  // ─── Continuous Rotation Loop (Right-to-Left on Fixed Axis) ──────────────
  const startGroundRotate = () => {
    rotateAnim.setValue(0);
    const loop = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 18000, // 18s for majestic continuous 360-degree rotation
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    rotateAnimLoop.current = loop;
    loop.start();
  };

  const groundRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"], // Counter-clockwise rotation: ground moves Right -> Left
  });

  // ─── Phase-2 sequence ──────────────────────────────────────────────────
  const triggerConfirmAnimation = () => {
    // 1. Initial hold in center for 1.6s so user perceives the riding moment
    setTimeout(() => {
      // 2. Scooter accelerates smoothly off to the right edge over 1.2s
      Animated.parallel([
        Animated.timing(scooterX, {
          toValue: W + 200,
          duration: 1200,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(scooterOpacity, {
          toValue: 0,
          duration: 800,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Stop ground rotation loop
        rotateAnimLoop.current?.stop();

        // Switch to confirmed phase
        setPhase("confirmed");

        // Fade in green background
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          // Show confirmation checkmark lottie
          setShowConfirmLottie(true);
          setTimeout(() => confirmRef.current?.play(), 50);

          // Animate title
          Animated.parallel([
            Animated.timing(titleOpacity, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(titleY, {
              toValue: 0,
              duration: 350,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start();

          // Slide up confirmed card
          setTimeout(() => {
            Animated.parallel([
              Animated.timing(cardOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
              }),
              Animated.spring(cardY, {
                toValue: 0,
                friction: 8,
                tension: 80,
                useNativeDriver: true,
              }),
            ]).start();
          }, 250);

          // Auto-dismiss after animations settle
          setTimeout(() => {
            if (!dismissCalledRef.current) {
              dismissCalledRef.current = true;
              onDismiss();
            }
          }, 3000);
        });
      });
    }, 1600);
  };

  // ────────────────────────────────────────────────────────────────────────
  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 99999, backgroundColor: C.lightBg }]}>
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

            {/* Scooter + Rotating Globe stage */}
            <View style={styles.stage}>
              {/* Solid green base fill under globe connecting seamlessly to bottom section */}
              <View style={styles.stageGreenBase} />

              {/* Rotating Globe SVG (India Gate, Qutub Minar, Lotus Temple, Red Fort rotate behind scooter) */}
              <Animated.View
                style={[
                  styles.globeWrap,
                  {
                    transform: [{ rotate: groundRotation }],
                  },
                ]}
              >
                <GroundSvg width={GLOBE_W} height={GLOBE_H} />
              </Animated.View>

              {/* Scooter rider (lottie) - fixed at top center of green hill horizon */}
              <Animated.View
                style={[
                  styles.scooterWrap,
                  {
                    transform: [{ translateX: scooterX }],
                    opacity: scooterOpacity,
                  },
                ]}
              >
                <LottieView
                  ref={scooterRef}
                  source={require("@/assets/bookAnim/delivery-scooter-rider.json")}
                  style={styles.scooterLottie}
                  loop
                  autoPlay
                  speed={1}
                  resizeMode="contain"
                />
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

              {/* Checkmark lottie */}
              {showConfirmLottie && (
                <LottieView
                  ref={confirmRef}
                  source={require("@/assets/bookAnim/Confirmation.json")}
                  style={styles.confirmLottie}
                  loop={false}
                  autoPlay
                  speed={1.2}
                  resizeMode="contain"
                />
              )}
            </View>

            {/* Bottom pickup info card */}
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
                <View style={styles.scheduledRow}>
                  <View style={styles.scheduledBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={C.green}
                    />
                    <Text style={styles.scheduledBadgeText}>
                      PICKUP SCHEDULED
                    </Text>
                  </View>
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

              <TouchableOpacity
                style={styles.returnBtn}
                onPress={() => {
                  if (!dismissCalledRef.current) {
                    dismissCalledRef.current = true;
                    onDismiss();
                  }
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.returnBtnText}>Return</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        )}
      </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.lightBg,
  },

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

  // Stage (globe + scooter)
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
    bottom: -570, // Creates wide gentle arc matching target Image 2
    alignSelf: "center",
    zIndex: 10,
  },
  scooterWrap: {
    position: "absolute",
    bottom: 272, // Lifted so wheels sit perfectly on top of green hill curve
    alignSelf: "center",
    zIndex: 100, // Guaranteed on top of globe and green base
  },
  scooterLottie: {
    width: 145,
    height: 108,
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
    marginBottom: 28,
  },
  confirmLottie: {
    width: 140,
    height: 140,
  },

  // Bottom card in Phase 2
  confirmedCard: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  confirmedCardInner: {
    paddingVertical: 8,
  },
  scheduledRow: {
    marginBottom: 8,
  },
  scheduledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    marginTop: 4,
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
    marginTop: 18,
    backgroundColor: C.green,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 4,
  },
  returnBtnText: {
    color: C.white,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
