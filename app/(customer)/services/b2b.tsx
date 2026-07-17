import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import B2BIcon from "../../../assets/homeicons/B2B.svg";
import axios from "axios";
import { BASE_URL } from "@/lib/api/client";

const ORG_TYPES = [
  "Hospital",
  "Hotel",
  "School/University",
  "Corporate",
  "Other",
];

export default function B2bServicesPage() {
  const { theme } = useTheme();
  const styles = makeStyles(theme);

  const [form, setForm] = useState({
    orgType: "Hospital",
    orgName: "",
    contactPerson: "",
    phone: "",
    email: "",
    requirements: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.orgName || !form.contactPerson || !form.phone) {
      Alert.alert("Missing Information", "Please fill out all required fields (Organization, Contact Person, Phone).");
      return;
    }

    setIsSubmitting(true);
    try {
      // Make the API call to the backend
      await axios.post(`${BASE_URL}/api/v1/b2b/submit`, form);
      
      Alert.alert(
        "Request Submitted",
        "Thank you! Our B2B team will contact you shortly to discuss tailored solutions for your organization.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("B2B Submission Error:", error);
      Alert.alert("Submission Failed", "There was an error submitting your request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const LIGHT_GRAY = "#9CA3AF";

  return (
    <SafeAreaView style={styles.root}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackVisible: false,
          title: "B2B SERVICES",
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerShadowVisible: false,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontWeight: "800",
            fontSize: 16,
            color: theme.text,
          },
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                padding: 8,
                borderRadius: 12,
                backgroundColor: theme.card,
              }}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 80}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <B2BIcon width={100} height={100}/>
            </View>
            <Text style={styles.heroTitle}>Tailored Enterprise Solutions</Text>
            <Text style={styles.heroSubtitle}>
              Premium laundry and dry cleaning services designed for hospitals, hotels, schools, and corporate institutions.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Organization Type</Text>
            <View style={styles.chipsContainer}>
              {ORG_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    form.orgType === type && styles.chipActive,
                  ]}
                  onPress={() => setForm({ ...form, orgType: type })}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      form.orgType === type && styles.chipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Name <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. City General Hospital"
                placeholderTextColor={LIGHT_GRAY}
                value={form.orgName}
                onChangeText={(text) => setForm({ ...form, orgName: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Person <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={LIGHT_GRAY}
                value={form.contactPerson}
                onChangeText={(text) => setForm({ ...form, contactPerson: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number <Text style={styles.asterisk}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="+91 00000 00000"
                placeholderTextColor={LIGHT_GRAY}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(text) => setForm({ ...form, phone: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="contact@organization.com"
                placeholderTextColor={LIGHT_GRAY}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Service Requirements</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about your estimated daily volume, specific cleaning needs, etc."
                placeholderTextColor={LIGHT_GRAY}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={form.requirements}
                onChangeText={(text) => setForm({ ...form, requirements: text })}
              />
            </View>
            
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? "Submitting..." : "Submit Inquiry"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
    marginTop: 10,
  },
    iconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.primary + "22",
      borderWidth: 2,
      borderColor: theme.primary + "44",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.text,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: theme.subText,
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: theme.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.text,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  chipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.subText,
  },
  chipTextActive: {
    color: theme.background,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.text,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  asterisk: {
    color: "#EF4444",
  },
  input: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.text,
  },
  textArea: {
    height: 110,
    paddingTop: 16,
  },
  submitBtn: {
    backgroundColor: theme.primary,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 12,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: theme.background,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
