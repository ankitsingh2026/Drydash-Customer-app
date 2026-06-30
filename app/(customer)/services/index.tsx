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
import ShoesIcon from "../../../assets/homeicons/Shoes.svg";
import DrycleanIcon from "../../../assets/homeicons/DryClean-logo.svg";
import LaundryIcon from "../../../assets/homeicons/Laundry-logo.svg";
import OnsiteIcon from "../../../assets/homeicons/on-site.svg";
import CarwashIcon from "../../../assets/homeicons/car-wash.svg";
import ExpressIcon from "../../../assets/homeicons/8-hours-delivery.svg";
import LeatherIcon from "../../../assets/homeicons/leather.svg";

const { width } = Dimensions.get("window");

const SERVICES = [
  {
    key: "Shoe Spa",
    slug: "shoe",
    label: "SHOE SPA",
    subtitle: "Deep Clean and restore",
    icon: ShoesIcon,
  },
  {
    key: "Dry Clean",
    slug: "dryclean",
    label: "DRY CLEAN",
    subtitle: "Gentle and premium care",
    icon: DrycleanIcon,
  },
  // {
  //   key: "Laundry",
  //   slug: "laundry",
  //   label: "LAUNDRY",
  //   subtitle: "Fresh & hygienic",
  //   icon: LaundryIcon,
  // },
  {
    key: "Leather",
    slug: "leather",
    label: "LEATHER & SUEDE",
    subtitle: "Specialized care for leather",
    icon: LeatherIcon,
  },
  {
    key: "Onsite",
    slug: "onsite",
    label: "ON-SITE",
    subtitle: "Expert service, right where you are",
    icon: OnsiteIcon,
  },
  {
    key: "CarWash",
    slug: "carwash",
    label: "CAR-WASH",
    subtitle: "Drive away fresh and clean",
    icon: CarwashIcon,
  },
  {
    key: "Express",
    slug: "express",
    label: "8-HOURS DELIVERY",
    subtitle: "Fast service, delivered same day",
    icon: ExpressIcon,
  },
];
export default function ServicesPage() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { selectedAddress } = useAddress();
  const styles = makeStyles(theme);
  console.log("Selected Address in Services Page:", selectedAddress);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={{ flex: 1, }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 6, padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={theme.primary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="paper-plane-outline" size={18} color={theme.text} style={{ marginRight: 6 }} />
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>
                  {selectedAddress?.label || "Location"}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.text} style={{ marginLeft: 4 }} />
              </View>
              <Text numberOfLines={1} style={{ color: theme.subText, fontSize: 12, marginTop: 2 }}>
                {selectedAddress?.line1 + ", " + selectedAddress?.city || "Select your location"}
              </Text>
            </View>
          </View>

          {/* <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={20} color={theme.text} />
          </TouchableOpacity> */}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>OUR SERVICES</Text>

          <View style={styles.grid}>
            {SERVICES.map((s) => {
              const Icon = s.icon;

              return (
                <TouchableOpacity
                  key={s.key}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (["shoe", "leather", "dryclean"].includes(s.slug)) {
                      router.push({
                        pathname: "/services/[service]",
                        params: { service: s.slug as any },
                      });
                    } else {
                      router.push(`/services/${s.slug}`);
                    }
                  }}
                  style={styles.card}
                >
                  <View style={styles.iconContainer}>
                    <Icon width="90%" height="90%" />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{s.label}</Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {s.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme: any) =>
  StyleSheet.create({
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
      backgroundColor: theme.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 40,
    },
    sectionTitle: {
      color: theme.subText,
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
      backgroundColor: theme.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      paddingBottom: 9,
      shadowColor: theme.background,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: theme.isDark ? 0.25 : 0.05,
      shadowRadius: 6,
      elevation: 5,
    },
    iconContainer: {
      width: "100%",
      aspectRatio: 1.1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.card,
    },
    textContainer: {
      paddingHorizontal: 12,
      paddingTop: 10,
    },

    cardTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "800",
    },

    cardSub: {
      color: theme.subText,
      fontSize: 11,
      fontWeight: "500",
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginHorizontal: 12,
      opacity: 0.8,
    },
  });
