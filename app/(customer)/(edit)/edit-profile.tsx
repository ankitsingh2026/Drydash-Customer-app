import { useAuthContext } from "@/context/AuthContext";
import {
  getMeApi,
  unActivatedUser,
  updateUserApi,
} from "@/features/auth/auth.api";
import { useAuth } from "@/hooks/useAuth";
import { showAlert } from "@/components/Customalert";
import { useTheme } from "../../../context/ThemeContext";

import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ArrowLeft, Trash2 } from "lucide-react-native";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Animated,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";


function getInitials(firstName: string, lastName: string) {
  const first = firstName?.trim()?.[0] ?? "";
  const last = lastName?.trim()?.[0] ?? "";

  return `${first}${last}`.toUpperCase() || "?";
}


interface FieldProps extends TextInputProps {
  label: string;
  theme: any;
  styles: any;
}


const Field = React.memo(
  ({
    label,
    theme,
    styles,
    editable = true,
    ...props
  }: FieldProps) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.fieldWrapper}>
        <Text
          style={[
            styles.fieldLabel,
            {
              color: theme.textSecondary,
            },
          ]}
        >
          {label}
        </Text>

        <TextInput
          {...props}
          editable={editable}
          blurOnSubmit={false}
          placeholderTextColor={theme.textSecondary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            {
              backgroundColor: theme.card,

              color:
                editable === false
                  ? theme.textSecondary
                  : theme.text,

              borderColor:
                editable === false
                  ? "rgba(0,0,0,0.06)"
                  : focused
                    ? theme.primary
                    : theme.border,

              opacity: editable === false ? 0.7 : 1,
            },
          ]}
        />
      </View>
    );
  }
);


Field.displayName = "Field";


