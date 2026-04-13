import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Briefcase, Home, MapPin } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";

import PickupMap from "@/components/maps/PickupMap.native";
import { saveAddressApi, updateAddressApi } from "@/features/orders/orders.api";

export default function EditAddress() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();
  const isEditing = !!params._id;

  const [loading, setLoading] = useState(false);
  const [mapQuery, setMapQuery] = useState("");
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const [location, setLocation] = useState({
    latitude: Number(params.latitude) || 19.076,
    longitude: Number(params.longitude) || 72.8777,
  });

  const [addressForm, setAddressForm] = useState({
    _id: (params._id as string) || "",

    label: (params.label as string)?.toLowerCase() || "home",
    addressType: (params.addressType as string)?.toUpperCase() || "PICKUP",

    addressLine1: (params.addressLine1 as string) || "",
    addressLine2: (params.addressLine2 as string) || "",

    landmark: (params.landmark as string) || "",
    city: (params.city as string) || "",
    state: (params.state as string) || "",
    pincode: (params.pincode as string) || "",

    latitude: (params.latitude as string) || "",
    longitude: (params.longitude as string) || "",
  });

  /* ---------------- AUTO-FILL ADDRESS FROM COORDINATES ---------------- */

  const autoFillAddressFromCoords = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    if (isAutoFilling) return;

    setIsAutoFilling(true);

    try {
      const geo = await Location.reverseGeocodeAsync(coords);

      if (geo.length) {
        const g = geo[0];

        // Sequential field filling with priority order
        let newAddressLine1 = "";
        let newAddressLine2 = "";
        let newLandmark = "";
        let newCity = "";
        let newState = "";
        let newPincode = "";

        // Priority 1: Street address (most important)
        if (g.street && g.street.trim()) {
          newAddressLine1 = g.street.trim();
        }

        // Priority 2: House/Suburb/Area
        if (g.subregion && g.subregion.trim()) {
          if (newAddressLine1) {
            newAddressLine1 += `, ${g.subregion.trim()}`;
          } else {
            newAddressLine1 = g.subregion.trim();
          }
        }

        // Priority 3: District
        if (g.district && g.district.trim()) {
          if (newAddressLine1) {
            newAddressLine1 += `, ${g.district.trim()}`;
          } else {
            newAddressLine1 = g.district.trim();
          }
        }

        // Priority 4: City (for address line 2 or fallback)
        if (g.city && g.city.trim()) {
          newCity = g.city.trim();
        } else if (g.district && g.district.trim()) {
          newCity = g.district.trim();
        }

        // Priority 5: State/Region
        if (g.region && g.region.trim()) {
          newState = g.region.trim();
        }

        // Priority 6: Postal Code
        if (g.postalCode && g.postalCode.trim()) {
          newPincode = g.postalCode.trim();
        }

        // Priority 7: Landmark (name of the place)
        if (g.name && g.name.trim() && g.name !== g.street) {
          newLandmark = g.name.trim();
        }

        // Priority 8: Additional details for address line 2
        const additionalDetails = [];
        if (
          g.area &&
          g.area.trim() &&
          g.area !== g.subregion &&
          g.area !== g.district
        ) {
          additionalDetails.push(g.area.trim());
        }
        if (g.isoCountryCode && g.isoCountryCode.trim()) {
          additionalDetails.push(g.isoCountryCode.trim());
        }

        if (additionalDetails.length > 0) {
          newAddressLine2 = additionalDetails.join(", ");
        }

        // Update form fields sequentially
        setAddressForm((prev) => ({
          ...prev,
          addressLine1: newAddressLine1 || prev.addressLine1,
          addressLine2: newAddressLine2 || prev.addressLine2,
          landmark: newLandmark || prev.landmark,
          city: newCity || prev.city,
          state: newState || prev.state,
          pincode: newPincode || prev.pincode,
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
        }));

        // Show success feedback
        if (newAddressLine1 || newCity) {
          console.log("Address auto-filled successfully");
        }
      } else {
        // If reverse geocoding fails, at least update coordinates
        setAddressForm((prev) => ({
          ...prev,
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
        }));
      }
    } catch (error) {
      console.log("Reverse geocoding error:", error);
      // Still update coordinates even if address fetch fails
      setAddressForm((prev) => ({
        ...prev,
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
      }));
    } finally {
      setIsAutoFilling(false);
    }
  };

  /* ---------------- LOCATION ---------------- */

  const fetchCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setLocation(coords);
      await autoFillAddressFromCoords(coords);
    } catch (error) {
      console.log("Error fetching location:", error);
      Alert.alert("Error", "Failed to get current location");
    }
  };

  const searchOnMap = async () => {
    if (!mapQuery.trim()) {
      Alert.alert("Error", "Please enter a location to search");
      return;
    }

    try {
      const results = await Location.geocodeAsync(mapQuery);

      if (results.length) {
        const coords = results[0];
        setLocation(coords);
        await autoFillAddressFromCoords(coords);
        setMapQuery(""); // Clear search after successful search
      } else {
        Alert.alert("Not Found", "No location found for the given address");
      }
    } catch (error) {
      console.log("Geocoding error:", error);
      Alert.alert("Error", "Failed to search location");
    }
  };

  /* ---------------- HANDLE MAP SELECTION ---------------- */

  const handleMapSelect = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    setLocation(coords);
    await autoFillAddressFromCoords(coords);
  };

  /* ---------------- INITIAL AUTO-FILL IF COORDINATES EXIST ---------------- */

  useEffect(() => {
    // If we have coordinates from params, auto-fill the address fields
    if (params.latitude && params.longitude && !addressForm.addressLine1) {
      const coords = {
        latitude: Number(params.latitude),
        longitude: Number(params.longitude),
      };
      autoFillAddressFromCoords(coords);
    }
  }, []);

  /* ---------------- SAVE ADDRESS ---------------- */

  const handleSave = async () => {
    // Validation
    if (
      !addressForm.addressLine1 ||
      !addressForm.city ||
      !addressForm.pincode
    ) {
      Alert.alert(
        "Validation Error",
        "Please fill all required fields:\n• Address Line 1\n• City\n• Pincode",
      );
      return;
    }

    if (!addressForm.latitude || !addressForm.longitude) {
      Alert.alert(
        "Location Error",
        "Please select a location on the map first",
      );
      return;
    }

    try {
      setLoading(true);

      // Prepare payload according to API expectations
      const payload = {
        // For new address, don't include _id
        ...(isEditing && { _id: addressForm._id }),

        label:
          addressForm.label === "home"
            ? "Home"
            : addressForm.label === "work"
              ? "Office"
              : "Other",

        addressType: addressForm.addressType,

        addressLine1: addressForm.addressLine1,
        addressLine2: addressForm.addressLine2 || "",

        landmark: addressForm.landmark,
        city: addressForm.city,
        state: addressForm.state,
        pincode: addressForm.pincode,

        latitude: Number(addressForm.latitude),
        longitude: Number(addressForm.longitude),
      };

      console.log("Saving payload:", payload);

      let response;
      if (isEditing) {
        // Update existing address
        response = await updateAddressApi(payload);
        console.log("Update response:", response);
        Alert.alert("Success", "Address updated successfully");
      } else {
        // Create new address - using saveAddressApi
        response = await saveAddressApi(payload);
        console.log("Save response:", response);
        Alert.alert("Success", "Address saved successfully");
      }

      router.back();
    } catch (error: any) {
      console.log("Save/Update error:", error);

      // Show detailed error message if available
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save address";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color={theme.text} size={22} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>
          {isEditing ? "Edit Address" : "Add New Address"}
        </Text>

        <View style={{ width: 22 }} />
      </View>

      {/* MAP */}
      <View style={styles.mapContainer}>
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search location..."
            placeholderTextColor="#888"
            value={mapQuery}
            onChangeText={setMapQuery}
            style={{ flex: 1, color: "#000" }}
            onSubmitEditing={searchOnMap}
          />
          <TouchableOpacity onPress={searchOnMap}>
            <Text style={{ color: "#000", fontWeight: "600" }}>Go</Text>
          </TouchableOpacity>
        </View>

        <PickupMap location={location} onSelect={handleMapSelect} />

        <TouchableOpacity
          style={[styles.locBtn, { backgroundColor: theme.primary }]}
          onPress={fetchCurrentLocation}
        >
          <Text style={{ color: "#000", fontWeight: "700" }}>
            📍 Use Current Location
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* LABEL SELECTION */}
        <Text style={[styles.label, { color: theme.text }]}>Save as</Text>
        <View style={styles.typeRow}>
          {["home", "work", "other"].map((t) => {
            const active = addressForm.label === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setAddressForm((p) => ({ ...p, label: t }))}
                style={[
                  styles.typeBtn,
                  { backgroundColor: active ? theme.primary : "#1A2332" },
                ]}
              >
                {t === "home" && (
                  <Home size={16} color={active ? "#000" : "#fff"} />
                )}
                {t === "work" && (
                  <Briefcase size={16} color={active ? "#000" : "#fff"} />
                )}
                {t === "other" && (
                  <MapPin size={16} color={active ? "#000" : "#fff"} />
                )}
                <Text
                  style={{
                    marginLeft: 6,
                    color: active ? "#000" : theme.text,
                    fontWeight: "700",
                  }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ADDRESS TYPE */}
        <Text style={[styles.label, { color: theme.text }]}>Address Type</Text>
        <View style={styles.typeRow}>
          {["PICKUP", "DELIVERY"].map((t) => {
            const active = addressForm.addressType === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() =>
                  setAddressForm((p) => ({ ...p, addressType: t }))
                }
                style={[
                  styles.typeBtn,
                  { backgroundColor: active ? theme.primary : "#1A2332" },
                ]}
              >
                <Text
                  style={{
                    color: active ? "#000" : theme.text,
                    fontWeight: "700",
                  }}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ADDRESS FIELDS - Filled in sequence */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Address Details
        </Text>

        <Input
          placeholder="Address Line 1 * (Street, Area)"
          placeholderTextColor="#888"
          value={addressForm.addressLine1}
          onChangeText={(t: any) =>
            setAddressForm((p) => ({ ...p, addressLine1: t }))
          }
        />

        <Input
          placeholder="Address Line 2 (Optional)"
          placeholderTextColor="#888"
          value={addressForm.addressLine2}
          onChangeText={(t: any) =>
            setAddressForm((p) => ({ ...p, addressLine2: t }))
          }
        />

        <Input
          placeholder="Landmark (Nearby famous place)"
          placeholderTextColor="#888"
          value={addressForm.landmark}
          onChangeText={(t: any) =>
            setAddressForm((p) => ({ ...p, landmark: t }))
          }
        />

        <Input
          placeholder="City / District *"
          placeholderTextColor="#888"
          value={addressForm.city}
          onChangeText={(t: any) => setAddressForm((p) => ({ ...p, city: t }))}
        />

        <Input
          placeholder="State *"
          placeholderTextColor="#888"
          value={addressForm.state}
          onChangeText={(t: any) => setAddressForm((p) => ({ ...p, state: t }))}
        />

        <Input
          placeholder="Pincode / Postal Code *"
          placeholderTextColor="#888"
          value={addressForm.pincode}
          onChangeText={(t: any) =>
            setAddressForm((p) => ({ ...p, pincode: t }))
          }
          keyboardType="numeric"
          maxLength={6}
        />

        {/* AUTO-FILL STATUS INDICATOR */}
        {isAutoFilling && (
          <View style={styles.autoFillIndicator}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={[styles.autoFillText, { color: theme.subText }]}>
              Auto-filling address details...
            </Text>
          </View>
        )}

        {/* COORDINATES DISPLAY */}
        {addressForm.latitude && addressForm.longitude && (
          <View style={styles.coordsContainer}>
            <Text style={[styles.coordsText, { color: theme.subText }]}>
              📍 Coordinates: {Number(addressForm.latitude).toFixed(6)},{" "}
              {Number(addressForm.longitude).toFixed(6)}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* SAVE BUTTON */}
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: theme.primary }]}
        onPress={handleSave}
        disabled={loading || isAutoFilling}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.saveText}>
            {isEditing ? "Update Address" : "Save Address"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/* INPUT COMPONENT */
function Input(props: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    marginTop: Platform.OS === "ios" ? 50 : 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  title: { fontSize: 18, fontWeight: "800" },

  mapContainer: {
    height: 260,
    position: "relative",
  },

  searchBox: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    zIndex: 10,
    flexDirection: "row",
    paddingHorizontal: 12,
    height: 44,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  locBtn: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  container: {
    padding: 16,
    paddingBottom: 100,
  },

  sectionTitle: {
    fontWeight: "800",
    marginBottom: 12,
    marginTop: 8,
    fontSize: 14,
  },

  label: {
    fontWeight: "800",
    marginBottom: 8,
    fontSize: 14,
  },

  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },

  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  input: {
    height: 48,
    backgroundColor: "#1A2332",
    borderRadius: 10,
    paddingHorizontal: 14,
    color: "#fff",
    fontSize: 14,
  },

  saveBtn: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 20,
    left: 16,
    right: 16,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },

  saveText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },

  autoFillIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 8,
  },

  autoFillText: {
    fontSize: 12,
  },

  coordsContainer: {
    marginTop: 12,
    alignItems: "center",
  },

  coordsText: {
    fontSize: 11,
    opacity: 0.6,
  },
});
