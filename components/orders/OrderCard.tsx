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
import { showAlert } from "@/components/Customalert";
import { useTheme } from "../../context/ThemeContext";

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
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
    const accent = colors.subText;
    return (
        <View style={styles.statusPill}>
            <Ionicons name="ellipse" size={10} color={accent} />
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
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
    const accent = colors.subText;
    return (
        <View style={styles.tagPill}>
            {icon ? (
                <Ionicons
                    name={icon}
                    size={13}
                    color={tone === "danger" ? "#FF9FA8" : accent}
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
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
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
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
    const background = colors.background;
    return (
        <TouchableOpacity style={styles.chatFab}
            onPress={() => router.push("/(customer)/(assistant)/chat")}>
            <Ionicons name="chatbubble-ellipses" size={25} color={background} />
        </TouchableOpacity>
    );
}

function RiderAvatar({ pickup }: { pickup: PickupRecord }) {
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
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
    const { colors, isDark, theme } = useTheme();
    const styles = makeStyles(colors, isDark);
    const getItemCount = (pickup: PickupRecord) => {
        if (!pickup?.items?.length) return 0;
        return pickup.items.reduce((total, item) => total + (item.quantity || 0), 0);
    };
    const itemCount = getItemCount(pickup);
    const highlightTime = getSlotEndLabel(pickup);
    const isItToday = isToday(pickup.rescheduledDate || pickup.pickup_date);
    const dateLabel = isItToday ? "TODAY" : formatDate(pickup.rescheduledDate || pickup.pickup_date).toUpperCase();
    const [menuVisible, setMenuVisible] = useState(false);

    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>
                <View style={styles.headerRowCompact}>
                    <StatusPill label={pickup.isRescheduled ? "RESCHEDULED" : "PICKUP SCHEDULED"} />
                    <View style={styles.headerRightActions}>
                        <View style={styles.cartBadgeWrap}>
                            <Ionicons name="cart-outline" size={20} color={colors.subText} />
                            {itemCount > 0 && (
                                <View style={styles.cartBadge}>
                                    <Text style={styles.cartBadgeText}>{itemCount}</Text>
                                </View>
                            )}
                        </View>
                        <View style={styles.menuContainer}>
                            <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
                                <Ionicons name="ellipsis-vertical" size={20} color={colors.subText} />
                            </TouchableOpacity>
                            <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
                                <TouchableOpacity
                                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
                                    activeOpacity={1}
                                    onPress={() => setMenuVisible(false)}
                                >
                                    <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 16 }}>
                                        <View style={{ width: 40, height: 4, backgroundColor: colors.border, alignSelf: 'center', borderRadius: 2, marginBottom: 8 }} />
                                        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Order Options</Text>

                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => { setMenuVisible(false); onReschedule(); }}
                                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}
                                        >
                                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.subText + '22', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                                <Ionicons name="calendar-outline" size={20} color={colors.subText} />
                                            </View>
                                            <View>
                                                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Reschedule</Text>
                                                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Change pickup date and time</Text>
                                            </View>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            activeOpacity={0.8}
                                            onPress={() => { setMenuVisible(false); onCancel(); }}
                                            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}
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
                </View>

                <View style={styles.pickupHeadingBlock}>
                    <Text style={styles.pickupSubLabel}>PICKUP</Text>
                    <Text style={styles.pickupBigLine}>{dateLabel}</Text>
                    <Text style={styles.pickupBigLine}>
                        BEFORE{" "}
                        <Text style={styles.pickupBigAccent}>{highlightTime.toUpperCase()}</Text>
                    </Text>
                </View>

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
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
    const itemCount = pickup.items?.length ?? 0;
    const riderName = pickup.riderName || "Your rider";
    const highlightTime = getSlotEndLabel(pickup);
    const isItToday = isToday(pickup.rescheduledDate || pickup.pickup_date);
    const dateLabel = isItToday ? "TODAY" : formatDate(pickup.rescheduledDate || pickup.pickup_date).toUpperCase();

    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <StatusPill label="RIDER ASSIGNED" />
                    <View style={styles.cartBadgeWrap}>
                        <Ionicons name="cart-outline" size={20} color={colors.subText} />
                        {itemCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{itemCount}</Text>
                            </View>
                        )}
                    </View>
                </View>
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
                        <Ionicons name="bicycle-outline" size={18} color={colors.subText} />
                        <Text style={styles.assignedRiderText}>
                            <Text style={styles.assignedRiderName}>{riderName}</Text>
                            {" is on the way"}
                        </Text>
                    </View>
                </View>

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
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
    const itemCount = pickup.items?.length ?? 0;

    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>
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

                <View style={styles.hintRow}>
                    <Ionicons name="flash" size={13} color={colors.subText} />
                    <Text style={styles.payHintText}>PAY NOW TO CHOOSE DELIVERY SLOT</Text>
                </View>

                <Text style={styles.processingBigTitle}>PROCESSING YOUR{"\n"}ORDER</Text>

                <TagPill label={`Total items: ${itemCount}`} />

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
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
    const itemCount = pickup.items?.length ?? 0;

    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>
                <View style={styles.headerRowCompact}>
                    <StatusPill label="ACTIVE ORDER" />
                    <View style={styles.processingHeaderRight}>
                        <TagPill label="Paid" icon="checkmark-circle-outline" />
                        <ChatFab />
                    </View>
                </View>

                <View style={styles.hintRow}>
                    <Ionicons name="flash" size={13} color={colors.subText} />
                    <Text style={styles.payHintText}>PAY NOW TO CHOOSE DELIVERY SLOT</Text>
                </View>

                <Text style={styles.processingBigTitle}>PROCESSING YOUR{"\n"}ORDER</Text>

                <TagPill label={`Total items: ${itemCount}`} />
            </View>
        </View>
    );
}

