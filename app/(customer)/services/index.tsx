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
  StatusBar,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SvgUri } from "react-native-svg";
import { useAddress } from "@/context/AddressContext";
import { useTheme } from "@/context/ThemeContext";
import { useHomeData } from "@/context/HomeDataContext";
import ShoesIcon from "../../../assets/homeicons/Shoes.svg";
import DrycleanIcon from "../../../assets/homeicons/DryClean-logo.svg";
import LaundryIcon from "../../../assets/homeicons/Laundry-logo.svg";
import OnsiteIcon from "../../../assets/homeicons/on-site.svg";
import CarwashIcon from "../../../assets/homeicons/car-wash.svg";
import ExpressIcon from "../../../assets/homeicons/8-hours-delivery.svg";
import LeatherIcon from "../../../assets/homeicons/leather.svg";
import BtoBIcon from "../../../assets/homeicons/B2B.svg";

const { width } = Dimensions.get("window");

const ICON_MAP: Record<string, React.FC<any>> = {
  "shoe-spa": ShoesIcon,
  "shoe": ShoesIcon,
  "dry-clean": DrycleanIcon,
  "dryclean": DrycleanIcon,
  "leather-luxury": LeatherIcon,
  "leather": LeatherIcon,
  "laundry": LaundryIcon,
  "on-site": OnsiteIcon,
  "onsite": OnsiteIcon,
  "car-wash": CarwashIcon,
  "carwash": CarwashIcon,
  "b2b-services": BtoBIcon,
  "b2b": BtoBIcon,
  "8-hours-delivery": ExpressIcon,
  "express": ExpressIcon,
};

const normalizeServiceSlug = (slug: string = ""): string => {
  const s = slug.toLowerCase().trim();
  if (s === "shoe-spa" || s === "shoe") return "shoe";
  if (s === "dry-clean" || s === "dryclean") return "dryclean";
  if (s === "leather-luxury" || s === "leather") return "leather";
  if (s === "laundry") return "laundry";
  if (s === "on-site" || s === "onsite") return "onsite";
  if (s === "car-wash" || s === "carwash") return "carwash";
  if (s === "b2b-services" || s === "b2b") return "b2b";
  if (s === "8-hours-delivery" || s === "express") return "express";
  return s;
};

const FALLBACK_SERVICES = [
  {
    _id: "shoe",
    slug: "shoe-spa",
    title: "SHOE SPA",
    subtitle: "Deep Clean and restore",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "dryclean",
    slug: "dry-clean",
    title: "DRY CLEAN",
    subtitle: "Gentle and premium care",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "laundry",
    slug: "laundry",
    title: "LAUNDRY",
    subtitle: "Fresh & hygienic",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "leather",
    slug: "leather-luxury",
    title: "LEATHER & LUXURY",
    subtitle: "Specialized care for leather",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "onsite",
    slug: "on-site",
    title: "ON-SITE",
    subtitle: "Expert service, right where you are",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "carwash",
    slug: "car-wash",
    title: "CAR-WASH",
    subtitle: "Drive away fresh and clean",
    mediaUrl: "",
    mediaType: "image",
  },
  {
    _id: "b2b",
    slug: "b2b-services",
    title: "B2B SERVICES",
    subtitle: "Tailored solutions for organizations",
    mediaUrl: "",
    mediaType: "image",
  },
];

export default function ServicesPage() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { selectedAddress } = useAddress();
  const { layoutContent } = useHomeData();
  const styles = makeStyles(theme);

  const servicesList = (layoutContent?.services_section?.services && layoutContent.services_section.services.length > 0)
    ? layoutContent.services_section.services
    : FALLBACK_SERVICES;
  const sectionTitle = layoutContent?.services_section?.title?.trim() || "OUR SERVICES";

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <View style={{ flex: 1 }}>
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
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>{sectionTitle.toUpperCase()}</Text>

          <View style={styles.grid}>
            {servicesList.map((s: any, index: number) => {
              const normalized = normalizeServiceSlug(s.slug);
              const FallbackIcon = ICON_MAP[s.slug] || ICON_MAP[normalized] || ShoesIcon;
              const mediaUrl = s.mediaUrl?.trim() || "";
              const isSvg = mediaUrl.endsWith(".svg") || mediaUrl.includes(".svg");
              const isHttp = mediaUrl.startsWith("http://") || mediaUrl.startsWith("https://");

              const subText = s.subtitle || (normalized === "onsite" ? "Expert service, right where you are" : normalized === "carwash" ? "Drive away fresh and clean" : normalized === "b2b" ? "Tailored solutions for organizations" : s.deliveryHours ? `Up to ${s.deliveryHours} hours` : "Premium care");

              return (
                <TouchableOpacity
                  key={s._id || s.slug || String(index)}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (["shoe", "laundry", "leather", "dryclean"].includes(normalized)) {
                      router.push({
                        pathname: "/services/[service]",
                        params: { service: normalized as any },
                      });
                    } else {
                      router.push(`/services/${normalized}` as any);
                    }
                  }}
                  style={styles.card}
                >
                  <View style={styles.iconContainer}>
                    {isHttp && isSvg ? (
                      <SvgUri uri={mediaUrl} width="90%" height="90%" />
                    ) : isHttp ? (
                      <Image source={{ uri: mediaUrl }} style={{ width: "90%", height: "90%" }} resizeMode="contain" />
                    ) : (
                      <FallbackIcon width="90%" height="90%" />
                    )}
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{s.title || s.label}</Text>
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {subText}
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
