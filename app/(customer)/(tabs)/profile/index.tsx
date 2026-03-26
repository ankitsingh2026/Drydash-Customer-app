import { useAuthContext } from "@/context/AuthContext";
import { getMeApi } from "@/features/auth/auth.api";
import { router } from "expo-router";
import { ChevronRight, LogOut } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ================= THEME ================= */

const COLORS = {
  bg: "#031612",
  card: "#0D1F1C",
  border: "#1A3330",
  primary: "#2FE6A6",
  text: "#E6FFF7",
  subText: "#8FB3A8",
  dangerBg: "#2A1515",
  danger: "#FF5A5A",
};

/* ================= MENU ================= */

const MENU_1 = [{ label: "Edit Profile" }];

const MENU_2 = [
  { label: "Help & Support" },
  { label: "Privacy Policy" },
  { label: "Terms of Service" },
];

export default function Profile() {
  const { logout, setAuthUser } = useAuthContext();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await getMeApi();

        // ✅ SAFE BACKEND HANDLING
        const formatted = {
          firstName: me.firstName ?? me.name?.split(" ")[0] ?? "",
          lastName: me.lastName ?? me.name?.split(" ").slice(1).join(" ") ?? "",
          walletBalance: me.walletBalance ?? 0,
          user: {
            phone: me.user?.phone ?? me.phone ?? "",
            email: me.user?.email ?? me.email,
          },
        };

        setProfile(formatted);

        await setAuthUser({
          id: me.user.id,
          phone: me.user.phone,
          email: me.user.email,
          firstName: formatted.firstName,
          lastName: formatted.lastName,
          role: me.user.role,
        });
      } catch (e) {
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
        backgroundColor: COLORS.bg,
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 120,
      }}
    >
      {/* PROFILE HEADER */}
      <View style={styles.header}>
        <View style={styles.avatarGlow}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: "https://i.pravatar.cc/150?img=12",
              }}
              style={styles.avatar}
            />
          </View>
        </View>

        <Text style={styles.name}>
          {profile
            ? `${profile.firstName} ${profile.lastName || ""}`
            : ""}
        </Text>

        <Text style={styles.email}>
          {profile?.user?.email ?? profile?.user?.phone}
        </Text>
      </View>

      {/* MENU CARD 1 */}
      <View style={styles.card}>
        {MENU_1.map((item, index) => (
          <MenuRow
            key={item.label}
            label={item.label}
            isLast={index === MENU_1.length - 1}
            onPress={() => {
              if (item.label === "Edit Profile") {
                router.push({
                  pathname: "/edit-profile",
                  params: {
                    name: `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`,
                    phone: profile?.user?.phone ?? "",
                  },
                });
              }
            }}
          />
        ))}
      </View>

      {/* MENU CARD 2 */}
      <View style={styles.card}>
        {MENU_2.map((item, index) => (
          <MenuRow
            key={item.label}
            label={item.label}
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
        style={styles.logoutBtn}
        onPress={async () => {
          await logout();
          router.replace("/(auth)/auth");
        }}
      >
        <LogOut size={18} color={COLORS.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ================= MENU ROW ================= */

function MenuRow({
  label,
  isLast,
  onPress,
}: {
  label: string;
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
          borderColor: COLORS.border,
        },
      ]}
    >
      <Text style={styles.menuText}>{label}</Text>
      <ChevronRight size={18} color={COLORS.subText} />
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: 14,
  },

  avatarGlow: {
    shadowColor: "#2FE6A6",
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },

  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#0D1F1C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1A3330",
  },

  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },

  name: {
    fontSize: 20,
    fontWeight: "900",
    color: "#E6FFF7",
  },

  email: {
    fontSize: 12,
    marginTop: 2,
    color: "#8FB3A8",
  },

  card: {
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    backgroundColor: "#0D1F1C",
    borderWidth: 1,
    borderColor: "#1A3330",
    paddingVertical: 4,
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
    color: "#E6FFF7",
  },

  logoutBtn: {
    marginTop: 6,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#2A1515",
    borderWidth: 1,
    borderColor: "#4B1F1F",
  },

  logoutText: {
    fontWeight: "800",
    color: "#FF5A5A",
  },
});