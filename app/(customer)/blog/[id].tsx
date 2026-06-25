import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../../context/ThemeContext";

const { width } = Dimensions.get("window");

const BLOG_DATA: Record<string, any> = {
  sneakers: {
    title: "How to Maintain White Sneakers",
    subtitle: "Keep your kicks looking brand new with our easy daily care routine.",
    date: "May 15, 2026",
    author: "DryDash Experts",
    image: "https://customer-app-image.s3.ap-south-1.amazonaws.com/blogs-images/h_shoe.png",
    content: [
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
    content: [
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
    content: [
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
  const { theme, isDark } = useTheme()
  const styles = makeStyles(theme, isDark);
    const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const article = BLOG_DATA[id as string] || BLOG_DATA["sneakers"];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: article.image }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={[theme.card, "transparent", theme.card]}
            locations={[0, 0.3, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          
          {/* Back Button */}
          <TouchableOpacity 
            style={[styles.backButton, { top: insets.top + 10 }]} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{article.date}</Text>
            <View style={styles.metaDot} />
            <Text style={styles.metaText}>{article.author}</Text>
          </View>
          
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.subtitle}>{article.subtitle}</Text>
          
          <View style={styles.divider} />

          <View style={styles.bodyContainer}>
            {article.content.map((block: any, index: number) => {
              if (block.type === "h2") {
                return <Text key={index} style={styles.heading2}>{block.text}</Text>;
              }
              if (block.type === "p") {
                return <Text key={index} style={styles.paragraph}>{block.text}</Text>;
              }
              return null;
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  imageContainer: {
    width: width,
    height: width * 1.1,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.card,
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(10px)",
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 60,
    marginTop: -40, // overlap the image slightly
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  metaText: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.primary,
    marginHorizontal: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.text,
    lineHeight: 34,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#9CCFC0",
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: theme.card,
    marginVertical: 24,
  },
  bodyContainer: {
    gap: 16,
  },
  heading2: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.text,
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 15,
    fontWeight: "400",
    color: "#BACBC0",
    lineHeight: 24,
  },
});
