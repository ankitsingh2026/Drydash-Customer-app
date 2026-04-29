import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  type: "force" | "optional" | null;
  onLater: () => void;
  storeUrl: string | null;
};

export default function UpdateModal({
  visible,
  type,
  onLater,
  storeUrl,
}: Props) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12 });
      opacity.value = withTiming(1, { duration: 250 });
    } else {
      scale.value = 0.8;
      opacity.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.container, animatedStyle]}>

        {/* 🔥 ICON */}
        <View style={styles.iconWrapper}>
          <Ionicons
            name={type === "force" ? "alert-circle" : "cloud-download"}
            size={42}
            color={type === "force" ? "#ef4444" : "#22c55e"}
          />
        </View>

        {/* TITLE */}
        <Text style={styles.title}>
          {type === "force" ? "Update Required" : "Update Available"}
        </Text>

        {/* MESSAGE */}
        <Text style={styles.message}>
          {type === "force"
            ? "You must update the app to continue using DryDash."
            : "A new version is available with improvements and better performance"}
        </Text>

        {/* BUTTONS */}
        <View style={styles.buttons}>
          {type !== "force" && (
            <TouchableOpacity style={styles.laterBtn} onPress={onLater}>
              <Text style={styles.laterText}>Later</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.updateBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (storeUrl) Linking.openURL(storeUrl);
            }}
          >
            <Text style={styles.updateText}>Update</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    width: "85%",
    backgroundColor: "#0F2A24",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",

    // Shadow
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },

  iconWrapper: {
    backgroundColor: "#122620",
    padding: 14,
    borderRadius: 50,
    marginBottom: 12,
  },

  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },

  message: {
    color: "#cbd5e1",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 22,
    lineHeight: 20,
  },

  buttons: {
    flexDirection: "row",
    gap: 12,
  },

  laterBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#475569",
  },

  laterText: {
    color: "#cbd5e1",
    fontWeight: "500",
  },

  updateBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  updateText: {
    color: "#000",
    fontWeight: "700",
  },
});