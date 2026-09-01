import { router } from "expo-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Linking,
  AppState,
  StatusBar,
  Image,
} from "react-native";
import { gsap } from "gsap";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";
import { checkUpdate } from "@/utils/versionCheck";
import UpdateModal from "@/components/UpdateModal";
import { useAuthContext } from "@/context/AuthContext";
import { requestAppPermissionsOnStart } from "@/lib/notifications/fcm";

type UpdateResult = {
  type: "force" | "optional" | "none";
  message?: string;
  storeUrl?: string;
};
type UpdateType = "force" | "optional";

export default function AnimatedSplashScreen() {
  const { user } = useAuthContext();
  const [updateType, setUpdateType] = useState<UpdateType | null>(null);
  const updateTypeRef = useRef<UpdateType | null>(null);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  // Animation timeline references
  const idleTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const exitTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Navigation tracking
  const hasNavigatedRef = useRef(false);
  const mountTimeRef = useRef(Date.now());
  const deepLinkRouteRef = useRef<string | null>(null);

  // ── Reanimated Shared Values Driven by GSAP ───────────────────────────
  const logoScale = useSharedValue(1);
  const logoOpacity = useSharedValue(1);
  const containerOpacity = useSharedValue(1);

  // ── Clean up all GSAP timelines & timers ───────────────────────────────
  const killAllAnimations = useCallback(() => {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    idleTimelineRef.current?.kill();
    idleTimelineRef.current = null;
    exitTimelineRef.current?.kill();
    exitTimelineRef.current = null;
  }, []);

  // ── Trigger Zoom Out to Large & Redirect ──────────────────────────────
  const triggerExitAnimation = useCallback((targetRoute: string) => {
    if (hasNavigatedRef.current || updateTypeRef.current === "force") return;

    // Stop idle animation
    idleTimelineRef.current?.kill();
    idleTimelineRef.current = null;

    // Master GSAP Exit Timeline (Logo Zoom Out to Large)
    const exitTl = gsap.timeline({
      onComplete: () => {
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          router.replace(targetRoute as any);
        }
      },
    });
    exitTimelineRef.current = exitTl;

    // 1. Quick anticipatory recoil
    exitTl
      .to(
        logoScale,
        {
          value: 0.92,
          duration: 0.15,
          ease: "power2.out",
        },
        0
      )
      // 2. Zoom Out to Large (Expand huge to fill screen)
      .to(
        logoScale,
        {
          value: 28,
          duration: 0.55,
          ease: "power3.in",
        },
        0.15
      )
      // 3. Fade container at the end of the expansion
      .to(
        containerOpacity,
        {
          value: 0,
          duration: 0.18,
          ease: "power2.out",
        },
        0.52
      );
  }, []);

  // ── Idle GSAP Animation ────────────────────────────────────────────────
  useEffect(() => {
    // Seamless handoff from native splash to animated splash
    SplashScreen.hideAsync().catch(() => { });

    mountTimeRef.current = Date.now();
    hasNavigatedRef.current = false;

    // Reset shared values
    logoScale.value = 1;
    logoOpacity.value = 1;
    containerOpacity.value = 1;

    // Gentle breathing idle animation
    const idleTl = gsap.timeline({ repeat: -1, yoyo: true });
    idleTimelineRef.current = idleTl;

    idleTl.to(
      logoScale,
      {
        value: 1.04,
        duration: 1.0,
        ease: "sine.inOut",
      },
      0
    );

    return () => {
      killAllAnimations();
    };
  }, [killAllAnimations]);

  // ── Deep Links, Permissions, & Version Check ───────────────────────────
  useEffect(() => {
    let appState = AppState.currentState;

    const extractRefCode = (url: string): string | null => {
      try {
        const match = url.match(/[?&](ref|referralCode|code)=([^&]+)/i);
        if (match && match[2]) {
          return decodeURIComponent(match[2]).trim().toUpperCase();
        }
        if (url.includes("/share/")) {
          const parts = url.split("/share/");
          if (parts[1])
            return parts[1].split("?")[0].split("/")[0].trim().toUpperCase();
        }
        if (url.includes("/r/")) {
          const parts = url.split("/r/");
          if (parts[1])
            return parts[1].split("?")[0].split("/")[0].trim().toUpperCase();
        }
      } catch (e) {
        console.error("Error extracting ref code:", e);
      }
      return null;
    };

    const handleDeepLink = (url: string) => {
      const refCode = extractRefCode(url);
      if (refCode) {
        deepLinkRouteRef.current = `/(auth)/auth?ref=${refCode}`;
        return true;
      }
      return false;
    };

    // Cold start deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Background deep link
    const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    const runCheck = async () => {
      try {
        // Request app permissions
        await requestAppPermissionsOnStart();

        if (updateTypeRef.current === "force") return;

        const update: UpdateResult = await Promise.race([
          checkUpdate(),
          new Promise<UpdateResult>((resolve) =>
            setTimeout(() => resolve({ type: "none" }), 1000)
          ),
        ]);

        if (update.type === "force") {
          setStoreUrl(update.storeUrl || null);
          setUpdateType("force");
          updateTypeRef.current = "force";
          return;
        }

        if (update.type === "optional") {
          setStoreUrl(update.storeUrl || null);
          setUpdateType("optional");
          updateTypeRef.current = "optional";
          return;
        }

        if (update.type === "none" && updateTypeRef.current === null) {
          scheduleExitTransition();
        }
      } catch (err) {
        console.log("Splash runCheck error:", err);
        scheduleExitTransition();
      }
    };

    const scheduleExitTransition = () => {
      const elapsed = Date.now() - mountTimeRef.current;
      const MIN_SPLASH_TIME = 500;
      const remainingTime = Math.max(0, MIN_SPLASH_TIME - elapsed);

      if (navTimerRef.current) clearTimeout(navTimerRef.current);

      navTimerRef.current = setTimeout(() => {
        const destination =
          deepLinkRouteRef.current ||
          (user ? "/(customer)/(tabs)/home" : "/(auth)/auth");
        triggerExitAnimation(destination);
      }, remainingTime);
    };

    runCheck();

    // Re-check if app resumes
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.match(/inactive|background/) && nextState === "active") {
        runCheck();
      }
      appState = nextState;
    });

    return () => {
      subscription.remove();
      linkingSubscription.remove();
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
    };
  }, [triggerExitAnimation, user]);

  // ── Reanimated Style Mappings ──────────────────────────────────────────
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        {/* Centered Green Circular Logo matching Image 1 */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require("@/assets/images/splash-icon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>

      {/* Force / Optional Update Modal */}
      <UpdateModal
        visible={!!updateType}
        type={updateType}
        storeUrl={storeUrl}
        onLater={() => {
          setUpdateType(null);
          updateTypeRef.current = null;
          const destination =
            deepLinkRouteRef.current ||
            (user ? "/(customer)/(tabs)/home" : "/(auth)/auth");
          triggerExitAnimation(destination);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 200,
    height: 200,
  },
});