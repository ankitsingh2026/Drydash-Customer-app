import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Briefcase, Home, MapPin } from "lucide-react-native";
import React, { useState } from "react";
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
import { updateAddressApi } from "@/features/orders/orders.api";

export default function EditAddress() {
  const { theme } = useTheme();
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(false);
  const [mapQuery, setMapQuery] = useState("");

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

  /* ---------------- LOCATION ---------------- */

  const fetchCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    const loc = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };

    setLocation(coords);

    const geo = await Location.reverseGeocodeAsync(coords);

    if (geo.length) {
      const g = geo[0];

      setAddressForm((p) => ({
        ...p,
        city: g.city || "",
        state: g.region || "",
        pincode: g.postalCode || "",
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
      }));
    }
  };

  const searchOnMap = async () => {
    if (!mapQuery.trim()) return;

    const results = await Location.geocodeAsync(mapQuery);

    if (results.length) {
      const coords = results[0];

      setLocation(coords);

      const geo = await Location.reverseGeocodeAsync(coords);

      if (geo.length) {
        const g = geo[0];

        setAddressForm((p) => ({
          ...p,
          city: g.city || "",
          state: g.region || "",
          pincode: g.postalCode || "",
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
        }));
      }
    }
  };

  /* ---------------- SAVE ---------------- */

  const handleSave = async () => {
    if (
      !addressForm.addressLine1 ||
      !addressForm.city ||
      !addressForm.pincode
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        _id: addressForm._id,

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

      console.log("UPDATE PAYLOAD:", payload);

      const res = await updateAddressApi(payload);

      console.log("UPDATE RESPONSE:", res);

      Alert.alert("Success", "Address updated successfully");

      router.back();
    } catch (error) {
      console.log("UPDATE ERROR:", error);
      Alert.alert("Error", "Failed to update address");
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

        <Text style={[styles.title, { color: theme.text }]}>Edit Address</Text>

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
          />
          <TouchableOpacity onPress={searchOnMap}>
            <Text style={{ color: "#000", fontWeight: "600" }}>Go</Text>
          </TouchableOpacity>
        </View>

        <PickupMap
          location={location}
          onSelect={(c) => {
            setLocation(c);
            setAddressForm((p) => ({
              ...p,
              latitude: String(c.latitude),
              longitude: String(c.longitude),
            }));
          }}
        />

        <TouchableOpacity
          style={[styles.locBtn, { backgroundColor: theme.primary }]}
          onPress={fetchCurrentLocation}
        >
          <Text style={{ color: "#000", fontWeight: "700" }}>
            Use Current Location
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* LABEL */}
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
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TYPE */}
        <Text style={[styles.label, { color: theme.text }]}>Type</Text>

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

        {/* INPUTS */}
        <Input
          placeholder="Address Line 1"
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
          placeholder="Landmark"
          placeholderTextColor="#888"
          value={addressForm.landmark}
          onChangeText={(t: any) =>
            setAddressForm((p) => ({ ...p, landmark: t }))
          }
        />

        <Input
          placeholder="City"
          placeholderTextColor="#888"
          value={addressForm.city}
          onChangeText={(t: any) => setAddressForm((p) => ({ ...p, city: t }))}
        />

        <Input
          placeholder="State"
          placeholderTextColor="#888"
          value={addressForm.state}
          onChangeText={(t: any) => setAddressForm((p) => ({ ...p, state: t }))}
        />

        <Input
          placeholder="Pincode"
          placeholderTextColor="#888"
          value={addressForm.pincode}
          onChangeText={(t: any) =>
            setAddressForm((p) => ({ ...p, pincode: t }))
          }
        />
      </ScrollView>

      {/* SAVE */}
      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: theme.primary }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.saveText}>Save Address</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

/* INPUT */
function Input(props: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },

  title: { fontSize: 16, fontWeight: "700" },

  mapContainer: { height: 260 },

  searchBox: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    zIndex: 10,
    flexDirection: "row",
    paddingHorizontal: 10,
    height: 40,
    alignItems: "center",
  },

  locBtn: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  container: {
    padding: 16,
    paddingBottom: 120,
  },

  label: {
    fontWeight: "800",
    marginBottom: 8,
  },

  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  typeBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
  },

  input: {
    height: 45,
    backgroundColor: "#1A2332",
    borderRadius: 10,
    paddingHorizontal: 10,
    color: "#fff",
  },

  saveBtn: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 30 : 20,
    left: 16,
    right: 16,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  saveText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 16,
  },
});
