import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

type Props = {
  visible: boolean;
  type: "force" | "optional" | null;
  onLater: () => void;
  storeUrl: string | null;
};

export default function UpdateModal({ visible, type, onLater, storeUrl }: Props) {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);

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
            color={type === "force" ? "#FF6B6B" : theme.primary}
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

function makeStyles(theme: any, isDark: boolean) {
  return StyleSheet.create({
    overlay: {
      position: "absolute",
      width: "100%",
      height: "100%",
      backgroundColor: theme.backdrop,
      justifyContent: "center",
      alignItems: "center",
    },
    container: {
      width: "85%",
      backgroundColor: theme.modalBackground,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      // Shadow
      shadowColor: isDark ? "#000000" : "#1E3A34",
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    },
    iconWrapper: {
      backgroundColor: theme.inputBackground,
      padding: 14,
      borderRadius: 50,
      marginBottom: 12,
    },
    title: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "700",
      marginBottom: 8,
    },
    message: {
      color: theme.textSecondary,
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
      borderColor: theme.border,
    },
    laterText: {
      color: theme.textSecondary,
      fontWeight: "500",
    },
    updateBtn: {
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    updateText: {
      color: theme.modalBackground,
      fontWeight: "700",
    },
  });
}