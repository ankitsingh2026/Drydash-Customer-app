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

  // 🔥 UPDATED TYPE (IMPORTANT)
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
      <Pressable style={cs.overlay} onPress={onClose}>
        <Pressable style={cs.sheet} onPress={() => {}}>
          <View style={cs.handle} />

          <View style={cs.sheetHeader}>
            <Text style={cs.sheetTitle}>Available Coupons</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="#DEE5FF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <Text style={cs.infoText}>Loading coupons...</Text>
            ) : coupons.length === 0 ? (
              <Text style={cs.infoText}>No coupons available</Text>
            ) : (
              coupons.map((coupon) => {
                const isApplied = appliedCode === coupon.code;

                const eligible =
                  Number(coupon.minOrder || 0) === 0 ||
                  subtotal >= Number(coupon.minOrder || 0);

                return (
                  <View key={coupon._id || coupon.code} style={cs.couponCard}>
                    <View style={cs.couponLeft}>
                      <View style={cs.couponTagRow}>
                        <View style={cs.couponTag}>
                          <Text style={cs.couponTagText}>{coupon.code}</Text>
                        </View>
                      </View>

                      <Text style={cs.couponTitle}>
                        {getCouponTitle(coupon)}
                      </Text>

                      <Text style={cs.couponDesc}>
                        {getCouponDescription(coupon)}
                      </Text>
                    </View>

                    {/* 🔥 UPDATED BUTTON LOGIC */}
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
                        cs.applyBtn,
                        isApplied && cs.applyBtnActive,
                        !eligible && cs.applyBtnDisabled,
                      ]}
                    >
                      <Text
                        style={[
                          cs.applyBtnText,
                          isApplied && cs.applyBtnTextActive,
                          !eligible && cs.applyBtnTextDisabled,
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

const cs = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#001714",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  handle: {
    width: 38,
    height: 5,
    backgroundColor: "#001714",
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
    color: "#E6FFF4",
  },
  infoText: {
    color: "#8FA9A0",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
    fontSize: 14,
  },
  couponCard: {
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,

    // Gradient feel (fake with layered colors)
    backgroundColor: "#001714",

    // Border glow
    borderWidth: 1,
    borderColor: "rgba(159,255,211,0.08)",
  },
  couponLeft: { flex: 1, marginRight: 12 },
  couponTagRow: { flexDirection: "row", marginBottom: 6 },
  couponTag: {
    backgroundColor: "rgba(159,255,211,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  couponTagText: {
    color: "#7CFFCB",
    fontSize: 11,
    fontWeight: "600",
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E6FFF4",
  },
  couponDesc: {
    fontSize: 12,
    color: "#8FA9A0",
  },
  applyBtn: {
    backgroundColor: "#22EBAB",
    paddingHorizontal: 15,
    paddingVertical: 4,
    borderRadius: 10,
  },
  applyBtnActive: {
    backgroundColor: "#0E3B2D",
    borderWidth: 1,
    borderColor: "#2EF2A3",
  },
  applyBtnDisabled: { opacity: 0.45 },
  applyBtnText: {
    color: "#003B2E",
    fontWeight: "700",
    fontSize: 12,
  },
  applyBtnTextActive: { color: "#2EF2A3" },
  applyBtnTextDisabled: { color: "#7A8A84" },
});
