import { router } from "expo-router";
import { useEffect } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import {
  PERMISSIONS,
  request
} from "react-native-permissions";

export default function SplashScreen() {

  const requestPermissions = async () => {
    try {
      if (Platform.OS === "android") {
        const location = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        console.log("Location:", location);
      } else {
        const location = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        console.log("Location:", location);
      }
    } catch (error) {
      console.log("Permission error:", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await requestPermissions(); //  ask  for permissions first

      setTimeout(() => {
        router.replace("/(auth)/auth");
      }, 1000);
    };

    init();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/drydashlogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

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
    marginBottom: 4,
  },
  slogan: {
    paddingBottom: 20,
    color: "#cbd5e1",
    fontSize: 16,
    letterSpacing: 0.8,
  },
});