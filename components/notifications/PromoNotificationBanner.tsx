import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AUTO_DISMISS_MS = 6000;

// Service-specific gradient configs
const CAMPAIGN_GRADIENTS: Record<string, { bg: string; accent: string; emoji: string }> = {
  promotional:  { bg: "#4f46e5", accent: "#818cf8", emoji: "🎉" },
  re_engagement:{ bg: "#d97706", accent: "#fbbf24", emoji: "💌" },
  event:        { bg: "#2563eb", accent: "#60a5fa", emoji: "📅" },
  seasonal:     { bg: "#059669", accent: "#34d399", emoji: "🌿" },
  marketing:    { bg: "#7c3aed", accent: "#a78bfa", emoji: "📣" },
};

export interface PromoNotificationData {
  title: string;
  message: string;
  campaignType?: string;
  deepLink?: string;
  ctaLabel?: string;
  campaignId?: string;
  imageUrl?: string;
}

interface Props {
  notification: PromoNotificationData | null;
  onDismiss: () => void;
}

export default function PromoNotificationBanner({ notification, onDismiss }: Props) {
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(SCREEN_WIDTH - 32)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const slideIn = () => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar countdown
    Animated.timing(progressWidth, {
      toValue: 0,
      duration: AUTO_DISMISS_MS,
      useNativeDriver: false,
    }).start();
  };

  const slideOut = (cb?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -200,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => cb?.());
  };

  useEffect(() => {
    if (!notification) return;

    // Reset
    setImageFailed(false);
    translateY.setValue(-200);
    opacity.setValue(0);
    progressWidth.setValue(SCREEN_WIDTH - 32);

    if (timerRef.current) clearTimeout(timerRef.current);

    slideIn();

    timerRef.current = setTimeout(() => {
      slideOut(onDismiss);
    }, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification]);

  // Swipe-up to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -40) {
          if (timerRef.current) clearTimeout(timerRef.current);
          slideOut(onDismiss);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!notification) return null;

  const theme =
    CAMPAIGN_GRADIENTS[notification.campaignType ?? "marketing"] ??
    CAMPAIGN_GRADIENTS.marketing;

  const handleTap = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Navigate to deep link
    const target = notification.deepLink || "home";
    const routeMap: Record<string, string> = {
      "home":        "/(customer)/(tabs)/home",
      "book-pickup": "/(customer)/book-pickup",
      "orders":      "/(customer)/(tabs)/orders",
      "services":    "/(customer)/services",
      "wallet":      "/(customer)/wallet",
      "coupons":     "/(customer)/(tabs)/home",
    };

    slideOut(() => {
      onDismiss();
      try {
        router.push((routeMap[target] ?? "/(customer)/(tabs)/home") as any);
      } catch (e) {
        console.log("Navigation error:", e);
      }
    });
  };

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    slideOut(onDismiss);
  };

  const hasImage = Boolean(notification.imageUrl && !imageFailed);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable onPress={handleTap} style={[styles.card, { backgroundColor: theme.bg }]}>
        {/* Left: Image banner if provided, else emoji bubble */}
        {hasImage ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: notification.imageUrl }}
              style={styles.cardImage}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
            />
          </View>
        ) : (
          <View style={[styles.iconBubble, { backgroundColor: theme.accent + "33" }]}>
            <Text style={styles.iconEmoji}>{theme.emoji}</Text>
          </View>
        )}

        {/* Center: text */}
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{notification.message}</Text>
          <View style={[styles.ctaBadge, { backgroundColor: theme.accent + "30" }]}>
            <Text style={[styles.ctaText, { color: theme.accent }]}>
              {notification.ctaLabel || "Book Now"} →
            </Text>
          </View>
        </View>

        {/* Dismiss */}
        <Pressable onPress={handleDismiss} style={styles.dismissBtn} hitSlop={12}>
          <Text style={styles.dismissIcon}>✕</Text>
        </Pressable>
      </Pressable>

      {/* Countdown progress bar */}
      <Animated.View
        style={[
          styles.progressBar,
          { backgroundColor: theme.accent, width: progressWidth },
        ]}
      />

      {/* Swipe hint */}
      <View style={styles.swipeHint}>
        <View style={styles.swipeIndicator} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 16,
    left: 12,
    right: 12,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  card: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    overflow: "hidden",
  },
  imageWrapper: {
    width: 62,
    height: 62,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    flexShrink: 0,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 24,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 0.1,
  },
  body: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  ctaBadge: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: "700",
  },
  dismissBtn: {
    flexShrink: 0,
    padding: 4,
  },
  dismissIcon: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  swipeHint: {
    alignItems: "center",
    marginTop: 4,
  },
  swipeIndicator: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
});
