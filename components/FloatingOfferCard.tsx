import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.min(width * 0.48, 192);
const IMAGE_HEIGHT = CARD_WIDTH * 0.72;

type FloatingOfferCardProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUri: string;
  onClose: () => void;
  onPress?: () => void;
  ctaText?: string;
};

export default function FloatingOfferCard({
  visible,
  title,
  subtitle,
  badge = "LIMITED OFFER",
  imageUri,
  onClose,
  onPress,
  ctaText = "Claim Now",
}: FloatingOfferCardProps) {
  // Core entrance
  const scale      = useRef(new Animated.Value(0.72)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  // Polish layers
  const shimmer    = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const floatY     = useRef(new Animated.Value(0)).current;  // idle float
  const ctaPulse   = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  /* ── Idle float loop ── */
  const runFloat = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -4,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  /* ── Shimmer sweep ── */
  const runShimmer = () => {
    shimmer.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(2800),
      ]),
    ).start();
  };

  /* ── CTA breathe ── */
  const runCtaPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, {
          toValue: 1.05,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  /* ── Glow pulse ── */
  const runGlowPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  useEffect(() => {
    if (visible) {
      // ── Phase 1: Card pops in ──
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 260,
          mass: 0.55,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 8,        // nice overshoot
          stiffness: 220,
          mass: 0.55,
        }),
      ]).start(() => {
        // ── Phase 2: Badge pops after card lands ──
        Animated.parallel([
          Animated.spring(badgeScale, {
            toValue: 1,
            useNativeDriver: true,
            damping: 6,
            stiffness: 320,
            mass: 0.4,
          }),
          Animated.timing(badgeOpacity, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
        ]).start();

        // ── Phase 3: Idle loops begin ──
        runFloat();
        runShimmer();
        runCtaPulse();
        runGlowPulse();
      });
    } else {
      // ── Exit: fast collapse with scale-down snap ──
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 130,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.72,
          duration: 160,
          easing: Easing.in(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 20,
          duration: 160,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        badgeScale.setValue(0);
        badgeOpacity.setValue(0);
        shimmer.setValue(0);
        ctaPulse.setValue(1);
        glowOpacity.setValue(0);
        floatY.setValue(0);
      });
    }
  }, [visible]);

  const shimmerX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-CARD_WIDTH * 0.5, CARD_WIDTH * 1.3],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity,
          transform: [{ scale }, { translateY: Animated.add(translateY, floatY) }],
        },
      ]}
      pointerEvents="box-none"
    >
      {/* ── Animated glow ring ── */}
      <Animated.View
        style={[styles.glowRing, { opacity: glowOpacity }]}
        pointerEvents="none"
      />

      {/* ── Image zone ── */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Deep bottom vignette */}
        <View style={styles.vignette} />

        {/* Shimmer sweep */}
        <Animated.View
          style={[styles.shimmerStreak, { transform: [{ translateX: shimmerX }] }]}
          pointerEvents="none"
        />

        {/* Close pill */}
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
          <Ionicons name="close" size={10} color="#fff" />
        </Pressable>

        {/* Badge — pops from bottom-left */}
        {!!badge && (
          <Animated.View
            style={[
              styles.badge,
              {
                opacity: badgeOpacity,
                transform: [{ scale: badgeScale }],
              },
            ]}
          >
            <View style={styles.pulseDot} />
            <Text style={styles.badgeText}>{badge}</Text>
          </Animated.View>
        )}
      </View>

      {/* ── Content strip ── */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}

        {/* CTA row */}
        <Animated.View style={[styles.ctaRow, { transform: [{ scaleX: ctaPulse }] }]}>
          <Pressable
            style={({ pressed }) => [
              styles.ctaBtn,
              pressed && styles.ctaBtnPressed,
            ]}
            onPress={onPress}
          >
            <Text style={styles.ctaText}>{ctaText}</Text>
            <View style={styles.ctaIcon}>
              <Ionicons name="arrow-forward" size={9} color="#0D1F1C" />
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: 14,
    bottom: 10,
    zIndex: 999,
    width: CARD_WIDTH,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0E2420",
    shadowColor: "#4ADE80",
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 28,
  },

  /* ── Glow ring — animated ── */
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: "#4ADE80",
    zIndex: 20,
  },

  /* ── Image ── */
  imageWrap: {
    width: "100%",
    height: IMAGE_HEIGHT,
    backgroundColor: "#071410",
    overflow: "hidden",
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    // Gradient-like vignette via two overlapping layers
    backgroundColor: "transparent",
    // Bottom half darkened for text legibility
    borderBottomLeftRadius: 0,
    // We fake a gradient with a bottom-anchored semi-opaque view
  },
  shimmerStreak: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: "rgba(255,255,255,0.09)",
    transform: [{ skewX: "-18deg" }],
  },

  /* ── Close ── */
  closeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.18)",
  },

  /* ── Badge ── */
  badge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(10,28,24,0.88)",
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 20,
    borderWidth: 0.8,
    borderColor: "rgba(74,222,128,0.5)",
  },
  pulseDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
  },
  badgeText: {
    color: "#A7F3D0",
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  /* ── Content ── */
  content: {
    paddingHorizontal: 11,
    paddingTop: 9,
    paddingBottom: 11,
    backgroundColor: "#0E2420",
  },
  title: {
    color: "#E8F8EF",
    fontSize: 12.5,
    fontWeight: "800",
    lineHeight: 17,
    letterSpacing: 0.05,
  },
  subtitle: {
    color: "#5D8A78",
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 14,
    marginTop: 2,
  },

  /* ── CTA ── */
  ctaRow: {
    marginTop: 9,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#4ADE80",   // vivid green on dark card
    paddingVertical: 8,
    paddingLeft: 11,
    paddingRight: 6,
    borderRadius: 10,
  },
  ctaBtnPressed: {
    backgroundColor: "#22C55E",
    transform: [{ scale: 0.96 }],
  },
  ctaText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  ctaIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(7,30,40,0.18)",
    alignItems: "center",
    justifyContent: "center",
    // color:"fff"
  },
});