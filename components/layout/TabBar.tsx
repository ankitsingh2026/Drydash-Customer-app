import LocationPickerModal from "@/components/LocationPickerModal";
import { useAddress } from "@/context/AddressContext";
import { getFullServiceData } from "@/features/location/location.api";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Bell, Wallet } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications } from "../../context/NotificationContext";
import { useTheme } from "../../context/ThemeContext";
import { useSlotSocket } from "@/context/SlotSocketContext";
import { findNearbySavedAddress } from "@/utils/distance";
import { useWallet } from "@/context/WalletContext";

type TabBarProps = {
  onOpenNotifications?: () => void;
  onWalletPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const TabBar = ({ onOpenNotifications, onWalletPress, style }: TabBarProps) => {
  const { colors, theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);
  const insets = useSafeAreaInsets();
  const { unreadCount, refreshNotifications } = useNotifications();
  const { wallet } = useWallet();
  const isFetchingRef = useRef(false);
  const isFetchingCurrentLocRef = useRef(false);

  const {
    selectedAddress,
    allAddresses,
    setSelectedAddress,
    refreshAddresses,
    loading,
    serviceData,      // API response from /service/check
    serviceLoading,
    zoneData,         // separate zone info from context
    updateServiceData,
    setServiceLoading,
  } = useAddress();

    const { onSlotUpdate } = useSlotSocket();
  useEffect(() => {
    const unsubscribe = onSlotUpdate(() => {
      if (selectedAddress && selectedAddress.latitude && selectedAddress.longitude) {
        fetchFullServiceData(selectedAddress.latitude, selectedAddress.longitude);
      }
    });
    return unsubscribe;
  }, [selectedAddress]);

  const [locationText, setLocationText] = useState("Fetching location...");
  const [modalVisible, setModalVisible] = useState(false);

  const fetchAndSetCurrentLocation = async () => {
    if (isFetchingCurrentLocRef.current) return;
    isFetchingCurrentLocRef.current = true;
    try {
      setServiceLoading(true);
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }
      if (status !== "granted") {
        console.log("Location permission not granted");
        setLocationText("Select location");
        setServiceLoading(false);
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
      const labelStr = [g?.district || g?.subregion, g?.city || g?.region]
        .filter(Boolean)
        .join(", ");

      const currentLocAddress = {
        id: "current_location",
        label: "Current Location",
        line1: labelStr || "Current Location",
        city: g?.city || g?.region || "",
        state: g?.region || "",
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        flat: labelStr || "Current Location",
        street: labelStr || "Current Location",
        pincode: g?.postalCode || "",
      } as any;

      // Check if current real-time location is within 500m of any saved address
      const nearbySaved = findNearbySavedAddress(
        loc.coords.latitude,
        loc.coords.longitude,
        allAddresses,
        500
      );

      if (nearbySaved) {
        setSelectedAddress(nearbySaved);
        setLocationText(`${nearbySaved.line1}, ${nearbySaved.city}`);
      } else {
        setSelectedAddress(currentLocAddress);
        setLocationText(labelStr || "Current Location");
      }
    } catch (err) {
      console.log("Auto location fetch error", err);
      setLocationText("Select location");
      setServiceLoading(false);
    } finally {
      isFetchingCurrentLocRef.current = false;
    }
  };

  useEffect(() => {
    fetchAndSetCurrentLocation();
  }, []);

  // Auto-switch to nearby saved address if allAddresses loads after initial GPS fix
  useEffect(() => {
    if (
      selectedAddress &&
      selectedAddress.id === "current_location" &&
      selectedAddress.latitude &&
      selectedAddress.longitude &&
      allAddresses.length > 0
    ) {
      const nearbySaved = findNearbySavedAddress(
        selectedAddress.latitude,
        selectedAddress.longitude,
        allAddresses,
        500
      );
      if (nearbySaved) {
        setSelectedAddress(nearbySaved);
        setLocationText(`${nearbySaved.line1}, ${nearbySaved.city}`);
      }
    }
  }, [allAddresses, selectedAddress]);

  // Fetch service data whenever selectedAddress changes
  useEffect(() => {
    if (!selectedAddress) {
      // Fallback: If no location is selected (or new user with no saved addresses), fetch current GPS location!
      fetchAndSetCurrentLocation();
      return;
    }

    const fetchData = async () => {
      console.log("Selected address changed:", selectedAddress);
      setServiceLoading(true);
      const label = selectedAddress.id === "current_location" 
        ? selectedAddress.line1 
        : `${selectedAddress.line1}, ${selectedAddress.city}`;
      setLocationText(label);

      let coords = null;
      if (selectedAddress.latitude && selectedAddress.longitude) {
        coords = { lat: selectedAddress.latitude, lng: selectedAddress.longitude };
      } else {
        try {
          const fullAddress = `${selectedAddress.line1}, ${selectedAddress.city}, ${selectedAddress.state}`;
          const geo = await Location.geocodeAsync(fullAddress);
          if (geo && geo.length > 0) {
            coords = { lat: geo[0].latitude, lng: geo[0].longitude };
          }
        } catch (err) {
          console.error("Geocoding error:", err);
        }
      }

      try {
        if (coords) {
          await fetchFullServiceData(coords.lat, coords.lng);
        } else {
          // No coordinates – treat as not in area
          updateServiceData({
            coords: null,
            zoneData: { zoneFound: false },
            serviceData: null,
          });
        }
      } catch (err) {
        console.error("Fetch service data error:", err);
        updateServiceData({
          coords: null,
          zoneData: { zoneFound: false },
          serviceData: null,
        });
      } finally {
        setServiceLoading(false);
      }
    };

    fetchData();
  }, [selectedAddress]);

  // Handle address deletion
  useEffect(() => {
    if (selectedAddress) {
      if (selectedAddress.id === "current_location") return;
      const exists = allAddresses.find(a => a.id === selectedAddress.id);
      if (!exists) {
        if (allAddresses.length > 0) {
          setSelectedAddress(allAddresses[0]);
        } else {
          fetchAndSetCurrentLocation();
        }
      }
    } else if (!loading) {
      fetchAndSetCurrentLocation();
    }
  }, [allAddresses, loading]);

  const fetchFullServiceData = async (lat: number, lng: number) => {
    try {
      const data = await getFullServiceData(lat, lng, true); // force refresh
      updateServiceData(data);
    } catch (error) {
      console.error("Full service data error:", error);
      updateServiceData({
        coords: { lat, lng },
        zoneData: { zoneFound: false },
        serviceData: null,
      });
    }
  };

  const handleAddressSelect = async (
    label: string,
    address: any | null,
    shouldSelect = true
  ) => {
    setModalVisible(false);
    if (address && shouldSelect) {
      setSelectedAddress(address);
    }
    if (label) setLocationText(label);
  };

  const handleBellPress = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      await refreshNotifications();
      onOpenNotifications?.();
    } catch (e) {
      console.error("Notification refresh failed", e);
    } finally {
      isFetchingRef.current = false;
    }
  };

  // Helper to get best slot from serviceData (API response)
  const getBestSlot = () => {
    if (!serviceData?.data || !serviceData.serviceAvailable) return null;
    if (serviceData.data.activeSlot && serviceData.data.activeSlot.status !== 'expired') {
      return serviceData.data.activeSlot;
    }

    if (serviceData.data.dates && Array.isArray(serviceData.data.dates)) {
      const dates = serviceData.data.dates;
      const getTodayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      };

      const todayEntry = dates.find((d: any) => d.label === "Today" || d.date === getTodayStr()) || dates[0];
      const tomorrowEntry = dates.find((d: any) => d.label === "Tomorrow") || dates[1];

      if (todayEntry?.allSlots) {
        const validToday = todayEntry.allSlots.find(
          (s: any) => s.enabled && s.status !== "expired" && (s.availableCapacity === undefined || s.availableCapacity > 0)
        );
        if (validToday) return validToday;
      }

      if (tomorrowEntry?.allSlots) {
        const validTomorrow = tomorrowEntry.allSlots.find(
          (s: any) => s.enabled && s.status !== "expired" && (s.availableCapacity === undefined || s.availableCapacity > 0)
        );
        if (validTomorrow) {
          return {
            ...validTomorrow,
            isTomorrow: true,
            dayLabel: "Tomorrow",
            date: tomorrowEntry.date,
          };
        }
      }
    }

    if (serviceData.data.allSlots && serviceData.data.allSlots.length > 0) {
      const validToday = serviceData.data.allSlots.find(
        (s: any) => s.enabled && s.status !== 'expired' && (s.availableCapacity === undefined || s.availableCapacity > 0)
      );
      if (validToday) return validToday;
    }

    if (serviceData.data.tomorrowSlots && serviceData.data.tomorrowSlots.length > 0) {
      const validTomorrow = serviceData.data.tomorrowSlots.find(
        (s: any) => s.enabled && s.status !== 'expired' && (s.availableCapacity === undefined || s.availableCapacity > 0)
      );
      if (validTomorrow) return validTomorrow;
    }

    return null;
  };

  // Determine display color
  const getServiceColor = () => {
    if (serviceLoading) return "#2FE6A6";
    const bestSlot = getBestSlot();
    if (bestSlot) return theme.primary;
    
    if (serviceData?.message === "Zone not configured" || !serviceData?.data?.zoneInfo) {
      return theme.error;
    }

    return theme.warning;          
  };

  // Get text for non‑slot cases
  const getDisplayText = () => {
    if (serviceLoading) return "Checking...";
    
    if (!serviceData) {
      if (zoneData && !zoneData.zoneFound) return "Not in your area";
      return "Checking...";
    }

    if (serviceData.message === "Zone not configured" || !serviceData.data?.zoneInfo) {
      return "Not in your area";
    }

    if (!serviceData.serviceAvailable || serviceData.data?.allSlots?.length === 0) {
      return "Currently unavailable";
    }

    return "Service unavailable";
  };

  // Format slot time and day (Today/Tomorrow)
  const getSlotInfo = () => {
    const slot = getBestSlot();
    if (!slot) return null;

    if (slot.deliveryLabel) {
      const parts = slot.deliveryLabel.split(" by ");
      if (parts.length === 2) {
        return { dayLabel: parts[0], time: parts[1] };
      }
      return { dayLabel: slot.deliveryLabel, time: "" };
    }

    const startTimeStr = slot.startTime || slot.time?.split(" - ")[0] || "";
    let hour = 0,
      minute = 0;
    const match = startTimeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
    if (match) {
      hour = parseInt(match[1]);
      minute = match[2] ? parseInt(match[2]) : 0;
      const period = match[3].toUpperCase();
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
    } else {
      const simple = startTimeStr.match(/(\d+)(AM|PM)/i);
      if (simple) {
        hour = parseInt(simple[1]);
        minute = 0;
        const period = simple[2].toUpperCase();
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
      } else {
        return null;
      }
    }

    const now = new Date();
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let slotDate = new Date();
    slotDate.setHours(hour, minute, 0, 0);

    // If slot time already passed today, it's for tomorrow
    if (slotDate < now) {
      slotDate = new Date(tomorrow);
      slotDate.setHours(hour, minute, 0, 0);
    }

    const isToday = slotDate.toDateString() === today.toDateString();
    const isTomorrow = slotDate.toDateString() === tomorrow.toDateString();

    let dayLabel = "";
    if (isToday) dayLabel = "Today";
    else if (isTomorrow) dayLabel = "Tomorrow";
    else dayLabel = slotDate.toLocaleDateString("en-IN", { weekday: "short" });

    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    const period = hour >= 12 ? "pm" : "am";
    const timeString = `${displayHour} ${period}`;

    return { dayLabel, time: timeString };
  };

  const slotInfo = getSlotInfo();
  // console.log("Slot info====>>>:", slotInfo);
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 6 }, style]}>
        <ActivityIndicator color="#2FE6A6" />
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
        <View style={styles.row}>
          <View style={styles.left}>
            <View
              style={[
                styles.serviceRow,
                {
                  shadowColor: getServiceColor(),
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
            >
              {serviceLoading ? (
                <ActivityIndicator size="small" color="#2FE6A6" />
              ) : slotInfo ? (
                <View>
                  <View style={styles.deliveryHeaderRow}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={getServiceColor()}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.deliveryLabel}>Delivery by</Text>
                  </View>
                  <Text style={styles.deliveryTime}>
                    {slotInfo.dayLabel}
                    {slotInfo.time ? (
                      <Text style={styles.deliverySubTime}> {slotInfo.time}</Text>
                    ) : null}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.serviceText, { color: getServiceColor() }]}>
                  {getDisplayText()}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.75}
              hitSlop={{ top: 15, bottom: 10, left: 10 }}

            >
              <Ionicons
                name={
                  selectedAddress?.label?.toLowerCase() === "home"
                    ? "home-outline"
                    : selectedAddress?.label?.toLowerCase() === "office"
                    ? "business-outline"
                    : "location-outline"
                }
                size={16}
                color={getServiceColor()}
                style={{ marginRight: 5 }}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationText}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color="#8FB3A8"
                style={{ marginLeft: 3 }}
              />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (onWalletPress) {
                  onWalletPress();
                } else {
                  router.push("/(customer)/wallet");
                }
              }}
              style={styles.walletBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Wallet size={16} color={theme.text} />
              <Text style={styles.walletText}>
                ₹{wallet?.balance !== undefined ? wallet.balance.toLocaleString('en-IN') : "0"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleBellPress}
              style={styles.iconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Bell size={18} color={theme.text} />
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

      <LocationPickerModal
        visible={modalVisible}
        savedAddresses={allAddresses}
        selectedId={selectedAddress?.id || null}
        onSelect={handleAddressSelect}
        onClose={() => {
          setModalVisible(false);
          refreshAddresses();
        }}
        onAddNewAddress={() => {
          router.push("/edit-address");
        }}
      />
    </>
  );
};

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: theme.background,
    paddingHorizontal: 16,
    paddingBottom: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flex: 1,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceText: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: isDark ? theme.textSecondary : theme.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: "500",
    maxWidth: 200,
  },
  walletBtn: {
    height: 38,
    borderRadius: 20,
    backgroundColor: theme.surface,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  walletText: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.text,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.accent,
    // shadowOpacity: 0.15,
    // shadowRadius: 10,
    // elevation: 6,
  },
  badge: {
    position: "absolute",
    top: 3,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.error,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: "800",
  },
  deliveryLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: "500",
  },
  deliveryTime: {
    fontSize: 16,
    color: theme.subText,
    fontWeight: "600",
  },
  deliverySubTime: {
    fontSize: 14,
    color: theme.subText,
    fontWeight: "600",
  },
  deliveryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bellIcon: {
    color: theme.text
  }
});