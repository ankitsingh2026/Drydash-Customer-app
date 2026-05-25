import { cancelPickupApi, reschedulePickupApi } from "@/features/pickups/pickup.api";
import { PickupRecord } from "@/features/pickups/pickup.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Easing,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import CancelPickupConfirmModal from "./CancelPickupConfirmModal";
import ReschedulePickupModal from "./ReschedulePickupModal";
import { router } from "expo-router";
type PickupStatusCardProps = {
    pickup: PickupRecord;
    onPress?: () => void;
    onClose?: () => void;
    onActionComplete?: () => void;
};

type CardVariant =
    | "scheduled"
    | "assigned"
    | "processing"
    | "paid"
    | "delivery"
    | "completed"
    | "cancelled";

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
    pickupassigned: "assigned",
    processing: "processing",
    active: "processing",
    inprogress: "processing",
    pickupprocessing: "processing",
    paid: "paid",
    paymentpaid: "paid",
    delivered: "completed",
    complete: "completed",
    completed: "completed",
    deleted: "cancelled",
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

const isToday = (value?: string) => {
    if (!value) return true;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return true;

    const now = new Date();
    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
};
const getSlotFromPickup = (pickup: PickupRecord) => {
    if (pickup?.bookingId?.slotTime) {
        return pickup.bookingId.slotTime;
    }
    if (pickup?.slot && pickup.slot !== "NA") {
        return pickup.slot;
    }
    return "";
};

const getSlotEndLabel = (pickup: PickupRecord) => {
    const slot = getSlotFromPickup(pickup);

    if (!slot) return "6:00 PM";

    const parts = slot.split("-");
    if (parts.length < 2) return slot;
    return parts[1].trim();
};

