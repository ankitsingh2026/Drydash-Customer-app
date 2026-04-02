// app/screens/BookPickup.tsx — UI Redesign (logic untouched)
import CouponCard, { COUPONS } from "@/components/CouponCard";
import PickupMap from "@/components/maps/PickupMap.native";
import {
  createOrderApi,
  getAddressApi,
  saveAddressApi,
} from "@/features/orders/orders.api";
import { useAuth } from "@/hooks/useAuth";
import { Address } from "@/types/order.types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Constants (unchanged) ────────────────────────────────────────────────────
const TIME_SLOTS = [
  "9:00 – 12:00 AM",
  "1:00 – 4:00 PM",
  "5:00 – 8:00 PM",
  "9:00 – 12:00 PM",
];

const ADDRESS_ITEM_HEIGHT = 72;
const MAX_ADDRESS_VISIBLE = 2;
const ADDRESS_LIST_MAX_HEIGHT = ADDRESS_ITEM_HEIGHT * MAX_ADDRESS_VISIBLE + 20;
const SERVICE_TYPES = ["Shoe Spa", "Laundry", "Dry Clean"];

// ─── Time slot grouping for UI display ───────────────────────────────────────
const TIME_GROUPS = [
  { label: "MORNING", emoji: "☀️", slots: [0] },
  { label: "AFTERNOON", emoji: "🌤️", slots: [1, 3] },
  { label: "EVENING", emoji: "🌙", slots: [2] },
];

// ─── Helper: generate next N days ────────────────────────────────────────────
function getNextDays(count: number) {
  const days: Date[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const mapApiAddressToUI = (a: any): Address => ({
  id: String(a.id),
  label: a.label || "Other",
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
  addressType: a.addressType,
} as any);

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Horizontal pickup address card */
function AddressCard({
  address, selected, onPress, theme,
}: { address: Address; selected: boolean; onPress: () => void; theme: any }) {
  const iconName = address.label?.toLowerCase() === "home" ? "home" : "briefcase";
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
    {selected ? (
      <LinearGradient
        colors={theme.gradient} // 👈 your gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          addrCardStyles.card,
          { borderColor: theme.primary, borderWidth: 1.5 },
        ]}
      >
        {/* CONTENT */}
        <View style={[addrCardStyles.iconWrap, { backgroundColor: theme.primary + "22" }]}>
          <Ionicons name={iconName as any} size={18} color={theme.primary} />
        </View>

        <Text style={[addrCardStyles.label, { color: theme.text }]} numberOfLines={1}>
          {address.label}
        </Text>

        <Text style={addrCardStyles.street} numberOfLines={2}>
          {address.line1 || address.street}
        </Text>

        <Text style={addrCardStyles.city} numberOfLines={1}>
          {address.city}
        </Text>

        <View style={[addrCardStyles.checkDot, { backgroundColor: theme.primary }]}>
          <Ionicons name="checkmark" size={10} color="#000" />
        </View>
      </LinearGradient>
    ) : (
      <View
        style={[
          addrCardStyles.card,
          { borderColor: "#1E3327", borderWidth: 1.5, backgroundColor: "#0D1F1C" },
        ]}
      >
        {/* SAME CONTENT */}
        <View style={[addrCardStyles.iconWrap, { backgroundColor: "#1A2C22" }]}>
          <Ionicons name={iconName as any} size={18} color={theme.primary} />
        </View>

        <Text style={[addrCardStyles.label, { color: theme.text }]} numberOfLines={1}>
          {address.label}
        </Text>

        <Text style={addrCardStyles.street} numberOfLines={2}>
          {address.line1 || address.street}
        </Text>

        <Text style={addrCardStyles.city} numberOfLines={1}>
          {address.city}
        </Text>
      </View>
    )}
  </TouchableOpacity>
  );
}

