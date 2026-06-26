import { useAuthContext } from "@/context/AuthContext";
import { getMeApi, unActivatedUser } from "@/features/auth/auth.api";
import { useAuth } from "@/hooks/useAuth";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";
import { showAlert } from "@/components/Customalert";

/* ─────────── helpers ─────────── */

function getInitials(name: string): string {
  const parts = (name ?? "").trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ─────────── screen ─────────── */

export default function EditProfile() {
  const { theme } = useTheme();
  const styles = makeStyles(theme); // ✅ dynamic styles

  const { logout } = useAuthContext();
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  const params = useLocalSearchParams();
  const [phone, setPhone] = useState("");
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [name, setName] = useState((params.name as string) || "");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const loadProfileData = async () => {
    const me = await getMeApi();
    setFirstName(me?.firstName);
    setLastName(me?.lastName);
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    getMeApi()
      .then((me) => {
        const e = me.user?.email ?? me.email ?? "";
        setEmail(e);
        if (!name) {
          const fn = me.firstName ?? me.name?.split(" ")[0] ?? "";
          const ln = me.lastName ?? me.name?.split(" ").slice(1).join(" ") ?? "";
          setName(`${fn} ${ln}`.trim());
        }
        if (!phone) setPhone(me.user?.phone ?? me.phone ?? "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.back();
      return true;
    });
    return () => sub.remove();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      // await updateProfileApi({ name, phone, email });
      router.back();
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const initials = getInitials(name);

  const handleDeleteAccount = async () => {
    try {
      setDeleteModal(false);
      await unActivatedUser();
      showAlert({
        type: 'success',
        title: 'Account Scheduled for Deletion',
        message: 'Will be permanently removed after 10 days. Contact support@drydash.in to restore access.',
        duration: 6000,
      });
      await logout();
      router.replace("/auth");
    } catch (e) {
      showAlert({
        type: 'error',
        title: 'Delete Failed',
        message: 'We were unable to delete your account. Please try again.',
      });
      console.log("delete error", e);
    }
  };

  // ── Field component moved inside to access styles & theme ──
  function Field({
    label,
    ...props
  }: {
    label: string;
    [key: string]: any;
  }) {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.fieldWrapper}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
          {label}
        </Text>
        <TextInput
          {...props}
          style={[
            styles.input,
            {
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: focused ? theme.primary : theme.border,
            },
          ]}
          placeholderTextColor={theme.textSecondary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.root,
        {
          backgroundColor: theme.background,
          opacity: fade,
          transform: [
            { translateY: slide },
            {
              scale: fade.interpolate({
                inputRange: [0, 1],
                outputRange: [0.98, 1],
              }),
            },
          ],
        },
      ]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ArrowLeft color={theme.text} size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.primary }]}>
            Edit Profile
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── AVATAR ── */}
            <View style={styles.avatarSection}>
              <View style={[styles.glowRing, { shadowColor: theme.primary }]}>
                <LinearGradient
                  colors={[theme.primary, theme.primary + "CC"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientRing}
                >
                  <View style={[styles.avatarInner, { backgroundColor: theme.card }]}>
                    <Text style={[styles.initialsText, { color: theme.primary }]}>
                      {initials}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* ── FIELDS ── */}
            <View style={styles.fields}>
              <Field
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Your full name"
                theme={theme}
              />
              <Field
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 XXXXX XXXXX"
                keyboardType="phone-pad"
                theme={theme}
              />
              {/* <Field
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                theme={theme}
              /> */}
            </View>

            {/* ── SAVE ── */}
            {/* <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSave}
              disabled={saving}
              style={styles.saveBtnWrapper}
            >
              <LinearGradient
                colors={[theme.primary ?? "#2FE6A6", "#1AC98A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtn}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? "Saving…" : "Save Changes"}
                </Text>
              </LinearGradient>
            </TouchableOpacity> */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDeleteModal(true)}
              style={styles.deleteBtn}
            >
              <Trash2 color="#FF3B30" size={18} />
              <Text style={styles.deleteText}>Delete Account</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {deleteModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Delete Account</Text>
              <Text style={styles.modalDesc}>
                This will permanently delete your account and all data.
              </Text>
              <View style={styles.modalRow}>
                <TouchableOpacity onPress={() => setDeleteModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  style={styles.confirmDelete}
                >
                  <Text style={styles.confirmText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
}


/* ─────────── styles ─────────── */

const makeStyles = (theme: any) =>
  StyleSheet.create({
    root: { flex: 1 },

    header: {
      height: 56,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginTop: 4,
    },

    backBtn: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },

    headerTitle: {
      fontSize: 17,
      fontWeight: "800",
    },

    scroll: {
      paddingHorizontal: 20,
      paddingBottom: 120,
    },

    /* avatar */
    avatarSection: {
      alignItems: "center",
      marginTop: 24,
      marginBottom: 36,
    },

    glowRing: {
      shadowOpacity: 0.4,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 0 },
      elevation: 12,
    },

    gradientRing: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: "center",
      justifyContent: "center",
    },

    avatarInner: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: "center",
      justifyContent: "center",
    },

    initialsText: {
      fontSize: 32,
      fontWeight: "900",
      letterSpacing: 1,
    },

    /* fields */
    fields: {
      gap: 4,
    },

    fieldWrapper: {
      marginBottom: 18,
    },

    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      marginBottom: 8,
    },

    input: {
      height: 52,
      borderRadius: 14,
      paddingHorizontal: 16,
      fontSize: 15,
      borderWidth: 1,
      fontWeight: "500",
    },

  /* save */
  saveBtnWrapper: {
    marginTop: 32,
    borderRadius: 16,
    overflow: "hidden",
  },

  saveBtn: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },

  saveBtnText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#031612",
    letterSpacing: 0.3,
  },
  deleteBtn: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.3)",
    borderRadius: 14,
    gap: 8,
  },

    deleteText: {
      color: "#FF3B30",
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 0.3,
    },

    modalOverlay: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      padding: 20,
    },

    modalBox: {
      backgroundColor: theme.card,
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },

    modalTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 6,
    },

    modalDesc: {
      color: theme.textSecondary,
      marginBottom: 20,
    },

    modalRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 16,
    },

    cancelText: {
      color: theme.textSecondary,
      fontWeight: "600",
      marginTop: 12,
    },

    confirmDelete: {
      backgroundColor: "#FF3B30",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
    },

    confirmText: {
      color: theme.background,
      fontWeight: "700",
    },
  });