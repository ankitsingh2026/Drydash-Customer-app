// components/CartSheet.tsx
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Minus, Plus, X } from "lucide-react-native";
import React from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
export default function CartSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { items, addItem, removeItem, clear, decreaseQty } = useCart();
  const { theme, isDark } = useTheme()
  const styles = makeStyles(theme, isDark);

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const discount = subtotal >= 1000 ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount;

  const handleBookPickup = () => {
    router.push("/book-pickup")
  }
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.card }]}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Your Cart</Text>

            <View style={styles.headerActions}>
              {/* {items.length > 0 && (
                <TouchableOpacity onPress={clear}>
                   <Trash2 size={18} color={theme.subText} />
                </TouchableOpacity>
              )} */}
              <TouchableOpacity onPress={onClose}>
                <X size={22} color={theme.subText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* CONTENT */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {items.length === 0 && (
              <Text
                style={{
                  color: theme.subText,
                  textAlign: "center",
                  marginTop: 40,
                }}
              >
                Your cart is empty
              </Text>
            )}

            {items.map((i) => (
              <View
                key={i.id}
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: theme.background,
                  },
                ]}
              >
                {/* IMAGE PLACEHOLDER */}
                {i.image ? (
                  <Image
                    source={{ uri: i.image }}
                    style={styles.thumb}
                    resizeMode="cover"
                    onError={() => console.log("Image failed")}
                  />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: theme.card }]}>
                    <Text style={{ fontSize: 11, color: theme.subText }}>
                      IMG
                    </Text>
                  </View>
                )}

                {/* INFO */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.text,
                      fontWeight: "800",
                      fontSize: 14,
                    }}
                  >
                    {i.title}
                  </Text>
                  <Text style={{ color: theme.subText, marginTop: 2 }}>
                    ₹{i.price} each
                  </Text>
                </View>

                {/* QTY */}
                <View style={styles.qtyBox}>
                  <TouchableOpacity
                    onPress={() => removeItem(i.id)}
                    style={styles.qtyBtn}
                  >
                    <Minus size={14} color={theme.text} />
                  </TouchableOpacity>

                  <Text
                    style={{
                      minWidth: 24,
                      textAlign: "center",
                      fontWeight: "900",
                      color: theme.text,
                    }}
                  >
                    {i.qty}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      addItem({
                        id: i.id,
                        title: i.title,
                        price: i.price,
                        image: i.image,
                      })
                    }
                    style={styles.qtyBtn}
                  >
                    <Plus size={14} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* PRICE SUMMARY */}
            {items.length > 0 && (
              <View style={styles.summary}>
                <Row label="Subtotal" value={`₹${subtotal}`} />
                <Row
                  label="Discount"
                  value={`- ₹${discount}`}
                  highlight={discount > 0}
                />
                <Row label="Total" value={`₹${total}`} bold />
              </View>
            )}

            {/* CHECKOUT */}
            {items.length > 0 && (
              <TouchableOpacity activeOpacity={0.9} style={styles.checkout}
                onPress={handleBookPickup}
              >
                <LinearGradient
                  colors={[theme.primary, theme.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text

                  style={styles.checkoutText}>Book Your Pickup</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ---------- SMALL HELPER ---------- */
function Row({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.totRow}>
      <Text
        style={{
          color: theme.text,
          fontWeight: bold ? "900" : "600",
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: theme.text,
          fontWeight: bold ? "900" : "700",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

/* ---------- STYLES ---------- */
const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: theme.card,
  },

  sheet: {
    maxHeight: "78%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
  },

  headerActions: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },

  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },

  thumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.textSecondary,
    overflow: "hidden",
  },

  qtyBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  summary: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },

  totRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  checkout: {
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    overflow: "hidden",   // ← add this

  },

  checkoutText: {
    fontWeight: "700",
    fontSize: 16,
    color: theme.text,
  },
});