const getScheduledTitle = (pickup: PickupRecord) => {
    const scheduleDate = pickup.rescheduledDate || pickup.pickup_date;
    const endLabel = getSlotEndLabel(pickup);

    if (isToday(scheduleDate)) {
        return `Pickup today before ${endLabel}`;
    }

    const dateLabel = formatDate(scheduleDate);
    return dateLabel
        ? `Pickup on ${dateLabel} before ${endLabel}`
        : `Pickup before ${endLabel}`;
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

    if (pickup.isDeleted || pickup.cancelledAt || pickup.cancelNote || key === "deleted") return "cancelled";
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

const getOrderCode = (pickup: PickupRecord) => {
    if (!pickup._id) return "";
    const suffix = pickup._id.slice(-4).toUpperCase();
    return `Order #DX-${suffix}`;
};

function StatusPill({ label }: { label: string }) {
    return (
        <View style={styles.statusPill}>
            <Ionicons name="ellipse" size={10} color={ACCENT} />
            <Text style={styles.statusPillText}>{label}</Text>
        </View>
    );
}

function TagPill({
    label,
    icon,
    tone = "default",
}: {
    label: string;
    icon?: React.ComponentProps<typeof Ionicons>["name"];
    tone?: "default" | "danger";
}) {
    return (
        <View style={styles.tagPill}>
            {icon ? (
                <Ionicons
                    name={icon}
                    size={13}
                    color={tone === "danger" ? "#FF9FA8" : "#A5F5D7"}
                />
            ) : null}
            <Text
                style={[
                    styles.tagPillText,
                    tone === "danger" && styles.tagPillTextDanger,
                ]}
            >
                {label}
            </Text>
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
    return (
        <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
            <TagPill label={label} icon={icon} tone={tone} />
        </TouchableOpacity>
    );
}

function IconPair() {
    return (
        <View style={styles.iconPairWrap}>
            <View style={styles.iconCircle}>
                <Ionicons name="sparkles-outline" size={16} color="#8FD9BE" />
            </View>
            <View style={[styles.iconCircle, styles.iconCircleOverlap]}>
                <Ionicons name="shirt-outline" size={16} color="#8FD9BE" />
            </View>
        </View>
    );
}

function ChatFab() {
    return (
        <TouchableOpacity style={styles.chatFab}
            onPress={() => router.push("/(customer)/(assistant)/chat")}>
            <Ionicons name="chatbubble-ellipses" size={25} color="#003C31" />
        </TouchableOpacity>
    );
}

function RiderAvatar({ pickup }: { pickup: PickupRecord }) {
    return (
        <View style={styles.riderAvatar}>
            <Text style={styles.riderAvatarText}>
                {initials(pickup.riderName || pickup.contactName || pickup.Name)}
            </Text>
        </View>
    );
}

function ScheduledPickupCard({
    pickup,
    onReschedule,
    onCancel,
}: {
    pickup: PickupRecord;
    onReschedule: () => void;
    onCancel: () => void;
}) {
    const getItemCount = (pickup: PickupRecord) => {
        if (!pickup?.items?.length) return 0;
        return pickup.items.reduce((total, item) => total + (item.quantity || 0), 0);
    };
    const itemCount = getItemCount(pickup);
    const highlightTime = getSlotEndLabel(pickup);
    const scheduleTitle = getScheduledTitle(pickup);
    // Split "Pickup today before 3PM" → prefix = "TODAY\nBEFORE ", accent = "3PM"
    const isItToday = isToday(pickup.rescheduledDate || pickup.pickup_date);
    const dateLabel = isItToday ? "TODAY" : formatDate(pickup.rescheduledDate || pickup.pickup_date).toUpperCase();
    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>
                {/* Header */}
                <View style={styles.headerRowCompact}>
                    <StatusPill label={pickup.isRescheduled ? "RESCHEDULED" : "PICKUP SCHEDULED"} />
                    <View style={styles.headerRightActions}>
                        {/* Cart icon with badge */}
                        <View style={styles.cartBadgeWrap}>
                            <Ionicons name="cart-outline" size={20} color="#A5F5D7" />
                            {itemCount > 0 && (
                                <View style={styles.cartBadge}>
                                    <Text style={styles.cartBadgeText}>{itemCount} 12</Text>
                                </View>
                            )}
                        </View>
                        {/* Three-dot menu */}
                        <View style={styles.menuContainer}>
                            <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
                                <Ionicons name="ellipsis-vertical" size={20} color="#A5F5D7" />
                            </TouchableOpacity>
                            {menuVisible && (
                                <View style={styles.dropdownMenu}>
                                    <ActionTagButton
                                        label="Reschedule"
                                        icon="calendar-outline"
                                        onPress={() => { setMenuVisible(false); onReschedule(); }}
                                    />
                                    <ActionTagButton
                                        label="Cancel"
                                        icon="close-outline"
                                        tone="danger"
                                        onPress={() => { setMenuVisible(false); onCancel(); }}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Sublabel + big heading */}
                <View style={styles.pickupHeadingBlock}>
                    <Text style={styles.pickupSubLabel}>PICKUP</Text>
                    <Text style={styles.pickupBigLine}>{dateLabel}</Text>
                    <Text style={styles.pickupBigLine}>
                        BEFORE{" "}
                        <Text style={styles.pickupBigAccent}>{highlightTime.toUpperCase()}</Text>
                    </Text>
                </View>

                {/* Bottom row */}
                <View style={styles.bottomRowCompact}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                            router.push({
                                pathname: "/services/shoe",
                                params: { pickupId: pickup._id, mode: "edit" },
                            })
                        }
                    >
                        <TagPill label="+ ADD ITEMS" />
                    </TouchableOpacity>
                    <ChatFab />
                </View>
            </View>
        </View>
    );
}

function AssignedPickupCard({ pickup }: PickupStatusCardProps) {
    const itemCount = pickup.items?.length ?? 0;
    const riderName = pickup.riderName || pickup.contactName || pickup.Name || "Your rider";
    const highlightTime = getSlotEndLabel(pickup);
    const isItToday = isToday(pickup.rescheduledDate || pickup.pickup_date);
    const dateLabel = isItToday ? "TODAY" : formatDate(pickup.rescheduledDate || pickup.pickup_date).toUpperCase();

    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <StatusPill label="RIDER ASSIGNED" />
                    <View style={styles.cartBadgeWrap}>
                        <Ionicons name="cart-outline" size={20} color="#A5F5D7" />
                        {itemCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{itemCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
                {/* Heading + rider side by side */}
                <View style={styles.assignedContentRow}>
                    <View style={styles.pickupHeadingBlock}>
                        <Text style={styles.pickupSubLabel}>PICKUP</Text>
                        <Text style={styles.pickupBigLine}>{dateLabel}</Text>
                        <Text style={styles.pickupBigLine}>
                            BEFORE{" "}
                            <Text style={styles.pickupBigAccent}>{highlightTime.toUpperCase()}</Text>
                        </Text>
                    </View>
                    <View style={styles.assignedRiderRight}>
                        <Ionicons name="bicycle-outline" size={18} color="#86DCC0" />
                        <Text style={styles.assignedRiderText}>
                            <Text style={styles.assignedRiderName}>{riderName}</Text>
                            {" is on the way"}
                        </Text>
                    </View>
                </View>

                {/* Bottom row */}
                <View style={styles.bottomRowCompact}>
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() =>
                            router.push({
                                pathname: "/services/shoe",
                                params: { pickupId: pickup._id, mode: "edit" },
                            })
                        }
                    >
                        <TagPill label="+ ADD ITEMS" />
                    </TouchableOpacity>
                    <ChatFab />
                </View>
            </View>
        </View>
    );
}

function ProcessingPickupCard({ pickup }: PickupStatusCardProps) {
    const itemCount = pickup.items?.length ?? 0;

    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>
                {/* Header: status + payment pending pill + chat */}
                <View style={styles.headerRowCompact}>
                    <StatusPill label="ACTIVE ORDER" />
                    <View style={styles.processingHeaderRight}>
                        <View style={styles.paymentPendingPill}>
                            <Ionicons name="flash" size={12} color="#F5C842" />
                            <Text style={styles.paymentPendingText}>Payment pending</Text>
                        </View>
                        <ChatFab />
                    </View>
                </View>

                {/* Hint line */}
                <View style={styles.hintRow}>
                    <Ionicons name="flash" size={13} color="#86DCC0" />
                    <Text style={styles.payHintText}>PAY NOW TO CHOOSE DELIVERY SLOT</Text>
                </View>

                {/* Big title */}
                <Text style={styles.processingBigTitle}>PROCESSING YOUR{"\n"}ORDER</Text>

                {/* Items tag */}
                <TagPill label={`Total items: ${itemCount}`} />

                {/* Full-width Pay Now */}
                <TouchableOpacity style={styles.payNowBtnFull}>
                    <Text style={styles.payNowText}>Pay now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function PaidPickupCard({
    pickup,
    onReschedule,
}: {
    pickup: PickupRecord;
    onReschedule: () => void;
}) {
    const itemCount = pickup.items?.length ?? 0;

    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>
                {/* Header: status + paid pill + chat */}
                <View style={styles.headerRowCompact}>
                    <StatusPill label="ACTIVE ORDER" />
                    <View style={styles.processingHeaderRight}>
                        <TagPill label="Paid" icon="checkmark-circle-outline" />
                        <ChatFab />
                    </View>
                </View>

                {/* Hint line */}
                <View style={styles.hintRow}>
                    <Ionicons name="flash" size={13} color="#86DCC0" />
                    <Text style={styles.payHintText}>PAY NOW TO CHOOSE DELIVERY SLOT</Text>
                </View>

                {/* Big title */}
                <Text style={styles.processingBigTitle}>PROCESSING YOUR{"\n"}ORDER</Text>

                {/* Items tag */}
                <TagPill label={`Total items: ${itemCount}`} />
            </View>
        </View>
    );
}

function DeliveryPickupCard({ pickup }: PickupStatusCardProps) {
    const orderCode = getOrderCode(pickup);
    const riderName = (
        pickup.riderName || pickup.contactName || pickup.Name || "Rider"
    ).toUpperCase();
    const deliveryTime = formatTime(pickup.updatedAt || pickup.pickup_date);
    const itemCount = pickup.items?.length ?? 0;
    const isPaid = pickup.isPaid;

    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>
                {/* Header */}
                <View style={styles.headerRowCompact}>
                    <StatusPill label="OUT FOR DELIVERY" />
                    <View style={styles.processingHeaderRight}>
                        {isPaid ? (
                            <TagPill label="Paid" icon="checkmark-circle-outline" />
                        ) : (
                            <View style={styles.paymentPendingPill}>
                                <Ionicons name="flash" size={12} color="#F5C842" />
                                <Text style={styles.paymentPendingText}>Payment pending</Text>
                            </View>
                        )}
                        <ChatFab />
                    </View>
                </View>

                {/* Big rider name + subtitle */}
                <View style={styles.deliveryRiderBlock}>
                    <Ionicons name="bicycle-outline" size={32} color="#86DCC0" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.deliveryRiderName}>{riderName}</Text>
                        <Text style={styles.deliveryRiderSub}>
                            {"on  the way with\nyour delivery"}
                        </Text>
                    </View>
                </View>

                {/* Meta: items pill + order code */}
                <View style={styles.deliveryBottomMeta}>
                    <TagPill label={`Total items: ${itemCount}`} />
                    <Text style={styles.deliveryMetaText}>
                        {orderCode}
                        {deliveryTime ? ` • ${deliveryTime}` : ""}
                    </Text>
                </View>

                {/* Pay now — only if not paid */}
                {!isPaid && (
                    <TouchableOpacity style={styles.payNowBtnFull}>
                        <Text style={styles.payNowText}>Pay now</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}


function CompletedPickupCard({ pickup, onClose }: PickupStatusCardProps) {
    const orderCode = getOrderCode(pickup);
    const deliveryTime = formatTime(pickup.updatedAt || pickup.pickup_date);
    const itemCount = pickup.items?.length ?? 0;

    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>

                {/* Header: pill + DISMISS */}
                <View style={styles.headerRowCompact}>
                    <StatusPill label="ORDER COMPLETED" />
                    {onClose ? (
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.dismissText}>DISMISS</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* Big title */}
                <Text style={styles.completedBigTitle}>DELIVERED{"\n"}SUCCESSFULLY</Text>

                {/* Subtitle */}
                <Text style={styles.completedSubtitle}>
                    Your order has been successfully delivered.
                </Text>

                {/* Meta: items pill + order code + time */}
                <View style={styles.deliveryBottomMeta}>
                    <TagPill label={`Total items delivered: ${itemCount}`} />
                    <Text style={styles.deliveryMetaText}>
                        {orderCode}{deliveryTime ? ` • ${deliveryTime}` : ""}
                    </Text>
                </View>

                {/* Stars */}
                <View style={styles.reviewRowCompact}>
                    <Ionicons name="star" size={26} color="#95F7D5" />
                    <Ionicons name="star" size={26} color="#95F7D5" />
                    <Ionicons name="star" size={26} color="#95F7D5" />
                    <Ionicons name="star" size={26} color="#95F7D5" />
                    <Ionicons name="star-outline" size={26} color="#325348" />
                </View>

                {/* Footer: Give a feedback + chat */}
                <View style={styles.completedFooterRow}>
                    <TouchableOpacity>
                        <Text style={styles.reviewLinkText}>Give a feedback</Text>
                    </TouchableOpacity>
                    <ChatFab />
                </View>

            </View>
        </View>
    );
}

function CancelledPickupCard({ pickup }: PickupStatusCardProps) {
    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>
                <StatusPill label="ORDER CANCELLED" />
                <Text style={styles.strongTitle}>This pickup was cancelled.</Text>
                <Text style={styles.softTitleSmall}>
                    {pickup.cancelNote || "You can book a new pickup anytime."}
                </Text>
            </View>
        </View>
    );
}

