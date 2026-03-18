import { useAuthContext } from "@/context/AuthContext";
import { getMeApi } from "@/features/auth/auth.api";
import { router } from "expo-router";
import { ChevronRight, LogOut } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../../context/ThemeContext";

const MENU_1 = [
  { label: "Edit Profile" },
  // { label: "Change Password" },
  // { label: "Payment Methods" },
];

const MENU_2 = [
  { label: "Help & Support" },
  { label: "Privacy Policy" },
  { label: "Terms of Service" },
];

export default function Profile() {
  const { logout, setAuthUser } = useAuthContext();

  const [profile, setProfile] = useState<{
    firstName: string;
    lastName: string;
    walletBalance: number;
    user: {
      phone: string;
      email?: string;
    };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const { theme, isDark } = useTheme();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await getMeApi();

        setProfile(me);

        // Optional but recommended: keep AuthContext in sync
        await setAuthUser({
          id: me.user.id,
          phone: me.user.phone,
          email: me.user.email,
          firstName: me.firstName,
          lastName: me.lastName,
          role: me.user.role,
        });
      } catch (e) {
        // Token expired / invalid
        await logout();
        router.replace("/(auth)/auth");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 120,
      }}
    >
      {/* PROFILE HEADER */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri: "https://i.pravatar.cc/150?img=12",
            }}
            style={styles.avatar}
          />
        </View>

        <Text style={[styles.name, { color: theme.text }]}>
          {profile
            ? `${profile.firstName} ${profile?.lastName ? profile?.lastName : ""}`
            : " "}
        </Text>

        <Text style={[styles.email, { color: theme.subText }]}>
          {profile?.user?.email ?? profile?.user?.phone}
        </Text>
      </View>

      {/* MENU CARD 1 */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {MENU_1.map((item, index) => (
          <MenuRow
            key={item.label}
            label={item.label}
            theme={theme}
            isLast={index === MENU_1.length - 1}
            onPress={() => {
              switch (item.label) {
                case "Edit Profile":
                  router.push("/edit-profile");
                  break;

                case "Payment Methods":
                  router.push("/wallet");
                  break;
              }
            }}
          />
        ))}
      </View>

      {/* MENU CARD 2 */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        {MENU_2.map((item, index) => (
          <MenuRow
            key={item.label}
            label={item.label}
            theme={theme}
            isLast={index === MENU_2.length - 1}
            onPress={() => {
              switch (item.label) {
                case "Help & Support":
                  router.push("/support");
                  break;
                case "Privacy Policy":
                  router.push("/privacy-policy");
                  break;
                case "Terms of Service":
                  router.push("/terms");
                  break;
              }
            }}
          />
        ))}
      </View>

      {/* LOGOUT */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.logoutBtn,
          { backgroundColor: isDark ? "#3B1F1F" : "#FEE2E2" },
        ]}
        // MENU 2
        onPress={async () => {
          await logout();
          router.replace("/(auth)/auth");
        }}
      >
        <LogOut size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ================= MENU ROW ================= */

function MenuRow({
  label,
  theme,
  isLast,
  onPress,
}: {
  label: string;
  theme: any;
  isLast: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.menuRow,
        !isLast && {
          borderBottomWidth: 1,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={[styles.menuText, { color: theme.text }]}>{label}</Text>
      <ChevronRight size={18} color={theme.subText} />
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },

  header: {
    alignItems: "center",
    marginBottom: 10,
  },

  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#FDF2E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },

  name: {
    fontSize: 18,
    fontWeight: "800",
  },

  email: {
    fontSize: 12,
    marginTop: 2,
  },

  card: {
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 54,
  },

  menuText: {
    fontSize: 14,
    fontWeight: "600",
  },

  logoutBtn: {
    marginTop: 5,
    height: 45,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  logoutText: {
    fontWeight: "800",
    color: "#EF4444",
  },
});
