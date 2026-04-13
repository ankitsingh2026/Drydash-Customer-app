import { Address } from "@/types/order.types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");

/* ─── theme ─── */
const C = {
  bg: "#031612",
  card: "#0D1F1C",
  border: "#1A3330",
  primary: "#2FE6A6",
  primaryDim: "#1A9E74",
  text: "#E6FFF7",
  subText: "#8FB3A8",
  muted: "#3A5E55",
  skyTop: "#B8EAF5",
  skyBot: "#E0F7FA",
};

type Props = {
  visible: boolean;
  savedAddresses: Address[];
  selectedId: string | null;
  onSelect: (label: string, address: Address | null) => void;
  onClose: () => void;
};

/* ─── cloud SVG-style view ─── */
function Cloud({ style }: { style: any }) {
  return <View style={[styles.cloud, style]} />;
}

/* ─── map pin illustration ─── */
function MapPinIllustration() {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 900, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.pinWrapper, { transform: [{ translateY: bounce }] }]}>
      {/* pin body */}
      <View style={styles.pinBody}>
        <View style={styles.pinHole} />
      </View>
      {/* pin tip */}
      <View style={styles.pinTip} />
      {/* shadow */}
      <View style={styles.pinShadow} />
    </Animated.View>
  );
}

/* ─── main component ─── */
export default function LocationPickerModal({
  visible,
  savedAddresses,
  selectedId,
  onSelect,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState<boolean | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      checkLocation();

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_H,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const checkLocation = async () => {
    const enabled = await Location.hasServicesEnabledAsync();
    setLocationEnabled(enabled);
  };

  const handleEnable = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.sendIntent("android.settings.LOCATION_SOURCE_SETTINGS");
    }
  };

  const handleGPS = async () => {
    try {
      setGpsLoading(true);

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        onClose(); // close modal
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geo?.length > 0) {
        const g = geo[0];
        const label = `${g.district}, ${g.city}`;

        onSelect(label, null);
        onClose();
      }
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSavedPick = (addr: Address) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const label = `${addr.line1}, ${addr.city}`;
    onSelect(label, addr);
    onClose();
  };

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // open whatsapp or share sheet
    Linking.openURL("whatsapp://");
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <Animated.View
        style={[
          styles.sheet,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.closeWrap}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={C.text} />
          </TouchableOpacity>
        </View>
        {/* handle */}
        <View style={styles.handle} />

        {/* ── SKY HERO ── */}
        <View style={styles.skyHero}>
          {/* clouds */}
          <Cloud style={{ top: 10, left: -20, width: 100, height: 50 }} />
          <Cloud style={{ top: 30, left: 60, width: 70, height: 38 }} />
          <Cloud style={{ top: 8, right: -10, width: 110, height: 55 }} />
          <Cloud style={{ top: 50, right: 50, width: 60, height: 32 }} />
          <Cloud style={{ top: 20, left: SCREEN_W * 0.35, width: 80, height: 40 }} />

          {/* pin */}
          <MapPinIllustration />
        </View>

        {/* ── TITLE ── */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Your device location is off</Text>
          <Text style={styles.subtitle}>
            Enabling location helps us reach you quickly with accurate delivery
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* ── LOCATION ACTIONS CARD ── */}
          <View style={styles.actionsCard}>
            {/* Use Current Location */}
            <View style={styles.actionRow}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="navigate-circle-outline" size={22} color={C.primary} />
              </View>
              <Text style={styles.actionLabel}>Use my Current Location</Text>
              {locationEnabled === false && (
                <TouchableOpacity
                  style={styles.enableBtn}
                  onPress={handleEnable}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[C.primary, C.primaryDim]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.enableBtnGrad}
                  >
                    <Text style={styles.enableBtnText}>Enable</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.actionDivider} />

            {/* Request from friend */}
            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.8}
              onPress={handleWhatsApp}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: "#0D2B1F" }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </View>
              <Text style={styles.actionLabel}>Request address from friend</Text>
              <Ionicons name="chevron-forward" size={18} color={C.subText} />
            </TouchableOpacity>
          </View>

          {/* ── SAVED ADDRESSES ── */}
          {savedAddresses.length > 0 && (
            <View style={styles.savedSection}>
              <View style={styles.savedHeader}>
                <Text style={styles.savedTitle}>Select your address</Text>
                <TouchableOpacity
                  style={styles.seeAllBtn}
                  onPress={() => {
                    onClose();
                    router.push("/saved-address");
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.seeAllText}>See All</Text>
                  <Ionicons name="chevron-forward" size={14} color={C.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.addressList}>
                {savedAddresses.map((addr, index) => {
                  const isSelected = selectedId === addr.id;
                  const isLast = index === savedAddresses.length - 1;

                  const iconName =
                    addr.label?.toLowerCase() === "home"
                      ? "location-outline"
                      : addr.label?.toLowerCase() === "office" ||
                        addr.label?.toLowerCase() === "work"
                        ? "business-outline"
                        : "location-outline";

                  return (
                    <React.Fragment key={addr.id}>
                      <TouchableOpacity
                        style={[
                          styles.addrRow,
                          isSelected && styles.addrRowSelected,
                        ]}
                        onPress={() => handleSavedPick(addr)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.addrIconWrap,
                            isSelected && { borderColor: C.primary + "60" },
                          ]}
                        >
                          <Ionicons
                            name={iconName as any}
                            size={18}
                            color={isSelected ? C.primary : C.subText}
                          />
                        </View>

                        <View style={styles.addrText}>
                          <Text style={[styles.addrLabel, isSelected && { color: C.primary }]}>
                            {addr.label || "Address"}
                          </Text>
                          <Text style={styles.addrStreet} numberOfLines={2}>
                            {addr.line1 || addr.flat}, {addr.city},{" "}
                            {addr.state || addr.pincode || ""}
                          </Text>
                        </View>

                        <Ionicons
                          name={isSelected ? "checkmark-circle" : "chevron-forward"}
                          size={18}
                          color={isSelected ? C.primary : C.muted}
                        />
                      </TouchableOpacity>

                      {!isLast && <View style={styles.rowDivider} />}
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_H * 0.9,
    backgroundColor: C.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },

  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2A4A44",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 0,
    zIndex: 10,
  },

  /* sky */
  skyHero: {
    width: "100%",
    height: 160,
    backgroundColor: C.skyBot,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 16,
    overflow: "hidden",
  },

  cloud: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 40,
    opacity: 0.88,
    shadowColor: "#9FDCE8",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  /* pin */
  pinWrapper: {
    alignItems: "center",
    marginBottom: 4,
  },
  pinBody: {
    width: 52,
    height: 60,
    borderRadius: 26,
    borderBottomRightRadius: 4,
    backgroundColor: "#E91E8C",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    shadowColor: "#E91E8C",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  pinHole: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    transform: [{ rotate: "-45deg" }],
  },
  pinTip: {
    width: 0,
    height: 0,
    display: "none", // using borderRadius pin shape instead
  },
  pinShadow: {
    width: 24,
    height: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.15)",
    marginTop: 2,
  },

  /* title */
  titleSection: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: C.text,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: C.subText,
    textAlign: "center",
    lineHeight: 19,
    fontWeight: "500",
  },

  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 20,
  },

  /* actions card */
  actionsCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#0D2B24",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
  },
  enableBtn: {
    borderRadius: 10,
    overflow: "hidden",
  },
  enableBtnGrad: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  enableBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#021410",
  },
  actionDivider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 16,
  },

  /* saved */
  savedSection: {
    gap: 12,
  },
  savedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: C.text,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
  },

  addressList: {
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  addrRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  addrRowSelected: {
    backgroundColor: C.primary + "0D",
  },
  addrIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#0D2B24",
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  addrText: {
    flex: 1,
    gap: 3,
  },
  addrLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: C.text,
  },
  addrStreet: {
    fontSize: 11,
    color: C.subText,
    lineHeight: 15,
    fontWeight: "500",
  },
  rowDivider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 16,
  },
  closeWrap: {
    position: "absolute",
    right: 14,
    top: 10,
    zIndex: 20,
  },

  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0D2B24",
    alignItems: "center",
    justifyContent: "center",
  },
});