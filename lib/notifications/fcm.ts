import { Platform, PermissionsAndroid } from "react-native";

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

const API_URL = "https://api.shiptos.com";

const app = getApp();
const messaging = getMessaging(app);

async function requestNotificationPermission() {
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
      `${API_URL}/api/v1/customer/push-tokens/register`,
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
          `${API_URL}/api/v1/customer/push-tokens/register`,
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
      `${API_URL}/api/v1/customer/push-tokens/unregister`,
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