import { useAddress } from "@/context/AddressContext";
import { deleteAddressApi } from "@/features/orders/orders.api";
import { Address } from "@/types/order.types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Pencil, Trash2 } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { height: SCREEN_H } = Dimensions.get("window");
import { showAlert, AlertOverlay } from "@/components/Customalert";

const C = {
  pink: "#00E1A2",
  text: "#E6FFF7",
  subText: "#8FB3A8",
  bg: "#031612",
  white: "#0D1F1C",
  border: "#1A3330",
  borderDark: "#1F3E38",
  successBg: "#163A2F",
  successText: "#78F0C8",
  danger: "#EF4444",
};

type Props = {
  visible: boolean;
  savedAddresses: Address[];
  selectedId: string | null;
  onSelect: (label: string, address: Address | null, shouldSelect?: boolean) => void;
  onClose: () => void;
  onAddNewAddress?: () => void;
};

export default function LocationPickerModal({
  visible,
  savedAddresses,
  selectedId,
  onSelect,
  onClose,
  onAddNewAddress,
}: Props) {
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);
  const [searchText, setSearchText] = useState("");
  const { refreshAddresses } = useAddress();

  useEffect(() => {
    if (!visible) {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H,
        duration: 240,
        useNativeDriver: true,
      }).start();
      return;
    }

    checkLocationAndPermission();
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 70,
      friction: 12,
    }).start();
  }, [visible, slideAnim]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription.remove();
  }, [visible]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === "active" && visible) {
      await checkLocationAndPermission();
    }
    appState.current = nextAppState;
  };

  const checkLocationAndPermission = async () => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      setLocationEnabled(enabled);
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error("Error checking location:", error);
    }
  };

  const handleEnableLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    appState.current = AppState.currentState;

    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:");
      return;
    }

    await Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS");
  };

  const handleRequestPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(status);
    if (status === "granted") {
      await checkLocationAndPermission();
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setGpsLoading(true);

      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLocationEnabled(false);
        return;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionStatus(status);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const g = geo?.[0];
      const label = [g?.district || g?.subregion, g?.city || g?.region]
        .filter(Boolean)
        .join(", ");

      onSelect(label || "Current Location", null, false);
      onClose();
    } catch (error) {
      console.error("GPS error:", error);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    showAlert({
      type: 'error',
      title: 'Delete Address',
      message: 'Are you sure you want to delete this address?',
      primaryLabel: 'Delete',
      onPrimary: async () => {
        try {
          await deleteAddressApi(id);
          await refreshAddresses();
        } catch (error) {
          console.error("Delete address error:", error);
        }
      },
    });
  };

  const handleEdit = (addr: Address) => {
    router.push({
      pathname: "/edit-address",
      params: {
        _id: addr.id,
        label: addr.label,
        addressLine1: addr.line1,
        city: addr.city,
        state: addr.state,
        latitude: String(addr.latitude || ""),
        longitude: String(addr.longitude || ""),
      },
    });
  };

  const handleSavedPick = (addr: Address) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(`${addr.line1}, ${addr.city}`, addr, true);
    onClose();
  };

  const handleWhatsApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL("whatsapp://");
    } catch {
      showAlert({
        type: 'warning',
        title: 'WhatsApp not found',
        message: 'Please install WhatsApp to continue.',
      });
    }
  };

  const needsLocationEnabled = locationEnabled === false;
  const needsPermission = permissionStatus !== "granted" && !needsLocationEnabled;

  const filteredAddresses = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return savedAddresses;

    return savedAddresses.filter((a) => {
      const full = `${a.label} ${a.line1} ${a.city} ${a.state} ${a.pincode}`.toLowerCase();
      return full.includes(q);
    });
  }, [savedAddresses, searchText]);

  const headerTitle = needsLocationEnabled ? "Your device location is off" : "Select Location";

  const headerSubtitle = needsLocationEnabled
    ? "Enabling location helps us reach you quickly with accurate delivery"
    : "Choose from your saved addresses or add a new one";

  const renderPrimaryAction = () => {
    if (needsLocationEnabled) {
      return (
        <TouchableOpacity style={styles.actionRow} activeOpacity={0.85} onPress={handleEnableLocation}>
          <View style={styles.actionRowLeft}>
            <View style={styles.targetIconWrap}>
              <Ionicons name="locate-outline" size={20} color={C.pink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Use my Current Location</Text>
              <Text style={styles.actionSubTitle}>Enable your current location for better services</Text>
            </View>
          </View>
          <View style={styles.enableBtn}>
            <Text style={styles.enableBtnText}>Enable</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (needsPermission) {
      return (
        <TouchableOpacity style={styles.actionRow} activeOpacity={0.85} onPress={handleRequestPermission}>
          <View style={styles.actionRowLeft}>
            <View style={styles.targetIconWrap}>
              <Ionicons name="key-outline" size={20} color={C.pink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Grant Location Permission</Text>
              <Text style={styles.actionSubTitle}>Allow location access to use your current position</Text>
            </View>
          </View>
          <View style={styles.enableBtn}>
            <Text style={styles.enableBtnText}>Allow</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.actionRow}
        activeOpacity={0.85}
        onPress={handleUseCurrentLocation}
        disabled={gpsLoading}
      >
        <View style={styles.actionRowLeft}>
          <View style={styles.targetIconWrap}>
            <Ionicons name="locate-outline" size={20} color={C.pink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Use my Current Location</Text>
            <Text style={styles.actionSubTitle}>Find your exact delivery location instantly</Text>
          </View>
        </View>

        <Text style={styles.enableBtnText}>{gpsLoading ? "Loading..." : "Use"}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={C.text} />
            </TouchableOpacity>
            <Text style={styles.headerText}>{headerTitle}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.headerSubText}>{headerSubtitle}</Text>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={22} color={C.subText} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search Address"
              placeholderTextColor="#7BA79A"
              style={styles.searchInput}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.card}>{renderPrimaryAction()}</View>

            <View style={styles.card}>
              <TouchableOpacity
                style={styles.simpleRow}
                onPress={() => {
                  onClose();
                  onAddNewAddress?.();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={22} color={C.pink} />
                <Text style={styles.simpleRowLabel}>Add New Address</Text>
                <Ionicons name="chevron-forward" size={20} color={C.subText} />
              </TouchableOpacity>
            </View>

            {/* <View style={styles.card}>
              <TouchableOpacity style={styles.simpleRow} onPress={handleWhatsApp} activeOpacity={0.8}>
                <Ionicons name="logo-whatsapp" size={21} color="#16A34A" />
                <Text style={styles.simpleRowLabel}>Request address from friend</Text>
                <Ionicons name="chevron-forward" size={20} color={C.subText} />
              </TouchableOpacity>
            </View> */}

            <Text style={styles.savedTitle}>Saved Addresses</Text>

            <View style={styles.card}>
              {filteredAddresses.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>No saved addresses found</Text>
                </View>
              ) : (
                filteredAddresses.map((addr, idx) => {
                  const isSelected = selectedId === addr.id;
                  const iconName =
                    addr.label?.toLowerCase() === "work" || addr.label?.toLowerCase() === "office"
                      ? "business-outline"
                      : "home-outline";

                  return (
                    <View key={addr.id}>
                      <TouchableOpacity
                        style={styles.addressRow}
                        onPress={() => handleSavedPick(addr)}
                        activeOpacity={0.78}
                      >
                        <View style={styles.addrIconWrap}>
                          <Ionicons name={iconName as any} size={19} color={C.subText} />
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={styles.addrLabelRow}>
                            <Text style={styles.addrLabel}>{addr.label || "Address"}</Text>
                            {isSelected && (
                              <View style={styles.selectedBadge}>
                                <Text style={styles.selectedBadgeText}>Selected</Text>
                              </View>
                            )}
                          </View>
                          <Text numberOfLines={2} style={styles.addrLine}>
                            {addr.line1}, {addr.city}, {addr.state || addr.pincode || ""}
                          </Text>
                        </View>

                        <View style={styles.rowActions}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleEdit(addr);
                            }}
                          >
                            <Pencil size={15} color="#6B7280" />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDelete(addr.id);
                            }}
                          >
                            <Trash2 size={15} color={C.danger} />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>

                      {idx < filteredAddresses.length - 1 && <View style={styles.divider} />}
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </Animated.View>
        <AlertOverlay /> 
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    maxHeight: SCREEN_H * 0.92,
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 10,
  },
  handle: {
    width: 46,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#315A52",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  headerRow: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.white,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 34 / 2,
    color: C.text,
    fontWeight: "800",
  },
  headerSpacer: {
    width: 40,
  },
  headerSubText: {
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 12,
    color: C.subText,
    fontSize: 14,
    lineHeight: 20,
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.borderDark,
    borderRadius: 16,
    backgroundColor: C.white,
    height: 56,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17 / 1,
    color: C.text,
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 22,
    gap: 10,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  actionRow: {
    minHeight: 84,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  targetIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D2B24",
  },
  actionTitle: {
    fontSize: 19 / 1,
    color: C.text,
    fontWeight: "700",
  },
  actionSubTitle: {
    marginTop: 2,
    fontSize: 14,
    color: C.subText,
    lineHeight: 18,
  },
  enableBtn: {
    minWidth: 92,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.pink,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    marginLeft: 10,
  },
  enableBtnText: {
    color: C.pink,
    fontWeight: "800",
    fontSize: 16,
  },
  simpleRow: {
    height: 68,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  simpleRowLabel: {
    flex: 1,
    fontSize: 18 / 1,
    color: C.text,
    fontWeight: "700",
  },
  savedTitle: {
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 2,
    fontSize: 36 / 2,
    color: C.text,
    fontWeight: "800",
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    color: C.subText,
    fontSize: 14,
    fontWeight: "600",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  addrIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#0D2B24",
    alignItems: "center",
    justifyContent: "center",
  },
  addrLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addrLabel: {
    fontSize: 17 / 1,
    color: C.text,
    fontWeight: "800",
  },
  selectedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: C.successBg,
  },
  selectedBadgeText: {
    color: C.successText,
    fontSize: 11,
    fontWeight: "700",
  },
  addrLine: {
    marginTop: 4,
    color: C.subText,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginLeft: 8,
  },
  divider: {
    marginLeft: 58,
    height: 1,
    backgroundColor: C.border,
  },
});
