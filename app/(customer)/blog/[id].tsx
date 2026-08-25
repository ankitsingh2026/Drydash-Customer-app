import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";
import { getBlogBySlugApi } from "@/features/content/content.api";
import { BlogItem } from "@/features/content/content.types";

const { width } = Dimensions.get("window");

const cleanHtmlEntities = (str: string): string => {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
};

interface ContentBlock {
  type: "h2" | "h3" | "p" | "li";
  text: string;
}

const parseHtmlContent = (html: string): ContentBlock[] => {
  if (!html) return [];
  const blocks: ContentBlock[] = [];

  const tagRegex = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const rawTag = match[1].toLowerCase();
    const rawInner = match[2];

    const textWithoutTags = rawInner.replace(/<[^>]+>/g, "");
    const cleanedText = cleanHtmlEntities(textWithoutTags);

    if (cleanedText) {
      const type: ContentBlock["type"] =
        rawTag === "h1" || rawTag === "h2"
          ? "h2"
          : rawTag === "h3" || rawTag === "h4"
          ? "h3"
          : rawTag === "li"
          ? "li"
          : "p";

      blocks.push({ type, text: cleanedText });
    }
  }

  if (blocks.length === 0 && html.trim()) {
    const plain = cleanHtmlEntities(html.replace(/<[^>]+>/g, ""));
    if (plain) {
      blocks.push({ type: "p", text: plain });
    }
  }

  return blocks;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recent";
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recent";
  }
};

const STATIC_FALLBACKS: Record<string, any> = {
  sneakers: {
    title: "How to Maintain White Sneakers",
    subtitle: "Keep your kicks looking brand new with our easy daily care routine.",
    date: "May 15, 2026",
    author: "DryDash Experts",
    image: "https://customer-app-image.s3.ap-south-1.amazonaws.com/blogs-images/h_shoe.png",
    blocks: [
      { type: "h2", text: "1. The Magic of Daily Wiping" },
      { type: "p", text: "White sneakers are a staple, but they act like a magnet for dirt. The secret to longevity isn't washing them constantly—it's regular maintenance. After every wear, take a damp cloth and gently wipe away any surface dust or mud before it has a chance to set in." },
      { type: "h2", text: "2. Baking Soda & Vinegar Paste" },
      { type: "p", text: "For tougher stains, skip the harsh bleach. Mix equal parts baking soda and white vinegar to create a bubbly paste. Apply it to the stained areas using an old toothbrush, gently scrubbing in circular motions. Let it sit in the sun for a few hours until the paste dries and cracks off, then brush it away." },
      { type: "h2", text: "3. Protect the Soles" },
      { type: "p", text: "Magic erasers work wonders on rubber midsoles. Simply wet the eraser and buff out the scuffs. Just remember not to use it on leather or delicate canvas uppers, as it can be too abrasive." },
    ],
  },
  silk: {
    title: "The Art of Caring for Silk",
    subtitle: "Gentle techniques to ensure your delicate fabrics last a lifetime.",
    date: "May 10, 2026",
    author: "DryDash Experts",
    image: "https://customer-app-image.s3.ap-south-1.amazonaws.com/blogs-images/h_suit.png",
    blocks: [
      { type: "h2", text: "1. Hand Washing is Key" },
      { type: "p", text: "Silk is incredibly delicate and usually doesn't survive the aggressive spinning of a washing machine. Fill a basin with cold water and add a few drops of mild, pH-neutral detergent designed specifically for silk. Gently agitate the garment for no more than 5 minutes." },
      { type: "h2", text: "2. Avoid Wringing" },
      { type: "p", text: "Never twist or wring silk, as this can break the fibers and cause permanent wrinkles. Instead, lay the wet garment flat on a clean, dry towel. Roll the towel up to absorb the excess moisture." },
      { type: "h2", text: "3. Ironing & Storage" },
      { type: "p", text: "If you must iron, do it while the silk is slightly damp, using the lowest heat setting. Store silk garments in a cool, dry place, avoiding plastic bags which can trap moisture and cause mildew." },
    ],
  },
  sofa: {
    title: "Deep Clean Your Sofa at Home",
    subtitle: "Step-by-step guide to rejuvenating your living room centerpiece.",
    date: "May 02, 2026",
    author: "DryDash Experts",
    image: "https://customer-app-image.s3.ap-south-1.amazonaws.com/blogs-images/h_sofa.png",
    blocks: [
      { type: "h2", text: "1. Vacuum First" },
      { type: "p", text: "Before applying any cleaning solutions, remove all crumbs, dust, and pet hair. Use the upholstery attachment on your vacuum and make sure to get into the crevices and under the cushions." },
      { type: "h2", text: "2. Check the Care Tag" },
      { type: "p", text: "Look for the manufacturer's care tag. 'W' means water-based cleaners are safe, 'S' requires dry-cleaning solvents, 'WS' means both are fine, and 'X' means vacuum only. Always follow these codes to avoid ruining your fabric." },
      { type: "h2", text: "3. Spot Cleaning" },
      { type: "p", text: "For minor stains on 'W' safe sofas, mix a few drops of dish soap with warm water. Dampen a microfiber cloth with the solution and dab the stain—never rub, as rubbing pushes the stain deeper into the fibers." },
    ],
  },
};

