import { Platform, PermissionsAndroid } from "react-native";
import * as Location from "expo-location";

import {
  getMessaging,
  getToken,
  registerDeviceForRemoteMessages,
  requestPermission,
  AuthorizationStatus,
  onTokenRefresh,
} from "@react-native-firebase/messaging";

import { getApp } from "@react-native-firebase/app";

import DeviceInfo from "react-native-device-info";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../api/client";


const app = getApp();
export async function requestAppPermissionsOnStart() {
  try {
    // 1. Check & Request Location Permission if not granted
    const { status: currentLocStatus } = await Location.getForegroundPermissionsAsync();
    if (currentLocStatus !== "granted") {
      console.log("📍 Location permission not granted. Requesting on App Start...");
      const { status: newLocStatus } = await Location.requestForegroundPermissionsAsync();
      console.log("📍 Location permission result on App Start:", newLocStatus);
    }
  } catch (locErr) {
    console.error("App Start Location permission error:", locErr);
  }

  try {
    // 2. Check & Request Notification Permission if not granted
    if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
      const hasNotif = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (!hasNotif) {
        console.log("🔔 Notification permission not granted. Requesting on App Start...");
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      }
    } else if (Platform.OS === "ios") {
      const authStatus = await requestPermission(messaging);
      if (
        authStatus !== AuthorizationStatus.AUTHORIZED &&
        authStatus !== AuthorizationStatus.PROVISIONAL
      ) {
        console.log("🔔 Notification permission not granted on iOS. Requesting on App Start...");
        await requestPermission(messaging);
      }
    }
  } catch (notifErr) {
    console.error("App Start Notification permission error:", notifErr);
  }
}

async function requestNotificationPermission() {
  // Request Location Permission simultaneously during Auth/Signup
  try {
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    console.log("Location permission status on signup/auth:", locStatus);
  } catch (locErr) {
    console.log("Location permission request error:", locErr);
  }

  // Android 13+
  if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );

    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }
  }

  // iOS
  if (Platform.OS === "ios") {
    const authStatus = await requestPermission(messaging);

    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      return false;
    }
  }

  return true;
}

export async function registerCustomerPushToken(
  customerId: string
) {
  try {
    const allowed = await requestNotificationPermission();

    if (!allowed) {
      return null;
    }

    // Register device
    await registerDeviceForRemoteMessages(messaging);

    // Get FCM token
    const token = await getToken(messaging);

    const deviceId = await DeviceInfo.getUniqueId();

    // Save locally
    await AsyncStorage.setItem("fcmToken", token);

    // Send to backend
    await axios.post(
      `${BASE_URL}/api/v1/customer/push-tokens/register`,
      {
        customerId,
        token,
        platform: Platform.OS,
        deviceId,
      }
    );

    // Auto refresh token
    onTokenRefresh(messaging, async (newToken) => {
      try {
        await AsyncStorage.setItem(
          "fcmToken",
          newToken
        );

        await axios.post(
          `${BASE_URL}/api/v1/customer/push-tokens/register`,
          {
            customerId,
            token: newToken,
            platform: Platform.OS,
            deviceId,
          }
        );

        console.log("FCM token refreshed");
      } catch (err) {
        console.log(
          "Token refresh register error:",
          err
        );
      }
    });

    return token;
  } catch (error) {
    console.log(
      "Register push token error:",
      error
    );
    return null;
  }
}

export async function unregisterCustomerPushToken() {
  try {
    const token = await AsyncStorage.getItem(
      "fcmToken"
    );

    if (!token) return;

    await axios.post(
      `${BASE_URL}/api/v1/customer/push-tokens/unregister`,
      {
        token,
      }
    );

    await AsyncStorage.removeItem("fcmToken");
  } catch (error) {
    console.log(
      "Unregister push token error:",
      error
    );
  }
}