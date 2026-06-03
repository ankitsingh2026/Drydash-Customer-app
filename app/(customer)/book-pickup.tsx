import CouponCard from "@/components/CouponCard";
import { fetchAllValidCoupons } from "@/features/coupons/coupons.api";
import PickupMap from "@/components/maps/PickupMap.native";
import { SuccessModal } from "@/components/SuccessModal";
import { useAddress } from "@/context/AddressContext";
import { useCart } from "@/context/CartContext";
import { checkServiceAvailability, getFullServiceData } from "@/features/location/location.api";
import {
  createOrderApi,
  createBookingApi,
  convertSlotTimeFormat,
  getOrdersApi,
  saveAddressApi,
} from "@/features/orders/orders.api";
import { CreatePickupRequest } from "@/features/orders/orders.types";
import { getLocationDetails } from "@/features/location/location.api";
import { getActivePickupOrOrder } from "@/features/pickups/pickup.api";
import { useAuth } from "@/hooks/useAuth";
import { buildPhoneCandidates } from "@/utils/phone";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import { CirclePlus } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {

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
import LocationPickerModal from "../../components/LocationPickerModal";
import { useTheme } from "../../context/ThemeContext";
import { useSlotSocket } from "@/context/SlotSocketContext";
import SlotPicker from "@/components/SlotPicker";
import { showAlert } from "@/components/Customalert";
import { useLocalSearchParams } from "expo-router";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Constants ────────────────────────────────────────────────────

const SERVICE_TYPES = ["Shoe Spa", "Laundry", "Dry Clean"];


// ─── Time slot grouping for UI display ───────────────────────────────────────
const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 21;
const SLOT_DURATION = 3;

const formatHour = (hour: number) => {
  const normalized = hour % 24;
  const suffix = normalized >= 12 ? "PM" : "AM";
  const hour12 = normalized % 12 === 0 ? 12 : normalized % 12;
  return `${hour12}:00 ${suffix}`;
};

const TIME_SLOTS = Array.from(
  { length: SLOT_END_HOUR - SLOT_START_HOUR - SLOT_DURATION + 1 },
  (_, i) => {
    const start = SLOT_START_HOUR + i;
    const end = start + SLOT_DURATION;
    return `${formatHour(start)} - ${formatHour(end)}`;
  },
);

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
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function BookPickup() {
  const { theme } = useTheme();
  const [note, setNote] = useState("");
  const [locLoading, setLocLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const [deliveryMode, setDeliveryMode] = useState<"same" | "other">("same");
  const [addressType, setAddressType] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [pickupType, setPickupType] = useState<"today" | "schedule">("today");

  const [date, setDate] = useState<Date>(new Date());
  const [slot, setSlot] = useState<number>(-1);

  // Service availability states
  const [isServiceAvailable, setIsServiceAvailable] = useState(true);
  const [checkingService, setCheckingService] = useState(true);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [checkingActiveBooking, setCheckingActiveBooking] = useState(true);
  const [isMorningDelivery, setIsMorningDelivery] = useState(true);

  // Use Address Context
  const {
    selectedAddress: contextSelectedAddress,
    allAddresses,
    setSelectedAddress,
    refreshAddresses,
    loading: addressLoading,
    serviceData,
    serviceLoading,
    zoneData,
    currentActiveSlot,
    updateServiceData,
  } = useAddress();

  const { onSlotUpdate } = useSlotSocket();
  useEffect(() => {
    const unsubscribe = onSlotUpdate(() => {
      refreshAddresses();
      updateServiceData(serviceData);
    });
    return unsubscribe;
  }, [refreshAddresses, updateServiceData, serviceData]);

  const [selectedPickupAddressId, setSelectedPickupAddressId] =
    useState<string>("");
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] =
    useState<string>("");

  const [modalMode, setModalMode] = useState<"pickup" | "delivery">("pickup");

  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[1]);
  const [mapQuery, setMapQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAddress, setPreviewAddress] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
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
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(-1);
  const [selectedSlotData, setSelectedSlotData] = useState<any>(null);
  const [hasAvailableSlots, setHasAvailableSlots] = useState(true);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const [location, setLocation] = useState({
    latitude: 19.076,
    longitude: 72.8777,
  });
  const [hasHeavyItems, setHasHeavyItems] = useState(false);
  const { user } = useAuth();

  if (!user) return null;

  const { firstName, lastName } = user;
  const auth_id = user?.user?.id ? user?.user?.id : user?.id;
  const phone = "91" + (user?.user?.phone ?? user?.phone ?? "");
  const phoneCandidates = React.useMemo(
    () => buildPhoneCandidates(user?.user?.phone ?? user?.phone ?? ""),
    [user?.phone, user?.user?.phone],
  );

  const [couponOpen, setCouponOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<"pickup" | "delivery">("pickup");

  const { items, setQty, removeItem, clear } = useCart();
  const preSelectedTimeRef = useRef<string>("");

  const cartSubtotal = items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0,
  );
  console.log(
    "Cart Items in BookPickup =>>>:",
    items,
    "Subtotal =>>>:",
    cartSubtotal,
  );

  // Helper to get best slot from serviceData (API response)
  const getBestSlot = () => {
    if (selectedSlotData) return selectedSlotData;
    if (!serviceData?.data || !serviceData.serviceAvailable) return null;
    if (serviceData.data.activeSlot) return serviceData.data.activeSlot;
    if (serviceData.data.allSlots && serviceData.data.allSlots.length > 0) {
      return serviceData.data.allSlots.find((s: any) => s.enabled) || serviceData.data.allSlots[0];
    }
    return null;
  };

  const { preSelectedSlotIndex, preSelectedSlotTime } = useLocalSearchParams<{
    preSelectedSlotIndex?: string;
    preSelectedSlotTime?: string;
  }>();


  useEffect(() => {
    if (preSelectedSlotTime && preSelectedSlotTime !== "") {
      preSelectedTimeRef.current = preSelectedSlotTime;
      // Also set slot data immediately so the UI hint shows
      setSelectedSlotData({ time: preSelectedSlotTime });
    }
  }, []);

  const getActiveSlot = () => serviceData?.data?.activeSlot || null;

  // Determine display color
  const getServiceColor = () => {
    if (serviceLoading) return "#2FE6A6";
    const bestSlot = getBestSlot();
    if (bestSlot) return "#2FE6A6";

    if (serviceData?.message === "Zone not configured" || !serviceData?.data?.zoneInfo) {
      return "#FF6B6B";
    }

    return "#FFA500";
  };

  // Get text for non‑slot cases
  const getDisplayText = () => {
    if (serviceLoading) return "Checking...";

    if (!serviceData) {
      if (zoneData && !zoneData.zoneFound) return "Not in your area";
      return "Checking...";
    }

    if (serviceData.message === "Zone not configured" || !serviceData.data?.zoneInfo) {
      return "Not in your area";
    }

    if (!serviceData.serviceAvailable || serviceData.data?.allSlots?.length === 0) {
      return "Currently unavailable";
    }

    return "Service unavailable";
  };

  const getDynamicDeliveryLabel = (slot: any) => {
    if (!slot || !slot.deliveryLabel) return "11 AM tomorrow";
    
    const parts = slot.deliveryLabel.split(" by ");
    const labelRelative = parts[0];
    const time = parts[1] || "";
    
    let deliveryDate = new Date();
    if (pickupType === "schedule") {
      deliveryDate = new Date(date);
    }
    
    if (labelRelative.toLowerCase() === "tomorrow") {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    } else if (labelRelative.toLowerCase() !== "today") {
      return slot.deliveryLabel;
    }

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    let dayLabel = "";
    if (deliveryDate.toDateString() === today.toDateString()) {
      dayLabel = "Today";
    } else if (deliveryDate.toDateString() === tomorrow.toDateString()) {
      dayLabel = "Tomorrow";
    } else {
      dayLabel = deliveryDate.toLocaleDateString("en-IN", { weekday: "short" });
    }
    
    return time ? `${dayLabel} by ${time}` : dayLabel;
  };

  // Format slot time and day (Today/Tomorrow)
  const getSlotInfo = () => {
    const slot = getBestSlot();
    if (!slot) return null;

    if (slot.deliveryLabel) {
      const dynamicLabel = getDynamicDeliveryLabel(slot);
      const parts = dynamicLabel.split(" by ");
      if (parts.length === 2) {
        return { dayLabel: parts[0], time: parts[1] };
      }
      return { dayLabel: dynamicLabel, time: "" };
    }

    const startTimeStr = slot.startTime || slot.time?.split(" - ")[0] || "";
    let hour = 0,
      minute = 0;
    const match = startTimeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
    if (match) {
      hour = parseInt(match[1]);
      minute = match[2] ? parseInt(match[2]) : 0;
      const period = match[3].toUpperCase();
      if (period === "PM" && hour !== 12) hour += 12;
      if (period === "AM" && hour === 12) hour = 0;
    } else {
      const simple = startTimeStr.match(/(\d+)(AM|PM)/i);
      if (simple) {
        hour = parseInt(simple[1]);
        minute = 0;
        const period = simple[2].toUpperCase();
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;
      } else {
        return null;
      }
    }

    const now = new Date();
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    let slotDate = new Date();
    slotDate.setHours(hour, minute, 0, 0);

    // If slot time already passed today, it's for tomorrow
    if (slotDate < now) {
      slotDate = new Date(tomorrow);
      slotDate.setHours(hour, minute, 0, 0);
    }

    const isToday = slotDate.toDateString() === today.toDateString();
    const isTomorrow = slotDate.toDateString() === tomorrow.toDateString();

    let dayLabel = "";
    if (isToday) dayLabel = "Today";
    else if (isTomorrow) dayLabel = "Tomorrow";
    else dayLabel = slotDate.toLocaleDateString("en-IN", { weekday: "short" });

    let displayHour = hour % 12;
    if (displayHour === 0) displayHour = 12;
    const period = hour >= 12 ? "pm" : "am";
    const timeString = `${displayHour} ${period}`;

    return { dayLabel, time: timeString };
  };
  const calculateDiscount = (coupon: any, subtotal: number) => {
    if (!coupon) return 0;

    const minOrder = Number(coupon.minOrder || 0);
    if (subtotal < minOrder) return 0;

    if (coupon.type === "flat") {
      return Math.min(Number(coupon.discount || 0), subtotal);
    }

    if (coupon.type === "discount") {
      const percentDiscount = (subtotal * Number(coupon.discount || 0)) / 100;
      const maxCap = coupon.maxCap ? Number(coupon.maxCap) : null;
      return maxCap ? Math.min(percentDiscount, maxCap) : percentDiscount;
    }

    return 0;
  };

  const discount = calculateDiscount(appliedCoupon, cartSubtotal);
  const total = Math.max(cartSubtotal + -discount, 0);

  const [modalVisible, setModalVisible] = useState(false);

  const handleApplyCoupon = (coupon: any, action: "apply" | "remove") => {
    if (action === "remove") {
      setAppliedCoupon(null);
      setCouponOpen(false);
      return;
    }
    setAppliedCoupon(coupon);
    setCouponOpen(false);
  };

  // ─── Handlers ──────────────────────────────────────

  const navigateHomeWithSuccess = () => {
    router.replace({
      pathname: "/(customer)/(tabs)/home",
      params: { orderPlaced: "1" },
    });
  };

  const goBackSafe = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(customer)/(tabs)/home");
  };

  const openSuccessModal = (msg: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSuccessMessage(msg);
    setSuccessOpen(true);
  };

  useEffect(() => {
    const kbShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const kbHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      kbShow.remove();
      kbHide.remove();
    };
  }, []);

  // Extract unique service types from cart items
