import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
import { useAddress } from "@/context/AddressContext";
import { useTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");

const SERVICES = [
  {
    key: "Shoe Spa",
    slug: "shoe",
    label: "SHOE SPA",
    subtitle: "Deep Clean and restore",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/Shoes.svg",
  },
  {
    key: "Dry Clean",
    slug: "dryclean",
    label: "DRY CLEAN",
    subtitle: "Gentle and premium care",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/DryClean-logo.svg",
  },
  {
    key: "Laundry",
    slug: "laundry",
    label: "LAUNDRY",
    subtitle: "Fresh & hygienic",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/Laundry-logo.svg",
  },
  {
    key: "Onsite",
    slug: "onsite",
    label: "ON-SITE",
    subtitle: "Expert service, right where you are",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/on-site.svg",
  },
  {
    key: "CarWash",
    slug: "carwash",
    label: "CAR-WASH",
    subtitle: "Drive away fresh and clean",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/car-wash.svg",
  },
  {
    key: "Express",
    slug: "express",
    label: "8-HOURS DELIVERY",
    subtitle: "Fast service, delivered same day",
    icon: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/8-hours+delivery.svg",
  },
];

export default function ServicesPage() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { selectedAddress } = useAddress();
  console.log("Selected Address in Services Page:", selectedAddress);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: "#021410" }]}>
      <View style={{ flex: 1, }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 6, padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color="#2FE6A6" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="paper-plane-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>
                  {selectedAddress?.label || "Location"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#fff" style={{ marginLeft: 4 }} />
              </View>
              <Text numberOfLines={1} style={{ color: "#8FB3A8", fontSize: 12, marginTop: 2 }}>
                {selectedAddress?.line1 + ", " + selectedAddress?.city || "Select your location"}
              </Text>
            </View>
          </View>

          {/* <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={20} color="#fff" />
          </TouchableOpacity> */}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>OUR SERVICES</Text>

          <View style={styles.grid}>
            {SERVICES.map((s) => (
              <TouchableOpacity
                key={s.key}
                activeOpacity={0.85}
                onPress={() => {
                  if (["shoe", "laundry", "dryclean"].includes(s.slug)) {
                    router.push({ pathname: "/services/[service]", params: { service: s.slug as any } });
                  } else {
                    router.push(`/services/${s.slug}`);
                  }
                }}
                style={styles.card}
              >
                <View style={styles.iconContainer}>
                  <SvgUri uri={s.icon} width="90%" height="90%" />
                </View>

                {/* Divider Line */}
                <View style={styles.divider} />

                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{s.label}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {s.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0D1F1C",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1A3330",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: "#BCCFC6",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  card: {
    width: (width - 32 - 12) / 2,
    backgroundColor: "#062B25",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#17433B",
    overflow: "hidden",
    paddingBottom: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  iconContainer: {
    width: "100%",
    aspectRatio: 1.1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#052420",
  },
  textContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
  },

  cardTitle: {
    color: "#F5FFF9",
    fontSize: 16,
    fontWeight: "800",
  },

  cardSub: {
    color: "#7FA394",
    fontSize: 11,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#1F4A42",
    marginHorizontal: 12,
    opacity: 0.8,
  },
});
