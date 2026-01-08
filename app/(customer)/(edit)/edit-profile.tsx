import { router } from "expo-router";
import {
  ArrowLeft,
  Briefcase,
  Home,
  MapPin,
  Plus,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../context/ThemeContext";

type Address = {
  id: string;
  type: "Home" | "Work" | "Other";
  value: string;
};

export default function EditProfile() {
  const { theme } = useTheme();

  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(24)).current;

  /** ENTRY */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /** EXIT */
  const goBack = () => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 24,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => router.back());
  };

  /** ANDROID BACK */
  useEffect(() => {
    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        goBack();
        return true;
      }
    );
    return () => sub.remove();
  }, []);

  const [name, setName] = useState("Jane Doe");
  const [phone, setPhone] = useState("9876543210");

  const [addresses] = useState<Address[]>([
    { id: "1", type: "Home", value: "221B Baker Street, London" },
    { id: "2", type: "Work", value: "Canary Wharf, London" },
  ]);

  return (
    <Animated.View
      style={[
        styles.root,
        {
          backgroundColor: theme.background,
          opacity: fade,
          transform: [{ translateY: slide }],
        },
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <ArrowLeft color={theme.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Edit Profile
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* PERSONAL */}
        <Card theme={theme}>
          <Section title="Personal Information" theme={theme}>
            <Input label="Full Name" value={name} onChangeText={setName} theme={theme} />
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              theme={theme}
            />
          </Section>
        </Card>

        {/* ADDRESSES */}
        <Card theme={theme}>
          <Section title="Saved Addresses" theme={theme}>
            {addresses.map((a) => (
              <View key={a.id} style={styles.addressRow}>
                {a.type === "Home" && <Home size={18} color={theme.primary} />}
                {a.type === "Work" && <Briefcase size={18} color={theme.primary} />}
                {a.type === "Other" && <MapPin size={18} color={theme.primary} />}

                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.addressType, { color: theme.text }]}>
                    {a.type}
                  </Text>
                  <Text style={[styles.addressText, { color: theme.subText }]}>
                    {a.value}
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.addAddress, { borderColor: theme.border }]}
            >
              <Plus size={18} color={theme.primary} />
              <Text style={[styles.addText, { color: theme.primary }]}>
                Add New Address
              </Text>
            </TouchableOpacity>
          </Section>
        </Card>

        {/* SAVE */}
        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.saveBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

/* ---------- SMALL COMPONENTS ---------- */

function Card({ children, theme }: any) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      {children}
    </View>
  );
}

function Section({ title, theme, children }: any) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Input({ label, theme, ...props }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.label, { color: theme.subText }]}>
        {label}
      </Text>
      <TextInput
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: theme.inputBg ?? "#0F1720",
            color: theme.text,
          },
        ]}
        placeholderTextColor={theme.subText}
      />
    </View>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    marginTop:40,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },

  container: {
    padding: 16,
    paddingBottom: 140,
  },

  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  addressType: {
    fontWeight: "700",
    fontSize: 14,
  },

  addressText: {
    fontSize: 12,
    marginTop: 2,
  },

  addAddress: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },

  addText: {
    fontWeight: "700",
  },

  saveBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  saveText: {
    fontWeight: "900",
    color: "#000",
    fontSize: 16,
  },
});
