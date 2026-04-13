// components/NotificationsTopSheet.tsx

import { useNotifications } from "@/context/NotificationContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

const { width, height } = Dimensions.get("window");
const SHEET_HEIGHT = Math.min(640, Math.round(height * 0.82));

type NotificationItem = {
  id: string;
  title: string;
  subtitle?: string;
  unread?: boolean;
  time?: string;
  kind?: string;
};

/* ---------- Helper ---------- */
function withOpacity(color: string, opacity: number): string {
  let hex = color.replace("#", "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
}

/* ---------- Meta ---------- */
function getMeta(kind: string | undefined, primary: string) {
  switch (kind) {
    case "order_created":
    case "order_updated":
      return {
        icon: "cube-outline" as const,
        color: primary,
        softBg: withOpacity(primary, 0.1),
      };
    case "pickup_created":
    case "pickup_updated":
      return {
        icon: "bicycle-outline" as const,
        color: "#06B6D4",
        softBg: "rgba(6,182,212,0.14)",
      };
    case "wallet":
      return {
        icon: "wallet-outline" as const,
        color: "#8B5CF6",
        softBg: "rgba(139,92,246,0.14)",
      };
    case "offer":
      return {
        icon: "pricetag-outline" as const,
        color: "#F59E0B",
        softBg: "rgba(245,158,11,0.14)",
      };
    default:
      return {
        icon: "notifications-outline" as const,
        color: primary,
        softBg: withOpacity(primary, 0.1),
      };
  }
}

/* ---------- Component ---------- */

export default function NotificationsTopSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, markAllRead, markRead } = useNotifications();

  const translateY = useRef(new Animated.Value(-SHEET_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  /* ---------- Animation ---------- */
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 9,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -SHEET_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const divider = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";
  const subtleHl = isDark ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.022)";

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.48)", opacity: backdrop },
          ]}
        />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.card,
            width: width - 24,
            top: insets.top + 8,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.headerRow, { borderBottomColor: divider }]}>
          <Text style={[styles.title, { color: theme.text }]}>
            Notifications
          </Text>

          {notifications.length > 0 && (
            <TouchableOpacity onPress={markAllRead}>
              <Text style={{ color: theme.primary, fontWeight: "700" }}>
                Mark all
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* List */}
        <ScrollView>
          {notifications.length === 0 ? (
            <Text style={{ textAlign: "center", marginTop: 40 }}>
              No notifications
            </Text>
          ) : (
            notifications.map((n: NotificationItem, idx) => {
              const meta = getMeta(n.kind, theme.primary);

              return (
                <TouchableOpacity
                  key={n.id}
                  onPress={async () => {
                    await markRead(n.id);
                    onClose();
                  }}
                  style={[
                    styles.row,
                    n.unread && { backgroundColor: subtleHl },
                    idx !== notifications.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: divider,
                    },
                  ]}
                >
                  <View
                    style={[styles.iconWrap, { backgroundColor: meta.softBg }]}
                  >
                    <Ionicons name={meta.icon} size={20} color={meta.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.titleText, { color: theme.text }]}>
                      {n.title}
                    </Text>
                    {!!n.subtitle && (
                      <Text style={{ color: theme.subText }}>{n.subtitle}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    height: SHEET_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    padding: 14,
    gap: 10,
    alignItems: "center",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    fontWeight: "700",
  },
});
