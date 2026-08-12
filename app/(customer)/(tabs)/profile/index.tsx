import { useAuthContext } from "@/context/AuthContext";
import { getMeApi } from "@/features/auth/auth.api";
import { getOrdersApi } from "@/features/orders/orders.api";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTheme } from "@/theme/useTheme";
import { darkTheme } from "@/theme/darkTheme";
import {
  ChevronRight,
  FileText,
  Gift,
  Headset,
  LogOut,
  MapPinHouse,
  ShieldCheck,
  UserPen,
  Sun,
  Moon,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ================= HELPERS ================= */

function getInitials(firstName: string, lastName: string): string {
  const f = (firstName ?? "").trim()[0] ?? "";
  const l = (lastName ?? "").trim()[0] ?? "";
  return (f + l).toUpperCase() || "?";
}
const StatBox = React.memo(function StatBox({
  label,
  value,
  color,
  subColor,
}: {
  label: string;
  value: string | number;
  color: string;
  subColor: string;
}) {
  return (
    <View style={statBoxStyles.box}>
      <Text style={[statBoxStyles.value, { color }]}>{value}</Text>
      <Text style={[statBoxStyles.label, { color: subColor }]}>{label}</Text>
    </View>
  );
});

const statBoxStyles = StyleSheet.create({
  box: { flex: 1, alignItems: "center", paddingVertical: 14 },
  value: { fontSize: 18, fontWeight: "900" },
  label: { fontSize: 10, fontWeight: "600", marginTop: 3, letterSpacing: 0.5 },
});

const GridTile = React.memo(function GridTile({
  Icon,
  iconColor,
  label,
  sub,
  onPress,
  cardColor,
  borderColor,
  textColor,
  subColor,
}: {
  Icon: any;
  iconColor: string;
  label: string;
  sub?: string;
  onPress?: () => void;
  cardColor: string;
  borderColor: string;
  textColor: string;
  subColor: string;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        gridTileStyles.tile,
        { backgroundColor: cardColor, borderColor },
      ]}
    >
      <View style={gridTileStyles.icon}>
        <Icon color={iconColor} />
      </View>
      <Text style={[gridTileStyles.label, { color: textColor }]}>{label}</Text>
      {sub ? (
        <Text style={[gridTileStyles.sub, { color: subColor }]}>{sub}</Text>
      ) : null}
    </TouchableOpacity>
  );
});

const gridTileStyles = StyleSheet.create({
  tile: {
    width: "47.5%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    minHeight: 80,
    justifyContent: "center",
  },
  icon: { marginBottom: 6 },
  label: { fontSize: 13, fontWeight: "700" },
  sub: { fontSize: 10, marginTop: 3 },
});

/* ================= CUSTOM THEME TOGGLE ================= */

