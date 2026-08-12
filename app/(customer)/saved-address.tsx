import { deleteAddressApi, getAddressApi } from "@/features/orders/orders.api";
import { useAuth } from "@/hooks/useAuth";
import { eventEmitter } from "@/utils/eventEmitter";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import { ConfirmDialog, ConfirmDialogConfig } from "@/components/Customalert";
import { useTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");



type Address = {
  id: string;
  label: "Home" | "Office" | "Other";
  addressLine1: string;
  city: string;
  state: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  landmark?: string;
  addressLine2?: string;
  pincode?: string;
};

function MapDecoration() {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);
  return (
    <View style={styles.mapWrapper}>
      {[...Array(6)].map((_, i) => (
        <View key={`h${i}`} style={[styles.gridLineH, { top: 20 + i * 22 }]} />
      ))}
      {[...Array(8)].map((_, i) => (
        <View key={`v${i}`} style={[styles.gridLineV, { left: 10 + i * 44 }]} />
      ))}

      <View style={styles.roadOuter}>
        <View style={styles.roadInner} />
      </View>

      <View style={styles.dispatchBadge}>
        <View style={styles.dispatchDot} />
        <Text style={styles.dispatchText}>LIVE DISPATCH RANGE</Text>
      </View>
    </View>
  );
}

function AddressCard({
  address,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: {
  theme?: any;
  styles?: any;
} & {
  address: Address;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
    const { theme, isDark } = useTheme();
    const styles = makeStyles(theme, isDark);
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
      <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
        <View
          style={[
            styles.card,
            isDefault && styles.cardActive,
            isSelected && styles.cardSelected,
          ]}
        >
          {isDefault && <View style={styles.cardAccentBar} />}
          {isSelected && !isDefault && <View style={styles.cardSelectedBar} />}

          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <View style={styles.labelRow}>
                <IconComp size={17} color={isSelected ? theme.primary : theme.text} />
                <Text
                  style={[styles.cardLabel, isSelected && { color: theme.primary }]}
                >
                  {address.label}
                </Text>
                {isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                )}
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  style={styles.actionBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}

                >
                  <Pencil size={15} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  style={styles.actionBtn}
                >
                  <Trash2 size={15} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.addressLine1}>{address.addressLine1}</Text>
            <Text style={styles.addressLine2}>
              {address.city}, {address.state}
            </Text>
          </View>

          {/* {isSelected && (
            <View style={styles.checkmarkContainer}>
              <CheckCircle size={22} color={theme.primary} />
            </View>
          )} */}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SavedAddresses() {
    const { theme, isDark } = useTheme();
    const styles = makeStyles(theme, isDark);
    const { user } = useAuth();
  const params = useLocalSearchParams();
  const authId = user?.user?.id ?? user?.id;
  const selectMode = params.selectMode === "true";

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    (params.selectedId as string) || null,
  );
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogConfig | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const headerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, []);

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
            latitude: a.latitude,
            longitude: a.longitude,
            contactName: a.contactName || "",
            contactPhone: a.contactPhone || "",
            landmark: a.landmark || "",
            addressLine2: a.addressLine2 || "",
            pincode: a.pincode || "",
          })),
        );
      } catch (e) {
        console.log("address fetch error", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [authId]);

  const handleSelectAddress = (address: Address) => {
    const label = `${address.addressLine1}, ${address.city}`;

    // Emit the event with selected address data
    eventEmitter.emit("addressSelected", {
      address: {
        id: address.id,
        label: address.label,
        line1: address.addressLine1,
        city: address.city,
        state: address.state,
        latitude: address.latitude,
        longitude: address.longitude,
      },
      label,
    });

    // Navigate back
    router.back();
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      type: 'error',
      title: 'Delete Address',
      message: 'Are you sure you want to delete this address?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteAddressApi(id);
          setAddresses((prev) => prev.filter((a) => a.id !== id));
          if (selectedAddressId === id) setSelectedAddressId(null);
        } catch {
          setAddresses((prev) => prev.filter((a) => a.id !== id));
        }
      },
    });
    setConfirmVisible(true);
  };

  const handleAddNewAddress = () => {
    router.push({
      pathname: "/edit-address",
      params: {
        returnTo: "saved-addresses",
        selectMode: selectMode ? "true" : "false",
      },
    });
  };

  const handleConfirmSelection = () => {
    if (selectedAddressId) {
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      if (selectedAddress) {
        handleSelectAddress(selectedAddress);
      }
    } else {
      showAlert({ type: 'warning', title: 'No address selected', message: 'Please select an address first.' });
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}

          >
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {selectMode ? "Select Location" : "Saved Locations"}
          </Text>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.tabRow}>
            <View style={styles.activeTab}>
              <Text style={styles.activeTabText}>
                {selectMode ? "Choose Delivery Address" : "Active Destinations"}
              </Text>
            </View>

            <Text style={styles.countText}>
              {addresses.length} LOCATION{addresses.length !== 1 ? "S" : ""}{" "}
              SAVED
            </Text>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={theme.primary} size="large" />
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.empty}>
              <MapPin size={36} color={theme.textSecondary} />
              <Text style={styles.emptyText}>No saved locations yet</Text>
              <TouchableOpacity
                onPress={handleAddNewAddress}
                style={styles.emptyAddBtn}
              >
                <Text style={styles.emptyAddBtnText}>
                  Add your first address
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.list}>
              {addresses.map((a, i) => (
                <AddressCard
                  key={a.id}
                  address={a}
                  index={i}
                  isSelected={selectedAddressId === a.id}
                  onSelect={() => setSelectedAddressId(a.id)}
                  onEdit={() =>
                    router.push({
                      pathname: "/edit-address",
                      params: {
                        id: a.id,
                        label: a.label,
                        addressLine1: a.addressLine1,
                        addressLine2: a.addressLine2 || "",
                        landmark: a.landmark || "",
                        city: a.city,
                        state: a.state,
                        pincode: a.pincode,
                        contactName: a.contactName || "",
                        contactPhone: a.contactPhone || "",
                        latitude: String(a.latitude || ""),
                        longitude: String(a.longitude || ""),
                        returnTo: "saved-addresses",
                        selectMode: selectMode ? "true" : "false",
                      },
                    })
                  }
                  onDelete={() => handleDelete(a.id)}
                />
              ))}
            </View>
          )}

          {!selectMode && <MapDecoration />}
        </ScrollView>

        <View style={styles.addBtnWrapper}>
          {selectMode && selectedAddressId ? (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleConfirmSelection}
              style={styles.addBtnOuter}
            >
              <LinearGradient
                colors={[theme.primary, isDark ? theme.card : theme.background]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addBtn}
              >
                {/* <CheckCircle size={20} color={theme.background} strokeWidth={2.5} /> */}
                <Text style={styles.addBtnText}>Confirm Selection</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleAddNewAddress}
              style={styles.addBtnOuter}
            >
              <LinearGradient
                colors={[theme.primary, isDark ? theme.card : theme.background]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addBtn}
              >
                <MapPinPlus size={20} color={theme.background} strokeWidth={2.5} />
                <Text style={styles.addBtnText}>
                  {selectMode ? "Add New Address Instead" : "+ Add New Address"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
      <ConfirmDialog
        visible={confirmVisible}
        config={confirmDialog}
        onDismiss={() => setConfirmVisible(false)}
      />
    </View>
  );
}

