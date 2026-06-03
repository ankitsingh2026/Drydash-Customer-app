import React, { useRef, useCallback } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Dimensions } from "react-native";
import * as Haptics from "expo-haptics"; // add this

interface SwipeToActionProps {
  title?: string;
  onComplete: () => void;
  height?: number;
  thumbColor?: string;
  backgroundColor?: string;
  threshold?: number;
}

export default function SwipeToAction({
  title = "SWIPE FOR INSTANT PICKUP",
  onComplete,
  height = 56,
  thumbColor = "#00E1A2",
  backgroundColor = "#052420",
  threshold = 0.25,
}: SwipeToActionProps) {
  const SCREEN_WIDTH = Dimensions.get("window").width;
  const COMPONENT_WIDTH = SCREEN_WIDTH - 30;
  const THUMB_PADDING = 5.8; // gap between thumb and bar edge
  const THUMB_SIZE = height - THUMB_PADDING * 2;
  const MAX_DRAG = COMPONENT_WIDTH - THUMB_SIZE - 15;
  const COMPLETE_AT = MAX_DRAG * threshold;


  const dragX = useRef(new Animated.Value(0)).current;
  const dragValue = useRef(0);
  const hasTriggeredHaptic = useRef(false); // track mid-drag haptic

  // Stable Animated.Value for fill — create once, not per render
  const thumbSizeAnim = useRef(new Animated.Value(THUMB_SIZE)).current;
  const fillWidth = dragX;

  const reset = useCallback(() => {
    hasTriggeredHaptic.current = false;
    Animated.spring(dragX, {
      toValue: 0,
      damping: 20,       // slightly more damping = less bounce
      stiffness: 200,
      mass: 0.8,         // lighter = snappier return
      useNativeDriver: false,
    }).start();
    dragValue.current = 0;
  }, [dragX]);

  const complete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(dragX, {
      toValue: MAX_DRAG,
      duration: 220,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // ease-out-quad, more natural
      useNativeDriver: false,
    }).start(() => {
      onComplete();
      setTimeout(reset, 350);
    });
  }, [onComplete, reset, MAX_DRAG, dragX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,        // also capture taps
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4, // ignore tiny jitter
      onPanResponderGrant: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); // tap feel
        dragX.stopAnimation();  // stop any in-progress spring on re-grab
      },
      onPanResponderMove: (_, gesture) => {
        const clamped = Math.max(0, Math.min(gesture.dx, MAX_DRAG));
        dragX.setValue(clamped);
        dragValue.current = clamped;

        // Mid-point haptic tick
        if (clamped >= COMPLETE_AT && !hasTriggeredHaptic.current) {
          hasTriggeredHaptic.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (clamped < COMPLETE_AT) {
          hasTriggeredHaptic.current = false;
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (dragValue.current >= COMPLETE_AT || gesture.vx > 0.35) {
          complete();
        } else {
          reset();
        }
      },
      onPanResponderTerminate: () => reset(), // handle system interrupts
    })
  ).current;

  const thumbScale = dragX.interpolate({
    inputRange: [0, COMPLETE_AT],
    outputRange: [1, 1.08],   // subtler scale
    extrapolate: "clamp",
  });

  const textOpacity = dragX.interpolate({
    inputRange: [0, COMPLETE_AT * 0.5], // fade out sooner
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const textTranslate = dragX.interpolate({
    inputRange: [0, COMPLETE_AT],
    outputRange: [0, 20],
    extrapolate: "clamp",
  });

  // Arrow/chevron inside thumb rotates as you drag
  const iconRotate = dragX.interpolate({
    inputRange: [0, MAX_DRAG],
    outputRange: ["0deg", "360deg"],
    extrapolate: "clamp",
  });

  return (
    <View
      style={[
        styles.container,
        { width: COMPONENT_WIDTH, height, backgroundColor },
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            left: THUMB_PADDING,
            width: Animated.add(
              dragX,
              new Animated.Value(THUMB_SIZE)
            ),
          },
        ]}
      />

      {/* Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          {
            left: THUMB_PADDING,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            backgroundColor: thumbColor,
            borderWidth: 0,
            transform: [{ translateX: dragX }, { scale: thumbScale }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Animated.View >
          <Ionicons name="arrow-forward" size={22} color="#000" />
        </Animated.View>
      </Animated.View>

      {/* Label */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: textOpacity,
            transform: [{ translateX: textTranslate }],
          },
        ]}
        pointerEvents="none"
      >
        {title}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    justifyContent: "center",

  },
  fill: {
    position: "absolute",
    left: 0,
    top: 3.6,
    bottom: 4.3,
    backgroundColor: "#00E1A2",
    borderRadius: 16,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15

  },
  thumb: {
    position: "absolute",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,

  },
  title: {
    textAlign: "center",
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
});


