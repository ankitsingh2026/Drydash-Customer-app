import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// ─── Types ─────────────────────────────────────────────────────────────────────
type OrderStatus =
  | "CONFIRMED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "AT_FACILITY"
  | "PROCESSING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

// ─── Static Data ───────────────────────────────────────────────────────────────
const RIDER = {
  name: "Rahul Sharma",
  initials: "RS",
  rating: "4.92",
  role: "Professional Partner",
  phone: "+91 98765 43210",
  vehicle: "Hero Splendor · DL 4C AB 1234",
  totalDeliveries: 1240,
};

const ORDER_ITEMS = [
  { id: "1", name: "Sneakers (1 pair)", service: "Shoe Spa", price: 349 },
  { id: "2", name: "Formal Shirt (2 pcs)", service: "Dry Clean", price: 198 },
  { id: "3", name: "Jeans (1 pc)", service: "Laundry", price: 89 },
];

const STATUS_FLOW: { status: OrderStatus; label: string; subLabel: string; icon: string }[] = [
  {
    status: "CONFIRMED",
    label: "Order Confirmed",
    subLabel: "Your order has been received",
    icon: "checkmark-circle",
  },
  {
    status: "PICKED_UP",
    label: "Picked Up",
    subLabel: "Rider collected your items",
    icon: "bag-check",
  },
  {
    status: "IN_TRANSIT",
    label: "In Transit",
    subLabel: "On the way to our facility",
    icon: "bicycle",
  },
//   {
//     status: "AT_FACILITY",
//     label: "At Facility",
//     subLabel: "Items received at our center",
//     icon: "business",
//   },
  {
    status: "PROCESSING",
    label: "Processing",
    subLabel: "Cleaning & care in progress",
    icon: "construct",
  },
  {
    status: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    subLabel: "Rider is on the way to you",
    icon: "navigate",
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    subLabel: "Your order has been delivered",
    icon: "home",
  },
];

// ETA per status
const ETA_MAP: Record<OrderStatus, string> = {
  CONFIRMED: "Pickup in ~15 mins",
  PICKED_UP: "Arriving at facility in ~25 mins",
  IN_TRANSIT: "Arriving at facility in ~18 mins",
  AT_FACILITY: "Processing starts shortly",
  PROCESSING: "Ready for delivery tomorrow",
  OUT_FOR_DELIVERY: "Arriving in ~8 mins",
  DELIVERED: "Delivered successfully",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  CONFIRMED: "#00C896",
  PICKED_UP: "#00C896",
  IN_TRANSIT: "#F59E0B",
  AT_FACILITY: "#3B82F6",
  PROCESSING: "#A855F7",
  OUT_FOR_DELIVERY: "#F97316",
  DELIVERED: "#00C896",
};

// ─── Pulsing live dot ──────────────────────────────────────────────────────────
function LiveDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.5, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: 16, height: 16, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: color,
          opacity,
          transform: [{ scale: pulse }],
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

