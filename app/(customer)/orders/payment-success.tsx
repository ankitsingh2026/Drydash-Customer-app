import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, Text, View, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentSuccess() {
  const params = useLocalSearchParams<{
    orderId?: string;
  }>();

  const scaleAnim = new Animated.Value(0);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    // Animation for checkmark
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Redirect after 3 seconds
    const timer = setTimeout(() => {
      if (params.orderId) {
        router.replace({
          pathname: "/(customer)/orders/[orderId]",
          params: { orderId: params.orderId },
        });
      } else {
        router.replace("/(customer)/home");
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [params.orderId]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.iconWrapper,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={styles.outerCircle}>
            <View style={styles.innerCircle}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            { opacity: opacityAnim, transform: [{ translateY: Animated.multiply(Animated.subtract(1, opacityAnim), 20) }] },
          ]}
        >
          Payment Successful
        </Animated.Text>
        
        <Animated.Text
          style={[
            styles.subtitle,
            { opacity: opacityAnim, transform: [{ translateY: Animated.multiply(Animated.subtract(1, opacityAnim), 20) }] },
          ]}
        >
          Your payment has been successful. Thank{"\n"}you for using DryDash
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#041C15",
  },
  root: {
    flex: 1,
    backgroundColor: "#041C15",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconWrapper: {
    marginBottom: 40,
  },
  outerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0, 230, 118, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#00E676",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00E676",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    color: "#8CA69A",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});