function PickupFeedbackModal({
    visible,
    title,
    message,
    tone,
    onClose,
}: {
    visible: boolean;
    title: string;
    message: string;
    tone: "success" | "error" | "info";
    onClose: () => void;
}) {
    const isError = tone === "error";
    const isSuccess = tone === "success";

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.feedbackOverlay}>
                <View style={styles.feedbackSheet}>
                    <View style={styles.feedbackHeaderRow}>
                        <View style={styles.feedbackTitleWrap}>
                            <Ionicons
                                name={
                                    isError
                                        ? "close-circle-outline"
                                        : isSuccess
                                            ? "checkmark-circle-outline"
                                            : "information-circle-outline"
                                }
                                size={18}
                                color={isError ? "#FF9FA8" : isSuccess ? "#95F7D5" : "#9CCFC0"}
                            />
                            <Text
                                style={[
                                    styles.feedbackTitle,
                                    isError && styles.feedbackTitleError,
                                    isSuccess && styles.feedbackTitleSuccess,
                                ]}
                            >
                                {title}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.feedbackCloseBtn}>
                            <Ionicons name="close" size={16} color="#7A9B91" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.feedbackMessage}>{message}</Text>

                    <TouchableOpacity style={styles.feedbackActionBtn} onPress={onClose}>
                        <Text style={styles.feedbackActionText}>Okay</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

