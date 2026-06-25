import { useTheme } from "../context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type Coupon = {
  _id: string;
  name: string;
  code: string;
  type: "flat" | "discount";
  discount: number;
  maxCap?: number | null;
  totalLimit?: number;
  usedCount?: number;
  reservedCount?: number;
  perUser?: number;
  minOrder: number;
  startDate?: string;
  expiryDate?: string;
  isActive?: boolean;
  categories?: string[];
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (coupon: Coupon, action: "apply" | "remove") => void;
  appliedCode: string;
  subtotal: number;
  coupons?: Coupon[];
  loading?: boolean;
};

export default function CouponCard({
  visible,
  onClose,
  onApply,
  appliedCode,
  subtotal,
  coupons = [],
  loading = false,
}: Props) {
  const { theme } = useTheme();

  // Move styles inside component to access theme
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.backdrop || 'rgba(0, 0, 0, 0.5)', // ← KEY CHANGE: Use backdrop instead of theme.card
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 18,
      paddingBottom: Platform.OS === "ios" ? 40 : 24,
      maxHeight: SCREEN_HEIGHT * 0.75,
    },
    handle: {
      width: 38,
      height: 5,
      backgroundColor: theme.border,
      borderRadius: 10,
      alignSelf: "center",
      marginTop: 10,
      marginBottom: 18,
    },
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 18,
    },
    sheetTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
    },
    infoText: {
      color: theme.textSecondary,
      textAlign: "center",
      marginTop: 20,
      marginBottom: 20,
      fontSize: 14,
    },
    couponCard: {
      borderRadius: 16,
      paddingHorizontal: 20,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    couponLeft: { flex: 1, marginRight: 12 },
    couponTagRow: { flexDirection: "row", marginBottom: 6 },
    couponTag: {
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    couponTagText: {
      color: theme.primary,
      fontSize: 11,
      fontWeight: "600",
    },
    couponTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    couponDesc: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    applyBtn: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 10,
      minWidth: 70,
      alignItems: "center",
    },
    applyBtnActive: {
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.border,
    },
    applyBtnDisabled: { 
      opacity: 0.45,
      backgroundColor: theme.textSecondary,
    },
    applyBtnText: {
      color: theme.background,
      fontWeight: "700",
      fontSize: 12,
    },
    applyBtnTextActive: { 
      color: theme.primary,
    },
    applyBtnTextDisabled: { 
      color: theme.textSecondary,
    },
  });

  const getCouponTitle = (coupon: Coupon) => {
    if (coupon.type === "flat") return `₹${coupon.discount} OFF`;
    if (coupon.type === "discount") return `${coupon.discount}% OFF`;
    return `${coupon.code} OFFER`;
  };

  const getCouponDescription = (coupon: Coupon) => {
    const minOrderText =
      coupon.minOrder > 0
        ? `Valid on orders above ₹${coupon.minOrder}`
        : "No minimum order required";

    const maxCapText =
      coupon.type === "discount" && coupon.maxCap
        ? ` • Max ₹${coupon.maxCap}`
        : "";

    return `${minOrderText}${maxCapText}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Available Coupons</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <Text style={styles.infoText}>Loading coupons...</Text>
            ) : coupons.length === 0 ? (
              <Text style={styles.infoText}>No coupons available</Text>
            ) : (
              coupons.map((coupon) => {
                const isApplied = appliedCode === coupon.code;
                const eligible =
                  Number(coupon.minOrder || 0) === 0 ||
                  subtotal >= Number(coupon.minOrder || 0);

                return (
                  <View key={coupon._id || coupon.code} style={styles.couponCard}>
                    <View style={styles.couponLeft}>
                      <View style={styles.couponTagRow}>
                        <View style={styles.couponTag}>
                          <Text style={styles.couponTagText}>{coupon.code}</Text>
                        </View>
                      </View>

                      <Text style={styles.couponTitle}>
                        {getCouponTitle(coupon)}
                      </Text>

                      <Text style={styles.couponDesc}>
                        {getCouponDescription(coupon)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        if (!eligible) return;
                        if (isApplied) {
                          onApply(coupon, "remove");
                        } else {
                          onApply(coupon, "apply");
                        }
                      }}
                      disabled={!eligible}
                      style={[
                        styles.applyBtn,
                        isApplied && styles.applyBtnActive,
                        !eligible && styles.applyBtnDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          styles.applyBtnText,
                          isApplied && styles.applyBtnTextActive,
                          !eligible && styles.applyBtnTextDisabled,
                        ]}
                      >
                        {isApplied ? "REMOVE" : "APPLY"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const SCREEN_HEIGHT = Dimensions.get("window").height;