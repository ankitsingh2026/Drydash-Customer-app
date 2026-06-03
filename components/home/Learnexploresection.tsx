import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useRef } from "react";
import {
  Animated,
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
    uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/app-videos/drydash_vid1.mp4",
  },
};

const ARTICLES = [
  {
    key: "sneakers",
    title: "How to maintain white sneakers",
    subtitle: "Keep your kicks looking brand new with...",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/h_shoe.png",
    },
  },
  {
    key: "silk",
    title: "The Art of Caring for Silk",
    subtitle: "Gentle techniques for delicate fabrics...",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/h_suit.png",
    },
  },
  {
    key: "sofa",
    title: "Deep Clean Your Sofa at Home",
    subtitle: "Step-by-step guide to sofa care...",
    image: {
      uri: "https://drydash-app-images.s3.ap-south-1.amazonaws.com/hero-screen/h_sofa.png",
    },
  },
];

const PILLS = [
  { key: "eco", icon: "leaf-outline" as const, label: "Eco-friendly cleaning" },
  { key: "pickup", icon: "cube-outline" as const, label: "Doorstep pickup" },
];

export default function LearnExploreSection() {
  const router = useRouter();
  const playScale = useRef(new Animated.Value(1)).current;

  const onPlayPressIn = () => {
    Animated.spring(playScale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const onPlayPressOut = () => {
    Animated.spring(playScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);


const player = useVideoPlayer(FEATURE_VIDEO.video.uri);

useEffect(() => {
  if (!player) return;

  player.loop = true;
  player.muted = true;

  const playVideo = async () => {
    try {
      await player.play();
    } catch (e) {
      console.log("Video play error:", e);
    }
  };

  const timeout = setTimeout(playVideo, 300);

  return () => {
    clearTimeout(timeout);
    // ❌ DO NOTHING HERE (no pause)
  };
}, [player]);


  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Learn & Explore</Text>
        {/* <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity> */}
      </View>

      {/* ── Featured Video Card ── */}

      <View style={styles.videoCard} pointerEvents="none">
        <VideoView
          player={player}
          style={styles.videoThumbnail}
          contentFit="cover"
        />
        {/* Dark overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Play button */}
        {/* <Animated.View
          style={[styles.playButtonWrap, { transform: [{ scale: playScale }] }]}
        >
          <View style={styles.playButton}>
            <Ionicons
              name="play"
              size={26}
              color="#000"
              style={{ marginLeft: 3 }}
            />
          </View>
        </Animated.View> */}

        {/* Text */}
        <View style={styles.videoTextWrap}>
          {/* <Text style={styles.videoTitle}>{FEATURE_VIDEO.title}</Text> */}
          {/* <Text style={styles.videoSubtitle}>{FEATURE_VIDEO.subtitle}</Text> */}
        </View>

        {/* Duration badge */}
        {/* <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{FEATURE_VIDEO.duration}</Text>
        </View> */}
      </View>

      {/* ── Article Cards (horizontal scroll) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.articlesScroll}
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

const styles = StyleSheet.create({
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
    color: "#FFFFFF",
  },
  viewAll: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00C896",
  },

  /* Video card */
  videoCard: {
    width: "100%",
    height: 210,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: "#0D1F1C",
    justifyContent: "flex-end",
    borderColor: "#13574f",
    borderWidth: 1.5,
  },
  videoThumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 20, 14, 0.55)",
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
    backgroundColor: "#00C896",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00C896",
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
    color: "#FFFFFF",
    marginBottom: 3,
  },
  videoSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CCFC0",
  },
  durationBadge: {
    position: "absolute",
    bottom: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#1A3330",
  },
  durationText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* Article cards */
  articlesScroll: {
    gap: 10,
    paddingRight: 4,
    marginBottom: 14,
  },
  articleCard: {
    width: width * 0.6,
    backgroundColor: "#0D1F1C",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1A3330",
    overflow: "hidden",
  },
  imageContainer: {
    margin: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#0A0F0E",
    borderColor: "#1F3D38",
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
    color: "#FFFFFF",
    lineHeight: 18,
    marginBottom: 3,
  },
  articleSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
  },
});