function DeliveryPickupCard({ pickup }: PickupStatusCardProps) {
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
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

                <View style={styles.deliveryRiderBlock}>
                    <Ionicons name="bicycle-outline" size={32} color={colors.subText} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.deliveryRiderName}>{riderName}</Text>
                        <Text style={styles.deliveryRiderSub}>
                            {"on  the way with\nyour delivery"}
                        </Text>
                    </View>
                </View>

                <View style={styles.deliveryBottomMeta}>
                    <TagPill label={`Total items: ${itemCount}`} />
                    <Text style={styles.deliveryMetaText}>
                        {orderCode}
                        {deliveryTime ? ` • ${deliveryTime}` : ""}
                    </Text>
                </View>

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
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
    const orderCode = getOrderCode(pickup);
    const deliveryTime = formatTime(pickup.updatedAt || pickup.pickup_date);
    const itemCount = pickup.items?.length ?? 0;

    return (
        <View style={styles.card}>
            <View style={styles.innerCompact}>
                <View style={styles.headerRowCompact}>
                    <StatusPill label="ORDER COMPLETED" />
                    {onClose ? (
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.dismissText}>DISMISS</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>

                <Text style={styles.completedBigTitle}>DELIVERED{"\n"}SUCCESSFULLY</Text>

                <Text style={styles.completedSubtitle}>
                    Your order has been successfully delivered.
                </Text>

                <View style={styles.deliveryBottomMeta}>
                    <TagPill label={`Total items delivered: ${itemCount}`} />
                    <Text style={styles.deliveryMetaText}>
                        {orderCode}{deliveryTime ? ` • ${deliveryTime}` : ""}
                    </Text>
                </View>

                <View style={styles.reviewRowCompact}>
                    <Ionicons name="star" size={26} color="#95F7D5" />
                    <Ionicons name="star" size={26} color="#95F7D5" />
                    <Ionicons name="star" size={26} color="#95F7D5" />
                    <Ionicons name="star" size={26} color="#95F7D5" />
                    <Ionicons name="star-outline" size={26} color="#325348" />
                </View>

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
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
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
    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);

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

    const { colors, isDark } = useTheme();
    const styles = makeStyles(colors, isDark);
    const showFeedback = (
        title: string,
        message: string,
        tone: "success" | "error" | "info" = "info",
    ) => {
        showAlert({ type: tone, title, message });
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

    const handleReschedulePickup = async (newDate: string, slot: any) => {
        if (!pickup?._id) {
            showFeedback("Missing pickup", "Unable to reschedule this pickup right now.", "error");
            return;
        }

        try {
            setActionLoading(true);
            await reschedulePickupApi(pickup._id, newDate, slot );
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
        </>
    );
}


/* ─── DYNAMIC STYLES (now accepts `colors` directly) ─── */
const makeStyles = (colors: any, isDark: boolean) => {
    const {
        background,
        card,
        text,
        subText,
        textSecondary,
        border,
        inputBackground,
        placeholderText,
    } = colors;

    const accent = subText;
    const muted = textSecondary;

    return StyleSheet.create({
        card: {
            backgroundColor: card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: border,
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
            minHeight: 20,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: border,
            backgroundColor: inputBackground,
            paddingHorizontal: 8,
            paddingVertical: 3,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            alignSelf: "flex-start",
        },
        statusPillText: {
            color: accent,
            fontSize: 9.5,
            letterSpacing: 1,
            fontWeight: "800",
        },
        tagPill: {
            minHeight: 20,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: border,
            backgroundColor: inputBackground,
            paddingHorizontal: 10,
            paddingVertical: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
        },
        tagPillText: {
            color: accent,
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 0.3,
        },
        tagPillTextDanger: {
            color: "#FF9FA8",
        },
        orderCodeText: {
            color: textSecondary,
            fontSize: 12,
            fontWeight: "500",
        },
        mainLine: {
            color: text,
            fontSize: 17,
            lineHeight: 22,
            fontWeight: "500",
        },
        mainLineAccent: {
            color: accent,
            fontWeight: "800",
        },
        strongTitle: {
            color: text,
            fontSize: 17,
            lineHeight: 22,
            fontWeight: "800",
        },
        softTitle: {
            color: textSecondary,
            fontSize: 15,
            lineHeight: 20,
            flex: 1,
        },
        softTitleSmall: {
            color: textSecondary,
            fontSize: 12.5,
            lineHeight: 18,
        },
        infoLine: {
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        infoLineText: {
            color: accent,
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
            backgroundColor: background,
            borderWidth: 1,
            borderColor: border,
            alignItems: "center",
            justifyContent: "center",
        },
        riderAvatarText: {
            color: accent,
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
            borderColor: border,
            backgroundColor: inputBackground,
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
            backgroundColor: accent,
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
            backgroundColor: accent,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
        },
        payNowText: {
            color: background,
            fontSize: 16,
            fontWeight: "900",
        },
        payHintText: {
            color: textSecondary,
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
            color: accent,
            fontSize: 13,
            fontWeight: "500",
        },
        deliveryMetaText: {
            color: textSecondary,
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
            backgroundColor: border,
            marginTop: 2,
        },
        rateTitle: {
            color: textSecondary,
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
            color: accent,
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
            borderColor: border,
            backgroundColor: card,
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
            color: text,
            fontSize: 16,
            fontWeight: "800",
        },
        feedbackTitleError: {
            color: "#FFB1B7",
        },
        feedbackTitleSuccess: {
            color: accent,
        },
        feedbackCloseBtn: {
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: inputBackground,
            borderWidth: 1,
            borderColor: border,
        },
        feedbackMessage: {
            color: textSecondary,
            fontSize: 13,
            lineHeight: 18,
        },
        feedbackActionBtn: {
            height: 40,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: border,
            backgroundColor: accent,
            alignItems: "center",
            justifyContent: "center",
            marginTop: 2,
        },
        feedbackActionText: {
            color: background,
            fontSize: 13,
            fontWeight: "800",
        },
        dropdownMenu: {
            position: "absolute",
            top: 24,
            right: 0,
            minWidth: 140,
            backgroundColor: card,
            borderRadius: 10,
            padding: 8,
            gap: 6,
            borderWidth: 1,
            borderColor: border,
            zIndex: 9999,
            elevation: 20,
        },
        menuContainer: {
            position: "relative",
            alignItems: "flex-end",
            zIndex: 1000,
        },
        pickupHeadingBlock: {
            gap: 0,
        },
        pickupSubLabel: {
            color: muted,
            fontSize: 11,
            fontWeight: "600",
            letterSpacing: 1.2,
            marginBottom: 2,
        },
        pickupBigLine: {
            color: text,
            fontSize: 18,
            fontWeight: "800",
            lineHeight: 25,
            letterSpacing: 0.5,
        },
        pickupBigAccent: {
            color: accent,
            fontWeight: "800",
        },
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
            backgroundColor: accent,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
        },
        cartBadgeText: {
            color: background,
            fontSize: 9,
            fontWeight: "800",
        },
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
            paddingTop: 18,
            marginLeft: 15,
        },
        assignedRiderText: {
            color: textSecondary,
            fontSize: 12,
            lineHeight: 18,
            flexShrink: 1,
        },
        assignedRiderName: {
            color: text,
            fontWeight: "700",
            textTransform: "uppercase",
        },
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
            borderColor: isDark ? "#6B4E10" : "#FCD34D",
            backgroundColor: isDark ? "#2A1D06" : "#FFFBEB",
        },
        paymentPendingText: {
            color: isDark ? "#F5C842" : "#D97706",
            fontSize: 11,
            fontWeight: "700",
        },
        hintRow: {
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
        },
        processingBigTitle: {
            color: text,
            fontSize: 28,
            fontWeight: "900",
            lineHeight: 34,
            letterSpacing: 0.2,
        },
        payNowBtnFull: {
            height: 48,
            borderRadius: 10,
            backgroundColor: accent,
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
            color: text,
            fontSize: 26,
            fontWeight: "900",
            letterSpacing: 0.5,
            lineHeight: 30,
        },
        deliveryRiderSub: {
            color: textSecondary,
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
            color: accent,
            fontSize: 12,
            fontWeight: "800",
            letterSpacing: 0.8,
        },
        completedBigTitle: {
            color: text,
            fontSize: 28,
            fontWeight: "900",
            lineHeight: 34,
            letterSpacing: 0.2,
        },
        completedSubtitle: {
            color: textSecondary,
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
};