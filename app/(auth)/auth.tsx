import {
  sendOtpApi,
  updateUserApi,
  verifyOtpApi,
} from "@/features/auth/auth.api";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Step = "MOBILE" | "OTP" | "REGISTER" | "SUCCESS";

export default function AuthScreen() {
  const [step, setStep] = useState<Step>("MOBILE");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resendTimer, setResendTimer] = useState(0);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  const validatePhone = (v: string) => /^[6-9]\d{9}$/.test(v);

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
      await sendOtpApi(phone);
      setStep("OTP");
      setResendTimer(30);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const { saveTokens, setAuthUser } = useAuth();

  const verifyOtp = async () => {
    if (otp.length !== 6) return setError("Enter valid 6-digit OTP");

    try {
      setLoading(true);
      setError(null);

      const res = await verifyOtpApi(phone, otp);

      await saveTokens(res.tokens);

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

  const createAccount = async () => {
    if (!firstName.trim()) return setError("First name is required");

    if (!lastName.trim()) return setError("Last name is required");

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
    <View style={styles.outer}>
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
              {step === "MOBILE" && "Login or create a new account"}
              {step === "OTP" && `Code sent to +91 ${phone}`}
              {step === "REGISTER" && "Just a few more details"}
              {step === "SUCCESS" && "Your account is ready"}
            </Text>

            {/* FORM */}
            {step === "MOBILE" && (
              <Input
                icon="call-outline"
                placeholder="Mobile number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="number-pad"
                maxLength={10}
              />
            )}

            {step === "OTP" && (
              <>
                <Input
                  icon="keypad-outline"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />

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
                />

                <Input
                  icon="person-outline"
                  placeholder="Last name *"
                  value={lastName}
                  onChangeText={setLastName}
                />

                <Input
                  icon="mail-outline"
                  placeholder="Email (optional)"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
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
                      ? verifyOtp
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
    </View>
  );
}

/* ---------------- INPUT COMPONENT ---------------- */

function Input(props: any) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}
    >
      <Ionicons
        name={props.icon}
        size={20}
        color={isFocused ? "#34D399" : "#6B7280"}
        style={{ marginRight: 12 }}
      />
      <TextInput
        {...props}
        placeholderTextColor="#6B7280"
        style={styles.input}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
});
