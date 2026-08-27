import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface SkeletonProps {
  variant?:
    | "text"
    | "title"
    | "circle"
    | "rect"
    | "card"
    | "button"
    | "image"
    | "badge";
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rect",
  width: customWidth,
  height: customHeight,
  borderRadius: customBorderRadius,
  style,
}) => {
  const { theme, isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1100,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  const getVariantStyles = () => {
    switch (variant) {
      case "text":
        return {
          width: customWidth || "80%",
          height: (customHeight as number) || 12,
          borderRadius: customBorderRadius ?? 4,
        };
      case "title":
        return {
          width: customWidth || "60%",
          height: (customHeight as number) || 20,
          borderRadius: customBorderRadius ?? 6,
        };
      case "circle": {
        const size = typeof customWidth === "number" ? customWidth : 48;
        return {
          width: size,
          height: (customHeight as number) || size,
          borderRadius: customBorderRadius ?? size / 2,
        };
      }
      case "badge":
        return {
          width: customWidth || 60,
          height: (customHeight as number) || 18,
          borderRadius: customBorderRadius ?? 9,
        };
      case "button":
        return {
          width: customWidth || "100%",
          height: (customHeight as number) || 44,
          borderRadius: customBorderRadius ?? 12,
        };
      case "image":
        return {
          width: customWidth || "100%",
          height: (customHeight as number) || 120,
          borderRadius: customBorderRadius ?? 10,
        };
      case "card":
        return {
          width: customWidth || "100%",
          height: (customHeight as number) || 160,
          borderRadius: customBorderRadius ?? 14,
        };
      default:
        return {
          width: customWidth || "100%",
          height: (customHeight as number) || 20,
          borderRadius: customBorderRadius ?? 8,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Interpolate shimmer translateX
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  // App-matched harmonious colors for light and dark themes
  const baseColor = isDark
    ? "rgba(16, 43, 37, 0.85)" // matches dark card/input background
    : "rgba(226, 239, 234, 0.85)"; // matches light input/subtle green tint

  const shimmerColor = isDark
    ? "rgba(30, 58, 52, 0.55)" // subtle brighter dark teal highlight
    : "rgba(240, 247, 245, 0.9)"; // subtle lighter soft highlight

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: baseColor,
          width: variantStyles.width as any,
          height: variantStyles.height as any,
          borderRadius: variantStyles.borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            backgroundColor: shimmerColor,
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  shimmer: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
});

export default Skeleton;
