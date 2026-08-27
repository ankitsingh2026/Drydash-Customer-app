import { router } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Image, Platform, StyleSheet, Text, View, Linking, Alert, AppState } from "react-native";
import {
  PERMISSIONS,
  request
} from "react-native-permissions";
import { checkUpdate } from "@/utils/versionCheck";
import UpdateModal from "@/components/UpdateModal";
import { useTheme } from "@/theme/useTheme";
import { requestAppPermissionsOnStart } from "@/lib/notifications/fcm";

type UpdateResult = {
  type: "force" | "optional" | "none";
  message?: string;
  storeUrl?: string;
};
type UpdateType = "force" | "optional";

export default function SplashScreen() {
  const { colors } = useTheme();
  const [updateType, setUpdateType] = useState<UpdateType | null>(null);
  const updateTypeRef = useRef<UpdateType | null>(null);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  useEffect(() => {
    let appState = AppState.currentState;
    let hasDeepLinkNavigated = false;

    const extractRefCode = (url: string): string | null => {
      try {
        // 1. Query parameter search (ref, referralCode, code)
        const match = url.match(/[?&](ref|referralCode|code)=([^&]+)/i);
        if (match && match[2]) {
          return decodeURIComponent(match[2]).trim().toUpperCase();
        }
        // 2. Path-based extraction (/share/REF123 or /r/REF123)
        if (url.includes('/share/')) {
          const parts = url.split('/share/');
          if (parts[1]) return parts[1].split('?')[0].split('/')[0].trim().toUpperCase();
        }
        if (url.includes('/r/')) {
          const parts = url.split('/r/');
          if (parts[1]) return parts[1].split('?')[0].split('/')[0].trim().toUpperCase();
        }
      } catch (e) {
        console.error("Error extracting ref code:", e);
      }
      return null;
    };

    const handleDeepLink = (url: string) => {
      console.log("Processing deep link:", url);
      const refCode = extractRefCode(url);
      if (refCode) {
        console.log("✅ Referral code extracted from deep link:", refCode);
        hasDeepLinkNavigated = true;
        router.replace(`/(auth)/auth?ref=${refCode}`);
        return true;
      }
      return false;
    };

    // Handle deep links on cold start
    const handleInitialUrl = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        console.log("Cold start deep link:", url);
        handleDeepLink(url);
      }
    };

    // Handle deep links when app is in background
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      console.log("Deep link received in background:", url);
      handleDeepLink(url);
    });

    handleInitialUrl();

    const runCheck = async () => {
      try {
        // Request Location & Notification permissions on App Start if not granted
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
          return;
        }

        if (update.type === "optional") {
          setStoreUrl(update.storeUrl || null);
          setUpdateType("optional");
          return;
        }

        if (update.type === "none" && updateTypeRef.current === null) {
          if (!hasDeepLinkNavigated) {
            router.replace("/(auth)/auth");
          }
        }
      } catch (err) {
        console.log("Error:", err);
        if (!hasDeepLinkNavigated) {
          router.replace("/(auth)/auth");
        }
      }
    };

    // Initial run
    runCheck();

    // 🔥 Re-run when app comes back
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appState.match(/inactive|background/) && nextState === "active") {
        console.log("App resumed → rechecking version");
        runCheck();
      }
      appState = nextState;
    });

    return () => {
      subscription.remove();
      linkingSubscription.remove();
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
      <UpdateModal
        visible={!!updateType}
        type={updateType}
        storeUrl={storeUrl}
        onLater={() => {
          setUpdateType(null);
          router.replace("/(auth)/auth");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 4,
  },
  slogan: {
    paddingBottom: 20,
    fontSize: 16,
    letterSpacing: 0.8,
  },
});