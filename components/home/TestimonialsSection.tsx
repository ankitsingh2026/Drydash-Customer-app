import React from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { ContentSection, ContentTestimonial } from "@/features/content/content.types";

const { width } = Dimensions.get("window");


export interface Testimonial {
  id: number | string;
  name: string;
  role: string;
  message: string;
  rating: number;
  tag?: string;
}

export const testimonialsRow2: Testimonial[] = [
  {
    id: 1,
    name: "Shubham Singh",
    role: "Google Reviewer",
    message:
      "I had a great experience with Shoe Spa. The quality of cleaning and restoration was impressive — my shoes looked almost brand new after the service. The team was professional, attentive, and handled everything with great care. Turnaround time was reasonable, and the pricing felt fair for the level of service provided. Highly recommended for anyone who wants to maintain or restore their footwear to top condition. I'll definitely be using their service again!",
    rating: 5.0,
    tag: "Shoe Spa",
  },
  {
    id: 2,
    name: "Ayush Singh",
    role: "Google Reviewer",
    message:
      "Excellent shoe spa service by drydash. My shoes were cleaned really well and delivered within 24 hours.",
    rating: 4.8,
    tag: "Shoe Spa",
  },
  {
    id: 3,
    name: "Omkar Jaiswal",
    role: "Google Reviewer",
    message:
      "The delivery service was fast and well-organized. My order arrived on time and in perfect condition, exactly within the promised 24-hour delivery window. Very convenient and reliable service. Will connect with you guys super soon!",
    rating: 5.0,
    tag: "Express Delivery",
  },
  {
    id: 4,
    name: "Shivam Pandey",
    role: "Google Reviewer",
    message:
      "Earlier, I tried many services, but none of them delivered before 3 days, and the service quality was very poor. Then I tried Dry Dash. For express service, they mentioned 8 hours, but they delivered my shoes in just 6 hours with great quality. I was truly impressed. Thank you, Dry Dash! I will come back soon to try more services.",
    rating: 5.0,
    tag: "Express 6h",
  },
  {
    id: 5,
    name: "Haro Om Tripathi",
    role: "Google Reviewer",
    message:
      "They offer excellent service across the NCR region — definitely worth trying.",
    rating: 4.9,
    tag: "NCR Service",
  },
  {
    id: 6,
    name: "Ankit Singh Thakur",
    role: "Google Reviewer",
    message:
      "What a great shoe spa service - shoes came out clean as new. I was very impressed with the quality cleaning and finishing.",
    rating: 4.9,
    tag: "Shoe Spa",
  },
  {
    id: 7,
    name: "Rocky",
    role: "Google Reviewer",
    message:
      "It's hard to find a genuinely good cleaning service in the area, but drydash has earned my trust. I would definitely recommend it to my friends.",
    rating: 4.9,
    tag: "Dry Cleaning",
  },
];

interface TestimonialsProps {
  sectionData?: ContentSection;
}

function TestimonialCard({ item }: { item: Testimonial }) {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);

  const initial = item.name ? item.name.trim()[0].toUpperCase() : "U";
  const fullStars = Math.floor(item.rating);
  const hasHalfStar = item.rating % 1 >= 0.5;

  return (
    <View style={styles.card}>
      {/* User Profile Header */}
      <View style={styles.profileRow}>
        {/* Same unified theme avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.profileTextWrap}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.roleRow}>
            <Ionicons name="logo-google" size={11} color="#EA4335" style={{ marginRight: 3 }} />
            <Text style={styles.userRole} numberOfLines={1}>
              {item.role || "Google Reviewer"}
            </Text>
          </View>
        </View>

        {/* Rating Score Badge */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color="#F59E0B" style={{ marginRight: 3 }} />
          <Text style={styles.ratingScoreText}>{item.rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Stars Row */}
      <View style={styles.starsRow}>
        {[...Array(fullStars)].map((_, i) => (
          <Ionicons
            key={`full-${i}`}
            name="star"
            size={14}
            color="#F59E0B"
            style={{ marginRight: 2 }}
          />
        ))}
        {hasHalfStar && (
          <Ionicons
            name="star-half"
            size={14}
            color="#F59E0B"
            style={{ marginRight: 2 }}
          />
        )}
      </View>

      {/* Review Quote */}
      <Text style={styles.reviewText} numberOfLines={4}>
        "{item.message}"
      </Text>

      {/* Bottom Badges */}
      <View style={styles.bottomRow}>
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>

        {item.tag ? (
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{item.tag}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function TestimonialsSection({ sectionData }: TestimonialsProps) {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);

  if (sectionData && sectionData.isActive === false) {
    return null;
  }

  const title = sectionData?.title?.trim() || "What our customers say";

  // Use API testimonials if the admin has populated them, otherwise fall back to hardcoded ones
  const apiTestimonials: ContentTestimonial[] = sectionData?.testimonials ?? [];
  const hasApiTestimonials = apiTestimonials.some((t) => t.reviewText?.trim() || t.customerName?.trim());

  // Map API testimonials to the Testimonial shape used by TestimonialCard
  const apiMapped: Testimonial[] = apiTestimonials.map((t, idx) => ({
    id: t._id ?? idx,
    name: t.customerName || "Customer",
    role: "Verified Customer",
    message: t.reviewText || "",
    rating: t.rating ?? 5,
  }));

  const displayedTestimonials = hasApiTestimonials ? apiMapped : testimonialsRow2;

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>Trusted by 2000+ happy families</Text>
      </View>

      {/* ── Testimonial Cards Carousel ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews
      >
        {displayedTestimonials.map((item) => (
          <TestimonialCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingTop: 18,
      paddingBottom: 10,
    },
    header: {
      paddingHorizontal: 16,
      marginBottom: 14,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.3,
      marginBottom: 3,
    },
    headerSubtitle: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textSecondary,
    },
    scrollContent: {
      paddingHorizontal: 16,
      gap: 12,
    },
    card: {
      width: width * 0.78,
      backgroundColor: theme.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.subText, 
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    avatarText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "800",
    },
    profileTextWrap: {
      flex: 1,
    },
    userName: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.text,
      marginBottom: 1,
    },
    roleRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    userRole: {
      fontSize: 11,
      fontWeight: "500",
      color: theme.textSecondary,
    },
    ratingBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#FEF3C7",
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#FDE68A",
    },
    ratingScoreText: {
      fontSize: 11,
      fontWeight: "800",
      color: isDark ? "#FBBF24" : "#D97706",
    },
    starsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    reviewText: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.text,
      lineHeight: 18,
      marginBottom: 14,
    },
    bottomRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    verifiedText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.subText,
    },
    tagBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#F3F4F6",
    },
    tagText: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.textSecondary,
    },
  });
