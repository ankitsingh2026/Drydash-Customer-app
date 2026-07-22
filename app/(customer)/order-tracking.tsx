import CancelPickupConfirmModal from "@/components/orders/CancelPickupConfirmModal";
import ReschedulePickupModal from "@/components/orders/ReschedulePickupModal";
import CouponCard from "@/components/CouponCard";
import { fetchAllValidCoupons } from "@/features/coupons/coupons.api";
import { useAddress } from "@/context/AddressContext";
import { useAuth } from "@/hooks/useAuth";
import { Address } from "@/types/order.types";
import {
  cancelPickupApi,
  reschedulePickupApi,
  getCustomerSinglePickupDetails,
  updatePickupThroughApp,
} from "@/features/pickups/pickup.api";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useTheme } from "../../context/ThemeContext";
const primaryColor = "#000"; // fallback color for static data

import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Define the shape of an order item used in this screen
export type OrderItem = {
  id: number;
  name: string;
  qty: number;
  price: number;
  icon: "shoe-sandal" | "shoe-heel" | "shoe-formal";
  accent: string;
  image?: string;
};
const ORDER: {
  storeName: string;
  storeSubtitle: string;
  deliveredAt: string;
  status: string;
  items: OrderItem[];
  bill: {
    subtotal: number;
    discount: number;
    deliveryHandling: number;
    serviceCharge: number;
    itemDiscount: number;
    platformFee: number;
    gst: number;
    gstPercent: number;
    total: number;
  };
  orderId: string;
  payment: string;
  deliveredTo: string;
  deliveredBy: string;
  deliveryAddress: string;
  orderDate: string;
} = {
  storeName: "Green Park",
  storeSubtitle: "Nandivali Panchanand, Dombi...",
  deliveredAt: "10:46",
  status: "Delivered",
  items: [
    {
      id: 1,
      name: "Sliders",
      qty: 1,
      price: 600,
      icon: "shoe-sandal",
      accent: primaryColor,
    },
    {
      id: 2,
      name: "Stilettos",
      qty: 4,
      price: 2400,
      icon: "shoe-heel",
      accent: "#FF6B6B",
    },
    {
      id: 3,
      name: "Boots",
      qty: 1,
      price: 700,
      icon: "shoe-formal",
      accent: "#D4A373",
    },
  ],
  bill: {
    subtotal: 1550,
    discount: 0,
    deliveryHandling: 40,
    serviceCharge: 78,
    itemDiscount: 500,
    platformFee: 0,
    gst: 147,
    gstPercent: 9,
    total: 1962,
  },
  orderId: "DRY-4920421",
  payment: "Paid via UPI",
  deliveredTo: "Ankit Singh",
  deliveredBy: "Rajesh Kumar",
  deliveryAddress:
    "402, Skyview Residences, Tower B, 6th Main Road, Indiranagar, Bengaluru - 560038",
  orderDate: "Oct 24, 2023, 08:42 PM",
};

function money(value: number) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function calculateDiscount(coupon: any, subtotal: number) {
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
}

function toTitleCase(value?: string) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return ORDER.orderDate;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return ORDER.orderDate;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function normalizeStatus(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function formatLocationLine(address?: Address | null) {
  if (!address) return "";
  const parts = [
    address.line1 || address.street || address.flat,
    address.city,
    address.state,
  ].filter(Boolean);
  return parts.join(", ");
}

function inferItemIcon(name: string): OrderItem["icon"] {
  const text = name.toLowerCase();
  if (text.includes("heel") || text.includes("stiletto")) return "shoe-heel";
  if (text.includes("boot") || text.includes("formal")) return "shoe-formal";
  return "shoe-sandal";
}

function ItemIcon({
  icon,
  accent,
}: {
  icon: OrderItem["icon"];
  accent: string;
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);   // add this
  return (
    <View style={[styles.itemIconInner, { borderColor: `${accent}55` }]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={accent} />
    </View>
  );
}

function ActionTagButton({
  label,
  icon,
  onPress,
  tone = "default",
}: {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  tone?: "default" | "danger";
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <View
        style={[
          styles.tagPill,
          tone === "danger" && {
            backgroundColor: "#FF6B6B22",
            borderColor: "#FF6B6B55",
          },
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={13}
            color={tone === "danger" ? "#FF9FA8" : theme.primary}
          />
        ) : null}
        <Text
          style={[
            styles.tagPillText,
            tone === "danger" && { color: "#FF9FA8" },
          ]}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function Header({
  onBack,
  storeName,
  storeSubtitle,
  onMenuToggle,
  menuVisible,
  onReschedule,
  onCancel,
  showMenu = true,
}: {
  onBack?: () => void;
  storeName: string;
  storeSubtitle: string;
  onMenuToggle: () => void;
  menuVisible: boolean;
  onReschedule?: () => void;
  onCancel?: () => void;
  showMenu?: boolean;
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  if (!showMenu)
    return (
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          disabled={!onBack}
          style={[styles.backBtn, !onBack && { opacity: 0.4 }]}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.titleRow}>
            <Text style={styles.storeName}>{storeName}</Text>
            <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
          </View>
          <Text style={styles.storeSubtitle} numberOfLines={1}>
            {storeSubtitle}
          </Text>
        </View>
      </View>
    );

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        disabled={!onBack}
        style={[styles.backBtn, !onBack && { opacity: 0.4 }]}
        activeOpacity={0.75}
      >
        <Ionicons name="arrow-back" size={22} color={theme.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <View style={styles.titleRow}>
          <Text style={styles.storeName}>{storeName}</Text>
          <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
        </View>
        <Text style={styles.storeSubtitle} numberOfLines={1}>
          {storeSubtitle}
        </Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity onPress={onMenuToggle}>
          <Ionicons name="ellipsis-vertical" size={20} color={theme.primary} />
        </TouchableOpacity>
        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={onMenuToggle}>
          <TouchableOpacity 
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} 
            activeOpacity={1} 
            onPress={onMenuToggle}
          >
            <View style={{ backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 16 }}>
              <View style={{ width: 40, height: 4, backgroundColor: theme.border, alignSelf: 'center', borderRadius: 2, marginBottom: 8 }} />
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Order Options</Text>
              
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { onMenuToggle(); onReschedule?.(); }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primary + '22', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                </View>
                <View>
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>Reschedule</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>Change pickup date and time</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { onMenuToggle(); onCancel?.(); }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card , padding: 10, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF6B6B15', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                  <Ionicons name="close-outline" size={22} color="#FF6B6B" />
                </View>
                <View>
                  <Text style={{ color: theme.isDark ? '#FF9FA8' : '#C53030', fontSize: 16, fontWeight: '600' }}>Cancel Pickup</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>This action cannot be undone</Text>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );
}
function StatusBanner({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.statusBanner}>
      <View style={styles.statusIconWrap}>
        <Ionicons name={icon} size={20} color={theme.background} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statusTitle}>{title}</Text>
        <Text style={styles.statusSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ItemCard({
  item,
  onDelete,
}: {
  item: OrderItem;
  onDelete?: () => void;
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemLeft}>
        <View style={[styles.itemThumb, { backgroundColor: theme.inputBackground }]}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSub}>
            Qty {item.qty} • {money(item.price / item.qty)}
          </Text>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.itemPrice}>{money(item.price)}</Text>
      </View>
    </View>
  );
}

function LocationCard({ value }: { value: string }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.locationCardWrap}>
      <Ionicons name="location-outline" size={14} color={theme.primary} />
      <Text style={styles.locationCardText} numberOfLines={1}>
        {value || ORDER.storeSubtitle}
      </Text>
    </View>
  );
}