export default function EditProfile() {
  const { theme } = useTheme();

  const styles = useMemo(
    () => makeStyles(theme),
    [theme]
  );

  const { logout } = useAuthContext();
  const { setAuthUser } = useAuth();

  const fade = useRef(
    new Animated.Value(0)
  ).current;

  const slide = useRef(
    new Animated.Value(24)
  ).current;


  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);

  const [deleteModal, setDeleteModal] =
    useState(false);


  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const me = await getMeApi();

        if (!mounted) return;

        const loadedFirstName =
          me?.firstName ??
          me?.name?.split(" ")[0] ??
          "";

        const loadedLastName =
          me?.lastName ??
          me?.name
            ?.split(" ")
            .slice(1)
            .join(" ") ??
          "";

        const loadedPhone =
          me?.user?.phone ??
          me?.phone ??
          "";

        const loadedEmail =
          me?.user?.email ??
          me?.email ??
          "";

        setFirstName(loadedFirstName);
        setLastName(loadedLastName);
        setPhone(loadedPhone);
        setEmail(loadedEmail);

      } catch (error) {
        console.log(
          "Profile load error:",
          error
        );
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
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
  }, [fade, slide]);


  useEffect(() => {
    const subscription =
      BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          router.back();
          return true;
        }
      );

    return () => {
      subscription.remove();
    };
  }, []);


  const handleSave = async () => {
    const nextFirstName = firstName.trim();
    const nextLastName = lastName.trim();
    const nextEmail = email.trim();

    if (!nextFirstName) {
      showAlert({
        type: "warning",
        title: "First name is required",
        message:
          "Please enter your first name.",
      });

      return;
    }

    if (!nextEmail) {
      showAlert({
        type: "warning",
        title: "Email is required",
        message:
          "Please enter your email address.",
      });

      return;
    }

    try {
      setSaving(true);

      await updateUserApi({
        firstName: nextFirstName,
        lastName: nextLastName,
        email: nextEmail,
      });

      const me = await getMeApi();

      const updatedFirstName =
        me?.firstName ??
        me?.name?.split(" ")[0] ??
        nextFirstName;

      const updatedLastName =
        me?.lastName ??
        me?.name
          ?.split(" ")
          .slice(1)
          .join(" ") ??
        nextLastName;

      const updatedEmail =
        me?.user?.email ??
        me?.email ??
        nextEmail;

      setAuthUser({
        id: me?.user?.id,

        phone:
          me?.user?.phone ??
          me?.phone ??
          phone,

        email: updatedEmail,

        firstName: updatedFirstName,
        lastName: updatedLastName,

        role:
          me?.user?.role ??
          me?.role,
      } as any);

      showAlert({
        type: "success",
        title: "Profile updated",
        message:
          "Your details have been saved.",
      });

      // ensure Profile screen refetches updated data
      setTimeout(() => {
        router.replace({ pathname: "/(customer)/(tabs)/profile" });
      }, 50);




    } catch (error: any) {
      console.log(
        "Profile update error:",
        error?.response?.data ?? error
      );


      showAlert({
        type: "error",
        title: "Update failed",

        message:
          error?.response?.data?.message ??
          error?.message ??
          "Unable to update your profile. Please try again.",
      });

    } finally {
      setSaving(false);
    }
  };


  const handleDeleteAccount = async () => {
    try {
      setDeleteModal(false);

      await unActivatedUser();

      showAlert({
        type: "success",
        title:
          "Account Scheduled for Deletion",
        message:
          "Will be permanently removed after 10 days. Contact support@drydash.in to restore access.",
        duration: 6000,
      });

      await logout();

      router.replace("/auth");

    } catch (error) {
      console.log(
        "Delete error:",
        error
      );

      showAlert({
        type: "error",
        title: "Delete Failed",
        message:
          "We were unable to delete your account. Please try again.",
      });
    }
  };


  const initials = getInitials(
    firstName,
    lastName
  );


  return (
    <Animated.View
      style={[
        styles.root,
        {
          backgroundColor:
            theme.background,

          opacity: fade,

          transform: [
            {
              translateY: slide,
            },
          ],
        },
      ]}
    >
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.header}>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft
              color={theme.text}
              size={22}
            />
          </TouchableOpacity>


          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.primary,
              },
            ]}
          >
            Edit Profile
          </Text>


          <View style={styles.headerSpace} />

        </View>


        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >

          <ScrollView
            contentContainerStyle={
              styles.scroll
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
          >

            <View style={styles.avatarSection}>

              <View
                style={[
                  styles.glowRing,
                  {
                    shadowColor:
                      theme.primary,
                  },
                ]}
              >

                <LinearGradient
                  colors={[
                    theme.primary,
                    theme.primary + "CC",
                  ]}
                  start={{
                    x: 0,
                    y: 0,
                  }}
                  end={{
                    x: 1,
                    y: 1,
                  }}
                  style={styles.gradientRing}
                >

                  <View
                    style={[
                      styles.avatarInner,
                      {
                        backgroundColor:
                          theme.card,
                      },
                    ]}
                  >

                    <Text
                      style={[
                        styles.initialsText,
                        {
                          color:
                            theme.primary,
                        },
                      ]}
                    >
                      {initials}
                    </Text>

                  </View>

                </LinearGradient>

              </View>

            </View>


            <View style={styles.fields}>

              <View style={styles.row2}>

                <View style={styles.row2Item}>

                  <Field
                    label="First Name"
                    value={firstName}
                    onChangeText={
                      setFirstName
                    }
                    placeholder="First name"
                    theme={theme}
                    styles={styles}
                    autoCorrect={false}
                    returnKeyType="next"
                  />

                </View>


                <View style={styles.row2Item}>

                  <Field
                    label="Last Name"
                    value={lastName}
                    onChangeText={
                      setLastName
                    }
                    placeholder="Last name"
                    theme={theme}
                    styles={styles}
                    autoCorrect={false}
                    returnKeyType="next"
                  />

                </View>

              </View>


              <Field
                label="Phone Number"
                value={phone}
                editable={false}
                placeholder="+91 XXXXX XXXXX"
                keyboardType="phone-pad"
                theme={theme}
                styles={styles}
              />


              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                theme={theme}
                styles={styles}
                returnKeyType="done"
              />

            </View>


            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSave}
              disabled={saving}
              style={[
                styles.saveBtnWrapper,
                {
                  opacity:
                    saving ? 0.7 : 1,
                },
              ]}
            >

              <LinearGradient
                colors={[
                  theme.primary ??
                    "#2FE6A6",
                  "#1AC98A",
                ]}
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 0,
                }}
                style={styles.saveBtn}
              >

                <Text
                  style={
                    styles.saveBtnText
                  }
                >
                  {saving
                    ? "Saving…"
                    : "Save Changes"}
                </Text>

              </LinearGradient>

            </TouchableOpacity>


            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                setDeleteModal(true)
              }
              style={styles.deleteBtn}
            >

              <Trash2
                color="#FF3B30"
                size={18}
              />

              <Text
                style={styles.deleteText}
              >
                Delete Account
              </Text>

            </TouchableOpacity>

          </ScrollView>

        </KeyboardAvoidingView>


        {deleteModal && (
          <View style={styles.modalOverlay}>

            <View style={styles.modalBox}>

              <Text style={styles.modalTitle}>
                Delete Account
              </Text>


              <Text style={styles.modalDesc}>
                This will permanently delete
                your account and all data.
              </Text>


              <View style={styles.modalRow}>

                <TouchableOpacity
                  onPress={() =>
                    setDeleteModal(false)
                  }
                >
                  <Text
                    style={styles.cancelText}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>


                <TouchableOpacity
                  onPress={
                    handleDeleteAccount
                  }
                  style={
                    styles.confirmDelete
                  }
                >
                  <Text
                    style={styles.confirmText}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>

              </View>

            </View>

          </View>
        )}

      </SafeAreaView>

    </Animated.View>
  );
}


const makeStyles = (theme: any) =>
  StyleSheet.create({

    root: {
      flex: 1,
    },

    safeArea: {
      flex: 1,
    },

    keyboardView: {
      flex: 1,
    },

    header: {
      height: 56,
      flexDirection: "row",
      alignItems: "center",
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

    headerSpace: {
      width: 40,
    },

    scroll: {
      paddingHorizontal: 20,
      paddingBottom: 120,
    },

    avatarSection: {
      alignItems: "center",
      marginTop: 24,
      marginBottom: 36,
    },

    glowRing: {
      shadowOpacity: 0.4,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 0,
      },
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

    fields: {
      gap: 4,
    },

    row2: {
      flexDirection: "row",
      gap: 12,
    },

    row2Item: {
      flex: 1,
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
      backgroundColor:
        "rgba(255, 59, 48, 0.1)",
      borderWidth: 1,
      borderColor:
        "rgba(255, 59, 48, 0.3)",
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
      backgroundColor:
        "rgba(0,0,0,0.6)",
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
      alignItems: "center",
      gap: 16,
    },

    cancelText: {
      color: theme.textSecondary,
      fontWeight: "600",
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

