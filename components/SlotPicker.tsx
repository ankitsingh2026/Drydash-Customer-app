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
    bookingPercentage?: number;
    deliveryLabel?: string;
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
    autoScroll?: boolean;
}

const SlotPicker: React.FC<Props> = ({
    lat,
    lng,
    zoneId,
    date,
    selectedSlot,
    onSelect,
    onSlotsUpdate,
    autoScroll = false,
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

            let allSlots: Slot[] = [];

            const getTodayStr = () => {
                const d = new Date();
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            };

            const getTomorrowStr = () => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            };

            if (serviceData?.data?.dates && Array.isArray(serviceData.data.dates)) {
                const dates = serviceData.data.dates;
                const targetDateStr = date || getTodayStr();

                const specificEntry = date ? dates.find((d: any) => d.date === targetDateStr) : null;

                if (date && specificEntry) {
                    allSlots = specificEntry.allSlots || [];
                } else {
                    const todayEntry = dates.find((d: any) => d.label === "Today" || d.date === getTodayStr()) || dates[0];
                    const tomorrowEntry = dates.find((d: any) => d.label === "Tomorrow") || dates[1];

                    const todaySlots: Slot[] = todayEntry?.allSlots || [];
                    const hasValidToday = todaySlots.some(
                        (s) =>
                            s.enabled &&
                            s.status !== "expired" &&
                            (s.availableCapacity === undefined || s.availableCapacity > 0)
                    );

                    let tomorrowSlots: Slot[] = [];
                    if (tomorrowEntry && tomorrowEntry.allSlots) {
                        tomorrowSlots = tomorrowEntry.allSlots.map((s: any) => ({
                            ...s,
                            isTomorrow: true,
                            dayLabel: "Tomorrow",
                            date: tomorrowEntry.date,
                        }));
                    }

                    allSlots = [...todaySlots, ...tomorrowSlots];
                }
            } else {
                // Fallback to legacy single allSlots
                allSlots = serviceData?.data?.allSlots || [];
                const getTodayStr = () => {
                    const d = new Date();
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                };
                const getTomorrowStr = () => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                };

                const isToday = !date || date === getTodayStr();

                if (isToday) {
                    try {
                        const tomorrowStr = getTomorrowStr();
                        const tomorrowRes = await oldApiClient.post(
                            "/v1/slots/service/check",
                            { zoneId: currentZoneId, date: tomorrowStr }
                        );

                        const tomorrowSlots: Slot[] = (tomorrowRes.data?.data?.allSlots || []).map(
                            (s: any) => ({
                                ...s,
                                isTomorrow: true,
                                dayLabel: "Tomorrow",
                                date: tomorrowStr,
                            })
                        );

                        if (tomorrowSlots.length > 0) {
                            allSlots = [...allSlots, ...tomorrowSlots];
                        }
                    } catch (err) {
                        console.log("❌ Tomorrow slots fetch error in SlotPicker", err);
                    }
                }
            }

            setSlots(allSlots);

            onSlotsUpdate?.(allSlots);
        } catch (err) {
            console.log("❌ Slot fetch error", err);
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Build full UI list (including expired) sorted by Day then Start Time
    const visibleSlots = [...slots]
        .sort((a, b) => {
            // Keep Today slots before Tomorrow slots
            if (!!a.isTomorrow !== !!b.isTomorrow) {
                return a.isTomorrow ? 1 : -1;
            }
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
    const scrollOffsetRef = useRef(0);
    const containerWidthRef = useRef(0);
    const contentWidthRef = useRef(0);
    const frameRef = useRef<number | null>(null);
    const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isDraggingRef = useRef(false);
    const lastFrameTimeRef = useRef<number | null>(null);
    const slotStepWidth = 160;

    const clearAutoScrollFrame = () => {
        if (frameRef.current != null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
    };

    const stopAutoScroll = () => {
        clearAutoScrollFrame();
        lastFrameTimeRef.current = null;
        if (resumeTimeoutRef.current) {
            clearTimeout(resumeTimeoutRef.current);
            resumeTimeoutRef.current = null;
        }
    };

    const startAutoScroll = () => {
        if (!autoScroll || selectedSlot >= 0 || visibleSlots.length < 2) {
            return;
        }

        if (containerWidthRef.current <= 0 || contentWidthRef.current <= containerWidthRef.current) {
            return;
        }

        if (frameRef.current != null) {
            return;
        }

        const maxOffset = Math.max(0, contentWidthRef.current - containerWidthRef.current);
        const speedPerSecond = 42;

        const step = (timestamp: number) => {
            if (!autoScroll || selectedSlot >= 0 || isDraggingRef.current) {
                stopAutoScroll();
                return;
            }

            const previousTime = lastFrameTimeRef.current ?? timestamp;
            const deltaTime = Math.min(32, timestamp - previousTime) / 1000;
            lastFrameTimeRef.current = timestamp;

            const currentOffset = Math.round(scrollOffsetRef.current);
            let nextOffset = currentOffset + Math.max(1, Math.round(speedPerSecond * deltaTime));

            if (nextOffset >= maxOffset) {
                nextOffset = 0;
            }

            scrollOffsetRef.current = nextOffset;
            scrollRef.current?.scrollTo({ x: nextOffset, animated: false });
            frameRef.current = requestAnimationFrame(step);
        };

        frameRef.current = requestAnimationFrame(step);
    };

    useEffect(() => {
        if (selectedSlot >= 0 || !autoScroll) {
            stopAutoScroll();
            return;
        }

        if (!visibleSlots.length) {
            stopAutoScroll();
            return;
        }

        const startDelay = setTimeout(() => {
            startAutoScroll();
        }, 700);

        return () => {
            clearTimeout(startDelay);
            stopAutoScroll();
        };
    }, [autoScroll, selectedSlot, visibleSlots.length]);

    useEffect(() => {
        return () => {
            stopAutoScroll();
        };
    }, []);

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

    useEffect(() => {
        if (selectedSlot >= 0) {
            stopAutoScroll();
        }
    }, [selectedSlot]);

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
            onLayout={(event) => {
                containerWidthRef.current = event.nativeEvent.layout.width;
                startAutoScroll();
            }}
            onContentSizeChange={(width) => {
                contentWidthRef.current = width;
                startAutoScroll();
            }}
            onScroll={(event) => {
                scrollOffsetRef.current = event.nativeEvent.contentOffset.x;
            }}
            scrollEventThrottle={16}
            onScrollBeginDrag={() => {
                isDraggingRef.current = true;
                if (resumeTimeoutRef.current) {
                    clearTimeout(resumeTimeoutRef.current);
                    resumeTimeoutRef.current = null;
                }
                clearAutoScrollFrame();
            }}
            onScrollEndDrag={() => {
                isDraggingRef.current = false;
                if (!autoScroll || selectedSlot >= 0) {
                    return;
                }

                resumeTimeoutRef.current = setTimeout(() => {
                    if (!isDraggingRef.current) {
                        startAutoScroll();
                    }
                }, 900);
            }}
            onMomentumScrollEnd={() => {
                isDraggingRef.current = false;
                if (!autoScroll || selectedSlot >= 0) {
                    return;
                }

                if (!frameRef.current) {
                    resumeTimeoutRef.current = setTimeout(() => {
                        if (!isDraggingRef.current) {
                            startAutoScroll();
                        }
                    }, 900);
                }
            }}
        >
            {visibleSlots.map((slot, index) => {
                const isSelected = selectedSlot === index;

                const status = slot.status?.toLowerCase?.() || "";
                const isExpired = status === "expired";
                const isDisabledByApi = !slot.enabled || status === "disabled";
                const isFullyBooked = (slot.availableCapacity ?? 0) === 0 || (slot.bookingPercentage ?? 0) === 100;

                const isUnavailable = isExpired || isFullyBooked || isDisabledByApi;

                const isFirstTomorrow = slot.isTomorrow && (index === 0 || !visibleSlots[index - 1].isTomorrow);

                const getTomorrowDateFormatted = () => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const dayName = tomorrow.toLocaleDateString("en-IN", { weekday: "short" });
                    const monthName = tomorrow.toLocaleDateString("en-IN", { month: "short" });
                    const dateNum = tomorrow.getDate();
                    return `${dayName}, ${monthName} ${dateNum}`;
                };

                const renderSlotChip = () => (
                    <TouchableOpacity
                        key={index}
                        disabled={isUnavailable}
                        onPress={() => onSelect(index, slot)}
                        style={{ marginRight: 10 }}
                        activeOpacity={0.85}
                    >
                        <View
                            style={[
                                styles.slotChip,
                                isSelected && styles.selectedCard,
                                slot.isActive && !isSelected && !isUnavailable && styles.activeCard,
                                isUnavailable && styles.disabled,
                            ]}
                        >
                            <View style={{ flex: 1, justifyContent: "space-between" }}>
                                {/* TOP ROW */}
                                <View style={styles.topRow}>
                                    <Text
                                        style={[
                                            styles.time,
                                            isUnavailable && { color: theme.textSecondary },
                                            isSelected && { color: theme.primary },
                                        ]}
                                    >
                                        {slot.time}
                                    </Text>

                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={16} color={theme.primary} />
                                    )}
                                </View>

                                {/* STATUS / SECOND LINE */}
                                <View style={styles.bottomRow}>
                                    {isUnavailable ? (
                                        <>
                                            <Ionicons
                                                name={isExpired ? "time-outline" : "lock-closed-outline"}
                                                size={12}
                                                color={isExpired ? "#FF6B6B" : theme.textSecondary}
                                            />
                                            <Text style={styles.unavailableHint}>
                                                {isExpired
                                                    ? "Expired"
                                                    : isFullyBooked
                                                      ? "Fully booked"
                                                      : status === "disabled"
                                                        ? "Unavailable"
                                                        : "Not available"}
                                            </Text>
                                        </>
                                    ) : (
                                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flex: 1 }}>
                                            {slot.isActive ? (
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                                    <Ionicons name="flash" size={12} color="#FFD600" />
                                                    <Text style={styles.fast}>Filling fast</Text>
                                                </View>
                                            ) : (
                                                <Text style={styles.available}>
                                                    {slot.availableCapacity} left
                                                </Text>
                                            )}

                                            {slot.isTomorrow ? (
                                                <View style={styles.tomorrowBadge}>
                                                    <Text style={styles.tomorrowBadgeText}>Tomorrow</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.todayBadge}>
                                                    <Text style={styles.todayBadgeText}>Today</Text>
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                );

                if (isFirstTomorrow && index > 0) {
                    return (
                        <React.Fragment key={`divider-${index}`}>
                            <View style={styles.verticalDivider} />
                            {renderSlotChip()}
                        </React.Fragment>
                    );
                }

                return renderSlotChip();
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
        minWidth: 155,
        height: 70,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.border,
        justifyContent: "space-between",
    },
    tomorrowBadge: {
        backgroundColor: theme.primary + "1E",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.primary + "40",
    },
    tomorrowBadgeText: {
        color: theme.primary,
        fontSize: 10,
        fontWeight: "800",
    },
    todayBadge: {
        backgroundColor: theme.subText + "1E",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.subText + "40",
    },
    todayBadgeText: {
        color: theme.subText,
        fontSize: 10,
        fontWeight: "800",
    },
    verticalDivider: {
        width: 1.5,
        height: 48,
        backgroundColor: theme.primary + "60",
        borderRadius: 1,
        alignSelf: "center",
        marginRight: 10,
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

    badgeRow: {
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        marginTop: 6,
        minHeight: 18,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        alignSelf: "flex-start",
    },
    badgeText: {
        fontSize: 10.5,
        fontWeight: "800",
        letterSpacing: 0.2,
    },

    badgeExpired: {
        backgroundColor: theme.inputBackground,
        borderColor: "#FEE2E2",
    },
    badgeExpiredText: {
        color: "#FF6B6B",
    },

    badgeFull: {
        backgroundColor: "#FFE5E5",
        borderColor: "#FF6B6B33",
    },
    badgeFullText: {
        color: "#FF6B6B",
    },

    badgeDisabled: {
        backgroundColor: theme.inputBackground,
        borderColor: theme.border,
    },
    badgeDisabledText: {
        color: theme.textSecondary,
    },

    unavailableHint: {
        fontSize: 12,
        fontWeight: "700",
        color: theme.textSecondary,
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
