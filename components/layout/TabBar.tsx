import LocationPickerModal from "@/components/LocationPickerModal";
import { checkServiceAvailability } from "@/features/location/location.api";
import { getAddressApi } from "@/features/orders/orders.api";
import { useAuth } from "@/hooks/useAuth";
import { Address } from "@/types/order.types";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Bell, MousePointer2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
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
  onWalletPress?: () => void;
  savedAddresses?: Address[];
};

export const TabBar = ({ onOpenNotifications }: TabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  const [locationText, setLocationText] = useState("Fetching location...");
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);

  // Service availability states
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [serviceType, setServiceType] = useState("LOADING");
  const [checkingService, setCheckingService] = useState(true);
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Fetch location and check service when component mounts or address changes
  useEffect(() => {
    if (!selectedAddressId) {
      fetchLocationAndCheckService();
    }
  }, []);

  // Check service when coordinates change
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

  const fetchLocationAndCheckService = async () => {
    try {
      setLoadingLoc(true);
      setCheckingService(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Set delivery location");
        setServiceType("ERROR");
        setCheckingService(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geo?.length > 0) {
        const g = geo[0];
        const city = g.city || g.subregion || "";
        const area = g.district || g.name || "";
        setLocationText(`${area}, ${city}`);
      }

      // Save coordinates for service check
      setCurrentCoords({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      });
    } catch (error) {
      console.error("Location error:", error);
      setLocationText("Set delivery location");
      setServiceType("ERROR");
    } finally {
      setLoadingLoc(false);
    }
  };

  const fetchAddressCoordinates = async (address: Address) => {
    try {
      // If address already has coordinates, use them
      if (address.latitude && address.longitude) {
        return { lat: address.latitude, lng: address.longitude };
      }

      // Otherwise geocode the address
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

  const handleAddressSelect = async (
    label: string,
    address: Address | null,
  ) => {
    setLocationText(label);
    setModalVisible(false);

    if (address) {
      setSelectedAddressId(address.id);

      // Fetch coordinates for the selected address
      const coords = await fetchAddressCoordinates(address);

      if (coords) {
        setCurrentCoords(coords);
        // Reverse geocode to get proper location name
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
      } else {
        // If no coordinates, use address text
        setLocationText(`${address.line1}, ${address.city}`);
      }
    } else {
      // User selected "Use current location"
      await fetchLocationAndCheckService();
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

  const [savedAddresses, setSavedAddresses] = useState([]);
  const { user } = useAuth();
  const authId = user?.user?.id ?? user?.id;

  useEffect(() => {
    if (!authId) return;

    const fetchAddresses = async () => {
      try {
        const data = await getAddressApi(authId);
        const list = Array.isArray(data?.results) ? data.results : [];
        setSavedAddresses(
          list.map((a) => ({
            id: String(a.id),
            label: a.label,
            flat: a.addressLine1 ?? a.address,
            line1: a.addressLine1 ?? a.address,
            city: a.city,
            state: a.state,
            latitude: a.latitude,
            longitude: a.longitude,
          })),
        );
      } catch (e) {
        console.log(e);
      }
    };

    fetchAddresses();
  }, [authId]);

  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const first = savedAddresses[0];
      setSelectedAddressId(first.id);
      setLocationText(`${first.line1}, ${first.city}`);
      // Fetch coordinates for first address
      handleAddressSelect(`${first.line1}, ${first.city}`, first);
    }
  }, [savedAddresses]);

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
        <View style={styles.row}>
          {/* LEFT — service status + tappable location */}
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

            {/* tappable location row */}
            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.75}
            >
              {loadingLoc ? (
                <ActivityIndicator size="small" color="#2FE6A6" />
              ) : (
                <>
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
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenNotifications}
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

      {/* LOCATION PICKER MODAL */}
      <LocationPickerModal
        visible={modalVisible}
        savedAddresses={savedAddresses}
        selectedId={selectedAddressId}
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

  // right
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
