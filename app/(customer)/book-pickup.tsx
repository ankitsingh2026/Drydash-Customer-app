// app/screens/BookPickup.tsx
import PickupMap from "@/components/maps/PickupMap.native";
import { Address } from "@/types/order.types";
import { Ionicons } from "@expo/vector-icons";
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
import { useTheme } from "../../context/ThemeContext";

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
  const [slot, setSlot] = useState<number>(0);

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
    const pickupAddr = addresses.find((a) => a.id === selectedAddressId);
    const deliveryAddr =
      deliveryMode === "same"
        ? pickupAddr
        : deliveryAddresses.find((a) => a.id === selectedDeliveryAddressId);

    const message = `Date: ${
      pickupType === "today" ? "Today" : formatDateLabel(date)
    }
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
      setSlot(-1); // no slot selected
    } else {
      setSlot(0); // default first slot when scheduled
    }
  }, [pickupType]);

  // fetch current location + reverse geocode to populate address form
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
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setLocation(coords);

      // reverse geocode to get human address fields
      try {
        const geo = await Location.reverseGeocodeAsync(coords);
        if (geo && geo.length > 0) {
          const g = geo[0];
          setAddressForm((p) => ({
            ...p,
            flat: g.name ?? p.flat ?? "",
            street: g.street ?? p.street ?? "",
            landmark: g.district ?? p.landmark ?? "",
            city: g.city ?? p.city ?? "",
            state: g.region ?? p.state ?? "",
            pincode: g.postalCode ?? p.pincode ?? "",
          }));
        }
      } catch (e) {
        // reverse geocode failure is non fatal
        // keep only coords set
      }
    } catch (e) {
      Alert.alert("Location error", String(e));
    }
  };

  // auto-fetch when modal opens
  useEffect(() => {
    if (addModalOpen) {
      // pre-clear form (optional)
      setAddressForm({
        flat: "",
        street: "",
        landmark: "",
        city: "",
        state: "",
        pincode: "",
      });
      // fetch current location to center map and prefill fields
      fetchCurrentLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addModalOpen]);

  // Save address from form into pickup or delivery list based on addressType
  const saveAddress = () => {
    const id = Date.now().toString();
    const label = addressForm.flat?.trim() ? addressForm.flat : "Other";
    const newAddress: Address = {
      id,
      label,
      flat: addressForm.flat,
      line1: addressForm.street,
      street: addressForm.street,
      city: addressForm.city,
      state: addressForm.state,
      pincode: addressForm.pincode,
      latitude: location.latitude,
      longitude: location.longitude,
    } as any;

    if (addressType === "pickup") {
      setAddresses((p) => [...p, newAddress]);
      setSelectedAddressId(id);
    } else {
      setDeliveryAddresses((p) => [...p, newAddress]);
      setSelectedDeliveryAddressId(id);
    }

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
        data={addresses} // 👈 ONLY pickup addresses
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
                Pickup Type
              </Text>

              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* TODAY */}
                <TouchableOpacity
                  onPress={() => setPickupType("today")}
                  style={[
                    styles.slot,
                    {
                      flex: 1,
                      backgroundColor:
                        pickupType === "today"
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
                      color: pickupType === "today" ? "#000" : theme.text,
                      textAlign: "center",
                    }}
                  >
                    Today
                  </Text>
                </TouchableOpacity>

                {/* SCHEDULED */}
                <TouchableOpacity
                  onPress={() => setPickupType("schedule")}
                  style={[
                    styles.slot,
                    {
                      flex: 1,
                      backgroundColor:
                        pickupType === "schedule"
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
                      color: pickupType === "schedule" ? "#000" : theme.text,
                      textAlign: "center",
                    }}
                  >
                    Schedule Pickup
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* TIME */}
            {pickupType === "schedule" && (
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardHeading, { color: theme.text }]}>
                  Pickup Time
                </Text>

                {/* select time slot */}
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
            )}

            <Text
              style={[
                styles.cardHeading,
                { color: theme.text, marginBottom: 8 },
              ]}
            >
              {addressType === "pickup" ? "Pickup Address" : "Delivery Address"}
            </Text>
            {/* ADD PICKUP ADDRESS BUTTON */}
            {/* <TouchableOpacity
              style={styles.addAddrBtn}
              onPress={() => {
                setAddModalOpen(true);
                setAddressType("pickup");
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={theme.primary}
              />
              <Text
                style={{
                  marginLeft: 10,
                  color: theme.primary,
                  fontWeight: "700",
                }}
              >
                Add new address
              </Text>
            </TouchableOpacity> */}
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
            {/* ADD PICKUP ADDRESS BUTTON */}
            <TouchableOpacity
              style={styles.addAddrBtn}
              onPress={() => {
                setAddModalOpen(true);
                setAddressType("pickup");
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={theme.primary}
              />
              <Text
                style={{
                  marginLeft: 10,
                  color: theme.primary,
                  fontWeight: "700",
                }}
              >
                Add new address
              </Text>
            </TouchableOpacity>

            {/* DELIVERY ADDRESS SECTION */}
            <Text
              style={[styles.cardHeading, { color: theme.text, marginTop: 20 }]}
            >
              Delivery Address
            </Text>

            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <TouchableOpacity
                onPress={() => setDeliveryMode("same")}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  marginRight: 8,
                  backgroundColor:
                    deliveryMode === "same" ? theme.primary : theme.card,
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "800",
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
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor:
                    deliveryMode === "other" ? theme.primary : theme.card,
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "800",
                    color: deliveryMode === "other" ? "#000" : theme.text,
                  }}
                >
                  Choose / New
                </Text>
              </TouchableOpacity>
            </View>

            {/* ADD ADDRESS BUTTON */}

            {/* CTA */}

            <View style={{ height: 32 }} />

            {deliveryMode === "other" && (
              <>
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
                              ? "#071219"
                              : "#FFF",
                        },
                      ]}
                      onPress={() => setSelectedDeliveryAddressId(item.id)}
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
                          {item.flat}, {item.line1}
                        </Text>

                        <Text
                          style={{
                            color: selected ? "#000" : theme.subText,
                            marginTop: 4,
                          }}
                        >
                          {item.city}, {item.state}
                        </Text>
                      </View>

                      {selected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#000"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.addAddrBtn}
                  onPress={() => {
                    setAddModalOpen(true);
                    setAddressType("delivery");
                  }}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color={theme.primary}
                  />
                  <Text
                    style={{
                      marginLeft: 10,
                      color: theme.primary,
                      fontWeight: "700",
                    }}
                  >
                    Add new address
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
              onPress={confirmPickup}
            >
              <Text style={styles.primaryText}>Confirm Booking</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.cancel, { color: theme.subText }]}>
                Cancel
              </Text>
            </TouchableOpacity>
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
                {/* Header with close (top-right) */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "900",
                      color: theme.text,
                    }}
                  >
                    Add New Address
                  </Text>

                  <TouchableOpacity onPress={() => setAddModalOpen(false)}>
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>

                {/* small note showing whether adding pickup/delivery */}
                <Text
                  style={{
                    marginTop: 6,
                    marginBottom: 6,
                    color: theme.subText,
                    fontWeight: "700",
                  }}
                >
                  Adding for: {addressType === "pickup" ? "Pickup" : "Delivery"}
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
                  {/* <MapView
                    style={modalStyles.map}
                    initialRegion={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    region={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    onPress={(e) => setLocation(e.nativeEvent.coordinate)}
                  >
                    <Marker coordinate={location} />
                  </MapView> */}

                  <PickupMap
                    location={location}
                    onSelect={(c) => setLocation(c)}
                  />
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
    position: "relative",
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
  cancel: { textAlign: "center", marginTop: 4, fontSize: 14, marginBottom: 30 },
});

/* ---------- modal ---------- */
const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
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
