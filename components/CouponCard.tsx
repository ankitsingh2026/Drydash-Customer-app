import { Ionicons } from "@expo/vector-icons";
import {
    Dimensions,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
// ─── Coupon Bottom Sheet ───────────────────────────────────────────────────────
 export  const COUPONS = [
  {
    code: "SAVE50",
    tag: "SAVE50",
    bestValue: true,
    title: "₹50 OFF",
    description: "Valid on orders above ₹500",
    type: "flat" as const,
    value: 50,
    minOrder: 500,
  },
  {
    code: "FREESHIP",
    tag: "FREESHIP",
    bestValue: false,
    title: "Free Delivery",
    description: "No minimum order required",
    type: "delivery" as const,
    value: 0,
    minOrder: 0,
  },
  {
    code: "LAUNDRY20",
    tag: "LAUNDRY20",
    bestValue: false,
    title: "20% OFF",
    description: "First order only • Max ₹100",
    type: "percent" as const,
    value: 20,
    maxDiscount: 100,
    minOrder: 0,
  },
];

type Coupon = (typeof COUPONS)[number];


export default function CouponCard({
  visible,
  onClose,
  onApply,
  appliedCode,
  subtotal,
}: {
  visible: boolean;
  onClose: () => void;
  onApply: (coupon: Coupon) => void;
  appliedCode: string;
  subtotal: number;
}) {
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
          {/* Drag handle */}
          <View style={cs.handle} />

          <View style={cs.sheetHeader}>
            <Text style={cs.sheetTitle}>Available Coupons</Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="#DEE5FF" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {COUPONS.map((coupon) => {
              const isApplied = appliedCode === coupon.code;
              const eligible =
                coupon.minOrder === 0 || subtotal >= coupon.minOrder;
              return (
                <View key={coupon.code} style={cs.couponCard}>
                  <View style={cs.couponLeft}>
                    <View style={cs.couponTagRow}>
                      <View style={cs.couponTag}>
                        <Text style={cs.couponTagText}>{coupon.tag}</Text>
                      </View>
                    </View>
                    <Text style={cs.couponTitle}>{coupon.title}</Text>
                    <Text style={cs.couponDesc}>{coupon.description}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => eligible && onApply(coupon)}
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
                      ]}
                    >
                      {isApplied ? "REMOVE" : "APPLY"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
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
    backgroundColor: "#00291F",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: SCREEN_HEIGHT * 0.75,
  },

  handle: {
    width: 38,
    height: 5,
    backgroundColor: "#0F3D2E",
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

  // 🔥 PREMIUM COUPON CARD
  couponCard: {
    borderRadius: 32,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,

    // Gradient feel (fake with layered colors)
    backgroundColor: "#043D2C",

    // Border glow
    borderWidth: 1,
    borderColor: "rgba(159,255,211,0.08)",

    // Shadow (important!)
    shadowColor: "#00FFA3",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },

    elevation: 3,
  },

  couponLeft: {
    flex: 1,
    marginRight: 12,
  },

  couponTagRow: {
    flexDirection: "row",
    marginBottom: 6,
  },

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
    letterSpacing: 1,
  },

  couponTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E6FFF4",
    marginBottom: 4,
  },

  couponDesc: {
    fontSize: 12,
    color: "#8FA9A0",
  },

  // 🔥 APPLY BUTTON (GLOW STYLE)
  applyBtn: {
    backgroundColor: "#22EBAB",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,

    shadowColor: "#22EBAB",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },

    elevation: 2,
  },

  applyBtnActive: {
    backgroundColor: "#0E3B2D",
    borderWidth: 1,
    borderColor: "#2EF2A3",
  },

  applyBtnDisabled: {
    opacity: 1,
  },

  applyBtnText: {
    color: "#003B2E",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.6,
  },

  applyBtnTextActive: {
    color: "#2EF2A3",
  },
});