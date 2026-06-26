import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";

export type AddPickupItemsButtonProps = {
  pickupId: string;
  label?: string;
  style?: ViewStyle;
  compact?: boolean;
};

export default function AddPickupItemsButton({
  pickupId,
  label = "Add More Items",
  style,
  compact = false,
}: AddPickupItemsButtonProps) {
  const { theme, isDark } = useTheme()
  const styles = makeStyles(theme, isDark);
  
  const handlePress = () => {
    router.push({
      pathname: "/services/[service]",
      params: {
        service: "shoe",
        pickupId,
        mode: "edit",
      },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.row, compact && styles.rowCompact, style]}
    >
      <Ionicons name="add-circle-outline" size={compact ? 18 : 23} color={theme.textSecondary} />
      <Text style={[styles.text, compact && styles.textCompact]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 14,
  },
  rowCompact: {
    marginTop: 6,
    marginBottom: 14,
  },
  text: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  textCompact: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});

