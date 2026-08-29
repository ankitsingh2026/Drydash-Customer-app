import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  Clock,
  Copy,
  FileText,
  Gift,
  Info,
  Share2,
  Smartphone,
  Users,
  XCircle,
} from "lucide-react-native";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showAlert } from "@/components/Customalert";
import { useTheme } from "@/context/ThemeContext";
import { useWallet, ReferralHistoryItem } from "@/context/WalletContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ReferAndEarnPage() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme, isDark);
  const router = useRouter();

  const {
    referralData,
    referralHistory,
    loadingReferral,
    fetchReferralData,
    fetchReferralHistory,
  } = useWallet();

  const [refreshing, setRefreshing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [howItWorksVisible, setHowItWorksVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const headerTopPadding = Math.max(
    insets.top,
    Platform.OS === "android" ? (StatusBar.currentHeight || 28) : 12
  );

  React.useEffect(() => {
    loadReferralData();
  }, []);

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
      await Promise.all([
        fetchReferralData(),
        fetchReferralHistory({ limit: 20 }),
      ]);
    } catch (err) {
      console.error("Failed to load referral data:", err);
    }
  };

  const openHistoryModal = () => {
    fetchReferralHistory({ limit: 20 });
    setHistoryModalVisible(true);
  };

  const handleCopyCode = () => {
    if (!referralData?.referralCode) {
      showAlert({ type: "warning", title: "No Code", message: "Referral code not available." });
      return;
    }
    Clipboard.setString(referralData.referralCode);
    setCopiedCode(true);
    showAlert({ type: "success", title: "Copied!", message: "Referral code copied to clipboard." });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareWhatsApp = async () => {
    if (!referralData?.referralCode) {
      showAlert({ type: "warning", title: "No Code", message: "Referral code not available." });
      return;
    }

    const code = referralData.referralCode;
    const refereeBonus = referralData.refereeBonusAmount || 100;
    const shareUrl = referralData?.referralLink || `https://drydash.in/referral/${code}`;
    const message = `Hey! Use my referral code *${code}* on DryDash to get ₹${refereeBonus} off on your first laundry order! Download & book now: ${shareUrl}`;

    try {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({ message });
      }
    } catch (error) {
      await Share.share({ message });
    }
  };

  const referrerBonus = referralData?.referrerBonusAmount || 300;
  const refereeBonus = referralData?.refereeBonusAmount || 100;

  return (
    <View style={[styles.root, { backgroundColor: isDark ? theme.background : "#FFFFFF" }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {loadingReferral ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007A33" />
          <Text style={[styles.loadingText, { color: isDark ? theme.subText : "#64748B" }]}>
            Loading referral details...
          </Text>
        </View>
      ) : referralData?.isEligibleToRefer === false ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? theme.background : "#F8FAFC" }}>
          {/* TOP BAR FOR LOCKED STATE */}
          <View style={[styles.lockedHeader, { paddingTop: headerTopPadding }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <ArrowLeft size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.lockedHeaderTitle, { color: theme.text }]}>Refer & Earn</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.lockedContainer}>
            <View style={[styles.lockedCircle, { backgroundColor: isDark ? "rgba(0, 122, 51, 0.15)" : "#E6F4F0" }]}>
              <Gift size={42} color="#007A33" />
            </View>
            <Text style={[styles.lockedTitle, { color: theme.text }]}>Refer & Earn is Locked 🔒</Text>
            <Text style={[styles.lockedDesc, { color: isDark ? theme.subText : "#64748B" }]}>
              Place your first order with DryDash to unlock your unique referral code and earn ₹{referrerBonus} for every friend you invite!
            </Text>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push("/(customer)/book-pickup")}
              style={styles.bookFirstOrderBtn}
            >
              <Text style={styles.bookFirstOrderBtnText}>Book Your First Order</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 24, 32) }}
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
          {/* HERO TOP CONTAINER WITH DARK GREEN GRADIENT */}
          <LinearGradient
            colors={["#014421", "#006B33", "#008742"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[styles.heroSection, { paddingTop: headerTopPadding + 10 }]}
          >
            {/* HERO NAVIGATION ROW */}
            <View style={styles.heroNavRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.heroNavBtn}
              >
                <ArrowLeft size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openHistoryModal}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.heroNavBtn}
              >
                <FileText size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* HERO TEXT HEADINGS */}
            <View style={styles.heroContent}>
              <Text style={styles.heroSubHeading}>Invite your friends to get rewards</Text>
              <Text style={styles.heroMainTitle}>Refer & Earn</Text>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleShareWhatsApp}
                style={styles.heroInvitePill}
              >
                <Text style={styles.heroInvitePillText}>Invite friend</Text>
              </TouchableOpacity>
            </View>

            {/* DUAL PHONES 3D GRAPHIC ILLUSTRATION */}
            <View style={styles.graphicContainer}>
              <View style={styles.phoneGraphicWrapper}>
                {/* Left Phone */}
                <View style={[styles.phoneFrame, styles.phoneFrameLeft]}>
                  <View style={styles.phoneScreen}>
                    <Text style={styles.phoneBrandText}>drydash</Text>
                    <View style={styles.phoneLogoBar} />
                  </View>
                </View>
                {/* Right Phone */}
                <View style={[styles.phoneFrame, styles.phoneFrameRight]}>
                  <View style={styles.phoneScreen}>
                    <Text style={styles.phoneBrandText}>drydash</Text>
                    <View style={styles.phoneLogoBarGreen} />
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* MAIN CONTENT CONTAINER */}
          <View style={styles.bodyContainer}>
            {/* REWARD COMPARISON CARDS */}
            <View style={styles.rewardCardsRow}>
              {/* YOU GET CARD */}
              <View style={[styles.rewardCard, { backgroundColor: isDark ? theme.card : "#FFFFFF", borderColor: isDark ? theme.border : "#E2E8F0" }]}>
                <View style={styles.badgeOverlay}>
                  <Text style={styles.badgeOverlayText}>you get</Text>
                </View>
                <Text style={styles.rewardAmountText}>₹{referrerBonus}</Text>
                <Text style={[styles.rewardLabelText, { color: isDark ? theme.subText : "#64748B" }]}>
                  on successful referrals
                </Text>
              </View>

              {/* THEY GET CARD */}
              <View style={[styles.rewardCard, { backgroundColor: isDark ? theme.card : "#FFFFFF", borderColor: isDark ? theme.border : "#E2E8F0" }]}>
                <View style={styles.badgeOverlay}>
                  <Text style={styles.badgeOverlayText}>they get</Text>
                </View>
                <Text style={styles.rewardAmountText}>₹{refereeBonus}</Text>
                <Text style={[styles.rewardLabelText, { color: isDark ? theme.subText : "#64748B" }]}>
                  after 1st booking
                </Text>
              </View>
            </View>

            {/* HOW IT WORKS BUTTON */}
            <View style={styles.howItWorksWrap}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setHowItWorksVisible(true)}
                style={styles.howItWorksPill}
              >
                <Text style={styles.howItWorksPillText}>How its works</Text>
                <Info size={15} color="#007A33" />
              </TouchableOpacity>
            </View>

            {/* REFERRAL CODE & SHARING BOX */}
            <View style={[styles.codeBox, { backgroundColor: isDark ? theme.card : "#F8FAFC", borderColor: isDark ? theme.border : "#E2E8F0" }]}>
              <Text style={[styles.codeBoxLabel, { color: isDark ? theme.subText : "#64748B" }]}>
                YOUR REFERRAL CODE
              </Text>

              <View style={styles.codeRow}>
                <View style={[styles.codeContainer, { backgroundColor: isDark ? theme.background : "#FFFFFF" }]}>
                  <Text style={styles.codeText}>{referralData?.referralCode || "---"}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleCopyCode}
                  style={styles.copyBtn}
                >
                  <Copy size={16} color="#FFFFFF" />
                  <Text style={styles.copyBtnText}>{copiedCode ? "Copied!" : "Copy"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* BOTTOM MAIN INVITE VIA WHATSAPP BUTTON */}
            <View style={styles.inviteBtnContainer}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleShareWhatsApp}
                style={styles.whatsappMainBtn}
              >
                <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
                <Text style={styles.whatsappMainBtnText}>Invite via WhatsApp</Text>
              </TouchableOpacity>

              <Text style={[styles.whatsappSubtext, { color: isDark ? theme.subText : "#64748B" }]}>
                Share your referral link with friends on WhatsApp
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* HOW IT WORKS MODAL */}
      <Modal
        visible={howItWorksVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHowItWorksVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setHowItWorksVisible(false)}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalCard, { backgroundColor: isDark ? theme.card : "#FFFFFF" }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>How Refer & Earn Works</Text>

            <View style={styles.stepItem}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>Invite Your Friends</Text>
                <Text style={[styles.stepDesc, { color: isDark ? theme.subText : "#64748B" }]}>
                  Share your referral link or code via WhatsApp or social media.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>2</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>Friend Signs Up & Books</Text>
                <Text style={[styles.stepDesc, { color: isDark ? theme.subText : "#64748B" }]}>
                  Your friend gets ₹{refereeBonus} discount on their 1st booking.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>3</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: theme.text }]}>You Earn Rewards!</Text>
                <Text style={[styles.stepDesc, { color: isDark ? theme.subText : "#64748B" }]}>
                  Once their 1st order is completed, ₹{referrerBonus} cash bonus is credited directly into your wallet!
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setHowItWorksVisible(false)}
              style={styles.closeModalBtn}
            >
              <Text style={styles.closeModalBtnText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* REFERRAL HISTORY MODAL */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={[styles.historyModalRoot, { backgroundColor: isDark ? theme.background : "#F8FAFC" }]}>
          <View style={[styles.historyHeader, { paddingTop: headerTopPadding }]}>
            <TouchableOpacity onPress={() => setHistoryModalVisible(false)} style={styles.iconBtn}>
              <ArrowLeft size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.historyTitle, { color: theme.text }]}>Referral History</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={{ flex: 1, padding: 20 }}>
            {referralHistory && referralHistory.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {referralHistory.map((item, idx) => {
                  const isRewarded = item.status === "rewarded" || item.status === "completed";
                  return (
                    <View
                      key={item.id || idx}
                      style={[styles.historyCard, { backgroundColor: isDark ? theme.card : "#FFFFFF", borderColor: isDark ? theme.border : "#E2E8F0" }]}
                    >
                      <View style={styles.historyCardRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.historyName, { color: theme.text }]}>
                            {item.refereeName || "Referred Friend"}
                          </Text>
                          <Text style={[styles.historyDate, { color: isDark ? theme.subText : "#64748B" }]}>
                            Joined on {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "Recent"}
                          </Text>
                        </View>
                        <Text style={[styles.historyRewardAmount, { color: isRewarded ? "#007A33" : "#F59E0B" }]}>
                          {isRewarded ? `+ ₹${item.referrerBonusAmount || 300}` : "Pending"}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyWrap}>
                <Users size={48} color={isDark ? theme.subText : "#94A3B8"} />
                <Text style={[styles.emptyHistoryText, { color: isDark ? theme.subText : "#64748B" }]}>
                  No referrals yet. Start inviting friends to earn cash!
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
    },
    lockedHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    lockedHeaderTitle: {
      fontSize: 18,
      fontWeight: "800",
    },
    lockedContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    lockedCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    lockedTitle: {
      fontSize: 22,
      fontWeight: "900",
      marginBottom: 10,
      textAlign: "center",
    },
    lockedDesc: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 28,
    },
    bookFirstOrderBtn: {
      backgroundColor: "#007A33",
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 14,
    },
    bookFirstOrderBtnText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 16,
    },
    heroSection: {
      paddingHorizontal: 20,
      paddingBottom: 30,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },
    heroNavRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    heroNavBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      justifyContent: "center",
      alignItems: "center",
    },
    heroContent: {
      alignItems: "center",
      marginTop: 8,
      marginBottom: 24,
    },
    heroSubHeading: {
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 6,
    },
    heroMainTitle: {
      color: "#FFFFFF",
      fontSize: 32,
      fontWeight: "900",
      marginBottom: 16,
    },
    heroInvitePill: {
      backgroundColor: "#FFFFFF",
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
    },
    heroInvitePillText: {
      color: "#005F2B",
      fontWeight: "800",
      fontSize: 14,
    },
    graphicContainer: {
      alignItems: "center",
      justifyContent: "center",
      height: 120,
    },
    phoneGraphicWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    phoneFrame: {
      width: 100,
      height: 140,
      borderRadius: 18,
      backgroundColor: "#1E293B",
      padding: 6,
      borderWidth: 2,
      borderColor: "#334155",
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    phoneFrameLeft: {
      transform: [{ rotate: "-10deg" }, { translateX: 14 }],
    },
    phoneFrameRight: {
      transform: [{ rotate: "10deg" }, { translateX: -14 }],
    },
    phoneScreen: {
      flex: 1,
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
    },
    phoneBrandText: {
      fontSize: 13,
      fontWeight: "900",
      color: "#007A33",
    },
    phoneLogoBar: {
      width: 32,
      height: 4,
      backgroundColor: "#007A33",
      borderRadius: 2,
      marginTop: 6,
    },
    phoneLogoBarGreen: {
      width: 24,
      height: 4,
      backgroundColor: "#10B981",
      borderRadius: 2,
      marginTop: 6,
    },
    bodyContainer: {
      paddingHorizontal: 20,
      paddingTop: 24,
    },
    rewardCardsRow: {
      flexDirection: "row",
      gap: 14,
      marginBottom: 20,
    },
    rewardCard: {
      flex: 1,
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 18,
      alignItems: "center",
      position: "relative",
    },
    badgeOverlay: {
      position: "absolute",
      top: -12,
      backgroundColor: "#007A33",
      paddingHorizontal: 14,
      paddingVertical: 3,
      borderRadius: 10,
    },
    badgeOverlayText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "800",
    },
    rewardAmountText: {
      fontSize: 32,
      fontWeight: "900",
      color: "#007A33",
      marginBottom: 4,
    },
    rewardLabelText: {
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },
    howItWorksWrap: {
      alignItems: "center",
      marginBottom: 24,
    },
    howItWorksPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: "#007A33",
    },
    howItWorksPillText: {
      color: "#007A33",
      fontWeight: "800",
      fontSize: 14,
    },
    codeBox: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 16,
      marginBottom: 28,
    },
    codeBoxLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    codeRow: {
      flexDirection: "row",
      gap: 10,
    },
    codeContainer: {
      flex: 1,
      height: 46,
      borderRadius: 12,
      justifyContent: "center",
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: "#007A33",
    },
    codeText: {
      fontSize: 16,
      fontWeight: "900",
      color: "#007A33",
      letterSpacing: 1.5,
    },
    copyBtn: {
      height: 46,
      paddingHorizontal: 20,
      backgroundColor: "#007A33",
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    copyBtnText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 14,
    },
    inviteBtnContainer: {
      alignItems: "center",
    },
    whatsappMainBtn: {
      width: "100%",
      height: 52,
      backgroundColor: "#007A33",
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      shadowColor: "#007A33",
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    whatsappMainBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },
    whatsappSubtext: {
      fontSize: 12,
      fontWeight: "500",
      marginTop: 10,
      textAlign: "center",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalCard: {
      width: "100%",
      borderRadius: 24,
      padding: 24,
      gap: 18,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 6,
    },
    stepItem: {
      flexDirection: "row",
      gap: 14,
      alignItems: "flex-start",
    },
    stepNum: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#007A33",
      justifyContent: "center",
      alignItems: "center",
    },
    stepNumText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 14,
    },
    stepTitle: {
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 2,
    },
    stepDesc: {
      fontSize: 13,
      lineHeight: 18,
    },
    closeModalBtn: {
      height: 46,
      backgroundColor: "#007A33",
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
    },
    closeModalBtnText: {
      color: "#FFFFFF",
      fontWeight: "800",
      fontSize: 15,
    },
    historyModalRoot: {
      flex: 1,
    },
    historyHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    historyTitle: {
      fontSize: 18,
      fontWeight: "800",
    },
    historyCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
      marginBottom: 12,
    },
    historyCardRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    historyName: {
      fontSize: 15,
      fontWeight: "800",
    },
    historyDate: {
      fontSize: 12,
      marginTop: 4,
    },
    historyRewardAmount: {
      fontSize: 16,
      fontWeight: "900",
    },
    emptyWrap: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 60,
    },
    emptyHistoryText: {
      fontSize: 14,
      textAlign: "center",
      marginTop: 16,
      maxWidth: 240,
    },
    iconBtn: {
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "center",
    },
  });
