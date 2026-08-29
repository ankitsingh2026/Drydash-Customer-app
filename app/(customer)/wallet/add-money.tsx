import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RazorpayCheckout from "react-native-razorpay";
import { showAlert } from "@/components/Customalert";
import { useTheme } from "@/context/ThemeContext";
import { useWallet } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import type {
  RazorpayPaymentSuccess,
  RazorpayPaymentError,
} from "../../../types/wallet.types";

const PRESET_AMOUNTS = [
  { amount: 500, label: "₹500" },
  { amount: 1000, label: "₹1000", popular: true },
  { amount: 1500, label: "₹1500" },
  { amount: 2000, label: "₹2000" },
];

export default function AddMoneyScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme, isDark);
  const router = useRouter();
  const { user } = useAuth();

  const { wallet, createTopupOrder, verifyTopup, fetchWallet, fetchTransactions } = useWallet();

  const customerPhone = user?.user?.phone || user?.phone || "";
  const customerName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "";
  const customerEmail = user?.email || "";

  const [amount, setAmount] = useState<string>("500");
  const [loading, setLoading] = useState(false);

  const selectedAmountNum = Number(amount) || 0;

  async function handleAddMoney() {
    const amt = Number(amount);

    if (!amt || amt <= 0) {
      showAlert({
        type: "warning",
        title: "Invalid Amount",
        message: "Please enter a valid top-up amount.",
      });
      return;
    }

    setLoading(true);

    try {
      const orderData = await createTopupOrder(amt);

      const options = {
        description: "Wallet Top Up",
        image: "https://your-logo-url.png",
        currency: orderData.currency,
        key: orderData.key,
        amount: orderData.amount.toString(),
        order_id: orderData.orderId,
        name: "DryDash",
        prefill: {
          contact: customerPhone,
          name: customerName,
          email: customerEmail,
        },
        theme: { color: "#007A33" },
      };

      const paymentData: RazorpayPaymentSuccess = await RazorpayCheckout.open(options);

      await verifyTopup({
        amount: amt,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      showAlert({
        type: "success",
        title: "Money Added Successfully!",
        message: `₹${amt} added to your wallet.`,
        onPrimary: () => router.back(),
      });

      await fetchWallet();
      await fetchTransactions({ limit: 20 });
      router.back();
    } catch (err: any) {
      const rzpErr = err as RazorpayPaymentError;
      if (rzpErr?.code === 0) {
        return;
      }
      showAlert({
        type: "error",
        title: "Top-up Failed",
        message: err.message || "Something went wrong while processing payment.",
      });
    } finally {
      setLoading(false);
    }
  }

  const headerTopPadding = Math.max(
    insets.top + 8,
    Platform.OS === "android" ? (StatusBar.currentHeight || 28) + 8 : 20
  );

  return (
    <View style={[styles.root, { backgroundColor: isDark ? theme.background : "#F8FAFC" }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: headerTopPadding }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Money</Text>

        <View style={{ width: 32 }} />
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* AVAILABLE BALANCE */}
        <Text style={[styles.balanceSubtitle, { color: isDark ? theme.subText : "#64748B" }]}>
          Available Balance: ₹{wallet?.balance !== undefined ? wallet.balance.toLocaleString("en-IN") : "0"}
        </Text>

        {/* LARGE AMOUNT INPUT */}
        <View style={styles.amountInputRow}>
          <Text style={[styles.currencySymbol, { color: isDark ? theme.text : "#0F172A" }]}>₹</Text>
          <TextInput
            value={amount}
            onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ""))}
            keyboardType="numeric"
            style={[styles.amountInput, { color: isDark ? theme.text : "#0F172A" }]}
            placeholder="0"
            placeholderTextColor={isDark ? theme.subText : "#94A3B8"}
          />
        </View>

        {/* PRESET CHIPS */}
        <View style={styles.presetContainer}>
          {PRESET_AMOUNTS.map((item) => {
            const isSelected = selectedAmountNum === item.amount;
            return (
              <View key={item.amount} style={styles.chipWrapper}>
                {item.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setAmount(String(item.amount))}
                  style={[
                    styles.presetChip,
                    isSelected
                      ? styles.presetChipSelected
                      : [
                          styles.presetChipUnselected,
                          {
                            backgroundColor: isDark ? theme.card : "#FFFFFF",
                            borderColor: isDark ? theme.border : "#E2E8F0",
                          },
                        ],
                  ]}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected
                        ? styles.presetChipTextSelected
                        : [styles.presetChipTextUnselected, { color: isDark ? theme.text : "#334155" }],
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* FIXED BOTTOM ADD MONEY BUTTON AT THE VERY BOTTOM */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleAddMoney}
          disabled={loading}
          style={styles.addMoneyBtn}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.addMoneyBtnText}>Add Money</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    backBtn: {
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 30,
      alignItems: "center",
    },
    balanceSubtitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 20,
      textAlign: "center",
    },
    amountInputRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 36,
    },
    currencySymbol: {
      fontSize: 42,
      fontWeight: "800",
      marginRight: 2,
    },
    amountInput: {
      fontSize: 48,
      fontWeight: "800",
      minWidth: 100,
      textAlign: "left",
      padding: 0,
    },
    presetContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 12,
      width: "100%",
    },
    chipWrapper: {
      alignItems: "center",
    },
    popularBadge: {
      marginBottom: 4,
    },
    popularText: {
      fontSize: 9,
      fontWeight: "800",
      color: "#007A33",
      letterSpacing: 0.5,
    },
    presetChip: {
      height: 42,
      paddingHorizontal: 16,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1.5,
    },
    presetChipSelected: {
      borderColor: "#007A33",
      backgroundColor: isDark ? "rgba(0, 122, 51, 0.12)" : "#FFFFFF",
    },
    presetChipUnselected: {
      borderWidth: 1,
    },
    presetChipText: {
      fontSize: 15,
      fontWeight: "700",
    },
    presetChipTextSelected: {
      color: "#007A33",
      fontWeight: "800",
    },
    presetChipTextUnselected: {},
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    addMoneyBtn: {
      height: 52,
      backgroundColor: "#007A33",
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#007A33",
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    addMoneyBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },
  });
