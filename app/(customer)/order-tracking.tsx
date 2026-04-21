import { getOrdersApi } from "@/features/orders/orders.api";
import { getCustomerPickups } from "@/features/pickups/pickup.api";
import { PickupRecord } from "@/features/pickups/pickup.types";
import { useAuth } from "@/hooks/useAuth";
import { buildPhoneCandidates } from "@/utils/phone";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,

  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export const DarkTheme = {
  background: "#001714",
  gradient: ["#052420", "#003826"],
  card: "#102B25",
  text: "#DEE5FF",
  subText: "#22EBAB",
  primary: "#00E1A2",
  border: "#1E3A34",
  ordergradient: ["#001A17", "#00332B", "#004D3F"],
  gray: "#fff",
  newcard: ["#052420", "#003826"],
};

type OrderItem = {
  id: number;
  name: string;
  qty: number;
  price: number;
  icon: "shoe-sandal" | "shoe-heel" | "shoe-formal";
  accent: string;
};

type ApiOrderItem = {
  heading?: string;
  quantity?: number;
  price?: number;
  newQtyPrice?: number;
  type?: string;
};

type ApiOrder = {
  _id?: string;
  order_id?: string;
  status?: string;
  statusHistory?: {
    delivered?: string | null;
  };
  items?: ApiOrderItem[];
  address?: string;
  deliveryCharges?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount?: number;
  price?: number;
  isPaid?: boolean;
  customerName?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ScreenMode = "pickup-scheduled" | "pickup-assigned" | "order-delivered";

const ORDER: {
  storeName: string;
  storeSubtitle: string;
  deliveredAt: string;
  status: string;
  items: OrderItem[];
  bill: {
    subtotal: number;
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
      accent: "#00E1A2",
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

function inferItemIcon(name: string): OrderItem["icon"] {
  const text = name.toLowerCase();
  if (text.includes("heel") || text.includes("stiletto")) return "shoe-heel";
  if (text.includes("boot") || text.includes("formal")) return "shoe-formal";
  return "shoe-sandal";
}

function ItemIcon({ icon, accent }: { icon: OrderItem["icon"]; accent: string }) {
  return (
    <View style={[styles.itemIconInner, { borderColor: `${accent}55` }]}>
      <MaterialCommunityIcons name={icon} size={20} color={accent} />
    </View>
  );
}

function Header({
  onBack,
  storeName,
  storeSubtitle,
}: {
  onBack?: () => void;
  storeName: string;
  storeSubtitle: string;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        disabled={!onBack}
        style={[styles.backBtn, !onBack && { opacity: 0.4 }]}
        activeOpacity={0.75}
        
      >
        
        <Ionicons name="arrow-back" size={22} color={DarkTheme.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <View style={styles.titleRow}>
          <Text style={styles.storeName}>{storeName}</Text>
          <Ionicons name="chevron-down" size={14} color="#7F948A" />
        </View>
        <Text style={styles.storeSubtitle} numberOfLines={1}>
          {storeSubtitle}
        </Text>
      </View>

      {/* <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.75}>
        <Ionicons name="notifications-outline" size={20} color={DarkTheme.text} />
      </TouchableOpacity> */}
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
  return (
    <View style={styles.statusBanner}>
      <View style={styles.statusIconWrap}>
        <Ionicons name={icon} size={20} color={DarkTheme.background} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.statusTitle}>{title}</Text>
        <Text style={styles.statusSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

function ItemCard({ item }: { item: OrderItem }) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemLeft}>
        <View style={[styles.itemThumb, { backgroundColor: "#071B18" }]}>
          <ItemIcon icon={item.icon} accent={item.accent} />
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSub}>
            Qty {item.qty} • {money(item.price / item.qty)}
          </Text>
        </View>
      </View>

      <Text style={styles.itemPrice}>{money(item.price)}</Text>
    </View>
  );
}

function RatingCard() {
  return (
    <View style={styles.ratingCard}>
      <View style={styles.ratingStarWrap}>
        <Ionicons name="star" size={17} color={DarkTheme.primary} />
      </View>

      <Text style={styles.ratingText}>How were your ordered items?</Text>

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
  return (
    <View style={styles.billRow}>
      <Text style={styles.billLabel}>{label}</Text>
      <Text style={[styles.billValue, highlight && { color: DarkTheme.primary }]}>
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
      {/* HEADER CLICKABLE */}
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
            color="#8AA39B"
          />
        </View>
      </TouchableOpacity>

      {/* COLLAPSIBLE CONTENT */}
      {(open || showExpanded) && (
        <>
          <View style={styles.billDivider} />

          <BillRow label="Subtotal" value={money(subtotal)} />
          <BillRow label="Delivery Handling" value={money(deliveryHandling)} />
          <BillRow label="Service Charge" value={money(serviceCharge)} />
          <BillRow
            label="Item Discount"
            value={`-${money(itemDiscount)}`}
            highlight
          />
          <BillRow label="Platform fee" value={money(platformFee)} />
          <BillRow label={`GST (${gstPercent}%)`} value={money(gst)} />

          <View style={styles.billDivider} />


        </>
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total Bill</Text>
        <Text style={styles.totalValue}>{money(total)}</Text>
      </View>
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
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionTopRow}>
        <Text style={styles.sectionTitle}>ORDER DETAILS</Text>

        <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.75}>
          <Ionicons name="download-outline" size={14} color="#93A39B" />
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
              <Ionicons name="copy-outline" size={13} color="#93A39B" />
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
              <Text style={styles.avatarText}>{details.deliveredBy.charAt(0)}</Text>
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
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.helpTitle}>NEED HELP?</Text>

      <TouchableOpacity activeOpacity={0.8} style={styles.chatCard}>
        <View style={styles.chatIconWrap}>
          <Ionicons name="chatbubble-ellipses-outline" size={19} color={DarkTheme.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.chatTitle}>Chat with us</Text>
          <Text style={styles.chatSub}>We&apos;re here to help you 24/7</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#88A098" />
      </TouchableOpacity>
    </View>
  );
}

function BottomCTA({ mode }: { mode: ScreenMode }) {
  const title = mode === "pickup-scheduled" ? "Reschedule" : "Repeat Order";
  const subtitle =
    mode === "pickup-scheduled" ? "Update pickup date & slot" : "View Cart On Next Step";

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
  const navigation = useNavigation();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    pickupId?: string;
    orderId?: string;
  }>();
  const [loading, setLoading] = useState(true);
  const [pickups, setPickups] = useState<PickupRecord[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);

  const rawPhone = user?.user?.phone ?? user?.phone ?? "";
  const customerId = user?.user?.id ?? user?.id ?? "";
  const phoneCandidates = useMemo(
    () => buildPhoneCandidates(rawPhone),
    [rawPhone],
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!phoneCandidates.length) {
        if (mounted) {
          setPickups([]);
          setOrders([]);
          setLoading(false);
        }
        return;
      }

      try {
        if (mounted) setLoading(true);

        const fetchPickups = async () => {
          for (const candidate of phoneCandidates) {
            try {
              const res = await getCustomerPickups(candidate);
              const rows = Array.isArray(res?.pickups) ? res.pickups : [];
              if (rows.length) return rows;
            } catch {
              // keep trying alternate phone formats
            }
          }

          if (customerId) {
            try {
              const res = await getCustomerPickups(customerId);
              const rows = Array.isArray(res?.pickups) ? res.pickups : [];
              if (rows.length) return rows;
            } catch {
              // keep falling back
            }
          }
          return [] as PickupRecord[];
        };

        const fetchOrders = async () => {
          for (const candidate of phoneCandidates) {
            try {
              const res = await getOrdersApi(candidate);
              const rows = Array.isArray(res?.orders) ? res.orders : [];
              if (rows.length) return rows as ApiOrder[];
            } catch {
              // keep trying alternate phone formats
            }
          }

          if (customerId) {
            try {
              const res = await getOrdersApi(customerId);
              const rows = Array.isArray(res?.orders) ? res.orders : [];
              if (rows.length) return rows as ApiOrder[];
            } catch {
              // keep falling back
            }
          }
          return [] as ApiOrder[];
        };

        const [pickupRows, orderRows] = await Promise.all([
          fetchPickups(),
          fetchOrders(),
        ]);

        if (!mounted) return;
        setPickups(pickupRows);
        setOrders(orderRows);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [phoneCandidates]);

  const selectedPickup = useMemo(() => {
    if (!pickups.length) return null;
    if (params.pickupId) {
      return pickups.find((row) => row._id === params.pickupId) ?? null;
    }

    const sorted = [...pickups].sort((a, b) => {
      const at = new Date(a.updatedAt || a.createdAt || a.pickup_date || 0).getTime();
      const bt = new Date(b.updatedAt || b.createdAt || b.pickup_date || 0).getTime();
      return bt - at;
    });

    return sorted[0] ?? null;
  }, [pickups, params.pickupId]);

  const selectedOrder = useMemo(() => {
    if (!orders.length) return null;
    if (params.orderId) {
      return (
        orders.find((row) => row.order_id === params.orderId || row._id === params.orderId) ?? null
      );
    }

    const sorted = [...orders].sort((a, b) => {
      const at = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bt = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bt - at;
    });

    return sorted[0] ?? null;
  }, [orders, params.orderId]);

  const pickupStatus = String(selectedPickup?.PickupStatus ?? "").trim().toLowerCase();
  const normalizedPickupStatus = pickupStatus.replace(/[^a-z]/g, "");
  const orderStatus = String(selectedOrder?.status ?? "").trim().toLowerCase();

  const screenMode: ScreenMode = useMemo(() => {
    const isAssigned = ["assigned", "riderassigned", "pickupassigned"].includes(
      normalizedPickupStatus,
    );
    const isScheduled = ["pending", "scheduled", "schedule"].includes(
      normalizedPickupStatus,
    );

    if (isAssigned) return "pickup-assigned";
    if (isScheduled) return "pickup-scheduled";
    if (orderStatus === "delivered") return "order-delivered";
    return "order-delivered";
  }, [normalizedPickupStatus, orderStatus]);

  const items: OrderItem[] = useMemo(() => {
    const fromOrder = (selectedOrder?.items ?? []).map((item, index) => {
      const qty = Number(item.quantity ?? 1);
      const unitPrice = Number(item.newQtyPrice ?? item.price ?? 0);
      const linePrice = qty > 0 && unitPrice > 0 ? unitPrice : Number(item.price ?? 0);
      const name = item.heading || `Item ${index + 1}`;
      return {
        id: index + 1,
        name,
        qty,
        price: linePrice,
        icon: inferItemIcon(name),
        accent: "#00E1A2",
      };
    });

    const fromPickup = (selectedPickup?.items ?? []).map((item, index) => {
      const name = String(item?.heading || item?.name || `Item ${index + 1}`);
      const qty = Number(item?.quantity ?? item?.qty ?? 1);
      const linePrice = Number(item?.newQtyPrice ?? item?.price ?? 0);
      return {
        id: index + 1,
        name,
        qty,
        price: linePrice,
        icon: inferItemIcon(name),
        accent: "#00E1A2",
      };
    });

    if (fromOrder.length) return fromOrder;
    if (fromPickup.length) return fromPickup;
    return [];
  }, [selectedOrder?.items, selectedPickup?.items]);

  const bill = useMemo(() => {
    const subtotalFromItems = items.reduce((sum, item) => sum + item.price, 0);
    const subtotal = subtotalFromItems || ORDER.bill.subtotal;
    const deliveryHandling = Number(selectedOrder?.deliveryCharges ?? ORDER.bill.deliveryHandling);
    const serviceCharge =
      Number(selectedOrder?.taxAmount ?? 0) > 0
        ? 0
        : ORDER.bill.serviceCharge;
    const itemDiscount = Number(selectedOrder?.discountAmount ?? ORDER.bill.itemDiscount);
    const gst = Number(selectedOrder?.taxAmount ?? ORDER.bill.gst);

    const total =
      Number(selectedOrder?.totalAmount ?? selectedOrder?.price ?? selectedPickup?.totalAmount ?? selectedPickup?.price ?? 0) ||
      ORDER.bill.total;

    return {
      subtotal,
      deliveryHandling,
      serviceCharge,
      itemDiscount,
      platformFee: ORDER.bill.platformFee,
      gst,
      gstPercent: ORDER.bill.gstPercent,
      total,
    };
  }, [items, selectedOrder, selectedPickup]);

  const details = useMemo(() => {
    const pickupOrderId = selectedPickup?._id
      ? `DX-${selectedPickup._id.slice(-6).toUpperCase()}`
      : ORDER.orderId;

    return {
      orderId: selectedOrder?.order_id || pickupOrderId || ORDER.orderId,
      payment:
        selectedOrder?.isPaid || selectedPickup?.isPaid
          ? "Paid via UPI"
          : "Payment Pending",
      deliveredTo:
        selectedOrder?.customerName ||
        selectedPickup?.Name ||
        selectedPickup?.contactName ||
        ORDER.deliveredTo,
      deliveredBy: selectedPickup?.riderName || ORDER.deliveredBy,
      deliveryAddress:
        selectedPickup?.deliveryAddress ||
        selectedOrder?.address ||
        selectedPickup?.Address ||
        ORDER.deliveryAddress,
      orderDate: formatDateTime(selectedOrder?.createdAt || selectedPickup?.createdAt),
    };
  }, [selectedOrder, selectedPickup]);

  const storeName = selectedPickup?.plantName || "Green Park";
  const storeSubtitle =
    selectedPickup?.Address || selectedOrder?.address || ORDER.storeSubtitle;

  const deliveredAt =
    formatTime(selectedOrder?.statusHistory?.delivered || selectedOrder?.updatedAt) || ORDER.deliveredAt;

  const statusBannerContent = useMemo(() => {
    if (screenMode === "pickup-scheduled") {
      return {
        title: "Pickup has been scheduled",
        subtitle: `Status: ${toTitleCase(selectedPickup?.PickupStatus) || "Pending"}`,
        icon: "time-outline" as const,
      };
    }

    if (screenMode === "pickup-assigned") {
      return {
        title: "Rider has been assigned",
        subtitle:
          `${selectedPickup?.riderName || "Our rider"} is on the way to pickup your order`,
        icon: "bicycle-outline" as const,
      };
    }

    return {
      title: `Order was delivered at ${deliveredAt}`,
      subtitle: "Successfully picked up & delivered",
      icon: "checkmark" as const,
    };
  }, [screenMode, selectedPickup?.PickupStatus, selectedPickup?.riderName, deliveredAt]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={DarkTheme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={DarkTheme.background} />

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
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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

        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}

        {screenMode === "order-delivered" ? <RatingCard /> : null}
        <BillCard bill={bill} showExpanded={screenMode === "order-delivered"} />
        {screenMode === "order-delivered" ? <OrderDetailsCard details={details} /> : null}
        {screenMode === "order-delivered" ? <HelpCard /> : null}

        <View style={styles.secureRow}>
          <Ionicons name="lock-closed-outline" size={11} color="#64766F" />
          <Text style={styles.secureText}> SECURE PAYMENT</Text>
        </View>

        <View style={styles.paymentIconsRow}>
          <MaterialCommunityIcons name="credit-card-outline" size={22} color="#64766F" />
          <MaterialCommunityIcons name="bank-outline" size={22} color="#64766F" />
          <MaterialCommunityIcons name="cellphone" size={22} color="#64766F" />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomCTA mode={screenMode} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DarkTheme.background,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DarkTheme.background,
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
    color: DarkTheme.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  storeSubtitle: {
    color: "#879892",
    fontSize: 12,
    marginTop: 2,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DarkTheme.card,
    borderWidth: 1,
    borderColor: DarkTheme.border,
  },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#0B3326",
    borderWidth: 1,
    borderColor: "rgba(0,225,162,0.18)",
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  statusIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: DarkTheme.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: {
    color: DarkTheme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  statusSub: {
    color: "#8AA39B",
    fontSize: 12,
    marginTop: 3,
  },

  sectionHeaderWrap: {
    marginBottom: 10,
    marginTop: 2,
  },
  sectionHeader: {
    color: "#8AA39B",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },

  itemCard: {
    backgroundColor: DarkTheme.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: DarkTheme.border,
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
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  itemIconInner: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#081F1B",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    color: DarkTheme.text,
    fontSize: 15,
    fontWeight: "800",
  },
  itemSub: {
    color: "#8AA39B",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  itemPrice: {
    color: DarkTheme.text,
    fontSize: 14,
    fontWeight: "800",
  },

  ratingCard: {
    marginTop: 6,
    marginBottom: 14,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#0B3326",
    borderWidth: 1,
    borderColor: "rgba(0,225,162,0.12)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ratingStarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0A251F",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingText: {
    flex: 1,
    color: DarkTheme.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  rateBtn: {
    borderWidth: 1,
    borderColor: DarkTheme.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(0,225,162,0.06)",
  },
  rateBtnText: {
    color: DarkTheme.primary,
    fontSize: 12,
    fontWeight: "800",
  },

  sectionCard: {
    backgroundColor: DarkTheme.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: DarkTheme.border,
    padding: 15,
    marginBottom: 14,
  },
  sectionTitle: {
    color: DarkTheme.text,
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
    color: DarkTheme.primary,
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
    color: "#8AA39B",
    fontSize: 13,
    fontWeight: "600",
  },
  billValue: {
    color: DarkTheme.text,
    fontSize: 13,
    fontWeight: "700",
  },
  billDivider: {
    height: 1,
    backgroundColor: DarkTheme.border,
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: DarkTheme.text,
    fontSize: 15,
    fontWeight: "800",
  },
  totalValue: {
    color: DarkTheme.primary,
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
    color: "#93A39B",
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: DarkTheme.border,
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
    color: "#8AA39B",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  detailValue: {
    color: DarkTheme.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  addressText: {
    color: DarkTheme.text,
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
    backgroundColor: "#0A251F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "rgba(0,225,162,0.15)",
  },
  upiBadgeText: {
    color: DarkTheme.primary,
    fontSize: 10,
    fontWeight: "900",
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DarkTheme.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  avatarText: {
    color: DarkTheme.background,
    fontSize: 11,
    fontWeight: "900",
  },

  helpTitle: {
    color: "#8AA39B",
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
    backgroundColor: "#0A251F",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: DarkTheme.border,
    padding: 14,
  },
  chatIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#06231C",
    alignItems: "center",
    justifyContent: "center",
  },
  chatTitle: {
    color: DarkTheme.text,
    fontSize: 14,
    fontWeight: "800",
  },
  chatSub: {
    color: "#8AA39B",
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
    color: "#64766F",
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
    backgroundColor: "rgba(0,23,20,0.96)",
    borderTopWidth: 1,
    borderTopColor: DarkTheme.border,
  },
  repeatBtn: {
    backgroundColor: DarkTheme.primary,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  repeatBtnTitle: {
    color: DarkTheme.background,
    fontSize: 16,
    fontWeight: "900",
  },
  repeatBtnSub: {
    color: "#0B4D3C",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
});