// ─── Timeline Step ─────────────────────────────────────────────────────────────
function TimelineStep({
  step,
  isCompleted,
  isActive,
  isLast,
  delay,
}: {
  step: (typeof STATUS_FLOW)[0];
  isCompleted: boolean;
  isActive: boolean;
  isLast: boolean;
  delay: number;
}) {
  const slideAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const dotColor = isCompleted || isActive ? "#00C896" : "#1E3530";
  const lineColor = isCompleted ? "#00C896" : "#1A3330";
  const labelColor = isCompleted ? "#00C896" : isActive ? "#FFFFFF" : "#4B5563";

  return (
    <Animated.View
      style={[
        styles.timelineStep,
        { opacity: opacityAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {/* Left: dot + line */}
      <View style={styles.timelineDotCol}>
        <View style={[styles.timelineDot, { backgroundColor: dotColor, borderColor: dotColor }]}>
          {isCompleted && <Ionicons name="checkmark" size={12} color="#000" />}
          {isActive && <View style={styles.timelineDotInner} />}
        </View>
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: lineColor }]} />}
      </View>

      {/* Right: content */}
      <View style={styles.timelineContent}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons
            name={step.icon as any}
            size={14}
            color={isCompleted || isActive ? "#00C896" : "#4B5563"}
          />
          <Text style={[styles.timelineLabel, { color: labelColor }]}>{step.label}</Text>
          {isActive && (
            <View style={[styles.activeBadge]}>
              <Text style={styles.activeBadgeText}>LIVE</Text>
            </View>
          )}
        </View>
        <Text style={[styles.timelineSubLabel, { color: isActive ? "#9CA3AF" : "#374151" }]}>
          {step.subLabel}
        </Text>
        {isCompleted && (
          <Text style={styles.timelineTime}>
            {step.status === "CONFIRMED" ? "2:14 PM" : step.status === "PICKED_UP" ? "2:31 PM" : ""}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function OrderTrackingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Change this to test different statuses:
  // "CONFIRMED" | "PICKED_UP" | "IN_TRANSIT" | "AT_FACILITY" | "PROCESSING" | "OUT_FOR_DELIVERY" | "DELIVERED"
  const currentStatus: OrderStatus = "OUT_FOR_DELIVERY";

  const statusIndex = STATUS_FLOW.findIndex((s) => s.status === currentStatus);
  const accentColor = STATUS_COLOR[currentStatus];
  const eta = ETA_MAP[currentStatus];

  const headerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const subtotal = ORDER_ITEMS.reduce((acc, i) => acc + i.price, 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* ── Header ── */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Track Order</Text>
          <Text style={styles.headerSub}>Order #DRY-20847</Text>
        </View>

        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="headset-outline" size={18} color="#00C896" />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Status Hero ── */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <LinearGradient
            colors={["#071018", "#0D1F1C", "#071018"]}
            style={styles.statusHero}
          >
            {/* Glow orb */}
            <View style={[styles.glowOrb, { backgroundColor: accentColor + "22" }]} />

            <View style={styles.statusHeroInner}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <LiveDot color={accentColor} />
                <Text style={[styles.statusLiveTag, { color: accentColor }]}>
                  {STATUS_FLOW[statusIndex].label.toUpperCase()}
                </Text>
              </View>

              <Text style={styles.statusEtaText}>{eta}</Text>

              {/* Status icon ring */}
              <View style={[styles.statusIconRing, { borderColor: accentColor + "44" }]}>
                <View style={[styles.statusIconInner, { backgroundColor: accentColor + "22" }]}>
                  <Ionicons
                    name={STATUS_FLOW[statusIndex].icon as any}
                    size={32}
                    color={accentColor}
                  />
                </View>
              </View>
            </View>

            {/* Mini progress bar */}
            <View style={styles.miniProgressWrap}>
              {STATUS_FLOW.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniProgressSeg,
                    {
                      backgroundColor:
                        i <= statusIndex ? accentColor : "#1A3330",
                      flex: 1,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.miniProgressLabel}>
              Step {statusIndex + 1} of {STATUS_FLOW.length}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* ── Rider Card ── */}
        {(currentStatus === "PICKED_UP" ||
          currentStatus === "IN_TRANSIT" ||
          currentStatus === "OUT_FOR_DELIVERY") && (
          <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Your Rider</Text>
              <View style={styles.riderRatingPill}>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <Text style={styles.riderRatingText}>{RIDER.rating}</Text>
              </View>
            </View>

            <View style={styles.riderRow}>
              {/* Avatar */}
              <View style={styles.riderAvatar}>
                <Text style={styles.riderAvatarText}>{RIDER.initials}</Text>
                {/* Online dot */}
                <View style={styles.riderOnlineDot} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.riderName}>{RIDER.name}</Text>
                <Text style={styles.riderRole}>{RIDER.role}</Text>
                <View style={styles.vehicleRow}>
                  <Ionicons name="bicycle-outline" size={12} color="#6B7280" />
                  <Text style={styles.vehicleText}>{RIDER.vehicle}</Text>
                </View>
                <Text style={styles.deliveriesText}>
                  🏆 {RIDER.totalDeliveries.toLocaleString()} deliveries completed
                </Text>
              </View>
            </View>

            <View style={styles.riderActions}>
              <TouchableOpacity style={[styles.riderActionBtn, { flex: 1 }]}>
                <Ionicons name="call" size={16} color="#00C896" />
                <Text style={styles.riderActionText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.riderActionBtn, { flex: 1 }]}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#00C896" />
                <Text style={styles.riderActionText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.riderActionBtn, { flex: 1 }]}>
                <Ionicons name="navigate" size={16} color="#00C896" />
                <Text style={styles.riderActionText}>Track Live</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ── Order Timeline ── */}
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <Text style={styles.cardTitle}>Order Timeline</Text>
          <View style={{ marginTop: 16 }}>
            {STATUS_FLOW.map((step, i) => (
              <TimelineStep
                key={step.status}
                step={step}
                isCompleted={i < statusIndex}
                isActive={i === statusIndex}
                isLast={i === STATUS_FLOW.length - 1}
                delay={i * 60}
              />
            ))}
          </View>
        </Animated.View>

        {/* ── Order Items ── */}
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Order Items</Text>
            <View style={styles.itemCountBadge}>
              <Text style={styles.itemCountText}>{ORDER_ITEMS.length} items</Text>
            </View>
          </View>

          <View style={{ marginTop: 14, gap: 10 }}>
            {ORDER_ITEMS.map((item, i) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.orderItemLeft}>
                  <View style={styles.orderItemIcon}>
                    <Ionicons
                      name={
                        item.service === "Shoe Spa"
                          ? "footsteps"
                          : item.service === "Dry Clean"
                          ? "shirt"
                          : "water"
                      }
                      size={16}
                      color="#00C896"
                    />
                  </View>
                  <View>
                    <Text style={styles.orderItemName}>{item.name}</Text>
                    <Text style={styles.orderItemService}>{item.service}</Text>
                  </View>
                </View>
                <Text style={styles.orderItemPrice}>₹{item.price}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Pricing */}
          <View style={{ gap: 8 }}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>₹{subtotal}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>₹{gst}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery</Text>
              <Text style={[styles.priceValue, { color: "#00C896" }]}>FREE</Text>
            </View>
            <View style={[styles.divider, { marginVertical: 4 }]} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total Paid</Text>
              <Text style={styles.priceTotalValue}>₹{total}</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Pickup & Delivery Address ── */}
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <Text style={styles.cardTitle}>Addresses</Text>

          <View style={{ marginTop: 14, gap: 0 }}>
            {/* Pickup */}
            <View style={styles.addressRow}>
              <View style={[styles.addressDot, { backgroundColor: "#00C896" }]} />
              <View style={styles.addressLine} />
              <View>
                <Text style={styles.addressType}>Pickup Address</Text>
                <Text style={styles.addressText}>
                  B-204, Stellar One, Sector 70{"\n"}Noida, Uttar Pradesh 201309
                </Text>
              </View>
            </View>

            {/* Drop */}
            <View style={styles.addressRow}>
              <View style={[styles.addressDot, { backgroundColor: "#F59E0B" }]} />
              <View>
                <Text style={styles.addressType}>Delivery Address</Text>
                <Text style={styles.addressText}>
                  B-204, Stellar One, Sector 70{"\n"}Noida, Uttar Pradesh 201309
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── Support & Actions ── */}
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <Text style={styles.cardTitle}>Need Help?</Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            <TouchableOpacity style={styles.supportBtn}>
              <Ionicons name="chatbubbles-outline" size={18} color="#00C896" />
              <Text style={styles.supportBtnText}>Chat with Support</Text>
              <Ionicons name="chevron-forward" size={16} color="#4B5563" style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportBtn}>
              <Ionicons name="document-text-outline" size={18} color="#00C896" />
              <Text style={styles.supportBtnText}>View Invoice</Text>
              <Ionicons name="chevron-forward" size={16} color="#4B5563" style={{ marginLeft: "auto" }} />
            </TouchableOpacity>
            {currentStatus !== "DELIVERED" && (
              <TouchableOpacity style={[styles.supportBtn, { borderColor: "#7F1D1D" }]}>
                <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
                <Text style={[styles.supportBtnText, { color: "#EF4444" }]}>Cancel Order</Text>
                <Ionicons name="chevron-forward" size={16} color="#4B5563" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#071018",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A3330",
    backgroundColor: "#071018",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0D1F1C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1A3330",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  headerSub: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "600",
    marginTop: 1,
  },
  helpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1A3330",
    backgroundColor: "#0D1F1C",
  },
  helpText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00C896",
  },

  // Status Hero
  statusHero: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1A3330",
  },
  glowOrb: {
    position: "absolute",
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  statusHeroInner: {
    alignItems: "center",
    paddingVertical: 10,
  },
  statusLiveTag: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  statusEtaText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 18,
    marginTop: 4,
  },
  statusIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statusIconInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  miniProgressWrap: {
    flexDirection: "row",
    gap: 4,
    marginTop: 16,
    borderRadius: 4,
    overflow: "hidden",
  },
  miniProgressSeg: {
    height: 4,
    borderRadius: 2,
  },
  miniProgressLabel: {
    fontSize: 11,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
  },

  // Card
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#0D1F1C",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1A3330",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Rider
  riderRatingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#1A3330",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  riderRatingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59E0B",
  },
  riderRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
    alignItems: "flex-start",
  },
  riderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#00C896",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  riderAvatarText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#000",
  },
  riderOnlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#0D1F1C",
  },
  riderName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  riderRole: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
    marginBottom: 4,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  vehicleText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  deliveriesText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "600",
  },
  riderActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  riderActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#071018",
    borderWidth: 1,
    borderColor: "#1A3330",
  },
  riderActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#00C896",
  },

  // Timeline
  timelineStep: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 0,
  },
  timelineDotCol: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#000",
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginTop: 2,
    marginBottom: 2,
    borderRadius: 1,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  activeBadge: {
    backgroundColor: "#00C89622",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#00C896",
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#00C896",
    letterSpacing: 1,
  },
  timelineSubLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  timelineTime: {
    fontSize: 10,
    color: "#374151",
    fontWeight: "600",
    marginTop: 3,
  },

  // Order items
  itemCountBadge: {
    backgroundColor: "#1A3330",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  itemCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
  },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  orderItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  orderItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#071018",
    borderWidth: 1,
    borderColor: "#1A3330",
    alignItems: "center",
    justifyContent: "center",
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  orderItemService: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "500",
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  // Pricing
  divider: {
    height: 1,
    backgroundColor: "#1A3330",
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "600",
  },
  priceTotalLabel: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "800",
  },
  priceTotalValue: {
    fontSize: 17,
    color: "#00C896",
    fontWeight: "900",
  },

  // Addresses
  addressRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  addressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    flexShrink: 0,
  },
  addressLine: {
    position: "absolute",
    left: 4,
    top: 20,
    width: 2,
    height: 38,
    backgroundColor: "#1A3330",
  },
  addressType: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  addressText: {
    fontSize: 13,
    color: "#9CA3AF",
    fontWeight: "500",
    lineHeight: 20,
  },

  // Support
  supportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#071018",
    borderWidth: 1,
    borderColor: "#1A3330",
  },
  supportBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D1D5DB",
  },
});