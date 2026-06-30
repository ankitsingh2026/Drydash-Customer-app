import { useAuthContext } from "@/context/AuthContext";
import { getMeApi } from "@/features/auth/auth.api";
import { getOrdersApi } from "@/features/orders/orders.api";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTheme } from "@/theme/useTheme";
import { darkTheme } from "@/theme/darkTheme";
import { Switch } from "react-native";
import {
  ChevronRight,
  FileText,
  Gift,
  Headset,
  LogOut,
  MapPinHouse,
  ShieldCheck,
  UserPen,
  Wallet,
  Sun,
  Moon,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ================= HELPERS ================= */

function getInitials(firstName: string, lastName: string): string {
  const f = (firstName ?? "").trim()[0] ?? "";
  const l = (lastName ?? "").trim()[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

/* ================= PROFILE ================= */

export default function Profile() {
  const { theme, colors, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(theme, isDark);
  const { logout, setAuthUser } = useAuthContext();
  const [profile, setProfile] = useState<any>(null);

  const activeColors = {
    bg: colors.background,
    card: colors.card,
    border: colors.border,
    primary: colors.primary,
    primaryDim: isDark ? theme.card : theme.background,
    text: colors.text,
    subText: colors.subText,
    dangerBg: isDark ? theme.border : "#FDF2F2",
    dangerBorder: isDark ? "#4B1F1F" : "#FDE8E8",
    danger: "#FF5A5A",
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await getMeApi();
        let orderCount = me.orders ?? me.totalOrders ?? 0;

        if (!orderCount) {
          try {
            const phone = me.user?.phone ?? me.phone;
            if (phone) {
              const res = await getOrdersApi(phone);
              orderCount = res?.orders?.length || 0;
            }
          } catch (err) {
            console.log("Error fetching order count:", err);
          }
        }

        const formatted = {
          firstName: me.firstName ?? me.name?.split(" ")[0] ?? "",
          lastName: me.lastName ?? me.name?.split(" ").slice(1).join(" ") ?? "",
          walletBalance: me.walletBalance ?? 0,
          orders: orderCount,
          saved: me.saved ?? me.walletBalance ?? 0,
          services: me.services ?? 0,
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
      } catch {
        await logout();
        router.replace("/(auth)/auth");
      }
    };
    loadProfile();
  }, []);

  const initials = profile
    ? getInitials(profile.firstName, profile.lastName)
    : "";

  const displayContact = profile?.user?.phone || profile?.user?.email || "";

  const onShareReferral = async () => {
    try {
      await Share.share({
        message: `🎉 Get ₹50 on your first DryDash order!
 
Download DryDash:
 
Android:
https://play.google.com/store/apps/details?id=com.drydash.newCustomer
 
iOS:
https://apps.apple.com/in/app/drydash/id6761757578
 
Use my referral code: DRYDASH50
 
Laundry • Dry Clean • Shoe Spa 🚀`,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const referGradColors = (isDark
    ? [theme.background, theme.background, theme.background]
    : ["#E6F4F0", "#D3EBE4", "#C2E8DD"]) as [string, string, ...string[]];

  // ─── Helper components moved inside Profile ───
  function StatBox({
    label,
    value,
    accent,
  }: {
    label: string;
    value: string | number;
    accent?: boolean;
  }) {
    return (
      <View style={styles.statBox}>
        <Text
          style={[
            styles.statValue,
            { color: accent ? activeColors.primary : activeColors.text },
          ]}
        >
          {value}
        </Text>
        <Text style={[styles.statLabel, { color: activeColors.subText }]}>
          {label}
        </Text>
      </View>
    );
  }

  function GridTile({
    icon,
    label,
    sub,
    onPress,
    style,
  }: {
    icon: any;
    label: string;
    sub?: string;
    onPress?: () => void;
    style?: any;
  }) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        style={[
          styles.gridTile,
          { backgroundColor: activeColors.card, borderColor: activeColors.border },
          style,
        ]}
      >
        <View style={styles.gridIcon}>{icon}</View>
        <Text style={[styles.gridLabel, { color: activeColors.text }]}>
          {label}
        </Text>
        {sub ? (
          <Text style={[styles.gridSub, { color: activeColors.subText }]}>
            {sub}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  }

  // ─── Render ───
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: activeColors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── PAGE TITLE ── */}
        <Text style={[styles.pageTitle, { color: activeColors.text }]}>
          Profile
        </Text>

        {/* ── AVATAR + NAME ── */}
        <View style={styles.header}>
          {/* Initials avatar with glow */}
          <View
            style={[
              styles.avatarGlow,
              isDark && { shadowColor: theme.primary },
            ]}
          >
            <LinearGradient
              colors={[activeColors.primary, activeColors.primaryDim]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View
                style={[
                  styles.avatarInner,
                  { backgroundColor: isDark ? theme.background : "#E6F4F0" },
                ]}
              >
                <Text
                  style={[styles.initialsText, { color: activeColors.primary }]}
                >
                  {initials}
                </Text>
              </View>
            </LinearGradient>
          </View>

          <Text style={[styles.name, { color: activeColors.text }]}>
            {profile
              ? `${profile.firstName} ${profile.lastName || ""}`.trim()
              : ""}
          </Text>
          <Text style={[styles.contact, { color: activeColors.subText }]}>
            {displayContact}
          </Text>
        </View>

        {/* ── STATS ROW ── */}
        <View
          style={[
            styles.statsRow,
            { backgroundColor: activeColors.card, borderColor: activeColors.border },
          ]}
        >
          <StatBox label="ORDERS" value={profile?.orders ?? 0} />
          <View
            style={[styles.statDivider, { backgroundColor: activeColors.border }]}
          />
          <StatBox
            label="SAVED"
            value={`₹${(profile?.saved ?? 0).toLocaleString("en-IN")}`}
            accent
          />
          <View
            style={[styles.statDivider, { backgroundColor: activeColors.border }]}
          />
          <StatBox label="SERVICES" value={profile?.services ?? 0} />
        </View>

        {/* ── REFER & EARN ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onShareReferral}
          style={[
            styles.referWrapper,
            { borderColor: isDark ? theme.card : activeColors.border },
          ]}
        >
          <LinearGradient
            colors={referGradColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.referGradient}
          >
            {/* left icon */}
            <View style={styles.referIconBox}>
              <LinearGradient
                colors={[activeColors.primary, activeColors.primaryDim]}
                style={styles.referIconGrad}
              >
                <Gift
                  size={18}
                  color={isDark ? theme.background : theme.text}
                />
              </LinearGradient>
            </View>

            {/* text */}
            <View style={styles.referText}>
              <Text style={[styles.referTitle, { color: activeColors.text }]}>
                Refer &amp; Earn
              </Text>
              <Text style={[styles.referSub, { color: activeColors.subText }]}>
                Get ₹50 for every friend joined
              </Text>
            </View>

            <ChevronRight size={18} color={activeColors.subText} />
          </LinearGradient>
        </TouchableOpacity>
        <View
          style={[
            styles.themeCard,
            {
              backgroundColor: activeColors.card,
              borderColor: activeColors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.themeTitle,
              { color: activeColors.text },
            ]}
          >
            Theme
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleTheme}
            style={[
              styles.themeSelector,
              {
                borderColor: activeColors.border,
                backgroundColor: activeColors.bg,
              },
            ]}
          >
            <Text
              style={{
                color: activeColors.text,
                fontWeight: "600",
                fontSize: 13,
              }}
            >
              {isDark ? "Light" : "Dark"}
            </Text>

            {isDark ? (
              <Sun size={14} color={activeColors.text} />
            ) : (
              <Moon size={14} color={activeColors.text} />
            )}
          </TouchableOpacity>
        </View>

        {/* ── GRID MENU ── */}
        <View style={styles.grid}>
          <GridTile
            icon={<UserPen color={isDark ? theme.textSecondary : theme.icon} />}
            label="Edit Profile"
            onPress={() =>
              router.push({
                pathname: "/edit-profile",
                params: {
                  name: `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`,
                  phone: profile?.user?.phone ?? "",
                },
              })
            }
          />
          <GridTile
            icon={<Headset color={isDark ? theme.textSecondary : theme.icon} />}
            label="Help & Support"
            sub="Instant help or request call"
            onPress={() => router.push("/(customer)/(tabs)/assistant")}
          />
          <GridTile
            icon={<MapPinHouse color={isDark ? theme.textSecondary : theme.icon} />}
            label="Saved Addresses"
            onPress={() => router.push("/saved-address")}
          />
          {/* <GridTile
            icon={<Wallet color={isDark ? theme.textSecondary : theme.icon} />}
            label="Wallet"
            onPress={() => router.push("/wallet")}
          /> */}
          <GridTile
            icon={<ShieldCheck color={isDark ? theme.textSecondary : theme.icon} />}
            label="Privacy Policy"
            onPress={() => router.push("/privacy-policy")}
          />
          <GridTile
            icon={<FileText color={isDark ? theme.textSecondary : theme.icon} />}
            label="Terms & Condition"
            onPress={() => router.push("/terms")}
          />
        </View>

        {/* ── LOGOUT ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[
            styles.logoutBtn,
            {
              backgroundColor: activeColors.dangerBg,
              borderColor: activeColors.dangerBorder,
            },
          ]}
          onPress={async () => {
            await logout();
            router.replace("/(auth)/auth");
          }}
        >
          <LogOut size={18} color={activeColors.danger} />
          <Text style={[styles.logoutText, { color: activeColors.danger }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const makeStyles = (theme: any, isDark: boolean) => {
  const colors = {
    ...darkTheme.colors,
    bg: darkTheme.colors.background,
    dangerBg: theme.border,
    dangerBorder: "#4B1F1F",
    danger: "#FF5A5A",
  };
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 120,
    },
    pageTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 20,
    },
    header: {
      alignItems: "center",
      marginBottom: 20,
    },
    avatarGlow: {
      shadowColor: theme.primary,
      shadowOpacity: 0.35,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 0 },
      marginBottom: 12,
    },
    avatarRing: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInner: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
    },
    initialsText: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.primary,
      letterSpacing: 1,
    },
    name: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.text,
      marginBottom: 4,
    },
    contact: {
      fontSize: 12,
      color: colors.subText,
    },
    statsRow: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
      overflow: "hidden",
    },
    statBox: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "900",
      color: colors.text,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.subText,
      marginTop: 3,
      letterSpacing: 0.5,
    },
    referWrapper: {
      borderRadius: 18,
      overflow: "hidden",
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.card,
    },
    referGradient: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 14,
      gap: 12,
    },
    referIconBox: {
      borderRadius: 10,
      overflow: "hidden",
    },
    referIconGrad: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    referText: { flex: 1 },
    referTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
    referSub: { fontSize: 11, color: colors.subText, marginTop: 2 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
    gridTile: {
      width: "47.5%",
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      minHeight: 80,
      justifyContent: "center",
    },
    gridIcon: { fontSize: 22, marginBottom: 6, color: theme.text },
    gridLabel: { fontSize: 13, fontWeight: "700", color: colors.text },
    gridSub: { fontSize: 10, color: colors.subText, marginTop: 3 },
    logoutBtn: {
      height: 52,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 10,
      backgroundColor: colors.dangerBg,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#4F46E5",
      justifyContent: "center",
      alignItems: "center",
    },
    initials: { color: theme.text, fontSize: 28, fontWeight: "bold" },
    logoutText: { fontWeight: "800", fontSize: 15, color: colors.danger },
    themeCard: {
      height: 52,
      borderRadius: 14,
      borderWidth: 1,
      paddingHorizontal: 14,
      marginBottom: 14,

      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    themeTitle: {
      fontSize: 15,
      fontWeight: "700",
    },

    themeSelector: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,

      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
  });
};