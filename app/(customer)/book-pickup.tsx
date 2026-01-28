// app/screens/BookPickup.tsx
import PickupMap from "@/components/maps/PickupMap.native";
import { Address } from "@/types/order.types";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  createOrderApi,
  getAddressApi,
  saveAddressApi,
} from "@/features/orders/orders.api";
import * as Haptics from "expo-haptics";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
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

const ADDRESS_ITEM_HEIGHT = 72; // approx height of 1 address card
const MAX_ADDRESS_VISIBLE = 2;

const ADDRESS_LIST_MAX_HEIGHT = ADDRESS_ITEM_HEIGHT * MAX_ADDRESS_VISIBLE + 20;

const SERVICE_TYPES = ["Shoe Spa", "Laundry", "Dry Clean"];

const mapApiAddressToUI = (a: any): Address => {
  return {
    id: String(a.id),
    label: a.label || "Other",

    // UI expects flat + line1
    flat: a.addressLine1 || "",
    line1: a.addressLine1 || "",
    street: a.addressLine1 || "",

    landmark: a.landmark || "",
    city: a.city || "",
    state: a.state || "",
    pincode: a.pincode || "",

    latitude: Number(a.latitude || 0),
    longitude: Number(a.longitude || 0),

    isActive: a.isActive ?? true,

    // keep this for filtering pickup/delivery
    addressType: a.addressType,
  } as any;
};

