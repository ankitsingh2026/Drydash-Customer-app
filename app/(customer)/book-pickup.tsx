// app/screens/BookPickup.tsx
import PickupMap from "@/components/maps/PickupMap.native";
import { Address } from "@/types/order.types";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";

import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const TIME_SLOTS = [
  "9:00 – 12:00 AM",
  "1:00 – 4:00 PM",
  "5:00 – 8:00 PM",
  "9:00 – 12:00 PM",
];

const SAMPLE_ADDRESSES: Address[] = [
  {
    id: "home",
    label: "Home",
    flat: "Flat 12B",
    line1: "123 Green Street",
    street: "123 Green Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  } as Address,
  {
    id: "office",
    label: "Office",
    flat: "Office 502",
    line1: "Tower A, Business Park",
    street: "Tower A, Business Park",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400002",
  } as Address,
];

const SERVICE_TYPES = ["Shoe Spa", "Laundry", "Dry Clean"];

export default function BookPickup() {
  const { theme, isDark } = useTheme();
  const [note, setNote] = useState("");
  const [locLoading, setLocLoading] = useState(false);

  // DELIVERY MODE
  const [deliveryMode, setDeliveryMode] = useState<"same" | "other">("same");
  const [addressType, setAddressType] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [pickupType, setPickupType] = useState<"today" | "schedule">("today");

  // DATE
  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // TIME
  const [slot, setSlot] = useState<number>(-1);

  // ADDRESSES (pickup)
  const [addresses, setAddresses] = useState<Address[]>(SAMPLE_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    SAMPLE_ADDRESSES[0].id,
  );

  const [deliveryAddresses, setDeliveryAddresses] =
    useState<Address[]>(SAMPLE_ADDRESSES);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] =
    useState<string>(SAMPLE_ADDRESSES[0].id);

  // SERVICE TYPE
  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[1]);

  // ADD ADDRESS MODAL
  const [mapQuery, setMapQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    houseNo: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    isActive: true,
  });

  const [location, setLocation] = useState({
    latitude: 19.076,
    longitude: 72.8777,
  });

  // helper: display "Today" when date is today
  const isToday = (d: Date) => {
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };
  const formatDateLabel = (d: Date) =>
    isToday(d) ? "Today" : d.toDateString();

  const confirmPickup = () => {
    const pickupAddr = addresses.find((a) => a.id === selectedAddressId);
    const deliveryAddr =
      deliveryMode === "same"
        ? pickupAddr
        : deliveryAddresses.find((a) => a.id === selectedDeliveryAddressId);

    const message = `Date: ${pickupType === "today" ? "Today" : formatDateLabel(date)}
Time: ${pickupType === "today" ? "Next available slot" : TIME_SLOTS[slot]}
Service: ${serviceType}

Pickup: ${pickupAddr ? `${pickupAddr.flat}, ${pickupAddr.city}` : selectedAddressId}
Delivery: ${deliveryAddr ? `${deliveryAddr.flat}, ${deliveryAddr.city}` : selectedDeliveryAddressId}`;

    Alert.alert("Booking Confirmed", message);
    router.back();
  };

  useEffect(() => {
    if (pickupType === "today") {
      setDate(new Date());
      setSlot(-1);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow);
      setSlot(-1);
    }
  }, [pickupType]);

  const fetchCurrentLocation = async () => {
    try {
      setLocLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocLoading(false);
        Alert.alert(
          "Permission denied",
          "Please allow location access from settings."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setLocation(coords);

      const geo = await Location.reverseGeocodeAsync(coords);

      if (geo && geo.length > 0) {
        const g = geo[0];
        setAddressForm((p) => ({
          ...p,
          houseNo:  "",
          street: g.streetNumber || g.name || "",
          landmark: g.district || "",
          city: g.city || g.subregion || "",
          state: g.region || "",
          pincode: g.postalCode || "",
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
        }));


      }
    } catch (e: any) {
      console.error("Location error:", e);
      Alert.alert(
        "Location error",
        e?.message || "Unable to fetch current location"
      );
    } finally {
      setLocLoading(false);
    }
  };
  const searchOnMap = async () => {
    if (!mapQuery.trim()) return;

    try {
      setSearchLoading(true);

      const results = await Location.geocodeAsync(mapQuery);

      if (results && results.length > 0) {
        const coords = {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };

        setLocation(coords);

        setAddressForm((p) => ({
          ...p,
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
        }));

        const geo = await Location.reverseGeocodeAsync(coords);

        if (geo && geo.length > 0) {
          const g = geo[0];
          setAddressForm((p) => ({
            ...p,
            houseNo: g.name ?? "",
            street: g.street ?? "",
            landmark: g.district ?? "",
            city: g.city ?? "",
            state: g.region ?? "",
            pincode: g.postalCode ?? "",
            latitude: String(coords.latitude),
            longitude: String(coords.longitude),
          }));
        }
      } else {
        Alert.alert("Not found", "No location found for this search.");
      }
    } catch (e) {
      console.error("Search error:", e);
      Alert.alert("Search failed", "Unable to search this place.");
    } finally {
      setSearchLoading(false);
    }
  };


  // auto-fetch when modal opens
  useEffect(() => {
    if (addModalOpen) {
      setAddressForm({
        houseNo: "",
        street: "",
        landmark: "",
        city: "",
        state: "",
        pincode: "",
        latitude: "",
        longitude: "",
        isActive: true,
      });

      fetchCurrentLocation();
    }
  }, [addModalOpen]);

  // Save address from form into pickup or delivery list based on addressType
  const saveAddress = () => {
    const id = Date.now().toString();
    const label = addressForm.houseNo?.trim()
      ? addressForm.houseNo
      : "Other";

    const newAddress: Address = {
      id,
      label,
      flat: addressForm.houseNo, // keep UI compatibility
      line1: addressForm.street,
      street: addressForm.street,
      city: addressForm.city,
      state: addressForm.state,
      pincode: addressForm.pincode,
      latitude: Number(addressForm.latitude),
      longitude: Number(addressForm.longitude),
      isActive: addressForm.isActive,
    } as any;


    if (addressType === "pickup") {
      setAddresses((p) => [...p, newAddress]);
      setSelectedAddressId(id);
    } else {
      setDeliveryAddresses((p) => [...p, newAddress]);
      setSelectedDeliveryAddressId(id);
    }

    setAddModalOpen(false);
    setAddressForm({
      houseNo: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      latitude: "",
      longitude: "",
      isActive: true,
    });

  };

  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}
        <View style={styles.stackHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={26} color={theme.primary} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Book Pickup
          </Text>

          <View style={{ width: 20 }} />
        </View>

        {/* TITLE */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>
            Pickup Details
          </Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            Choose pickup date, time and address
          </Text>
        </View>

        {/* PICKUP TYPE */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.cardHeading, { color: theme.text }]}>
            Pickup Type
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
            <TouchableOpacity
              onPress={() => setPickupType("today")}
              style={[
                styles.pickupTypeBtn,
                {
                  flex: 1,
                  backgroundColor:
                    pickupType === "today"
                      ? theme.primary
                      : isDark
                        ? "#1A2332"
                        : "#F0F4F8",
                  borderWidth: pickupType === "today" ? 0 : 1.5,
                  borderColor: isDark ? "#2D3748" : "#E2E8F0",
                },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name="flash"
                size={20}
                color={pickupType === "today" ? "#000" : theme.primary}
              />
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 15,
                  color: pickupType === "today" ? "#000" : theme.text,
                  marginLeft: 6,
                }}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPickupType("schedule")}
              style={[
                styles.pickupTypeBtn,
                {
                  flex: 1,
                  backgroundColor:
                    pickupType === "schedule"
                      ? theme.primary
                      : isDark
                        ? "#1A2332"
                        : "#F0F4F8",
                  borderWidth: pickupType === "schedule" ? 0 : 1.5,
                  borderColor: isDark ? "#2D3748" : "#E2E8F0",
                },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar"
                size={20}
                color={pickupType === "schedule" ? "#000" : theme.primary}
              />
              <Text
                style={{
                  fontWeight: "800",
                  fontSize: 15,
                  color: pickupType === "schedule" ? "#000" : theme.text,
                  marginLeft: 6,
                }}
              >
                Schedule
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DATE PICKER */}
        {pickupType === "schedule" && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardHeading, { color: theme.text }]}>
              Pickup Date
            </Text>

            <TouchableOpacity
              style={[
                styles.dateBox,
                {
                  backgroundColor: isDark ? "#1A2332" : "#F0F4F8",
                  borderWidth: 1.5,
                  borderColor: isDark ? "#2D3748" : "#E2E8F0",
                },
              ]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={22} color={theme.primary} />
              <Text
                style={{
                  marginLeft: 12,
                  fontWeight: "800",
                  fontSize: 15,
                  color: theme.text,
                  flex: 1,
                }}
              >
                {formatDateLabel(date)}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.subText} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDate(selectedDate);
                    setSlot(-1);
                  }
                }}
              />
            )}
          </View>
        )}

        {/* TIME SLOTS */}
        {pickupType === "schedule" && (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardHeading, { color: theme.text }]}>
              Pickup Time
            </Text>

            <View style={styles.slotWrap}>
              {TIME_SLOTS.map((t, i) => {
                const active = slot === i;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setSlot(i)}
                    style={[
                      styles.slot,
                      {
                        backgroundColor: active
                          ? theme.primary
                          : isDark
                            ? "#1A2332"
                            : "#F0F4F8",
                        borderWidth: active ? 0 : 1.5,
                        borderColor: isDark ? "#2D3748" : "#E2E8F0",
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={active ? "#000" : theme.primary}
                    />
                    <Text
                      style={{
                        fontWeight: "700",
                        fontSize: 14,
                        color: active ? "#000" : theme.text,
                        marginLeft: 6,
                      }}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* PICKUP ADDRESSES */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color={theme.primary} />
            <Text style={[styles.cardHeading, { color: theme.text, marginLeft: 6, marginBottom: 0 }]}>
              Pickup Address
            </Text>
          </View>

          <ScrollView
            style={styles.addressScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {addresses.map((item) => {
              const selected = item.id === selectedAddressId;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.addressItem,
                    {
                      backgroundColor: selected
                        ? theme.primary
                        : isDark
                          ? "#1A2332"
                          : "#F8FAFC",
                      borderWidth: selected ? 0 : 1.5,
                      borderColor: isDark ? "#2D3748" : "#E2E8F0",
                    },
                  ]}
                  onPress={() => setSelectedAddressId(item.id)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.addressIconBox,
                      {
                        backgroundColor: selected
                          ? "rgba(0,0,0,0.1)"
                          : isDark
                            ? "#0F1729"
                            : "#E2E8F0",
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.label === "Home" ? "home" : "briefcase"}
                      size={18}
                      color={selected ? "#000" : theme.primary}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text
                      style={{
                        fontWeight: "800",
                        fontSize: 15,
                        color: selected ? "#000" : theme.text,
                      }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={{
                        color: selected ? "rgba(0,0,0,0.7)" : theme.subText,
                        marginTop: 4,
                        fontSize: 13,
                      }}
                    >
                      {item.flat}, {item.line1 ?? item.street}
                    </Text>
                    <Text
                      style={{
                        color: selected ? "rgba(0,0,0,0.7)" : theme.subText,
                        marginTop: 2,
                        fontSize: 13,
                      }}
                    >
                      {item.city}, {item.state} • {item.pincode}
                    </Text>
                  </View>

                  {selected && (
                    <Ionicons name="checkmark-circle" size={24} color="#000" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.addAddrBtn}
            onPress={() => {
              setAddModalOpen(true);
              setAddressType("pickup");
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="add-circle"
              size={20}
              color={theme.primary}
            />
            <Text
              style={{
                marginLeft: 8,
                color: theme.primary,
                fontWeight: "800",
                fontSize: 14,
              }}
            >
              Add new pickup address
            </Text>
          </TouchableOpacity>
        </View>

        {/* DELIVERY ADDRESS SECTION */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="navigate" size={20} color={theme.primary} />
            <Text style={[styles.cardHeading, { color: theme.text, marginLeft: 6, marginBottom: 0 }]}>
              Delivery Address
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 12, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => setDeliveryMode("same")}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor:
                  deliveryMode === "same" ? theme.primary : isDark ? "#1A2332" : "#F0F4F8",
                borderWidth: deliveryMode === "same" ? 0 : 1.5,
                borderColor: isDark ? "#2D3748" : "#E2E8F0",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="sync"
                size={18}
                color={deliveryMode === "same" ? "#000" : theme.primary}
              />
              <Text
                style={{
                  marginLeft: 6,
                  fontWeight: "800",
                  fontSize: 14,
                  color: deliveryMode === "same" ? "#000" : theme.text,
                }}
              >
                Same as Pickup
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDeliveryMode("other")}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor:
                  deliveryMode === "other" ? theme.primary : isDark ? "#1A2332" : "#F0F4F8",
                borderWidth: deliveryMode === "other" ? 0 : 1.5,
                borderColor: isDark ? "#2D3748" : "#E2E8F0",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.8}
            >
              <Ionicons
                name="location"
                size={18}
                color={deliveryMode === "other" ? "#000" : theme.primary}
              />
              <Text
                style={{
                  marginLeft: 6,
                  fontWeight: "800",
                  fontSize: 14,
                  color: deliveryMode === "other" ? "#000" : theme.text,
                }}
              >
                Different Address
              </Text>
            </TouchableOpacity>
          </View>

          {deliveryMode === "other" && (
            <>
              <ScrollView
                style={styles.addressScroll}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {deliveryAddresses.map((item) => {
                  const selected = item.id === selectedDeliveryAddressId;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.addressItem,
                        {
                          backgroundColor: selected
                            ? theme.primary
                            : isDark
                              ? "#1A2332"
                              : "#F8FAFC",
                          borderWidth: selected ? 0 : 1.5,
                          borderColor: isDark ? "#2D3748" : "#E2E8F0",
                        },
                      ]}
                      onPress={() => setSelectedDeliveryAddressId(item.id)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.addressIconBox,
                          {
                            backgroundColor: selected
                              ? "rgba(0,0,0,0.1)"
                              : isDark
                                ? "#0F1729"
                                : "#E2E8F0",
                          },
                        ]}
                      >
                        <Ionicons
                          name={item.label === "Home" ? "home" : "briefcase"}
                          size={18}
                          color={selected ? "#000" : theme.primary}
                        />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text
                          style={{
                            fontWeight: "800",
                            fontSize: 15,
                            color: selected ? "#000" : theme.text,
                          }}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={{
                            color: selected ? "rgba(0,0,0,0.7)" : theme.subText,
                            marginTop: 4,
                            fontSize: 13,
                          }}
                        >
                          {item.flat}, {item.line1}
                        </Text>
                        <Text
                          style={{
                            color: selected ? "rgba(0,0,0,0.7)" : theme.subText,
                            marginTop: 2,
                            fontSize: 13,
                          }}
                        >
                          {item.city}, {item.state}
                        </Text>
                      </View>

                      {selected && (
                        <Ionicons name="checkmark-circle" size={24} color="#000" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                style={styles.addAddrBtn}
                onPress={() => {
                  setAddModalOpen(true);
                  setAddressType("delivery");
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="add-circle"
                  size={20}
                  color={theme.primary}
                />
                <Text
                  style={{
                    marginLeft: 8,
                    color: theme.primary,
                    fontWeight: "800",
                    fontSize: 14,
                  }}
                >
                  Add new delivery address
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* NOTE */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={theme.primary} />
            <Text style={[styles.cardHeading, { color: theme.text, marginLeft: 6, marginBottom: 0 }]}>
              Special Instructions (Optional)
            </Text>
          </View>

          <TextInput
            placeholder="e.g., Call before arrival, Ring doorbell twice..."
            placeholderTextColor={theme.subText}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            style={[
              styles.noteInput,
              {
                backgroundColor: isDark ? "#1A2332" : "#F0F4F8",
                color: theme.text,
                borderWidth: 1.5,
                borderColor: isDark ? "#2D3748" : "#E2E8F0",
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          onPress={confirmPickup}
          activeOpacity={0.9}
        >
          <Ionicons name="checkmark-circle" size={22} color="#000" />
          <Text style={[styles.primaryText, { marginLeft: 8 }]}>Confirm Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={[styles.cancel, { color: theme.subText }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ADD ADDRESS MODAL */}
      {/* ADD ADDRESS MODAL */}
      <Modal visible={addModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={modalStyles.backdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[modalStyles.modal, { backgroundColor: theme.card }]}>
              <ScrollView
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <View style={modalStyles.header}>
                  <View>
                    <Text style={[modalStyles.modalTitle, { color: theme.text }]}>
                      Add New Address
                    </Text>
                    <Text
                      style={[modalStyles.modalSubtitle, { color: theme.subText }]}
                    >
                      {addressType === "pickup"
                        ? "Pickup Location"
                        : "Delivery Location"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => setAddModalOpen(false)}
                    style={[
                      modalStyles.closeBtn,
                      { backgroundColor: isDark ? "#1A2332" : "#F0F4F8" },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={22} color={theme.text} />
                  </TouchableOpacity>
                </View>

                {/* MAP */}
                <View style={modalStyles.mapContainer}>
                  {/* SEARCH BAR */}
                  <View style={modalStyles.mapSearchBox}>
                    <Ionicons name="search" size={18} color={theme.subText} />
                    <TextInput
                      placeholder="Search location..."
                      placeholderTextColor={theme.subText}
                      value={mapQuery}
                      onChangeText={setMapQuery}
                      onSubmitEditing={searchOnMap}
                      returnKeyType="search"
                      style={[modalStyles.mapSearchInput, { color: "#000" }]}
                    />
                    {searchLoading ? (
                      <Ionicons name="sync" size={18} color={theme.primary} />
                    ) : (
                      <TouchableOpacity onPress={searchOnMap}>
                        <Ionicons name="arrow-forward-circle" size={30} color={theme.primary} />
                      </TouchableOpacity>
                    )}
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
                    onPress={fetchCurrentLocation}
                    disabled={locLoading}
                    style={[
                      modalStyles.currentLocBtn,
                      {
                        backgroundColor: theme.primary,
                        opacity: locLoading ? 0.8 : 1,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={locLoading ? "sync" : "locate"}
                      size={18}
                      color="#000"
                    />
                    <Text style={modalStyles.currentLocText}>
                      {locLoading ? "Fetching..." : "Use Current Location"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* FORM */}
                <View style={{ marginTop: 10 }}>
                  <TextInput
                    placeholder="House No / Flat"
                    placeholderTextColor={theme.subText}
                    value={addressForm.houseNo}
                    onChangeText={(t) =>
                      setAddressForm((p) => ({ ...p, houseNo: t }))
                    }
                    style={[modalStyles.input, fieldStyle(theme, isDark)]}
                  />

                  <TextInput
                    placeholder="Street"
                    placeholderTextColor={theme.subText}
                    value={addressForm.street}
                    onChangeText={(t) =>
                      setAddressForm((p) => ({ ...p, street: t }))
                    }
                    style={[modalStyles.input, fieldStyle(theme, isDark)]}
                  />

                  <TextInput
                    placeholder="Landmark"
                    placeholderTextColor={theme.subText}
                    value={addressForm.landmark}
                    onChangeText={(t) =>
                      setAddressForm((p) => ({ ...p, landmark: t }))
                    }
                    style={[modalStyles.input, fieldStyle(theme, isDark)]}
                  />

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput
                      placeholder="City"
                      placeholderTextColor={theme.subText}
                      value={addressForm.city}
                      onChangeText={(t) =>
                        setAddressForm((p) => ({ ...p, city: t }))
                      }
                      style={[modalStyles.inputHalf, fieldStyle(theme, isDark)]}
                    />
                    <TextInput
                      placeholder="State"
                      placeholderTextColor={theme.subText}
                      value={addressForm.state}
                      onChangeText={(t) =>
                        setAddressForm((p) => ({ ...p, state: t }))
                      }
                      style={[modalStyles.inputHalf, fieldStyle(theme, isDark)]}
                    />
                  </View>

                  <TextInput
                    placeholder="Pincode"
                    placeholderTextColor={theme.subText}
                    value={addressForm.pincode}
                    onChangeText={(t) =>
                      setAddressForm((p) => ({ ...p, pincode: t }))
                    }
                    keyboardType="number-pad"
                    style={[modalStyles.input, fieldStyle(theme, isDark)]}
                  />

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput
                      placeholder="Latitude"
                      placeholderTextColor={theme.subText}
                      value={addressForm.latitude}
                      editable={false}
                      style={[modalStyles.inputHalf, fieldStyle(theme, isDark)]}
                    />
                    <TextInput
                      placeholder="Longitude"
                      placeholderTextColor={theme.subText}
                      value={addressForm.longitude}
                      editable={false}
                      style={[modalStyles.inputHalf, fieldStyle(theme, isDark)]}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: theme.primary, marginTop: 14 },
                  ]}
                  onPress={saveAddress}
                  activeOpacity={0.9}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#000" />
                  <Text style={[styles.primaryText, { marginLeft: 8 }]}>
                    Save Address
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const fieldStyle = (theme: any, isDark: boolean) => ({
  backgroundColor: isDark ? "#1A2332" : "#F0F4F8",
  color: theme.text,
  borderWidth: 1.5,
  borderColor: isDark ? "#2D3748" : "#E2E8F0",
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, paddingBottom: 40 },

  stackHeader: {
    marginTop: 8,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  headerTitle: { fontSize: 17, fontWeight: "800" },
  header: { marginBottom: 24 },
  title: { fontSize: 22, fontWeight: "900", marginTop: 4 },
  subtitle: { marginTop: 6, fontSize: 13, lineHeight: 22 },

  card: {
    borderRadius: 10,
    padding: 13,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  cardHeading: { fontSize: 16, fontWeight: "800", marginBottom: 4 },

  pickupTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },

  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginTop: 1,
  },

  slotWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
    gap: 6,
  },

  slot: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: "30%",
  },

  addressScroll: {
    maxHeight: 240,
    marginBottom: 8,
  },

  addressItem: {
    padding: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  addressIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  addAddrBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    marginTop: 0,
  },

  noteInput: {
    padding: 14,
    borderRadius: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 14,
    marginTop: 8,
  },

  primaryBtn: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },

  primaryText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
  },

  cancel: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 15,
    fontWeight: "600",
  },
});

/* ---------- modal ---------- */
const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },

  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.92,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
  },

  modalSubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  mapContainer: {
    height: SCREEN_HEIGHT * 0.5,
    minHeight: 300,              // 👈 fallback
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    marginBottom: 0,
  },

  currentLocBtn: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  currentLocText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 14,
    marginLeft: 6,
  },

  input: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: "500",
  },

  inputHalf: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 15,
    fontWeight: "500",
  },
  mapSearchBox: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",
    borderRadius: 18,

    paddingHorizontal: 14,
    height: 44,

    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,

    elevation: 4, // 👈 softer Android shadow
  },


  mapSearchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 6,
  },


});
