import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { getAllBlogsApi } from "@/features/content/content.api";
import { BlogItem } from "@/features/content/content.types";

const { width } = Dimensions.get("window");

const FALLBACK_BLOGS: BlogItem[] = [
  {
    _id: "6a8d66db819b807b0e77ca78",
    title: "Deep Clean Your Sofa at Home",
    mediaUrl: "https://shiptos-general.s3.ap-south-1.amazonaws.com/blogs/1787651799939_sofa-blog.png",
    mediaType: "image",
    brief: "Your sofa collects dust, crumbs, stains, and everyday dirt. Follow this simple sofa-care guide to freshen up your furniture and keep your living space clean and comfortable.",
    slug: "deep-clean-your-sofa-at-home",
    author: "DryDash Experts",
    createdAt: "2026-08-25T09:56:43.158Z",
  },
  {
    _id: "6a8d6629819b807b0e77ca44",
    title: "The Art of Caring for Silk",
    mediaUrl: "https://shiptos-general.s3.ap-south-1.amazonaws.com/blogs/1787651622087_silk-blog.png",
    mediaType: "image",
    brief: "Silk is beautiful, delicate, and luxurious. Discover the right ways to clean, dry, store, and protect your silk garments so they maintain their softness, shine, and shape.",
    slug: "the-art-of-caring-for-silk",
    author: "DryDash Experts",
    createdAt: "2026-08-25T09:53:45.832Z",
  },
  {
    _id: "6a8d655d819b807b0e77c9d8",
    title: "How to Maintain White Sneakers",
    mediaUrl: "https://shiptos-general.s3.ap-south-1.amazonaws.com/blogs/1787651406906_shoe-blog.png",
    mediaType: "image",
    brief: "Keep your white sneakers looking fresh and new with simple cleaning, drying, and storage techniques. Learn how to remove everyday dirt and stains without damaging your favorite pair.",
    slug: "how-to-maintain-white-sneakers",
    author: "DryDash Experts",
    createdAt: "2026-08-25T09:50:21.245Z",
  },
  {
    _id: "6a8d5787819b807b0e77a309",
    title: "The Essential Guide to Professional Shoe Dry Cleaning & Spa Care",
    mediaUrl: "https://shiptos-general.s3.ap-south-1.amazonaws.com/blogs/1787647865391_dry-clean-blog.png",
    mediaType: "image",
    brief: "Tossing premium sneakers or leather shoes into the washing machine ruins them. Discover how professional shoe dry cleaning restores delicate fabrics, eliminates deep odors, and extends footwear lifespan.",
    slug: "the-essential-guide-to-professional-shoe-dry-cleaning-spa-care",
    author: "DryDash Experts",
    createdAt: "2026-08-25T08:51:19.562Z",
  },
];

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

export default function AllBlogsScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = makeStyles(theme, isDark);

  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlogs = useCallback(async () => {
    try {
      const res = await getAllBlogsApi();
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setBlogs(res.data);
      } else {
        setBlogs(FALLBACK_BLOGS);
      }
    } catch (error) {
      console.log("Error fetching blogs:", error);
      setBlogs(FALLBACK_BLOGS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBlogs();
  }, [fetchBlogs]);

  const handleBlogPress = (slug: string) => {
    router.push(`/(customer)/blog/${slug}` as any);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Learn & Explore</Text>
          <Text style={styles.headerSubtitle}>Expert care guides & insights</Text>
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
        >
          <View style={styles.blogsList}>
            {blogs.map((blog, index) => {
              const imageUri =
                blog.mediaUrl ||
                "https://customer-app-image.s3.ap-south-1.amazonaws.com/blogs-images/h_shoe.png";
              const dateText = formatDate(blog.createdAt);
              const authorText = blog.author || "DryDash";
              const briefText = blog.brief || blog.subtitle || "";

              return (
                <TouchableOpacity
                  key={blog._id || blog.slug || String(index)}
                  style={styles.blogCard}
                  activeOpacity={0.88}
                  onPress={() => handleBlogPress(blog.slug)}
                >
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.cardImage} resizeMode="cover" />
                  </View>

                  <View style={styles.cardContent}>
                    {/* Meta Row */}
                    <View style={styles.metaRow}>
                      <View style={styles.dateBadge}>
                        <Ionicons name="calendar-outline" size={12} color={theme.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.dateText}>{dateText}</Text>
                      </View>
                      <View style={styles.authorBadge}>
                        <Text style={styles.authorText}>By {authorText}</Text>
                      </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {blog.title}
                    </Text>

                    {/* Excerpt Brief */}
                    {briefText ? (
                      <Text style={styles.cardBrief} numberOfLines={2}>
                        {briefText}
                      </Text>
                    ) : null}

                    {/* Action Row */}
                    <View style={styles.cardFooter}>
                      <Text style={styles.readMoreText}>Read full article</Text>
                      <Ionicons name="arrow-forward" size={16} color={theme.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.background,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 12,
    },
    headerTextWrap: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.2,
    },
    headerSubtitle: {
      fontSize: 12,
      fontWeight: "500",
      color: theme.textSecondary,
      marginTop: 2,
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
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    blogsList: {
      gap: 16,
    },
    blogCard: {
      backgroundColor: theme.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.35 : 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    imageContainer: {
      width: "100%",
      height: 180,
      backgroundColor: theme.surface,
    },
    cardImage: {
      width: "100%",
      height: "100%",
    },
    cardContent: {
      padding: 16,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    dateBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(0, 117, 88, 0.15)" : "rgba(0, 117, 88, 0.08)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    dateText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.primary,
    },
    authorBadge: {
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F3F4F6",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    authorText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: theme.text,
      lineHeight: 24,
      marginBottom: 6,
    },
    cardBrief: {
      fontSize: 13,
      fontWeight: "400",
      color: theme.textSecondary,
      lineHeight: 19,
      marginBottom: 14,
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    readMoreText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.primary,
    },
  });