export default function BookPickup() {
  const { theme, isDark } = useTheme();
  const [note, setNote] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const insets = useSafeAreaInsets();

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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const [deliveryAddresses, setDeliveryAddresses] = useState<Address[]>([]);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] =
    useState<string>("");

  // SERVICE TYPE
  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[1]);

  // ADD ADDRESS MODAL
  const [mapQuery, setMapQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAddress, setPreviewAddress] = useState<any>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);

  const [confirmLoading, setConfirmLoading] = useState(false);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const scaleAnim = React.useRef(new Animated.Value(0.7)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(40)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [tempNote, setTempNote] = useState("");
  const [addressForm, setAddressForm] = useState({
    label: "home",
    contactName: "",
    contactPhone: "",
    houseNo: "",
    street: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    latitude: "",
    longitude: "",
    isActive: true,
  });

  const scrollRef = React.useRef<ScrollView>(null);


  const [location, setLocation] = useState({
    latitude: 19.076,
    longitude: 72.8777,
  });

  const openAddressPreview = (addr: any) => {
    setPreviewAddress(addr);
    setPreviewOpen(true);
  };

  const goBackSafe = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(customer)/(tabs)/home");
    }
  };
  const openSuccessModal = (msg: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setSuccessMessage(msg);
    setSuccessOpen(true);

    scaleAnim.setValue(0.6);
    fadeAnim.setValue(0);
    slideAnim.setValue(40);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => {
      setSuccessOpen(false);
      goBackSafe();

    }, 2500);

  };

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);
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

  const formatDateForApi = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const confirmPickup = async () => {
    if (confirmLoading) return; // ✅ prevent double click

    try {
      setConfirmLoading(true);

      // ✅ pickup address must be selected
      if (!selectedAddressId) {
        Alert.alert("Missing Pickup Address", "Please select pickup address.");
        return;
      }

      // ✅ delivery address id based on mode
      const deliveryId =
        deliveryMode === "same" ? selectedAddressId : selectedDeliveryAddressId;

      if (!deliveryId) {
        Alert.alert(
          "Missing Delivery Address",
          "Please select delivery address.",
        );
        return;
      }

      // ✅ date logic
      const scheduledDate = pickupType === "today" ? new Date() : date;

      // ✅ slot is optional (only when schedule)
      const selectedSlot =
        pickupType === "schedule" && slot !== -1 ? TIME_SLOTS[slot] : undefined;

      // ✅ request body
      const order_details: any = {
        scheduledDate: formatDateForApi(scheduledDate),
        pickupAddressId: selectedAddressId,
        deliveryAddressId: deliveryId,
      };

      // optional fields
      if (selectedSlot) order_details.slot = selectedSlot;
      if (note?.trim()) order_details.note = note.trim();

      // 🔥 API call
      await createOrderApi(order_details);
      if (pickupType === "today") {
        openSuccessModal(
          "Sit & relax 😌\nYour pickup will be collected shortly!",
        );
      } else {
        openSuccessModal("Pickup scheduled successfully ✅");
      }
      //  router.back();
    } catch (err: any) {
      console.log("create order error:", err);
      Alert.alert("Error", err?.message || "Failed to create order");
    } finally {
      setConfirmLoading(false);
    }
  };

  const getPickupAddr = async () => {
    try {
      const data = await getAddressApi();

      const list = Array.isArray(data?.results) ? data.results : [];

      // ✅ map API response to UI address format
      const mappedList = list.map(mapApiAddressToUI);

      // ✅ filter pickup + delivery
      const pickupList = mappedList.filter(
        (a: any) => a.addressType === "PICKUP",
      );
      const deliveryList = mappedList.filter(
        (a: any) => a.addressType === "DELIVERY",
      );

      setAddresses(pickupList);
      setDeliveryAddresses(deliveryList);

      // auto select first pickup
      setSelectedAddressId(pickupList?.[0]?.id || "");

      // auto select first delivery
      setSelectedDeliveryAddressId(deliveryList?.[0]?.id || "");
    } catch (err) {
      console.log("getPickupAddr error:", err);
      setAddresses([]);
      setDeliveryAddresses([]);
      setSelectedAddressId("");
      setSelectedDeliveryAddressId("");
    }
  };

  useEffect(() => {
    getPickupAddr();
  }, []);

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
          "Please allow location access from settings.",
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
          houseNo: "",
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
        e?.message || "Unable to fetch current location",
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
        label: "home",
        contactName: "",
        contactPhone: "",
        houseNo: "",
        street: "",
        addressLine2: "",
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
  const saveAddress = async () => {
    try {
      // label mapping for API
      const label =
        addressForm.label === "home"
          ? "Home"
          : addressForm.label === "work"
            ? "Office"
            : "Other";

      const payload: any = {
        label,
        addressLine1: `${addressForm.houseNo}, ${addressForm.street}`.trim(),
        landmark: addressForm.landmark,
        city: addressForm.city,
        state: addressForm.state,
        country: "India",
        pincode: addressForm.pincode,
        latitude: Number(addressForm.latitude),
        longitude: Number(addressForm.longitude),

        // pickup/delivery based on which button opened modal
        addressType: addressType === "pickup" ? "PICKUP" : "DELIVERY",
      };

      // Optional fields only send if user entered
      if (addressForm.contactName?.trim())
        payload.contactName = addressForm.contactName.trim();
      if (addressForm.contactPhone?.trim())
        payload.contactPhone = addressForm.contactPhone.trim();
      if (addressForm.addressLine2?.trim())
        payload.addressLine2 = addressForm.addressLine2.trim();

      // 🔥 API call
      const saved = await saveAddressApi(payload);

      // after saving, refresh list from backend
      await getPickupAddr();

      // close modal
      setAddModalOpen(false);

      Alert.alert("Success", "Address saved successfully!");
    } catch (err: any) {
      console.log("saveAddress error:", err);
      Alert.alert("Error", err?.message || "Failed to save address");
    }
  };




  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={[styles.safe, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 75 + insets.top : 0
        }

      >

        <View
          style={[
            styles.stackHeader,
            {
              paddingTop: insets.top,
              backgroundColor: theme.background,
              borderBottomColor: isDark ? "#1f2933" : "#e5e7eb",

            },
          ]}
        >
          <TouchableOpacity onPress={goBackSafe} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={theme.primary} />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              { color: theme.text, marginLeft: -12 }, // optical centering
            ]}
          >
            Book Pickup
          </Text>

          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.container,
            { paddingTop: 35 + insets.top + 0 }, // 👈 space for fixed header
          ]}
        >



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
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={theme.primary}
                />
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
              <Text
                style={[
                  styles.cardHeading,
                  { color: theme.text, marginLeft: 6, marginBottom: 0 },
                ]}
              >
                Pickup Address
              </Text>
            </View>

            <ScrollView
              style={[
                styles.addressScroll,
                {
                  maxHeight:
                    addresses.length > 2 ? ADDRESS_LIST_MAX_HEIGHT : undefined,
                },
              ]}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {addresses.length === 0 ? (
                <TouchableOpacity
                  style={[styles.addAddrBtn, { marginTop: 10 }]}
                  onPress={() => {
                    setAddModalOpen(true);
                    setAddressType("pickup");
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={20} color={theme.primary} />
                  <Text
                    style={{
                      marginLeft: 8,
                      color: theme.primary,
                      fontWeight: "800",
                      fontSize: 14,
                    }}
                  >
                    Add pickup address
                  </Text>
                </TouchableOpacity>
              ) : (
                addresses.map((item) => {
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
                      onLongPress={() => openAddressPreview(item)}
                      delayLongPress={300}
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
                          {item.line1}
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
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#000"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {addresses.length > 0 && (
              <TouchableOpacity
                style={styles.addAddrBtn}
                onPress={() => {
                  setAddModalOpen(true);
                  setAddressType("pickup");
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={20} color={theme.primary} />
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
            )}
          </View>

          {/* DELIVERY ADDRESS SECTION */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="navigate" size={20} color={theme.primary} />
              <Text
                style={[
                  styles.cardHeading,
                  { color: theme.text, marginLeft: 6, marginBottom: 0 },
                ]}
              >
                Delivery Address
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginTop: 12,
                marginBottom: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => setDeliveryMode("same")}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor:
                    deliveryMode === "same"
                      ? theme.primary
                      : isDark
                        ? "#1A2332"
                        : "#F0F4F8",
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
                    deliveryMode === "other"
                      ? theme.primary
                      : isDark
                        ? "#1A2332"
                        : "#F0F4F8",
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
                  style={[
                    styles.addressScroll,
                    {
                      maxHeight:
                        deliveryAddresses.length > 2
                          ? ADDRESS_LIST_MAX_HEIGHT
                          : undefined,
                    },
                  ]}
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
                        onLongPress={() => openAddressPreview(item)}
                        delayLongPress={300}
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
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#000"
                          />
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
                  <Ionicons name="add-circle" size={20} color={theme.primary} />
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

          {/* NOTE - Preview/Trigger */}
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card }]}
            onPress={() => {
              setTempNote(note);
              setNotesModalOpen(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={theme.primary} />
              <Text
                style={[
                  styles.cardHeading,
                  { color: theme.text, marginLeft: 6, marginBottom: 0 },
                ]}
              >
                Special Instructions (Optional)
              </Text>
            </View>

            <View
              style={[
                styles.notePreview,
                {
                  backgroundColor: isDark ? "#1A2332" : "#F0F4F8",
                  borderWidth: 1.5,
                  borderColor: isDark ? "#2D3748" : "#E2E8F0",
                },
              ]}
            >
              <Text
                style={{
                  color: note ? theme.text : theme.subText,
                  fontSize: 14,
                  fontWeight: note ? "500" : "400",
                }}
                numberOfLines={2}
              >
                {note || "Tap to add special instructions..."}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={theme.subText} />
            </View>
          </TouchableOpacity>


          {/* ADD THIS NEW MODAL - FLOATING NOTES MODAL */}
          <Modal
            visible={notesModalOpen}
            animationType="slide"
            transparent
            onRequestClose={() => setNotesModalOpen(false)}
          >
            <KeyboardAvoidingView
              style={modalStyles.backdrop}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <TouchableWithoutFeedback onPress={() => setNotesModalOpen(false)}>
                <View style={modalStyles.backdrop}>
                  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={[modalStyles.notesModal, { backgroundColor: theme.card }]}>
                      {/* Header */}
                      <View style={modalStyles.header}>
                        <View>
                          <Text style={[modalStyles.modalTitle, { color: theme.text }]}>
                            Special Instructions
                          </Text>
                          <Text style={[modalStyles.modalSubtitle, { color: theme.subText }]}>
                            Add any special requests or notes
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => setNotesModalOpen(false)}
                          style={[
                            modalStyles.closeBtn,
                            { backgroundColor: isDark ? "#1A2332" : "#F0F4F8" },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="close" size={22} color={theme.text} />
                        </TouchableOpacity>
                      </View>

                      {/* Notes Input */}
                      <TextInput
                        placeholder="e.g., Call before arrival, Ring doorbell twice, Gate code: 1234..."
                        placeholderTextColor={theme.subText}
                        value={tempNote}
                        onChangeText={setTempNote}
                        multiline
                        autoFocus
                        style={[
                          styles.floatingNoteInput,
                          {
                            backgroundColor: isDark ? "#1A2332" : "#F0F4F8",
                            color: theme.text,
                            borderWidth: 1.5,
                            borderColor: isDark ? "#2D3748" : "#E2E8F0",
                          },
                        ]}
                      />

                      {/* Quick Suggestions */}
                      <View style={{ marginTop: 12 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: theme.subText,
                            marginBottom: 8,
                          }}
                        >
                          Quick Suggestions
                        </Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                          {[
                            "Call before arrival",
                            "Ring doorbell twice",
                            "Leave at door",
                            "Building security required",
                          ].map((suggestion) => (
                            <TouchableOpacity
                              key={suggestion}
                              onPress={() => {
                                if (tempNote.trim()) {
                                  setTempNote(tempNote + ", " + suggestion);
                                } else {
                                  setTempNote(suggestion);
                                }
                              }}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 20,
                                backgroundColor: isDark ? "#1A2332" : "#F0F4F8",
                                borderWidth: 1,
                                borderColor: isDark ? "#2D3748" : "#E2E8F0",
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "600",
                                  color: theme.text,
                                }}
                              >
                                {suggestion}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 12,
                          marginTop: 20,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            setTempNote("");
                            setNote("");
                            setNotesModalOpen(false);
                          }}
                          style={{
                            flex: 1,
                            paddingVertical: 14,
                            borderRadius: 12,
                            backgroundColor: isDark ? "#1A2332" : "#F0F4F8",
                            borderWidth: 1.5,
                            borderColor: isDark ? "#2D3748" : "#E2E8F0",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={{
                              fontWeight: "800",
                              fontSize: 15,
                              color: theme.text,
                            }}
                          >
                            Clear
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setNote(tempNote);
                            setNotesModalOpen(false);
                          }}
                          style={{
                            flex: 2,
                            paddingVertical: 14,
                            borderRadius: 12,
                            backgroundColor: theme.primary,
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "row",
                          }}
                          activeOpacity={0.9}
                        >
                          <Ionicons name="checkmark-circle" size={20} color="#000" />
                          <Text
                            style={{
                              marginLeft: 8,
                              fontWeight: "900",
                              fontSize: 15,
                              color: "#000",
                            }}
                          >
                            Save Instructions
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </Modal>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor: theme.primary,
                opacity: confirmLoading ? 0.7 : 1,
              },
            ]}
            onPress={confirmPickup}
            activeOpacity={0.9}
            disabled={confirmLoading}
          >
            <Ionicons
              name={confirmLoading ? "sync" : "checkmark-circle"}
              size={22}
              color="#000"
            />

            <Text style={[styles.primaryText, { marginLeft: 8 }]}>
              {confirmLoading ? "Booking..." : "Confirm Booking"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goBackSafe}
            activeOpacity={0.85}
            style={[
              styles.cancelBtn,
              {
                backgroundColor: isDark ? "#1A2332" : "#F0F4F8",
                borderColor: isDark ? "#2D3748" : "#E2E8F0",
              },
            ]}
          >
            <Ionicons name="close-circle-outline" size={20} color={theme.text} />
            <Text style={[styles.cancelText, { color: theme.text }]}>
              Cancel Booking
            </Text>
          </TouchableOpacity>


        </ScrollView>

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
                      <Text
                        style={[modalStyles.modalTitle, { color: theme.text }]}
                      >
                        Add New Address
                      </Text>
                      <Text
                        style={[
                          modalStyles.modalSubtitle,
                          { color: theme.subText },
                        ]}
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
                          <Ionicons
                            name="arrow-forward-circle"
                            size={30}
                            color={theme.primary}
                          />
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

                  {/* ADDRESS LABEL SELECTION */}
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      marginBottom: 12,
                      marginTop: 14,
                    }}
                  >
                    {[
                      { key: "home", text: "Home", icon: "home" },
                      { key: "work", text: "Work", icon: "briefcase" },
                      { key: "other", text: "Others", icon: "location" },
                    ].map((item) => {
                      const active = addressForm.label === item.key;

                      return (
                        <TouchableOpacity
                          key={item.key}
                          onPress={() =>
                            setAddressForm((p) => ({
                              ...p,
                              label: item.key,
                            }))
                          }
                          style={{
                            flex: 1,
                            paddingVertical: 12,
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: active
                              ? theme.primary
                              : isDark
                                ? "#1A2332"
                                : "#F0F4F8",
                            borderWidth: active ? 0 : 1.5,
                            borderColor: isDark ? "#2D3748" : "#E2E8F0",
                          }}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name={item.icon as any}
                            size={18}
                            color={active ? "#000" : theme.primary}
                          />
                          <Text
                            style={{
                              marginLeft: 6,
                              fontWeight: "800",
                              fontSize: 14,
                              color: active ? "#000" : theme.text,
                            }}
                          >
                            {item.text}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TextInput
                    placeholder="Contact Name (Optional)"
                    placeholderTextColor={theme.subText}
                    value={addressForm.contactName}
                    onChangeText={(t) =>
                      setAddressForm((p) => ({ ...p, contactName: t }))
                    }
                    style={[modalStyles.input, fieldStyle(theme, isDark)]}
                  />

                  <TextInput
                    placeholder="Contact Phone (Optional)"
                    placeholderTextColor={theme.subText}
                    value={addressForm.contactPhone}
                    keyboardType="phone-pad"
                    onChangeText={(t) =>
                      setAddressForm((p) => ({ ...p, contactPhone: t }))
                    }
                    style={[modalStyles.input, fieldStyle(theme, isDark)]}
                  />

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
                    <TextInput
                      placeholder="Address Line 2 (Optional)"
                      placeholderTextColor={theme.subText}
                      value={addressForm.addressLine2}
                      onChangeText={(t) =>
                        setAddressForm((p) => ({ ...p, addressLine2: t }))
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

        {/* PREVIEW ADDRESS MODAL */}
        <Modal visible={previewOpen} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setPreviewOpen(false)}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.6)",
                justifyContent: "center",
                padding: 20,
              }}
            >
              <TouchableWithoutFeedback>
                <View
                  style={{
                    backgroundColor: theme.card,
                    borderRadius: 18,
                    padding: 18,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "900",
                        color: theme.text,
                      }}
                    >
                      Address Preview
                    </Text>

                    <TouchableOpacity onPress={() => setPreviewOpen(false)}>
                      <Ionicons name="close" size={22} color={theme.text} />
                    </TouchableOpacity>
                  </View>

                  {previewAddress ? (
                    <>
                      <Text
                        style={{
                          fontWeight: "800",
                          fontSize: 16,
                          color: theme.text,
                        }}
                      >
                        {previewAddress.label}
                      </Text>

                      <Text
                        style={{
                          marginTop: 8,
                          color: theme.subText,
                          fontSize: 14,
                        }}
                      >
                        {previewAddress.addressLine1 ||
                          previewAddress.line1 ||
                          previewAddress.street}
                      </Text>

                      {previewAddress.landmark ? (
                        <Text
                          style={{
                            marginTop: 4,
                            color: theme.subText,
                            fontSize: 14,
                          }}
                        >
                          Landmark: {previewAddress.landmark}
                        </Text>
                      ) : null}

                      <Text
                        style={{
                          marginTop: 4,
                          color: theme.subText,
                          fontSize: 14,
                        }}
                      >
                        {previewAddress.city}, {previewAddress.state} •{" "}
                        {previewAddress.pincode}
                      </Text>

                      {previewAddress.contactName ? (
                        <Text
                          style={{
                            marginTop: 10,
                            color: theme.text,
                            fontSize: 14,
                          }}
                        >
                          Contact: {previewAddress.contactName}
                        </Text>
                      ) : null}

                      {previewAddress.contactPhone ? (
                        <Text
                          style={{
                            marginTop: 2,
                            color: theme.text,
                            fontSize: 14,
                          }}
                        >
                          Phone: {previewAddress.contactPhone}
                        </Text>
                      ) : null}

                      <TouchableOpacity
                        onPress={() => setPreviewOpen(false)}
                        style={{
                          marginTop: 14,
                          paddingVertical: 12,
                          borderRadius: 12,
                          backgroundColor: theme.primary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontWeight: "900", color: "#000" }}>
                          Close
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={{ color: theme.subText }}>
                      No address selected
                    </Text>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        <Modal visible={successOpen} transparent animationType="fade">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <Animated.View
              style={{
                width: "100%",
                maxWidth: 320,
                backgroundColor: theme.card,
                borderRadius: 18,
                padding: 18,
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim },
                ],
                alignItems: "center",
              }}
            >
              <Image
                source={require("@/assets/images/logo/greenLogo.png")} 
                style={{
                  width: 84,
                  height: 84,
                  resizeMode: "contain",
             
                }}
              />


              {/* Animated Check */}
              <Animated.View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: theme.primary,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <Ionicons name="checkmark" size={40} color="#000" />
              </Animated.View>


              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "900",
                  color: theme.text,
                  textAlign: "center",
                }}
              >
                {successMessage}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setSuccessOpen(false);
                  router.back();
                }}
                style={{
                  marginTop: 16,
                  width: "100%",
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: theme.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                activeOpacity={0.9}
              >
                <Text style={{ fontWeight: "900", color: "#000" }}>Done</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </KeyboardAvoidingView>

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
  container: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    flexGrow: 1  // This is key!
  },
  stackHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 75,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 100,
    borderBottomWidth: 1,
      elevation: 8,               // 👈 keeps above scroll

  },


  headerTitle: { fontSize: 17, fontWeight: "800" },
  header: { marginBottom: 10 },
  title: { fontSize: 20, fontWeight: "900", marginTop: 12 },
  subtitle: { marginTop: 4, fontSize: 13, lineHeight: 22 },

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
    // maxHeight: 240,
    marginBottom: 8,
  },
  notePreview: {
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  floatingNoteInput: {
    padding: 16,
    borderRadius: 12,
    minHeight: 150,
    maxHeight: 200,
    textAlignVertical: "top",
    fontSize: 15,
    marginTop: 12,
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
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
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

  cancelBtn: {
    height: 42,
    borderRadius: 10,
    marginTop: 5,
    marginBottom: 14,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },

  cancelText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "800",
  },

});

/* ---------- modal ---------- */
const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  notesModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
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
    minHeight: 300, // 👈 fallback
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
