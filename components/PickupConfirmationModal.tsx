import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { gsap } from "gsap";
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
   * Called when screen transition begins so home screen renders underneath
   */
  onNavigate?: () => void;
  /** Called after the flight animation fully completes — hide the overlay here */
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

  // ── Target Coordinates for Home Screen Docking ─────────────────────────
  // TabBar (~70px) + Search (~52px) + Hero Banner (250px + 12px margins = 262px) + insets.top = insets.top + 384px
  const targetHomeCardTop = insets.top + 384;
  const bottomRestingCardTop = SCREEN_H - (195 + insets.bottom);

  // ── Local states ───────────────────────────────────────────────────────
  const [phase, setPhase] = useState<"loading" | "confirmed">("loading");
  const [showConfirmLottie, setShowConfirmLottie] = useState(false);
  const confirmRef = useRef<LottieView>(null);
  const dismissTriggeredRef = useRef(false);

  // GSAP timeline & timer references for clean cancellation
  const idleTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const confirmTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const modalOpenTimeRef = useRef<number>(0);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Reanimated Shared Values (Driven by GSAP Engine) ──────────────────
  const visibility = useSharedValue(0);

  // Phase 1: Globe continuous rotation & Rider idle suspension float
  const globeRotation = useSharedValue(0);
  const riderIdleY = useSharedValue(0);
  const phase1Opacity = useSharedValue(1);

  // Rider departure on confirm
  const riderX = useSharedValue(0);
  const riderTilt = useSharedValue(0);
  const riderOpacity = useSharedValue(1);

  // Phase 2: Confirmed stage entrance & green background
  const phase2GreenOpacity = useSharedValue(0);
  const titleY = useSharedValue(-24);
  const titleOpacity = useSharedValue(0);
  const topContentY = useSharedValue(0);
  const topContentOpacity = useSharedValue(1);
  const checkScale = useSharedValue(0.6);

  // Scheduled Card Flight & Docking
  const cardY = useSharedValue(SCREEN_H + 50);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const cardFlightShadow = useSharedValue(0);
  const addressPillOpacity = useSharedValue(0);
  const addressPillY = useSharedValue(0);

  // ── Clean up all GSAP timelines ───────────────────────────────────────
  const killAllAnimations = useCallback(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    idleTimelineRef.current?.kill();
    idleTimelineRef.current = null;
    confirmTimelineRef.current?.kill();
    confirmTimelineRef.current = null;
  }, []);

  // ── Reset & Start GSAP Loop on Visible ─────────────────────────────────
  useEffect(() => {
    if (visible) {
      modalOpenTimeRef.current = Date.now();
      dismissTriggeredRef.current = false;
      setPhase("loading");
      setShowConfirmLottie(false);

      killAllAnimations();

      // Reset animated values
      visibility.value = 1;
      phase1Opacity.value = 1;
      phase2GreenOpacity.value = 0;

      globeRotation.value = 0;
      riderIdleY.value = 0;
      riderX.value = 0;
      riderTilt.value = 0;
      riderOpacity.value = 1;

      titleY.value = -24;
      titleOpacity.value = 0;
      topContentY.value = 0;
      topContentOpacity.value = 1;
      checkScale.value = 0.6;

      cardY.value = SCREEN_H + 50;
      cardOpacity.value = 0;
      cardScale.value = 1;
      cardFlightShadow.value = 0;
      addressPillOpacity.value = 0;
      addressPillY.value = 0;

      // Create GSAP Idle Timeline for continuous globe rotation & subtle suspension
      const idleTl = gsap.timeline({ repeat: -1 });

      idleTl.to(
        globeRotation,
        {
          value: -360,
          duration: 18,
          ease: "none",
        },
        0
      );

      const floatTl = gsap.timeline({ repeat: -1, yoyo: true });
      floatTl.to(riderIdleY, {
        value: -4.5,
        duration: 0.85,
        ease: "power1.inOut",
      });

      idleTimelineRef.current = idleTl;
    } else {
      killAllAnimations();
      visibility.value = 0;
    }

    return () => {
      killAllAnimations();
    };
  }, [visible, killAllAnimations]);

  // ── GSAP Confirmed Animation & Unified Bottom-to-Top Flight ───────────
  useEffect(() => {
    if (confirmed && visible && phase === "loading") {
      // Calculate remaining dwell time to ensure rider stays moving on ground for at least 2 seconds
      const elapsed = Date.now() - modalOpenTimeRef.current;
      const minDwellTime = 2000; // 2 seconds minimum ground time
      const delayBeforeTransition = Math.max(0, minDwellTime - elapsed);

      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = setTimeout(() => {
        // 1. Haptic feedback on confirmation
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}

        // Stop idle animations
        idleTimelineRef.current?.kill();

        // 2. Master GSAP Confirmation Timeline
        const confirmTl = gsap.timeline();
        confirmTimelineRef.current = confirmTl;

        // (A) Rider Ride-Off & Accelerate smoothly off screen
        confirmTl
          .to(
            riderTilt,
            {
              value: 3.5,
              duration: 0.35,
              ease: "power1.out",
            },
            0
          )
          .to(
            riderX,
            {
              value: W + 220,
              duration: 0.72,
              ease: "power2.inOut",
            },
            0
          )
          .to(
            riderOpacity,
            {
              value: 0,
              duration: 0.26,
              ease: "power2.in",
            },
            0.44
          )
          .to(
            phase1Opacity,
            {
              value: 0,
              duration: 0.28,
              ease: "power2.out",
              onComplete: () => {
                setPhase("confirmed");
                setShowConfirmLottie(true);
              },
            },
            0.36
          )
          .to(
            phase2GreenOpacity,
            {
              value: 1,
              duration: 0.3,
              ease: "power2.out",
            },
            0.4
          )
          // (C) Confirmed Title & Checkmark Spring Entrance
          .to(
            titleY,
            {
              value: 0,
              duration: 0.36,
              ease: "back.out(1.4)",
            },
            0.42
          )
          .to(
            titleOpacity,
            {
              value: 1,
              duration: 0.25,
              ease: "power2.out",
            },
            0.42
          )
          .to(
            checkScale,
            {
              value: 1,
              duration: 0.4,
              ease: "back.out(1.7)",
            },
            0.44
          )
          // (D) SHOW CARD ON BOTTOM while checkmark is showing
          .to(
            cardOpacity,
            {
              value: 1,
              duration: 0.22,
              ease: "power2.out",
            },
            0.44
          )
          .to(
            cardY,
            {
              value: bottomRestingCardTop,
              duration: 0.42,
              ease: "power3.out",
            },
            0.44
          )
          // (E) HOLD PREVIEW (~0.65s): User sees checkmark + card on the bottom
          // (F) MOVE CARD UP: Card takes flight to fit into Home screen position!
          .call(() => {
            // Pre-mount Home Screen underneath right as card begins flight
            onNavigate?.();
          }, undefined, 1.45)
          // Green background dissolves smoothly to reveal Home screen underneath
          .to(
            phase2GreenOpacity,
            {
              value: 0,
              duration: 0.52,
              ease: "power2.inOut",
            },
            1.45
          )
          // Title & checkmark float up and dissolve as card ascends
          .to(
            topContentOpacity,
            {
              value: 0,
              duration: 0.3,
              ease: "power2.in",
            },
            1.45
          )
          .to(
            topContentY,
            {
              value: -42,
              duration: 0.34,
              ease: "power2.in",
            },
            1.45
          )
          // Card glides smoothly from bottomRestingCardTop to targetHomeCardTop
          .to(
            cardY,
            {
              value: targetHomeCardTop,
              duration: 0.65,
              ease: "power3.inOut",
            },
            1.45
          )
          // Mid-flight dynamic elevation lift & gentle landing into Home slot
          .to(
            cardScale,
            {
              value: 1.025,
              duration: 0.32,
              ease: "power2.out",
            },
            1.45
          )
          .to(
            cardFlightShadow,
            {
              value: 1,
              duration: 0.32,
              ease: "power2.out",
            },
            1.45
          )
          .to(
            cardScale,
            {
              value: 1.0,
              duration: 0.33,
              ease: "power2.inOut",
            },
            1.77
          )
          .to(
            cardFlightShadow,
            {
              value: 0,
              duration: 0.33,
              ease: "power2.inOut",
              onComplete: () => {
                if (dismissTriggeredRef.current) return;
                dismissTriggeredRef.current = true;

                // Seamless handoff to the Home screen card
                onDismiss();
              },
            },
            1.77
          );
      }, delayBeforeTransition);
    }

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [
    confirmed,
    visible,
    phase,
    targetHomeCardTop,
    onNavigate,
    onDismiss,
  ]);

  // ── Slot parsing helper matching Home screen ScheduledPickupCard ───
  const getSlotDetails = (label?: string) => {
    const isTomorrow = (label || "").toLowerCase().includes("tomorrow");
    const dateLabel = isTomorrow ? "TOMORROW" : "TODAY";

    let highlightTime = "6:00 PM";
    if (label) {
      const match = label.match(/before\s+(.+)$/i);
      if (match) {
        highlightTime = match[1].trim();
      } else if (label.includes("-")) {
        const parts = label.split("-");
        highlightTime = parts[parts.length - 1].trim();
      } else {
        const cleaned = label.replace(/^(today|tomorrow)/i, "").trim();
        if (cleaned) highlightTime = cleaned;
      }
    }
    return { dateLabel, highlightTime };
  };

  // ── Reanimated Styles driven by GSAP ──────────────────────────────────
  const rootAnimatedStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
  }));

  const globeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${globeRotation.value}deg` }],
  }));

  const riderAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: riderX.value },
      { translateY: riderIdleY.value },
      { rotate: `${riderTilt.value}deg` },
    ],
    opacity: riderOpacity.value,
  }));

  const phase1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: phase1Opacity.value,
  }));

  const phase2GreenBackgroundStyle = useAnimatedStyle(() => ({
    opacity: phase2GreenOpacity.value,
  }));

  const topContentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: topContentOpacity.value,
    transform: [{ translateY: topContentY.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  // Card Flight & Landing style
  const scheduledCardContainerStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(cardFlightShadow.value, [0, 1], [0.1, 0.25]);
    const elevation = interpolate(cardFlightShadow.value, [0, 1], [4, 12]);

    return {
      top: cardY.value,
      opacity: cardOpacity.value,
      transform: [{ scale: cardScale.value }],
      shadowOpacity,
      elevation,
    };
  });

  const addressPillAnimatedStyle = useAnimatedStyle(() => ({
    opacity: addressPillOpacity.value,
    transform: [{ translateY: addressPillY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.rootOverlay,
        rootAnimatedStyle,
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View style={styles.fullscreenContainer}>

        {/* ── PHASE 1: Loading / scheduling ── */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.loadingPhase,
            phase1AnimatedStyle,
          ]}
          pointerEvents={phase === "loading" ? "auto" : "none"}
        >
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
            <Animated.View style={[styles.globeWrap, globeAnimatedStyle]}>
              <GroundSvg width={GLOBE_W} height={GLOBE_H} />
            </Animated.View>

            {/* Rider SVG */}
            <Animated.View style={[styles.riderWrap, riderAnimatedStyle]}>
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
        </Animated.View>

        {/* ── PHASE 2: Confirmed & Flight Stage ── */}
        {phase === "confirmed" && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {/* Green background that dissolves into the Home screen */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.confirmedPhaseGreenBg,
                phase2GreenBackgroundStyle,
              ]}
            />

            {/* Top Header & Checkmark */}
            <Animated.View
              style={[
                styles.confirmedTop,
                { paddingTop: insets.top + 32 },
                topContentAnimatedStyle,
              ]}
            >
              {/* Title */}
              <Animated.Text style={[styles.confirmedTitle, titleAnimatedStyle]}>
                PICKUP{"\n"}CONFIRMED
              </Animated.Text>

              {/* Confirmation checkmark */}
              <Animated.View style={[styles.checkWrapper, checkAnimatedStyle]}>
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
            </Animated.View>

            {/* 
              ── FLOATING SCHEDULED CARD ──
              Rises from the bottom of the screen and smoothly glides up
              to dock into the exact spot of the Home screen's active pickup card!
            */}
            <Animated.View
              style={[
                styles.floatingCardContainer,
                scheduledCardContainerStyle,
              ]}
            >
              {/* 1. SCHEDULED PICKUP CARD (Exact 1:1 match to Home Screen ScheduledPickupCard) */}
              {(() => {
                const slotInfo = getSlotDetails(slotLabel);
                return (
                  <View style={styles.scheduledCard}>
                    <View style={styles.innerCompact}>
                      {/* Top Status & Actions Row */}
                      <View style={styles.headerRowCompact}>
                        <View style={styles.statusPill}>
                          <Ionicons name="ellipse" size={7} color={C.green} />
                          <Text style={styles.statusPillText}>PICKUP SCHEDULED</Text>
                        </View>
                        <View style={styles.headerRightActions}>
                          <View style={styles.cartBadgeWrap}>
                            <Ionicons name="cart-outline" size={19} color={C.green} />
                          </View>
                          <Ionicons name="ellipsis-vertical" size={19} color={C.green} />
                        </View>
                      </View>

                      {/* Main Pickup Timeslot */}
                      <View style={styles.pickupHeadingBlock}>
                        <Text style={styles.pickupSubLabel}>PICKUP</Text>
                        <Text style={styles.pickupBigLine}>{slotInfo.dateLabel}</Text>
                        <Text style={styles.pickupBigLine}>
                          BEFORE{" "}
                          <Text style={styles.pickupBigAccent}>
                            {slotInfo.highlightTime.toUpperCase()}
                          </Text>
                        </Text>
                      </View>

                      {/* Bottom Actions Row */}
                      <View style={styles.bottomRowCompact}>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>+ ADD ITEMS</Text>
                        </View>
                        <View style={styles.chatFab}>
                          <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })()}
            </Animated.View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  rootOverlay: {
    zIndex: 99999,
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // ── Phase 1 ──────────────────────────────────────────────────────────
  loadingPhase: {
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
  confirmedPhaseGreenBg: {
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
    marginBottom: 24,
  },
  checkWrapper: {
    alignItems: "center",
    justifyContent: "center",
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

  // Floating & Docking Card Container
  floatingCardContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },

  // Inner Scheduled Card (matches Home screen ScheduledPickupCard)
  scheduledCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  innerCompact: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerRowCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    minHeight: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D1E7DD",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 9,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
  },
  statusPillText: {
    color: C.green,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: "800",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cartBadgeWrap: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  pickupHeadingBlock: {
    gap: 1,
  },
  pickupSubLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  pickupBigLine: {
    color: C.textDark,
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 25,
    letterSpacing: 0.5,
  },
  pickupBigAccent: {
    color: C.green,
    fontWeight: "800",
  },
  bottomRowCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  tagPill: {
    minHeight: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.pillBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tagPillText: {
    color: C.green,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  chatFab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
});
