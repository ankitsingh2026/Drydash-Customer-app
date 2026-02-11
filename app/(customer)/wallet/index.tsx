import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Plus, Wallet } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";




export default function WalletPage() {
  const { theme } = useTheme();
  const router = useRouter();

  //  animation
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // local UI statets
  const [amount, setAmount] = useState<string>("500");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<
    { id: string; brand: string; last4: string; expiry: string }[]
  >([]);
  const [upiId, setUpiId] = useState<string>("");

  const [showCardsSection, setShowCardsSection] = useState(true);

  useEffect(() => {

    async function loadCards() {
      try {

        const res = await fetch("/api/wallet/cards");
        if (res.ok) {
          const json = await res.json();
          setCards(json.cards || []);
        } else {

        }
      } catch (err) {

      }
    }
    loadCards();
  }, []);


  async function handleTopUpWithPhonePe() {

    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Alert.alert("Invalid amount", "Enter a valid top-up amount");
      return;
    }
    setLoading(true);

    try {

      const resp = await fetch("/api/wallet/topup/phonepe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Server error: ${text}`);
      }

      const payload = await resp.json();

      if (payload.upiUri) {
        const opened = await openUrlSafe(payload.upiUri);
        if (!opened) {
          Alert.alert(
            "No UPI app found",
            "Please install a UPI app (PhonePe / Google Pay) to proceed, or use card payment."
          );
        }
      } else if (payload.intentUri) {
        await openUrlSafe(payload.intentUri);
      } else if (payload.checkoutUrl) {

        await openUrlSafe(payload.checkoutUrl);
      } else {
        throw new Error("No action available from server response");
      }


    } catch (err: any) {
      Alert.alert("Top up failed", err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleTopUpWithPayU() {

    const amt = Number(amount);

    if (!amt || amt <= 0) {
      Alert.alert("Invalid amount");
      return;
    }

    setLoading(true);

    try {

      const resp = await fetch("/api/wallet/topup/payu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });

      const data = await resp.json();

      if (!data.paymentUrl) {
        throw new Error("Payment URL missing");
      }

      await Linking.openURL(data.paymentUrl);

    } catch (err: any) {

      Alert.alert("Payment failed", err.message);

    } finally {
      setLoading(false);
    }
  }

  async function openUrlSafe(url: string) {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) return false;
      await Linking.openURL(url);
      return true;
    } catch (e) {
      return false;
    }
  }


  async function handleTopUpWithUpiIntent() {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      Alert.alert("Invalid amount", "Enter a valid top-up amount");
      return;
    }
    // require upiId to be present for client-side intent flow
    if (!upiId) {
      Alert.alert("Enter UPI ID", "Please enter a valid UPI ID (example: mobile@upi)");
      return;
    }

    const params = new URLSearchParams({
      pa: upiId,
      pn: "StudyE Wallet",
      am: String(amt),
      cu: "INR",
      tn: "Wallet top-up",
    });
    const uri = `upi://pay?${params.toString()}`;

    const opened = await openUrlSafe(uri);
    if (!opened) {
      // fallback: try phonepe intent (PhonePe uses their own scheme sometimes)
      const phonepeIntent = `phonepe://pay?pa=${encodeURIComponent(
        upiId
      )}&am=${amt}&tn=Wallet+top-up`;
      const openedPhonePe = await openUrlSafe(phonepeIntent);
      if (!openedPhonePe) {
        Alert.alert(
          "No UPI app found",
          "Please install PhonePe/Google Pay or use card checkout."
        );
      }
    }


  }

  // ======= Card save / show UI =======
  function renderCard({ item }: { item: { id: string; brand: string; last4: string; expiry: string } }) {
    return (
      <View style={[styles.cardRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View>
          <Text style={{ color: theme.text, fontWeight: "800" }}>{item.brand.toUpperCase()}</Text>
          <Text style={{ color: theme.subText }}>**** **** **** {item.last4}</Text>
          <Text style={{ color: theme.subText, marginTop: 4 }}>Exp: {item.expiry}</Text>
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert("Pay with saved card", "This will call your tokenized card flow")}
          style={styles.smallBtn}
        >
          <Text style={{ fontWeight: "800" }}>Pay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Wallet</Text>

        <View style={{ width: 22 }} />
      </View>

      <Animated.View
        style={{
          opacity: fade,
          transform: [{ translateY: slide }],
        }}
      >
        {/* BALANCE CARD */}
        <View
          style={[
            styles.balanceCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.balanceRow}>
            <Wallet size={22} color={theme.primary} />
            <Text style={[styles.balanceLabel, { color: theme.subText }]}>
              Wallet Balance
            </Text>
          </View>

          <Text style={[styles.balance, { color: theme.text }]}>₹ 1,240</Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.topUpBtn, { backgroundColor: theme.primary }]}
              // onPress={handleTopUpWithPhonePe}
              onPress={handleTopUpWithPayU}
            >
              <Plus size={16} color="#000" />
              <Text style={styles.topUpText}>Top Up (PhonePe)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.topUpBtn, { backgroundColor: theme.card }]}
              onPress={() => {
                setShowCardsSection((s) => !s);
              }}
            >
              <Text style={[styles.topUpText, { color: theme.text, fontSize: 13 }]}>
                {showCardsSection ? "Hide" : "Show"} Cards
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AMOUNT INPUT */}
        <View style={[styles.section, { paddingTop: 4 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Top up amount</Text>
          <View style={[styles.rowInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ color: theme.subText, marginRight: 8 }}>₹</Text>
            <TextInput
              value={amount}
              keyboardType="numeric"
              onChangeText={setAmount}
              style={{ flex: 1, color: theme.text, fontWeight: "800" }}
            />
          </View>

          {/* UPI ID input + quick intent */}
          <Text style={[styles.sectionTitle, { marginTop: 12, color: theme.text }]}>Pay with UPI (optional)</Text>
          <View style={[styles.rowInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              placeholder="your-vpa@bank (optional)"
              placeholderTextColor={theme.subText}
              value={upiId}
              onChangeText={setUpiId}
              style={{ flex: 1, color: theme.text }}
            />
            <TouchableOpacity onPress={handleTopUpWithUpiIntent} style={styles.smallBtn}>
              <Text style={{ fontWeight: "800" }}>Pay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SAVED CARDS */}
        {showCardsSection && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Saved Cards</Text>

            {cards.length === 0 ? (
              <View style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={{ color: theme.subText }}>No saved cards</Text>
                <TouchableOpacity
                  onPress={() => Alert.alert("Add card", "Open add card flow (tokenize using backend/PG)")}
                  style={[styles.addCardBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={{ fontWeight: "900" }}>Add Card</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={cards}
                keyExtractor={(i) => i.id}
                renderItem={renderCard}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        )}

        {/* TRANSACTIONS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>

          <View style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={{ color: theme.subText }}>No recent transactions</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    marginTop: 40,
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
  },

  balanceCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },

  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  balanceLabel: {
    fontSize: 13,
    fontWeight: "700",
  },

  balance: {
    fontSize: 36,
    fontWeight: "900",
    marginVertical: 14,
  },

  topUpBtn: {
    height: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },

  topUpText: {
    fontWeight: "900",
    color: "#000",
    fontSize: 14,
  },

  section: {
    paddingHorizontal: 16,
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
  },

  transactionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },

  rowInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },

  addCardBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  cardRow: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  smallBtn: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6E6E6",
  },
});
