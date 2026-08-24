import { Stack, useRouter } from "expo-router";
import {
  ArrowLeft,
  Share2,
  Copy,
  Users,
  Gift,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Link,
  Smartphone,
  Sparkles,
  Wallet,
  Check,
  RefreshCw,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";
import { useWallet, ReferralHistoryItem } from "../../../context/WalletContext";
import { showAlert } from "@/components/Customalert";

export default function ReferAndEarnPage() {
  const { theme, isDark, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme, isDark, colors);
  const router = useRouter();

  const {
    referralData,
    referralHistory,
    loadingReferral,
    fetchReferralData,
    fetchReferralHistory,
    applyReferralCode,
  } = useWallet();

  const [inputCode, setInputCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [referralLink, setReferralLink] = useState<string>("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // High contrast button text color based on primary background
  const primaryBtnTextColor = isDark ? "#001714" : "#FFFFFF";
  const heroCardBg = isDark ? "#0A2D24" : "#005F47";

  const headerTopPadding = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight || 28) : 12
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadReferralData();
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const loadReferralData = async () => {
    try {
      await fetchReferralData();
      await fetchReferralHistory({ limit: 20 });
    } catch (err) {
      console.error("Failed to load referral data:", err);
    }
  };

  const handleApplyCode = async () => {
    if (!inputCode.trim()) {
      showAlert({ type: "warning", title: "Enter Code", message: "Please enter a referral code." });
      return;
    }
    setApplying(true);
    try {
      await applyReferralCode(inputCode.trim());
      showAlert({ type: "success", title: "Success!", message: "Referral code applied successfully!" });
      setInputCode("");
      await loadReferralData();
    } catch (err: any) {
      showAlert({ type: "error", title: "Failed", message: err.message || "Could not apply referral code." });
    } finally {
      setApplying(false);
    }
  };

  const handleCopyCode = () => {
    if (!referralData?.referralCode) {
      showAlert({ type: "warning", title: "No Referral Code", message: "You don't have a referral code yet." });
      return;
    }
    Clipboard.setString(referralData.referralCode);
    setCopiedCode(true);
    showAlert({ type: "success", title: "Copied!", message: "Referral code copied to clipboard." });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShare = async () => {
    if (!referralData?.referralCode) {
      showAlert({ type: "warning", title: "No Referral Code", message: "You don't have a referral code yet." });
      return;
    }

    const message = `Hey! Use my referral code ${referralData.referralCode} on DryDash and get ₹${referralData.refereeBonusAmount} off on your first order! I'll get ₹${referralData.referrerBonusAmount} too!`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const generateReferralLink = async () => {
    if (!referralData?.referralCode) {
      showAlert({ type: "warning", title: "No Referral Code", message: "You don't have a referral code yet." });
      return "";
    }

    setGeneratingLink(true);
    try {
      const { referralApi } = await import("@/features/auth/referral.api");
      const result = await referralApi.generateReferralLink(referralData.referralCode || "");

      if (result.success && result.data.referralLink) {
        setReferralLink(result.data.referralLink);
        return result.data.referralLink;
      }
    } catch (err: any) {
      console.error("Error generating referral link:", err);
      const fallbackLink = `https://app.drydash.com/signup?ref=${referralData.referralCode}`;
      setReferralLink(fallbackLink);
      return fallbackLink;
    } finally {
      setGeneratingLink(false);
    }
    return "";
  };

  const handleCopyLink = async () => {
    let link = referralLink;
    if (!link) {
      link = await generateReferralLink();
    }
    if (link) {
      Clipboard.setString(link);
      setCopiedLink(true);
      showAlert({ type: "success", title: "Link Copied!", message: "Referral link copied to clipboard." });
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleShareWhatsApp = async () => {
    let link = referralLink;
    if (!link) {
      link = await generateReferralLink();
    }

    if (!referralData) return;

    try {
      const message =
        referralData.shareMessage ||
        `Hey! Use my referral code *${referralData.referralCode}* on DryDash and get ₹${referralData.refereeBonusAmount} off on your first order! I'll get ₹${referralData.referrerBonusAmount} too!\n\nClick to sign up: ${link}`;

      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
      }
    } catch (error) {
      console.error("Error sharing to WhatsApp:", error);
      showAlert({ type: "error", title: "Failed", message: "Could not open WhatsApp." });
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);

  function getStatusIcon(status: string) {
    switch (status) {
      case "rewarded":
        return <CheckCircle size={18} color="#10B981" />;
      case "qualified":
        return <TrendingUp size={18} color="#F59E0B" />;
      case "expired":
        return <XCircle size={18} color="#EF4444" />;
      case "cancelled":
        return <XCircle size={18} color="#6B7280" />;
      default:
        return <Clock size={18} color="#F59E0B" />;
    }
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: "Pending",
      qualified: "Qualified",
      rewarded: "Rewarded",
      expired: "Expired",
      cancelled: "Cancelled",
    };
    return labels[status] || status;
  }

  function getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      pending: "#F59E0B",
      qualified: "#3B82F6",
      rewarded: "#10B981",
      expired: "#EF4444",
      cancelled: "#6B7280",
    };
    return statusColors[status] || "#6B7280";
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  function renderReferralItem(item: ReferralHistoryItem) {
    const statusColor = getStatusColor(item.status);
    return (
      <View
        key={item.referralCode + item.createdAt}
        style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <View style={styles.historyCardHeader}>
          <View style={styles.historyCardLeft}>
            <View style={styles.historyIconWrapper}>
              {getStatusIcon(item.status)}
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.historyCodeText, { color: theme.text }]}>
                {item.referralCode}
              </Text>
              <Text style={[styles.historyDateText, { color: theme.textSecondary || theme.subText }]}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>

          <View style={[styles.historyBadge, { borderColor: statusColor, borderWidth: 1 }]}>
            <Text style={[styles.historyBadgeText, { color: statusColor }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        {item.rewardedAt && (
          <View style={styles.rewardedBanner}>
            <CheckCircle size={15} color="#10B981" />
            <Text style={styles.rewardedBannerText}>
              ₹{item.referrerBonusAmount} credited on {formatDate(item.rewardedAt)}
            </Text>
          </View>
        )}

        {item.status === "pending" && !item.rewardedAt && (
          <View style={styles.pendingBanner}>
            <Clock size={14} color="#F59E0B" />
            <Text style={styles.pendingBannerText}>
              Awaiting friend's first order
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* HEADER BAR */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            paddingTop: headerTopPadding,
          },
        ]}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Refer & Earn</Text>

        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} activeOpacity={0.7}>
          <RefreshCw size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {loadingReferral ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.textSecondary || theme.subText, marginTop: 14, fontSize: 14 }}>
              Loading referral details...
            </Text>
          </View>
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
            contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 40, 50) }}
            showsVerticalScrollIndicator={false}
          >
            {/* HERO BANNER CARD - ALWAYS HIGH CONTRAST DARK GREEN BACKGROUND */}
            <View style={styles.heroWrapper}>
              <View style={[styles.heroCard, { backgroundColor: heroCardBg }]}>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroBadge}>
                    <Sparkles size={14} color="#FFD700" />
                    <Text style={styles.heroBadgeText}>DRYDASH REWARDS</Text>
                  </View>
                </View>

                <Text style={styles.heroTitle}>Invite Friends & Earn Cash!</Text>
                <Text style={styles.heroSubtitle}>
                  Share fresh, clean laundry with friends. Both of you win on every successful referral.
                </Text>

                {/* OFFER HIGHLIGHTS BOX */}
                <View style={styles.offerHighlightBox}>
                  <View style={styles.offerHighlightItem}>
                    <Text style={styles.offerAmount}>₹{referralData?.referrerBonusAmount || 0}</Text>
                    <Text style={styles.offerLabel}>You Receive</Text>
                  </View>

                  <View style={styles.offerDivider} />

                  <View style={styles.offerHighlightItem}>
                    <Text style={styles.offerAmount}>₹{referralData?.refereeBonusAmount || 0}</Text>
                    <Text style={styles.offerLabel}>Friend Gets Off</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* REFERRAL CODE & SHARING CARD */}
            <View style={styles.sectionContainer}>
              <View style={[styles.codeBoxCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.codeBoxLabel, { color: theme.textSecondary || theme.subText }]}>
                  YOUR REFERRAL CODE
                </Text>

                <View style={styles.codeRow}>
                  <View
                    style={[
                      styles.codeContainer,
                      {
                        backgroundColor: isDark ? "#001714" : "#F4F9F7",
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <Text style={[styles.codeText, { color: theme.primary }]}>
                      {referralData?.referralCode || "---"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.copyCodeBtn, { backgroundColor: copiedCode ? "#10B981" : theme.primary }]}
                    onPress={handleCopyCode}
                    activeOpacity={0.8}
                  >
                    {copiedCode ? (
                      <>
                        <Check size={16} color={primaryBtnTextColor} />
                        <Text style={[styles.copyCodeBtnText, { color: primaryBtnTextColor }]}>Copied</Text>
                      </>
                    ) : (
                      <>
                        <Copy size={16} color={primaryBtnTextColor} />
                        <Text style={[styles.copyCodeBtnText, { color: primaryBtnTextColor }]}>Copy</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={[styles.shareMethodTitle, { color: theme.text }]}>Share via</Text>

                {/* PRIMARY ACTION BUTTONS */}
                <View style={styles.actionButtonsGrid}>
                  {/* WHATSAPP */}
                  <TouchableOpacity
                    style={styles.whatsappBtn}
                    onPress={handleShareWhatsApp}
                    activeOpacity={0.85}
                  >
                    <Smartphone size={20} color="#FFFFFF" />
                    <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                  </TouchableOpacity>

                  {/* SHARE CODE */}
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionBtn,
                      {
                        backgroundColor: isDark ? "#001714" : "#F4F9F7",
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={handleShare}
                    activeOpacity={0.8}
                  >
                    <Share2 size={18} color={theme.primary} />
                    <Text style={[styles.secondaryActionText, { color: theme.primary }]}>Share Code</Text>
                  </TouchableOpacity>

                  {/* COPY LINK */}
                  <TouchableOpacity
                    style={[
                      styles.secondaryActionBtn,
                      {
                        backgroundColor: isDark ? "#001714" : "#F4F9F7",
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={handleCopyLink}
                    disabled={generatingLink}
                    activeOpacity={0.8}
                  >
                    {generatingLink ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : copiedLink ? (
                      <>
                        <Check size={18} color="#10B981" />
                        <Text style={[styles.secondaryActionText, { color: "#10B981" }]}>Link Copied!</Text>
                      </>
                    ) : (
                      <>
                        <Link size={18} color={theme.primary} />
                        <Text style={[styles.secondaryActionText, { color: theme.primary }]}>Copy Link</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* STATS SUMMARY */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionHeading, { color: theme.text }]}>Your Referral Stats</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.statIconCircle}>
                    <Users size={20} color={theme.primary} />
                  </View>
                  <Text style={[styles.statNumber, { color: theme.text }]}>
                    {referralData?.totalReferrals || 0}
                  </Text>
                  <Text style={[styles.statDesc, { color: theme.textSecondary || theme.subText }]}>
                    Total Invited
                  </Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.statIconCircle}>
                    <CheckCircle size={20} color="#10B981" />
                  </View>
                  <Text style={[styles.statNumber, { color: theme.text }]}>
                    {referralData?.successfulReferrals || 0}
                  </Text>
                  <Text style={[styles.statDesc, { color: theme.textSecondary || theme.subText }]}>
                    Successful
                  </Text>
                </View>

                <View style={[styles.statBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.statIconCircle}>
                    <Wallet size={20} color="#F59E0B" />
                  </View>
                  <Text style={[styles.statNumber, { color: "#F59E0B" }]}>
                    ₹{referralData?.totalEarnings || 0}
                  </Text>
                  <Text style={[styles.statDesc, { color: theme.textSecondary || theme.subText }]}>
                    Total Earned
                  </Text>
                </View>
              </View>
            </View>

            {/* HOW IT WORKS PROCESS */}
            <View style={styles.sectionContainer}>
              <View style={[styles.howItWorksCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.sectionHeading, { color: theme.text, marginBottom: 16 }]}>
                  How It Works
                </Text>

                {/* Step 1 */}
                <View style={styles.stepRow}>
                  <View style={styles.stepIndicatorCol}>
                    <View style={[styles.stepCircle, { backgroundColor: theme.primary }]}>
                      <Text style={[styles.stepNumberText, { color: primaryBtnTextColor }]}>1</Text>
                    </View>
                    <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
                  </View>
                  <View style={styles.stepContentCol}>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>Share Your Code</Text>
                    <Text style={[styles.stepDescription, { color: theme.textSecondary || theme.subText }]}>
                      Send your unique code or link to your friends via WhatsApp or social media.
                    </Text>
                  </View>
                </View>

                {/* Step 2 */}
                <View style={styles.stepRow}>
                  <View style={styles.stepIndicatorCol}>
                    <View style={[styles.stepCircle, { backgroundColor: theme.primary }]}>
                      <Text style={[styles.stepNumberText, { color: primaryBtnTextColor }]}>2</Text>
                    </View>
                    <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
                  </View>
                  <View style={styles.stepContentCol}>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>Friend Places Order</Text>
                    <Text style={[styles.stepDescription, { color: theme.textSecondary || theme.subText }]}>
                      Your friend applies your code during signup and gets ₹{referralData?.refereeBonusAmount || 50} off on their first order.
                    </Text>
                  </View>
                </View>

                {/* Step 3 */}
                <View style={styles.stepRow}>
                  <View style={styles.stepIndicatorCol}>
                    <View style={[styles.stepCircle, { backgroundColor: "#10B981" }]}>
                      <Text style={[styles.stepNumberText, { color: "#FFFFFF" }]}>3</Text>
                    </View>
                  </View>
                  <View style={styles.stepContentCol}>
                    <Text style={[styles.stepTitle, { color: theme.text }]}>Get Rewarded!</Text>
                    <Text style={[styles.stepDescription, { color: theme.textSecondary || theme.subText }]}>
                      You receive ₹{referralData?.referrerBonusAmount || 100} cash directly in your DryDash Wallet automatically!
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* APPLY A FRIEND'S REFERRAL CODE */}
            <View style={styles.sectionContainer}>
              <View style={[styles.applyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.applyHeaderRow}>
                  <Gift size={20} color={theme.primary} />
                  <Text style={[styles.applyTitle, { color: theme.text }]}>Have a Referral Code?</Text>
                </View>
                <Text style={[styles.applySubtitle, { color: theme.textSecondary || theme.subText }]}>
                  Enter a friend's code to get discount credits on your account.
                </Text>

                <View style={styles.applyInputRow}>
                  <TextInput
                    placeholder="Enter code (e.g. REF123)"
                    value={inputCode}
                    onChangeText={(text) => setInputCode(text.toUpperCase())}
                    autoCapitalize="characters"
                    style={[
                      styles.applyInput,
                      {
                        backgroundColor: isDark ? "#001714" : "#F4F9F7",
                        borderColor: theme.border,
                        color: theme.text,
                      },
                    ]}
                    placeholderTextColor={theme.textSecondary || theme.subText}
                  />

                  <TouchableOpacity
                    style={[
                      styles.applySubmitBtn,
                      { backgroundColor: inputCode.trim() ? theme.primary : theme.border },
                    ]}
                    onPress={handleApplyCode}
                    disabled={!inputCode.trim() || applying}
                    activeOpacity={0.8}
                  >
                    {applying ? (
                      <ActivityIndicator size="small" color={primaryBtnTextColor} />
                    ) : (
                      <Text
                        style={[
                          styles.applySubmitText,
                          { color: inputCode.trim() ? primaryBtnTextColor : (theme.textSecondary || theme.subText) },
                        ]}
                      >
                        Apply
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* REFERRAL HISTORY SECTION */}
            <View style={styles.sectionContainer}>
              <View style={styles.historyHeader}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>Referral History</Text>
                <Text style={[styles.historyCountText, { color: theme.textSecondary || theme.subText }]}>
                  {referralHistory?.length || 0} Total
                </Text>
              </View>

              {referralHistory && referralHistory.length > 0 ? (
                <View style={styles.historyList}>
                  {referralHistory.map((item) => renderReferralItem(item))}
                </View>
              ) : (
                <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.emptyIconCircle}>
                    <Users size={36} color={theme.primary} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>No Referrals Yet</Text>
                  <Text style={[styles.emptySub, { color: theme.textSecondary || theme.subText }]}>
                    Share your code with friends to start earning instant rewards.
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptyShareBtn, { backgroundColor: theme.primary }]}
                    onPress={handleShareWhatsApp}
                    activeOpacity={0.85}
                  >
                    <Smartphone size={16} color={primaryBtnTextColor} />
                    <Text style={[styles.emptyShareBtnText, { color: primaryBtnTextColor }]}>
                      Share on WhatsApp
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme: any, isDark: boolean, colors: any) {
  return StyleSheet.create({
    root: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
    },
    backBtn: {
      padding: 6,
      borderRadius: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
    },
    refreshBtn: {
      padding: 6,
      borderRadius: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 60,
    },
    heroWrapper: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    heroCard: {
      borderRadius: 20,
      padding: 22,
      position: "relative",
      overflow: "hidden",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
    },
    heroBadgeRow: {
      flexDirection: "row",
      marginBottom: 10,
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      gap: 6,
    },
    heroBadgeText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.8,
    },
    heroTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: "#FFFFFF",
      lineHeight: 28,
    },
    heroSubtitle: {
      fontSize: 13,
      color: "#D0EAE4",
      marginTop: 6,
      lineHeight: 18,
    },
    offerHighlightBox: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.25)",
      borderRadius: 14,
      marginTop: 18,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    offerHighlightItem: {
      flex: 1,
      alignItems: "center",
    },
    offerAmount: {
      fontSize: 20,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    offerLabel: {
      fontSize: 11,
      color: "#D0EAE4",
      marginTop: 2,
      fontWeight: "500",
    },
    offerDivider: {
      width: 1,
      height: 28,
      backgroundColor: "rgba(255, 255, 255, 0.25)",
    },
    sectionContainer: {
      paddingHorizontal: 16,
      marginTop: 16,
    },
    sectionHeading: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 12,
    },
    codeBoxCard: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 18,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    codeBoxLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 10,
    },
    codeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 18,
    },
    codeContainer: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
    },
    codeText: {
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: 2,
    },
    copyCodeBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 18,
      height: 48,
      borderRadius: 12,
      justifyContent: "center",
    },
    copyCodeBtnText: {
      fontWeight: "700",
      fontSize: 14,
    },
    shareMethodTitle: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 10,
    },
    actionButtonsGrid: {
      flexDirection: "column",
      gap: 10,
    },
    whatsappBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#25D366",
      height: 48,
      borderRadius: 12,
      gap: 8,
      elevation: 1,
    },
    whatsappBtnText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 15,
    },
    secondaryActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      height: 44,
      borderRadius: 12,
      borderWidth: 1.5,
      gap: 8,
    },
    secondaryActionText: {
      fontWeight: "700",
      fontSize: 14,
    },
    statsGrid: {
      flexDirection: "row",
      gap: 10,
    },
    statBox: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      padding: 14,
      alignItems: "center",
    },
    statIconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 8,
    },
    statNumber: {
      fontSize: 17,
      fontWeight: "800",
    },
    statDesc: {
      fontSize: 11,
      marginTop: 2,
      fontWeight: "500",
    },
    howItWorksCard: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 18,
    },
    stepRow: {
      flexDirection: "row",
    },
    stepIndicatorCol: {
      alignItems: "center",
      marginRight: 14,
    },
    stepCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    stepNumberText: {
      fontWeight: "800",
      fontSize: 13,
    },
    stepLine: {
      width: 2,
      height: 36,
      marginVertical: 4,
    },
    stepContentCol: {
      flex: 1,
      paddingBottom: 16,
    },
    stepTitle: {
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 2,
    },
    stepDescription: {
      fontSize: 12,
      lineHeight: 17,
    },
    applyCard: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 18,
    },
    applyHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    applyTitle: {
      fontSize: 15,
      fontWeight: "700",
    },
    applySubtitle: {
      fontSize: 12,
      marginBottom: 14,
    },
    applyInputRow: {
      flexDirection: "row",
      gap: 10,
    },
    applyInput: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 14,
      fontSize: 14,
      fontWeight: "700",
    },
    applySubmitBtn: {
      paddingHorizontal: 20,
      height: 46,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    applySubmitText: {
      fontWeight: "800",
      fontSize: 14,
    },
    historyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    historyCountText: {
      fontSize: 12,
      fontWeight: "600",
    },
    historyList: {
      gap: 10,
    },
    historyCard: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 14,
    },
    historyCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    historyCardLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    historyIconWrapper: {
      width: 34,
      height: 34,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },
    historyCodeText: {
      fontSize: 14,
      fontWeight: "700",
    },
    historyDateText: {
      fontSize: 11,
      marginTop: 2,
    },
    historyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
    },
    historyBadgeText: {
      fontSize: 11,
      fontWeight: "700",
    },
    rewardedBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#10B98115",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 10,
    },
    rewardedBannerText: {
      color: "#10B981",
      fontSize: 12,
      fontWeight: "700",
    },
    pendingBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "#F59E0B15",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginTop: 10,
    },
    pendingBannerText: {
      color: "#F59E0B",
      fontSize: 12,
      fontWeight: "600",
    },
    emptyBox: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 24,
      alignItems: "center",
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 4,
    },
    emptySub: {
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
      marginBottom: 16,
    },
    emptyShareBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 20,
      height: 42,
      borderRadius: 12,
    },
    emptyShareBtnText: {
      fontWeight: "700",
      fontSize: 13,
    },
  });
}
