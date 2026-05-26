import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { Briefcase, Home, MapPin } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAddress } from "@/context/AddressContext";
import { saveAddressApi, updateAddressApi } from "@/features/orders/orders.api";
import { showAlert } from "@/components/Customalert";

const C = {
  bg: "#031612",
  white: "#0B1E1A",
  text: "#E6FFF7",
  subText: "#8FB3A8",
  border: "#163028",
  borderStrong: "#1F3D37",
  pink: "#00E1A2",
  disabled: "#27443C",
  disabledText: "#6A9387",
};

export default function EditAddress() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const editId = (params._id as string) || (params.id as string) || "";
  const isEditing = Boolean(editId);

  const [loading, setLoading] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const [location, setLocation] = useState({
    latitude: Number(params.latitude) || 28.6139,
    longitude: Number(params.longitude) || 77.209,
  });

  const [addressForm, setAddressForm] = useState({
    _id: editId,
    label: ((params.label as string) || "home").toLowerCase(),
    houseFloor: (params.addressLine1 as string) || "",
    buildingBlock: (params.addressLine2 as string) || "",
    landmarkArea: (params.landmark as string) || "",
    city: (params.city as string) || "",
    state: (params.state as string) || "",
    pincode: (params.pincode as string) || "",
    contactName: (params.contactName as string) || "",
    contactPhone: (params.contactPhone as string) || "",
    latitude: String(Number(params.latitude) || 28.6139),
    longitude: String(Number(params.longitude) || 77.209),
  });

  console.log("Initial address form state:", addressForm);

  const [areaName, setAreaName] = useState((params.areaName as string) || "Selected Location");
  const [areaSubName, setAreaSubName] = useState((params.areaSubName as string) || "");

  const { refreshAddresses } = useAddress();

  const saveEnabled = useMemo(() => {
    return Boolean(addressForm.houseFloor.trim()) && !loading && !isAutoFilling;
  }, [addressForm.houseFloor, loading, isAutoFilling]);

  useEffect(() => {
    autoFillAddressFromCoords(location);
  }, [location.latitude, location.longitude]);

  const autoFillAddressFromCoords = async (coords: { latitude: number; longitude: number }) => {
    if (isAutoFilling) return;

    try {
      setIsAutoFilling(true);
      const geo = await Location.reverseGeocodeAsync(coords);
      const g = geo?.[0];

      const newCity = g?.city || g?.district || "";
      const newState = g?.region || "";
      const newPin = g?.postalCode || "";
      const subregion = g?.subregion || g?.district || "";

      setAreaName(g?.district || g?.subregion || g?.city || areaName || "Selected Location");
      setAreaSubName([g?.city || g?.region, g?.postalCode].filter(Boolean).join(", "));

      setAddressForm((prev) => ({
        ...prev,
        city: prev.city || newCity,
        state: prev.state || newState,
        pincode: prev.pincode || newPin,
        landmarkArea: prev.landmarkArea || subregion,
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
      }));
    } catch (error) {
      console.error("reverse geocode error", error);
      setAddressForm((prev) => ({
        ...prev,
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
      }));
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleSave = async () => {
    if (!addressForm.houseFloor.trim()) {
      showAlert({ type: 'warning', title: 'Missing details', message: 'Please enter House No. & Floor.' });

      return;
    }

    if (!addressForm.latitude || !addressForm.longitude) {
      showAlert({ type: 'warning', title: 'Location missing', message: 'Please select a location first.' });
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        label:
          addressForm.label === "home"
            ? "Home"
            : addressForm.label === "work"
              ? "Office"
              : "Other",
        addressLine1: `${addressForm.houseFloor.trim()}${addressForm.buildingBlock.trim() ? `, ${addressForm.buildingBlock.trim()}` : ""}`,
        ...(addressForm.buildingBlock.trim() && {
          addressLine2: addressForm.buildingBlock.trim(),
        }),
        landmark: addressForm.landmarkArea.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        // country: "India",
        pincode: addressForm.pincode.trim(),
        latitude: Number(addressForm.latitude),
        longitude: Number(addressForm.longitude),
        // addressType: "DELIVERY",
      };

      if (addressForm.contactName.trim()) payload.contactName = addressForm.contactName.trim();
      if (addressForm.contactPhone.trim()) payload.contactPhone = addressForm.contactPhone.trim();

      if (isEditing) {
        await updateAddressApi(editId, payload);
        router.push("/(customer)/(tabs)/home")
      } else {
        await saveAddressApi(payload);
        router.push("/(customer)/(tabs)/home")
      }

      await refreshAddresses();
      showAlert({
        type: 'success',
        title: isEditing ? 'Address updated!' : 'Address saved!',
        primaryLabel: 'Go Home',
        onPrimary: () => router.replace("/(customer)/(tabs)/home"),
        duration: 4000,
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Failed to save address";
      showAlert({ type: 'error', title: 'Could not save address', message });
    } finally {
      setLoading(false);
    }
  };

  const renderLabelIcon = (label: string, active: boolean) => {
    if (label === "home") return <Home size={16} color={active ? "#031612" : C.text} />;
    if (label === "work") return <Briefcase size={16} color={active ? "#031612" : C.text} />;
    return <MapPin size={16} color={active ? "#031612" : C.text} />;
  };

  return (
   <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? "Edit Address Details" : "Add Address Details"}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.mapCard}>
          <View style={styles.mapPreviewWrap}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.mapPreview}
              pointerEvents="none"
              initialRegion={{
                latitude: Number(addressForm.latitude),
                longitude: Number(addressForm.longitude),
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
              }}
              region={{
                latitude: Number(addressForm.latitude),
                longitude: Number(addressForm.longitude),
                latitudeDelta: 0.008,
                longitudeDelta: 0.008,
              }}
            >
              <Marker
                coordinate={{
                  latitude: Number(addressForm.latitude),
                  longitude: Number(addressForm.longitude),
                }}
                pinColor={C.pink}
              />
            </MapView>
          </View>

          <View style={styles.mapMetaRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.areaTitle}>{areaName || "Selected Location"}</Text>
              <Text style={styles.areaSub}>{areaSubName || "Confirm your exact drop location"}</Text>
            </View>

            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() =>
                router.push({
                  pathname: "/select-address-location",
                  params: {
                    latitude: addressForm.latitude,
                    longitude: addressForm.longitude,
                  },
                })
              }
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Address</Text>

          <FieldLabel text="House No. & Floor *" />
          <Input
            value={addressForm.houseFloor}
            onChangeText={(t: string) => setAddressForm((p) => ({ ...p, houseFloor: t }))}
            placeholder="Enter house number and floor"
          />

          <FieldLabel text="Building & Block No. (Optional)" />
          <Input
            value={addressForm.buildingBlock}
            onChangeText={(t: string) => setAddressForm((p) => ({ ...p, buildingBlock: t }))}
            placeholder="Tower / Block details"
          />

          <FieldLabel text="Landmark & Area Name (Optional)" />
          <Input
            value={addressForm.landmarkArea}
            onChangeText={(t: string) => setAddressForm((p) => ({ ...p, landmarkArea: t }))}
            placeholder="Nearby landmark"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receiver Details</Text>

          <FieldLabel text="Receiver Name (Optional)" />
          <Input
            value={addressForm.contactName}
            onChangeText={(t: string) => setAddressForm((p) => ({ ...p, contactName: t }))}
            placeholder="Name"
          />

          <FieldLabel text="Receiver Phone (Optional)" />
          <Input
            value={addressForm.contactPhone}
            onChangeText={(t: string) => setAddressForm((p) => ({ ...p, contactPhone: t }))}
            placeholder="10-digit phone"
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Save As</Text>
          <View style={styles.labelRow}>
            {[
              { key: "home", text: "Home" },
              { key: "work", text: "Work" },
              { key: "other", text: "Other" },
            ].map((item) => {
              const active = addressForm.label === item.key;

              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.labelChip, active && styles.labelChipActive]}
                  onPress={() => setAddressForm((p) => ({ ...p, label: item.key }))}
                >
                  {renderLabelIcon(item.key, active)}
                  <Text style={[styles.labelChipText, active && styles.labelChipTextActive]}>{item.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {isAutoFilling && (
          <View style={styles.autoFillRow}>
            <ActivityIndicator size="small" color={C.pink} />
            <Text style={styles.autoFillText}>Updating address from selected map location...</Text>
          </View>
        )}

        <View style={{ height: 90 + insets.bottom }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(0, insets.bottom) }]}>
        <TouchableOpacity
          style={[styles.saveBtn, !saveEnabled && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!saveEnabled}
        >
          {loading ? (
            <ActivityIndicator color="#031612" />
          ) : (
            <Text style={[styles.saveText, !saveEnabled && styles.saveTextDisabled]}>SAVE ADDRESS</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function Input(props: any) {
  return <TextInput {...props} style={[styles.input, props.style]} placeholderTextColor="#9CA3AF" />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 2 : 8,
    paddingBottom: 12,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 36 / 2,
    color: C.text,
    fontWeight: "800",
  },
  scroll: {
    padding: 14,
    gap: 10,
  },
  mapCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  mapPreviewWrap: {
    height: 220,
  },
  mapPreview: {
    flex: 1,
  },
  mapMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 10,
  },
  areaTitle: {
    color: C.text,
    fontSize: 36 / 2,
    fontWeight: "800",
  },
  areaSub: {
    marginTop: 4,
    color: C.subText,
    fontSize: 32 / 2,
    lineHeight: 20,
    fontWeight: "500",
  },
  changeBtn: {
    borderWidth: 1.5,
    borderColor: "#111111",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  changeBtnText: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
  },
  section: {
    marginTop: 2,
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 42 / 2,
    fontWeight: "800",
    marginBottom: 12,
  },
  fieldLabel: {
    color: C.subText,
    fontSize: 34 / 2,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    height: 56,
    borderRadius: 12,
    backgroundColor: "#0F2823",
    borderWidth: 1,
    borderColor: C.borderStrong,
    color: C.text,
    fontSize: 16,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  labelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: "#0F2823",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
  },
  labelChipActive: {
    backgroundColor: C.pink,
    borderColor: C.pink,
  },
  labelChipText: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
  },
  labelChipTextActive: {
    color: "#031612",
  },
  autoFillRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  autoFillText: {
    color: C.subText,
    fontSize: 13,
    fontWeight: "500",
  },
  footer: {
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveBtn: {
    height:45,
    borderRadius: 10,
    backgroundColor: C.pink,
    alignItems: "center",
    justifyContent: "center",
        alignSelf: "center",
    paddingHorizontal: 16,
  }, 
  saveBtnDisabled: {
    backgroundColor: C.disabled,
  },
  saveText: {
    color: "#031612",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  saveTextDisabled: {
    color: C.disabledText,
  },
});
