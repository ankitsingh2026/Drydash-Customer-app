import React, { useEffect, useState, useRef } from "react";
import { useSlotSocket } from "@/context/SlotSocketContext";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
    Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { oldApiClient } from "@/lib/api/client";
import { useTheme } from "../context/ThemeContext";

interface Slot {
    time: string;
    availableCapacity: number;
    enabled: boolean;
    isActive: boolean;
    status: string;
    startTime: string;
}

interface Props {
    lat?: number;
    lng?: number;
    zoneId?: string;
    date?: string;
    selectedSlot: number;
    onSelect: (index: number, slot: Slot) => void;
     onSlotsUpdate?: (slots: Slot[]) => void;  
     renderSlots?: (slots: any[]) => React.ReactNode;
}

const SlotPicker: React.FC<Props> = ({
    lat,
    lng,
    zoneId,
    date,
    selectedSlot,
    onSelect,
    onSlotsUpdate,
}) => {
    const { theme, isDark } = useTheme();
    const styles = makeSlotStyles(theme, isDark);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (zoneId || (lat && lng)) {
            fetchSlots();
        }
    }, [lat, lng, zoneId, date]);

    // Real-time slot update: refetch slots when slot_updated event is received
    const { onSlotUpdate } = useSlotSocket();
    useEffect(() => {
        const unsubscribe = onSlotUpdate(() => {
            fetchSlots();
        });
        return unsubscribe;
    }, [lat, lng, zoneId, date]);

    const fetchSlots = async () => {
        try {
            setLoading(true);

            console.log("📍 Fetching slots...");
            
            let currentZoneId = zoneId;

            if (!currentZoneId && lat && lng) {
                // ✅ FIX 1: removed space before https
                const zoneRes = await oldApiClient.get(
                    `/v1/slots/location/resolve?lat=${lat}&lng=${lng}`
                );
                const zoneData = zoneRes.data;

                console.log("🌍 Zone response:", zoneData);

                if (!zoneData?.zoneFound) {
                    setSlots([]);
                    return;
                }
                currentZoneId = zoneData.zoneId;
            }

            if (!currentZoneId) {
                setSlots([]);
                return;
            }

            const payload: any = { zoneId: currentZoneId };
            if (date) {
                payload.date = date;
            }

            const serviceRes = await oldApiClient.post(
                "/v1/slots/service/check",
                payload
            );

            const serviceData = serviceRes.data;

            console.log("📦 Service response:", serviceData);

            // ✅ FIX 2: safe access
            const allSlots = serviceData?.data?.allSlots || [];

            setSlots(allSlots);

            onSlotsUpdate?.(allSlots);
        } catch (err) {
            console.log("❌ Slot fetch error", err);
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIX 3: correct filtering
    const visibleSlots = slots
        .filter((s) => s.enabled && s.status !== "expired")
        // ✅ FIX 4: sort by time
        .sort((a, b) => {
            const getHour = (time: string) => {
                const num = parseInt(time);
                if (time.includes("PM") && num !== 12) return num + 12;
                if (time.includes("AM") && num === 12) return 0;
                return num;
            };
            return getHour(a.startTime) - getHour(b.startTime);
        });

    // console.log("✅ Visible slots:", visibleSlots);

    const scrollRef = useRef<ScrollView>(null);
    const lastScrolledSlot = useRef<number | null>(null);

    useEffect(() => {
        if (visibleSlots.length > 0 && selectedSlot >= 0 && scrollRef.current) {
            if (lastScrolledSlot.current !== selectedSlot) {
                setTimeout(() => {
                    scrollRef.current?.scrollTo({ x: selectedSlot * 160, animated: true });
                }, 100);
                lastScrolledSlot.current = selectedSlot;
            }
        }
    }, [visibleSlots.length, selectedSlot]);

    if (loading) {
        return <SlotSkeleton />;
    }

    if (!visibleSlots.length) {
        // onSlotsUpdate is called from useEffect below to avoid setState during render.
        return (
            <View style={styles.noSlotContainer}>
                <View style={styles.noSlotCard}>
                    <View style={styles.noSlotRow}>
                        <View style={styles.iconWrap}>
                            <Ionicons name="information-circle" size={18} color="#FFD600" />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={styles.noSlotTitle}>
                                No Pickup Slots Available for Today
                            </Text>

                            <Text style={styles.noSlotSubText}>
                                High demand in your area. Please check after some time or schedule for next day.
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }}
        >
            {visibleSlots.map((slot, index) => {
                const isSelected = selectedSlot === index;
                const isFull = slot.availableCapacity === 0;
                const isDisabled = !slot.enabled;

                return (
                    <TouchableOpacity
                        key={index}
                        disabled={isDisabled}
                        onPress={() => onSelect(index, slot)}
                        style={{ marginRight: 10 }}
                        activeOpacity={0.85}
                    >
                        <View
                            style={[
                                styles.slotChip,
                                isSelected && styles.selectedCard,
                                slot.isActive && !isSelected && styles.activeCard,
                                isDisabled && styles.disabled,
                            ]}
                        >
                            <View style={{ flex: 1, justifyContent: "space-between" }}>

                                {/* TOP ROW */}
                                <View style={styles.topRow}>
                                    <Text style={styles.time}>{slot.time}</Text>

                                    {/* ✅ SHOW TICK WHEN SELECTED */}
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                                    )}
                                </View>

                                {/* BOTTOM ROW */}
                                <View style={styles.bottomRow}>
                                    {isFull ? (
                                        <Text style={styles.full}>Fully booked</Text>
                                    ) : slot.isActive ? (
                                        <>
                                            <Ionicons name="flash" size={12} color="#FFD600" />
                                            <Text style={styles.fast}>Filling fast</Text>
                                        </>
                                    ) : (
                                        <Text style={styles.available}>
                                            {slot.availableCapacity} left
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

const SlotSkeleton = () => {
    const { theme, isDark } = useTheme();
    const styles = makeSlotStyles(theme, isDark);
    const anim = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(anim, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(anim, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [anim]);

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {[1, 2, 3].map((_, i) => (
                <View key={i} style={[styles.slotChip, { marginRight: 10, borderColor: theme.border, backgroundColor: theme.card }]}>
                    <View style={{ flex: 1, justifyContent: "space-between" }}>
                        <Animated.View style={{ opacity: anim, width: 80, height: 16, backgroundColor: theme.border, borderRadius: 6 }} />
                        <Animated.View style={{ opacity: anim, width: 60, height: 12, backgroundColor: theme.border, borderRadius: 6 }} />
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

export default SlotPicker;

const makeSlotStyles = (theme: any, isDark: boolean) => StyleSheet.create({
    slotChip: {
        width: 150,
        height: 70,
        padding: 12,
        borderRadius: 14,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
        justifyContent: "space-between",
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },

    time: {
        color: theme.text,
        fontWeight: "700",
        fontSize: 14,
    },

    topRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    /* ✅ SELECTED STATE */
    selectedCard: {
        borderColor: theme.primary,
        backgroundColor: theme.inputBackground,
        shadowColor: theme.primary,
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },

    /* ACTIVE (YELLOW) */
    activeCard: {
        // borderColor: "#FFD600",
    },

    disabled: {
        opacity: 0.4,
    },

    available: {
        color: theme.primary,
        fontSize: 12,
    },

    fast: {
        color: "#FFD600",
        fontSize: 12,
    },

    full: {
        color: "#FF6B6B",
        fontSize: 12,
    },

    selected: {
        borderColor: theme.primary,
    },

    active: {
        borderColor: "#FFD600",
    },

    card: {
        width: "48%",
        padding: 14,
        borderRadius: 14,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
    },

    noSlotBox: {
        backgroundColor: theme.border,
        padding: 14,
        borderRadius: 10,
        marginTop: 10,
        alignItems: "center",
    },

    noSlotText: {
        color: "#FFD600",
        marginTop: 5,
    },
    noSlotContainer: {
        marginTop: 6,
    },

    noSlotCard: {
        borderRadius: 16,
        padding: 16,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
    },

    noSlotRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: isDark ? theme.card : "#F0F5E8",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    noSlotTitle: {
        color: theme.text,
        fontSize: 14,
        fontWeight: "700",
    },

    noSlotSubText: {
        color: theme.textSecondary,
        fontSize: 12,
        marginTop: 4,
        lineHeight: 18,
    },
});
