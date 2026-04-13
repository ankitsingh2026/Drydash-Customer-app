import LocationPickerModal from "@/components/LocationPickerModal";
import { useAddress } from "@/context/AddressContext";
import { checkServiceAvailability } from "@/features/location/location.api";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Bell, MousePointer2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications } from "../../context/NotificationContext";
import { useTheme } from "../../context/ThemeContext";

type TabBarProps = {
  onOpenNotifications?: () => void;
};

export const TabBar = ({ onOpenNotifications }: TabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { unreadCount, refreshNotifications } = useNotifications();
  const isFetchingRef = useRef(false);

  const {
    selectedAddress,
    allAddresses,
    setSelectedAddress,
    refreshAddresses,
    loading,
  } = useAddress();

  const [locationText, setLocationText] = useState("Fetching location...");
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Service availability states
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [serviceType, setServiceType] = useState("LOADING");
  const [checkingService, setCheckingService] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    console.log("Selected address changed:", selectedAddress);

    if (selectedAddress) {
      setLocationText(`${selectedAddress.line1}, ${selectedAddress.city}`);

      fetchAddressCoordinates(selectedAddress).then((coords) => {
        if (coords) setCurrentCoords(coords);
      });
    }
  }, [selectedAddress]);

  useEffect(() => {
    if (currentCoords) {
      checkServiceForLocation(currentCoords.lat, currentCoords.lng);
    }
  }, [currentCoords]);

  const checkServiceForLocation = async (lat: number, lng: number) => {
    try {
      setCheckingService(true);
      const serviceCheck = await checkServiceAvailability(lat, lng);
      setIsServiceAvailable(serviceCheck.serviceAvailable);
      setServiceType(serviceCheck.type);
    } catch (error) {
      console.error("Service check error:", error);
      setServiceType("ERROR");
    } finally {
      setCheckingService(false);
    }
  };

  const fetchAddressCoordinates = async (address: any) => {
    try {
      if (address.latitude && address.longitude) {
        return { lat: address.latitude, lng: address.longitude };
      }

      const fullAddress = `${address.line1}, ${address.city}, ${address.state}`;
      const geo = await Location.geocodeAsync(fullAddress);

      if (geo && geo.length > 0) {
        return { lat: geo[0].latitude, lng: geo[0].longitude };
      }
      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  };

  const handleAddressSelect = async (label: string, address: any | null) => {
    setModalVisible(false);

    if (address) {
      console.log("Address selected in modal:", address);
      setSelectedAddress(address);
      setLocationText(label);

      const coords = await fetchAddressCoordinates(address);
      if (coords) {
        setCurrentCoords(coords);

        const geo = await Location.reverseGeocodeAsync({
          latitude: coords.lat,
          longitude: coords.lng,
        });

        if (geo?.length > 0) {
          const g = geo[0];
          const city = g.city || g.subregion || "";
          const area = g.district || g.name || "";
          setLocationText(`${area}, ${city}`);
        }
      }
    }
  };

  const handleBellPress = async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;

    try {
      await refreshNotifications(); // fetch first
      onOpenNotifications?.();
    } catch (e) {
      console.error("Notification refresh failed", e);
    } finally {
      isFetchingRef.current = false;
    }
  };

  const getServiceColor = () => {
    if (isServiceAvailable) return "#2FE6A6";
    if (serviceType === "OUT_OF_AREA") return "#FFA500";
    if (serviceType === "NOT_AVAILABLE_NOW") return "#FF6B6B";
    return "#8FB3A8";
  };

  const getDisplayText = () => {
    if (checkingService) return "Checking...";
    if (isServiceAvailable) return "24 Hours";
    if (serviceType === "OUT_OF_AREA") return "Not in your area";
    if (serviceType === "NOT_AVAILABLE_NOW") return "Currently closed";
    return "Service unavailable";
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
        <ActivityIndicator color="#2FE6A6" />
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
        <View style={styles.row}>
          <View style={styles.left}>
            <View style={styles.serviceRow}>
              {checkingService ? (
                <ActivityIndicator size="small" color="#2FE6A6" />
              ) : (
                <Text
                  style={[styles.serviceText, { color: getServiceColor() }]}
                >
                  {getDisplayText()}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.75}
            >
              <MousePointer2
                size={16}
                color={getServiceColor()}
                strokeWidth={2}
                style={{ marginRight: 5 }}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationText}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color="#8FB3A8"
                style={{ marginLeft: 3, marginTop: 2 }}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBellPress}
            style={styles.iconBtn}
          >
            <Bell size={18} color="#E6FFF7" />

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

      <LocationPickerModal
        visible={modalVisible}
        savedAddresses={allAddresses}
        selectedId={selectedAddress?.id || null}
        onSelect={handleAddressSelect}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#031612",
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
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: "#8FB3A8",
    fontWeight: "500",
    maxWidth: 200,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0D1F1C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1A3330",
    shadowColor: "#2FE6A6",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
  },
});