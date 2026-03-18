import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");

interface SkeletonLoaderProps {
  variant?:
    | "text"
    | "title"
    | "circle"
    | "rect"
    | "card"
    | "button"
    | "image"
    | "heroCard"
    | "orderCard"
    | "serviceBox";
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "rect",
  width: customWidth,
  height: customHeight,
  borderRadius: customBorderRadius,
  style,
}) => {
  const { isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const getVariantStyles = () => {
    switch (variant) {
      case "text":
        return { width: customWidth || "80%", height: 14, borderRadius: 4 };
      case "title":
        return { width: customWidth || "60%", height: 24, borderRadius: 6 };
      case "circle":
        return {
          width: customWidth || 50,
          height: customHeight || 50,
          borderRadius: (customWidth || 50) / 2,
        };
      case "button":
        return { width: customWidth || "100%", height: 44, borderRadius: 12 };
      case "image":
        return {
          width: customWidth || "100%",
          height: customHeight || 200,
          borderRadius: 12,
        };
      case "heroCard":
        return {
          width: width * 0.85,
          height: 197,
          borderRadius: 25,
        };
      case "orderCard":
        return {
          width: "100%",
          height: 160,
          borderRadius: 16,
        };
      case "serviceBox":
        return {
          width: customWidth || "23%",
          height: customHeight || 100,
          borderRadius: 14,
        };
      default:
        return {
          width: customWidth || "100%",
          height: customHeight || 20,
          borderRadius: customBorderRadius || 8,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const baseColor = isDark ? "#1F2937" : "#1F2937";
  const shimmerColor = isDark ? "#374151" : "#374151";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: baseColor,
          width: variantStyles.width,
          height: variantStyles.height,
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

// Preset skeleton layouts for common screens
export const HomeScreenSkeleton = () => {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.headerSkeleton}>
        <SkeletonLoader variant="text" width={80} height={12} />
        <SkeletonLoader variant="title" width={200} style={{ marginTop: 8 }} />
      </View>

      {/* Hero Cards */}
      <View style={styles.heroSection}>
        <SkeletonLoader variant="heroCard" style={{ marginRight: 16 }} />
      </View>

      {/* Quick Action */}
      <View style={styles.section}>
        <SkeletonLoader variant="text" width={100} height={14} style={{ marginBottom: 12 }} />
        <SkeletonLoader variant="button" />
      </View>

      {/* Offer Card */}
      <View style={styles.section}>
        <SkeletonLoader width="100%" height={80} borderRadius={18} />
      </View>

      {/* Services */}
      <View style={styles.section}>
        <SkeletonLoader variant="text" width={120} height={18} style={{ marginBottom: 12 }} />
        <View style={styles.servicesRow}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} variant="serviceBox" />
          ))}
        </View>
      </View>

      {/* Orders */}
      <View style={styles.section}>
        <SkeletonLoader variant="text" width={130} height={18} style={{ marginBottom: 12 }} />
        <SkeletonLoader variant="orderCard" style={{ marginBottom: 12 }} />
        <SkeletonLoader variant="orderCard" />
      </View>
    </View>
  );
};

export const OrdersScreenSkeleton = () => {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.ordersHeader}>
        <View>
          <SkeletonLoader variant="title" width={150} />
          <SkeletonLoader variant="text" width={100} style={{ marginTop: 8 }} />
        </View>
        <SkeletonLoader variant="circle" width={70} height={70} />
      </View>

      <View
        style={[
          styles.divider,
          { backgroundColor: isDark ? "#1F2937" : "#1F2937" },
        ]}
      />

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLoader
            key={i}
            width={80}
            height={36}
            borderRadius={20}
            style={{ marginRight: 8 }}
          />
        ))}
      </View>

      {/* Order Cards */}
      {[1, 2, 3].map((i) => (
        <SkeletonLoader
          key={i}
          variant="orderCard"
          style={{ marginBottom: 16 }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  shimmer: {
    width: "100%",
    height: "100%",
    opacity: 0.3,
  },
  screenContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerSkeleton: {
    marginBottom: 20,
  },
  heroSection: {
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  servicesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ordersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
});