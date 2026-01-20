// app/screens/BookPickup.tsx
import { Address } from "@/types/order.types";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
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
import MapView, { Marker } from "react-native-maps";
import { useTheme } from "../../context/ThemeContext";

const TIME_SLOTS = [
  "9:00 – 12:00 AM",
  "1:00 – 4:00 PM",
  "5:00 – 8:00 PM",
  "9:00 – 12:00 PM",
];

const SAMPLE_ADDRESSES = [
  {
    id: "home",
    label: "Home",
    flat: "Flat 12B",
    line1: "123 Green Street",
    street: "123 Green Street",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  },
  {
    id: "office",
    label: "Office",
    flat: "Office 502",
    line1: "Tower A, Business Park",
    street: "Tower A, Business Park",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400002",
  },
];

const SERVICE_TYPES = ["Shoe Spa", "Laundry", "Dry Clean"];

export default function BookPickup() {
  const { theme, isDark } = useTheme();

  // DATE
  const [date, setDate] = useState<Date>(new Date()); // default today
  const [showDatePicker, setShowDatePicker] = useState(false);

  // TIME
  const [slot, setSlot] = useState<number>(0);

  // ADDRESSES
  const [addresses, setAddresses] = useState<Address[]>(SAMPLE_ADDRESSES);
  const [selectedAddressId, setSelectedAddressId] = useState(
    SAMPLE_ADDRESSES[0].id,
  );

  // SERVICE TYPE
  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[1]); // default Laundry

  // ADD ADDRESS MODAL
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    flat: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
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
    Alert.alert(
      "Pickup Confirmed",
      `Date: ${formatDateLabel(date)}\nTime: ${TIME_SLOTS[slot]}\nAddress: ${selectedAddressId}\nService: ${serviceType}`,
    );
    router.back();
  };

  const fetchCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Enable location permission to use this feature.",
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch (e) {
      Alert.alert("Location error", String(e));
    }
  };

  // auto-fetch when modal opens (optional)
  useEffect(() => {
    if (addModalOpen) {
      fetchCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addModalOpen]);

  // Save address from form
  const saveAddress = () => {
    const id = Date.now().toString();
    const label = addressForm.flat?.trim() ? addressForm.flat : "Other";
    setAddresses((p) => [
      ...p,
      {
        id,
        label,
        flat: addressForm.flat,
        line1: addressForm.street,
        city: addressForm.city,
        state: addressForm.state,
        pincode: addressForm.pincode,
        latitude: location.latitude,
        longitude: location.longitude,
      } as any,
    ]);
    setSelectedAddressId(id);
    setAddModalOpen(false);
    // reset form
    setAddressForm({
      flat: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
    });
  };

  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <>
            {/* HEADER */}
            <View style={styles.stackHeader}>
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={26} color={theme.primary} />
              </TouchableOpacity>

              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Book Pickup
              </Text>

              <View style={{ width: 26 }} />
            </View>

            {/* TITLE */}
            <View style={styles.header}>
              <Text style={[styles.kicker, { color: theme.primary }]}>
                SCHEDULE SERVICE
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>
                Pickup Details
              </Text>
              <Text style={[styles.subtitle, { color: theme.subText }]}>
                Choose pickup date, time and address
              </Text>
            </View>

            {/* DATE */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardHeading, { color: theme.text }]}>
                Pickup Date
              </Text>

              <TouchableOpacity
                style={[
                  styles.dateBox,
                  { backgroundColor: isDark ? "#0B1220" : "#F7FAFC" },
                ]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text style={{ marginLeft: 8, color: theme.text }}>
                  {formatDateLabel(date)}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  minimumDate={new Date()}
                  onChange={(_, d) => {
                    setShowDatePicker(false);
                    if (d) setDate(d);
                  }}
                />
              )}
            </View>

            {/* TIME */}
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
                              ? "#0B1220"
                              : "#F7FAFC",
                        },
                      ]}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={{
                          fontWeight: "700",
                          color: active ? "#000" : theme.text,
                        }}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* SERVICE TYPE */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <Text style={[styles.cardHeading, { color: theme.text }]}>
                Service Type
              </Text>
              <View style={{ flexDirection: "row", marginTop: 10 }}>
                {SERVICE_TYPES.map((type) => {
                  const active = serviceType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setServiceType(type)}
                      style={[
                        styles.serviceChip,
                        {
                          backgroundColor: active
                            ? theme.primary
                            : isDark
                              ? "#071219"
                              : "#fff",
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: active ? "#000" : theme.text,
                          fontWeight: "800",
                        }}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text
              style={[
                styles.cardHeading,
                { color: theme.text, marginBottom: 8 },
              ]}
            >
              Pickup Address
            </Text>
          </>
        }
        renderItem={({ item }) => {
          const selected = item.id === selectedAddressId;
          return (
            <TouchableOpacity
              style={[
                styles.addressItem,
                {
                  backgroundColor: selected
                    ? theme.primary
                    : isDark
                      ? "#071219"
                      : "#FFF",
                },
              ]}
              onPress={() => setSelectedAddressId(item.id)}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontWeight: "800",
                    color: selected ? "#000" : theme.text,
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    color: selected ? "#000" : theme.subText,
                    marginTop: 4,
                  }}
                >
                  {item.flat}, {item.line1 ?? item.street}
                </Text>
                <Text
                  style={{
                    color: selected ? "#000" : theme.subText,
                    marginTop: 4,
                  }}
                >
                  {item.city}, {item.state} • {item.pincode}
                </Text>
              </View>

              {selected && (
                <Ionicons name="checkmark-circle" size={22} color="#000" />
              )}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={
          <>
            {/* ADD ADDRESS BUTTON */}
            <TouchableOpacity
              style={styles.addAddrBtn}
              onPress={() => setAddModalOpen(true)}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={theme.primary}
                style={{
                  marginLeft: 4,
                  marginTop: 10,
                }}
              />
              <Text
                style={{
                  marginLeft: 10,
                  color: theme.primary,
                  fontWeight: "700",
                  marginTop: 10,
                }}
              >
                Add new address
              </Text>
            </TouchableOpacity>

            {/* CTA */}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              onPress={confirmPickup}
            >
              <Text style={styles.primaryText}>Confirm Pickup</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.cancel, { color: theme.subText }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </>
        }
      />

      {/* ADD ADDRESS MODAL */}
      <Modal visible={addModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={modalStyles.backdrop}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[modalStyles.modal, { backgroundColor: theme.card }]}>
              <ScrollView
                contentContainerStyle={{ paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
              >
                <Text
                  style={{ fontSize: 18, fontWeight: "900", color: theme.text }}
                >
                  Add New Address
                </Text>

                <TextInput
                  placeholder="Flat / House No"
                  placeholderTextColor={theme.subText}
                  value={addressForm.flat}
                  onChangeText={(t) =>
                    setAddressForm((p) => ({ ...p, flat: t }))
                  }
                  style={[
                    modalStyles.input,
                    {
                      backgroundColor: isDark ? "#0B1220" : "#F7FAFC",
                      color: theme.text,
                    },
                  ]}
                />
                <TextInput
                  placeholder="Street / Area"
                  placeholderTextColor={theme.subText}
                  value={addressForm.street}
                  onChangeText={(t) =>
                    setAddressForm((p) => ({ ...p, street: t }))
                  }
                  style={[
                    modalStyles.input,
                    {
                      backgroundColor: isDark ? "#0B1220" : "#F7FAFC",
                      color: theme.text,
                    },
                  ]}
                />
                <TextInput
                  placeholder="Landmark (optional)"
                  placeholderTextColor={theme.subText}
                  value={addressForm.landmark}
                  onChangeText={(t) =>
                    setAddressForm((p) => ({ ...p, landmark: t }))
                  }
                  style={[
                    modalStyles.input,
                    {
                      backgroundColor: isDark ? "#0B1220" : "#F7FAFC",
                      color: theme.text,
                    },
                  ]}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    placeholder="City"
                    placeholderTextColor={theme.subText}
                    value={addressForm.city}
                    onChangeText={(t) =>
                      setAddressForm((p) => ({ ...p, city: t }))
                    }
                    style={[
                      modalStyles.inputHalf,
                      {
                        backgroundColor: isDark ? "#0B1220" : "#F7FAFC",
                        color: theme.text,
                      },
                    ]}
                  />
                  <TextInput
                    placeholder="State"
                    placeholderTextColor={theme.subText}
                    value={addressForm.state}
                    onChangeText={(t) =>
                      setAddressForm((p) => ({ ...p, state: t }))
                    }
                    style={[
                      modalStyles.inputHalf,
                      {
                        backgroundColor: isDark ? "#0B1220" : "#F7FAFC",
                        color: theme.text,
                      },
                    ]}
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
                  style={[
                    modalStyles.input,
                    {
                      backgroundColor: isDark ? "#0B1220" : "#F7FAFC",
                      color: theme.text,
                    },
                  ]}
                />

                {/* MAP */}
                <View
                  style={{ marginTop: 12, borderRadius: 8, overflow: "hidden" }}
                >
                  <MapView
                    style={modalStyles.map}
                    initialRegion={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    onPress={(e) => setLocation(e.nativeEvent.coordinate)}
                  >
                    <Marker coordinate={location} />
                  </MapView>
                </View>

                <TouchableOpacity
                  onPress={fetchCurrentLocation}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ color: theme.primary, fontWeight: "700" }}>
                    Use current location
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: theme.primary, marginTop: 12 },
                  ]}
                  onPress={saveAddress}
                >
                  <Text style={styles.primaryText}>Save Address</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setAddModalOpen(false)}>
                  <Text style={[styles.cancel, { color: theme.subText }]}>
                    Close
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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20 },

  stackHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "fixed",
  },

  headerTitle: { fontSize: 16, fontWeight: "800" },
  header: { marginBottom: 18 },
  kicker: { fontSize: 11, letterSpacing: 2, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "900", marginTop: 4 },
  subtitle: { marginTop: 6, fontSize: 14 },

  // reduced corner radii for a flatter look
  card: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },

  cardHeading: { fontSize: 15, fontWeight: "800" },

  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },

  slotWrap: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  slot: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },

  addressItem: {
    padding: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  addAddrBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  catalogChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  serviceChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },

  primaryBtn: {
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },

  primaryText: { color: "#000", fontSize: 16, fontWeight: "900" },
  cancel: { textAlign: "center", marginTop: 14, fontSize: 14 },
});

/* ---------- modal ---------- */
const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center", // center the modal so it can move with keyboard
    padding: 10,
  },
  modal: {
    padding: 12,
    borderRadius: 12,
    width: "100%",
    maxHeight: "88%",
    alignSelf: "center",
    overflow: "hidden",
  },
  input: {
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  inputHalf: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    marginTop: 10,
  },
  map: {
    height: 180,
    borderRadius: 8,
    marginTop: 6,
  },
});