export default function PickupStatusCard({
    pickup,
    onPress,
    onClose,
    onActionComplete,
}: PickupStatusCardProps) {
    const variant = useMemo(() => normalizeStatus(pickup), [pickup]);
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const translateAnim = useRef(new Animated.Value(14)).current;
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [feedbackVisible, setFeedbackVisible] = useState(false);
    const [feedbackTitle, setFeedbackTitle] = useState("");
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | "info">("info");

    const showFeedback = (
        title: string,
        message: string,
        tone: "success" | "error" | "info" = "info",
    ) => {
        setFeedbackTitle(title);
        setFeedbackMessage(message);
        setFeedbackTone(tone);
        setFeedbackVisible(true);
    };

    const openCancelModal = () => setCancelModalVisible(true);
    const openRescheduleModal = () => setRescheduleModalVisible(true);

    const closeCancelModal = () => {
        if (actionLoading) return;
        setCancelModalVisible(false);
    };

    const closeRescheduleModal = () => {
        if (actionLoading) return;
        setRescheduleModalVisible(false);
    };

    const closeFeedbackModal = () => {
        setFeedbackVisible(false);
    };

    const handleCancelPickup = async () => {
        if (!pickup?._id) {
            showFeedback("Missing pickup", "Unable to cancel this pickup right now.", "error");
            return;
        }

        try {
            setActionLoading(true);
            await cancelPickupApi(pickup._id);
            setCancelModalVisible(false);
            showFeedback("Pickup cancelled", "Your pickup has been cancelled successfully.", "success");
            onActionComplete?.();
        } catch (error: any) {
            showFeedback("Cancel failed", error?.message || "Unable to cancel pickup.", "error");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReschedulePickup = async (newDate: string) => {
        if (!pickup?._id) {
            showFeedback("Missing pickup", "Unable to reschedule this pickup right now.", "error");
            return;
        }

        try {
            setActionLoading(true);
            await reschedulePickupApi(pickup._id, newDate);
            setRescheduleModalVisible(false);
            showFeedback("Pickup rescheduled", "Your pickup date has been updated.", "success");
            onActionComplete?.();
        } catch (error: any) {
            showFeedback("Reschedule failed", error?.message || "Unable to reschedule pickup.", "error");
        } finally {
            setActionLoading(false);
        }
    };

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
        switch (variant) {
            case "assigned":
                return <AssignedPickupCard pickup={pickup} onClose={onClose} />;
            case "processing":
                return <ProcessingPickupCard pickup={pickup} onClose={onClose} />;
            case "paid":
                return (
                    <PaidPickupCard
                        pickup={pickup}
                        onReschedule={openRescheduleModal}
                    />
                );
            case "delivery":
                return <DeliveryPickupCard pickup={pickup} onClose={onClose} />;
            case "completed":
                return <CompletedPickupCard pickup={pickup} onClose={onClose} />;
            // case "cancelled":
            //     return <CancelledPickupCard pickup={pickup} onClose={onClose} />;
            case "scheduled":
            default:
                return (
                    <ScheduledPickupCard
                        pickup={pickup}
                        onReschedule={openRescheduleModal}
                        onCancel={openCancelModal}
                    />
                );
        }
    })();

    const content = (
        <Animated.View
            style={{ opacity: opacityAnim, transform: [{ translateY: translateAnim }] }}
        >
            {card}
        </Animated.View>
    );

    const wrappedContent = onPress ? (
        <TouchableOpacity activeOpacity={0.92} onPress={onPress}>
            {content}
        </TouchableOpacity>
    ) : (
        content
    );

    return (
        <>
            {wrappedContent}
            <CancelPickupConfirmModal
                visible={cancelModalVisible}
                loading={actionLoading}
                onClose={closeCancelModal}
                onConfirm={handleCancelPickup}
            />
            <ReschedulePickupModal
                visible={rescheduleModalVisible}
                loading={actionLoading}
                initialDate={pickup.rescheduledDate || pickup.pickup_date}
                onClose={closeRescheduleModal}
                onConfirm={handleReschedulePickup}
            />
            <PickupFeedbackModal
                visible={feedbackVisible}
                title={feedbackTitle}
                message={feedbackMessage}
                tone={feedbackTone}
                onClose={closeFeedbackModal}
            />
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: SURFACE,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: BORDER,
        overflow: "visible",
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 4,
    },
    innerCompact: {
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
    },
    headerRowCompact: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        zIndex: 10,
    },
    headerLeftGroup: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerRightSingle: {
        alignItems: "flex-end",
        marginTop: -4,
    },
    rightStack: {
        alignItems: "flex-end",
        gap: 6,
    },
    statusPill: {
        minHeight: 30,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#1F4E42",
        backgroundColor: "#103126",
        paddingHorizontal: 12,
        paddingVertical: 7,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        alignSelf: "flex-start",
    },
    statusPillText: {
        color: "#B2F8DC",
        fontSize: 9.5,
        letterSpacing: 1,
        fontWeight: "800",
    },
    tagPill: {
        minHeight: 28,
        borderRadius: 8,     // was 16 — squarer pill like image
        borderWidth: 1,
        borderColor: "#2A715D",
        backgroundColor: "#12372D",
        paddingHorizontal: 12,
        paddingVertical: 5,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    tagPillText: {
        color: "#9BF0CF",
        fontSize: 12,        // was 11
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    tagPillTextDanger: {
        color: "#FF9FA8",
    },
    orderCodeText: {
        color: "#9AB7AE",
        fontSize: 12,
        fontWeight: "500",
    },
    mainLine: {
        color: "#E9F8F3",
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "500",
    },
    mainLineAccent: {
        color: ACCENT,
        fontWeight: "800",
    },
    strongTitle: {
        color: "#D4ECE5",
        fontSize: 17,
        lineHeight: 22,
        fontWeight: "800",
    },
    softTitle: {
        color: "#82BDAE",
        fontSize: 15,
        lineHeight: 20,
        flex: 1,
    },
    softTitleSmall: {
        color: "#95B6AD",
        fontSize: 12.5,
        lineHeight: 18,
    },
    infoLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    infoLineText: {
        color: "#86DCC0",
        fontSize: 14,
        fontWeight: "600",
    },
    riderLine: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    riderAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#0A1D18",
        borderWidth: 1,
        borderColor: BORDER,
        alignItems: "center",
        justifyContent: "center",
    },
    riderAvatarText: {
        color: ACCENT,
        fontSize: 12,
        fontWeight: "700",
    },
    bottomRowCompact: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    bottomLeftCompact: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    iconPairWrap: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 2,
    },
    iconCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: "#1F4E42",
        backgroundColor: "#102E27",
        alignItems: "center",
        justifyContent: "center",
    },
    iconCircleOverlap: {
        marginLeft: -8,
    },
    chatFab: {
        width: 40,
        height: 40,
        borderRadius: 25,
        backgroundColor: ACCENT,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10,
    },
    payRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    payNowBtn: {
        height: 42,
        borderRadius: 21,
        backgroundColor: ACCENT,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    payNowText: {
        color: "#00382D",
        fontSize: 16,
        fontWeight: "900",
    },
    payHintText: {
        color: "#5B9A88",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 0.8,
        flex: 1,
    },
    chatOnlyRow: {
        alignItems: "flex-end",
        marginTop: -2,
    },
    successRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    successText: {
        color: "#8AE4C4",
        fontSize: 13,
        fontWeight: "500",
    },
    deliveryMetaText: {
        color: "#A9C3BB",
        fontSize: 12,
        fontWeight: "500",
    },
    deliveryContentWrap: {
        flex: 1,
        paddingRight: 8,
    },
    completedRightTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    closeButtonCompact: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
    },
    compDivider: {
        height: 1,
        backgroundColor: "#133A31",
        marginTop: 2,
    },
    rateTitle: {
        color: "#A9C3BB",
        fontSize: 12,
        fontWeight: "700",
    },
    reviewRowCompact: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    reviewLinkRow: {
        marginTop: -2,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        alignSelf: "flex-start",
    },
    reviewLinkText: {
        color: "#95F7D5",
        fontSize: 14,
        fontWeight: "600",
    },
    feedbackOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.55)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    feedbackSheet: {
        width: "100%",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#1A3330",
        backgroundColor: "#0D1F1C",
        padding: 16,
        gap: 10,
    },
    feedbackHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    feedbackTitleWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
    },
    feedbackTitle: {
        color: "#CDECE2",
        fontSize: 16,
        fontWeight: "800",
    },
    feedbackTitleError: {
        color: "#FFB1B7",
    },
    feedbackTitleSuccess: {
        color: "#95F7D5",
    },
    feedbackCloseBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#123329",
        borderWidth: 1,
        borderColor: "#23453E",
    },
    feedbackMessage: {
        color: "#94B8AD",
        fontSize: 13,
        lineHeight: 18,
    },
    feedbackActionBtn: {
        height: 40,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#2A715D",
        backgroundColor: "#29E6B0",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
    },
    feedbackActionText: {
        color: "#00382D",
        fontSize: 13,
        fontWeight: "800",
    },
    dropdownMenu: {
        position: "absolute",
        top: 24,
        right: 0,
        minWidth: 140,

        backgroundColor: "#12372D",
        borderRadius: 10,
        padding: 8,
        gap: 6,
        borderWidth: 1,
        borderColor: "#2A715D",

        zIndex: 9999,
        elevation: 20, // for Android
    },
    menuContainer: {
        position: "relative",
        alignItems: "flex-end",
        zIndex: 1000,
    },
    // Scheduled & Assigned heading block
    pickupHeadingBlock: {
        gap: 0,
    },
    pickupSubLabel: {
        color: MUTED,
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 1.2,
        marginBottom: 2,
    },
    pickupBigLine: {
        color: "#E9F8F3",
        fontSize: 26,
        fontWeight: "800",
        lineHeight: 30,
        letterSpacing: 0.5,
    },
    pickupBigAccent: {
        color: ACCENT,
        fontWeight: "800",
    },

    // Scheduled header right side (cart + menu)
    headerRightActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    cartBadgeWrap: {
        position: "relative",
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
    },
    cartBadge: {
        position: "absolute",
        top: -4,
        right: -6,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: ACCENT,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 3,
    },
    cartBadgeText: {
        color: "#003C31",
        fontSize: 9,
        fontWeight: "800",
    },

    // Assigned card
    assignedContentRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 8,

    },
    assignedRiderRight: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingTop: 18, // vertically center with heading
    },
    assignedRiderText: {
        color: "#82BDAE",
        fontSize: 13,
        lineHeight: 18,
        flexShrink: 1,

    },
    assignedRiderName: {
        color: "#E9F8F3",
        fontWeight: "700",
        textTransform: "uppercase"
    },

    // Processing / Paid shared
    processingHeaderRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    paymentPendingPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#6B4E10",
        backgroundColor: "#2A1D06",
    },
    paymentPendingText: {
        color: "#F5C842",
        fontSize: 11,
        fontWeight: "700",
    },
    hintRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    processingBigTitle: {
        color: "#FFFFFF",
        fontSize: 28,        // was 22
        fontWeight: "900",   // was 800
        lineHeight: 34,
        letterSpacing: 0.2,
    },
    payNowBtnFull: {
        height: 48,
        borderRadius: 10,    // less round, flatter
        backgroundColor: ACCENT,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
    },

    deliveryRiderBlock: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 4,
    },
    deliveryRiderName: {
        color: "#FFFFFF",
        fontSize: 26,
        fontWeight: "900",
        letterSpacing: 0.5,
        lineHeight: 30,
    },
    deliveryRiderSub: {
        color: "#6B9E90",
        fontSize: 14,
        fontWeight: "400",
        lineHeight: 20,
        marginTop: 2,
    },
    deliveryBottomMeta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },
    dismissText: {
        color: ACCENT,
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 0.8,
    },
    completedBigTitle: {
        color: "#FFFFFF",
        fontSize: 28,
        fontWeight: "900",
        lineHeight: 34,
        letterSpacing: 0.2,
    },
    completedSubtitle: {
        color: "#6B9E90",
        fontSize: 13,
        fontWeight: "400",
        lineHeight: 18,
        marginTop: -4,
    },
    completedFooterRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 2,
    },
});

