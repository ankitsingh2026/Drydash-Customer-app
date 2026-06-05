import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { Briefcase, Building2, Home, MapPin, Pencil } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAddress } from "@/context/AddressContext";
import { saveAddressApi, updateAddressApi } from "@/features/orders/orders.api";
import { showAlert } from "@/components/Customalert";

const C = {
  bg: "#031612",
  card: "#071613",
  white: "#0B1E1A",
  text: "#E6FFF7",
  subText: "#8FB3A8",
  border: "#163028",
  borderStrong: "#1F3E38",
  pink: "#22EBAB",
  disabled: "#27443C",
  disabledText: "#6A9387",
  inputBg: "#0B1C18",
};

const INITIAL_REGION: Region = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function EditAddress() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const editId = (params._id as string) || (params.id as string) || "";
  const isEditing = Boolean(editId);

  const [loading, setLoading] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const preventFetchRef = useRef(false);

  // Map state
  const [region, setRegion] = useState<Region>({
    ...INITIAL_REGION,
    latitude: Number(params.latitude) || INITIAL_REGION.latitude,
    longitude: Number(params.longitude) || INITIAL_REGION.longitude,
  });

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    latitude: String(Number(params.latitude) || INITIAL_REGION.latitude),
    longitude: String(Number(params.longitude) || INITIAL_REGION.longitude),
  });

  const [areaName, setAreaName] = useState((params.areaName as string) || "Selected Location");
  const [areaSubName, setAreaSubName] = useState((params.areaSubName as string) || "");
  const [locationEnabled, setLocationEnabled] = useState(false);

  const { refreshAddresses } = useAddress();

  const saveEnabled = useMemo(() => {
    return Boolean(addressForm.houseFloor.trim()) && !loading && !isAutoFilling;
  }, [addressForm.houseFloor, loading, isAutoFilling]);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (!isEditing && !params.latitude) {
      fetchCurrentLocation();
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      autoFillAddressFromCoords({ latitude: region.latitude, longitude: region.longitude });
    }, 500);
    return () => clearTimeout(timer);
  }, [region.latitude, region.longitude]);

  useEffect(() => {
    if (preventFetchRef.current) {
      preventFetchRef.current = false;
      return;
    }

    if (query.length > 2) {
      const delayDebounceFn = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationEnabled(status === "granted");
  };

  const handleRequestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      setLocationEnabled(true);
      fetchCurrentLocation();
    }
  };

  const fetchSuggestions = async (text: string) => {
    try {
      const API_KEY = "AIzaSyAT-o42Ycc63KWHxbIiGX2KgluW4BpdaYM";
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&components=country:in&location=${region.latitude},${region.longitude}&origin=${region.latitude},${region.longitude}&radius=50000&key=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK") {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("fetchSuggestions error", error);
    }
  };

  const handleSelectSuggestion = async (placeId: string, description: string) => {
    try {
      setSearching(true);
      preventFetchRef.current = true;
      setQuery(description);
      setShowSuggestions(false);
      const API_KEY = "AIzaSyAT-o42Ycc63KWHxbIiGX2KgluW4BpdaYM";
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK") {
        const location = data.result.geometry.location;
        const next: Region = {
          ...region,
          latitude: location.lat,
          longitude: location.lng,
        };
        setRegion(next);
        mapRef.current?.animateToRegion(next, 450);
      }
    } catch (error) {
      console.error("place details error", error);
    } finally {
      setSearching(false);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationEnabled(false);
        return;
      }
      setLocationEnabled(true);

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const next: Region = {
        ...region,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setRegion(next);
      mapRef.current?.animateToRegion(next, 450);
    } catch (error) {
      console.error("current location error", error);
    }
  };

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

      setAreaName(g?.district || g?.subregion || g?.city || g?.name || "Selected Location");
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
      showAlert({ type: 'warning', title: 'Missing details', message: 'Please enter Address Details.' });
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
        pincode: addressForm.pincode.trim(),
        latitude: Number(addressForm.latitude),
        longitude: Number(addressForm.longitude),
      };

      if (addressForm.contactName.trim()) payload.contactName = addressForm.contactName.trim();
      if (addressForm.contactPhone.trim()) payload.contactPhone = addressForm.contactPhone.trim();

      if (isEditing) {
        await updateAddressApi(editId, payload);
        router.back();
      } else {
        await saveAddressApi(payload);
        router.back();
      }

      await refreshAddresses();
      showAlert({
        type: 'success',
        title: isEditing ? 'Address updated!' : 'Address saved!',
        primaryLabel: 'Go Back',
        onPrimary: () => router.back(),
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
    if (label === "home") return <Home size={16} color={active ? C.pink : C.text} />;
    if (label === "work") return <Briefcase size={16} color={active ? C.pink : C.text} />;
    return <MapPin size={16} color={active ? C.pink : C.text} />;
  };

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={(nextRegion) => setRegion(nextRegion)}
          showsUserLocation
          showsMyLocationButton={false}
        />
        
        {/* Top Search Overlay */}
        <View style={[styles.headerOverlay, { paddingTop: Math.max(insets.top, 16) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={C.text} />
          </TouchableOpacity>
          
          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={20} color={C.subText} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search for area, street name..."
              placeholderTextColor="#7BA79A"
            />
            {searching && <ActivityIndicator size="small" color={C.pink} />}
            {query.length > 0 && !searching && (
              <TouchableOpacity onPress={() => { setQuery(""); setSuggestions([]); setShowSuggestions(false); }}>
                <Ionicons name="close-circle" size={20} color={C.subText} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={[styles.suggestionsContainer, { top: Math.max(insets.top, 16) + 60 }]}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item.place_id, item.description)}
                >
                  <Ionicons name="location-outline" size={22} color={C.subText} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionMainText} numberOfLines={1}>
                      {item.structured_formatting?.main_text || item.description}
                    </Text>
                    {item.structured_formatting?.secondary_text ? (
                      <Text style={styles.suggestionSubText} numberOfLines={2}>
                        {item.structured_formatting.secondary_text}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <View pointerEvents="none" style={styles.pinOverlay}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Move pin to your exact pickup location</Text>
            <View style={styles.bubbleArrow} />
          </View>
          <Ionicons name="location" size={48} color={C.pink} style={styles.pinIcon} />
        </View>

        <TouchableOpacity style={styles.currentLocBtn} onPress={fetchCurrentLocation}>
          <Ionicons name="locate" size={20} color={C.pink} />
          <Text style={styles.currentLocText}>Use current location</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet Section */}
      <View style={styles.bottomSheet}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Selected Location Card */}
          <TouchableOpacity style={styles.locationCard}>
            <View style={styles.locIconWrap}>
              <Ionicons name="location" size={20} color={C.pink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.areaTitle}>{areaName || "Selected Location"}</Text>
              <Text style={styles.areaSub} numberOfLines={2}>
                {areaSubName || "Confirm your exact drop location"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.subText} />
          </TouchableOpacity>

          {!locationEnabled && (
            <TouchableOpacity style={styles.permissionBox} onPress={handleRequestPermission}>
              <Text style={styles.permissionTitle}>Enable location access for better accuracy</Text>
              <Text style={styles.permissionAction}>Allow location access <Ionicons name="arrow-forward" size={14} /></Text>
            </TouchableOpacity>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADDRESS DETAILS*</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.customInput}
                value={addressForm.houseFloor}
                onChangeText={(t: string) => setAddressForm((p) => ({ ...p, houseFloor: t }))}
                placeholder="Floor, House No., Apartment, Landmark"
                placeholderTextColor="#6A9387"
              />
              <Building2 size={20} color={C.pink} style={{ marginRight: 12 }} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECEIVER DETAILS</Text>
            <View style={styles.receiverCard}>
              <View style={styles.receiverIconWrap}>
                <Ionicons name="call" size={18} color={C.text} />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.receiverInputName}
                  value={addressForm.contactName}
                  onChangeText={(t: string) => setAddressForm((p) => ({ ...p, contactName: t }))}
                  placeholder="Name"
                  placeholderTextColor="#6A9387"
                />
                <TextInput
                  style={styles.receiverInputPhone}
                  value={addressForm.contactPhone}
                  onChangeText={(t: string) => setAddressForm((p) => ({ ...p, contactPhone: t }))}
                  placeholder="Phone Number"
                  placeholderTextColor="#6A9387"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              <Pencil size={18} color={C.subText} style={{ alignSelf: "flex-start", marginTop: 4 }} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SAVE ADDRESS AS</Text>
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DOOR/BUILDING IMAGE (OPTIONAL)</Text>
            <TouchableOpacity style={styles.imageBox}>
              <Ionicons name="camera-outline" size={24} color={C.pink} />
              <Text style={styles.imageBoxText}>Add an image</Text>
              <Text style={styles.imageBoxSub}>This helps our delivery partners find your exact location faster</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 90 + insets.bottom }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <TouchableOpacity
            style={[styles.saveBtn, !saveEnabled && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!saveEnabled}
          >
            {loading ? (
              <ActivityIndicator color="#031612" />
            ) : (
              <Text style={[styles.saveText, !saveEnabled && styles.saveTextDisabled]}>Save address <Ionicons name="checkmark-circle-outline" size={20} /></Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    // backgroundColor: C.bg,
  },
  mapContainer: {
    flex: 0.45,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(3, 22, 18, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  searchWrap: {
    flex: 1,
    height: 48,
    backgroundColor: "rgba(3, 22, 18, 0.8)",
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: C.borderStrong,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 15,
  },
  suggestionsContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    maxHeight: 250,
    zIndex: 10,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  suggestionMainText: {
    color: C.text,
    fontSize: 15,
    fontWeight: "500",
  },
  suggestionSubText: {
    color: C.subText,
    fontSize: 13,
    marginTop: 2,
  },
  pinOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    alignItems: "center",
    transform: [{ translateX: -100 }, { translateY: -100 }], // Adjust based on pin and bubble size
    width: 200,
  },
  bubble: {
    backgroundColor: "rgba(10, 78, 63, 0.9)",
    paddingHorizontal: 6,
    paddingTop: 5,
    borderRadius: 8,
    alignItems: "center",
  },
  bubbleText: {
    color: C.pink,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  bubbleArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "rgba(3, 22, 18, 0.9)",
    marginTop: 0,
  },
  pinIcon: {
    marginTop: -8, // slight overlap with bubble arrow
  },
  currentLocBtn: {
    position: "absolute",
    bottom: 26,
    alignSelf: "center",
    backgroundColor: "rgba(3, 22, 18, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: C.borderStrong,
  },
  currentLocText: {
    color: C.pink,
    fontWeight: "700",
    fontSize: 14,
  },
  bottomSheet: {
    flex: 0.55,
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20, // Overlap map slightly
    paddingTop: 8,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderStrong,
    marginTop: 12,
    marginBottom: 16,
    gap: 12,
  },
  locIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 225, 162, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  areaTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
  },
  areaSub: {
    color: C.subText,
    fontSize: 13,
    marginTop: 2,
  },
  permissionBox: {
    backgroundColor: "rgba(0, 225, 162, 0.05)",
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  permissionTitle: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  permissionAction: {
    color: C.pink,
    fontSize: 13,
    fontWeight: "700",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: C.subText,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 12,
  },
  customInput: {
    flex: 1,
    height: 52,
    color: C.text,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  receiverCard: {
    flexDirection: "row",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  receiverIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  receiverInputName: {
    color: C.text,
    fontSize: 16,
    fontWeight: "600",
    padding: 0,
    marginBottom: 4,
  },
  receiverInputPhone: {
    color: C.subText,
    fontSize: 14,
    padding: 0,
  },
  labelRow: {
    flexDirection: "row",
    gap: 12,
  },
  labelChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  labelChipActive: {
    borderColor: C.pink,
  },
  labelChipText: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
  },
  labelChipTextActive: {
    color: C.pink,
  },
  imageBox: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  imageBoxText: {
    color: C.pink,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  imageBoxSub: {
    color: C.subText,
    fontSize: 12,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: C.pink,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnDisabled: {
    backgroundColor: C.disabled,
  },
  saveText: {
    color: "#031612",
    fontSize: 16,
    fontWeight: "700",
  },
  saveTextDisabled: {
    color: C.disabledText,
  },
});
