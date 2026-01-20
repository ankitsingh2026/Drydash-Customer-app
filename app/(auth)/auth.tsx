import {
  sendOtpApi,
  updateUserApi,
  verifyOtpApi,
} from "@/features/auth/auth.api";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
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

  const validatePhone = (v: string) => /^[6-9]\d{9}$/.test(v);

  /* ---------------- DUMMY LOGIC ---------------- */

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

      const updatedUser = await updateUserApi({
        firstName,
        lastName,
        email,
      });

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

  /* Redirect after success */
  useEffect(() => {
    if (step === "SUCCESS") {
      const t = setTimeout(() => {
        router.replace("/(customer)/(tabs)/home");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [step]);

  /* Resend timer */
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

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.outer}>
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
          {/* LOGO */}
          <Image
            source={require("../../assets/images/logo/greenLogo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {/* CARD */}
          <View style={styles.card}>
            <Text style={styles.title}>
              {step === "MOBILE" && "Login or Signup"}
              {step === "OTP" && "Verify OTP"}
              {step === "REGISTER" && "Create Account"}
              {step === "SUCCESS" && "Welcome 🎉"}
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
                  placeholder="Enter OTP"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <View style={styles.otpActions}>
                  <TouchableOpacity onPress={() => setStep("MOBILE")}>
                    <Text style={styles.linkText}>
                      <Ionicons name="chevron-back" size={14} /> Change number
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    disabled={resendTimer > 0}
                    onPress={sendOtp}
                  >
                    <Text
                      style={[
                        styles.linkText,
                        resendTimer > 0 && { opacity: 0.6 },
                      ]}
                    >
                      {resendTimer ? `Resend in ${resendTimer}s` : "Resend OTP"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {step === "REGISTER" && (
              <>
                <TouchableOpacity style={styles.avatarBox} onPress={pickImage}>
                  <View style={styles.avatarCircle}>
                    <Ionicons
                      name={avatar ? "checkmark" : "camera"}
                      size={26}
                      color={avatar ? "#34D399" : "#9CA3AF"}
                    />
                  </View>
                  <Text style={styles.avatarText}>
                    {avatar ? "Photo added" : "Add profile photo"}
                  </Text>
                </TouchableOpacity>
                <Input
                  icon="person-outline"
                  placeholder="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                />

                <Input
                  icon="person-outline"
                  placeholder="Last name"
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
                <Ionicons name="checkmark-circle" size={64} color="#34D399" />
                <Text style={styles.successText}>
                  Account created successfully
                </Text>
              </View>
            )}

            {error && <Text style={styles.error}>{error}</Text>}

            {step !== "SUCCESS" && (
              <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.6 }]}
                disabled={loading}
                onPress={
                  step === "MOBILE"
                    ? sendOtp
                    : step === "OTP"
                      ? verifyOtp
                      : createAccount
                }
              >
                <Text style={styles.buttonText}>
                  {loading
                    ? "Please wait..."
                    : step === "MOBILE"
                      ? "Send OTP"
                      : step === "OTP"
                        ? "Verify"
                        : "Create Account"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ---------------- INPUT ---------------- */

function Input(props: any) {
  return (
    <View style={styles.inputWrapper}>
      <Ionicons
        name={props.icon}
        size={18}
        color="#9CA3AF"
        style={{ marginRight: 10 }}
      />
      <TextInput
        {...props}
        placeholderTextColor="#9CA3AF"
        style={styles.input}
      />
    </View>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#071A15" },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 24,
  },

  logo: {
    width: 140,
    height: 88,
    alignSelf: "center",
    marginTop: 40,
  },

  card: {
    padding: 14,

    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,

    marginTop: 40,
  },

  title: {
    color: "#E6F6F0",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 20,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F2C26",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#15382F",
  },

  input: {
    flex: 1,
    color: "#E6F6F0",
    paddingVertical: 11,
    fontSize: 15,
  },

  otpActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  linkText: {
    color: "#34D399",
    fontSize: 13,
    fontWeight: "600",
  },

  avatarBox: {
    alignItems: "center",
    marginBottom: 10,
  },

  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: "#214F3F",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0E2A22",
    marginBottom: 6,
  },

  avatarText: {
    color: "#A8BDB0",
    fontSize: 13,
  },

  error: {
    color: "#FCA5A5",
    textAlign: "center",
    marginBottom: 6,
  },

  button: {
    backgroundColor: "#34D399",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  buttonText: {
    fontWeight: "800",
    fontSize: 16,
    color: "#03241C",
  },

  successBox: {
    alignItems: "center",
    marginTop: 10,
  },

  successText: {
    color: "#E6F6F0",
    fontSize: 16,
    marginTop: 8,
    fontWeight: "700",
  },
});