const addrCardStyles = StyleSheet.create({
  card: {
    width: 155,
    borderRadius: 16,
    backgroundColor: "#0F2318",
    padding: 14,
    marginRight: 12,
    position: "relative",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  label: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  street: { fontSize: 12, color: "#e0e0e0", lineHeight: 16 },
  city: { fontSize: 12, color: "#e3dede", marginTop: 2 },
  checkDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function BookPickup() {
  const { theme } = useTheme();
  const [note, setNote] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const [deliveryMode, setDeliveryMode] = useState<"same" | "other">("same");
  const [addressType, setAddressType] = useState<"pickup" | "delivery">("pickup");
  const [pickupType, setPickupType] = useState<"today" | "schedule">("today");

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [slot, setSlot] = useState<number>(-1);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [deliveryAddresses, setDeliveryAddresses] = useState<Address[]>([]);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<string>("");

  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[1]);
  const [mapQuery, setMapQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAddress, setPreviewAddress] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [tempNote, setTempNote] = useState("");
  const [addressForm, setAddressForm] = useState({
    label: "home", contactName: "", contactPhone: "", houseNo: "",
    street: "", addressLine2: "", landmark: "", city: "", state: "",
    pincode: "", latitude: "", longitude: "", isActive: true,
  });
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [location, setLocation] = useState({ latitude: 19.076, longitude: 72.8777 });
  const [hasHeavyItems, setHasHeavyItems] = useState(false);
  const { user } = useAuth();
  if (!user) return null;

  const { firstName, lastName, id } = user;
  const auth_id = user?.user?.id ? user?.user?.id : user?.id;
  const phone = "91" + (user?.user?.phone ?? user?.phone ?? "");

  const [couponOpen, setCouponOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<(typeof COUPONS)[number] | null>(null);

  // use your real order subtotal here
  const subtotal = 600;

  const handleApplyCoupon = (coupon: (typeof COUPONS)[number]) => {
    if (appliedCoupon?.code === coupon.code) {
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(coupon);
    }
    setCouponOpen(false);
  };
  // ─── All original handlers (untouched) ──────────────────────────────────────

  const navigateHomeWithSuccess = () => {
    router.replace({ pathname: "/(customer)/(tabs)/home", params: { orderPlaced: "1" } });
  };

  const openAddressPreview = (addr: any) => { setPreviewAddress(addr); setPreviewOpen(true); };

  const goBackSafe = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(customer)/(tabs)/home");
  };

  const openSuccessModal = (msg: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSuccessMessage(msg);
    setSuccessOpen(true);
    scaleAnim.setValue(0.6);
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    setTimeout(() => { setSuccessOpen(false); navigateHomeWithSuccess(); }, 2500);
  };

  useEffect(() => {
    const kbShow = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setKeyboardVisible(true));
    const kbHide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setKeyboardVisible(false));
    return () => { kbShow.remove(); kbHide.remove(); };
  }, []);

  useEffect(() => {
    if (!mapQuery.trim()) return;
    const timer = setTimeout(() => searchOnMap(), 700);
    return () => clearTimeout(timer);
  }, [mapQuery]);

  const isToday = (d: Date) => {
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };
  const formatDateLabel = (d: Date) => isToday(d) ? "Today" : d.toDateString();
  const formatDateForApi = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const confirmPickup = async () => {

    // if (hasHeavyItems) {
    //   order_details.heavyItems = true;
    // }
    if (confirmLoading) return;
    try {
      setConfirmLoading(true);
      if (!selectedAddressId) { Alert.alert("Missing Pickup Address", "Please select pickup address."); return; }
      const deliveryId = deliveryMode === "same" ? selectedAddressId : selectedDeliveryAddressId;
      if (!deliveryId) { Alert.alert("Missing Delivery Address", "Please select delivery address."); return; }
      const scheduledDate = pickupType === "today" ? new Date() : date;
      const selectedSlot = pickupType === "schedule" && slot !== -1 ? TIME_SLOTS[slot] : undefined;
      const order_details: any = {
        firstName, lastName, contact: phone, appCustomerId: auth_id,
        tempPickupAdresssId: selectedAddressId, tempDeliveryAddressId: deliveryId,
        date: formatDateForApi(scheduledDate),
      };
      if (selectedSlot) order_details.slot = selectedSlot;
      if (note?.trim()) order_details.note = note.trim();
      await createOrderApi(order_details);
      if (pickupType === "today") openSuccessModal("Sit & relax 😌\nYour pickup will be collected shortly!");
      else openSuccessModal("Pickup scheduled successfully ✅");
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to create order");
    } finally {
      setConfirmLoading(false);
    }
  };

  const getPickupAddr = async () => {
    try {
      const data = await getAddressApi(auth_id);
      const list = Array.isArray(data?.results) ? data.results : [];
      const mappedList = list.map(mapApiAddressToUI);
      const pickupList = mappedList.filter((a: any) => a.addressType === "PICKUP");
      const deliveryList = mappedList.filter((a: any) => a.addressType === "DELIVERY");
      setAddresses(pickupList);
      setDeliveryAddresses(deliveryList);
      setSelectedAddressId(pickupList?.[0]?.id || "");
      setSelectedDeliveryAddressId(deliveryList?.[0]?.id || "");
    } catch (err) {
      setAddresses([]); setDeliveryAddresses([]);
      setSelectedAddressId(""); setSelectedDeliveryAddressId("");
    }
  };

  useEffect(() => { getPickupAddr(); }, []);

  useEffect(() => {
    if (pickupType === "today") { setDate(new Date()); setSlot(-1); }
    else { const t = new Date(); t.setDate(t.getDate() + 1); setDate(t); setSlot(-1); }
  }, [pickupType]);

  const fetchCurrentLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setLocLoading(false); Alert.alert("Permission denied", "Please allow location access from settings."); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(coords);
      const geo = await Location.reverseGeocodeAsync(coords);
      if (geo && geo.length > 0) {
        const g = geo[0];
        setAddressForm(p => ({ ...p, houseNo: "", street: g.streetNumber || g.name || "", landmark: g.district || "", city: g.city || g.subregion || "", state: g.region || "", pincode: g.postalCode || "", latitude: String(coords.latitude), longitude: String(coords.longitude) }));
      }
    } catch (e: any) { Alert.alert("Location error", e?.message || "Unable to fetch current location"); }
    finally { setLocLoading(false); }
  };

  const searchOnMap = async (query?: string) => {
    const q = query ?? mapQuery;
    if (!q.trim()) return;
    try {
      setSearchLoading(true);
      const results = await Location.geocodeAsync(mapQuery);
      if (results && results.length > 0) {
        const coords = { latitude: results[0].latitude, longitude: results[0].longitude };
        setLocation(coords);
        setAddressForm(p => ({ ...p, latitude: String(coords.latitude), longitude: String(coords.longitude) }));
        const geo = await Location.reverseGeocodeAsync(coords);
        if (geo && geo.length > 0) {
          const g = geo[0];
          setAddressForm(p => ({ ...p, houseNo: g.name ?? "", street: g.street ?? "", landmark: g.district ?? "", city: g.city ?? "", state: g.region ?? "", pincode: g.postalCode ?? "", latitude: String(coords.latitude), longitude: String(coords.longitude) }));
        }
      } else { Alert.alert("Not found", "No location found for this search."); }
    } catch (e) { Alert.alert("Search failed", "Unable to search this place."); }
    finally { setSearchLoading(false); }
  };

  useEffect(() => {
    if (addModalOpen) {
      setAddressForm({ label: "home", contactName: "", contactPhone: "", houseNo: "", street: "", addressLine2: "", landmark: "", city: "", state: "", pincode: "", latitude: "", longitude: "", isActive: true });
      fetchCurrentLocation();
    }
  }, [addModalOpen]);

  const saveAddress = async () => {
    try {
      const label = addressForm.label === "home" ? "Home" : addressForm.label === "work" ? "Office" : "Other";
      const payload: any = {
        label, addressLine1: `${addressForm.houseNo}, ${addressForm.street}`.trim(),
        landmark: addressForm.landmark, city: addressForm.city, state: addressForm.state,
        country: "India", pincode: addressForm.pincode,
        latitude: Number(addressForm.latitude), longitude: Number(addressForm.longitude),
        addressType: addressType === "pickup" ? "PICKUP" : "DELIVERY",
      };
      if (addressForm.contactName?.trim()) payload.contactName = addressForm.contactName.trim();
      if (addressForm.contactPhone?.trim()) payload.contactPhone = addressForm.contactPhone.trim();
      if (addressForm.addressLine2?.trim()) payload.addressLine2 = addressForm.addressLine2.trim();
      await saveAddressApi(payload);
      await getPickupAddr();
      setAddModalOpen(false);
      Alert.alert("Success", "Address saved successfully!");
    } catch (err: any) { Alert.alert("Error", err?.message || "Failed to save address"); }
  };

  // ─── Derived data for date strip ─────────────────────────────────────────────
  const nextDays = getNextDays(30);
  const selectedDeliveryAddr = deliveryMode === "same"
    ? addresses.find(a => a.id === selectedAddressId)
    : deliveryAddresses.find(a => a.id === selectedDeliveryAddressId);
  const selectedPickupAddr = addresses.find(a => a.id === selectedAddressId);

  
  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <View style={[s.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={[s.safe, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 75 + insets.top : 0}
      >
        {/* ── FIXED HEADER ── */}
        <View style={[s.header, { paddingTop: insets.top + 12, backgroundColor: theme.background }]}>
          <TouchableOpacity onPress={goBackSafe} hitSlop={10} style={s.headerBack}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: theme.text }]}>Schedule Pickup</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={[s.scrollContent, { paddingTop: 60 + insets.top }]}
        >
          {/* ── PICKUP SCHEDULE TABS ── */}
          <View style={s.section}>
            {/* <Text style={s.sectionLabel}>PICKUP SCHEDULE</Text> */}
            <View style={[s.tabRow, { backgroundColor: "#0A1F14" }]}>
              <TouchableOpacity
                onPress={() => setPickupType("today")}
                style={[s.tab, pickupType === "today" && { borderColor: theme.primary, backgroundColor: "#0A1F14" }]}
                activeOpacity={0.8}
              >
                <Text style={[s.tabText, { color: pickupType === "today" ? theme.primary : "#4E7060" }]}>
                  Today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPickupType("schedule")}
                style={[s.tab, pickupType === "schedule" && { borderColor: theme.primary, backgroundColor: "#0A1F14" }]}
                activeOpacity={0.8}
              >
                <Text style={[s.tabText, { color: pickupType === "schedule" ? theme.primary : "#4E7060" }]}>
                  Schedule
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ══════════════════ TODAY VIEW ══════════════════ */}
          {pickupType === "today" && (
            <>
              {/* PICKUP FROM */}
              <View style={s.section}>
                <View style={s.rowBetween}>
                  <Text style={s.sectionLabel}>PICKUP FROM</Text>
                  <TouchableOpacity onPress={() => { setAddModalOpen(true); setAddressType("pickup"); }}>
                    <Text style={[s.addLink, { color: theme.primary }]}>+ Add New</Text>
                  </TouchableOpacity>
                </View>

                {addresses.length === 0 ? (
                  <TouchableOpacity
                    onPress={() => {
                      setAddModalOpen(true);
                      setAddressType("pickup");
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={theme.gradient} // ✅ your gradient here
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        s.emptyAddrBtn,
                        { borderColor: theme.primary + "44" },
                      ]}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color={theme.primary}
                      />
                      <Text style={[s.emptyAddrText, { color: theme.primary }]}>
                        Add pickup address
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                    {addresses.map(addr => (
                      <AddressCard
                        key={addr.id}
                        address={addr}
                        selected={addr.id === selectedAddressId}
                        onPress={() => setSelectedAddressId(addr.id)}
                        theme={theme}
                      />
                    ))}
                    {/* Add more card */}
                    <TouchableOpacity
                      style={[addrCardStyles.card, { borderColor: theme.primary + "33", borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center" }]}
                      onPress={() => { setAddModalOpen(true); setAddressType("pickup"); }}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle-outline" size={28} color={theme.primary} />
                      <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "700", marginTop: 6 }}>Add New</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
              </View>

              {/* DELIVERY ADDRESS TOGGLE */}
              <LinearGradient
                colors={theme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.card}
              >
                <View style={s.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.cardTitle, { color: theme.text }]}>Delivery Address</Text>
                    <Text style={s.cardSub}>Same as pickup location?</Text>
                  </View>
                  <Switch
                    value={deliveryMode === "same"}
                    onValueChange={v => setDeliveryMode(v ? "same" : "other")}
                    trackColor={{ false: "#1E3327", true: theme.primary }}
                    thumbColor={deliveryMode === "same" ? "#fff" : "#4E7060"}
                  />
                </View>

                {/* Delivery address dropdown when "other" */}
                {deliveryMode === "other" && (
                  <View style={{ marginTop: 16 }}>
                    <View style={s.rowBetween}>
                      <Text style={s.sectionLabel}>SELECT SAVED ADDRESS</Text>
                      <TouchableOpacity onPress={() => { setAddModalOpen(true); setAddressType("delivery"); }}>
                        <Text style={[s.addLink, { color: theme.primary }]}>+ Add New</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={[s.dropdown, { backgroundColor: "#0A1A10", borderColor: "#1E3327" }]}
                      onPress={() => setShowDeliveryPicker(!showDeliveryPicker)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="location-outline" size={18} color={theme.primary} style={{ marginRight: 10 }} />
                      <Text style={[s.dropdownText, { color: theme.text, flex: 1 }]}>
                        {deliveryAddresses.find(a => a.id === selectedDeliveryAddressId)?.label || "Select address"}
                      </Text>
                      <Ionicons name={showDeliveryPicker ? "chevron-up" : "chevron-down"} size={18} color="#4E7060" />
                    </TouchableOpacity>

                    {showDeliveryPicker && (
                      <View style={[s.pickerList, { backgroundColor: "#0A1A10", borderColor: "#1E3327" }]}>
                        {deliveryAddresses.map(addr => (
                          <TouchableOpacity
                            key={addr.id}
                            style={[s.pickerItem, addr.id === selectedDeliveryAddressId && { backgroundColor: theme.primary + "18" }]}
                            onPress={() => { setSelectedDeliveryAddressId(addr.id); setShowDeliveryPicker(false); }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name={addr.label?.toLowerCase() === "home" ? "home-outline" : "briefcase-outline"} size={16} color={addr.id === selectedDeliveryAddressId ? theme.primary : "#4E7060"} style={{ marginRight: 10 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={[s.pickerItemLabel, { color: addr.id === selectedDeliveryAddressId ? theme.primary : theme.text }]}>{addr.label}</Text>
                              <Text style={s.pickerItemSub} numberOfLines={1}>{addr.line1}, {addr.city}</Text>
                            </View>
                            {addr.id === selectedDeliveryAddressId && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </LinearGradient>

              <View style={s.section}>
                <Text style={s.sectionLabel}>ADDITIONAL INFO</Text>

                <TouchableOpacity
                  onPress={() => setHasHeavyItems(!hasHeavyItems)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: hasHeavyItems ? theme.primary : "#1E3327",
                    backgroundColor: "#0F2318",
                  }}
                >
                  <Ionicons
                    name={hasHeavyItems ? "checkbox" : "square-outline"}
                    size={20}
                    color={hasHeavyItems ? theme.primary : "#4E7060"}
                  />

                  <Text
                    style={{
                      marginLeft: 10,
                      fontWeight: "700",
                      color: hasHeavyItems ? theme.primary : theme.text,
                    }}
                  >
                    I have heavy items (blankets, curtains, etc.)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* APPLIED OFFERS */}
              <View style={s.section}>
                <View style={s.rowBetween}>
                  <Text style={s.sectionLabel}>APPLIED OFFERS</Text>
                  <TouchableOpacity onPress={() => setCouponOpen(true)}>
                    <Text style={[s.addLink, { color: theme.primary }]}>
                      + Add Coupon
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[s.offerCard, { backgroundColor: "#0F2318", borderColor: "#1E3327" }]}
                  activeOpacity={0.85}
                  onPress={() => setCouponOpen(true)}
                >
                  <View style={[s.offerIconWrap, { backgroundColor: "#1A2C22" }]}>
                    <Ionicons name="pricetag" size={18} color={theme.primary} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={[s.offerCode, { color: theme.text }]}>
                        {appliedCoupon?.code || "Tap to apply coupon"}
                      </Text>

                      {appliedCoupon && (
                        <View style={[s.promoBadge, { backgroundColor: theme.primary + "22" }]}>
                          <Text style={[s.promoText, { color: theme.primary }]}>
                            APPLIED
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={s.offerDesc}>
                      {appliedCoupon
                        ? appliedCoupon.description
                        : "Choose from available coupons"}
                    </Text>
                  </View>

                  <View style={[s.appliedBtn, { backgroundColor: theme.primary + "15", borderColor: theme.primary + "44" }]}>
                    <Text style={[s.appliedText, { color: theme.primary }]}>
                      {appliedCoupon ? "Change" : "Open"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>


              {/* SPECIAL INSTRUCTIONS */}
              <View style={s.section}>
                <Text style={s.sectionLabel}>SPECIAL INSTRUCTIONS</Text>
                <TouchableOpacity
                  style={[s.noteBox, { backgroundColor: "#0F2318", borderColor: "#1E3327" }]}
                  onPress={() => { setTempNote(note); setNotesModalOpen(true); }}
                  activeOpacity={0.85}
                >
                  <Text style={[s.notePlaceholder, note ? { color: theme.text } : { color: "#3D6050" }]}>
                    {note || "E.g. Code 1234, leave with concierge, use scent-free detergent"}
                  </Text>
                  <View style={s.noteTagRow}>
                    {["FRAGILE", "ECO-WASH"].map(tag => (
                      <View key={tag} style={[s.noteTag, { backgroundColor: "#1A2C22", borderColor: "#2A4A34" }]}>
                        <Text style={[s.noteTagText, { color: "#6B9E7E" }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ══════════════════ SCHEDULE VIEW ══════════════════ */}
          {pickupType === "schedule" && (
            <>
              {/* SELECT DATE */}
              <View style={s.section}>
                <View style={s.rowBetween}>
                  <View>
                    <Text style={[s.bigHeading, { color: theme.text }]}>Select Date</Text>
                    <Text style={s.bigSubtitle}>Pick a day for your laundry collection</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.monthLabel}>MONTH</Text>
                    <Text style={[s.monthName, { color: theme.primary }]}>
                      {MONTH_NAMES[date.getMonth()]}
                    </Text>
                  </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 20 }}>
                  {nextDays.map((d, i) => {
                    const isSelected = d.toDateString() === date.toDateString();
                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => { setDate(d); setSlot(-1); }}
                        style={[s.dateCell, isSelected && { backgroundColor: theme.primary + "15" }]}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.dateDayName, { color: isSelected ? theme.primary : "#4E7060" }]}>
                          {DAY_NAMES[d.getDay()]}
                        </Text>
                        <Text style={[s.dateNum, { color: isSelected ? theme.primary : theme.text }]}>
                          {d.getDate()}
                        </Text>
                        <View style={[s.dateDot, { backgroundColor: isSelected ? theme.primary : "transparent" }]} />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* PICK TIME */}
              <View style={s.section}>
                <Text style={[s.bigHeading, { color: theme.text }]}>Pick Time</Text>
                <Text style={s.bigSubtitle}>Our agents are available in 2-hour windows</Text>

                {TIME_GROUPS.map(group => (
                  <View key={group.label} style={{ marginTop: 18 }}>
                    <View style={s.timeGroupHeader}>
                      <Text style={s.timeGroupEmoji}>{group.emoji}</Text>
                      <Text style={s.timeGroupLabel}>{group.label}</Text>
                    </View>
                    <View style={s.slotRow}>
                      {group.slots.map(idx => {
                        const isActive = slot === idx;
                        return (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => setSlot(idx)}
                            style={[s.slotChip, {
                              backgroundColor: isActive ? theme.primary + "18" : "#0F2318",
                              borderColor: isActive ? theme.primary : "#1E3327",
                            }]}
                            activeOpacity={0.8}
                          >
                            <Text style={[s.slotText, { color: isActive ? theme.primary : "#7A9B87" }]}>
                              {TIME_SLOTS[idx]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>

              {/* SERVICE ROUTE */}
              <View style={s.section}>
                <Text style={[s.bigHeading, { color: theme.text }]}>Service Route</Text>
                <Text style={s.bigSubtitle}>Confirm your pickup and drop-off points</Text>

                <View style={[s.routeCard, { backgroundColor: "#0F2318", borderColor: "#1E3327" }]}>
                  {/* Pickup point */}
                  <View style={s.routeRow}>
                    <View style={[s.routeIconWrap, { backgroundColor: "#1A2C22" }]}>
                      <Ionicons name="home-outline" size={16} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.routeTag}>PICKUP FROM</Text>
                      <Text style={[s.routeAddrLabel, { color: theme.text }]}>
                        {selectedPickupAddr?.label || "No address selected"}
                      </Text>
                      <Text style={s.routeAddrDetail} numberOfLines={2}>
                        {selectedPickupAddr ? `${selectedPickupAddr.line1 || selectedPickupAddr.street}, ${selectedPickupAddr.city}` : ""}
                      </Text>
                    </View>
                  </View>

                  {/* Connector line */}
                  <View style={s.routeConnector}>
                    <View style={[s.connectorLine, { backgroundColor: "#1E3327" }]} />
                  </View>

                  {/* Delivery point */}
                  <View style={s.routeRow}>
                    <View style={[s.routeIconWrap, { backgroundColor: "#1A2C22" }]}>
                      <Ionicons name="briefcase-outline" size={16} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.routeTag}>DELIVER TO</Text>
                      <Text style={[s.routeAddrLabel, { color: theme.text }]}>
                        {selectedDeliveryAddr?.label || "Same as pickup"}
                      </Text>
                      <Text style={s.routeAddrDetail} numberOfLines={2}>
                        {selectedDeliveryAddr ? `${selectedDeliveryAddr.line1 || selectedDeliveryAddr.street}, ${selectedDeliveryAddr.city}` : ""}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Edit addresses row */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <TouchableOpacity style={[s.editAddrBtn, { borderColor: "#1E3327" }]} onPress={() => { setAddModalOpen(true); setAddressType("pickup"); }} activeOpacity={0.8}>
                    <Ionicons name="location-outline" size={14} color="#4E7060" />
                    <Text style={s.editAddrText}>Edit Pickup</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.editAddrBtn, { borderColor: "#1E3327" }]} onPress={() => { setAddModalOpen(true); setAddressType("delivery"); }} activeOpacity={0.8}>
                    <Ionicons name="navigate-outline" size={14} color="#4E7060" />
                    <Text style={s.editAddrText}>Edit Delivery</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.section}>
                <Text style={s.sectionLabel}>ADDITIONAL INFO</Text>

                <TouchableOpacity
                  onPress={() => setHasHeavyItems(!hasHeavyItems)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: hasHeavyItems ? theme.primary : "#1E3327",
                    backgroundColor: "#0F2318",
                  }}
                >
                  <Ionicons
                    name={hasHeavyItems ? "checkbox" : "square-outline"}
                    size={20}
                    color={hasHeavyItems ? theme.primary : "#4E7060"}
                  />

                  <Text
                    style={{
                      marginLeft: 10,
                      fontWeight: "700",
                      color: hasHeavyItems ? theme.primary : theme.text,
                    }}
                  >
                    I have heavy items (blankets, curtains, etc.)
                  </Text>
                </TouchableOpacity>
              </View>
              {/* APPLIED OFFERS */}
              <View style={s.section}>
                <View style={s.rowBetween}>
                  <Text style={s.sectionLabel}>APPLIED OFFERS</Text>
                  <TouchableOpacity onPress={() => setCouponOpen(true)}>
                    <Text style={[s.addLink, { color: theme.primary }]}>
                      + Add Coupon
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[s.offerCard, { backgroundColor: "#0F2318", borderColor: "#1E3327" }]}
                  activeOpacity={0.85}
                  onPress={() => setCouponOpen(true)}
                >
                  <View style={[s.offerIconWrap, { backgroundColor: "#1A2C22" }]}>
                    <Ionicons name="pricetag" size={18} color={theme.primary} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={[s.offerCode, { color: theme.text }]}>
                        {appliedCoupon?.code || "Tap to apply coupon"}
                      </Text>

                      {appliedCoupon && (
                        <View style={[s.promoBadge, { backgroundColor: theme.primary + "22" }]}>
                          <Text style={[s.promoText, { color: theme.primary }]}>
                            APPLIED
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={s.offerDesc}>
                      {appliedCoupon
                        ? appliedCoupon.description
                        : "Choose from available coupons"}
                    </Text>
                  </View>

                  <View style={[s.appliedBtn, { backgroundColor: theme.primary + "15", borderColor: theme.primary + "44" }]}>
                    <Text style={[s.appliedText, { color: theme.primary }]}>
                      {appliedCoupon ? "Change" : "Open"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── CONFIRM BUTTON ── */}
          <View style={[s.footer, { backgroundColor: theme.background }]}>
            {pickupType === "schedule" && slot !== -1 && (
              <View style={s.estimatedRow}>
                <Ionicons name="time-outline" size={14} color="#4E7060" />
                <Text style={s.estimatedText}>
                  ESTIMATED PICKUP: {formatDateLabel(date).toUpperCase()}, {TIME_SLOTS[slot]}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[s.confirmBtn, { backgroundColor: theme.primary, opacity: confirmLoading ? 0.7 : 1 }]}
              onPress={confirmPickup}
              activeOpacity={0.9}
              disabled={confirmLoading}
            >
              {confirmLoading
                ? <Ionicons name="sync" size={20} color="#000" style={{ marginRight: 8 }} />
                : null}
              <Text style={s.confirmText}>
                {confirmLoading ? "Booking..." : pickupType === "today" ? "Confirm Booking" : "Confirm Pickup"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ══════════════════ NOTES MODAL ══════════════════ */}
        <Modal visible={notesModalOpen} animationType="slide" transparent onRequestClose={() => setNotesModalOpen(false)}>
          <KeyboardAvoidingView style={ms.backdrop} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <TouchableWithoutFeedback onPress={() => setNotesModalOpen(false)}>
              <View style={ms.backdrop}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={[ms.notesSheet, { backgroundColor: "#0F2318" }]}>
                    <View style={ms.sheetHandle} />
                    <View style={ms.sheetHeader}>
                      <View>
                        <Text style={[ms.sheetTitle, { color: "#fff" }]}>Special Instructions</Text>
                        <Text style={ms.sheetSub}>Add any special requests or notes</Text>
                      </View>
                      <TouchableOpacity onPress={() => setNotesModalOpen(false)} style={[ms.closeBtn, { backgroundColor: "#1A2C22" }]}>
                        <Ionicons name="close" size={20} color="#7A9B87" />
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      placeholder="e.g., Call before arrival, Ring doorbell twice..."
                      placeholderTextColor="#3D6050"
                      value={tempNote}
                      onChangeText={setTempNote}
                      multiline autoFocus
                      style={[ms.notesInput, { backgroundColor: "#0A1A10", color: "#fff", borderColor: "#1E3327" }]}
                    />

                    <Text style={ms.suggestLabel}>Quick Suggestions</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {["Call before arrival", "Ring doorbell twice", "Leave at door", "Building security required"].map(s => (
                        <TouchableOpacity key={s} onPress={() => setTempNote(p => p.trim() ? p + ", " + s : s)} style={[ms.suggestChip, { backgroundColor: "#1A2C22", borderColor: "#2A4A34" }]}>
                          <Text style={{ fontSize: 12, fontWeight: "600", color: "#7A9B87" }}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
                      <TouchableOpacity onPress={() => { setTempNote(""); setNote(""); setNotesModalOpen(false); }} style={[ms.clearBtn, { backgroundColor: "#1A2C22", borderColor: "#2A4A34" }]}>
                        <Text style={{ fontWeight: "800", color: "#7A9B87" }}>Clear</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setNote(tempNote); setNotesModalOpen(false); }} style={[ms.saveBtn, { backgroundColor: theme.primary }]}>
                        <Ionicons name="checkmark-circle" size={18} color="#000" />
                        <Text style={{ marginLeft: 6, fontWeight: "900", color: "#000" }}>Save Instructions</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

        {/* ══════════════════ ADD ADDRESS MODAL ══════════════════ */}
        <Modal visible={addModalOpen} animationType="slide" transparent>
          <KeyboardAvoidingView style={ms.backdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[ms.addSheet, { backgroundColor: "#0F2318" }]}>
                <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  <View style={ms.sheetHandle} />
                  <View style={ms.sheetHeader}>
                    <View>
                      <Text style={[ms.sheetTitle, { color: "#fff" }]}>Add New Address</Text>
                      <Text style={ms.sheetSub}>{addressType === "pickup" ? "Pickup Location" : "Delivery Location"}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setAddModalOpen(false)} style={[ms.closeBtn, { backgroundColor: "#1A2C22" }]}>
                      <Ionicons name="close" size={20} color="#7A9B87" />
                    </TouchableOpacity>
                  </View>

                  {/* MAP */}
                  <View style={ms.mapContainer}>
                    <View style={ms.mapSearchBox}>
                      <Ionicons name="search" size={18} color="#666" />
                      <TextInput placeholder="Search location..." placeholderTextColor="#999" value={mapQuery} onChangeText={setMapQuery} returnKeyType="search" style={ms.mapSearchInput} />
                      {searchLoading
                        ? <Ionicons name="sync" size={18} color={theme.primary} />
                        : <TouchableOpacity onPress={() => searchOnMap(mapQuery)}><Ionicons name="arrow-forward-circle" size={28} color={theme.primary} /></TouchableOpacity>}
                    </View>
                    <PickupMap location={location} onSelect={c => { setLocation(c); setAddressForm(p => ({ ...p, latitude: String(c.latitude), longitude: String(c.longitude) })); }} />
                    <TouchableOpacity onPress={fetchCurrentLocation} disabled={locLoading} style={[ms.currentLocBtn, { backgroundColor: theme.primary, opacity: locLoading ? 0.8 : 1 }]}>
                      <Ionicons name={locLoading ? "sync" : "locate"} size={16} color="#000" />
                      <Text style={ms.currentLocText}>{locLoading ? "Fetching..." : "Use Current Location"}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* LABEL TABS */}
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 16, marginBottom: 12 }}>
                    {[{ key: "home", text: "Home", icon: "home" }, { key: "work", text: "Work", icon: "briefcase" }, { key: "other", text: "Others", icon: "location" }].map(item => {
                      const active = addressForm.label === item.key;
                      return (
                        <TouchableOpacity key={item.key} onPress={() => setAddressForm(p => ({ ...p, label: item.key }))} style={[ms.labelTab, { backgroundColor: active ? theme.primary : "#1A2C22", borderColor: active ? theme.primary : "#2A4A34" }]} activeOpacity={0.85}>
                          <Ionicons name={item.icon as any} size={15} color={active ? "#000" : "#7A9B87"} />
                          <Text style={{ marginLeft: 5, fontWeight: "800", fontSize: 13, color: active ? "#000" : "#7A9B87" }}>{item.text}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* FORM FIELDS */}
                  {[
                    { key: "contactName", placeholder: "Contact Name (Optional)" },
                    { key: "contactPhone", placeholder: "Contact Phone (Optional)", keyboard: "phone-pad" as any },
                    { key: "houseNo", placeholder: "House No / Flat" },
                    { key: "street", placeholder: "Street" },
                    { key: "landmark", placeholder: "Landmark" },
                    { key: "addressLine2", placeholder: "Address Line 2 (Optional)" },
                  ].map(field => (
                    <TextInput key={field.key} placeholder={field.placeholder} placeholderTextColor="#3D6050" value={(addressForm as any)[field.key]} keyboardType={field.keyboard} onChangeText={t => setAddressForm(p => ({ ...p, [field.key]: t }))} style={[ms.formInput, { backgroundColor: "#0A1A10", color: "#fff", borderColor: "#1E3327" }]} />
                  ))}

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput placeholder="City" placeholderTextColor="#3D6050" value={addressForm.city} onChangeText={t => setAddressForm(p => ({ ...p, city: t }))} style={[ms.formInputHalf, { backgroundColor: "#0A1A10", color: "#fff", borderColor: "#1E3327" }]} />
                    <TextInput placeholder="State" placeholderTextColor="#3D6050" value={addressForm.state} onChangeText={t => setAddressForm(p => ({ ...p, state: t }))} style={[ms.formInputHalf, { backgroundColor: "#0A1A10", color: "#fff", borderColor: "#1E3327" }]} />
                  </View>

                  <TextInput placeholder="Pincode" placeholderTextColor="#3D6050" value={addressForm.pincode} onChangeText={t => setAddressForm(p => ({ ...p, pincode: t }))} keyboardType="number-pad" style={[ms.formInput, { backgroundColor: "#0A1A10", color: "#fff", borderColor: "#1E3327" }]} />

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput placeholder="Latitude" placeholderTextColor="#3D6050" value={addressForm.latitude} editable={false} style={[ms.formInputHalf, { backgroundColor: "#071A0E", color: "#4E7060", borderColor: "#1E3327" }]} />
                    <TextInput placeholder="Longitude" placeholderTextColor="#3D6050" value={addressForm.longitude} editable={false} style={[ms.formInputHalf, { backgroundColor: "#071A0E", color: "#4E7060", borderColor: "#1E3327" }]} />
                  </View>

                  <TouchableOpacity style={[ms.saveAddrBtn, { backgroundColor: theme.primary }]} onPress={saveAddress} activeOpacity={0.9}>
                    <Ionicons name="checkmark-circle" size={18} color="#000" />
                    <Text style={{ marginLeft: 8, fontWeight: "900", fontSize: 15, color: "#000" }}>Save Address</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>

        {/* ══════════════════ PREVIEW ADDRESS MODAL ══════════════════ */}
        <Modal visible={previewOpen} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setPreviewOpen(false)}>
            <View style={ms.centeredOverlay}>
              <TouchableWithoutFeedback>
                <View style={[ms.previewCard, { backgroundColor: "#0F2318" }]}>
                  <View style={ms.sheetHeader}>
                    <Text style={[ms.sheetTitle, { color: "#fff" }]}>Address Preview</Text>
                    <TouchableOpacity onPress={() => setPreviewOpen(false)} style={[ms.closeBtn, { backgroundColor: "#1A2C22" }]}>
                      <Ionicons name="close" size={20} color="#7A9B87" />
                    </TouchableOpacity>
                  </View>
                  {previewAddress ? (
                    <>
                      <Text style={{ fontWeight: "800", fontSize: 16, color: "#fff", marginTop: 10 }}>{previewAddress.label}</Text>
                      <Text style={{ marginTop: 8, color: "#7A9B87", fontSize: 14 }}>{previewAddress.addressLine1 || previewAddress.line1 || previewAddress.street}</Text>
                      {previewAddress.landmark ? <Text style={{ marginTop: 4, color: "#7A9B87", fontSize: 14 }}>Landmark: {previewAddress.landmark}</Text> : null}
                      <Text style={{ marginTop: 4, color: "#7A9B87", fontSize: 14 }}>{previewAddress.city}, {previewAddress.state} • {previewAddress.pincode}</Text>
                      {previewAddress.contactName ? <Text style={{ marginTop: 10, color: "#fff", fontSize: 14 }}>Contact: {previewAddress.contactName}</Text> : null}
                      {previewAddress.contactPhone ? <Text style={{ marginTop: 2, color: "#fff", fontSize: 14 }}>Phone: {previewAddress.contactPhone}</Text> : null}
                      <TouchableOpacity onPress={() => setPreviewOpen(false)} style={[ms.saveAddrBtn, { backgroundColor: theme.primary, marginTop: 16 }]}>
                        <Text style={{ fontWeight: "900", color: "#000" }}>Close</Text>
                      </TouchableOpacity>
                    </>
                  ) : <Text style={{ color: "#7A9B87" }}>No address selected</Text>}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* ══════════════════ SUCCESS MODAL ══════════════════ */}
        <Modal visible={successOpen} transparent animationType="fade">
          <View style={ms.centeredOverlay}>
            <Animated.View style={[ms.successCard, { backgroundColor: "#0F2318", opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }]}>
              <Image source={require("@/assets/images/logo/greenLogo.png")} style={{ width: 80, height: 80, resizeMode: "contain", marginBottom: 8 }} />
              <Animated.View style={[ms.successCheck, { backgroundColor: theme.primary, transform: [{ scale: scaleAnim }] }]}>
                <Ionicons name="checkmark" size={36} color="#000" />
              </Animated.View>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff", textAlign: "center", marginTop: 12 }}>{successMessage}</Text>
              <TouchableOpacity onPress={() => { setSuccessOpen(false); navigateHomeWithSuccess(); }} style={[ms.saveAddrBtn, { backgroundColor: theme.primary, marginTop: 16 }]}>
                <Text style={{ fontWeight: "900", color: "#000" }}>Done</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </KeyboardAvoidingView>

      <CouponCard
        visible={couponOpen}
        onClose={() => setCouponOpen(false)}
        onApply={handleApplyCoupon}
        appliedCode={appliedCoupon?.code || ""}
        subtotal={subtotal}
      />
    </View>
  );
}

// ─── Main Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: "#0F2318",
  },
  headerBack: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800" },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  section: { marginBottom: 20 },

  sectionLabel: {
    fontSize: 11, fontWeight: "800", color: "#4E7060",
    letterSpacing: 1.2, marginBottom: 10,
  },

  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  addLink: { fontSize: 13, fontWeight: "700" },

  tabRow: {
    flexDirection: "row", borderRadius: 14,
    borderWidth: 1, borderColor: "#1E3327", overflow: "hidden", marginTop: 10,
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "transparent", borderRadius: 12,
  },
  tabText: { fontSize: 15, fontWeight: "800" },

  card: { borderRadius: 16, padding: 16, marginBottom: 0 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardSub: { fontSize: 12, color: "#BACBC0", marginTop: 3 },

  emptyAddrBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 18, borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed",
    marginTop: 10,
  },
  emptyAddrText: { marginLeft: 8, fontWeight: "700", fontSize: 14 },

  dropdown: {
    flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 12,
    borderWidth: 1.5, marginTop: 10,
  },
  dropdownText: { fontSize: 14, fontWeight: "700" },

  pickerList: {
    borderRadius: 12, borderWidth: 1.5, marginTop: 6, overflow: "hidden",
  },
  pickerItem: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: "#1E3327" },
  pickerItemLabel: { fontSize: 14, fontWeight: "700" },
  pickerItemSub: { fontSize: 12, color: "#4E7060", marginTop: 2 },

  offerCard: {
    flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, borderWidth: 1.5,
  },
  offerIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  offerCode: { fontSize: 16, fontWeight: "900" },
  promoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  promoText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  offerDesc: { fontSize: 12, color: "#BACBC0", marginTop: 3 },
  appliedBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  appliedText: { fontSize: 13, fontWeight: "800" },

  noteBox: { borderRadius: 16, padding: 14, borderWidth: 1.5, minHeight: 80 },
  notePlaceholder: { fontSize: 13, lineHeight: 20 },
  noteTagRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  noteTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  noteTagText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  bigHeading: { fontSize: 26, fontWeight: "900", marginBottom: 4 },
  bigSubtitle: { fontSize: 13, color: "#4E7060" },
  monthLabel: { fontSize: 10, color: "#4E7060", fontWeight: "700", letterSpacing: 1 },
  monthName: { fontSize: 17, fontWeight: "900" },

  dateCell: {
    width: 58, alignItems: "center", paddingVertical: 14, borderRadius: 16,
    marginRight: 10, borderWidth: 1, borderColor: "#1E3327",
  },
  dateDayName: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  dateNum: { fontSize: 24, fontWeight: "900", marginTop: 4 },
  dateDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },

  timeGroupHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  timeGroupEmoji: { fontSize: 16, marginRight: 8 },
  timeGroupLabel: { fontSize: 11, fontWeight: "800", color: "#4E7060", letterSpacing: 1 },
  slotRow: { flexDirection: "row", gap: 10 },
  slotChip: {
    flex: 1, paddingVertical: 16, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1.5,
    alignItems: "center",
  },
  slotText: { fontSize: 13, fontWeight: "700", textAlign: "center" },

  routeCard: { borderRadius: 16, padding: 16, borderWidth: 1.5, marginTop: 14 },
  routeRow: { flexDirection: "row", alignItems: "flex-start" },
  routeIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  routeTag: { fontSize: 10, fontWeight: "800", color: "#4E7060", letterSpacing: 1, marginBottom: 3 },
  routeAddrLabel: { fontSize: 15, fontWeight: "800" },
  routeAddrDetail: { fontSize: 12, color: "#4E7060", marginTop: 2, lineHeight: 16 },
  routeConnector: { paddingLeft: 18, paddingVertical: 6 },
  connectorLine: { width: 1.5, height: 20, marginLeft: 17 },
  editAddrBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  editAddrText: { fontSize: 12, fontWeight: "700", color: "#4E7060", marginLeft: 5 },

  footer: { paddingTop: 10, paddingBottom: 10 },
  estimatedRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginBottom: 10,
  },
  estimatedText: { fontSize: 11, color: "#4E7060", fontWeight: "700", letterSpacing: 0.5 },

  confirmBtn: {
    height: 54, borderRadius: 28, alignItems: "center", justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#00FF88", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  confirmText: { fontSize: 17, fontWeight: "900", color: "#000" },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheetHandle: { width: 40, height: 4, backgroundColor: "#2A4A34", borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  sheetTitle: { fontSize: 20, fontWeight: "900" },
  sheetSub: { fontSize: 12, color: "#4E7060", marginTop: 4 },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },

  notesSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20,
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
    maxHeight: SCREEN_HEIGHT * 0.72,
  },
  notesInput: {
    borderRadius: 14, borderWidth: 1.5, padding: 14,
    minHeight: 140, maxHeight: 190, textAlignVertical: "top",
    fontSize: 14, marginTop: 14, lineHeight: 22,
  },
  suggestLabel: { fontSize: 11, fontWeight: "800", color: "#4E7060", letterSpacing: 0.8, marginTop: 16 },
  suggestChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  clearBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  saveBtn: {
    flex: 2, paddingVertical: 14, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexDirection: "row",
  },

  addSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.93,
  },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.4, minHeight: 260,
    borderRadius: 16, overflow: "hidden", position: "relative", marginBottom: 0,
  },
  mapSearchBox: {
    position: "absolute", top: 12, left: 12, right: 12, zIndex: 20,
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderRadius: 16, paddingHorizontal: 14, height: 42,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  mapSearchInput: { flex: 1, marginHorizontal: 8, fontSize: 14, fontWeight: "600", color: "#000" },
  currentLocBtn: {
    position: "absolute", bottom: 12, alignSelf: "center",
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  currentLocText: { color: "#000", fontWeight: "800", fontSize: 13, marginLeft: 6 },
  labelTab: {
    flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
  },
  formInput: {
    padding: 13, borderRadius: 12, marginBottom: 10,
    fontSize: 14, fontWeight: "500", borderWidth: 1.5,
  },
  formInputHalf: {
    flex: 1, padding: 13, borderRadius: 12, marginBottom: 10,
    fontSize: 14, fontWeight: "500", borderWidth: 1.5,
  },
  saveAddrBtn: {
    paddingVertical: 14, borderRadius: 14, alignItems: "center",
    justifyContent: "center", flexDirection: "row",
  },

  centeredOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center",
    alignItems: "center", padding: 20,
  },
  previewCard: { width: "100%", borderRadius: 20, padding: 18 },
  successCard: {
    width: "100%", maxWidth: 320, borderRadius: 24, padding: 24, alignItems: "center",
    shadowColor: "#00FF88", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
  },
  successCheck: {
    width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", marginTop: 4,
  },
});