function TagPill({ label }: { label: string }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.tagPill}>
      <Text style={styles.tagPillText}>{label}</Text>
    </View>
  );
}

function RatingCard() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.ratingCard}>
      <View style={styles.ratingStarWrap}>
        <Ionicons name="star" size={17} color={theme.primary} />
      </View>

      {/* <Text style={styles.ratingText}>How were your ordered items?</Text> */}

      <TouchableOpacity activeOpacity={0.85} style={styles.rateBtn}>
        <Text style={styles.rateBtnText}>Rate Now</Text>
      </TouchableOpacity>
    </View>
  );
}

function BillRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.billRow}>
      <Text style={styles.billLabel}>{label}</Text>
      <Text
        style={[styles.billValue, highlight && { color: theme.primary }]}
      >
        {value}
      </Text>
    </View>
  );
}

function BillCard({
  bill,
  showExpanded,
}: {
  bill: typeof ORDER.bill;
  showExpanded: boolean;
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const [open, setOpen] = useState(false);

  const {
    subtotal,
    deliveryHandling,
    serviceCharge,
    itemDiscount,
    platformFee,
    gst,
    gstPercent,
    total,
  } = bill;

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(!open)}
        style={styles.billHeader}
      >
        <Text style={styles.sectionTitle}>Bill Details</Text>
        <View style={styles.billHeaderRight}>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {(open || showExpanded) && (
        <>
          <View style={styles.billDivider} />
          <BillRow label="Subtotal" value={money(subtotal)} />
        </>
      )}
    </View>
  );
}
import { CheckCircle2, ChevronRight, Trash2 } from "lucide-react-native"
import { showAlert } from "@/components/Customalert";
import { SafeAreaView } from "react-native-safe-area-context";
function CouponSection({
  appliedCoupon,
  onOpen,
  onApply,
}: {
  appliedCoupon: any;
  onOpen: () => void;
  onApply: (coupon: any, action: "apply" | "remove") => void;
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.offerHeaderRow}>
        <Text style={styles.offerLabel}>available coupons</Text>
        <TouchableOpacity onPress={onOpen} style={styles.offerViewAllContainer}>
          <Text style={styles.offerViewAllText}>View</Text>
          <ChevronRight color={theme.text} size={16} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={onOpen}
        activeOpacity={0.85}
        disabled={!!appliedCoupon}
        style={{
          borderRadius: 14,
          padding: 14,
          backgroundColor: theme.inputBackground,
          borderColor: appliedCoupon ? theme.primary : theme.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.text,
                fontWeight: "900",
                fontSize: 15,
                letterSpacing: 0.5,
              }}
            >
              {appliedCoupon?.code || "Apply Coupon"}
            </Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
              {appliedCoupon
                ? appliedCoupon.description || "Coupon applied"
                : "Tap to view available offers"}
            </Text>
          </View>

          {appliedCoupon ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <CheckCircle2 color={theme.primary} size={16} fill={theme.inputBackground} />
                <Text
                  style={{
                    color: theme.primary,
                    fontWeight: "700",
                    fontSize: 14,
                    marginLeft: 6,
                  }}
                >
                  Applied
                </Text>
              </View>
              <View
                style={{
                  width: 1,
                  height: 16,
                  backgroundColor: theme.border,
                  marginHorizontal: 10,
                }}
              />
              <TouchableOpacity
                onPress={() => onApply(appliedCoupon, "remove")}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 color={theme.textSecondary} size={16} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onOpen}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: "transparent",
              }}
            >
              <Text
                style={{
                  color: theme.textSecondary,
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                Apply
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

function OrderDetailsCard({
  details,
}: {
  details: {
    orderId: string;
    payment: string;
    deliveredTo: string;
    deliveredBy: string;
    deliveryAddress: string;
    orderDate: string;
  };
}) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionTopRow}>
        <Text style={styles.sectionTitle}>ORDER DETAILS</Text>
        <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.75}>
          <Ionicons name="download-outline" size={14} color={theme.textSecondary} />
          <Text style={styles.downloadText}>Download Receipt</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsGrid}>
        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>ORDER ID</Text>
          <View style={styles.inlineRow}>
            <Text style={styles.detailValue}>{details.orderId}</Text>
            <TouchableOpacity style={styles.copyBtn} activeOpacity={0.75}>
              <Ionicons name="copy-outline" size={13} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>PAYMENT</Text>
          <View style={styles.inlineRow}>
            <View style={styles.upiBadge}>
              <Text style={styles.upiBadgeText}>U</Text>
            </View>
            <Text style={styles.detailValue}>{details.payment}</Text>
          </View>
        </View>

        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>DELIVERED TO</Text>
          <Text style={styles.detailValue}>{details.deliveredTo}</Text>
        </View>

        <View style={styles.detailCell}>
          <Text style={styles.detailLabel}>DELIVERED BY</Text>
          <View style={styles.inlineRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {details.deliveredBy.charAt(0)}
              </Text>
            </View>
            <Text style={styles.detailValue}>{details.deliveredBy}</Text>
          </View>
        </View>

        <View style={styles.fullCell}>
          <Text style={styles.detailLabel}>DELIVERY ADDRESS</Text>
          <Text style={styles.addressText}>{details.deliveryAddress}</Text>
        </View>

        <View style={styles.fullCell}>
          <Text style={styles.detailLabel}>ORDER PLACED DATE &amp; TIME</Text>
          <Text style={styles.detailValue}>{details.orderDate}</Text>
        </View>
      </View>
    </View>
  );
}

