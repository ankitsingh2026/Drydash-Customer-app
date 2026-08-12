import { useTheme } from "@/context/ThemeContext";
import { useFocusEffect, useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useCallback, useEffect } from "react";
import {
  AppState,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const FEATURE_VIDEO = {
  title: "See How DryDash Works",
  subtitle: "Watch our premium cleaning process",
  duration: "1:20",
  video: {
    uri: "https://customer-app-image.s3.ap-south-1.amazonaws.com/home-videos/home-videos.mp4",
  },
};

const ARTICLES = [
  {
    key: "sneakers",
    title: "How to maintain white sneakers",
    subtitle: "Keep your kicks looking brand new with...",
    image: {
      uri: "https://customer-app-image.s3.ap-south-1.amazonaws.com/blogs-images/h_shoe.png",
    },
  },
  {
    key: "silk",
    title: "The Art of Caring for Silk",
    subtitle: "Gentle techniques for delicate fabrics...",
    image: {
      uri: "https://customer-app-image.s3.ap-south-1.amazonaws.com/blogs-images/h_suit.png",
    },
  },
  {
    key: "sofa",
    title: "Deep Clean Your Sofa at Home",
    subtitle: "Step-by-step guide to sofa care...",
    image: {
      uri: "https://customer-app-image.s3.ap-south-1.amazonaws.com/blogs-images/h_sofa.png",
    },
  },
];

export default function LearnExploreSection() {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme, isDark);
  const router = useRouter();

  // muted, looping, no controls — background-style preview
  const player = useVideoPlayer(FEATURE_VIDEO.video.uri, (player) => {
    player.loop = true;
    player.muted = true;
  });

  // useVideoPlayer releases the native player on unmount. Our focus/
  // AppState listeners can still fire a play()/pause() call right around
  // that moment (losing focus while navigating away, backgrounding while
  // unmounting, etc.), which throws "shared object already released"
  // instead of failing silently. These wrappers swallow that specific
  // race instead of crashing the screen.
  const safePlay = useCallback(() => {
    try {
      player.play();
    } catch {
      // player already released — nothing to do
    }
  }, [player]);

  const safePause = useCallback(() => {
    try {
      player.pause();
    } catch {
      // player already released — nothing to do
    }
  }, [player]);

  // Play only while this screen is focused (tab navigators keep screens
  // mounted, so without this the video keeps decoding even when the user
  // has navigated to a different tab).
  useFocusEffect(
    useCallback(() => {
      safePlay();
      return () => {
        safePause();
      };
    }, [safePlay, safePause])
  );

  // Pause when the app is backgrounded, resume when it comes back —
  // avoids burning CPU/GPU decoding a video nobody can see.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        safePlay();
      } else {
        safePause();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [safePlay, safePause]);

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learn & Explore</Text>
      </View>

      {/* ── Featured Video Card ── */}
      <View style={styles.videoCard}>
        <VideoView
          player={player}
          style={styles.videoThumbnail}
          contentFit="cover"
          nativeControls={false}
        />
      </View>

      {/* ── Article Cards (horizontal scroll) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.articlesScroll}
        removeClippedSubviews
      >
        {ARTICLES.map((article) => (
          <TouchableOpacity
            key={article.key}
            style={styles.articleCard}
            activeOpacity={0.85}
            onPress={() => router.push(`/(customer)/blog/${article.key}` as any)}
          >
            <View style={styles.imageContainer}>
              <Image
                source={article.image}
                style={styles.articleImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.articleTextWrap}>
              <Text style={styles.articleTitle} numberOfLines={2}>
                {article.title}
              </Text>
              <Text style={styles.articleSubtitle} numberOfLines={1}>
                {article.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.text,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.primary,
  },

  /* Video card */
  videoCard: {
    width: "100%",
    height: 210,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: theme.background,
    justifyContent: "flex-end",
    borderColor: theme.background,
    borderWidth: 1.5,
  },
  videoThumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.card,
  },
  playButtonWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -28,
    marginLeft: -28,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  videoTextWrap: {
    padding: 14,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.text,
    marginBottom: 3,
  },
  videoSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.textSecondary,
  },
  durationBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    backgroundColor: theme.card,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.card,
  },
  durationText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.text,
  },

  /* Article cards */
  articlesScroll: {
    gap: 10,
    paddingRight: 4,
    marginBottom: 14,
  },
  articleCard: {
    width: width * 0.6,
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
  },
  imageContainer: {
    margin: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: theme.background,
    borderColor: theme.card,
  },
  articleImage: {
    width: "100%",
    height: 120,
  },
  articleTextWrap: {
    padding: 10,
  },
  articleTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.text,
    lineHeight: 18,
    marginBottom: 3,
  },
  articleSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: theme.textSecondary,
  },
});