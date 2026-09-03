 
import { Tokens } from "@/features/auth/auth.types";
import { useAuth } from "@/hooks/useAuth";
import { useSmsUserConsent } from "@eabdullazyanov/react-native-sms-user-consent";
import { Ionicons } from "@expo/vector-icons";
import { showPhoneNumberHint } from "@shayrn/react-native-android-phone-number-hint";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Clipboard,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  sendOtpApi,
  updateUserApi,
  verifyOtpApi,
} from "../../features/auth/auth.api";
import { showAlert } from "@/components/Customalert";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/useTheme";
import DrydashLogo48 from "@/assets/images/Drydash_logo_48x48.svg";
import { registerCustomerPushToken } from "@/lib/notifications/fcm";
import { referralApi } from "@/features/auth/referral.api";
type Step = "MOBILE" | "OTP" | "REGISTER" | "SUCCESS";
 
let OtpVerify: any = null;
 
if (Platform.OS === "android") {
  OtpVerify = require("react-native-otp-verify").default;
}
export default function AuthScreen() {
  const { theme, colors, isDark } = useTheme()
  const styles = makeStyles(theme, isDark);
 
  const activeColors = {
    bg: colors.background,
    card: colors.card,
    border: colors.border,
    primary: colors.primary,
    text: colors.text,
    subText: colors.subText,
    inputBackground: isDark ? theme.background : "#E6F4F0",
    inputBorder: isDark ? theme.card : "#C0DFD6",
    title: isDark ? "#F0FDF4" : theme.primary,
    dotInactive: isDark ? theme.card : "#D0E7E1",
    dotInactiveBorder: isDark ? theme.border : "#B2DAD0",
    buttonText: isDark ? theme.background : theme.background,
  };
 
  const [step, setStep] = useState<Step>("MOBILE");
 
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
 
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [hash, setHash] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);
 
  const [loading, setLoading] = useState(false);
  //  const [error, setError] = useState<string | null>(null);
 
  const [resendTimer, setResendTimer] = useState(0);
 
  const [tempToken, setTempToken] = useState<Tokens | null>(null);
  const phoneInputRef = useRef<TextInput>(null);
 
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  //  const errorShake = useRef(new Animated.Value(0)).current;
  const userIsTyping = useRef(false);

  const validatePhone = (v: string) => /^[6-9]\d{9}$/.test(v);
  const retrievedCode = useSmsUserConsent();

  const params = useLocalSearchParams<{ ref?: string; referralCode?: string }>();
  const processedRefParam = useRef<string | null>(null);

  // Read referral code from URL/scheme params or Clipboard for deferred referral auto-fill
  useEffect(() => {
    const processCode = (rawCode: string) => {
      const cleanCode = rawCode.toString().toUpperCase().trim();
      if (cleanCode && processedRefParam.current !== cleanCode) {
        processedRefParam.current = cleanCode;
        setReferralCode(cleanCode);
        validateReferralCode(cleanCode);
      }
    };

    const checkClipboardForReferral = async () => {
      if (processedRefParam.current) return;
      try {
        const text = await Clipboard.getString();
        if (text) {
          const clean = text.trim().toUpperCase();
          if (
            /^REF[A-Z0-9]{4,10}$/.test(clean) ||
            (clean.length >= 6 && clean.length <= 12 && /^[A-Z0-9]+$/.test(clean))
          ) {
            processCode(clean);
          }
        }
      } catch (e) {
        console.log("Error reading clipboard for referral:", e);
      }
    };

    const incomingCode = params.ref || params.referralCode;
    if (incomingCode) {
      processCode(incomingCode);
    }

    // Direct listener for deep link events while Auth screen is open
    const handleUrl = (url: string) => {
      let extracted: string | null = null;
      const match = url.match(/[?&](ref|referralCode|code)=([^&]+)/i);
      if (match && match[2]) {
        extracted = decodeURIComponent(match[2]);
      } else if (url.includes('/share/')) {
        const parts = url.split('/share/');
        if (parts[1]) extracted = parts[1].split('?')[0].split('/')[0];
      } else if (url.includes('/r/')) {
        const parts = url.split('/r/');
        if (parts[1]) extracted = parts[1].split('?')[0].split('/')[0];
      } else if (url.includes('/referral/')) {
        const parts = url.split('/referral/');
        if (parts[1]) extracted = parts[1].split('?')[0].split('/')[0];
      }

      if (extracted) {
        processCode(extracted);
      }
    };

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      } else {
        checkClipboardForReferral();
      }
    });

    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [params.ref, params.referralCode]);

  useEffect(() => {
    if (step === "REGISTER" && !referralCode && !processedRefParam.current) {
      Clipboard.getString().then((text) => {
        if (text) {
          const clean = text.trim().toUpperCase();
          if (
            /^REF[A-Z0-9]{4,10}$/.test(clean) ||
            (clean.length >= 6 && clean.length <= 12 && /^[A-Z0-9]+$/.test(clean))
          ) {
            processedRefParam.current = clean;
            setReferralCode(clean);
            validateReferralCode(clean);
          }
        }
      }).catch(() => {});
    }
  }, [step]);

  const validateReferralCode = async (code: string) => {
    try {
      const result = await referralApi.validateReferralCode(code);
      if (result.success) {
        showAlert({ type: 'success', title: 'Referral Applied!', message: `You'll get ₹${result.data?.refereeBonusAmount} bonus on first order!` });
      } else {
        showAlert({ type: 'warning', title: 'Invalid Code', message: result.message || 'Referral code is invalid or expired.' });
        setReferralCode("");
      }
    } catch (e) {
      console.error("Referral validation error:", e);
    }
  };

  // Animate on step change
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    scaleAnim.setValue(0.95);
 
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);
 
  useEffect(() => {
    setHGasing().then((hashes) => {
      handleGetPhoneNumbers(hashes); // pass fresh hash
    });
  }, []);
 
  const setHGasing = async () => {
    if (Platform.OS !== "android") return [];
 
    try {
      const hashes = await OtpVerify.getHash();
      setHash(hashes);
      return hashes; // ✅ return so caller can use immediately
    } catch {
      return [];
    }
  };
 
  const handleGetPhoneNumbers = async (freshHashes?: string[]) => {
    if (Platform.OS === "ios") return; // not suport
 
    try {
      const number = await showPhoneNumberHint({ showGuidanceDialog: true });
 
      if (!number) return; // user cancelled
 
      const digits = number.replace(/\D/g, "");
 
      let cleanNumber = "";
      if (digits.length === 12 && digits.startsWith("91")) {
        cleanNumber = digits.slice(2);
      } else if (digits.length === 11 && digits.startsWith("0")) {
        cleanNumber = digits.slice(1);
      } else if (digits.length === 10) {
        cleanNumber = digits;
      } else {
        cleanNumber = digits.slice(-10);
      }
 
      if (cleanNumber.length === 10) {
        if (!userIsTyping.current) {
          // Auto-fill only if user hasn't started typing
          setPhone(cleanNumber);
          phoneInputRef.current?.blur();
          if (validatePhone(cleanNumber)) {
            sendOtp(cleanNumber, freshHashes?.[0]);
          }
        }
        // If userIsTyping, do NOTHING — let them type
      } else {
        showAlert({ type: 'warning', title: 'Could not read number', message: `Got: "${number}". Please type manually.` });
      }
    } catch (error) {
      // silently fail, user can type manually
    }
  };
 
  // useEffect(() => {
  //   if (error) {
  //     Animated.sequence([
  //       Animated.timing(errorShake, {
  //         toValue: 10,
  //         duration: 50,
  //         useNativeDriver: true,
  //       }),
  //       Animated.timing(errorShake, {
  //         toValue: -10,
  //         duration: 50,
  //         useNativeDriver: true,
  //       }),
  //       Animated.timing(errorShake, {
  //         toValue: 10,
  //         duration: 50,
  //         useNativeDriver: true,
  //       }),
  //       Animated.timing(errorShake, {
  //         toValue: 0,
  //         duration: 50,
  //         useNativeDriver: true,
  //       }),
  //     ]).start();
  //   }
  // }, [error]);
 
  const sendOtp = async (phoneValue?: string, hashValue?: string) => {
    if (loading) return;

    console.log("this is the phoneee valueeeeeee===========>>>>>>>>>>>>>>>>>>>>>>>>>>",phoneValue, phone)
    const mobile = phoneValue || phone;
    console.log("this is the mobileeeee=====>>>>>",mobile)
    // Alert.alert("chcek pyone :::  ",mobile)
    // console.log('sendOtp called with mobile:', mobile);
    const hashToUse = hashValue || hash[0];
 
    if (!validatePhone(mobile)) {
      return showAlert({ type: 'warning', title: 'Invalid number', message: 'Enter a valid 10-digit mobile number' });
 
    }
 
    try {
      setLoading(true);
 
      console.log("sending OTP to ==>>>:", mobile, "with hash:", hashToUse);
      await sendOtpApi(mobile, hashToUse);
      setStep("OTP");
      setResendTimer(30);
    } catch (e: any) {
      const status = e?.response?.status || e?.status;
 
      if (status === 410) {
        showAlert({ type: 'error', title: 'Account scheduled for deletion', message: 'Contact support@drydash.in to restore access before 10 days.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (phoneValue?: string, hashValue?: string) => {
    if (loading) return;

    console.log("this is the phoneee valueeeeeee===========>>>>>>>>>>>>>>>>>>>>>>>>>>",phoneValue, phone)
    const mobile = phone;
    console.log("this is the mobileeeee=====>>>>>",mobile)
    // Alert.alert("chcek pyone :::  ",mobile)
    // console.log('sendOtp called with mobile:', mobile);
    const hashToUse = hashValue || hash[0];
 
    if (!validatePhone(mobile)) {
      return showAlert({ type: 'warning', title: 'Invalid number', message: 'Enter a valid 10-digit mobile number' });
 
    }
 
    try {
      setLoading(true);
 
      console.log("sending OTP to ==>>>:", mobile, "with hash:", hashToUse);
      await sendOtpApi(mobile, hashToUse);
      setStep("OTP");
      setResendTimer(30);
    } catch (e: any) {
      const status = e?.response?.status || e?.status;
 
      if (status === 410) {
        showAlert({ type: 'error', title: 'Account scheduled for deletion', message: 'Contact support@drydash.in to restore access before 10 days.' });
      }
    } finally {
      setLoading(false);
    }
  };
 
  // Auto-fill OTP when SMS is intercepted via SMS User Consent API
  useEffect(() => {
    if (retrievedCode && retrievedCode.length === 6) {
      setOtp(retrievedCode);
    }
  }, [retrievedCode]);

  // Listen for incoming OTP SMS on Android via react-native-otp-verify (SMS Retriever API)
  useEffect(() => {
    if (Platform.OS === "android" && OtpVerify && step === "OTP") {
      try {
        OtpVerify.getOtp()
          .then(() => {
            OtpVerify.addListener((message: string) => {
              try {
                if (message && message !== "Timeout") {
                  const matched = message.match(/\b\d{6}\b/);
                  if (matched && matched[0]) {
                    setOtp(matched[0]);
                  }
                }
              } catch (e) {
                console.log("OtpVerify listener error:", e);
              }
            });
          })
          .catch((err: any) => console.log("OtpVerify getOtp error:", err));
      } catch (e) {
        console.log("OtpVerify init error:", e);
      }

      return () => {
        try {
          OtpVerify.removeListener();
        } catch (e) {}
      };
    }
  }, [step]);
 
  const { saveTokens, setAuthUser, initializeWallet } = useAuth();
 
  const verifyOtp = async (otpValue?: string) => {
    const otpToVerify = otpValue || otp;
    if (otpToVerify.length !== 6) return showAlert({ type: 'warning', title: 'Invalid OTP', message: 'Please enter the 6-digit OTP sent to your number.' });
 
    try {
      setLoading(true);
      //  setError(null);
 
      const res = await verifyOtpApi(phone, otpToVerify);
 
      if (res?.deleted) {
        showAlert({ type: 'error', title: 'Account deleted', message: 'Please contact support to recover your account.' });
 
        //  setStep("REGISTER"); // go to register
        return;
      }
 
      if (!res.isNewUser) {
        await saveTokens(res.tokens);
      }
 
      console.log("this is first token==>>>", res.tokens);
 
      setTempToken(res.tokens);
 
      console.log("this is check==>>", res.isNewUser);
 
      if (!res.isNewUser) {
        await setAuthUser(res.user);
        const customerId = res.user?.user?.id ?? res.user?.id ?? res.user?._id;

        await registerCustomerPushToken(customerId?.toString());

        // Initialize wallet & referral
        await initializeWallet(undefined, customerId?.toString());

        router.replace("/(customer)/(tabs)/home");
      } else {
        setStep("REGISTER");
      }
    } catch (e: any) {
      if (e.message?.toLowerCase().includes("otp")) {
        showAlert({ type: 'error', title: 'Wrong OTP', primaryLabel: 'Try again', onPrimary: () => setOtp('') });
 
      } else {
        showAlert({ type: 'error', title: 'OTP verification failed', message: 'Something went wrong. Please try again.' });
 
      }
    } finally {
      setLoading(false);
    }
  };
 
  // Auto-verify OTP when it reaches 6 digits (for manual entry)
  useEffect(() => {
    if (otp.length === 6 && step === "OTP") {
      const timer = setTimeout(() => {
        verifyOtp(otp);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [otp]);
 
  const createAccount = async () => {
    if (!firstName.trim()) return showAlert({ type: 'warning', title: 'First name is required' });
 
    try {
      setLoading(true);
      //   setError(null);
 
      let details_obj: any = { firstName };
 
      if (email) {
        details_obj.email = email;
      }
 
      if (lastName) {
        details_obj.lastName = lastName;
      }
 
      console.log("this is detailsssss", details_obj);
 
      if (!tempToken) {
        console.log("there is an error");
        //  setError("Token missing!");
 
        showAlert({ type: 'error', title: 'Session expired', message: 'Please go back and verify your number again.' });
 
        return;
      }
 
      console.log("this is the tempToken", tempToken);
 
      await saveTokens(tempToken);
 
      const updatedUser = await updateUserApi(details_obj);
 
      await setAuthUser(updatedUser);
 
      const customerId = updatedUser?.user?.id ?? updatedUser?.id ?? updatedUser?._id;
      const refCodeToApply = referralCode ? referralCode.trim().toUpperCase() : undefined;
      console.log("👉 Submitting Account Signup - Customer ID:", customerId, "Referral Code:", refCodeToApply);

      // Register push token & request notification + location permissions on signup (non-blocking)
      registerCustomerPushToken(customerId?.toString()).catch((err) =>
        console.log("Push token error on signup:", err)
      );

      // Initialize wallet & referral for new user with explicit customerId (non-blocking)
      try {
        await initializeWallet(refCodeToApply, customerId?.toString());
      } catch (wErr) {
        console.error("Wallet init error on signup:", wErr);
      }
      
      // Collect primary delivery address right after signup
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      router.replace({
        pathname: "/(customer)/(edit)/edit-address",
        params: {
          fromSignup: "true",
          contactName: fullName,
          contactPhone: phone,
        },
      });
    } catch (e: any) {
      //  setError(e.message);
      showAlert({ type: 'error', title: 'Could not create account', message: e.message });
 
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    if (step === "SUCCESS") {
      const t = setTimeout(() => {
        router.replace("/(customer)/(tabs)/home");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [step]);
 
  useEffect(() => {
    if (!resendTimer) return;
    const t = setInterval(() => {
      setResendTimer((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [resendTimer]);
 
  return (
    <SafeAreaView style={[styles.outer, { backgroundColor: activeColors.bg }]}>
      {/* Gradient overlay */}
      {isDark && <View style={styles.gradientOverlay} />}
 
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* LOGO with animation */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              marginTop: 8,
            }}
          >
            <DrydashLogo48
              width={96}
              height={96}
            />
          </Animated.View>
 
          {/* CARD with animation */}
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: activeColors.card,
                borderColor: activeColors.border,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressDot,
                  { backgroundColor: activeColors.dotInactive, borderColor: activeColors.dotInactiveBorder },
                  step !== "MOBILE" && [styles.progressDotActive, { backgroundColor: activeColors.primary, borderColor: activeColors.primary }],
                ]}
              />
              <View
                style={[
                  styles.progressLine,
                  { backgroundColor: activeColors.dotInactive },
                  step === "REGISTER" || step === "SUCCESS"
                    ? [styles.progressLineActive, { backgroundColor: activeColors.primary }]
                    : {},
                ]}
              />
              <View
                style={[
                  styles.progressDot,
                  { backgroundColor: activeColors.dotInactive, borderColor: activeColors.dotInactiveBorder },
                  (step === "REGISTER" || step === "SUCCESS") &&
                  [styles.progressDotActive, { backgroundColor: activeColors.primary, borderColor: activeColors.primary }],
                ]}
              />
            </View>
 
            <Text style={[styles.title, { color: activeColors.title }]}>
              {step === "MOBILE" && "Welcome Back"}
              {step === "OTP" && "Verify OTP"}
              {step === "REGISTER" && "Create Your Profile"}
              {step === "SUCCESS" && "All Set! 🎉"}
            </Text>
 
            <Text style={[styles.subtitle, { color: activeColors.subText }]}>
              {step === "MOBILE" && "Use your Mobile number to continue."}
              {step === "OTP" && `OTP sent to Mobile • +91 ${phone}`}
              {step === "REGISTER" && "Just a few details to finish setup."}
              {step === "SUCCESS" && "Your account is ready!"}
            </Text>
 
            {/* FORM */}
            {step === "MOBILE" && (
              <>
                <View style={styles.phoneRow}>
                  <View style={[styles.countryCodeBox, { backgroundColor: activeColors.inputBackground, borderColor: activeColors.inputBorder }]}>
                    <Text style={[styles.countryCode, { color: activeColors.text }]}>+91</Text>
                  </View>
                  <View style={[styles.phoneInputWrapper, { backgroundColor: activeColors.inputBackground, borderColor: activeColors.inputBorder }]}>
                    <TextInput
                      ref={phoneInputRef}
                      style={[styles.phoneInput, { color: activeColors.text }]}
                      placeholder="Mobile number"
                      placeholderTextColor={colors.placeholderText}
                      value={phone}
                      onChangeText={(text) => {
                        userIsTyping.current = true;
                        const digits = text.replace(/\D/g, "").slice(0, 10);
                        setPhone(digits);
 
                        // auto sent otp
                        if (
                          digits.length === 10 &&
                          validatePhone(digits) &&
                          !loading
                        ) {
                          sendOtp(digits);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={10}
                      textContentType="telephoneNumber"
                      autoFocus={true}
                    />
                  </View>
                </View>
 
                {Platform.OS === "android" && (
                  <TouchableOpacity
                    style={styles.hintButton}
                    onPress={handleGetPhoneNumbers}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
                      size={16}
                      color={activeColors.primary}
                    />
                    <Text style={[styles.hintButtonText, { color: activeColors.primary }]}>Use saved number</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
 
            {step === "OTP" && (
              <>
                <Input
                  icon="keypad-outline"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={(text) => {
                    const digits = text.replace(/\D/g, "").slice(0, 6); // force digits only
                    setOtp(digits);
                    //  setError(null);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  editable={!loading} // ← make sure loading state isn't blocking input
                  selectTextOnFocus
                  autoFocus={true}
                />
 
                {/* Auto-read indicator */}
                <View style={styles.autoReadIndicator}>
                  <Ionicons name="shield-checkmark" size={14} color={activeColors.primary} />
                  <Text style={[styles.autoReadText, { color: activeColors.primary }]}>
                    {Platform.OS === "ios"
                      ? "OTP will be auto-suggested from Messages"
                      : "OTP will be auto-filled from SMS"}
                  </Text>
                </View>
 
                <View style={styles.otpActions}>
                  <TouchableOpacity
                    onPress={() => setStep("MOBILE")}
                    style={styles.linkButton}
                  >
                    <Ionicons name="chevron-back" size={16} color={activeColors.primary} />
                    <Text style={[styles.linkText, { color: activeColors.primary }]}>Change number</Text>
                  </TouchableOpacity>
 
                  <TouchableOpacity
                    disabled={resendTimer > 0}
                    onPress={resendOtp}
                    style={styles.linkButton}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={16}
                      color={resendTimer > 0 ? colors.placeholderText : activeColors.primary}
                    />
                    <Text
                      style={[
                        styles.linkText,
                        { color: resendTimer > 0 ? colors.placeholderText : activeColors.primary },
                      ]}
                    >
                      {resendTimer ? `${resendTimer}s` : "Resend"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
 
            {step === "REGISTER" && (
              <>
                <Input
                  icon="person-outline"
                  placeholder="First name *"
                  value={firstName}
                  onChangeText={setFirstName}
                  textContentType="givenName"
                  autoComplete="name-given"
                />
 
                <Input
                  icon="person-outline"
                  placeholder="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  textContentType="familyName"
                  autoComplete="name-family"
                />
 
                <Input
                  icon="mail-outline"
                  placeholder="Email (optional)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                />

                <Input
                  icon="gift-outline"
                  placeholder="Referral Code (optional)"
                  value={referralCode}
                  onChangeText={(text: string) => setReferralCode(text.toUpperCase())}
                  autoCapitalize="characters"
                />
              </>
            )}
 
            {step === "SUCCESS" && (
              <View style={styles.successBox}>
                <View style={styles.successIconWrapper}>
                  <Ionicons name="checkmark-circle" size={80} color={activeColors.primary} />
                </View>
                <Text style={[styles.successText, { color: activeColors.title }]}>Account Created!</Text>
                <Text style={[styles.successSubtext, { color: activeColors.subText }]}>
                  Redirecting you to home...
                </Text>
              </View>
            )}
 
            {step !== "SUCCESS" && (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: activeColors.primary, shadowColor: activeColors.primary },
                  loading && styles.buttonLoading
                ]}
                disabled={loading}
                onPress={
                  step === "MOBILE"
                    ? () => sendOtp()
                    : step === "OTP"
                      ? () => verifyOtp()
                      : createAccount
                }
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={[styles.buttonText, { color: activeColors.buttonText }]}>Processing</Text>
                    <View style={styles.loadingDots}>
                      <View style={[styles.dot, styles.dot1, { backgroundColor: activeColors.buttonText }]} />
                      <View style={[styles.dot, styles.dot2, { backgroundColor: activeColors.buttonText }]} />
                      <View style={[styles.dot, styles.dot3, { backgroundColor: activeColors.buttonText }]} />
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.buttonText, { color: activeColors.buttonText }]}>
                      {step === "MOBILE"
                        ? "Continue"
                        : step === "OTP"
                          ? "Verify & Continue"
                          : "Create Account"}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={activeColors.buttonText}
                      style={{ marginLeft: 8 }}
                    />
                  </>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>
 
          {step !== "SUCCESS" && (
            <Text style={[styles.legalText, { color: activeColors.text }]}>
              By continuing, you agree to our {"\n"}
              <Text
                style={[styles.legalLink, { color: activeColors.primary }]}
                onPress={() => router.push("/terms")}
              >
                Terms & Conditions
              </Text>
              {" & "}
              <Text
                style={[styles.legalLink, { color: activeColors.primary, marginTop: 4 }]}
                onPress={() => router.push("/privacy-policy")}
              >
                Privacy Policy
              </Text>
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
 
/* ---------------- INPUT COMPONENT ---------------- */
 
function Input({ icon, style, onFocus: onFocusProp, onBlur: onBlurProp, ...props }: any) {
  const [isFocused, setIsFocused] = useState(false);
  const { colors, isDark, theme } = useTheme();        // ✅ added 'theme'
  const styles = makeStyles(theme, isDark);            // ✅ generate styles locally
 
  return (
    <View
      style={[
        styles.inputWrapper,
        {
          backgroundColor: isDark ? theme.background : "#E6F4F0",
          borderColor: isFocused ? colors.primary : (isDark ? theme.card : "#C0DFD6")
        },
        style
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isFocused ? colors.primary : colors.placeholderText}
        style={{ marginRight: 12 }}
      />
      <TextInput
        {...props}
        placeholderTextColor={colors.placeholderText}
        style={[styles.input, { color: colors.text }]}
        onFocus={() => {
          setIsFocused(true);
          onFocusProp?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlurProp?.();
        }}
      />
    </View>
  );
}
 
/* ---------------- STYLES ---------------- */
 
const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: theme.background,
  },
 
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: theme.card,
  },
 
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
 
  logoDD: {
    width: 140,
    height: 70,
    alignSelf: "center",
    marginTop: 0,
  },
 
  logo: {
    width: 160,
    height: 100,
    alignSelf: "center",
  },
 
  card: {
    backgroundColor: theme.background,
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    shadowColor: theme.background,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.card,
  },
 
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
 
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: theme.border,
  },
 
  progressDotActive: {
    backgroundColor: theme.border,
    borderColor: theme.border,
  },
 
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: theme.card,
    marginHorizontal: 8,
  },
 
  progressLineActive: {
    backgroundColor: theme.border,
  },
 
  title: {
    color: "#F0FDF4",
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
 
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
 
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: theme.card,
  },
 
  inputWrapperFocused: {
    borderColor: theme.border,
    backgroundColor: theme.background,
  },
 
  input: {
    flex: 1,
    color: "#F0FDF4",
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "500",
  },
 
  autoFillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginBottom: 12,
  },
 
  autoFillText: {
    color: theme.border,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
 
  autoReadIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginBottom: 8,
  },
 
  autoReadText: {
    color: theme.border,
    fontSize: 12,
    marginLeft: 6,
  },
 
  autoFillBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.card,
  },
 
  autoFillBannerText: {
    color: theme.border,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
  },
 
  otpActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 4,
  },
 
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
 
  linkText: {
    color: theme.border,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
 
  avatarBox: {
    alignItems: "center",
    marginBottom: 24,
  },
 
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.card,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.background,
    marginBottom: 12,
  },
 
  avatarCircleActive: {
    borderColor: theme.border,
    borderStyle: "solid",
    backgroundColor: theme.background,
  },
 
  avatarText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
 
  // errorContainer: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   justifyContent: "center",
  //   backgroundColor: theme.card,
  //   borderRadius: 12,
  //   paddingVertical: 12,
  //   paddingHorizontal: 16,
  //   marginBottom: 12,
  //   borderWidth: 1,
  //   borderColor: theme.card,
  // },
 
  // error: {
  //   color: "#FF6B6B",
  //   fontSize: 14,
  //   fontWeight: "600",
  //   flex: 1,
  // },
 
  button: {
    backgroundColor: theme.border,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    flexDirection: "row",
    shadowColor: theme.border,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
 
  buttonLoading: {
    opacity: 0.7,
  },
 
  buttonText: {
    fontWeight: "800",
    fontSize: 17,
    color: theme.background,
    letterSpacing: 0.5,
  },
 
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
 
  loadingDots: {
    flexDirection: "row",
    marginLeft: 8,
  },
 
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.background,
    marginHorizontal: 2,
  },
 
  dot1: {
    opacity: 0.4,
  },
 
  dot2: {
    opacity: 0.6,
  },
 
  dot3: {
    opacity: 0.8,
  },
 
  successBox: {
    alignItems: "center",
    paddingVertical: 20,
  },
 
  successIconWrapper: {
    marginBottom: 16,
  },
 
  successText: {
    color: "#F0FDF4",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
 
  successSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  phoneRow: {
    flexDirection: "row",
    marginBottom: 14,
  },
  countryCodeBox: {
    backgroundColor: theme.background,
    borderWidth: 2,
    borderColor: theme.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    justifyContent: "center",
    marginRight: 8,
  },
  countryCode: {
    color: "#F0FDF4",
    fontSize: 16,
    fontWeight: "600",
  },
  phoneInputWrapper: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 2,
    borderColor: theme.card,
    borderRadius: 16,
  },
  phoneInput: {
    color: "#F0FDF4",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "500",
  },
  hintButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginBottom: 8,
  },
  hintButtonText: {
    color: theme.border,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
 
  legalText: {
    color: theme.text,
    fontSize: 14,
    textAlign: "center",
    marginTop: 28,
    lineHeight: 22,
  },
  legalLink: {
    color: theme.border,
    fontWeight: "600",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});
 