import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Address } from "@/types/order.types";

const { height: SCREEN_H } = Dimensions.get("window");

type Props = {
  visible: boolean;
  savedAddresses: Address[];
  selectedId: string | null;
  onSelect: (label: string, address: Address | null) => void;
  onClose: () => void;
};

type ManualForm = {
  flat: string;
  street: string;
  city: string;
  pincode: string;
};

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
  const [manual, setManual] = useState<ManualForm>({
    flat: "",
    street: "",
    city: "",
    pincode: "",
  });

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_H,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleGPS = async () => {
    try {
      setGpsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geo?.length > 0) {
        const g = geo[0];
        const label = `${g.district || g.name || ""}, ${g.city || g.subregion || ""}`;
        onSelect(label, null);
        onClose();
      }
    } catch {
      // silent
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSavedPick = (addr: Address) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const label = `${addr.flat || addr.line1}, ${addr.city}`;
    onSelect(label, addr);
    onClose();
  };

  const handleManualConfirm = () => {
    if (!manual.flat || !manual.city) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const label = `${manual.flat}, ${manual.city}`;
    onSelect(label, {
      id: "manual",
      label: "Other",
      flat: manual.flat,
      line1: manual.flat,
      street: manual.street,
      city: manual.city,
      pincode: manual.pincode,
      latitude: 0,
      longitude: 0,
      isActive: true,
    } as any);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 16 },
        ]}
      >
        {/* handle bar */}
        <View style={styles.handle} />

        {/* header */}
        <View style={styles.header}>
          <View style={styles.dot} />
          <Text style={styles.headerTitle}>Choose delivery location</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#8FB3A8" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={20}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* GPS row */}
            <TouchableOpacity style={styles.gpsRow} onPress={handleGPS} activeOpacity={0.8}>
              <View style={styles.gpsIconWrap}>
                {gpsLoading ? (
                  <ActivityIndicator size="small" color="#2FE6A6" />
                ) : (
                  <Ionicons name="navigate" size={16} color="#2FE6A6" />
                )}
              </View>
              <View>
                <Text style={styles.gpsTitle}>Use current location</Text>
                <Text style={styles.gpsSub}>Auto-detect via GPS</Text>
              </View>
            </TouchableOpacity>

            {/* saved addresses */}
            {savedAddresses.length > 0 && (
              <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
                <Text style={styles.sectionLabel}>SAVED ADDRESSES</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
                >
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedId === addr.id;
                    const iconName =
                      addr.label?.toLowerCase() === "home" ? "home" : "briefcase";
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={[
                          styles.addrCard,
                          isSelected && styles.addrCardSelected,
                        ]}
                        onPress={() => handleSavedPick(addr)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={iconName as any}
                          size={14}
                          color={isSelected ? "#031612" : "#2FE6A6"}
                          style={{ marginBottom: 6 }}
                        />
                        <Text
                          style={[
                            styles.addrLabel,
                            isSelected && { color: "#031612" },
                          ]}
                        >
                          {addr.label}
                        </Text>
                        <Text
                          style={[
                            styles.addrStreet,
                            isSelected && { color: "#085041" },
                          ]}
                          numberOfLines={2}
                        >
                          {addr.line1 || addr.flat}, {addr.city}
                        </Text>
                        {isSelected && (
                          <View style={styles.checkDot}>
                            <Ionicons name="checkmark" size={9} color="#2FE6A6" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* manual entry */}
            <View style={{ marginTop: 20, paddingHorizontal: 16 }}>
              <Text style={styles.sectionLabel}>ENTER MANUALLY</Text>
              <View style={styles.manualCard}>
                <TextInput
                  style={styles.input}
                  placeholder="Flat / House No."
                  placeholderTextColor="#4A7A6A"
                  value={manual.flat}
                  onChangeText={(t) => setManual((p) => ({ ...p, flat: t }))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Street, Area, Landmark"
                  placeholderTextColor="#4A7A6A"
                  value={manual.street}
                  onChangeText={(t) => setManual((p) => ({ ...p, street: t }))}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="City"
                    placeholderTextColor="#4A7A6A"
                    value={manual.city}
                    onChangeText={(t) => setManual((p) => ({ ...p, city: t }))}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Pincode"
                    placeholderTextColor="#4A7A6A"
                    keyboardType="numeric"
                    value={manual.pincode}
                    onChangeText={(t) => setManual((p) => ({ ...p, pincode: t }))}
                  />
                </View>
                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    (!manual.flat || !manual.city) && { opacity: 0.45 },
                  ]}
                  onPress={handleManualConfirm}
                  disabled={!manual.flat || !manual.city}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnText}>Confirm location</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_H * 0.88,
    backgroundColor: "#031612",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1A3330",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#0D1F1C",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2FE6A6",
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#E6FFF7",
  },
  closeBtn: {
    padding: 4,
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#0D1F1C",
    borderWidth: 1,
    borderColor: "#1A3330",
    borderRadius: 10,
    padding: 12,
  },
  gpsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#12302A",
    alignItems: "center",
    justifyContent: "center",
  },
  gpsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E6FFF7",
  },
  gpsSub: {
    fontSize: 11,
    color: "#8FB3A8",
    marginTop: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8FB3A8",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  addrCard: {
    width: 140,
    backgroundColor: "#0D1F1C",
    borderWidth: 1.5,
    borderColor: "#1A3330",
    borderRadius: 10,
    padding: 12,
  },
  addrCardSelected: {
    backgroundColor: "#2FE6A6",
    borderColor: "#2FE6A6",
  },
  addrLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E6FFF7",
    marginBottom: 2,
  },
  addrStreet: {
    fontSize: 10,
    color: "#8FB3A8",
    lineHeight: 14,
  },
  checkDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#031612",
    alignItems: "center",
    justifyContent: "center",
  },
  manualCard: {
    backgroundColor: "#0D1F1C",
    borderWidth: 1,
    borderColor: "#1A3330",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  input: {
    backgroundColor: "#12302A",
    borderWidth: 1,
    borderColor: "#1E3A34",
    borderRadius: 8,
    color: "#E6FFF7",
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
  },
  confirmBtn: {
    backgroundColor: "#2FE6A6",
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 4,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#031612",
  },
});