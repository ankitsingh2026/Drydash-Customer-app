// components/NotificationsTopSheet.tsx
import { useNotifications } from "@/context/NotificationContext";
import { Bell, X } from "lucide-react-native";
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

const { width } = Dimensions.get("window");
const SHEET_HEIGHT = 320;

export default function NotificationsTopSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { notifications, markAllRead } = useNotifications();

  const translateY = useRef(new Animated.Value(-SHEET_HEIGHT)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const unreadBg = isDark
    ? "rgba(52,211,153,0.12)"
    : "rgba(52,211,153,0.16)";

  /** Animate + mark read when opened */
  useEffect(() => {
    if (visible) {
      markAllRead(); // 🔥 sync badge → zero
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -SHEET_HEIGHT,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* BACKDROP */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
      </Pressable>

      {/* SHEET */}
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
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Notifications
          </Text>

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* LIST */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          {notifications.length === 0 && (
            <Text style={[styles.empty, { color: theme.subText }]}>
              No notifications yet
            </Text>
          )}

          {notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              activeOpacity={0.88}
              style={[
                styles.card,
                {
                  backgroundColor: n.unread ? unreadBg : theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: theme.primary + "22" },
                ]}
              >
                <Bell size={26} color={theme.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  {n.title}
                </Text>

                {!!n.subtitle && (
                  <Text style={[styles.cardSub, { color: theme.subText }]}>
                    {n.subtitle}
                  </Text>
                )}
              </View>

              {n.unread && <View style={styles.dot} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    alignItems: "center",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  sheet: {
    position: "absolute",
    height: SHEET_HEIGHT,
    borderRadius: 20,
    paddingHorizontal: 12,
    elevation: 18,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
  },

  title: {
    fontSize: 17,
    fontWeight: "900",
  },

  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },

  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  cardSub: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    marginLeft: 6,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 13,
    fontWeight: "600",
  },
});
