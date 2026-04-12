import { checkServiceAvailability } from "@/features/location/location.api";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifications } from "../../context/NotificationContext";
import { useTheme } from "../../context/ThemeContext";

type TabBarProps = {
  onOpenNotifications: () => void;
  onWalletPress: () => void;
};

export const TabBar = ({ onOpenNotifications }: TabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  const [locationText, setLocationText] = useState("Fetching location...");
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [serviceMessage, setServiceMessage] = useState("Checking...");
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [serviceType, setServiceType] = useState("LOADING");
  const [checkingService, setCheckingService] = useState(true);

  useEffect(() => {
    fetchLocationAndCheckService();
  }, []);

  const fetchLocationAndCheckService = async () => {
    try {
      setLoadingLoc(true);
      setCheckingService(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Location permission denied");
        setServiceMessage("Location required");
        setServiceType("ERROR");
        setLoadingLoc(false);
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

      // Check service availability using your API
      const serviceCheck = await checkServiceAvailability(
        loc.coords.latitude,
        loc.coords.longitude,
      );

      setIsServiceAvailable(serviceCheck.serviceAvailable);
      setServiceMessage(serviceCheck.message);
      setServiceType(serviceCheck.type);
    } catch (e) {
      console.error("Error in fetchLocationAndCheckService:", e);
      setLocationText("Unable to fetch location");
      setServiceMessage("Service unavailable");
      setServiceType("ERROR");
    } finally {
      setLoadingLoc(false);
      setCheckingService(false);
    }
  };

  const handleServicePress = () => {
    let title = "";
    let message = "";
    let subMessage = "";

    if (serviceType === "AVAILABLE") {
      title = "✅ Service Available";
      message = "We are delivering to your area!";
      subMessage =
        "⏱️ Delivery: 10-15 mins\n💳 Payment: Cash & Online\n📍 Tracking available";
    } else if (serviceType === "OUT_OF_AREA") {
      title = "📍 Not in Your Area Yet";
      message = "We're not delivering to this location at the moment.";
      subMessage =
        "🚀 We're expanding soon!\n🔔 Get notified when we launch in your area";
    } else if (serviceType === "NOT_AVAILABLE_NOW") {
      title = "⏰ Currently Not Serviceable";
      message = "We're not accepting orders right now.";
      subMessage =
        "🕒 Please check back during operating hours\n📅 Service hours: 8:00 AM - 9:00 PM";
    } else if (serviceType === "ERROR") {
      title = "⚠️ Service Issue";
      message = "Unable to check service availability.";
      subMessage =
        "📱 Please check your internet connection\n🔄 Pull to refresh or try again later";
    } else {
      title = "Checking Service";
      message = "Please wait while we check service availability in your area.";
      subMessage = "📍 Make sure location services are enabled";
    }

    Alert.alert(
      title,
      `${message}\n\n${subMessage}`,
      [
        { text: "OK", style: "default" },
        ...(serviceType === "ERROR"
          ? [{ text: "Retry", onPress: () => fetchLocationAndCheckService() }]
          : []),
      ],
      { cancelable: true },
    );
  };

  const getServiceColor = () => {
    if (isServiceAvailable) return "#2FE6A6";
    if (serviceType === "OUT_OF_AREA") return "#FFA500";
    if (serviceType === "NOT_AVAILABLE_NOW") return "#FF6B6B";
    return "#8FB3A8";
  };

  const getServiceTextStyle = () => {
    if (isServiceAvailable) return styles.serviceAvailable;
    if (serviceType === "OUT_OF_AREA") return styles.serviceOutOfArea;
    if (serviceType === "NOT_AVAILABLE_NOW") return styles.serviceNotAvailable;
    return styles.serviceError;
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 6,
        },
      ]}
    >
      <View style={styles.row}>
        {/* LEFT CONTENT */}
        <View style={styles.left}>
          <TouchableOpacity onPress={handleServicePress} activeOpacity={0.7}>
            <View style={styles.serviceRow}>
              {checkingService ? (
                <ActivityIndicator size="small" color="#2FE6A6" />
              ) : (
                <>
                  <Text style={[styles.serviceText, getServiceTextStyle()]}>
                    {serviceMessage}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color="#8FB3A8"
                    style={{ marginLeft: 6 }}
                  />
                </>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.locationRow}>
            {loadingLoc ? (
              <ActivityIndicator size="small" color="#2FE6A6" />
            ) : (
              <>
                <Ionicons
                  name="location-sharp"
                  size={16}
                  color={getServiceColor()}
                  style={{ marginRight: 6 }}
                />

                <Text style={styles.locationText} numberOfLines={1}>
                  {locationText}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* RIGHT ICON - Uncomment if needed */}
        {/* <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenNotifications}
          style={styles.iconBtn}
        >
          <Ionicons name="notifications-outline" size={18} color="#E6FFF7" />

          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#031612", // deep green
    paddingHorizontal: 16,
    paddingBottom: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  /* LEFT */
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

  serviceAvailable: {
    color: "#2FE6A6",
  },

  serviceOutOfArea: {
    color: "#FFA500",
  },

  serviceNotAvailable: {
    color: "#FF6B6B",
  },

  serviceError: {
    color: "#8FB3A8",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationText: {
    fontSize: 11,
    color: "#8FB3A8",
    fontWeight: "500",
    maxWidth: 200,
  },

  /* RIGHT ICON */
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
