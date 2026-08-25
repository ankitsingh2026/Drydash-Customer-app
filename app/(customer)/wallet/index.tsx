import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Plus, Wallet } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";
import { useWallet } from "../../../context/WalletContext";
import { useAuth } from "../../../context/AuthContext";
import { showAlert } from "@/components/Customalert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RazorpayCheckout from "react-native-razorpay";

import type {
  RazorpayPaymentSuccess,
  RazorpayPaymentError,
  RazorpayCreateOrderResponse,
} from "../../../types/wallet.types";

export default function WalletPage() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme, isDark);
  const router = useRouter();
  const { user } = useAuth();

  const {
    wallet,
    transactions,
    loadingWallet,
    loadingTransactions,
    fetchWallet,
    fetchTransactions,
    createTopupOrder,
    verifyTopup,
  } = useWallet();


  console.log("txn", transactions);

  // Get user details for Razorpay prefill
  // AuthUser has nested user object with: id, phone, role, isPhoneVerified, isEmailVerified
  // But firstName, lastName, email are on the outer AuthUser
  const customerPhone = user?.user?.phone || user?.phone || '';
  const customerName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : '';
  const customerEmail = user?.email || '';

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

  // Load wallet data on mount
  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      await fetchWallet();
      await fetchTransactions({ limit: 20 });
    } catch (err) {
      console.error("Failed to load wallet data:", err);
    }
  };

  // local UI states
  const [amount, setAmount] = useState<string>("500");
  const [loading, setLoading] = useState(false);

  async function handleTopUp() {
    const amt = Number(amount);

    if (!amt || amt <= 0) {
      showAlert({ type: 'warning', title: 'Invalid amount', message: 'Enter a valid top-up amount.' });
      return;
    }

    setLoading(true);

    try {
      // Create Razorpay order via washrz backend
      const orderData = await createTopupOrder(amt);

      console.log("this is the orderData====>>>>>>>>", orderData);

      // Open Razorpay checkout using react-native-razorpay (native module)
      // Standard checkout shows ALL payment methods: Cards, NetBanking, Wallets, UPI
      // No need for method: 'upi' - that restricts to only UPI and requires upi_app_package_name
      const options = {
        description: 'Wallet Top Up',
        image: 'https://your-logo-url.png',
        currency: orderData.currency,
        key: orderData.key,
        amount: orderData.amount.toString(), // Already in paise from backend
        order_id: orderData.orderId,
        name: 'DryDash',
        prefill: {
          contact: customerPhone,
          name: customerName,
          email: customerEmail,
        },
        theme: { color: theme.primary },
      };

      console.log("Razorpay options:", options);

      const paymentData: RazorpayPaymentSuccess = await RazorpayCheckout.open(options);

      // Verify payment
      await verifyTopup({
        amount: amt,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      showAlert({
        type: 'success',
        title: 'Top up successful',
        message: `₹${amt} added to your wallet`,
      });

      // Refresh wallet data
      await loadWalletData();
    } catch (err: any) {
      const rzpErr = err as RazorpayPaymentError;
      if (rzpErr?.code === 0) {
        // User cancelled - don't show error
        return;
      }
      showAlert({ type: 'error', title: 'Top up failed', message: err.message || 'Unknown error' });
    } finally {
      setLoading(false);
    }
  }

  function renderTransactionItem({ item }: { item: typeof transactions[0] }) {
    const isCredit = item.type === 'credit';
    const categoryColor = getCategoryColor(item.category);

    return (
      <View style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: "700", fontSize: 14 }}>
            {getCategoryLabel(item.category)}
          </Text>
          <Text style={{ color: theme.subText, fontSize: 12, marginTop: 2 }}>
            {formatDate(item.createdAt)}
          </Text>
          {item.description ? (
            <Text style={{ color: theme.subText, fontSize: 11, marginTop: 2, opacity: 0.8 }}>
              {item.description}
            </Text>
          ) : null}
        </View>

        <Text
          style={{
            color: isCredit ? "#16a34a" : "#dc2626",
            fontWeight: "900",
            fontSize: 16,
          }}
        >
          {isCredit ? "+" : "−"}₹{item.amount}
        </Text>
      </View>
    );
  }

  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      referral_bonus: "Referral Bonus",
      referee_bonus: "Welcome Bonus",
      order_payment: "Order Payment",
      order_refund: "Order Refund",
      cashback: "Cashback",
      admin_credit: "Admin Credit",
      admin_debit: "Admin Debit",
      topup: "Wallet Top Up",
      withdrawal: "Withdrawal",
      partial_payment: "Partial Payment",
      expired_referral: "Expired Referral",
    };
    return labels[category] || category;
  }

  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      referral_bonus: "#16a34a",
      referee_bonus: "#16a34a",
      order_payment: "#dc2626",
      order_refund: "#16a34a",
      cashback: "#16a34a",
      admin_credit: "#16a34a",
      admin_debit: "#dc2626",
      topup: "#16a34a",
      withdrawal: "#dc2626",
      partial_payment: "#dc2626",
      expired_referral: "#dc2626",
    };
    return colors[category] || theme.subText;
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadWalletData();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER - FIXED */}
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
          flex: 1,
        }}
      >
        {/* FIXED TOP SECTION */}
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
            {loadingWallet && (
              <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 8 }} />
            )}
          </View>

          <Text style={[styles.balance, { color: theme.text }]}>
            ₹ {wallet?.balance?.toLocaleString('en-IN') || "0"}
          </Text>
        </View>

        {/* AMOUNT INPUT */}
        <View style={[styles.section, { paddingTop: 4 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Top up amount</Text>
          <View style={[styles.rowInput, {
            backgroundColor: theme.card,
            borderColor: theme.border,
          }]}>
            <Text style={{ color: theme.subText, marginRight: 8 }}>₹</Text>
            <TextInput
              value={amount}
              keyboardType="numeric"
              onChangeText={setAmount}
              style={{ flex: 1, color: theme.text, fontWeight: "800" }}
            />
          </View>

          <TouchableOpacity
            onPress={handleTopUp}
            style={[
              styles.topUpBtn,
              { backgroundColor: theme.primary, marginTop: 16 },
            ]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.background} />
            ) : (
              <>
                <Plus size={16} color={theme.background} />
                <Text style={styles.topUpText}>Top Up ₹{amount}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* RECENT TRANSACTIONS HEADER - FIXED */}
        <View style={[styles.section, { marginTop: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Recent Transactions</Text>
          {loadingTransactions && (
            <ActivityIndicator size="small" color={theme.primary} />
          )}
        </View>

        {/* SCROLLABLE LIST - ONLY TRANSACTIONS SCROLL */}
        {(!transactions || transactions.length === 0) && !loadingTransactions ? (
          <View style={styles.section}>
            <View style={[styles.transactionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={{ color: theme.subText }}>No recent transactions</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={transactions || []}
            keyExtractor={(item, index) => (item?.id || `txn_${index}`) + (item?.createdAt || "")}
            renderItem={renderTransactionItem}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom + 32, 48) }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            style={{ flex: 1 }}
          />
        )}
      </Animated.View>
    </View>
  );
}

/* ================= STYLES ================= */

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
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
    paddingHorizontal: 16,
  },

  topUpText: {
    fontWeight: "900",
    color: theme.background,
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

  rowInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },

  smallBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: theme.primary,
  },

  paymentMethodSelector: {
    paddingHorizontal: 16,
  },

  methodOptions: {
    flexDirection: "row",
    gap: 8,
  },

  methodOption: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },

  transactionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
