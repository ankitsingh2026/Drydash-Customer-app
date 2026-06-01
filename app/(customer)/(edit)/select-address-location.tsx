import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { showAlert } from "@/components/Customalert";

const C = {
  bg: "#031612",
  text: "#E6FFF7",
  subText: "#8FB3A8",
  border: "#1A3330",
  pink: "#00E1A2",
  darkBubble: "#0F172A",
};

const INITIAL_REGION: Region = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function SelectAddressLocationScreen() {
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<Region>({
    ...INITIAL_REGION,
    latitude: Number(params.latitude) || INITIAL_REGION.latitude,
    longitude: Number(params.longitude) || INITIAL_REGION.longitude,
  });
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [locationSubName, setLocationSubName] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  useEffect(() => {
    resolveAddress(region.latitude, region.longitude);
  }, [region.latitude, region.longitude]);

  useEffect(() => {
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

  const fullAddressLabel = useMemo(() => {
    return [locationName, locationSubName].filter(Boolean).join(", ");
  }, [locationName, locationSubName]);

  const fetchCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

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

  const resolveAddress = async (latitude: number, longitude: number) => {
    try {
      setLoadingAddress(true);
      const result = await Location.reverseGeocodeAsync({ latitude, longitude });
      const g = result?.[0];
      setLocationName(g?.district || g?.subregion || g?.city || "Selected location");
      setLocationSubName([g?.city || g?.region, g?.postalCode].filter(Boolean).join(", "));
    } catch (error) {
      console.error("reverse geocode error", error);
      setLocationName("Selected location");
      setLocationSubName("");
    } finally {
      setLoadingAddress(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      return;
    }

    try {
      setSearching(true);
      const geo = await Location.geocodeAsync(query.trim());
      if (!geo?.length) {
        showAlert({ type: 'warning', title: 'Location not found', message: 'Try another search term.' });
        return;
      }

      const next: Region = {
        ...region,
        latitude: geo[0].latitude,
        longitude: geo[0].longitude,
      };

      setRegion(next);
      mapRef.current?.animateToRegion(next, 450);
      setQuery("");
    } catch (error) {
      console.error("geocode error", error);
      showAlert({ type: 'error', title: 'Search failed', message: 'Please try again.' });

    } finally {
      setSearching(false);
    }
  };

  const handleConfirmLocation = () => {
    router.push({
      pathname: "/edit-address",
      params: {
        latitude: String(region.latitude),
        longitude: String(region.longitude),
        areaName: locationName,
        areaSubName: locationSubName,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Location</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={22} color={C.subText} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search for apartment, street name..."
            placeholderTextColor="#7BA79A"
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searching ? (
            <ActivityIndicator size="small" color={C.pink} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { setQuery(""); setSuggestions([]); setShowSuggestions(false); }}>
                  <Ionicons name="close-circle" size={20} color={C.subText} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleSearch}>
                <Text style={styles.goText}>Go</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.place_id}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => {
                    setShowSuggestions(false);
                    setQuery("");
                    fetchCurrentLocation();
                  }}
                >
                  <View style={{ alignItems: "center", marginRight: 12, width: 40 }}>
                    <Ionicons name="locate" size={22} color={C.pink} />
                  </View>
                  <Text style={[styles.suggestionMainText, { color: C.pink }]}>Use current location</Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item.place_id, item.description)}
                >
                  <View style={{ alignItems: "center", marginRight: 12, width: 40 }}>
                    <Ionicons name="location-outline" size={22} color={C.subText} />
                    {item.distance_meters ? (
                      <Text style={{ color: C.subText, fontSize: 10, marginTop: 4, fontWeight: "500" }}>
                        {item.distance_meters >= 1000
                          ? `${(item.distance_meters / 1000).toFixed(1)} km`
                          : `${item.distance_meters} m`}
                      </Text>
                    ) : null}
                  </View>
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
      </View>

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

        <View pointerEvents="none" style={styles.pinOverlay}>
          <Ionicons name="location" size={48} color={C.pink} />
        </View>

        <View style={styles.bubble}>
          {/* <Text style={styles.bubbleTitle}>Order will be delivered here</Text> */}
          <Text style={styles.bubbleSub}>Place the pin to your exact location</Text>
        </View>
      </View>

      <View style={styles.bottomCard}>
        {loadingAddress ? (
          <View style={styles.locationRowLoading}>
            <ActivityIndicator size="small" color={C.pink} />
            <Text style={styles.bottomSubTitle}>Detecting area...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.bottomTitle}>{locationName || "Selected location"}</Text>
            <Text style={styles.bottomSubTitle}>{locationSubName || "Confirm this location"}</Text>
          </>
        )}

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmLocation}>
          <Text style={styles.confirmText}>Confirm Location</Text>
        </TouchableOpacity>

        {Platform.OS === "android" && <View style={{ height: 8 }} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    // borderRadius: 19,
    // borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    // backgroundColor: "#0D1F1C",
  },
  headerTitle: {
    marginLeft: 14,
    fontSize: 32 / 2,
    fontWeight: "800",
    color: C.text,
  },
  searchContainer: {
    zIndex: 10,
    marginHorizontal: 12,
    marginTop: 14,
  },
  searchWrap: {
    backgroundColor: "#0D1F1C",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    minHeight: 48,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    fontWeight: "500",
  },
  goText: {
    color: C.pink,
    fontSize: 15,
    fontWeight: "700",
  },
  suggestionsContainer: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    backgroundColor: "#0D1F1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    maxHeight: 450,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1A3330",
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
  mapContainer: {
    flex: 1,
    marginTop: 12,
  },
  map: {
    flex: 1,
  },
  pinOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -24,
    marginTop: -48,
  },
  bubble: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    backgroundColor: "#071E2B",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  bubbleSub: {
    marginTop: 2,
    color: "#9FC0CF",
    fontSize: 13,
    fontWeight: "500",
  },
  bottomCard: {
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: "#0B1E1A",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  locationRowLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 50,
  },
  bottomTitle: {
    color: C.text,
    fontSize: 34 / 2,
    fontWeight: "700",
  },
  bottomSubTitle: {
    marginTop: 4,
    color: C.subText,
    fontSize: 28 / 2,
    fontWeight: "500",
  },
  confirmBtn: {
    marginTop: 10,
    height: 45,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.pink,
    alignSelf: "center",
    paddingHorizontal: 16
  },
  confirmText: {
    color: "#031612",
    fontSize: 16,
    fontWeight: "600",
  },
});