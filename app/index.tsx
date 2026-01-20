import { router } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(auth)/auth");
    }, 3000); // 2.2 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require("../assets/images/drydash.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Slogan */}
      <Text style={styles.slogan}>Smart Laundry. Seamless Life.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1F1A",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 8,
  },
  slogan: {
    paddingBottom: 20,
    color: "#cbd5e1",
    fontSize: 16,
    letterSpacing: 0.8,
  },
});
