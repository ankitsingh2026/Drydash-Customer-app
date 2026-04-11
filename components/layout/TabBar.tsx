// components/TabBar.js

// import { Ionicons } from "@expo/vector-icons";
// import * as Location from "expo-location";
// import React, { useEffect, useState } from "react";
// import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { useNotifications } from "../../context/NotificationContext";
// import { useTheme } from "../../context/ThemeContext";

// type TabBarProps = {
//   onOpenNotifications: () => void;
//   onWalletPress: () => void;
// };

// export const TabBar = ({ onOpenNotifications }: TabBarProps) => {
//   const { theme } = useTheme();
//   const insets = useSafeAreaInsets();
//   const { unreadCount } = useNotifications();

//   const [locationText, setLocationText] = useState("Fetching location...");
//   const [loadingLoc, setLoadingLoc] = useState(true);

//   useEffect(() => {
//     fetchLocation();
//   }, []);

//   const fetchLocation = async () => {
//     try {
//       setLoadingLoc(true);

//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== "granted") {
//         setLocationText("Location permission denied");
//         return;
//       }

//       const loc = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.High,
//       });

//       const geo = await Location.reverseGeocodeAsync({
//         latitude: loc.coords.latitude,
//         longitude: loc.coords.longitude,
//       });

//       if (geo?.length > 0) {
//         const g = geo[0];
//         const city = g.city || g.subregion || "";
//         const area = g.district || g.name || "";

//         setLocationText(`${area}, ${city}`);
//       }
//     } catch (e) {
//       setLocationText("Unable to fetch location");
//     } finally {
//       setLoadingLoc(false);
//     }
//   };

//   return (
//     <View
//       style={[
//         styles.container,
//         {
//           paddingTop: insets.top + 6,
//         },
//       ]}
//     >
//       <View style={styles.row}>
//         {/* LEFT CONTENT */}
//         <View style={styles.left}>
//           <Text style={styles.title}>24 Hours</Text>

//           <View style={styles.locationRow}>
//             {loadingLoc ? (
//               <ActivityIndicator size="small" color="#2FE6A6" />
//             ) : (
//               <>
//                 <Ionicons
//                   name="location-sharp"
//                   size={16}
//                   color="#2FE6A6"
//                   style={{ marginRight: 6 }}
//                 />

//                 <Text style={styles.locationText} numberOfLines={1}>
//                   {locationText}
//                 </Text>
//               </>
//             )}
//           </View>
//         </View>

//         {/* RIGHT ICON */}
//         {/* <TouchableOpacity
//           activeOpacity={0.8}
//           onPress={onOpenNotifications}
//           style={styles.iconBtn}
//         >
//           <Bell size={18} color="#E6FFF7" />

//           {unreadCount > 0 && (
//             <View style={styles.badge}>
//               <Text style={styles.badgeText}>
//                 {unreadCount > 9 ? "9+" : unreadCount}
//               </Text>
//             </View>
//           )}
//         </TouchableOpacity> */}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: "#031612", // deep green
//     paddingHorizontal: 16,
//     paddingBottom: 2,
//   },

//   row: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },

//   /* LEFT */
//   left: {
//     flex: 1,
//   },

//   title: {
//     fontSize: 22,
//     fontWeight: "900",
//     color: "#E6FFF7",
//     marginBottom: 2,
//   },

//   locationRow: {
//     flexDirection: "row",
//     alignItems: "center",
//   },

//   homeTag: {
//     fontSize: 11,
//     fontWeight: "700",
//     color: "#2FE6A6",
//     letterSpacing: 1,
//   },

//   locationText: {
//     fontSize: 11,
//     color: "#8FB3A8",
//     fontWeight: "500",
//     maxWidth: 200,
//   },

//   /* RIGHT ICON */
//   iconBtn: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "#0D1F1C",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "#1A3330",

//     shadowColor: "#2FE6A6",
//     shadowOpacity: 0.15,
//     shadowRadius: 10,
//     elevation: 6,
//   },

//   badge: {
//     position: "absolute",
//     top: 6,
//     right: 6,
//     minWidth: 14,
//     height: 14,
//     borderRadius: 7,
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: "#EF4444",
//   },

