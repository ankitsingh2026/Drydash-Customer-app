import { PickupRecord } from "@/features/pickups/pickup.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import OrderStatusBadge from "./OrderStatusBadge";

type PickupStatusCardProps = {
    pickup: PickupRecord;
    onPress?: () => void;
    onClose?: () => void;
};

type CardVariant =
    | "scheduled"
    | "assigned"
    | "processing"
    | "paid"
    | "delivery"
    | "completed"
    | "cancelled";

type VariantConfig = {
    variant: CardVariant;
    label: string;
    accent: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    title: string;
    subtitle?: string;
};

const ACCENT = "#29E6B0";
const SURFACE = "#0D1F1C";
const BORDER = "#1A3330";
const MUTED = "#6B7280";

const STATUS_ALIASES: Record<string, CardVariant> = {
    pending: "scheduled",
    schedule: "scheduled",
    scheduled: "scheduled",
    assigned: "assigned",
    riderassigned: "assigned",
    processing: "processing",
    active: "processing",
    inprogress: "processing",
    pickupprocessing: "processing",
    paid: "paid",
    paymentpaid: "paid",
    delivered: "completed",
    complete: "completed",
    completed: "completed",
    outfordelivery: "delivery",
    delivery: "delivery",
    outfordelievry: "delivery",
    cancelled: "cancelled",
    canceled: "cancelled",
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

const initials = (name?: string) => {
    const parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "DD";
    return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
};

const normalizeStatus = (pickup: PickupRecord): CardVariant => {
    const rawStatus = String(pickup.PickupStatus ?? "").trim().toLowerCase();
    const key = rawStatus.replace(/[^a-z]/g, "");
    const paymentStatus = String(pickup.paymentStatus ?? "").trim().toLowerCase();

    if (pickup.cancelledAt || pickup.cancelNote) return "cancelled";
    if (
        pickup.isPaid ||
        rawStatus === "paid" ||
        rawStatus === "payment_paid" ||
        paymentStatus === "paid" ||
        paymentStatus === "success" ||
        paymentStatus === "completed"
    ) {
        return "paid";
    }

    return STATUS_ALIASES[key] ?? "scheduled";
};

const getVariantConfig = (pickup: PickupRecord): VariantConfig => {
    const variant = normalizeStatus(pickup);
    const riderName = pickup.riderName || pickup.contactName || pickup.Name || "";
    const pickupDate = formatDate(pickup.rescheduledDate || pickup.pickup_date);
    const pickupTime = formatTime(pickup.rescheduledDate || pickup.pickup_date);

    switch (variant) {
        case "assigned":
            return {
                variant,
                label: "Rider Assigned",
                accent: ACCENT,
                icon: "person-outline",
                title: riderName
                    ? `${riderName} is on the way to pick up.`
                    : "Your rider is on the way to pick up.",
                subtitle: pickupDate
                    ? `${pickupDate}${pickupTime ? ` • ${pickupTime}` : ""}`
                    : "We are preparing your pickup.",
            };
        case "processing":
            return {
                variant,
                label: "Active Order",
                accent: ACCENT,
                icon: "time-outline",
                title: "Processing your order",
                subtitle:
                    pickup.slot && pickup.slot !== "NA"
                        ? `Slot: ${pickup.slot}`
                        : "Your items are being prepared for the next step.",
            };
        case "paid":
            return {
                variant,
                label: "Paid",
                accent: ACCENT,
                icon: "checkmark-circle-outline",
                title: "Payment successful. Sit back and relax.",
                subtitle: pickupDate
                    ? `${pickupDate}${pickupTime ? ` • ${pickupTime}` : ""}`
                    : "Your payment has been received.",
            };
        case "delivery":
            return {
                variant,
                label: "Out For Delivery",
                accent: ACCENT,
                icon: "bicycle-outline",
                title: riderName
                    ? `${riderName} is on the way to deliver.`
                    : "Your order is on the way to deliver.",
                subtitle: pickup._id
                    ? `Order #${pickup._id.slice(-6).toUpperCase()} • ${pickupDate || "Today"}`
                    : "Your delivery is in progress.",
            };
        case "completed":
            return {
                variant,
                label: "Order Completed",
                accent: ACCENT,
                icon: "checkmark-done-outline",
                title: riderName ? `Delivered by ${riderName}` : "Delivered successfully",
                subtitle:
                    "Your order has been successfully delivered to your doorstep.",
            };
        case "cancelled":
            return {
                variant,
                label: "Order Cancelled",
                accent: "#EF4444",
                icon: "close-circle-outline",
                title: "This pickup was cancelled.",
                subtitle: pickup.cancelNote || "You can book a new pickup anytime.",
            };
        case "scheduled":
        default:
            return {
                variant: "scheduled",
                label: pickup.isRescheduled ? "Rescheduled Pickup" : "Pickup Scheduled",
                accent: ACCENT,
                icon: "calendar-outline",
                title: pickupDate
                    ? `Pickup scheduled for ${pickupDate}`
                    : "Pickup scheduled for today",
                subtitle: pickupTime
                    ? `Pickup time ${pickupTime}`
                    : pickup.slot && pickup.slot !== "NA"
                        ? pickup.slot
                        : "We will assign a rider shortly.",
            };
    }
};

function CardShell({
    badgeLabel,
    badgeAccent,
    badgeIcon,
    title,
    subtitle,
    onClose,
    children,
}: {
    badgeLabel: string;
    badgeAccent: string;
    badgeIcon: React.ComponentProps<typeof Ionicons>["name"];
    title: string;
    subtitle?: string;
    onClose?: () => void;
    children?: React.ReactNode;
}) {
    return (
        <View style={styles.card}>
            <View style={[{ backgroundColor: badgeAccent }]} />
            <View style={styles.inner}>
                <View style={styles.topRow}>
                    <OrderStatusBadge
                        label={badgeLabel}
                        accent={badgeAccent}
                        icon={badgeIcon}
                    />
                    {onClose ? (
                        <TouchableOpacity
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={onClose}
                        >
                            <Ionicons name="close" size={16} color={MUTED} />
                        </TouchableOpacity>
                    ) : null}
                </View>

                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

                {children}
            </View>
        </View>
    );
}

function ActionButton({
    label,
    icon,
    variant = "ghost",
    onPress,
}: {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    variant?: "ghost" | "solid";
    onPress?: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.86}
            onPress={onPress}
            style={[
                styles.actionButton,
                variant === "solid"
                    ? styles.actionButtonSolid
                    : styles.actionButtonGhost,
            ]}
        >
            <Ionicons
                name={icon}
                size={14}
                color={
                    variant === "solid"
                        ? "#000"
                        : label === "Cancel"
                            ? "#f37e7e"
                            : ACCENT
                }
            />
            <Text
                style={[
                    styles.actionText,
                    variant === "solid"
                        ? styles.actionTextSolid
                        : [
                            styles.actionTextGhost,
                            label === "Cancel" && { color: "#f37e7e" }
                        ],
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function MetaRow({ pickup }: { pickup: PickupRecord }) {
    return (
        <View style={styles.metaRow}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                    {initials(pickup.riderName || pickup.contactName || pickup.Name)}
                </Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.metaTitle} numberOfLines={1}>
                    {pickup.riderName || pickup.contactName || pickup.Name || "Drydash rider"}
                </Text>
                <Text style={styles.metaSubtitle} numberOfLines={1}>
                    {pickup.Address || pickup.deliveryAddress || pickup.plantName || "Pickup details are being prepared."}
                </Text>
            </View>
        </View>
    );
}

function ScheduledPickupCard({ pickup, onClose }: PickupStatusCardProps) {
    return (
        <CardShell
            badgeLabel={pickup.isRescheduled ? "Rescheduled Pickup" : "Pickup Scheduled"}
            badgeAccent={ACCENT}
            badgeIcon="calendar-outline"
            title={formatDate(pickup.rescheduledDate || pickup.pickup_date) ? `Pickup scheduled for ${formatDate(pickup.rescheduledDate || pickup.pickup_date)}` : "Pickup scheduled for today"}
            subtitle={pickup.slot && pickup.slot !== "NA" ? `Pickup time ${pickup.slot}` : "We will assign a rider shortly."}
            onClose={onClose}
        >
            <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={13} color={MUTED} />
                <Text style={styles.detailText} numberOfLines={1}>
                    {pickup.Address || pickup.deliveryAddress || "Pickup address will appear here."}
                </Text>
            </View>

            <View style={styles.buttonRow}>
                <ActionButton label="Reschedule" icon="calendar-outline" />
                <ActionButton label="Cancel" icon="close-circle-outline" />
            </View>
        </CardShell>
    );
}

function AssignedPickupCard({ pickup, onClose }: PickupStatusCardProps) {
    return (
        <CardShell
            badgeLabel="Rider Assigned"
            badgeAccent={ACCENT}
            badgeIcon="person-outline"
            title={`${pickup.riderName || pickup.contactName || pickup.Name || "Your rider"} is on the way to pick up.`}
            subtitle={pickup.slot && pickup.slot !== "NA" ? pickup.slot : "Your pickup is confirmed and queued for collection."}
            onClose={onClose}
        >
            <MetaRow pickup={pickup} />

            <View style={styles.buttonRow}>
                <ActionButton label="Add Items" icon="add-outline" variant="solid" />
                <ActionButton label="Chat" icon="chatbubble-outline" />
            </View>
        </CardShell>
    );
}

function ProcessingPickupCard({ pickup, onClose }: PickupStatusCardProps) {
    return (
        <CardShell
            badgeLabel="Active Order"
            badgeAccent={ACCENT}
            badgeIcon="time-outline"
            title="Processing your order"
            subtitle={pickup.slot && pickup.slot !== "NA" ? `Slot: ${pickup.slot}` : "Your items are being processed."}
            onClose={onClose}
        >
            <View style={styles.detailRow}>
                <Ionicons name="shirt-outline" size={13} color={MUTED} />
                <Text style={styles.detailText} numberOfLines={1}>
                    {`${pickup.items?.length ?? 0} items in progress`}
                </Text>
            </View>

            <View style={styles.buttonRow}>
                <ActionButton label="Pay Now" icon="arrow-forward" variant="solid" />
                <ActionButton label="Track" icon="navigate-outline" />
            </View>
        </CardShell>
    );
}

function PaidPickupCard({ pickup, onClose }: PickupStatusCardProps) {
    return (
        <CardShell
            badgeLabel="Paid"
            badgeAccent={ACCENT}
            badgeIcon="checkmark-circle-outline"
            title="Payment successful. Sit back and relax."
            subtitle={formatDate(pickup.updatedAt || pickup.createdAt) ? `${formatDate(pickup.updatedAt || pickup.createdAt)} • ${formatTime(pickup.updatedAt || pickup.createdAt)}` : "Your payment has been received."}
            onClose={onClose}
        >
            <MetaRow pickup={pickup} />

            <View style={styles.buttonRow}>
                <ActionButton label="Reschedule Delivery" icon="calendar-outline" />
                <ActionButton label="Chat" icon="chatbubble-outline" />
            </View>
        </CardShell>
    );
}

function DeliveryPickupCard({ pickup, onClose }: PickupStatusCardProps) {
    return (
        <CardShell
            badgeLabel="Out For Delivery"
            badgeAccent={ACCENT}
            badgeIcon="bicycle-outline"
            title={`${pickup.riderName || pickup.contactName || pickup.Name || "Your rider"} is on the way to deliver.`}
            subtitle={pickup._id ? `Order #${pickup._id.slice(-6).toUpperCase()} • ${formatDate(pickup.pickup_date || pickup.updatedAt) || "Today"}` : "Your delivery is in transit."}
            onClose={onClose}
        >
            <MetaRow pickup={pickup} />

            <View style={styles.buttonRow}>
                <ActionButton label="Track" icon="navigate-outline" variant="solid" />
                <ActionButton label="Chat Rider" icon="chatbubble-outline" />
            </View>
        </CardShell>
    );
}

function CompletedPickupCard({ pickup, onClose }: PickupStatusCardProps) {
    return (
        <CardShell
            badgeLabel="Order Completed"
            badgeAccent={ACCENT}
            badgeIcon="checkmark-done-outline"
            title={pickup.riderName ? `Delivered by ${pickup.riderName}` : "Delivered successfully"}
            subtitle="Your order has been successfully delivered to your doorstep."
            onClose={onClose}
        >
            <View style={styles.reviewRow}>
                <Ionicons name="star" size={18} color={ACCENT} />
                <Ionicons name="star" size={18} color={ACCENT} />
                <Ionicons name="star" size={18} color={ACCENT} />
                <Ionicons name="star" size={18} color={ACCENT} />
                <Ionicons name="star" size={18} color="#31423D" />
            </View>

            <View style={styles.buttonRow}>
                <ActionButton label="Write a Review" icon="create-outline" variant="solid" />
                <ActionButton label="View Receipt" icon="receipt-outline" />
            </View>
        </CardShell>
    );
}

function CancelledPickupCard({ pickup, onClose }: PickupStatusCardProps) {
    return (
        <CardShell
            badgeLabel="Order Cancelled"
            badgeAccent="#EF4444"
            badgeIcon="close-circle-outline"
            title="This pickup was cancelled."
            subtitle={pickup.cancelNote || "You can book a new pickup anytime."}
            onClose={onClose}
        >
            <View style={styles.buttonRow}>
                <ActionButton label="Book Again" icon="add-outline" variant="solid" />
                <ActionButton label="Support" icon="help-circle-outline" />
            </View>
        </CardShell>
    );
}

export default function PickupStatusCard({
    pickup,
    onPress,
    onClose,
}: PickupStatusCardProps) {
    const config = useMemo(() => getVariantConfig(pickup), [pickup]);
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const translateAnim = useRef(new Animated.Value(14)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 320,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(translateAnim, {
                toValue: 0,
                duration: 320,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, [opacityAnim, translateAnim, pickup._id]);

    const card = (() => {
        switch (config.variant) {
            case "assigned":
                return <AssignedPickupCard pickup={pickup} onClose={onClose} />;
            case "processing":
                return <ProcessingPickupCard pickup={pickup} onClose={onClose} />;
            case "paid":
                return <PaidPickupCard pickup={pickup} onClose={onClose} />;
            case "delivery":
                return <DeliveryPickupCard pickup={pickup} onClose={onClose} />;
            case "completed":
                return <CompletedPickupCard pickup={pickup} onClose={onClose} />;
            case "cancelled":
                return <CancelledPickupCard pickup={pickup} onClose={onClose} />;
            case "scheduled":
            default:
                return <ScheduledPickupCard pickup={pickup} onClose={onClose} />;
        }
    })();

    const content = (
        <Animated.View
            style={{ opacity: opacityAnim, transform: [{ translateY: translateAnim }] }}
        >
            {card}
        </Animated.View>
    );

    if (!onPress) {
        return content;
    }

    return (
        <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
            {content}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: SURFACE,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },

    inner: {
        padding: 14,
        gap: 10,
    },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "800",
        lineHeight: 24,
    },
    subtitle: {
        color: MUTED,
        fontSize: 12,
        fontWeight: "500",
        lineHeight: 17,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#071A17",
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        color: ACCENT,
        fontSize: 12,
        fontWeight: "800",
    },
    metaTitle: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
    metaSubtitle: {
        color: MUTED,
        fontSize: 11,
        marginTop: 2,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    detailText: {
        color: "#A7B8B2",
        fontSize: 12,
        fontWeight: "500",
        flex: 1,
    },
    buttonRow: {
        flexDirection: "row",
        gap: 10,
        flexWrap: "wrap",
    },
    actionButton: {
        minHeight: 30,
        paddingHorizontal: 12,
        borderRadius: 999,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    actionButtonSolid: {
        backgroundColor: ACCENT,
    },
    actionButtonGhost: {
        backgroundColor: "#071A17",
        borderWidth: 1,
        borderColor: BORDER,
    },
    actionText: {
        fontSize: 12,
        fontWeight: "800",
    },
    actionTextSolid: {
        color: "#000",
    },
    actionTextGhost: {
        color: ACCENT,
    },
    reviewRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
});

