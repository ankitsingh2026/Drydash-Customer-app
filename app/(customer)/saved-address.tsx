import { deleteAddressApi, getAddressApi } from "@/features/orders/orders.api";
import { useAuth } from "@/hooks/useAuth";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  ArrowLeft,
  Briefcase,
  Home,
  MapPin,
  MapPinPlus,
  Pencil,
  Trash2
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ─────────── constants ─────────── */

const { width } = Dimensions.get("window");

const C = {
  bg: "#031612",
  card: "#0B1E1A",
  cardBorder: "#163028",
  cardBorderActive: "#2FE6A6",
  primary: "#2FE6A6",
  primaryDim: "#1A9E74",
  text: "#E6FFF7",
  subText: "#6FA090",
  muted: "#3A5E55",
  danger: "#FF5A5A",
  dangerBg: "#2A1515",
  mapBg: "#061A14",
  defaultBadgeBg: "#2FE6A6",
  defaultBadgeText: "#031612",
};

type Address = {
  id: string;
  label: "Home" | "Office" | "Other";
  addressLine1: string;
  city: string;
  state: string;
  isDefault?: boolean;
};

/* ─────────── map decoration ─────────── */

function MapDecoration() {
  return (
    <View style={styles.mapWrapper}>
      {/* faint grid lines */}
      {[...Array(6)].map((_, i) => (
        <View
          key={`h${i}`}
          style={[styles.gridLineH, { top: 20 + i * 22 }]}
        />
      ))}
      {[...Array(8)].map((_, i) => (
        <View
          key={`v${i}`}
          style={[styles.gridLineV, { left: 10 + i * 44 }]}
        />
      ))}

      {/* glowing road shape */}
      <View style={styles.roadOuter}>
        <View style={styles.roadInner} />
      </View>

      {/* live dispatch badge */}
      <View style={styles.dispatchBadge}>
        <View style={styles.dispatchDot} />
        <Text style={styles.dispatchText}>LIVE DISPATCH RANGE</Text>
      </View>
    </View>
  );
}

/* ─────────── address card ─────────── */

