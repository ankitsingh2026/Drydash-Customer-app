// app/(auth)/register.tsx
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Register() {
  // entry animation uses translateY only (no starting opacity 0)
  const slide = useRef(new Animated.Value(16)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // slide up with subtle easing — does not hide the background
    Animated.timing(slide, {
      toValue: 0,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slide]);

  const pressRegister = () => {
    if (animating) return;
    setAnimating(true);

    Animated.sequence([
      Animated.timing(btnScale, {
        toValue: 0.96,
        duration: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(btnScale, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimating(false);
      router.replace("/(customer)/(tabs)/home"); // no back
    });
  };

  const goToLogin = () => {
    if (animating) return;
    router.replace("/login");
  };

  return (
    <View style={styles.outer}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slide }],
          },
        ]}
      >
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join DryDash for premium laundry care</Text>

        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#6B7280"
          style={styles.input}
        />

        <TextInput
          placeholder="Email or Phone"
          placeholderTextColor="#6B7280"
          style={styles.input}
          keyboardType={Platform.OS === "ios" ? "default" : "email-address"}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#6B7280"
          secureTextEntry
          style={styles.input}
        />

        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={pressRegister}
            disabled={animating}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity activeOpacity={0.8} onPress={goToLogin}>
          <Text style={styles.link}>Back to Login</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#0B1F1A" }, // keep consistent dark bg
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 28,
  },

  input: {
    backgroundColor: "#112B24",
    color: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#1F4038",
  },

  button: {
    backgroundColor: "#34D399",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    elevation: 6,
  },

  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },

  link: {
    color: "#34D399",
    textAlign: "center",
    marginTop: 18,
    fontSize: 14,
    fontWeight: "700",
  },
});
