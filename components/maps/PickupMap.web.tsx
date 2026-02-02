import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function PickupMap() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Map is available on mobile only
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.6,
  },
});