const activeServiceTypes = Array.from(
  new Set(items.map((item: any) => item.type).filter(Boolean))
);
  console.log("Active service types for coupons:", activeServiceTypes);

  useEffect(() => {
    if (couponOpen) {
      loadCoupons();
    }
  }, [couponOpen, cartSubtotal, activeServiceTypes]);

  const loadCoupons = async () => {
    try {
      setCouponLoading(true);
      const res = await fetchAllValidCoupons(cartSubtotal, undefined, activeServiceTypes);
      console.log("COUPONS API RES ===>", res);
      setCoupons(res?.data || res || []);
    } catch (err) {
      console.log("coupon fetch error", err);
      setCoupons([]);
    } finally {
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    if (!mapQuery.trim()) return;
    const timer = setTimeout(() => searchOnMap(), 700);
    return () => clearTimeout(timer);
  }, [mapQuery]);

  // Set pickup address from selected address
  useEffect(() => {
    if (contextSelectedAddress && !selectedPickupAddressId) {
      setSelectedPickupAddressId(contextSelectedAddress.id);
    }
  }, [contextSelectedAddress]);

  // Check service availability for selected address
  useEffect(() => {
    checkServiceForSelectedAddress();
  }, [selectedPickupAddressId, contextSelectedAddress]);

  useEffect(() => {
    let isMounted = true;

    const checkActiveBooking = async () => {
      try {
        setCheckingActiveBooking(true);

        if (!phone) {
          setHasActiveBooking(false);
          return;
        }

        const res = await getActivePickupOrOrder(phone);

        if (
          res?.data?.success &&
          res?.data?.data &&
          res?.data?.data?.status !== "delivered"
        ) {
          setHasActiveBooking(true);
        } else {
          setHasActiveBooking(false);
        }
      } catch (error) {
        console.log("Active booking error", error);
        setHasActiveBooking(false);
      } finally {
        if (isMounted) setCheckingActiveBooking(false);
      }
    };

    checkActiveBooking();

    return () => {
      isMounted = false;
    };
  }, [phone]);

  const checkServiceForSelectedAddress = async () => {
    try {
      setCheckingService(true);

      let lat: number | null = null;
      let lng: number | null = null;

      const selectedAddr = selectedPickupAddr || contextSelectedAddress;

      if (selectedAddr) {
        if (selectedAddr.latitude && selectedAddr.longitude) {
          lat = selectedAddr.latitude;
          lng = selectedAddr.longitude;
        } else if (selectedAddr.line1 && selectedAddr.city) {
          const fullAddress = `${selectedAddr.line1}, ${selectedAddr.city}, ${selectedAddr.state || ""}`;
          const geo = await Location.geocodeAsync(fullAddress);
          if (geo && geo.length > 0) {
            lat = geo[0].latitude;
            lng = geo[0].longitude;
          }
        }
      }

      if (lat && lng) {
        // Use the full service data (same as TabBar)
        const data = await getFullServiceData(lat, lng, true);
        updateServiceData(data);   // make sure updateServiceData is destructured from useAddress
        setIsServiceAvailable(data.serviceData?.serviceAvailable === true);
      } else {
        updateServiceData({ coords: null, zoneData: { zoneFound: false }, serviceData: null });
        setIsServiceAvailable(false);
      }
    } catch (error) {
      console.error("Service check error:", error);
      updateServiceData({ coords: null, zoneData: { zoneFound: false }, serviceData: null });
      setIsServiceAvailable(false);
    } finally {
      setCheckingService(false);
    }
  };

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
    if (confirmLoading) return;
    try {
      setConfirmLoading(true);
      if (
        !selectedPickupAddressId ||
        selectedPickupAddressId === "current_location"
      ) {
        showAlert({
          type: "warning",
          title: "Complete Your Address",
          message: "Please add a complete address for pickup.",
          primaryLabel: "Add Address",
          onPrimary: () => {
            setAddressType("pickup");
            setAddModalOpen(true);
          },
        });
        setConfirmLoading(false);
        return;
      }
      const deliveryId =
        deliveryMode === "same"
          ? selectedPickupAddressId
          : selectedDeliveryAddressId;

      if (!deliveryId || deliveryId === "current_location") {
        showAlert({
          type: "warning",
          title: "Complete Your Address",
          message: "Please add a complete address for delivery.",
          primaryLabel: "Add Address",
          onPrimary: () => {
            setAddressType("delivery");
            setAddModalOpen(true);
          },
        });

        setConfirmLoading(false);
        return;
      }
      let selectedSlotForPayload: string | undefined;

      if (selectedSlotData?.time) {
        // Use the time from SlotPicker component (e.g., "8AM - 11AM")
        selectedSlotForPayload = convertSlotTimeFormat(selectedSlotData.time);
      }

      const scheduledDate = pickupType === "today" ? new Date() : date;
      const orderItems = items
        .filter((item) => item.id && item.qty > 0)
        .map((item) => ({
          itemId: item.id,
          quantity: item.qty,
        }));

      const orderDetails: CreatePickupRequest = {
        firstName,
        lastName,
        contact: phone,
        appCustomerId: String(auth_id),
        tempPickupAdresssId: selectedPickupAddressId,
        tempDeliveryAddressId: deliveryId,
        date: formatDateForApi(scheduledDate),
        isHeavy: hasHeavyItems,
        morning_delivery: isMorningDelivery,
      };
      if (selectedSlotForPayload) {
        orderDetails.slot = selectedSlotForPayload;
      }
      if (note?.trim()) orderDetails.note = note.trim();
      if (orderItems.length) orderDetails.items = orderItems;

      // For "today" tab, first create booking to get bookingId
      let bookingId: string | undefined;
      if (pickupType === "today" && selectedPickupAddr) {
        try {
          // Get zoneId from coordinates
          const lat = selectedPickupAddr.latitude;
          const lng = selectedPickupAddr.longitude;

          if (lat && lng) {
            // Resolve zone from coordinates
            const locationDetails = await getLocationDetails(lat, lng);

            if (locationDetails?.zoneId && selectedSlotData?.time) {
              // Convert slot time format from "8:00 AM - 11:00 AM" to "8AM - 11AM"
              const convertedSlotTime = convertSlotTimeFormat(
                selectedSlotData.time,
              );

              // Call booking API
              const bookingPayload = {
                zoneId: locationDetails.zoneId,
                slotTime: convertedSlotTime,
                customerDetails: {
                  appCustomerId: String(auth_id),
                  name: `${firstName || ""} ${lastName || ""}`.trim(),
                  phone: phone,
                },
              };

              console.log(" BOOKING PAYLOAD ===>", bookingPayload);

              const bookingResponse = await createBookingApi(bookingPayload);

              if (
                bookingResponse?.success &&
                bookingResponse?.data?.booking?.bookingId
              ) {
                bookingId = bookingResponse.data.booking.bookingId;
                console.log(" BOOKING CREATED ===>", bookingId);
              }
            }
          }
        } catch (bookingError: any) {
          console.log("Booking API error:", bookingError);
          // Continue with pickup creation even if booking fails
        }
      }

      // Add bookingId to order if available
      if (bookingId) {
        orderDetails.bookingId = bookingId;
      }

      console.log("📤 ORDER PAYLOAD ===>", orderDetails);

      await createOrderApi(orderDetails);
      clear();

      if (pickupType === "today")
        openSuccessModal(
          "Sit & relax 😌\nYour pickup will be collected shortly!",
        );
      else openSuccessModal("Pickup scheduled successfully ✅");
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Booking failed', message: err?.message || 'Failed to create order.' });

    } finally {
      setConfirmLoading(false);
    }
  };

  useEffect(() => {
    if (pickupType === "today") {
      setDate(new Date());
      setSlot(-1);
      setSelectedSlotIndex(-1);
      setSelectedSlotData(null);
    } else {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      setDate(t);
      setSlot(-1);
      setSelectedSlotIndex(-1);
      setSelectedSlotData(null);
    }
  }, [pickupType]);

  const fetchCurrentLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocLoading(false);
        showAlert({ type: 'warning', title: 'Permission denied', message: 'Please allow location access from settings.' });

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
      showAlert({ type: 'error', title: 'Location error', message: e?.message || 'Unable to fetch current location.' });

    } finally {
      setLocLoading(false);
    }
  };

  const searchOnMap = async (query?: string) => {
    const q = query ?? mapQuery;
    if (!q.trim()) return;
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
        showAlert({ type: 'warning', title: 'Not found', message: 'No location found for this search.' });
      }
    } catch (e) {
      showAlert({ type: 'error', title: 'Search failed', message: 'Unable to search this place.' });
    } finally {
      setSearchLoading(false);
    }
  };

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

  const saveAddress = async () => {
    try {
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
        addressType: addressType === "pickup" ? "PICKUP" : "DELIVERY",
      };
      if (addressForm.contactName?.trim())
        payload.contactName = addressForm.contactName.trim();
      if (addressForm.contactPhone?.trim())
        payload.contactPhone = addressForm.contactPhone.trim();
      if (addressForm.addressLine2?.trim())
        payload.addressLine2 = addressForm.addressLine2.trim();
      await saveAddressApi(payload);
      await refreshAddresses();
      setAddModalOpen(false);
      showAlert({ type: 'success', title: 'Address saved!', duration: 3000 });
    } catch (err: any) {
      showAlert({ type: 'error', title: 'Could not save address', message: err?.message || 'Failed to save address.' });

    }
  };

  // ─── Derived data ─────────────────────────────────────────────
  const nextDays = getNextDays(30);

  const selectedPickupAddr = allAddresses.find(
    (a) => a.id === selectedPickupAddressId,
  );
  const selectedDeliveryAddr = allAddresses.find(
    (a) => a.id === selectedDeliveryAddressId,
  );

  const BreakRow = ({ label, value, total, strike }: any) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
      }}
    >
      <Text
        style={{
          color: strike ? "#6B8F7B" : total ? "#CFFFF1" : "#8CAFA0",
          fontSize: total ? 16 : 13,
          fontWeight: total ? "800" : "500",
          textDecorationLine: strike ? "line-through" : "none",
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: strike ? "#6B8F7B" : total ? "#00E1A2" : "#CFFFF1",
          fontSize: total ? 18 : 13,
          fontWeight: total ? "900" : "600",
          textDecorationLine: strike ? "line-through" : "none",
        }}
      >
        ₹{value}
      </Text>
    </View>
  );

  const CartSection = () => {
    if (!items?.length) return null;

    // const deliveryHandling = 40;
    // const serviceCharge = Math.round(cartSubtotal * 0.05);
    // const gst = Math.round((cartSubtotal + serviceCharge) * 0.09);
    // const igst = Math.round((cartSubtotal + serviceCharge) * 0.09);

    const grandTotal = total;

    return (
      <View style={s.section}>
        <Text style={s.sectionLabel}>CART ITEMS</Text>

        <View style={{ marginTop: 1 }}>
          {items.map((item) => {
            const lineTotal = item.qty * item.price;
            // Handle both string ids and object ids (some items may have id as object with _id property)
            const itemKey =
              typeof item.id === "object"
                ? item.id?._id || JSON.stringify(item.id)
                : item.id;

            return (
              <View style={s.cartCard} key={itemKey}>
                {/* LEFT IMAGE */}
                <Image source={{ uri: item.image }} style={s.itemImage} />

                {/* CENTER CONTENT */}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={s.itemTitle}>{item.title}</Text>
                  <Text style={s.itemPrice}>₹{item.price}/Qty</Text>
                </View>

                {/* RIGHT SIDE */}
                <View style={s.rightSection}>
                  {/* STEPPER */}
                  <View style={s.stepperNew}>
                    <TouchableOpacity
                      onPress={() => setQty(item.id, item.qty - 1)}
                    >
                      <Ionicons name="remove" size={16} color="#CFFFF1" />
                    </TouchableOpacity>

                    <Text style={s.qtyText}>{item.qty}</Text>

                    <TouchableOpacity
                      onPress={() => setQty(item.id, item.qty + 1)}
                    >
                      <Ionicons name="add" size={16} color="#00E1A2" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={s.deleteBtnNew}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ marginTop: 4 }}>
          <View style={s.rowBetween}>
            <Text style={s.sectionLabel}>APPLIED OFFERS</Text>

            <TouchableOpacity onPress={() => setCouponOpen(true)}>
              <Text style={{ color: theme.primary }}>View All &rsaquo;</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setCouponOpen(true)}
            activeOpacity={0.85}
            style={{
              marginTop: 8,
              borderRadius: 14,
              paddingHorizontal: 14,
              paddingVertical: 6,
              backgroundColor: "#0E1A14", // flat base
              borderWidth: 1,
              borderColor: appliedCoupon ? "#00E1A2" : "#1E3327",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* LEFT */}
              <View style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  {/* Coupon Code */}
                  <Text
                    style={{
                      color: "#E6FFF6",
                      fontWeight: "900",
                      fontSize: 15,
                      letterSpacing: 0.5,
                    }}
                  >
                    {appliedCoupon?.code || "Apply Coupon"}
                  </Text>

                  {/* Badge */}
                  {appliedCoupon && (
                    <View
                      style={{
                        backgroundColor: "#123D2E",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#00E1A2",
                          fontWeight: "800",
                        }}
                      >
                        BEST VALUE
                      </Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                <Text
                  style={{
                    color: "#7A9B87",
                    fontSize: 12,
                  }}
                >
                  {appliedCoupon
                    ? appliedCoupon.description
                    : "Tap to view available offers"}
                </Text>
              </View>

              {/* RIGHT BUTTON */}
              {/* RIGHT ACTION */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* Applied Badge */}
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: appliedCoupon ? "#00E1A2" : "#2A4A34",
                    backgroundColor: appliedCoupon ? "#123D2E" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: appliedCoupon ? "#00E1A2" : "#7A9B87",
                      fontWeight: "800",
                      fontSize: 12,
                    }}
                  >
                    {appliedCoupon ? "✓ Applied" : "Apply"}
                  </Text>
                </View>

                {/* DELETE ICON */}
                {appliedCoupon && (
                  <TouchableOpacity
                    onPress={() => setAppliedCoupon(null)}
                    activeOpacity={0.8}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: "#2A1414",
                      justifyContent: "center",
                      alignItems: "center",

                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 18 }}>
          <BreakRow label="Subtotal" value={cartSubtotal} />
          {discount > 0 && <BreakRow label="Discount" value={`${discount}`} />}
          {/* <BreakRow label="Delivery Handling" value={deliveryHandling} strike />
          <BreakRow label="Service Charge" value={serviceCharge} strike />
          <BreakRow label="GST (9%)" value={gst} strike />
          <BreakRow label="IGST (9%)" value={igst} strike /> */}

          <View
            style={{
              height: 1,
              backgroundColor: "#1E3327",
              marginVertical: 10,
            }}
          />

          <BreakRow label="Total Payable" value={grandTotal} total />
        </View>
      </View>
    );
  };

  const noSlotsToday = pickupType === "today" && !hasAvailableSlots;
  const selectedSlotFull =
    pickupType === "today" &&
    selectedSlotData &&
    selectedSlotData.availableCapacity === 0;

  const hasActiveSlot = !!getBestSlot();
  const isAreaServiceable = zoneData?.zoneFound === true;
  const isServiceAvailableForNow = isAreaServiceable && hasActiveSlot;
  const isTodaySlotSelected = pickupType === "today" && selectedSlotIndex !== -1 && hasAvailableSlots;
  const isScheduleSlotSelected = pickupType === "schedule" && selectedSlotIndex !== -1 && hasAvailableSlots;

  const bookingBlocked =
    confirmLoading ||
    checkingActiveBooking ||
    hasActiveBooking ||
    // !isServiceAvailableForNow ||
    (pickupType === "today" && !isTodaySlotSelected) ||
    (pickupType === "schedule" && !isScheduleSlotSelected);
  const bookingBlockedMessage =
    "You already have an active pickup or order. You can create new pickup once your current order is delivered.";

  // Special Instructions Section Component
  const SpecialInstructionsSection = () => (
    <View style={s.section}>
      <Text style={s.sectionLabel}>SPECIAL INSTRUCTIONS</Text>
      <LinearGradient colors={theme.gradient} style={{ borderRadius: 14 }}>
        <TouchableOpacity
          style={[s.noteBox, { borderColor: "#1E3327" }]}
          onPress={() => {
            setTempNote(note);
            setNotesModalOpen(true);
          }}
          activeOpacity={0.85}
        >
          <Text
            style={[
              s.notePlaceholder,
              note ? { color: theme.text } : { color: "#d7dbd7" },
            ]}
          >
            {note ||
              "E.g. Code 1234, leave with concierge, use scent-free detergent"}
          </Text>
          <View style={s.noteTagRow}>
            {["FRAGILE", "ECO-WASH"].map((tag) => (
              <View
                key={tag}
                style={[
                  s.noteTag,
                  {
                    backgroundColor: "#1A2C22",
                    borderColor: "#2A4A34",
                  },
                ]}
              >
                <Text style={[s.noteTagText, { color: "#d7dbd7" }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // Delivery Address Section Component
  const DeliveryAddressSection = () => (
    <LinearGradient
      colors={theme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.card, { marginTop: 10 }]}
    >
      <View style={s.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={[s.cardTitle, { color: theme.text }]}>
            Delivery Address
          </Text>
          <Text style={s.cardSub}>Same as pickup location?</Text>
        </View>
        <Switch
          value={deliveryMode === "same"}
          onValueChange={(v) => setDeliveryMode(v ? "same" : "other")}
          trackColor={{ false: "#1E3327", true: theme.primary }}
          thumbColor={deliveryMode === "same" ? "#fff" : "#4E7060"}
        />
      </View>

      {deliveryMode === "other" && (
        <View style={{ marginTop: 10 }}>
          <View style={s.rowBetween}>
            <Text style={s.sectionLabel}>SELECT DELIVERY ADDRESS</Text>
            <TouchableOpacity
              onPress={() => {
                setAddModalOpen(true);
                setAddressType("delivery");
              }}
            >
              <Text style={[s.addLink, { color: theme.primary }]}>
                + Add New
              </Text>
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={theme.gradient}
            style={{
              borderRadius: 16,
              marginTop: 5,
              padding: 8,
              borderWidth: 1.5,
              borderColor: theme.primary + "33",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setPickerType("delivery");
                setAddressPickerOpen(true);
              }}
              activeOpacity={0.85}
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: theme.primary + "22",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={theme.primary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    color: "#7A9B87",
                    fontWeight: "700",
                  }}
                >
                  DELIVERY ADDRESS
                </Text>

                <Text
                  style={{
                    color: theme.text,
                    fontWeight: "800",
                    marginTop: 2,
                  }}
                >
                  {selectedDeliveryAddr
                    ? `${selectedDeliveryAddr.line1}, ${selectedDeliveryAddr.city}`
                    : "Select address"}
                </Text>
              </View>

              <Ionicons name="chevron-down" size={18} color="#7A9B87" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
    </LinearGradient>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <View style={[s.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={[s.safe, { backgroundColor: theme.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 75 + insets.top : 0}
      >
        <View style={ms.bgTopGlow} />
        <View style={ms.bgBottomGlow} />
        {/* ── FIXED HEADER ── */}
        <View
          style={[
            s.header,
            { paddingTop: insets.top },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            {/* BACK BUTTON */}
            <TouchableOpacity
              onPress={goBackSafe}
              hitSlop={10}
              style={s.headerBack}
            >
              <Ionicons name="chevron-back" size={24} color="#A7F3D0" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={0.8}
              onPress={() => {
                setModalMode("pickup");
                setModalVisible(true);
              }}
            >
              {(() => {
                const slotInfo = getSlotInfo();
                if (slotInfo) {
                  // Case 1: Service available + active slot → show clock + label + time
                  return (
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Ionicons name="time-outline" size={14} color="#A7F3D0" />
                        <Text style={{ color: "#A7F3D0", fontSize: 12, marginLeft: 4 }}>
                          Delivery by
                        </Text>
                      </View>
                      <Text style={{ color: "#2FE6A6", fontSize: 16, fontWeight: "800" }}>
                        {slotInfo.dayLabel}
                        {slotInfo.time ? ` ${slotInfo.time}` : ""}
                      </Text>
                    </View>
                  );
                }
                // Cases 2 & 3: no active slot → show status text only
                const displayText = getDisplayText(); // "Currently unavailable" or "Not in your area"
                const color = getServiceColor();      // orange or red
                return (
                  <Text style={{ color, fontSize: 16, fontWeight: "800" }}>
                    {displayText}
                  </Text>
                );
              })()}

              {/* ADDRESS LINE (unchanged) */}
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                <Ionicons
                  name={
                    (selectedPickupAddr?.label || contextSelectedAddress?.label)
                      ?.toLowerCase() === "home"
                      ? "home-outline"
                      : (selectedPickupAddr?.label || contextSelectedAddress?.label)
                        ?.toLowerCase() === "office"
                        ? "business-outline"
                        : "location-outline"
                  }
                  size={14}
                  color="#9CA3AF"
                  style={{ marginRight: 4 }}
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ color: "#9CA3AF", fontSize: 12, maxWidth: "80%" }}
                >
                  {selectedPickupAddr
                    ? `${selectedPickupAddr.line1 || selectedPickupAddr.street}, ${selectedPickupAddr.city}`
                    : contextSelectedAddress
                      ? `${contextSelectedAddress.line1 || contextSelectedAddress.street}, ${contextSelectedAddress.city}`
                      : "Tap to choose pickup location"}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#A7F3D0" style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>

            {/* RIGHT SPACER */}
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
          contentContainerStyle={[
            s.scrollContent,
            // { paddingTop: 60 + insets.top },
          ]}
        >
          {/* ── PICKUP SCHEDULE TABS ── */}
          <View style={s.section}>
            <View style={[s.tabRow]}>
              <TouchableOpacity
                onPress={() => {
                  // if (isServiceAvailable) {
                  //   setPickupType("today");
                  // } else {
                  //   Alert.alert(
                  //     "Service Unavailable",
                  //     "Our service is not available at your selected location for today. Please schedule a pickup for another day.",
                  //     [{ text: "OK", style: "default" }],
                  //   );
                  // }
                  setPickupType("today");
                }}
                // disabled={!isServiceAvailable || checkingService}
                style={[
                  s.tab,
                  pickupType === "today" && {
                    borderColor: theme.primary,
                    backgroundColor: "#0A1F14",
                  },
                  !isServiceAvailable && s.tabDisabled,
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.tabText,
                    {
                      color: pickupType === "today" ? theme.primary : "#4E7060",
                      opacity: !isServiceAvailable ? 0.5 : 1,
                    },
                  ]}
                >
                  Today
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setPickupType("schedule")}
                style={[
                  s.tab,
                  pickupType === "schedule" && {
                    borderColor: theme.primary,
                    backgroundColor: "#0A1F14",
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.tabText,
                    {
                      color:
                        pickupType === "schedule" ? theme.primary : "#4E7060",
                    },
                  ]}
                >
                  Schedule
                </Text>
              </TouchableOpacity>
            </View>

            {/* Show warning message if service is unavailable */}
            {/* {!isServiceAvailable && !checkingService && (
              <View style={s.warningBox}>
                <Ionicons name="alert-circle" size={18} color="#FFA500" />
                <Text style={s.warningText}>
                  Service not available today at your location. Please schedule
                  a pickup.
                </Text>
              </View>
            )} */}
          </View>

          {/* ══════════════════ TODAY VIEW ══════════════════ */}
          {pickupType === "today" && (
            <>
              <View style={s.section}>
                <Text style={{
                  color: theme.primary,
                  fontSize: 13,
                  fontWeight: "600",
                  marginLeft: 4,
                }}>
                  PICKUP SLOT
                </Text>

                {selectedPickupAddr?.latitude && selectedPickupAddr?.longitude ? (
                  <SlotPicker
                    lat={selectedPickupAddr.latitude}
                    lng={selectedPickupAddr.longitude}
                    zoneId={zoneData?.zoneId}
                    selectedSlot={selectedSlotIndex}
                    onSelect={(index, slot) => {
                      setSelectedSlotIndex(index);
                      setSelectedSlotData(slot);
                    }}
                    onSlotsUpdate={(slots) => {
                      const available = slots.some(
                        (s) => s.enabled && s.status !== "expired" && s.availableCapacity > 0
                      );
                      setHasAvailableSlots(available);

                      // ─── Auto-select pre-selected slot from home screen ───
                      if (preSelectedTimeRef.current && selectedSlotIndex === -1) {
                        const targetTime = preSelectedTimeRef.current;
                        const matchIndex = slots.findIndex(
                          (s) => s.time === targetTime && s.enabled && s.status !== "expired"
                        );
                        if (matchIndex !== -1) {
                          setSelectedSlotIndex(matchIndex);
                          setSelectedSlotData(slots[matchIndex]);
                          preSelectedTimeRef.current = ""; // clear so it doesn't re-trigger
                        }
                      }
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setModalMode("pickup");
                      setModalVisible(true);
                    }}
                    style={s.noSlotBox}
                  >
                    <View style={{
                      borderRadius: 16,
                      padding: 16,
                      backgroundColor: "#0B1F19",
                      borderWidth: 1,
                      borderColor: "#1E3327",
                    }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: "#2A2F1C",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}>
                          <Ionicons name="location" size={18} color="#00E1A2" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            color: "#CFFFF1",
                            fontSize: 14,
                            fontWeight: "700",
                          }}>Location Required</Text>
                          <Text style={{
                            color: "#7A9B87",
                            fontSize: 12,
                            marginTop: 4,
                            lineHeight: 18,
                          }}>
                            Please select a pickup address to view available slots for today.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={() => router.push("/services/[service]")}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 10,
                  alignSelf: "flex-start",
                }}
              >
                <CirclePlus
                  style={{
                    color: theme.primary,
                  }}
                  size={14}
                />

                <Text
                  style={{
                    color: theme.primary,
                    fontSize: 13,
                    fontWeight: "600",
                    marginLeft: 4,
                  }}
                >
                  Add items for estimate
                </Text>
              </TouchableOpacity>
              {/* <DeliveryAddressSection /> */}

              <CartSection />

              <View style={s.section}>
                <Text style={s.sectionLabel}>ADDITIONAL INFO</Text>

                <TouchableOpacity
                  onPress={() => setHasHeavyItems(!hasHeavyItems)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
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
                {/* DELIVERY PREFERENCE TOGGLE */}
                <View style={{ marginTop: 5, marginLeft: 15 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="flash-outline" size={14} color="#9FFFD9" />

                    <Text
                      style={{
                        marginLeft: 6,
                        color: "#CFFFF1",
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    >
                      {isMorningDelivery
                        ? "Delivery before 10 AM (No-contact delivery)"
                        : "Get your item delivered in day time (12 PM to 6 PM)"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsMorningDelivery(!isMorningDelivery);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={{
                        marginLeft: 180,
                        marginTop: 2,
                        fontSize: 11,
                        color: "#7A9B87",
                        textDecorationLine: "underline",
                      }}
                    >
                      {isMorningDelivery
                        ? "Not a morning person?"
                        : "Changed your mind?"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {selectedSlotData?.time && (
                <Text
                  style={ms.pickSelectTab}
                >
                  Pickup by{" "}
                  {selectedSlotData.time.split(" - ")[1]} • Estimated delivery: {getDynamicDeliveryLabel(selectedSlotData)}
                </Text>
              )}

              <SpecialInstructionsSection />
            </>
          )}

          {/* ══════════════════ SCHEDULE VIEW ══════════════════ */}
          {pickupType === "schedule" && (
            <>
              <View style={s.section}>
                <View style={s.rowBetween}>
                  <View>
                    <Text style={[s.bigHeading, { color: theme.text }]}>
                      Select Date
                    </Text>
                    <Text style={s.bigSubtitle}>
                      Pick a day for your laundry collection
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.monthLabel}>MONTH</Text>
                    <Text style={[s.monthName, { color: theme.primary }]}>
                      {MONTH_NAMES[date.getMonth()]}
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: 14 }}
                >
                  {nextDays.map((d, i) => {
                    const isSelected = d.toDateString() === date.toDateString();

                    return (
                      <TouchableOpacity
                        key={i}
                        onPress={() => {
                          setDate(d);
                          setSlot(-1);
                          setSelectedSlotIndex(-1);
                          setSelectedSlotData(null);
                        }}
                        activeOpacity={0.85}
                        style={{ marginRight: 10 }}
                      >
                        <LinearGradient
                          colors={theme.gradient}
                          style={[
                            s.dateCell,
                            {
                              opacity: isSelected ? 1 : 0.75,
                              borderColor: isSelected
                                ? theme.primary
                                : "#1E3327",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              s.dateDayName,
                              { color: isSelected ? "#fff" : "#fff" },
                            ]}
                          >
                            {DAY_NAMES[d.getDay()]}
                          </Text>

                          <Text
                            style={[
                              s.dateNum,
                              { color: isSelected ? "#fff" : "#fff" },
                            ]}
                          >
                            {d.getDate()}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={s.section}>
                <Text style={[s.bigHeading, { color: theme.text }]}>
                  Pick Time
                </Text>

                {selectedPickupAddr?.latitude && selectedPickupAddr?.longitude ? (
                  <SlotPicker
                    lat={selectedPickupAddr.latitude}
                    lng={selectedPickupAddr.longitude}
                    zoneId={zoneData?.zoneId}
                    date={formatDateForApi(date)}
                    selectedSlot={selectedSlotIndex}
                    onSelect={(index, slot) => {
                      setSelectedSlotIndex(index);
                      setSelectedSlotData(slot);
                    }}
                    onSlotsUpdate={(slots) => {
                      const available = slots.some(
                        (s) =>
                          s.enabled &&
                          s.status !== "expired" &&
                          s.availableCapacity > 0
                      );
                      setHasAvailableSlots(available);
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setModalMode("pickup");
                      setModalVisible(true);
                    }}
                    style={s.noSlotBox}
                  >
                    <View style={{
                      borderRadius: 16,
                      padding: 16,
                      backgroundColor: "#0B1F19",
                      borderWidth: 1,
                      borderColor: "#1E3327",
                    }}>
                      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                        <View style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: "#2A2F1C",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 10,
                        }}>
                          <Ionicons name="location" size={18} color="#00E1A2" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            color: "#CFFFF1",
                            fontSize: 14,
                            fontWeight: "700",
                          }}>Location Required</Text>
                          <Text style={{
                            color: "#7A9B87",
                            fontSize: 12,
                            marginTop: 4,
                            lineHeight: 18,
                          }}>
                            Please select a pickup address to view available slots.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              <CartSection />

              {/* <DeliveryAddressSection /> */}

              <View style={s.section}>
                <Text style={s.sectionLabel}>ADDITIONAL INFO</Text>
                <LinearGradient
                  colors={theme.gradient}
                  style={{ borderRadius: 14 }}
                >
                  <TouchableOpacity
                    onPress={() => setHasHeavyItems(!hasHeavyItems)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 14,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: hasHeavyItems ? theme.primary : "#1E3327",
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
                </LinearGradient>
              </View>

              {selectedSlotData?.time && (
                <Text
                  style={ms.pickSelectTab}
                >
                  Pickup by{" "}
                  {selectedSlotData.time.split(" - ")[1]} • Estimated delivery: {getDynamicDeliveryLabel(selectedSlotData)}
                </Text>
              )}

              <SpecialInstructionsSection />
            </>
          )}

          {/* ── CONFIRM BUTTON ── */}
          <View style={[s.footer, { backgroundColor: theme.background }]}>
            {pickupType === "schedule" && selectedSlotIndex !== -1 && selectedSlotData?.time && (
              <View style={s.estimatedRow}>
                <Ionicons name="time-outline" size={14} color="#4E7060" />
                <Text style={s.estimatedText}>
                  ESTIMATED PICKUP: {formatDateLabel(date).toUpperCase()},{" "}
                  {selectedSlotData.time}
                  {selectedSlotData.deliveryLabel ? ` • DELIVERY: ${getDynamicDeliveryLabel(selectedSlotData).toUpperCase()}` : ""}
                </Text>
              </View>
            )}
            {/* {pickupType === "today" && selectedSlotData?.time && (
              <View style={s.estimatedRow}>
                <Ionicons name="time-outline" size={14} color="#4E7060" />
                <Text style={s.estimatedText}>
                  PICKUP SLOT: {selectedSlotData.time}
                </Text>
              </View>
            )} */}
          </View>
        </ScrollView>

        <View
          style={[
            {
              backgroundColor: theme.background,
              paddingBottom: insets.bottom + 10,
            },
          ]}
        >
          {hasActiveBooking && (
            <View style={s.bookingBlockedNotice}>
              <Ionicons name="alert-circle-outline" size={16} color="#FFB86B" />
              <Text style={s.bookingBlockedText}>{bookingBlockedMessage}</Text>
            </View>
          )}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              margin: 10,
            }}
          >
            <TouchableOpacity
              style={[
                s.confirmBtn,
                {
                  flex: 1,
                  backgroundColor: theme.primary,
                  opacity: bookingBlocked ? 0.55 : 1,
                },
              ]}
              onPress={confirmPickup}
              disabled={bookingBlocked}
            >
              <Text style={s.confirmText}>
                {noSlotsToday
                  ? "No Slots Available"
                  : selectedSlotFull
                    ? "Slot Full"
                    : checkingActiveBooking
                      ? "Checking..."
                      : confirmLoading
                        ? "Booking..."
                        : pickupType === "today"
                          ? "Book Without Pay"
                          : "Confirm Pickup"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ══════════════════ NOTES MODAL ══════════════════ */}
        <Modal
          visible={notesModalOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setNotesModalOpen(false)}
        >
          <KeyboardAvoidingView
            style={ms.backdrop}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <TouchableWithoutFeedback onPress={() => setNotesModalOpen(false)}>
              <View style={ms.backdrop}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                  <View style={[ms.notesSheet, { backgroundColor: "#0F2318" }]}>
                    <View style={ms.sheetHandle} />
                    <View style={ms.sheetHeader}>
                      <View>
                        <Text style={[ms.sheetTitle, { color: "#fff" }]}>
                          Special Instructions
                        </Text>
                        <Text style={ms.sheetSub}>
                          Add any special requests or notes
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setNotesModalOpen(false)}
                        style={[ms.closeBtn, { backgroundColor: "#1A2C22" }]}
                      >
                        <Ionicons name="close" size={20} color="#7A9B87" />
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      placeholder="e.g., Call before arrival, Ring doorbell twice..."
                      placeholderTextColor="#3D6050"
                      value={tempNote}
                      onChangeText={setTempNote}
                      multiline
                      autoFocus
                      style={[
                        ms.notesInput,
                        {
                          backgroundColor: "#0A1A10",
                          color: "#fff",
                          borderColor: "#1E3327",
                        },
                      ]}
                    />

                    <Text style={ms.suggestLabel}>Quick Suggestions</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 8,
                        marginTop: 8,
                      }}
                    >
                      {[
                        "Call before arrival",
                        "Ring doorbell twice",
                        "Leave at door",
                        "Building security required",
                      ].map((s) => (
                        <TouchableOpacity
                          key={s}
                          onPress={() =>
                            setTempNote((p) => (p.trim() ? p + ", " + s : s))
                          }
                          style={[
                            ms.suggestChip,
                            {
                              backgroundColor: "#1A2C22",
                              borderColor: "#2A4A34",
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "600",
                              color: "#7A9B87",
                            }}
                          >
                            {s}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View
                      style={{ flexDirection: "row", gap: 12, marginTop: 20 }}
                    >
                      <TouchableOpacity
                        onPress={() => {
                          setTempNote("");
                          setNote("");
                          setNotesModalOpen(false);
                        }}
                        style={[
                          ms.clearBtn,
                          {
                            backgroundColor: "#1A2C22",
                            borderColor: "#2A4A34",
                          },
                        ]}
                      >
                        <Text style={{ fontWeight: "800", color: "#7A9B87" }}>
                          Clear
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setNote(tempNote);
                          setNotesModalOpen(false);
                        }}
                        style={[ms.saveBtn, { backgroundColor: theme.primary }]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color="#000"
                        />
                        <Text
                          style={{
                            marginLeft: 6,
                            fontWeight: "900",
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

        {/* ══════════════════ ADD ADDRESS MODAL ══════════════════ */}
        <Modal visible={addModalOpen} animationType="slide" transparent>
          <KeyboardAvoidingView
            style={ms.backdrop}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[ms.addSheet, { backgroundColor: "#0F2318" }]}>
                <ScrollView
                  contentContainerStyle={{ paddingBottom: 24 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={ms.sheetHandle} />
                  <View style={ms.sheetHeader}>
                    <View>
                      <Text style={[ms.sheetTitle, { color: "#fff" }]}>
                        Add New Address
                      </Text>
                      <Text style={ms.sheetSub}>
                        {addressType === "pickup"
                          ? "Pickup Location"
                          : "Delivery Location"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setAddModalOpen(false)}
                      style={[ms.closeBtn, { backgroundColor: "#1A2C22" }]}
                    >
                      <Ionicons name="close" size={20} color="#7A9B87" />
                    </TouchableOpacity>
                  </View>

                  <View style={ms.mapContainer}>
                    <View style={ms.mapSearchBox}>
                      <Ionicons name="search" size={18} color="#666" />
                      <TextInput
                        placeholder="Search location..."
                        placeholderTextColor="#999"
                        value={mapQuery}
                        onChangeText={setMapQuery}
                        returnKeyType="search"
                        style={ms.mapSearchInput}
                      />
                      {searchLoading ? (
                        <Ionicons name="sync" size={18} color={theme.primary} />
                      ) : (
                        <TouchableOpacity onPress={() => searchOnMap(mapQuery)}>
                          <Ionicons
                            name="arrow-forward-circle"
                            size={28}
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
                        ms.currentLocBtn,
                        {
                          backgroundColor: theme.primary,
                          opacity: locLoading ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name={locLoading ? "sync" : "locate"}
                        size={16}
                        color="#000"
                      />
                      <Text style={ms.currentLocText}>
                        {locLoading ? "Fetching..." : "Use Current Location"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      marginTop: 16,
                      marginBottom: 12,
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
                            setAddressForm((p) => ({ ...p, label: item.key }))
                          }
                          style={[
                            ms.labelTab,
                            {
                              backgroundColor: active
                                ? theme.primary
                                : "#1A2C22",
                              borderColor: active ? theme.primary : "#2A4A34",
                            },
                          ]}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name={item.icon as any}
                            size={15}
                            color={active ? "#000" : "#7A9B87"}
                          />
                          <Text
                            style={{
                              marginLeft: 5,
                              fontWeight: "800",
                              fontSize: 13,
                              color: active ? "#000" : "#7A9B87",
                            }}
                          >
                            {item.text}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {[
                    {
                      key: "contactName",
                      placeholder: "Contact Name (Optional)",
                    },
                    {
                      key: "contactPhone",
                      placeholder: "Contact Phone (Optional)",
                      keyboard: "phone-pad" as any,
                    },
                    { key: "houseNo", placeholder: "House No / Flat" },
                    { key: "street", placeholder: "Street" },
                    { key: "landmark", placeholder: "Landmark" },
                    {
                      key: "addressLine2",
                      placeholder: "Address Line 2 (Optional)",
                    },
                  ].map((field) => (
                    <TextInput
                      key={field.key}
                      placeholder={field.placeholder}
                      placeholderTextColor="#3D6050"
                      value={(addressForm as any)[field.key]}
                      keyboardType={field.keyboard}
                      onChangeText={(t) =>
                        setAddressForm((p) => ({ ...p, [field.key]: t }))
                      }
                      style={[
                        ms.formInput,
                        {
                          backgroundColor: "#0A1A10",
                          color: "#fff",
                          borderColor: "#1E3327",
                        },
                      ]}
                    />
                  ))}

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput
                      placeholder="City"
                      placeholderTextColor="#3D6050"
                      value={addressForm.city}
                      onChangeText={(t) =>
                        setAddressForm((p) => ({ ...p, city: t }))
                      }
                      style={[
                        ms.formInputHalf,
                        {
                          backgroundColor: "#0A1A10",
                          color: "#fff",
                          borderColor: "#1E3327",
                        },
                      ]}
                    />
                    <TextInput
                      placeholder="State"
                      placeholderTextColor="#3D6050"
                      value={addressForm.state}
                      onChangeText={(t) =>
                        setAddressForm((p) => ({ ...p, state: t }))
                      }
                      style={[
                        ms.formInputHalf,
                        {
                          backgroundColor: "#0A1A10",
                          color: "#fff",
                          borderColor: "#1E3327",
                        },
                      ]}
                    />
                  </View>

                  <TextInput
                    placeholder="Pincode"
                    placeholderTextColor="#3D6050"
                    value={addressForm.pincode}
                    onChangeText={(t) =>
                      setAddressForm((p) => ({ ...p, pincode: t }))
                    }
                    keyboardType="number-pad"
                    style={[
                      ms.formInput,
                      {
                        backgroundColor: "#0A1A10",
                        color: "#fff",
                        borderColor: "#1E3327",
                      },
                    ]}
                  />

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <TextInput
                      placeholder="Latitude"
                      placeholderTextColor="#3D6050"
                      value={addressForm.latitude}
                      editable={false}
                      style={[
                        ms.formInputHalf,
                        {
                          backgroundColor: "#071A0E",
                          color: "#4E7060",
                          borderColor: "#1E3327",
                        },
                      ]}
                    />
                    <TextInput
                      placeholder="Longitude"
                      placeholderTextColor="#3D6050"
                      value={addressForm.longitude}
                      editable={false}
                      style={[
                        ms.formInputHalf,
                        {
                          backgroundColor: "#071A0E",
                          color: "#4E7060",
                          borderColor: "#1E3327",
                        },
                      ]}
                    />
                  </View>

                  <TouchableOpacity
                    style={[ms.saveAddrBtn, { backgroundColor: theme.primary }]}
                    onPress={saveAddress}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#000" />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontWeight: "900",
                        fontSize: 15,
                        color: "#000",
                      }}
                    >
                      Save Address
                    </Text>
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
                    <Text style={[ms.sheetTitle, { color: "#fff" }]}>
                      Address Preview
                    </Text>
                    <TouchableOpacity
                      onPress={() => setPreviewOpen(false)}
                      style={[ms.closeBtn, { backgroundColor: "#1A2C22" }]}
                    >
                      <Ionicons name="close" size={20} color="#7A9B87" />
                    </TouchableOpacity>
                  </View>
                  {previewAddress ? (
                    <>
                      <Text
                        style={{
                          fontWeight: "800",
                          fontSize: 16,
                          color: "#fff",
                          marginTop: 10,
                        }}
                      >
                        {previewAddress.label}
                      </Text>
                      <Text
                        style={{ marginTop: 8, color: "#7A9B87", fontSize: 14 }}
                      >
                        {previewAddress.addressLine1 ||
                          previewAddress.line1 ||
                          previewAddress.street}
                      </Text>
                      {previewAddress.landmark ? (
                        <Text
                          style={{
                            marginTop: 4,
                            color: "#7A9B87",
                            fontSize: 14,
                          }}
                        >
                          Landmark: {previewAddress.landmark}
                        </Text>
                      ) : null}
                      <Text
                        style={{ marginTop: 4, color: "#7A9B87", fontSize: 14 }}
                      >
                        {previewAddress.city}, {previewAddress.state} •{" "}
                        {previewAddress.pincode}
                      </Text>
                      {previewAddress.contactName ? (
                        <Text
                          style={{ marginTop: 10, color: "#fff", fontSize: 14 }}
                        >
                          Contact: {previewAddress.contactName}
                        </Text>
                      ) : null}
                      {previewAddress.contactPhone ? (
                        <Text
                          style={{ marginTop: 2, color: "#fff", fontSize: 14 }}
                        >
                          Phone: {previewAddress.contactPhone}
                        </Text>
                      ) : null}
                      <TouchableOpacity
                        onPress={() => setPreviewOpen(false)}
                        style={[
                          ms.saveAddrBtn,
                          { backgroundColor: theme.primary, marginTop: 16 },
                        ]}
                      >
                        <Text style={{ fontWeight: "900", color: "#000" }}>
                          Close
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={{ color: "#7A9B87" }}>
                      No address selected
                    </Text>
                  )}
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* ══════════════════ ADDRESS PICKER MODAL ══════════════════ */}
        <Modal visible={addressPickerOpen} animationType="slide" transparent>
          <View style={ms.backdrop}>
            <View style={[ms.addSheet, { backgroundColor: "#0F2318" }]}>
              <View style={ms.sheetHeader}>
                <Text style={[ms.sheetTitle, { color: "#fff" }]}>
                  Select {pickerType === "pickup" ? "Pickup" : "Delivery"}{" "}
                  Address
                </Text>

                <TouchableOpacity onPress={() => setAddressPickerOpen(false)}>
                  <Ionicons name="close" size={22} color="#7A9B87" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ marginTop: 10 }}>
                {allAddresses.map((addr) => {
                  const isSelected =
                    pickerType === "pickup"
                      ? addr.id === selectedPickupAddressId
                      : addr.id === selectedDeliveryAddressId;

                  return (
                    <TouchableOpacity
                      key={addr.id}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (pickerType === "pickup") {
                          setSelectedPickupAddressId(addr.id);
                          setSelectedAddress(addr);
                        } else {
                          setSelectedDeliveryAddressId(addr.id);
                        }
                        setAddressPickerOpen(false);
                      }}
                      style={[
                        s.pickerItem,
                        {
                          borderRadius: 14,
                          marginBottom: 10,
                          borderWidth: 1.5,
                          borderColor: isSelected ? theme.primary : "#1E3327",
                          backgroundColor: isSelected
                            ? theme.primary + "15"
                            : "#0A1A10",
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          addr.label?.toLowerCase() === "home"
                            ? "home-outline"
                            : "briefcase-outline"
                        }
                        size={18}
                        color={isSelected ? theme.primary : "#4E7060"}
                        style={{ marginRight: 10 }}
                      />

                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontWeight: "800",
                            color: isSelected ? theme.primary : theme.text,
                          }}
                        >
                          {addr.label}
                        </Text>

                        <Text
                          style={{ fontSize: 12, color: "#4E7060" }}
                          numberOfLines={2}
                        >
                          {addr.line1}, {addr.city}
                        </Text>
                      </View>

                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={theme.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity
                onPress={() => {
                  setAddressPickerOpen(false);
                  setAddModalOpen(true);
                  setAddressType(pickerType);
                }}
                style={{
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: theme.primary,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: theme.primary, fontWeight: "800" }}>
                  + Add New Address
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <SuccessModal
          visible={successOpen}
          address={
            selectedPickupAddr
              ? `${selectedPickupAddr.line1 || selectedPickupAddr.street}, ${selectedPickupAddr.city}`
              : undefined
          }
          orderId="LN-20489"
          onHome={() => {
            setSuccessOpen(false);
            navigateHomeWithSuccess();
          }}
        />
      </KeyboardAvoidingView>

      <LocationPickerModal
        visible={modalVisible}
        savedAddresses={allAddresses}
        selectedId={
          modalMode === "pickup"
            ? selectedPickupAddressId
            : selectedDeliveryAddressId
        }
        onSelect={(label, addr) => {
          if (modalMode === "pickup") {
            if (addr) {
              setSelectedPickupAddressId(addr.id);
              setSelectedAddress(addr);
            }
          } else {
            setSelectedDeliveryAddressId(addr?.id || "");
          }
          setModalVisible(false);
        }}
        onClose={() => setModalVisible(false)}
        onAddNewAddress={() => {
          router.push("/select-address-location");
        }}
      />

      <CouponCard
        visible={couponOpen}
        onClose={() => setCouponOpen(false)}
        onApply={handleApplyCoupon}
        appliedCode={appliedCoupon?.code || ""}
        coupons={coupons}
        loading={couponLoading}
        subtotal={cartSubtotal}
      />
    </View>
  );
}

// ─── Main Styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    // position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    // paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#0F2318",
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "800" },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  section: { marginBottom: 6, marginTop: 8 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4E7060",
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  addLink: { fontSize: 13, fontWeight: "700" },

  tabRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E3327",
    overflow: "hidden",
    marginTop: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 12,
  },
  tabText: { fontSize: 15, fontWeight: "800" },

  card: { borderRadius: 16, padding: 16, marginBottom: 0 },
  cardTitle: { fontSize: 16, fontWeight: "800" },
  cardSub: { fontSize: 12, color: "#BACBC0", marginTop: 3 },

  emptyAddrBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 10,
  },
  emptyAddrText: { marginLeft: 8, fontWeight: "700", fontSize: 14 },

  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 10,
  },
  dropdownText: { fontSize: 14, fontWeight: "700" },

  pickerList: {
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 6,
    overflow: "hidden",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
  },
  pickerItemLabel: { fontSize: 14, fontWeight: "700" },
  pickerItemSub: { fontSize: 12, color: "#4E7060", marginTop: 2 },

  offerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  offerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  offerCode: { fontSize: 16, fontWeight: "900" },
  promoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  promoText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  offerDesc: { fontSize: 12, color: "#BACBC0", marginTop: 3 },
  appliedBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  appliedText: { fontSize: 13, fontWeight: "800" },

  noteBox: { borderRadius: 16, padding: 14, borderWidth: 1.5, minHeight: 80 },
  notePlaceholder: { fontSize: 13, lineHeight: 20 },
  noteTagRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  noteTag: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  noteTagText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  bigHeading: { fontSize: 16, fontWeight: "900", marginBottom: 4 },
  bigSubtitle: { fontSize: 15, color: "#babeba" },
  monthLabel: {
    fontSize: 10,
    color: "#4E7060",
    fontWeight: "700",
    letterSpacing: 1,
  },
  monthName: { fontSize: 17, fontWeight: "900" },

  dateCell: {
    width: 58,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#1E3327",
  },
  dateDayName: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  dateNum: { fontSize: 24, fontWeight: "900", marginTop: 4 },

  slotChip: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
  },
  slotText: { fontSize: 13, fontWeight: "700", textAlign: "center" },

  routeCard: { borderRadius: 16, padding: 16, borderWidth: 1.5, marginTop: 14 },
  routeRow: { flexDirection: "row", alignItems: "flex-start" },
  routeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  routeTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4E7060",
    letterSpacing: 1,
    marginBottom: 3,
  },
  routeAddrLabel: { fontSize: 15, fontWeight: "800" },
  routeAddrDetail: {
    fontSize: 12,
    color: "#a9c5b8",
    marginTop: 2,
    lineHeight: 16,
  },
  editAddrBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  editAddrText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4E7060",
    marginLeft: 5,
  },

  footer: { paddingTop: 10, paddingBottom: 10 },
  estimatedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 10,
  },
  estimatedText: {
    fontSize: 11,
    color: "#4E7060",
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  bookingBlockedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginHorizontal: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,184,107,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,184,107,0.25)",
  },
  bookingBlockedText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "600",
    color: "#FFCF9B",
  },

  confirmBtn: {
    height: 45,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#00FF88",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmText: { fontSize: 17, fontWeight: "900", color: "#000" },

  cartCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D2B24",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1E3327",
  },

  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },

  itemTitle: {
    color: "#e0f5ef",
    fontWeight: "700",
    fontSize: 14,
  },

  itemPrice: {
    color: "#7A9B87",
    fontSize: 12,
    marginTop: 2,
  },

  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  deleteBtnNew: {
    padding: 6,
  },

  deleteBtn: {
    marginBottom: 8,
  },

  stepperNew: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12, // spacing between -, qty, +, delete
    backgroundColor: "#0f4131",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#327060",
  },

  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0A1A10",
    borderWidth: 1,
    borderColor: "#1E3327",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  cartItemLeft: {
    flex: 1,
    marginRight: 12,
    gap: 8,
  },
  cartItemRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#5bc495",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E3327",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: "#0A1A10",
    borderWidth: 1,
    borderColor: "#1E3327",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnActive: {
    borderWidth: 0,
  },
  qtyText: {
    fontWeight: "800",
    fontSize: 13,
    minWidth: 20,
    color: "#e6f8f2",
    textAlign: "center",
  },
  lineTotal: {
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.3,
  },
  removeBtn: {
    padding: 2,
  },
  noSlotBox: {
    marginTop: 8,
  }
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#2A4A34",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 20, fontWeight: "900" },
  sheetSub: { fontSize: 12, color: "#4E7060", marginTop: 4 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  notesSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 44 : 24,
    maxHeight: SCREEN_HEIGHT * 0.72,
  },
  notesInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    minHeight: 140,
    maxHeight: 190,
    textAlignVertical: "top",
    fontSize: 14,
    marginTop: 14,
    lineHeight: 22,
  },
  suggestLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4E7060",
    letterSpacing: 0.8,
    marginTop: 16,
  },
  suggestChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  addSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.93,
  },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.4,
    minHeight: 260,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    marginBottom: 0,
  },
  mapSearchBox: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 42,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  mapSearchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  currentLocBtn: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  currentLocText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 13,
    marginLeft: 6,
  },
  labelTab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  formInput: {
    padding: 13,
    borderRadius: 12,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "500",
    borderWidth: 1.5,
  },
  formInputHalf: {
    flex: 1,
    padding: 13,
    borderRadius: 12,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "500",
    borderWidth: 1.5,
  },
  saveAddrBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  centeredOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  previewCard: { width: "100%", borderRadius: 20, padding: 18 },
  successCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#00FF88",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  successCheck: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  fixedFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#1E3327",
    zIndex: 1000,
  },

  bgTopGlow: {
    position: "absolute",
    top: -140,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(0, 225, 162, 0.06)",
  },
  bgBottomGlow: {
    position: "absolute",
    bottom: 50,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(0, 225, 162, 0.04)",
  },
  pickSelectTab: {
    marginLeft: 20,
    marginTop: 4,
    fontSize: 12,
    color: "#7A9B87",
    lineHeight: 18,
  },

});
