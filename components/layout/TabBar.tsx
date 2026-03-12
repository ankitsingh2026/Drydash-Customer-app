// components/layout/TabBar.tsx
import { useAuthContext } from "@/context/AuthContext";
import { getMeApi } from "@/features/auth/auth.api";
import { Bell, Wallet } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications } from "../../context/NotificationContext";
import { useTheme } from "../../context/ThemeContext";

type Profile = {
  firstName: string;
  lastName: string;
  walletBalance: number;
  user: {
    phone: string;
    email?: string;
  };
};

type TabBarProps = {
  onOpenNotifications: () => void;
  onWalletPress: () => void;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export const TabBar = ({ onOpenNotifications, onWalletPress }: TabBarProps) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const { setAuthUser, logout } = useAuthContext();

  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const me = await getMeApi();
        await setAuthUser(me);
        if (me) {
          setProfile({
            firstName: me.firstName ?? me.name?.split(" ")[0] ?? "",
            lastName: me.lastName ?? me.name?.split(" ").slice(1).join(" ") ?? "",
            walletBalance: me.walletBalance ?? 0,
            user: {
              phone: me.phone ?? me.user?.phone ?? "",
              email: me.email ?? me.user?.email,
            },
          });
        }
      } catch {
        // silently fail – auth handled elsewhere
      }
    };
    fetchProfile();
  }, []);

  const displayName = profile
    ? `${profile.firstName}${profile.lastName ? ` ${profile.lastName}` : ""}`
    : "";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top || 8,
        },
      ]}
    >
      <View style={styles.row}>
        {/* LEFT — Greeting + Name */}
        <View style={styles.left}>
          <Text style={[styles.greeting, { color: theme.subText }]}>
            {getGreeting()},
          </Text>
          <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        {/* CENTER — Brand */}
        <Text style={[styles.brand, { color: theme.text }]}>DryDash</Text>

        {/* RIGHT — Icons */}
        <View style={styles.right}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onWalletPress}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Wallet  size={20} color={theme.text} />
          </TouchableOpacity>

          {/* <TouchableOpacity
            activeOpacity={0.75}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Settings size={20} color={theme.text} />
          </TouchableOpacity> */}

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onOpenNotifications}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Bell size={20} color={theme.text} />
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
  container: {
    zIndex: 30,
  },
  row: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  /* Left */
  left: {
    flex: 1,
    justifyContent: "center",
  },
  greeting: {
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
  },

  /* Center */
  brand: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.3,
    textAlign: "center",
  },

  /* Right */
  right: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    backgroundColor: "#EF4444",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
});