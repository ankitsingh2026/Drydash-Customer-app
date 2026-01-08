// app/(auth)/login.tsx
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";


export default function Login() {
  const btnScale = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.96)).current;
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    // logo entrance (subtle)
    Animated.spring(logoScale, {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [logoScale]);

  const pressLogin = () => {
    if (animating) return;
    setAnimating(true);

    Animated.sequence([
      Animated.spring(btnScale, {
        toValue: 0.96,
        useNativeDriver: true,
      }),
      Animated.spring(btnScale, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setAnimating(false);
      // replace so user can't go back into auth screens
      router.replace("/(customer)/(tabs)/home");
    });
  };

  const goToRegister = () => {
    if (animating) return;
    // prefer replace to avoid stacking auth routes
    router.replace("/register");
  };

  return (
    <View style={styles.outer}>
      {/* keep background on the outer view to avoid any white flash */}
      <Animated.View style={[styles.container, { transform: [{ scale: logoScale }] }]}>
        {/* LOGO */}
        <Image
          source={require("../../assets/images/logo/greenLogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* TITLE */}
        <Text style={styles.subtitle}>Customer Login</Text>

        {/* INPUTS */}
        <TextInput
          placeholder="Phone or Email"
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

        {/* CTA - only button animates */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.button}
            onPress={pressLogin}
            disabled={animating}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* FOOTER */}
        <TouchableOpacity onPress={goToRegister} disabled={animating}>
          <Text style={styles.link}>Create Account</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#0B1F1A" }, // keep dark bg here
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  logo: {
    width: 160,
    height: 120,
    alignSelf: "center",
    marginBottom: 8,
  },

  subtitle: {
    color: "#9CA3AF",
    textAlign: "center",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 18,
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
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
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
    marginTop: 22,
    fontSize: 14,
    fontWeight: "700",
  },
});
