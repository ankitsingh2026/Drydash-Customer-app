import {
  sendOtpApi,
  updateUserApi,
  verifyOtpApi,
} from "@/features/auth/auth.api";
import { Tokens } from "@/features/auth/auth.types";
import { useAuth } from "@/hooks/useAuth";
import { useSmsUserConsent } from '@eabdullazyanov/react-native-sms-user-consent';
import { Ionicons } from "@expo/vector-icons";
import { showPhoneNumberHint } from "@shayrn/react-native-android-phone-number-hint";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import OtpVerify from 'react-native-otp-verify';
import { SafeAreaView } from "react-native-safe-area-context";
type Step = "MOBILE" | "OTP" | "REGISTER" | "SUCCESS";

export default function AuthScreen() {
  const [step, setStep] = useState<Step>("MOBILE");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [hash, setHash] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resendTimer, setResendTimer] = useState(0);

  const [tempToken, setTempToken] = useState<Tokens | null>(null);
  const phoneInputRef = useRef<TextInput>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  const validatePhone = (v: string) => /^[6-9]\d{9}$/.test(v);
  const retrievedCode = useSmsUserConsent();

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
    setHGasing()
    handleGetPhoneNumbers()
  }, [])

  const setHGasing = async () => {
    const hashes = await OtpVerify.getHash();
    // Alert.alert('Release Hash', hashes.join('\n')); // Added temporarily
    setHash(hashes);
  }

  //auto number detection
  const handleGetPhoneNumbers = async () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Manual Entry Required',
        'iOS does not allow automatic phone number retrieval. Please enter your number manually.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: (text) => { } },
        ],
        {
          type: 'plain-text',
          textInput: {
            placeholder: 'Phone number',
            keyboardType: 'phone-pad',
          },
        }
      );
      return;
    }
    // const isEmulator = await DeviceInfo.isEmulator();
    // if (isEmulator) {
    //   console.log('Skipping phone hint on emulator');
    //   return; // User just types it manually
    // }
    try {
      const number = await showPhoneNumberHint({
        showGuidanceDialog: true,
      });

      if (number) {
        // Strip everything except digits
        const digits = number.replace(/\D/g, '');

        let cleanNumber = '';

        if (digits.length === 12 && digits.startsWith('91')) {
          cleanNumber = digits.slice(2);
        } else if (digits.length === 11 && digits.startsWith('0')) {
          cleanNumber = digits.slice(1);
        } else if (digits.length === 10) {
          cleanNumber = digits;
        } else {
          // Fallback: just take the last 10 digits
          cleanNumber = digits.slice(-10);
        }

        if (cleanNumber.length === 10) {
          setPhone(cleanNumber);
          setTimeout(() => {
            phoneInputRef.current?.blur(); // dismiss keyboard briefly
          }, 100);
        } else {
          Alert.alert(
            'Could not read number',
            `Got: "${number}". Please type manually.`
          );
        }
      } else {
        // User cancelled the hint dialog – do nothing or show a message
        // console.log('Phone hint cancelled');
      }
    } catch (error) {
      Alert.alert('Phone Hint Error', String(error));
    }
  };
  // Shake animation for errors
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(errorShake, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(errorShake, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(errorShake, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(errorShake, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error]);

  const sendOtp = async () => {
    if (!validatePhone(phone))
      return setError("Enter valid 10-digit mobile number");

    try {
      setLoading(true);
      setError(null);
      await sendOtpApi(phone, hash[0]);   // just phone, not +91${phone}
      setStep("OTP");
      setResendTimer(30);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };



  // Auto-fill OTP when SMS is intercepted
  useEffect(() => {
    if (retrievedCode && retrievedCode.length === 6) {
      setOtp(retrievedCode);
    }
  }, [retrievedCode]);




  const { saveTokens, setAuthUser } = useAuth();

  const verifyOtp = async (otpValue?: string) => {
    const otpToVerify = otpValue || otp;
    if (otpToVerify.length !== 6) return setError("Enter valid 6-digit OTP");

    try {
      setLoading(true);
      setError(null);

      const res = await verifyOtpApi(phone, otpToVerify);   // no +91
      if (!res.isNewUser) {
        await saveTokens(res.tokens);
      }

      console.log("this is first token==>>>", res.tokens);

      setTempToken(res.tokens);

      console.log("this is check==>>", res.isNewUser);

      if (!res.isNewUser) {
        await setAuthUser(res.user);
        router.replace("/(customer)/(tabs)/home");
      } else {
        setStep("REGISTER");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify OTP when it reaches 6 digits (for manual entry)
  useEffect(() => {
    if (otp.length === 6 && step === "OTP") {
      const timer = setTimeout(() => {
        verifyOtp(otp); // ✅ you pass `otp` here, this is fine
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [otp]);

  const createAccount = async () => {
    if (!firstName.trim()) return setError("First name is required");

    try {
      setLoading(true);
      setError(null);

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
        setError("Token missing!");
        return;
      }

      console.log("this is the tempToken", tempToken);

      await saveTokens(tempToken);

      const updatedUser = await updateUserApi(details_obj);

      await setAuthUser(updatedUser);

      router.replace("/(customer)/(tabs)/home");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFirstName("");
      setLastName("");
      setEmail("");
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

  const pickImage = () => {
    setAvatar("picked");
  };

  return (
    <SafeAreaView style={styles.outer}>
      {/* Gradient overlay */}
      <View style={styles.gradientOverlay} />

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
            }}
          >
            <Image
              source={require("../../assets/images/logo/greenLogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* CARD with animation */}
          <Animated.View
            style={[
              styles.card,
              {
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
                  step !== "MOBILE" && styles.progressDotActive,
                ]}
              />
              <View
                style={[
                  styles.progressLine,
                  step === "REGISTER" || step === "SUCCESS"
                    ? styles.progressLineActive
                    : {},
                ]}
              />
              <View
                style={[
                  styles.progressDot,
                  (step === "REGISTER" || step === "SUCCESS") &&
                  styles.progressDotActive,
                ]}
              />
            </View>

            <Text style={styles.title}>
              {step === "MOBILE" && "Welcome Back"}
              {step === "OTP" && "Verify OTP"}
              {step === "REGISTER" && "Create Your Profile"}
              {step === "SUCCESS" && "All Set! 🎉"}
            </Text>

            <Text style={styles.subtitle}>
              {step === "MOBILE" && "Use your Mobile number to continue."}
              {step === "OTP" && `OTP sent to Mobile • +91 ${phone}`}
              {step === "REGISTER" && "Just a few details to finish setup."}
              {step === "SUCCESS" && "Your account is ready!"}
            </Text>


            {/* FORM */}
            {step === "MOBILE" && (
              <>
                <View style={styles.phoneRow}>
                  <View style={styles.countryCodeBox}>
                    <Text style={styles.countryCode}>+91</Text>
                  </View>
                  <View style={styles.phoneInputWrapper}>
                    <TextInput
                      ref={phoneInputRef}
                      style={styles.phoneInput}
                      placeholder="Mobile number"
                      placeholderTextColor="#6B7280"
                      value={phone}
                      onChangeText={(text) => {
                        // Allow only digits, max 10
                        const digits = text.replace(/\D/g, '').slice(0, 10);
                        setPhone(digits);
                      }}
                      keyboardType="number-pad"
                      maxLength={10}
                      textContentType="telephoneNumber"
                      autoFocus={true}
                    />
                  </View>
                </View>

                {Platform.OS === 'android' && (
                  <TouchableOpacity
                    style={styles.hintButton}
                    onPress={handleGetPhoneNumbers}
                  >
                    <Ionicons name="phone-portrait-outline" size={16} color="#34D399" />
                    <Text style={styles.hintButtonText}>Use saved number</Text>
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
                    const digits = text.replace(/\D/g, '').slice(0, 6); // force digits only
                    setOtp(digits);
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  editable={!loading} // ← make sure loading state isn't blocking input
                  selectTextOnFocus
                />

                {/* Auto-read indicator */}
                <View style={styles.autoReadIndicator}>
                  <Ionicons name="shield-checkmark" size={14} color="#34D399" />
                  <Text style={styles.autoReadText}>
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
                    <Ionicons name="chevron-back" size={16} color="#34D399" />
                    <Text style={styles.linkText}>Change number</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={resendTimer > 0}
                    onPress={sendOtp}
                    style={styles.linkButton}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={16}
                      color={resendTimer > 0 ? "#6B7280" : "#34D399"}
                    />
                    <Text
                      style={[
                        styles.linkText,
                        resendTimer > 0 && { color: "#6B7280" },
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
                <TouchableOpacity style={styles.avatarBox} onPress={pickImage}>
                  <View
                    style={[
                      styles.avatarCircle,
                      avatar && styles.avatarCircleActive,
                    ]}
                  >
                    <Ionicons
                      name={avatar ? "checkmark-circle" : "camera"}
                      size={32}
                      color={avatar ? "#34D399" : "#6B7280"}
                    />
                  </View>
                  <Text style={styles.avatarText}>
                    {avatar ? "Photo selected ✓" : "Add profile photo"}
                  </Text>
                </TouchableOpacity>

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
              </>
            )}

            {step === "SUCCESS" && (
              <View style={styles.successBox}>
                <View style={styles.successIconWrapper}>
                  <Ionicons name="checkmark-circle" size={80} color="#34D399" />
                </View>
                <Text style={styles.successText}>Account Created!</Text>
                <Text style={styles.successSubtext}>
                  Redirecting you to home...
                </Text>
              </View>
            )}

            {error && (
              <Animated.View
                style={[
                  styles.errorContainer,
                  { transform: [{ translateX: errorShake }] },
                ]}
              >
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color="#EF4444"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.error}>{error}</Text>
              </Animated.View>
            )}

            {step !== "SUCCESS" && (
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonLoading]}
                disabled={loading}
                onPress={
                  step === "MOBILE"
                    ? sendOtp
                    : step === "OTP"
                      ? () => verifyOtp()
                      : createAccount
                }
                activeOpacity={0.8}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.buttonText}>Processing</Text>
                    <View style={styles.loadingDots}>
                      <View style={[styles.dot, styles.dot1]} />
                      <View style={[styles.dot, styles.dot2]} />
                      <View style={[styles.dot, styles.dot3]} />
                    </View>
                  </View>
                ) : (
                  <>
                    <Text style={styles.buttonText}>
                      {step === "MOBILE"
                        ? "Send OTP"
                        : step === "OTP"
                          ? "Verify & Continue"
                          : "Create Account"}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color="#03241C"
                      style={{ marginLeft: 8 }}
                    />
                  </>
                )}
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------- INPUT COMPONENT ---------------- */

function Input({ icon, style, onFocus: onFocusProp, onBlur: onBlurProp, ...props }: any) {
  const [isFocused, setIsFocused] = useState(false);


  return (
    <View
      style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isFocused ? "#34D399" : "#6B7280"}
        style={{ marginRight: 12 }}
      />
      <TextInput
        {...props}
        placeholderTextColor="#6B7280"
        style={styles.input}
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

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: "#0A1612",
  },

  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    backgroundColor: "rgba(52, 211, 153, 0.05)",
  },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },

  logo: {
    width: 160,
    height: 100,
    alignSelf: "center",
    marginTop: 30,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#0F2620",
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.1)",
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
    backgroundColor: "#1F3D33",
    borderWidth: 2,
    borderColor: "#2D5045",
  },

  progressDotActive: {
    backgroundColor: "#34D399",
    borderColor: "#34D399",
  },

  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: "#1F3D33",
    marginHorizontal: 8,
  },

  progressLineActive: {
    backgroundColor: "#34D399",
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
    backgroundColor: "#0A1F19",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#1A3529",
  },

  inputWrapperFocused: {
    borderColor: "#34D399",
    backgroundColor: "#0D2620",
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
    color: "#34D399",
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
    color: "#34D399",
    fontSize: 12,
    marginLeft: 6,
  },

  autoFillBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },

  autoFillBannerText: {
    color: "#34D399",
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
    color: "#34D399",
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
    borderColor: "#1F3D33",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A1F19",
    marginBottom: 12,
  },

  avatarCircleActive: {
    borderColor: "#34D399",
    borderStyle: "solid",
    backgroundColor: "#0D2620",
  },

  avatarText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },

  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },

  error: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  button: {
    backgroundColor: "#34D399",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    flexDirection: "row",
    shadowColor: "#34D399",
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
    color: "#03241C",
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
    backgroundColor: "#03241C",
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
    flexDirection: 'row',
    marginBottom: 14,
  },
  countryCodeBox: {
    backgroundColor: '#0A1F19',
    borderWidth: 2,
    borderColor: '#1A3529',
    borderRadius: 16,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginRight: 8,
  },
  countryCode: {
    color: '#F0FDF4',
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInputWrapper: {
    flex: 1,
    backgroundColor: '#0A1F19',
    borderWidth: 2,
    borderColor: '#1A3529',
    borderRadius: 16,
  },
  phoneInput: {
    color: '#F0FDF4',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 8,
  },
  hintButtonText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});