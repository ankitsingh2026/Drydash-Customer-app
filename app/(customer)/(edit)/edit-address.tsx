import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { Briefcase, Building2, Home, MapPin, Phone, User } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAddress } from "@/context/AddressContext";
import { useTheme } from "@/context/ThemeContext";
import { saveAddressApi, updateAddressApi } from "@/features/orders/orders.api";
import { showAlert } from "@/components/Customalert";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
const MAP_HEIGHT = Math.max(280, Math.min(360, Math.round(WINDOW_HEIGHT * 0.38)));

const INITIAL_REGION: Region = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function EditAddress() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const editId = (params._id as string) || (params.id as string) || "";
  const isEditing = Boolean(editId);

  const [loading, setLoading] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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

  const scrollToInput = (yOffset: number) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: yOffset, animated: true });
    }, 150);
  };

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
      const API_KEY = "AIzaSyDGSQ0H6zb3kLpfWQgQEDWJUZdWvNyWDFY";
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
      const API_KEY = "AIzaSyDGSQ0H6zb3kLpfWQgQEDWJUZdWvNyWDFY";
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
        city: newCity,
        state: newState,
        pincode: newPin,
        landmarkArea: subregion,
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
    if (label === "home") return <Home size={16} color={active ? theme.primary : theme.text} />;
    if (label === "work") return <Briefcase size={16} color={active ? theme.primary : theme.text} />;
    return <MapPin size={16} color={active ? theme.primary : theme.text} />;
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            <View style={[styles.headerOverlay, { paddingTop: 12 }]}>
              <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
                <Ionicons name="arrow-back" size={24} color={theme.text} />
              </TouchableOpacity>

              <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search area, street name..."
                  placeholderTextColor={theme.textSecondary}
                  onFocus={() => scrollToInput(0)}
                />
                {searching && <ActivityIndicator size="small" color={theme.primary} />}
                {query.length > 0 && !searching && (
                  <TouchableOpacity onPress={() => { setQuery(""); setSuggestions([]); setShowSuggestions(false); }}>
                    <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
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
                      <Ionicons name="location-outline" size={22} color={theme.textSecondary} style={{ marginRight: 12 }} />
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
                <Text style={styles.bubbleText}>Move pin to exact location</Text>
                <View style={styles.bubbleArrow} />
              </View>
              <Ionicons name="location" size={44} color={theme.primary} style={styles.pinIcon} />
            </View>

            <TouchableOpacity style={styles.currentLocBtn} onPress={fetchCurrentLocation} activeOpacity={0.85}>
              <Ionicons name="locate" size={18} color={theme.primary} />
              <Text style={styles.currentLocText}>Use current location</Text>
            </TouchableOpacity>
          </View>

          {/* Form Bottom Sheet Section */}
          <View style={styles.bottomSheet}>
            {/* Selected Location Card */}
            <TouchableOpacity style={styles.locationCard} activeOpacity={0.9}>
              <View style={styles.locIconWrap}>
                <Ionicons name="location" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.areaTitle}>{areaName || "Selected Location"}</Text>
                <Text style={styles.areaSub} numberOfLines={2}>
                  {areaSubName || "Confirm your exact location"}
                </Text>
              </View>
            </TouchableOpacity>

            {!locationEnabled && (
              <TouchableOpacity style={styles.permissionBox} onPress={handleRequestPermission} activeOpacity={0.85}>
                <Text style={styles.permissionTitle}>Enable location access for better accuracy</Text>
                <Text style={styles.permissionAction}>Allow location access <Ionicons name="arrow-forward" size={14} /></Text>
              </TouchableOpacity>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>ADDRESS DETAILS*</Text>
                {/* <Text style={styles.requiredBadge}>*Required</Text> */}
              </View>
              <View
                style={[
                  styles.inputBox,
                  focusedField === "houseFloor" && styles.inputBoxFocused,
                ]}
              >
                <View style={styles.inputIconWrap}>
                  <Building2
                    size={18}
                    color={
                      focusedField === "houseFloor"
                        ? theme.primary
                        : theme.textSecondary
                    }
                  />
                </View>
                <TextInput
                  style={styles.inputField}
                  value={addressForm.houseFloor}
                  onChangeText={(t: string) =>
                    setAddressForm((p) => ({ ...p, houseFloor: t }))
                  }
                  placeholder="Floor, House No., Apartment"
                  placeholderTextColor={theme.textSecondary}
                  onFocus={() => {
                    setFocusedField("houseFloor");
                    scrollToInput(MAP_HEIGHT - 30);
                  }}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>RECEIVER DETAILS</Text>
              <View style={styles.inputsGroup}>
                {/* Receiver Name Input */}
                <View
                  style={[
                    styles.inputBox,
                    focusedField === "contactName" && styles.inputBoxFocused,
                  ]}
                >
                  <View style={styles.inputIconWrap}>
                    <User
                      size={18}
                      color={
                        focusedField === "contactName"
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                  </View>
                  <TextInput
                    style={styles.inputField}
                    value={addressForm.contactName}
                    onChangeText={(t: string) =>
                      setAddressForm((p) => ({ ...p, contactName: t }))
                    }
                    placeholder="Receiver's Name"
                    placeholderTextColor={theme.textSecondary}
                    onFocus={() => {
                      setFocusedField("contactName");
                      scrollToInput(MAP_HEIGHT + 70);
                    }}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>

                {/* Receiver Phone Input */}
                <View
                  style={[
                    styles.inputBox,
                    focusedField === "contactPhone" && styles.inputBoxFocused,
                  ]}
                >
                  <View style={styles.inputIconWrap}>
                    <Phone
                      size={18}
                      color={
                        focusedField === "contactPhone"
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                  </View>
                  <TextInput
                    style={styles.inputField}
                    value={addressForm.contactPhone}
                    onChangeText={(t: string) =>
                      setAddressForm((p) => ({ ...p, contactPhone: t }))
                    }
                    placeholder="Receiver's Phone Number"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                    maxLength={10}
                    onFocus={() => {
                      setFocusedField("contactPhone");
                      scrollToInput(MAP_HEIGHT + 140);
                    }}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
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
                      activeOpacity={0.8}
                    >
                      {renderLabelIcon(item.key, active)}
                      <Text style={[styles.labelChipText, active && styles.labelChipTextActive]}>{item.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 260 + insets.bottom }} />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <TouchableOpacity
            style={[styles.saveBtn, !saveEnabled && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!saveEnabled}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <Text style={[styles.saveText, !saveEnabled && styles.saveTextDisabled]}>Save address <Ionicons name="checkmark-circle-outline" size={20} /></Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (theme: any) => {
  const C = {
    bg: theme.background,
    card: theme.card,
    white: theme.card,
    text: theme.text,
    subText: theme.textSecondary,
    border: theme.border,
    borderStrong: theme.border,
    pink: theme.primary,
    disabled: theme.isDark ? theme.border : "#E0EDEA",
    disabledText: theme.textSecondary,
    inputBg: theme.inputBackground,
  };
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    mapContainer: {
      height: MAP_HEIGHT,
      width: "100%",
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
      backgroundColor: theme.card,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
    },
    searchWrap: {
      flex: 1,
      height: 46,
      backgroundColor: theme.card,
      borderRadius: 23,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      gap: 10,
      borderWidth: 1,
      borderColor: C.borderStrong,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      fontWeight: "500",
    },
    suggestionsContainer: {
      position: "absolute",
      top: 64,
      left: 16,
      right: 16,
      backgroundColor: C.white,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      maxHeight: 220,
      zIndex: 50,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    suggestionItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
    },
    suggestionMainText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
    },
    suggestionSubText: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    pinOverlay: {
      position: "absolute",
      top: "50%",
      left: "50%",
      alignItems: "center",
      transform: [{ translateX: -100 }, { translateY: -64 }],
      width: 200,
      zIndex: 5,
    },
    bubble: {
      backgroundColor: theme.card,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 16,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: C.border,
    },
    bubbleText: {
      color: theme.primary,
      fontSize: 11,
      fontWeight: "700",
      textAlign: "center",
    },
    bubbleArrow: {
      width: 0,
      height: 0,
      borderLeftWidth: 6,
      borderRightWidth: 6,
      borderTopWidth: 6,
      borderStyle: "solid",
      backgroundColor: "transparent",
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: theme.card,
      alignSelf: "center",
      marginTop: -1,
    },
    pinIcon: {
      marginTop: -2,
    },
    currentLocBtn: {
      position: "absolute",
      bottom: 28,
      alignSelf: "center",
      backgroundColor: theme.card,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: 1,
      borderColor: C.borderStrong,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 4,
      zIndex: 6,
    },
    currentLocText: {
      color: theme.primary,
      fontWeight: "700",
      fontSize: 13,
    },
    bottomSheet: {
      flex: 1,
      backgroundColor: theme.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      marginTop: -18,
      paddingTop: 16,
      paddingHorizontal: 16,
    },
    locationCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.borderStrong,
      marginBottom: 16,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    locIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    areaTitle: {
      color: theme.text,
      fontSize: 15,
      fontWeight: "700",
    },
    areaSub: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    permissionBox: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: C.borderStrong,
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
    },
    permissionTitle: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 4,
    },
    permissionAction: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "700",
    },
    section: {
      marginBottom: 20,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    sectionTitle: {
      color: theme.textSecondary,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
    },
    requiredBadge: {
      color: theme.primary,
      fontSize: 11,
      fontWeight: "600",
    },
    inputsGroup: {
      gap: 12,
    },
    inputBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.borderStrong,
      borderRadius: 14,
      paddingHorizontal: 14,
      height: 50,
    },
    inputBoxFocused: {
      borderColor: theme.primary,
      borderWidth: 1.5,
    },
    inputIconWrap: {
      width: 26,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    inputField: {
      flex: 1,
      height: "100%",
      color: theme.text,
      fontSize: 14,
      fontWeight: "500",
    },
    labelRow: {
      flexDirection: "row",
      gap: 12,
    },
    labelChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.borderStrong,
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    labelChipActive: {
      borderColor: theme.primary,
      backgroundColor: theme.isDark ? theme.border : "#F9F0F5",
    },
    labelChipText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "600",
    },
    labelChipTextActive: {
      color: theme.primary,
      fontWeight: "700",
    },
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.background,
      paddingHorizontal: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },
    saveBtn: {
      height: 52,
      borderRadius: 14,
      backgroundColor: theme.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    saveBtnDisabled: {
      backgroundColor: C.disabled,
      shadowOpacity: 0,
      elevation: 0,
    },
    saveText: {
      color: theme.background,
      fontSize: 15,
      fontWeight: "700",
    },
    saveTextDisabled: {
      color: theme.textSecondary,
    },
  });
};