//   badgeText: {
//     color: "#fff",
//     fontSize: 8,
//     fontWeight: "800",
//   },
// });

import { checkServiceAvailability } from "@/features/location/location.api";
import React from "react";
import { Modal, TouchableOpacity } from "react-native";

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
  const [serviceStatus, setServiceStatus] = useState({
    loading: true,
    available: false,
    message: "",
    subMessage: "",
    type: "LOADING",
  });
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [locationCoords, setLocationCoords] = useState(null);

  // useEffect(() => {
  //   fetchLocation();
  // }, []);
  useEffect(() => {
    fetchLocationAndCheckService();
  }, []);

  const fetchLocationAndCheckService = async () => {
    try {
      setServiceStatus({ ...serviceStatus, loading: true });

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationText("Location permission denied");
        setServiceStatus({
          loading: false,
          available: false,
          message: "Location Access Required",
          subMessage: "Please enable location to check service availability",
          type: "ERROR",
        });
        return;
      }

      // Get current position
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocationCoords(loc.coords);

      // Reverse geocode for location name
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

      // Check service availability
      const serviceCheck = await checkServiceAvailability(
        loc.coords.latitude,
        loc.coords.longitude,
      );

      setServiceStatus({
        loading: false,
        available: serviceCheck.serviceAvailable,
        message: serviceCheck.message,
        subMessage: serviceCheck.subMessage,
        type: serviceCheck.type,
      });
    } catch (error) {
      console.error("Error:", error);
      setLocationText("Unable to fetch location");
      setServiceStatus({
        loading: false,
        available: false,
        message: "Service Unavailable",
        subMessage: "Please check your connection",
        type: "ERROR",
      });
    }
  };

  const handleLocationPress = () => {
    setShowServiceModal(true);
  };

  const getServiceDisplayText = () => {
    if (serviceStatus.loading) {
      return "Checking service...";
    }
    if (serviceStatus.available) {
      return serviceStatus.message;
    }
    return serviceStatus.message;
  };

  const getServiceStyle = () => {
    if (serviceStatus.available) {
      return styles.serviceAvailable;
    }
    if (serviceStatus.type === "OUT_OF_AREA") {
      return styles.serviceUnavailable;
    }
    return styles.serviceUnavailable;
  };

  const getIconColor = () => {
    if (serviceStatus.available) {
      return "#2FE6A6";
    }
    return "#FF6B6B";
  };

  return (
    <>
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
            <TouchableOpacity onPress={handleLocationPress}>
              <View style={styles.serviceRow}>
                {serviceStatus.loading ? (
                  <ActivityIndicator size="small" color="#2FE6A6" />
                ) : (
                  <>
                    <View style={[styles.serviceTag, getServiceStyle()]}>
                      <Text style={styles.serviceText}>
                        {getServiceDisplayText()}
                      </Text>
                    </View>
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
              <Ionicons
                name="location-sharp"
                size={14}
                color={getIconColor()}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationText}
              </Text>
            </View>
          </View>

          {/* RIGHT ICON */}
          {/* <TouchableOpacity
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
          </TouchableOpacity> */}
        </View>
      </View>

      {/* Service Status Modal */}
      <Modal
        visible={showServiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServiceModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowServiceModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />

            {serviceStatus.type === "AVAILABLE" && (
              <>
                <View style={[styles.statusIcon, styles.statusIconSuccess]}>
                  <Ionicons name="checkmark-circle" size={60} color="#2FE6A6" />
                </View>
                <Text style={styles.modalTitle}>Great News!</Text>
                <Text style={styles.modalMessage}>
                  We're delivering to your area
                </Text>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={20} color="#2FE6A6" />
                  <Text style={styles.infoText}>Delivery in 10-15 mins</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="card-outline" size={20} color="#2FE6A6" />
                  <Text style={styles.infoText}>Cash & Online payment</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowServiceModal(false)}
                >
                  <Text style={styles.modalButtonText}>Start Ordering</Text>
                </TouchableOpacity>
              </>
            )}

            {serviceStatus.type === "OUT_OF_AREA" && (
              <>
                <View style={[styles.statusIcon, styles.statusIconWarning]}>
                  <Ionicons name="location-outline" size={60} color="#FFA500" />
                </View>
                <Text style={styles.modalTitle}>Not in Your Area Yet</Text>
                <Text style={styles.modalMessage}>
                  We're not delivering to {locationText} at the moment
                </Text>
                <View style={styles.infoRow}>
                  <Ionicons name="rocket-outline" size={20} color="#FFA500" />
                  <Text style={styles.infoText}>
                    We're expanding to new areas soon!
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color="#FFA500"
                  />
                  <Text style={styles.infoText}>
                    Get notified when we launch
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonWarning]}
                  onPress={() => setShowServiceModal(false)}
                >
                  <Text style={styles.modalButtonText}>Notify Me</Text>
                </TouchableOpacity>
              </>
            )}

            {serviceStatus.type === "NOT_AVAILABLE_NOW" && (
              <>
                <View style={[styles.statusIcon, styles.statusIconWarning]}>
                  <Ionicons name="time-outline" size={60} color="#FFA500" />
                </View>
                <Text style={styles.modalTitle}>Currently Closed</Text>
                <Text style={styles.modalMessage}>
                  We're not accepting orders right now
                </Text>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#FFA500" />
                  <Text style={styles.infoText}>Open tomorrow at 8:00 AM</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons
                    name="restaurant-outline"
                    size={20}
                    color="#FFA500"
                  />
                  <Text style={styles.infoText}>
                    Check back during operating hours
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonWarning]}
                  onPress={() => setShowServiceModal(false)}
                >
                  <Text style={styles.modalButtonText}>Set Reminder</Text>
                </TouchableOpacity>
              </>
            )}

            {serviceStatus.type === "ERROR" && (
              <>
                <View style={[styles.statusIcon, styles.statusIconError]}>
                  <Ionicons name="alert-circle" size={60} color="#FF6B6B" />
                </View>
                <Text style={styles.modalTitle}>Unable to Check Service</Text>
                <Text style={styles.modalMessage}>
                  Please check your connection and try again
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonError]}
                  onPress={() => {
                    setShowServiceModal(false);
                    fetchLocationAndCheckService();
                  }}
                >
                  <Text style={styles.modalButtonText}>Retry</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#031612",
    paddingHorizontal: 16,
    paddingBottom: 12,
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

  serviceTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(47, 230, 166, 0.15)",
  },

  serviceAvailable: {
    backgroundColor: "rgba(47, 230, 166, 0.15)",
  },

  serviceUnavailable: {
    backgroundColor: "rgba(255, 107, 107, 0.15)",
  },

  serviceText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2FE6A6",
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  locationText: {
    fontSize: 12,
    color: "#8FB3A8",
    fontWeight: "500",
    maxWidth: 220,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#031612",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    alignItems: "center",
    minHeight: 400,
  },

  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#1A3330",
    borderRadius: 2,
    marginBottom: 24,
  },

  statusIcon: {
    marginBottom: 16,
  },

  statusIconSuccess: {
    backgroundColor: "rgba(47, 230, 166, 0.1)",
    borderRadius: 60,
    padding: 12,
  },

  statusIconWarning: {
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    borderRadius: 60,
    padding: 12,
  },

  statusIconError: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    borderRadius: 60,
    padding: 12,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E6FFF7",
    marginBottom: 8,
    textAlign: "center",
  },

  modalMessage: {
    fontSize: 16,
    color: "#8FB3A8",
    textAlign: "center",
    marginBottom: 24,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
    paddingHorizontal: 16,
  },

  infoText: {
    fontSize: 14,
    color: "#E6FFF7",
    marginLeft: 12,
    flex: 1,
  },

  modalButton: {
    backgroundColor: "#2FE6A6",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },

  modalButtonWarning: {
    backgroundColor: "#FFA500",
  },

  modalButtonError: {
    backgroundColor: "#FF6B6B",
  },

  modalButtonText: {
    color: "#031612",
    fontSize: 16,
    fontWeight: "bold",
  },
});
