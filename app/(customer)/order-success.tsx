import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";

export default function OrderSuccess() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { address } = useLocalSearchParams<{ address?: string }>();

  const circleScale = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(24)).current;
  const addrOpacity = useRef(new Animated.Value(0)).current;
  const addrY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(circleScale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }),
      Animated.timing(checkRotate, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(titleY, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(addrOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
      Animated.timing(addrY, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      router.replace({
        pathname: "/(customer)/(tabs)/home",
        params: { justBooked: "1", orderPlaced: "1" },
      });
    }, 600);

    return () => clearTimeout(t);
  }, []);

  const checkSpin = checkRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["-20deg", "0deg"],
  });

  return (
    <View style={[styles.root, { 
      backgroundColor: theme.background,
      paddingTop: insets.top + 20, 
      paddingBottom: insets.bottom + 24 
    }]}>
      <View style={styles.topContent}>
        <Animated.View style={[styles.circle, { 
          backgroundColor: theme.primary,
          shadowColor: theme.primary,
          transform: [{ scale: circleScale }] 
        }]}>
          <Animated.View style={{ transform: [{ scale: checkScale }, { rotate: checkSpin }] }}>
            <Ionicons name="checkmark" size={46} color={theme.background} />
          </Animated.View>
        </Animated.View>

        <Animated.Text style={[styles.title, { 
          color: theme.text,
          opacity: titleOpacity, 
          transform: [{ translateY: titleY }] 
        }]}>
          Pickup{"\n"}Confirmed!
        </Animated.Text>

        {address ? (
          <Animated.View style={[styles.addrRow, { 
            opacity: addrOpacity, 
            transform: [{ translateY: addrY }] 
          }]}>
            <Ionicons name="location-outline" size={16} color={theme.textSecondary} style={{ marginTop: 1 }} />
            <Text style={[styles.addrText, { color: theme.textSecondary }]} numberOfLines={2}>
              {address}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 44,
  },
  topContent: {
    alignItems: "center",
    marginTop: 20,
  },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 14,
  },
  title: {
    fontSize: 24,
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
    paddingHorizontal: 1,
  },
  addrText: {
    fontSize: 18,
    lineHeight: 20,
    textAlign: "center",
    flexShrink: 1,
  },
});