const CustomThemeToggle = React.memo(function CustomThemeToggle() {
  const { theme, isDark, toggleTheme, setThemeMode } = useTheme();
  const styles = useMemo(() => makeStyles(theme, isDark), [theme, isDark]);
  const activeIndex = isDark ? 1 : 0;
  const slideAnim = useRef(new Animated.Value(activeIndex)).current;
  const labelAnims = useRef([
    new Animated.Value(activeIndex === 0 ? 1 : 0),
    new Animated.Value(activeIndex === 1 ? 1 : 0),
  ]).current;
  const pillWidth = useRef(0);
  const [layoutReady, setLayoutReady] = useState(false);

  useEffect(() => {
    const targetIndex = isDark ? 1 : 0;
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: targetIndex,
        useNativeDriver: true,
        damping: 18,
        stiffness: 200,
        mass: 0.6,
      }),
      Animated.timing(labelAnims[0], {
        toValue: targetIndex === 0 ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(labelAnims[1], {
        toValue: targetIndex === 1 ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isDark]);

  const handleSelect = useCallback(
    (index: number) => {
      if (index === 0 && isDark) {
        if (setThemeMode) setThemeMode("light");
        else toggleTheme();
      } else if (index === 1 && !isDark) {
        if (setThemeMode) setThemeMode("dark");
        else toggleTheme();
      }
    },
    [isDark, setThemeMode, toggleTheme]
  );

  const THEME_OPTIONS = useMemo(
    () => [
      { key: "light", label: "Light", Icon: Sun },
      { key: "dark", label: "Dark", Icon: Moon },
    ],
    []
  );

  return (
    <View
      style={[
        styles.themeTabsWrap,
        { backgroundColor: isDark ? "#0A1F1B" : "#EBF5F2" },
      ]}
      onLayout={(e) => {
        const totalWidth = e.nativeEvent.layout.width;
        const padding = 4;
        const gap = 4;
        pillWidth.current = (totalWidth - padding * 2 - gap) / 2;
        if (!layoutReady) setLayoutReady(true);
      }}
    >
      {layoutReady && (
        <Animated.View
          style={[
            styles.themeSlidingPill,
            {
              width: pillWidth.current,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, pillWidth.current + 4],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              isDark ? theme.primary : "#FFFFFF",
              isDark ? theme.primary : "#FFFFFF",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {THEME_OPTIONS.map((opt, i) => {
        const active = (i === 0 && !isDark) || (i === 1 && isDark);
        const IconComponent = opt.Icon;

        const activeTextColor = isDark ? "#FFFFFF" : theme.primary;
        const inactiveTextColor = isDark ? "#94A3B8" : "#64748B";

        return (
          <TouchableOpacity
            key={opt.key}
            onPress={() => handleSelect(i)}
            activeOpacity={0.85}
            style={styles.themeTabOuter}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}

          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <IconComponent
                size={14}
                color={active ? activeTextColor : inactiveTextColor}
              />
              <Animated.Text
                style={[
                  styles.themeTabLabel,
                  {
                    color: labelAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [inactiveTextColor, activeTextColor],
                    }),
                    fontWeight: active ? "800" : "600",
                  },
                ]}
              >
                {opt.label}
              </Animated.Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

/* ================= PROFILE ================= */

export default function Profile() {
  const { theme, colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(theme, isDark), [theme, isDark]);
  const { logout, setAuthUser } = useAuthContext();
  const [profile, setProfile] = useState<any>(null);

  const activeColors = useMemo(
    () => ({
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
    }),
    [colors, theme, isDark]
  );

  useEffect(() => {
    let cancelled = false;

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

        if (cancelled) return;
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
        if (cancelled) return;
        await logout();
        router.replace("/(auth)/auth");
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const initials = profile
    ? getInitials(profile.firstName, profile.lastName)
    : "";

  const displayContact = profile?.user?.phone || profile?.user?.email || "";

  const onShareReferral = useCallback(async () => {
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
  }, []);

  const referGradColors = useMemo(
    () =>
      (isDark
        ? [theme.background, theme.background, theme.background]
        : ["#E6F4F0", "#D3EBE4", "#C2E8DD"]) as [string, string, ...string[]],
    [isDark, theme]
  );

  const iconColor = isDark ? theme.textSecondary : theme.icon;

  const onEditProfile = useCallback(() => {
    router.push({
      pathname: "/edit-profile",
      params: {
        name: `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`,
        phone: profile?.user?.phone ?? "",
      },
    });
  }, [profile]);

  const onHelpSupport = useCallback(() => {
    router.push("/(customer)/(tabs)/assistant");
  }, []);

  const onSavedAddresses = useCallback(() => {
    router.push("/saved-address");
  }, []);

  const onPrivacyPolicy = useCallback(() => {
    router.push("/privacy-policy");
  }, []);

  const onTerms = useCallback(() => {
    router.push("/terms");
  }, []);

  const onLogout = useCallback(async () => {
    await logout();
    router.replace("/(auth)/auth");
  }, [logout]);

  // ─── Render ───
  return (
    <SafeAreaView edges={["top"]} style={[styles.safe, { backgroundColor: activeColors.bg }]}>
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
                <Text style={[styles.initialsText, { color: activeColors.primary }]}>
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
          <StatBox label="ORDERS" value={profile?.orders ?? 0} color={activeColors.text} subColor={activeColors.subText} />
          <View style={[styles.statDivider, { backgroundColor: activeColors.border }]} />
          <StatBox
            label="SAVED"
            value={`₹${(profile?.saved ?? 0).toLocaleString("en-IN")}`}
            color={activeColors.primary}
            subColor={activeColors.subText}
          />
          <View style={[styles.statDivider, { backgroundColor: activeColors.border }]} />
          <StatBox label="SERVICES" value={profile?.services ?? 0} color={activeColors.text} subColor={activeColors.subText} />
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
            <View style={styles.referIconBox}>
              <LinearGradient
                colors={[activeColors.primary, activeColors.primaryDim]}
                style={styles.referIconGrad}
              >
                <Gift size={18} color={isDark ? theme.background : theme.text} />
              </LinearGradient>
            </View>

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

          <CustomThemeToggle />
        </View>

        {/* ── GRID MENU ── */}
        <View style={styles.grid}>
          <GridTile
            Icon={UserPen}
            iconColor={iconColor}
            label="Edit Profile"
            onPress={onEditProfile}
            cardColor={activeColors.card}
            borderColor={activeColors.border}
            textColor={activeColors.text}
            subColor={activeColors.subText}
          />
          <GridTile
            Icon={Headset}
            iconColor={iconColor}
            label="Help & Support"
            sub="Instant help or request call"
            onPress={onHelpSupport}
            cardColor={activeColors.card}
            borderColor={activeColors.border}
            textColor={activeColors.text}
            subColor={activeColors.subText}
          />
          <GridTile
            Icon={MapPinHouse}
            iconColor={iconColor}
            label="Saved Addresses"
            onPress={onSavedAddresses}
            cardColor={activeColors.card}
            borderColor={activeColors.border}
            textColor={activeColors.text}
            subColor={activeColors.subText}
          />
          <GridTile
            Icon={ShieldCheck}
            iconColor={iconColor}
            label="Privacy Policy"
            onPress={onPrivacyPolicy}
            cardColor={activeColors.card}
            borderColor={activeColors.border}
            textColor={activeColors.text}
            subColor={activeColors.subText}
          />
          <GridTile
            Icon={FileText}
            iconColor={iconColor}
            label="Terms & Condition"
            onPress={onTerms}
            cardColor={activeColors.card}
            borderColor={activeColors.border}
            textColor={activeColors.text}
            subColor={activeColors.subText}
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
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
    pageTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 20,
    },
    header: { alignItems: "center", marginBottom: 20 },
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
    initialsText: { fontSize: 28, fontWeight: "900", color: colors.primary, letterSpacing: 1 },
    name: { fontSize: 20, fontWeight: "900", color: colors.text, marginBottom: 4 },
    contact: { fontSize: 12, color: colors.subText },
    statsRow: {
      flexDirection: "row",
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
      overflow: "hidden",
    },
    statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 12 },
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
    referIconBox: { borderRadius: 10, overflow: "hidden" },
    referIconGrad: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
    referText: { flex: 1 },
    referTitle: { fontSize: 14, fontWeight: "800", color: colors.text },
    referSub: { fontSize: 11, color: colors.subText, marginTop: 2 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
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

    themeTabsWrap: {
      flexDirection: "row",
      padding: 4,
      borderRadius: 20,
      gap: 4,
      position: "relative",
      width: 160,
      height: 40,
      alignItems: "center",
    },
    themeSlidingPill: {
      position: "absolute",
      top: 4,
      bottom: 4,
      left: 4,
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: theme.primary,
      shadowOpacity: 0.3,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    themeTabOuter: { flex: 1, height: "100%", alignItems: "center", justifyContent: "center", zIndex: 1 },
    themeTabLabel: { fontSize: 13, letterSpacing: 0.1 },
  });
};