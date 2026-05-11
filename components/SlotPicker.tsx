import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { oldApiClient } from "@/lib/api/client";

interface Slot {
    time: string;
    availableCapacity: number;
    enabled: boolean;
    isActive: boolean;
    status: string;
    startTime: string;
}

interface Props {
    lat: number;
    lng: number;
    selectedSlot: number;
    onSelect: (index: number, slot: Slot) => void;
     onSlotsUpdate?: (slots: Slot[]) => void;  
}

const SlotPicker: React.FC<Props> = ({
    lat,
    lng,
    selectedSlot,
    onSelect,
    onSlotsUpdate,
}) => {
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (lat && lng) {
            fetchSlots();
        }
    }, [lat, lng]);

    const fetchSlots = async () => {
        try {
            setLoading(true);

            console.log("📍 Fetching slots for:", lat, lng);

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

            const serviceRes = await oldApiClient.post(
                "/v1/slots/service/check",
                { zoneId: zoneData.zoneId }
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

    if (loading) {
        return <ActivityIndicator color="#00E1A2" />;
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
                                        <Ionicons name="checkmark-circle" size={16} color="#00E1A2" />
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

export default SlotPicker;

const styles = StyleSheet.create({
    slotChip: {
        width: 150,
        height: 70,
        padding: 12,
        borderRadius: 14,
        backgroundColor: "#0D2B24",
        borderWidth: 1,
        borderColor: "#2f3c35",
        justifyContent: "space-between",
    },
    bottomRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },

    time: {
        color: "#CFFFF1",
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
        borderColor: "#00E1A2",
        backgroundColor: "#061A14",
        shadowColor: "#00E1A2",
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
        color: "#00E1A2",
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
        borderColor: "#00E1A2",
    },

    active: {
        borderColor: "#FFD600",
    },

    card: {
        width: "48%",
        padding: 14,
        borderRadius: 14,
        backgroundColor: "#0D2B24",
        borderWidth: 1,
        borderColor: "#1E3327",
    },

    noSlotBox: {
        backgroundColor: "#1E3327",
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
        backgroundColor: "#0B1F19",
        borderWidth: 1,
        borderColor: "#1E3327",
    },

    noSlotRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },

    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#2A2F1C",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    noSlotTitle: {
        color: "#CFFFF1",
        fontSize: 14,
        fontWeight: "700",
    },

    noSlotSubText: {
        color: "#7A9B87",
        fontSize: 12,
        marginTop: 4,
        lineHeight: 18,
    },
});