import remoteConfig from "@react-native-firebase/remote-config";
import DeviceInfo from "react-native-device-info";
import semver from "semver";
import { Platform } from "react-native";

type UpdateResult = {
  type: "force" | "optional" | "none";
  message?: string;
  storeUrl?: string;
};

const cleanVersion = (v: string) => {
  if (!v) return "0.0.0";
  return v.replace("Value:", "").trim();
};

export const checkUpdate = async (): Promise<UpdateResult> => {
  try {
    await remoteConfig().setDefaults({
      android_latest_version: "1.0.0",
      android_min_version: "1.0.0",
      ios_latest_version: "1.0.0",
      ios_min_version: "1.0.0",
      force_update: false,
      update_message: "A new update is available 🚀",
      android_store_url:
        "https://play.google.com/store/apps/details?id=com.drydash.newCustomer",
      ios_store_url:
        "itms-apps://apps.apple.com/in/app/drydash/id6761757578",
    });

    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: 0,
    });

    await remoteConfig().fetchAndActivate();

    // 🔥 Platform-based keys
    const latestKey =
      Platform.OS === "ios"
        ? "ios_latest_version"
        : "android_latest_version";

    const minKey =
      Platform.OS === "ios"
        ? "ios_min_version"
        : "android_min_version";

    const storeKey =
      Platform.OS === "ios"
        ? "ios_store_url"
        : "android_store_url";

    const latest = cleanVersion(
      remoteConfig().getValue(latestKey).asString()
    );

    const min = cleanVersion(
      remoteConfig().getValue(minKey).asString()
    );

    const storeUrl = remoteConfig().getValue(storeKey).asString();

    const force = remoteConfig().getValue("force_update").asBoolean();
    const message = remoteConfig().getValue("update_message").asString();

    const current = cleanVersion(DeviceInfo.getVersion());

    console.log("Version Check:", {
      platform: Platform.OS,
      current,
      latest,
      min,
      force,
    });

    // 🔴 FORCE UPDATE
    if (force || semver.lt(current, min)) {
      return { type: "force", message, storeUrl };
    }

    // 🟡 OPTIONAL UPDATE
    if (semver.lt(current, latest)) {
      return { type: "optional", message, storeUrl };
    }

    return { type: "none" };
  } catch (e) {
    console.log("Version check error:", e);
    return { type: "none" };
  }
};