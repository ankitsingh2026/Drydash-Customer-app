// components/layout/TabBar.tsx
import { Bell, CreditCard, Moon, Sun } from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../context/NotificationContext";
type TabBarProps = {
  onOpenNotifications: () => void;
  onWalletPress: () => void;
};

export const TabBar = ({
  onOpenNotifications,
  onWalletPress,
}: TabBarProps) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  return (
    <View style={[styles.safe, { backgroundColor: theme.background, paddingTop: insets.top ? 8 : 0 }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Image
            source={isDark ? require("../../assets/images/logo/whiteLogo.png") : require("../../assets/images/logo/blackLogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <View style={styles.right}>
          <TouchableOpacity activeOpacity={0.85} onPress={onWalletPress} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <CreditCard size={20} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.85} onPress={toggleTheme} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {isDark ? <Sun size={18} color={theme.primary} /> : <Moon size={18} color={theme.primary} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpenNotifications} style={styles.iconBtn}>
            <Bell size={20} />

            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: { zIndex: 30 },
  row: {
    marginTop: 25,
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center" },
  logo: { width: 104, height: 42 },
  right: { flexDirection: "row", alignItems: "center" },
  iconBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center", marginLeft: 6 },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    backgroundColor: "#EF4444",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
