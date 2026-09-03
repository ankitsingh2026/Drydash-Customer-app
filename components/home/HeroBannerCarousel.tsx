import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SvgUri } from "react-native-svg";
import { DotLottie } from "@lottiefiles/dotlottie-react-native";
import { ContentHeroBannerItem, ContentHeroSection } from "@/features/content/content.types";
import { useTheme } from "../../context/ThemeContext";

interface HeroBannerCarouselProps {
  hero?: ContentHeroSection;
  lottieKey?: string | number;
}

const DEFAULT_LOTTIE = require("../../assets/Anim_Banner.lottie");
const AUTO_SCROLL_INTERVAL_MS = 4000;

export default function HeroBannerCarousel({ hero, lottieKey = "" }: HeroBannerCarouselProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const flatListRef = useRef<FlatList<ContentHeroBannerItem>>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Compute slide width based on screen width minus 32px (16px padding on each side)
  const windowWidth = Dimensions.get("window").width;
  const slideWidth = useMemo(() => Math.max(windowWidth - 32, 280), [windowWidth]);

  // Extract valid banner slides
  const slides = useMemo<ContentHeroBannerItem[]>(() => {
    if (!hero) {
      return [{ title: "Default Banner", mediaUrl: "", mediaType: "lottie" }];
    }

    if (Array.isArray(hero.banners) && hero.banners.length > 0) {
      const activeBanners = hero.banners.filter(
        (b) => b.isActive !== false && b.mediaUrl && b.mediaUrl.trim().length > 0
      );
      if (activeBanners.length > 0) return activeBanners;
    }

    // Fallback to legacy single banner
    if (hero.mediaUrl && hero.mediaUrl.trim().length > 0) {
      return [
        {
          title: hero.title || "Banner",
          mediaUrl: hero.mediaUrl.trim(),
          mediaType: hero.mediaType || "lottie",
          link: hero.link || "",
          isActive: hero.isActive !== false,
        },
      ];
    }

    // Default bundled fallback
    return [{ title: "Default Banner", mediaUrl: "", mediaType: "lottie" }];
  }, [hero]);

  const hasMultiple = slides.length > 1;

  // Auto-scroll loop (moves from right to left smoothly)
  useEffect(() => {
    if (!hasMultiple || isInteracting) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % slides.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hasMultiple, isInteracting, slides.length]);

  const handlePress = useCallback(
    (item: ContentHeroBannerItem) => {
      const link = item?.link?.trim();
      if (!link) return;
      if (link.startsWith("http://") || link.startsWith("https://")) {
        Linking.openURL(link);
      } else {
        router.push(link as any);
      }
    },
    [router]
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / slideWidth);
      if (index >= 0 && index < slides.length) {
        setActiveIndex(index);
      }
    },
    [slideWidth, slides.length]
  );

  const renderBannerItem = useCallback(
    ({ item, index }: { item: ContentHeroBannerItem; index: number }) => {
      const mediaUrl = item.mediaUrl?.trim() || "";
      const mediaType =
        item.mediaType?.toLowerCase() ||
        (mediaUrl.endsWith(".lottie") || mediaUrl.endsWith(".json")
          ? "lottie"
          : "image");
      const isLottie =
        mediaType === "lottie" ||
        mediaUrl.endsWith(".lottie") ||
        mediaUrl.endsWith(".json") ||
        !mediaUrl;
      const isSvg = mediaUrl.endsWith(".svg") || mediaUrl.includes(".svg");

      return (
        <TouchableOpacity
          activeOpacity={item.link ? 0.88 : 1}
          onPress={() => handlePress(item)}
          style={[styles.slideContainer, { width: slideWidth }]}
        >
          <View style={styles.mediaWrapper}>
            {isLottie ? (
              <DotLottie
                key={`${lottieKey}-${index}-${mediaUrl || "default"}`}
                source={mediaUrl ? { uri: mediaUrl } : DEFAULT_LOTTIE}
                autoplay
                loop
                style={styles.fullMedia}
              />
            ) : isSvg ? (
              <SvgUri uri={mediaUrl} width="100%" height="100%" />
            ) : (
              <Image
                source={{ uri: mediaUrl }}
                style={styles.fullMedia}
                resizeMode="cover"
              />
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [slideWidth, lottieKey, handlePress]
  );

  return (
    <View style={styles.carouselWrapper}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item, index) => `${item._id || item.mediaUrl || "banner"}-${index}`}
        renderItem={renderBannerItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        onScrollBeginDrag={() => setIsInteracting(true)}
        onScrollEndDrag={() => setIsInteracting(false)}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
        style={{ width: slideWidth }}
        contentContainerStyle={{ alignItems: "center" }}
      />

      {/* Pagination Dots (only if more than 1 banner) */}
      {hasMultiple && (
        <View style={styles.dotsContainer}>
          {slides.map((_, i) => {
            const isActive = i === activeIndex;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  isActive
                    ? [styles.activeDot, { backgroundColor: theme.primary || "#E11D48" }]
                    : styles.inactiveDot,
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carouselWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 6,
  },
  slideContainer: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  fullMedia: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: "#D1D5DB",
    opacity: 0.7,
  },
});