const makeStyles = (theme: any, isDark: boolean) => {
  const C = {
    bg: theme.background,
    card: theme.card,
    cardBorder: theme.border,
    cardBorderActive: theme.primary,
    primary: theme.primary,
    primaryDim: isDark ? theme.card : theme.background,
    text: theme.text,
    subText: theme.textSecondary,
    muted: theme.textSecondary,
    danger: isDark ? "#FF5A5A" : "#FF6B6B",
    dangerBg: isDark ? theme.border : "#FCE8E6",
    mapBg: theme.inputBackground,
    defaultBadgeBg: theme.primary,
    defaultBadgeText: isDark ? theme.background : theme.text,
  };
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { height: 46, justifyContent: "center", paddingHorizontal: 14 },
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
    color: theme.primary,
  },
  scroll: { paddingBottom: 120 },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  activeTab: { gap: 6 },
  activeTabText: { fontSize: 14, fontWeight: "700", color: theme.text },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.textSecondary,
    letterSpacing: 0.8,
  },
  list: { paddingHorizontal: 16, gap: 12 },
  loader: { paddingVertical: 60, alignItems: "center" },
  empty: { paddingVertical: 60, alignItems: "center", gap: 12 },
  emptyText: { color: theme.textSecondary, fontSize: 14, fontWeight: "600" },
  emptyAddBtn: {
    backgroundColor: C.card,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  emptyAddBtnText: { color: theme.primary, fontSize: 14, fontWeight: "700" },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
    flexDirection: "row",
    position: "relative",
  },
  cardActive: { borderColor: theme.border },
  cardSelected: { borderColor: theme.primary, borderWidth: 2 },
  cardAccentBar: {
    width: 3,
    backgroundColor: theme.primary,
    borderRadius: 3,
    marginVertical: 12,
    marginLeft: 2,
  },
  cardSelectedBar: {
    width: 3,
    backgroundColor: theme.primary,
    borderRadius: 3,
    marginVertical: 12,
    marginLeft: 2,
  },
  cardContent: { flex: 1, padding: 14 },
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
  cardLabel: { fontSize: 16, fontWeight: "800", color: theme.text },
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
  actions: { flexDirection: "row", gap: 4 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.inputBackground,
  },
  addressLine1: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 3,
  },
  addressLine2: { fontSize: 12, color: theme.textSecondary, fontWeight: "500" },
  checkmarkContainer: { position: "absolute", right: 12, top: 12 },
  mapWrapper: {
    marginTop: 20,
    marginHorizontal: 16,
    height: 160,
    borderRadius: 18,
    backgroundColor: C.mapBg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.border,
    position: "relative",
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.inputBackground,
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: theme.inputBackground,
  },
  roadOuter: {
    position: "absolute",
    bottom: 40,
    left: "15%",
    width: "70%",
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ rotate: "-8deg" }],
  },
  roadInner: {
    width: "88%",
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.primary,
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
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  dispatchText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.textSecondary,
    letterSpacing: 1.2,
  },
  addBtnWrapper: { position: "absolute", bottom: 24, left: 20, right: 20 },
  addBtnOuter: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: theme.primary,
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
    color: theme.background,
    letterSpacing: 0.2,
  },
  });
};