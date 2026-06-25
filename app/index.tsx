import { router } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Image, Platform, StyleSheet, Text, View, Linking, Alert, AppState } from "react-native";
import {
  PERMISSIONS,
  request
} from "react-native-permissions";
import { checkUpdate } from "@/utils/versionCheck";
import UpdateModal from "@/components/UpdateModal";

type UpdateResult = {
  type: "force" | "optional" | "none";
  message?: string;
  storeUrl?: string;
};
type UpdateType = "force" | "optional";

export default function SplashScreen() {

  const [updateType, setUpdateType] = useState<UpdateType | null>(null);
  const updateTypeRef = useRef<UpdateType | null>(null);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);

  useEffect(() => {
    updateTypeRef.current = updateType;
  }, [updateType]);


  const requestPermissions = async () => {
    try {
      if (Platform.OS === "android") {
        const location = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        console.log("Location:", location);
      } else {
        const location = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        console.log("Location:", location);
      }
      
    } catch (error) {
      console.log("Permission error:", error);
    }
  };

  // useEffect(() => {
  //   const init = async () => {
  //     await requestPermissions(); //  ask  for permissions first

  //     setTimeout(() => {
  //       router.replace("/(auth)/auth");
  //     }, 1000);
  //   };

  //   init();
  // }, []);


  useEffect(() => {
    let appState = AppState.currentState;


    const runCheck = async () => {
      try {
        if (updateTypeRef.current === "force") return;

        const update: UpdateResult = await Promise.race([
          checkUpdate(),
          new Promise<UpdateResult>((resolve) =>
            setTimeout(() => resolve({ type: "none" }), 1000)
          ),
        ]);

        //  FORCE
        if (update.type === "force") {
          setStoreUrl(update.storeUrl || null);
          setUpdateType("force");
          return;
        }

        //  OPTIONAL
        if (update.type === "optional") {
          setStoreUrl(update.storeUrl || null);
          setUpdateType("optional");
          return;
        }

        //  NORMAL
        if (update.type === "none" && updateTypeRef.current === null) {
          router.replace("/(auth)/auth");
        }
      } catch (err) {
        console.log("Error:", err);
        router.replace("/(auth)/auth");
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
    };
  }, []);

  useEffect(() => {
    requestPermissions(); // run only 1
  }, []);

  return (
    <View style={styles.container}>
      {/* <Image
        source={require("../assets/images/drydashlogo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.slogan}>Smart Laundry. Seamless Life.</Text> */}
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
    backgroundColor: "#0B1F1A",
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
    color: "#cbd5e1",
    fontSize: 16,
    letterSpacing: 0.8,
  },
});