export default function BlogArticleScreen() {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const slug = String(id || "");
  const [blogData, setBlogData] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchArticle = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await getBlogBySlugApi(slug);
        if (isMounted && res?.success && res?.data) {
          setBlogData(res.data);
        }
      } catch (err) {
        console.log("Error fetching blog by slug:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchArticle();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const fallback =
    STATIC_FALLBACKS[slug] ||
    (slug.includes("sofa")
      ? STATIC_FALLBACKS["sofa"]
      : slug.includes("silk")
      ? STATIC_FALLBACKS["silk"]
      : STATIC_FALLBACKS["sneakers"]);

  const title = blogData?.title || fallback.title;
  const subtitle = blogData?.brief || blogData?.subtitle || fallback.subtitle;
  const author = blogData?.author || fallback.author || "DryDash Experts";
  const date = blogData?.createdAt ? formatDate(blogData.createdAt) : fallback.date;
  const image =
    blogData?.mediaUrl ||
    fallback.image ||
    "https://customer-app-image.s3.ap-south-1.amazonaws.com/blogs-images/h_shoe.png";

  const blocks: ContentBlock[] =
    blogData?.content && typeof blogData.content === "string"
      ? parseHtmlContent(blogData.content)
      : fallback.blocks;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.topNavTitle} numberOfLines={1}>
          Garment & Shoe Care
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Hero Featured Image (Shown completely without cropping) */}
          <View style={styles.imageCard}>
            <Image
              source={{ uri: image }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          {/* Article Header & Metadata */}
          <View style={styles.contentContainer}>
            <View style={styles.metaRow}>
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                <Text style={styles.dateText}>{date}</Text>
              </View>
              <View style={styles.authorBadge}>
                <Ionicons name="person-outline" size={13} color={theme.textSecondary} style={{ marginRight: 4 }} />
                <Text style={styles.authorText}>{author}</Text>
              </View>
            </View>

            {/* Main Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Subtitle / Excerpt */}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            <View style={styles.divider} />

            {/* Structured Body Content */}
            <View style={styles.bodyContainer}>
              {blocks.map((block: ContentBlock, index: number) => {
                if (block.type === "h2") {
                  return (
                    <Text key={index} style={styles.heading2}>
                      {block.text}
                    </Text>
                  );
                }
                if (block.type === "h3") {
                  return (
                    <Text key={index} style={styles.heading3}>
                      {block.text}
                    </Text>
                  );
                }
                if (block.type === "li") {
                  return (
                    <View key={index} style={styles.bulletRow}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{block.text}</Text>
                    </View>
                  );
                }
                return (
                  <Text key={index} style={styles.paragraph}>
                    {block.text}
                  </Text>
                );
              })}
            </View>

            {/* Bottom Book Pickup CTA Card */}
            <TouchableOpacity
              style={styles.ctaCard}
              activeOpacity={0.9}
              onPress={() => router.push("/(customer)/book-pickup" as any)}
            >
              <View style={styles.ctaContent}>
                <Text style={styles.ctaBadge}>DOORSTEP SERVICE</Text>
                <Text style={styles.ctaTitle}>Experience Expert Care</Text>
                <Text style={styles.ctaDesc}>
                  Schedule a fast pickup and let our garment experts handle the rest.
                </Text>
              </View>
              <View style={styles.ctaButton}>
                <Text style={styles.ctaButtonText}>Book Pickup</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const makeStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    topNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.background,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.card,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    topNavTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 12,
      fontWeight: "500",
    },
    scrollContent: {
      paddingTop: 14,
    },
    imageCard: {
      marginHorizontal: 16,
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      aspectRatio: 16 / 9,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 10,
      elevation: 4,
    },
    heroImage: {
      width: "100%",
      height: "100%",
    },
    contentContainer: {
      paddingHorizontal: 18,
      paddingTop: 18,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    dateBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(0, 117, 88, 0.15)" : "rgba(0, 117, 88, 0.08)",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    dateText: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "700",
    },
    authorBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F3F4F6",
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    authorText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: "600",
    },
    title: {
      fontSize: 24,
      fontWeight: "900",
      color: theme.text,
      lineHeight: 32,
      marginBottom: 10,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.textSecondary,
      lineHeight: 22,
      marginBottom: 10,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 18,
    },
    bodyContainer: {
      gap: 14,
    },
    heading2: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.text,
      marginTop: 14,
      marginBottom: 4,
      lineHeight: 24,
    },
    heading3: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
      marginTop: 10,
      marginBottom: 2,
      lineHeight: 22,
    },
    paragraph: {
      fontSize: 15,
      fontWeight: "400",
      color: theme.textSecondary,
      lineHeight: 24,
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingLeft: 4,
    },
    bulletDot: {
      fontSize: 16,
      color: theme.primary,
      marginRight: 8,
      lineHeight: 24,
    },
    bulletText: {
      flex: 1,
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 24,
    },
    ctaCard: {
      marginTop: 32,
      backgroundColor: isDark ? "rgba(0, 117, 88, 0.12)" : "#F0FDF4",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? "rgba(0, 117, 88, 0.3)" : "#BBF7D0",
      padding: 18,
      gap: 14,
    },
    ctaContent: {
      gap: 4,
    },
    ctaBadge: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.2,
      color: theme.primary,
    },
    ctaTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.text,
    },
    ctaDesc: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    ctaButton: {
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    ctaButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
    },
  });
