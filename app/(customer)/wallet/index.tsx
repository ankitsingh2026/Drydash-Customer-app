import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Filter,
  Gift,
  Plus,
  ShoppingBag,
  ArrowDownLeft,
  Wallet,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationsTopSheet from "@/components/layout/NotificationsTopSheet";
import { useNotifications } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";
import { useWallet } from "@/context/WalletContext";

export default function WalletPage() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme, isDark);
  const router = useRouter();

  const {
    wallet,
    transactions,
    referralData,
    loadingWallet,
    loadingTransactions,
    fetchWallet,
    fetchTransactions,
    fetchReferralData,
  } = useWallet();

  const { unreadCount } = useNotifications();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchWallet(),
        fetchTransactions({ limit: 30 }),
        fetchReferralData(),
      ]);
    } catch (err) {
      console.error("Failed to load wallet page data:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTransactions = (transactions || []).filter((item) => {
    if (activeFilter === "CREDIT") return item.type === "credit";
    if (activeFilter === "DEBIT") return item.type === "debit";
    return true;
  });

  const totalReferralEarned = useMemo(() => {
    const fromTxns = (transactions || [])
      .filter(
        (t) =>
          (t.category === "referral_bonus" || t.category === "referee_bonus") &&
          t.type === "credit"
      )
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const fromStats = Number(
      referralData?.totalEarned ?? referralData?.stats?.totalEarned ?? 0
    );

    return Math.max(fromTxns, fromStats);
  }, [transactions, referralData]);

  function renderTransactionItem({ item }: { item: typeof transactions[0] }) {
    const isCredit = item.type === "credit";
    const isOrder = item.category === "order_payment" || item.category === "partial_payment";
    const isReferral = item.category === "referral_bonus" || item.category === "referee_bonus";

    let iconNode;
    let iconBg;
    if (isCredit) {
      if (isReferral) {
        iconBg = isDark ? "rgba(16, 185, 129, 0.15)" : "#E6F4F0";
        iconNode = <Gift size={18} color="#007A33" />;
      } else {
        iconBg = isDark ? "rgba(16, 185, 129, 0.15)" : "#E6F4F0";
        iconNode = <ArrowDownLeft size={18} color="#007A33" />;
      }
    } else {
      iconBg = isDark ? "rgba(148, 163, 184, 0.15)" : "#F1F5F9";
      iconNode = <ShoppingBag size={18} color={isDark ? "#94A3B8" : "#64748B"} />;
    }

    return (
      <View style={[styles.txnCard, { backgroundColor: isDark ? theme.card : "#FFFFFF", borderColor: isDark ? theme.border : "#F1F5F9" }]}>
        <View style={[styles.txnIconWrap, { backgroundColor: iconBg }]}>
          {iconNode}
        </View>

        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.txnTitle, { color: isDark ? theme.text : "#0F172A" }]}>
            {getCategoryTitle(item)}
          </Text>
          <Text style={[styles.txnSubtext, { color: isDark ? theme.subText : "#64748B" }]}>
            {getCategorySubtext(item)}
          </Text>
        </View>

        <Text
          style={[
            styles.txnAmount,
            { color: isCredit ? "#007A33" : isDark ? theme.text : "#0F172A" },
          ]}
        >
          {isCredit ? "+ " : "- "}₹{item.amount.toLocaleString("en-IN")}
        </Text>
      </View>
    );
  }

  function getCategoryTitle(item: any): string {
    const category = item.category;
    if (category === "topup") return "Added to Wallet";
    if (category === "order_payment" || category === "partial_payment") return "Order Payment";
    if (category === "referral_bonus") return "Referral Bonus";
    if (category === "referee_bonus") return "Welcome Bonus";
    if (category === "order_refund") return "Order Refund";
    if (category === "cashback") return "Cashback Earned";
    return item.description || "Wallet Transaction";
  }

  function getCategorySubtext(item: any): string {
    const formattedDate = formatDate(item.createdAt);
    if (item.referenceId) {
      return `Order #${item.referenceId} • ${formattedDate}`;
    }
    if (item.category === "topup") {
      return `UPI • ${formattedDate}`;
    }
    if (item.category === "referral_bonus" || item.category === "referee_bonus") {
      return `Referral • ${formattedDate}`;
    }
    return formattedDate;
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.headerIconBtn}
        >
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>My Wallet</Text>

        <View style={{ width: 36 }} />
      </View>

      <Animated.View
        style={{
          opacity: fade,
          transform: [{ translateY: slide }],
          flex: 1,
        }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#007A33"]}
              tintColor="#007A33"
            />
          }
        >
          {/* WALLET BALANCE CARD */}
          <View style={[styles.balanceCard, { backgroundColor: isDark ? theme.card : "#FFFFFF", borderColor: isDark ? theme.border : "#E2E8F0" }]}>
            <View style={styles.balanceHeaderRow}>
              <Wallet size={16} color={isDark ? theme.subText : "#64748B"} />
              <Text style={[styles.balanceHeaderLabel, { color: isDark ? theme.subText : "#64748B" }]}>
                WALLET BALANCE
              </Text>
              {loadingWallet && <ActivityIndicator size="small" color="#007A33" style={{ marginLeft: 6 }} />}
            </View>

            <Text style={[styles.balanceAmount, { color: isDark ? theme.text : "#0F172A" }]}>
              ₹{wallet?.balance !== undefined ? wallet.balance.toLocaleString("en-IN") : "0"}
            </Text>

            <Text style={[styles.balanceSubtitle, { color: isDark ? theme.subText : "#64748B" }]}>
              Available Balance
            </Text>
          </View>

          {/* REFERRAL EARNINGS BANNER */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/(customer)/refer-and-earn")}
            style={[
              styles.referralBanner,
              {
                backgroundColor: isDark ? "rgba(16, 185, 129, 0.12)" : "#F0FDF4",
                borderColor: isDark ? "rgba(16, 185, 129, 0.25)" : "#DCFCE7",
              },
            ]}
          >
            <View style={styles.referralLeft}>
              <View style={styles.giftIconCircle}>
                <Gift size={16} color="#007A33" />
              </View>
              <Text style={styles.referralEarnedText} numberOfLines={1} adjustsFontSizeToFit>
                <Text style={styles.referralAmountBold}>₹{totalReferralEarned}</Text>
                <Text style={{ color: isDark ? theme.subText : "#475569" }}> earned from referrals</Text>
              </Text>
            </View>

            <View style={styles.referralRightLink}>
              <Text style={styles.inviteLinkText}>Invite Friends</Text>
              <ChevronRight size={14} color="#007A33" />
            </View>
          </TouchableOpacity>

          {/* TRANSACTION HISTORY HEADER & FILTER */}
          <View style={styles.txnHeaderRow}>
            <Text style={[styles.txnHeaderTitle, { color: isDark ? theme.subText : "#64748B" }]}>
              TRANSACTION HISTORY
            </Text>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setFilterModalVisible(true)}
              style={styles.filterBtn}
            >
              <Text style={styles.filterBtnText}>
                {activeFilter === "ALL" ? "Filter" : activeFilter === "CREDIT" ? "Credits" : "Debits"}
              </Text>
              <Filter size={14} color="#007A33" />
            </TouchableOpacity>
          </View>

          {/* TRANSACTION HISTORY CONTAINER */}
          <View
            style={[
              styles.txnListContainer,
              {
                backgroundColor: isDark ? theme.card : "#FFFFFF",
                borderColor: isDark ? theme.border : "#E2E8F0",
              },
            ]}
          >
            {loadingTransactions && (!transactions || transactions.length === 0) ? (
              <View style={styles.emptyWrap}>
                <ActivityIndicator size="small" color="#007A33" />
              </View>
            ) : filteredTransactions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: isDark ? theme.subText : "#64748B" }]}>
                  No transactions found
                </Text>
              </View>
            ) : (
              filteredTransactions.map((item, index) => (
                <React.Fragment key={(item?.id || `txn_${index}`) + index}>
                  {renderTransactionItem({ item })}
                  {index < filteredTransactions.length - 1 && (
                    <View style={[styles.txnDivider, { backgroundColor: isDark ? theme.border : "#F1F5F9" }]} />
                  )}
                </React.Fragment>
              ))
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* FILTER MODAL */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: isDark ? theme.card : "#FFFFFF" }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Filter Transactions</Text>

            <TouchableOpacity
              style={[styles.modalOption, activeFilter === "ALL" && styles.modalOptionActive]}
              onPress={() => {
                setActiveFilter("ALL");
                setFilterModalVisible(false);
              }}
            >
              <Text style={[styles.modalOptionText, activeFilter === "ALL" && styles.modalOptionTextActive]}>
                All Transactions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, activeFilter === "CREDIT" && styles.modalOptionActive]}
              onPress={() => {
                setActiveFilter("CREDIT");
                setFilterModalVisible(false);
              }}
            >
              <Text style={[styles.modalOptionText, activeFilter === "CREDIT" && styles.modalOptionTextActive]}>
                Credits Only (+ Money Added, Refunds, Referral)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, activeFilter === "DEBIT" && styles.modalOptionActive]}
              onPress={() => {
                setActiveFilter("DEBIT");
                setFilterModalVisible(false);
              }}
            >
              <Text style={[styles.modalOptionText, activeFilter === "DEBIT" && styles.modalOptionTextActive]}>
                Debits Only (- Order Payments)
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* FIXED BOTTOM ADD MONEY BUTTON */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push("/(customer)/wallet/add-money")}
          style={styles.addMoneyMainBtn}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addMoneyMainBtnText}>Add Money</Text>
        </TouchableOpacity>
      </View>

      {/* NOTIFICATIONS SHEET */}
      <NotificationsTopSheet
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
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
      paddingTop: 12,
      paddingBottom: 12,
    },
    headerIconBtn: {
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
    },
    bellBadge: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "#EF4444",
      borderRadius: 9,
      minWidth: 16,
      height: 16,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    bellBadgeText: {
      color: "#FFFFFF",
      fontSize: 9,
      fontWeight: "800",
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    balanceCard: {
      borderRadius: 20,
      borderWidth: 1,
      padding: 20,
      marginTop: 8,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    balanceHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    balanceHeaderLabel: {
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    balanceAmount: {
      fontSize: 38,
      fontWeight: "900",
      marginTop: 12,
      marginBottom: 2,
    },
    balanceSubtitle: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 18,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      backgroundColor: isDark ? theme.background : "#F8FAFC",
      borderTopWidth: 1,
      borderTopColor: isDark ? theme.border : "#E2E8F0",
    },
    addMoneyMainBtn: {
      height: 50,
      backgroundColor: "#007A33",
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      shadowColor: "#007A33",
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 3,
    },
    addMoneyMainBtnText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },
    referralBanner: {
      borderRadius: 16,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 24,
      gap: 6,
    },
    referralLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      flex: 1,
      paddingRight: 4,
    },
    giftIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "#D1FAE5",
      justifyContent: "center",
      alignItems: "center",
    },
    referralEarnedText: {
      fontSize: 13,
      fontWeight: "500",
      flex: 1,
    },
    referralAmountBold: {
      fontWeight: "900",
      color: "#007A33",
      fontSize: 14,
    },
    referralRightLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      flexShrink: 0,
    },
    inviteLinkText: {
      fontSize: 13,
      fontWeight: "800",
      color: "#007A33",
    },
    txnHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    txnHeaderTitle: {
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.6,
    },
    filterBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    filterBtnText: {
      fontSize: 14,
      fontWeight: "800",
      color: "#007A33",
    },
    txnListContainer: {
      borderRadius: 20,
      borderWidth: 1,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.03,
      shadowRadius: 6,
      elevation: 1,
    },
    txnCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    txnIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    txnTitle: {
      fontSize: 15,
      fontWeight: "800",
    },
    txnSubtext: {
      fontSize: 12,
      fontWeight: "500",
      marginTop: 2,
    },
    txnAmount: {
      fontSize: 16,
      fontWeight: "800",
    },
    txnDivider: {
      height: 1,
      marginHorizontal: 16,
    },
    emptyWrap: {
      padding: 32,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 14,
      fontWeight: "500",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      borderRadius: 20,
      padding: 20,
      gap: 8,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 8,
    },
    modalOption: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
    },
    modalOptionActive: {
      backgroundColor: "rgba(0, 122, 51, 0.1)",
    },
    modalOptionText: {
      fontSize: 15,
      fontWeight: "600",
      color: "#64748B",
    },
    modalOptionTextActive: {
      color: "#007A33",
      fontWeight: "800",
    },
  });