function AddressCard({
  address,
  index,
  onEdit,
  onDelete,
}: {
  address: Address;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const scale = useRef(new Animated.Value(0.96)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const IconComp =
    address.label === "Home"
      ? Home
      : address.label === "Office"
        ? Briefcase
        : MapPin;

  const isDefault = address.isDefault || index === 0;

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <View
        style={[
          styles.card,
          isDefault && styles.cardActive,
        ]}
      >
        {/* left accent bar for default */}
        {isDefault && <View style={styles.cardAccentBar} />}

        <View style={styles.cardContent}>
          {/* top row */}
          <View style={styles.cardTopRow}>
            <View style={styles.labelRow}>
              <IconComp size={17} color={C.primary} />
              <Text style={styles.cardLabel}>{address.label}</Text>
              {isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                </View>
              )}
            </View>

            {/* actions */}
            <View style={styles.actions}>
              <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
                <Pencil size={15} color={C.subText} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
                <Trash2 size={15} color={C.subText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* address text */}
          <Text style={styles.addressLine1}>{address.addressLine1}</Text>
          <Text style={styles.addressLine2}>
            {address.city}, {address.state}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

/* ─────────── screen ─────────── */

export default function SavedAddresses() {
  const { user } = useAuth();
  const authId = user?.user?.id ?? user?.id;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  /* android back */
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, []);

  /* fetch */
  useEffect(() => {
    if (!authId) return;
    const fetch = async () => {
      try {
        const data = await getAddressApi(authId);
        const list: any[] = Array.isArray(data?.results) ? data.results : [];
        setAddresses(
          list.map((a) => ({
            id: String(a.id),
            label:
              a.label === "Home"
                ? "Home"
                : a.label === "Office"
                  ? "Office"
                  : "Other",
            addressLine1: a.addressLine1 ?? a.address ?? "",
            city: a.city ?? "",
            state: a.state ?? "",
            isDefault: a.isDefault ?? false,
          }))
        );
      } catch (e) {
        console.log("address fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [authId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteAddressApi(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={C.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Saved Locations</Text>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── TAB ROW ── */}
          <View style={styles.tabRow}>
            <View style={styles.activeTab}>
              <Text style={styles.activeTabText}>Active Destinations</Text>
              {/* <View style={styles.activeTabUnderline} /> */}
            </View>

            <Text style={styles.countText}>
              {addresses.length} LOCATION{addresses.length !== 1 ? "S" : ""} SAVED
            </Text>
          </View>

          {/* ── ADDRESS LIST ── */}
          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={C.primary} size="large" />
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.empty}>
              <MapPin size={36} color={C.muted} />
              <Text style={styles.emptyText}>No saved locations yet</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {addresses.map((a, i) => (
                <AddressCard
                  key={a.id}
                  address={a}
                  index={i}
                  onEdit={() =>
                    router.push({
                      pathname: "/edit-address",
                      params: { id: a.id },
                    })
                  }
                  onDelete={() => handleDelete(a.id)}
                />
              ))}
            </View>
          )}

          {/* ── MAP DECORATION ── */}
          <MapDecoration />
        </ScrollView>

        {/* ── ADD BUTTON ── */}
        <View style={styles.addBtnWrapper}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/add-address")}
            style={styles.addBtnOuter}
          >
            <LinearGradient
              colors={[C.primary, C.primaryDim]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addBtn}
            >
              <MapPinPlus size={20} color="#031612" strokeWidth={2.5} />
              <Text style={styles.addBtnText}>+ Add New Address</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

/* ─────────── styles ─────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  /* header */
  header: {
    height: 46,
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  backBtn: {
    position: "absolute",
    left: 16,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
  },

  headerTitle: {
    textAlign: "center",
    fontSize: 17,
    fontWeight: "800",
    color: C.primary,
  },
  /* scroll */
  scroll: {
    paddingBottom: 120,
  },

  /* tab row */
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },

  activeTab: {
    gap: 6,
  },

  activeTabText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },

  activeTabUnderline: {
    height: 2,
    width: "100%",
    backgroundColor: C.primary,
    borderRadius: 2,
  },

  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.subText,
    letterSpacing: 0.8,
  },

  /* list */
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },

  loader: {
    paddingVertical: 60,
    alignItems: "center",
  },

  empty: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },

  emptyText: {
    color: C.subText,
    fontSize: 14,
    fontWeight: "600",
  },

  /* card */
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
    flexDirection: "row",
  },

  cardActive: {
    borderColor: "#1A4035",
  },

  cardAccentBar: {
    width: 3,
    backgroundColor: C.primary,
    borderRadius: 3,
    marginVertical: 12,
    marginLeft: 2,
  },

  cardContent: {
    flex: 1,
    padding: 14,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },

  cardLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
  },

  defaultBadge: {
    backgroundColor: C.defaultBadgeBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },

  defaultBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: C.defaultBadgeText,
    letterSpacing: 0.5,
  },

  actions: {
    flexDirection: "row",
    gap: 4,
  },

  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D2620",
  },

  addressLine1: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    marginBottom: 3,
  },

  addressLine2: {
    fontSize: 12,
    color: C.subText,
    fontWeight: "500",
  },

  /* map */
  mapWrapper: {
    marginTop: 20,
    marginHorizontal: 16,
    height: 160,
    borderRadius: 18,
    backgroundColor: C.mapBg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#0F2C24",
    position: "relative",
  },

  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#0D2A22",
  },

  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#0D2A22",
  },

  roadOuter: {
    position: "absolute",
    bottom: 40,
    left: "15%",
    width: "70%",
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#1A4035",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "-8deg" }],
  },

  roadInner: {
    width: "88%",
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0D2A22",
    borderWidth: 1,
    borderColor: C.primary,
    opacity: 0.4,
  },

  dispatchBadge: {
    position: "absolute",
    bottom: 12,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  dispatchDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 1,
    shadowRadius: 4,
  },

  dispatchText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.subText,
    letterSpacing: 1.2,
  },

  /* add button */
  addBtnWrapper: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
  },

  addBtnOuter: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  addBtn: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  addBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#031612",
    letterSpacing: 0.2,
  },
});