function HelpCard() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.helpTitle}>NEED HELP?</Text>

      <TouchableOpacity activeOpacity={0.8} style={styles.chatCard}  onPress={() => router.push("/(customer)/(assistant)/chat")}>
        <View style={styles.chatIconWrap}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={19}
            color={theme.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.chatTitle}>Chat with us</Text>
          <Text style={styles.chatSub}>We&apos;re here to help you 24/7</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

function BottomCTA({ mode }: { mode: ScreenMode }) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const title = mode === "pickup-scheduled" ? "Reschedule" : "Repeat Order";
  const subtitle =
    mode === "pickup-scheduled"
      ? "Update pickup date & slot"
      : "View Cart On Next Step";

  return (
    <View style={styles.bottomWrap}>
      <TouchableOpacity activeOpacity={0.9} style={styles.repeatBtn}>
        <Text style={styles.repeatBtnTitle}>{title}</Text>
        <Text style={styles.repeatBtnSub}>{subtitle}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function OrderTrackingScreen() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation();
  const { user } = useAuth();
  const { selectedAddress } = useAddress();
  const cart = useCart();
  const params = useLocalSearchParams<{
    pickupId?: string;
    orderId?: string;
  }>();
  console.log("received id params====>> ", params);
  const [loading, setLoading] = useState(true);
  const [pickupDetails, setPickupDetails] = useState<any>(null);
  const [originalPickupItems, setOriginalPickupItems] = useState<any[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [sameLocation, setSameLocation] = useState(true);
  const [heavyItems, setHeavyItems] = useState(false);
  const [morningDelivery, setMorningDelivery] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const toggleMenu = () => setMenuVisible((prev) => !prev);
  const [isUpdatingPickup, setIsUpdatingPickup] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleRemoveCartItem = (itemId: string) => {
    cart.removeItem(itemId);
  };


  const handleApplyCoupon = (coupon: any, action: "apply" | "remove") => {
    if (action === "remove") {
      setAppliedCoupon(null);
      setCouponOpen(false);
      return;
    }

    const discount = calculateDiscount(coupon, bill.subtotal);
    if (discount <= 0) {
      showAlert({ type: 'warning', title: 'Invalid Coupon', message: 'This coupon is not applicable to your order.' });
      return;
    }

    setAppliedCoupon(coupon);
    setCouponOpen(false);
  };

  useEffect(() => {
    const fetchPickup = async () => {
      if (!params.pickupId) return;

      try {
        setLoading(true);
        const res = await getCustomerSinglePickupDetails(params.pickupId);
        const details = res?.pickup_details;
        setPickupDetails(details);

        // Store original pickup items for merging with cart items later
        if (details?.items?.length) {
          const originalItems = details.items.map((item: any) => {
            const itemId = item.itemId?._id || item.itemId;
            return {
              itemId: itemId,
              quantity: item.quantity || 1,
              label: item.label,
              price: item.price,
            };
          });
          setOriginalPickupItems(originalItems);
        } else {
          setOriginalPickupItems([]);
        }

        // Determine if pickup is in editable state
        const pickupStatus = String(details?.PickupStatus ?? "")
          .trim()
          .toLowerCase();
        const isEditable = [
          "pending",
          "scheduled",
          "schedule",
          "assigned",
          "riderassigned",
          "pickupassigned",
        ].includes(pickupStatus);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPickup();
  }, [params.pickupId, reloadKey]);

  const handleCancelPickup = async () => {
    if (!selectedPickup?._id) {
      showAlert({ type: 'error', title: 'Missing pickup', message: 'Unable to cancel this pickup right now.' });

      return;
    }

    try {
      setActionLoading(true);
      await cancelPickupApi(selectedPickup._id);
      setCancelModalVisible(false);
      showAlert({ type: 'success', title: 'Pickup cancelled', message: 'Your pickup has been cancelled successfully.', duration: 4000 });

      setReloadKey((prev) => prev + 1);
      if (navigation.canGoBack()) navigation.goBack();
    } catch (error: any) {
      showAlert({ type: 'error', title: 'Cancel failed', message: error?.message || 'Unable to cancel pickup.' });

    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedulePickup = async (newDate: string, slot: any) => {
    if (!selectedPickup?._id) {
      showAlert({ type: 'error', title: 'Missing pickup', message: 'Unable to reschedule this pickup right now.' });

      return;
    }

    try {
      setActionLoading(true);
      await reschedulePickupApi(selectedPickup._id, newDate, slot);
      setRescheduleModalVisible(false);
      showAlert({ type: 'success', title: 'Pickup rescheduled', message: 'Your pickup date has been updated.', duration: 4000 });
      router.replace({
        pathname: "/(customer)/order-tracking",
        params: { pickupId: selectedPickup._id },
      });
      setReloadKey((prev) => prev + 1);
    } catch (error: any) {
      showAlert({ type: 'error', title: 'Reschedule failed', message: error?.message || 'Unable to reschedule pickup.' });

    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePickup = async () => {
    if (!selectedPickup?._id) {
      showAlert({ type: 'error', title: 'Missing pickup', message: 'Unable to update this pickup right now.' });
      return;
    }
    const finalItems: { itemId: string; quantity: number }[] = [];

    // original pickup items map
    const originalMap = new Map();

    (selectedPickup?.items || []).forEach((item: any) => {
      const itemId = item?.itemId?._id;

      if (!itemId) return;

      originalMap.set(itemId, {
        itemId,
        quantity: item.quantity || 1,
      });
    });

    // current items map (what is displayed on the screen)
    const currentItemsMap = new Map();

    items.forEach((item: any) => {
      const itemId = String(item.cartId || item.id);
      currentItemsMap.set(itemId, {
        itemId,
        quantity: item.qty,
      });
    });

    // 1. Handle existing items
    originalMap.forEach((originalItem, itemId) => {
      const currentItem = currentItemsMap.get(itemId);

      if (currentItem) {
        // updated quantity
        finalItems.push({
          itemId,
          quantity: currentItem.quantity,
        });
      } else {
        // removed item
        finalItems.push({
          itemId,
          quantity: 0,
        });
      }
    });

    // 2. Handle newly added items
    currentItemsMap.forEach((currentItem, itemId) => {
      if (!originalMap.has(itemId)) {
        finalItems.push({
          itemId,
          quantity: currentItem.quantity,
        });
      }
    });

    console.log("FINAL UPDATE ITEMS ===>", finalItems);

    try {
      setIsUpdatingPickup(true);
      await updatePickupThroughApp(
        selectedPickup._id,
        finalItems,
        specialInstructions,
        heavyItems,
        morningDelivery,
        appliedCoupon?.code || "",
      );
      cart.clear();
      showAlert({ type: 'success', title: 'Pickup updated!', message: 'Your pickup has been updated successfully.', duration: 4000 });

      router.replace({
        pathname: "/(customer)/(tabs)/home",
        params: { pickupId: selectedPickup._id },
      });
      setReloadKey((prev) => prev + 1);
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? (error as any).message
          : "Unable to update pickup.";
      showAlert({ type: 'error', title: 'Update failed', message });

    } finally {
      setIsUpdatingPickup(false);
    }
  };

  const loadCoupons = async () => {
    if (!bill.subtotal || bill.subtotal <= 0) {
      setCoupons([]);
      return;
    }

    // Extract unique service types from items
    const activeServiceTypes = Array.from(
      new Set(items.map((item: any) => item.type).filter(Boolean))
    );
    console.log("Active service types for coupons:", activeServiceTypes);

    try {
      setCouponLoading(true);
      
      const res = await fetchAllValidCoupons(bill.subtotal, undefined, activeServiceTypes)
      console.log("COUPONS API RES ===>", res);
      setCoupons(res?.data || res || []);
    } catch (err) {
      console.log("coupon fetch error", err);
      setCoupons([]);
    } finally {
      setCouponLoading(false);
    }
  };

  // const selectedPickup = useMemo(() => {
  //   if (!pickups.length) return null;
  //   if (params.pickupId) {
  //     return pickups.find((row) => row._id === params.pickupId) ?? null;
  //   }

  //   const sorted = [...pickups].sort((a, b) => {
  //     const at = new Date(a.updatedAt || a.createdAt || a.pickup_date || 0).getTime();
  //     const bt = new Date(b.updatedAt || b.createdAt || b.pickup_date || 0).getTime();
  //     return bt - at;
  //   });

  //   return sorted[0] ?? null;
  // }, [pickups, params.pickupId]);

  const selectedPickup = pickupDetails;

  useEffect(() => {
    setSpecialInstructions(selectedPickup?.note ?? "");
  }, [selectedPickup?._id, selectedPickup?.note]);

  useEffect(() => {
    if (selectedPickup) {
      setHeavyItems(selectedPickup.isHeavy ?? false);
      setMorningDelivery(selectedPickup.morning_delivery ?? false);
    }
  }, [selectedPickup?.isHeavy, selectedPickup?.morning_delivery]);

  const pickupStatus = String(selectedPickup?.PickupStatus ?? "")
    .trim()
    .toLowerCase();
  const normalizedPickupStatus = normalizeStatus(selectedPickup?.PickupStatus);
  // const normalizedOrderStatus = normalizeStatus(selectedOrder?.status);
  const hasOrderItems = Boolean(selectedPickup?.items?.length);

  const locationText = useMemo(() => {
    return (
      formatLocationLine(selectedAddress) ||
      selectedPickup?.Address ||
      selectedPickup?.deliveryAddress ||
      ORDER.storeSubtitle
    );
  }, [selectedAddress, selectedPickup]);

  const isAssigned = useMemo(() => {
    return (
      Boolean(selectedPickup?.riderName || selectedPickup?.riderDate) ||
      [
        "assigned",
        "riderassigned",
        "pickupassigned",
        "ontheway",
        "accepted",
      ].includes(normalizedPickupStatus)
    );
  }, [
    normalizedPickupStatus,
    selectedPickup?.riderDate,
    selectedPickup?.riderName,
  ]);

  const screenMode: ScreenMode = useMemo(() => {
    const isScheduled = ["pending", "scheduled", "schedule"].includes(
      normalizedPickupStatus,
    );

    if (isAssigned) return "pickup-assigned";
    if (isScheduled) return "pickup-scheduled";
    // if (normalizedOrderStatus === "delivered") return "order-delivered";
    return hasOrderItems ? "order-items" : "order-delivered";
  }, [hasOrderItems, isAssigned, normalizedPickupStatus]);

  const isEditableMode =
    screenMode === "pickup-scheduled" || screenMode === "pickup-assigned";

  const items = useMemo(() => {
    // Use cart items ONLY if user has actually edited cart
    const hasCartItems = cart.items.length > 0;

    if (isEditableMode && hasCartItems) {
      return cart.items.map((item) => ({
        id: item.id,
        cartId: item.id,
        name: item.title,
        qty: item.qty,
        price: item.qty * item.price,
        image: item.image,
        icon: inferItemIcon(item.title),
        accent: theme.primary,
        type: item.type,
      }));
    }

    // fallback to pickup items from API
    return (selectedPickup?.items ?? []).map(
      (item: any, index: number) => {
        const name = item?.label || `Item ${index + 1}`;
        const qty = item?.quantity || 1;
        const price = qty * (item?.price || 0);

        return {
          id: item?.itemId?._id || index + 1,
          cartId: item?.itemId?._id,
          name,
          qty,
          price,
          image:
            item?.itemId?.images?.[0]?.url ||
            "https://via.placeholder.com/50",
          icon: inferItemIcon(name),
          accent: theme.primary,
          type: item?.type || item?.itemId?.serviceType || item?.itemId?.type,
        };
      },
    );
  }, [selectedPickup, cart.items, isEditableMode]);

  const bill = useMemo(() => {
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.price,
      0,
    );
    const discount = calculateDiscount(appliedCoupon, subtotal);

    return {
      subtotal,
      deliveryHandling: 0,
      serviceCharge: 0,
      itemDiscount: 0,
      platformFee: 0,
      gst: 0,
      gstPercent: 0,
      discount,
      total: Math.max(subtotal - discount, 0),
    };
  }, [items, appliedCoupon]);

  useEffect(() => {
    if (couponOpen && bill.subtotal > 0) {
      loadCoupons();
    }
  }, [couponOpen, bill.subtotal, selectedPickup?._id]);

  const details = useMemo(() => {
    return {
      orderId: selectedPickup?._id || ORDER.orderId,
      payment: "Payment Pending",
      deliveredTo: selectedPickup?.Name || ORDER.deliveredTo,
      deliveredBy: selectedPickup?.riderName || ORDER.deliveredBy,
      deliveryAddress:
        selectedPickup?.deliveryAddress ||
        selectedPickup?.Address ||
        ORDER.deliveryAddress,
      orderDate: formatDateTime(selectedPickup?.createdAt),
    };
  }, [selectedPickup]);

  const storeName = selectedPickup?.Address?.trim().split(" ")[0];
  const storeSubtitle = selectedPickup?.Address || null; 

  const deliveredAt = ORDER.deliveredAt;

  const scheduledAt = formatDateTime(
    selectedPickup?.rescheduledDate ||
    selectedPickup?.pickup_date ||
    selectedPickup?.createdAt,
  );

  const statusBannerContent = useMemo(() => {
    if (screenMode === "pickup-scheduled") {
      return {
        title: "Pickup has been scheduled",
        subtitle: selectedPickup?.slot
          ? `Pickup slot: ${selectedPickup.slot} • ${scheduledAt}`
          : `Status: ${toTitleCase(selectedPickup?.PickupStatus) || "Pending"}`,
        icon: "time-outline" as const,
      };
    }

    if (screenMode === "pickup-assigned") {
      return {
        title: "Rider has been assigned",
        subtitle: `${selectedPickup?.riderName || "Our rider"} is on the way to pickup your order`,
        icon: "bicycle-outline" as const,
      };
    }

    return {
      title: `Order was delivered at ${deliveredAt}`,
      subtitle: "Successfully picked up & delivered",
      icon: "checkmark" as const,
    };
  }, [
    deliveredAt,
    scheduledAt,
    screenMode,
    selectedPickup?.PickupStatus,
    selectedPickup?.riderName,
    selectedPickup?.slot,
  ]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }
  // 🔥 ADD HERE
  const BreakRow = ({ label, value, total }: any) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
      }}
    >
      <Text
        style={{
          color: total ? theme.text : theme.textSecondary,
          fontSize: total ? 16 : 13,
          fontWeight: total ? "800" : "500",
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: total ? theme.text : theme.text,
          fontSize: total ? 18 : 13,
          fontWeight: total ? "900" : "600",
        }}
      >
        ₹{value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.background}
      />

      <View style={styles.bgTopGlow} />
      <View style={styles.bgBottomGlow} />

      <Header
        onBack={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}
        storeName={storeName}
        storeSubtitle={storeSubtitle}
        onMenuToggle={toggleMenu}
        menuVisible={menuVisible}
        onReschedule={() => setRescheduleModalVisible(true)}
        onCancel={() => setCancelModalVisible(true)}
        showMenu={screenMode === "pickup-scheduled"}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {screenMode === "pickup-scheduled" ||
          screenMode === "pickup-assigned" ? (
          <>
            {/* <StatusBanner
              title={statusBannerContent.title}
              subtitle={statusBannerContent.subtitle}
              icon={statusBannerContent.icon}
            /> */}

            {hasOrderItems || (isEditableMode && cart.items.length > 0) ? (
              <>
                <View style={styles.sectionHeaderWrap}>
                  <Text style={styles.sectionHeader}>Cart Items ({items.reduce((total: number, item: any) => total + item.qty, 0)}) </Text>
                </View>

                {items.map((item: any) => {
                  const handleDelete = () => {
                    cart.removeItem(String(item.cartId || item.id));
                  };

                  return (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                    />
                  );
                })}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/(customer)/services/[service]",
                      params: {
                        pickupId: selectedPickup._id,
                        mode: "edit",
                        service: "shoe",
                      },
                    })
                  }
                  style={styles.addItemsRow}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color={theme.primary}
                  />
                  <Text style={styles.addItemsText}>Add More Items</Text>
                </TouchableOpacity>

                <CouponSection
                  appliedCoupon={appliedCoupon}
                  onOpen={() => setCouponOpen(true)}
                  onApply={(coupon, action) => {
                    if (action === "remove") {
                      // 1. Clears your applied coupon state object
                      setAppliedCoupon(null);

                      // 2. Add any other state setters you actually use below:
                      // (e.g., if you have setCouponCode, clear it here, otherwise leave it empty)
                    }
                  }}
                />

                <View style={styles.offerHeaderRow}>
                  <Text style={styles.offerLabel}>Cost Summary</Text>
                  {/* <TouchableOpacity style={styles.offerViewAllContainer}>
                    <Text style={styles.offerViewAllText}>View</Text>
                    <ChevronRight color={theme.text} size={16} />
                  </TouchableOpacity> */}
                </View>
                <View
                  style={{
                    marginTop: 0,
                    marginBottom: 10,
                    borderRadius: 16,
                    padding: 14,
                    backgroundColor: theme.inputBackground,
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                >

                  <BreakRow label="Subtotal" value={bill.subtotal} />

                  {bill.discount > 0 && (
                    <BreakRow label="Discount" value={`${bill.discount}`} />
                  )}

                  <View
                    style={{
                      height: 1,
                      backgroundColor: theme.border,
                      marginVertical: 10,
                    }}
                  />

                  <BreakRow label="Total Bill" value={bill.total} total />
                </View>
              </>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.scheduledAddEstimateRow}
                onPress={() =>
                  router.push({
                    pathname: "/(customer)/services/[service]",
                    params: {
                      pickupId: selectedPickup._id,
                      mode: "edit",
                      service: "shoe",
                    },
                  })
                }
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={theme.primary}
                />
                <Text style={styles.scheduledAddEstimateText}>
                  Add Items for estimate
                </Text>
              </TouchableOpacity>
            )}

            {/* <TouchableOpacity style={styles.checkRow} onPress={() => setSameLocation((p) => !p)}>
              <Ionicons
                name={sameLocation ? "checkbox" : "square-outline"}
                size={20}
                color={theme.primary}
              />
              <Text style={styles.checkLabel}>Delivery Location Same As Pickup Location</Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setHeavyItems((p) => !p)}
            >
              <Ionicons
                name={heavyItems ? "checkbox" : "square-outline"}
                size={20}
                color={theme.primary}
              />
              <Text style={styles.checkLabel}>
                Includes Heavy Items (Rugs, Quilts, etc)
              </Text>
            </TouchableOpacity>
            <View style={styles.deliveryRow}>
              <Ionicons
                name="flash-outline"
                size={16}
                color={theme.primary}
              />
              <View>
                <Text style={styles.deliveryText}>
                  {morningDelivery
                    ? "Delivery before 10 AM (No-contact delivery)"
                    : "Get your item delivered in day time (12 PM to 6 PM)"}
                </Text>
                <TouchableOpacity onPress={() => setMorningDelivery((p) => !p)}>
                  <Text style={styles.deliveryLink}>
                    {morningDelivery
                      ? "Not a morning person?"
                      : "Changed your mind?"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.specialLabel}>SPECIAL INSTRUCTIONS</Text>
            <TextInput
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder="Any specific requirements for your wash?"
              placeholderTextColor={theme.placeholderText}
              multiline
              textAlignVertical="top"
              style={styles.specialInputScheduled}
            />

            <View style={styles.tagsRow}>
              <TagPill label="# Fragile" />
              <TagPill label="# Eco-Wash" />
              <TagPill label="# Hypoallergenic" />
            </View>
          </>
        ) : screenMode === "order-items" ? (
          <>
            <LocationCard value={locationText} />

            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionHeader}>Cart Items ({items.reduce((total: number, item: any) => total + item.qty, 0)})</Text>
            </View>

            {items.map((item: any) => (
              <ItemCard key={item.id} item={item} />
            ))}

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.addItemsRow}
              onPress={() =>
                router.push({
                  pathname: "/(customer)/services/[service]",
                  params: {
                    pickupId: selectedPickup._id,
                    mode: "edit",
                    service: "shoe",
                  },
                })
              }
            >
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={theme.primary}
              />
              <Text style={styles.addItemsText}>Add More Items</Text>
            </TouchableOpacity>

            <CouponSection
              appliedCoupon={appliedCoupon}
              onOpen={() => setCouponOpen(true)}
            />

            <View
              style={{
                marginTop: 12,
                borderRadius: 16,
                padding: 14,
                backgroundColor: theme.inputBackground,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "800",
                  color: "#4E7060",
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                BILL DETAILS
              </Text>

              <BreakRow label="Subtotal" value={bill.subtotal} />

              {bill.discount > 0 && (
                <BreakRow label="Discount" value={`-${bill.discount}`} />
              )}

              <View
                style={{
                  height: 1,
                  backgroundColor: theme.border,
                  marginVertical: 10,
                }}
              />

              <BreakRow label="Total Payable" value={bill.total} total />
            </View>

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setSameLocation((p) => !p)}
            >
              <Ionicons
                name={sameLocation ? "checkbox" : "square-outline"}
                size={18}
                color={theme.primary}
              />
              <Text style={styles.checkLabel}>
                Delivery Location Same As Pickup Location
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkRow}
              onPress={() => setHeavyItems((p) => !p)}
            >
              <Ionicons
                name={heavyItems ? "checkbox" : "square-outline"}
                size={18}
                color={theme.primary}
              />
              <Text style={styles.checkLabel}>
                Includes Heavy Items (Rugs, Quilts, etc)
              </Text>
            </TouchableOpacity>

            <View style={styles.deliveryRow}>
              <Ionicons
                name="flash-outline"
                size={16}
                color={theme.primary}
              />
              <View>
                <Text style={styles.deliveryText}>
                  {morningDelivery
                    ? "Delivery before 10 AM (No-contact delivery)"
                    : "Get your item delivered in day time (12 PM to 6 PM)"}
                </Text>
                <TouchableOpacity onPress={() => setMorningDelivery((p) => !p)}>
                  <Text style={styles.deliveryLink}>
                    {morningDelivery
                      ? "Not a morning person?"
                      : "Changed your mind?"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.specialLabel}>SPECIAL INSTRUCTIONS</Text>
            <TextInput
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder="Any specific requirements for your wash?"
              placeholderTextColor={theme.placeholderText}
              multiline
              textAlignVertical="top"
              style={styles.specialInput}
            />

            <View style={styles.tagsRow}>
              <TagPill label="# Fragile" />
              <TagPill label="# Eco-Wash" />
              <TagPill label="# Hypoallergenic" />
            </View>
          </>
        ) : (
          <>
            <StatusBanner
              title={statusBannerContent.title}
              subtitle={statusBannerContent.subtitle}
              icon={statusBannerContent.icon}
            />

            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionHeader}>
                {screenMode === "order-delivered" ? "Items" : "Ordered Items"}
              </Text>
            </View>

            {items.map((item: any) => (
              <ItemCard key={item.id} item={item} />
            ))}

            {screenMode === "order-delivered" ? <RatingCard /> : null}
            <BillCard
              bill={bill}
              showExpanded={screenMode === "order-delivered"}
            />
            {screenMode === "order-delivered" ? (
              <OrderDetailsCard details={details} />
            ) : null}
            {screenMode === "order-delivered" ? <HelpCard /> : null}

            <View style={styles.secureRow}>
              <Ionicons name="lock-closed-outline" size={11} color={theme.textSecondary} />
              <Text style={styles.secureText}> SECURE PAYMENT</Text>
            </View>

            <View style={styles.paymentIconsRow}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={22}
                color={theme.textSecondary}
              />
              <MaterialCommunityIcons
                name="bank-outline"
                size={22}
                color={theme.textSecondary}
              />
              <MaterialCommunityIcons
                name="cellphone"
                size={22}
                color={theme.textSecondary}
              />
            </View>
          </>
        )}

        <View
          style={{
            height:
              (screenMode === "pickup-scheduled" ||
                screenMode === "pickup-assigned") &&
                hasOrderItems
                ? 90
                : screenMode === "pickup-scheduled" ||
                  screenMode === "pickup-assigned"
                  ? 30
                  : 120,
          }}
        />
      </ScrollView>

      {screenMode === "order-delivered" ? (
        <BottomCTA mode={screenMode} />
      ) : null}
      {isEditableMode ? (
        <View style={styles.totalAmountBarWrap}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleUpdatePickup}
            disabled={isUpdatingPickup}
            style={[
              styles.totalAmountBarBtn,
              { opacity: isUpdatingPickup ? 0.7 : 1 },
            ]}
          >
            {isUpdatingPickup ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={styles.totalAmountBarText}>Update Pickup</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      <CancelPickupConfirmModal
        visible={cancelModalVisible}
        loading={actionLoading}
        onClose={() => {
          if (!actionLoading) setCancelModalVisible(false);
        }}
        onConfirm={handleCancelPickup}
      />

      <ReschedulePickupModal
        visible={rescheduleModalVisible}
        loading={actionLoading}
        initialDate={
          selectedPickup?.rescheduledDate || selectedPickup?.pickup_date
        }
        onClose={() => {
          if (!actionLoading) setRescheduleModalVisible(false);
        }}
        onConfirm={handleReschedulePickup}
      />

      <CouponCard
        visible={couponOpen}
        onClose={() => setCouponOpen(false)}
        onApply={handleApplyCoupon}
        appliedCode={appliedCoupon?.code || ""}
        coupons={coupons}
        loading={couponLoading}
        subtotal={bill.subtotal}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  menuContainer: {
    position: "relative",
    zIndex: 10,
  },
  dropdownMenu: {
    position: "absolute",
    top: 30,
    right: 0,
    minWidth: 140,
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.background,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  tagPill: {
    minHeight: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tagPillText: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.background,
  },

  bgTopGlow: {
    position: "absolute",
    top: -140,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: theme.card,
  },
  bgBottomGlow: {
    position: "absolute",
    bottom: 50,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: theme.card,
  },

  header: {
    paddingTop: Platform.OS === "android" ? 12 : 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  storeName: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  storeSubtitle: {
    color: theme.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.card,
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  statusIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  statusSub: {
    color: theme.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  sectionHeaderWrap: {
    marginBottom: 10,
    marginTop: 2,
  },
  sectionHeader: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  scheduledAddEstimateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 14,
  },
  scheduledAddEstimateText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700",
  },
  locationCardWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  locationCardText: {
    flex: 1,
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  addItemsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 6,
    marginBottom: 14,
  },
  addItemsText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "700",
  },
  offerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  offerLabel: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  offerViewAllContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Style the text itself
  offerViewAllText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginRight: 4, // Adds a small space before the icon
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  couponInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 12,
    color: theme.text,
    fontSize: 13,
  },
  applyBtn: {
    height: 40,
    minWidth: 74,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
  },
  applyBtnText: {
    color: theme.isDark ? theme.background : theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  appliedCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.card,
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  appliedCode: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  appliedDesc: {
    color: theme.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  appliedPillInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.card,
  },
  appliedPillInlineText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  checkLabel: {
    flex: 1,
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  specialLabel: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 8,
  },
  specialInput: {
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 13,
    marginBottom: 12,
  },
  specialInputScheduled: {
    minHeight: 126,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.inputBackground,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: theme.text,
    fontSize: 14,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },

  scheduledActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  scheduledCancelBtn: {
    flex: 1,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    borderColor: theme.card,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduledCancelText: {
    color: "#FF6B6B",
    fontSize: 28 / 2,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  scheduledRescheduleBtn: {
    flex: 1,
    height: 30,
    borderRadius: 999,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: theme.primary,
    shadowOpacity: 0.32,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  scheduledRescheduleText: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "900",
  },
  totalAmountBarWrap: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 12,
  },
  totalAmountBarBtn: {
    height: 40,
    borderRadius: 999,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
     marginBottom:30
  },
  totalAmountBarText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.2,
   
  },

  itemCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  itemThumb: {
    width: 50,
    height: 45,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.inputBackground,
  },

  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  itemIconInner: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: theme.inputBackground,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800",
  },
  itemSub: {
    color: theme.textSecondary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  itemPrice: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },

  ratingCard: {
    marginTop: 6,
    marginBottom: 14,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.card,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ratingStarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingText: {
    flex: 1,
    color: theme.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  rateBtn: {
    borderWidth: 1,
    borderColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: theme.card,
  },
  rateBtnText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: "800",
  },

  sectionCard: {
    backgroundColor: theme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 15,
    marginBottom: 14,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  billHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  billHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  billHeaderTotal: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  billLabel: {
    color: theme.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  billValue: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "700",
  },
  billDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: theme.text,
    fontSize: 15,
    fontWeight: "800",
  },
  totalValue: {
    color: theme.primary,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  sectionTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  downloadText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginBottom: 14,
    opacity: 0.9,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detailCell: {
    width: "50%",
    marginBottom: 16,
    paddingRight: 8,
  },
  fullCell: {
    width: "100%",
    marginBottom: 16,
  },
  detailLabel: {
    color: theme.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  detailValue: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  addressText: {
    color: theme.text,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  copyBtn: {
    marginLeft: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  upiBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    borderWidth: 1,
    borderColor: theme.card,
  },
  upiBadgeText: {
    color: theme.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  avatarText: {
    color: theme.background,
    fontSize: 11,
    fontWeight: "900",
  },

  helpTitle: {
    color: theme.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 14,
  },
  chatIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: theme.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  chatTitle: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  chatSub: {
    color: theme.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },

  secureRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  secureText: {
    color: theme.textSecondary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  paymentIconsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 18,
    marginTop: 10,
  },

  bottomWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  repeatBtn: {
    backgroundColor: theme.primary,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    shadowColor: theme.background,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  repeatBtnTitle: {
    color: theme.background,
    fontSize: 16,
    fontWeight: "900",
  },
  repeatBtnSub: {
    color: theme.text,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
  },

  deliveryText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: "500",
  },
  deliveryLink: {
    color: theme.textSecondary,
    fontSize: 12,
    marginLeft: 150,
    textDecorationLine: "underline",
  },
});
