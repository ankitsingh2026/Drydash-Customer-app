import * as Location from "expo-location";
import { Bell } from "lucide-react-native";
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
  onOpenNotifications: () => void;
  onWalletPress: () => void;
};

export const TabBar = ({ onOpenNotifications }: TabBarProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

  const [locationText, setLocationText] = useState("Fetching location...");
  const [loadingLoc, setLoadingLoc] = useState(true);

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    try {
      setLoadingLoc(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Location permission denied");
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
    } catch (e) {
      setLocationText("Unable to fetch location");
    } finally {
      setLoadingLoc(false);
    }
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
          <Text style={styles.title}>24 Hours</Text>

          <View style={styles.locationRow}>
            <Text style={styles.homeTag}>HOME · </Text>

            {loadingLoc ? (
              <ActivityIndicator size="small" color="#2FE6A6" />
            ) : (
              <Text style={styles.locationText} numberOfLines={1}>
                {locationText}
              </Text>
            )}
          </View>
        </View>

        {/* RIGHT ICON */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#031612", // deep green
    paddingHorizontal: 16,
    paddingBottom: 10,
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

  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#E6FFF7",
    marginBottom: 2,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  homeTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2FE6A6",
    letterSpacing: 1,
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