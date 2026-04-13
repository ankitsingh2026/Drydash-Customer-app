import LocationPickerModal from "@/components/LocationPickerModal";
import { getAddressApi } from "@/features/orders/orders.api";
import { useAuth } from "@/hooks/useAuth";
import { Address } from "@/types/order.types";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
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
  onWalletPress?: () => void;
  savedAddresses?: Address[];
};

export const TabBar = ({ onOpenNotifications }: TabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount, refreshNotifications } = useNotifications();
  const isFetchingRef = useRef(false);
  const [locationText, setLocationText] = useState("Fetching location...");
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const { user } = useAuth();
  const authId = user?.user?.id ?? user?.id;

  // useEffect(() => {
  //   fetchLocation();
  // }, []);
  useEffect(() => {
    if (!selectedAddressId) {
      fetchLocation();
    }
  }, []);

  const fetchLocation = async () => {
    try {
      setLoadingLoc(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Set delivery location");
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
        const text = [area, city].filter(Boolean).join(", ");
        setLocationText(text || "Set delivery location");
      }
    } catch {
      setLocationText("Set delivery location");
    } finally {
      setLoadingLoc(false);
    }
  };

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
          })),
        );
      } catch (e) {
        console.log(e);
      }
    };

    fetchAddresses();
  }, [authId]);

  const handleBellPress = async () => {
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;

    onOpenNotifications?.();
    await refreshNotifications();

    isFetchingRef.current = false;
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
        <View style={styles.row}>
          {/* LEFT */}
          <View style={styles.left}>
            <Text style={styles.title}>24 Hours</Text>

            <TouchableOpacity
              style={styles.locationRow}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.55}
            >
              {loadingLoc ? (
                <ActivityIndicator size="small" color="#2FE6A6" />
              ) : (
                <>
                  <Ionicons
                    size={16}
                    color="#2FE6A6"
                    strokeWidth={2}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {locationText}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={16}
                    color="#2FE6A6"
                    style={{ marginLeft: 3, marginTop: 2 }}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleBellPress}
            style={styles.bellContainer}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color="#E6FFF7" />

            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {Math.max(0, unreadCount) > 9
                    ? "9+"
                    : Math.max(0, unreadCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── LOCATION PICKER MODAL ── */}
      <LocationPickerModal
        visible={modalVisible}
        savedAddresses={savedAddresses}
        selectedId={selectedAddressId}
        onSelect={(label, addr) => {
          setLocationText(label);
          setSelectedAddressId(addr?.id || null);
          setModalVisible(false);
        }}
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
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E6FFF7",
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationText: {
    fontSize: 16,
    color: "#8FB3A8",
    fontWeight: "500",
    maxWidth: 200,
  },
  bellContainer: {
    padding: 6,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
