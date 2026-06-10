import { useAuthContext } from "@/context/AuthContext";
import { getMeApi } from "@/features/auth/auth.api";
import { getOrdersApi } from "@/features/orders/orders.api";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
/* ================= THEME ================= */

const COLORS = {
  bg: "#031612",
  card: "#0D1F1C",
  border: "#1A3330",
  primary: "#2FE6A6",
  primaryDim: "#1A9E74",
  text: "#E6FFF7",
  subText: "#8FB3A8",
  dangerBg: "#2A1515",
  dangerBorder: "#4B1F1F",
  danger: "#FF5A5A",
  statBorder: "#1A3330",
};

/* ================= HELPERS ================= */

function getInitials(firstName: string, lastName: string): string {
  const f = (firstName ?? "").trim()[0] ?? "";
  const l = (lastName ?? "").trim()[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

/* ================= PROFILE ================= */

export default function Profile() {
  const { logout, setAuthUser } = useAuthContext();
  const [profile, setProfile] = useState<any>(null);

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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── PAGE TITLE ── */}
        <Text style={styles.pageTitle}>Profile</Text>

        {/* ── AVATAR + NAME ── */}
        <View style={styles.header}>
          {/* Initials avatar with glow */}
          <View style={styles.avatarGlow}>
            <LinearGradient
              colors={["#2FE6A6", "#1A9E74"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarRing}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.name}>
            {profile
              ? `${profile.firstName} ${profile.lastName || ""}`.trim()
              : ""}
          </Text>
          <Text style={styles.contact}>{displayContact}</Text>
        </View>

        {/* ── STATS ROW ── */}
        <View style={styles.statsRow}>
          <StatBox label="ORDERS" value={profile?.orders ?? 0} />
          <View style={styles.statDivider} />
          <StatBox
            label="SAVED"
            value={`₹${(profile?.saved ?? 0).toLocaleString("en-IN")}`}
            accent
          />
          <View style={styles.statDivider} />
          <StatBox label="SERVICES" value={profile?.services ?? 0} />
        </View>

        {/* ── REFER & EARN ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onShareReferral}
          style={styles.referWrapper}
        >
          <LinearGradient
            colors={["#0D3D2E", "#0B2E22", "#072019"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.referGradient}
          >
            {/* left icon */}
            <View style={styles.referIconBox}>
              <LinearGradient
                colors={["#2FE6A6", "#1A9E74"]}
                style={styles.referIconGrad}
              >
                <Gift size={18} color="#031612" />
              </LinearGradient>
            </View>

            {/* text */}
            <View style={styles.referText}>
              <Text style={styles.referTitle}>Refer &amp; Earn</Text>
              <Text style={styles.referSub}>
                Get ₹50 for every friend joined
              </Text>
            </View>

            <ChevronRight size={18} color={COLORS.subText} />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── GRID MENU ── */}
        <View style={styles.grid}>
          <GridTile
            icon={<UserPen color="rgba(159,255,211,0.7)" />}
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
            icon={<Headset color="rgba(159,255,211,0.7)" />}
            label="Help & Support"
            sub="Instant help or request call"
            onPress={() => router.push("/(customer)/(tabs)/assistant")}
          />
          <GridTile
            icon={<MapPinHouse color="rgba(159,255,211,0.7)" />}
            label="Saved Addresses"
            onPress={() => router.push("/saved-address")}
          />
          <GridTile
            icon={<Wallet color="rgba(159,255,211,0.7)" />}
            label="Wallet"
            onPress={() => router.push("/wallet")}
          />
          <GridTile
            icon={<ShieldCheck color="rgba(159,255,211,0.7)" />}
            label="Privacy Policy"
            onPress={() => router.push("/privacy-policy")}
          />
          <GridTile
            icon={<FileText color="rgba(159,255,211,0.7)" />}
            label="Terms & Condition"
            onPress={() => router.push("/terms")}
          />
        </View>

        {/* ── LOGOUT ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.logoutBtn}
          onPress={async () => {
            await logout();
            router.replace("/(auth)/auth");
          }}
        >
          <LogOut size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STAT BOX ================= */

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
      <Text style={[styles.statValue, accent && { color: COLORS.primary }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ================= GRID TILE ================= */

function GridTile({
  icon,
  label,
  sub,
  onPress,
}: {
  icon: string;
  label: string;
  sub?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={styles.gridTile}
    >
      <Text style={styles.gridIcon}>{icon}</Text>
      <Text style={styles.gridLabel}>{label}</Text>
      {sub ? <Text style={styles.gridSub}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },

  pageTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 20,
  },

  /* ── HEADER ── */
  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatarGlow: {
    shadowColor: "#2FE6A6",
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
    backgroundColor: "#0D2820",
    alignItems: "center",
    justifyContent: "center",
  },

  initialsText: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 1,
  },

  name: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 4,
  },

  contact: {
    fontSize: 12,
    color: COLORS.subText,
  },

  /* ── STATS ── */
  statsRow: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },

  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.subText,
    marginTop: 3,
    letterSpacing: 0.5,
  },

  /* ── REFER ── */
  referWrapper: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1A4035",
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

  referText: {
    flex: 1,
  },

  referTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },

  referSub: {
    fontSize: 11,
    color: COLORS.subText,
    marginTop: 2,
  },

  /* ── GRID ── */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  gridTile: {
    width: "47.5%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    minHeight: 80,
    justifyContent: "center",
  },

  gridIcon: {
    fontSize: 22,
    marginBottom: 6,
    color: "#fff",
  },

  gridLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },

  gridSub: {
    fontSize: 10,
    color: COLORS.subText,
    marginTop: 3,
  },

  /* ── LOGOUT ── */
  logoutBtn: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: COLORS.dangerBg,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4F46E5", // you can change color
    justifyContent: "center",
    alignItems: "center",
  },

  initials: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },

  logoutText: {
    fontWeight: "800",
    fontSize: 15,
    color: COLORS.danger,
  },
});
