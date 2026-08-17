import AsyncStorage from "@react-native-async-storage/async-storage";
import messaging from "@react-native-firebase/messaging";
import DeviceInfo from "react-native-device-info";
import { PermissionsAndroid, Platform } from "react-native";
import axios from "axios";
import { BASE_URL } from "../api/client";

const API_URL = "https://staging.shiptos.com";

async function requestPermission(): Promise<boolean> {
  if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  if (Platform.OS === "ios") {
    const authStatus = await messaging().requestPermission();
    console.log("📋 iOS auth status:", authStatus);
    // 1 = AUTHORIZED, 2 = PROVISIONAL, 0 = DENIED
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  return true;
}

export async function registerCustomerPushToken(customerId: string) {
  try {
    const allowed = await requestPermission();
    if (!allowed) {
      console.warn("❌ Notification permission denied");
      return null;
    }

    // iOS: must register before getting tokens
    await messaging().registerDeviceForRemoteMessages();

    // iOS: APNS token must resolve before FCM token
    if (Platform.OS === "ios") {
      let apnsToken = await messaging().getAPNSToken();

      // Retry once if null — APNS can be slow on first launch
      if (!apnsToken) {
        console.warn("⏳ APNS token null, retrying in 3s...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
        apnsToken = await messaging().getAPNSToken();
      }

      if (!apnsToken) {
        console.error(
          "❌ APNS token still null — check:\n" +
          "1. Push Notifications capability in Xcode\n" +
          "2. Background Modes > Remote notifications in Xcode\n" +
          "3. APNs key uploaded in Firebase Console"
        );
        return null;
      }

      console.log("✅ APNS token:", apnsToken);
    }

    const fcmToken = await messaging().getToken();
    if (!fcmToken) {
      console.error("❌ FCM token is null");
      return null;
    }

    console.log("✅ FCM token:", fcmToken);

    const deviceId = await DeviceInfo.getUniqueId();
    await AsyncStorage.setItem("fcmToken", fcmToken);

    await axios.post(`${API_URL}/api/v1/customer/push-tokens/register`, {
      customerId,
      token: fcmToken,
      platform: Platform.OS,
      deviceId,
    });

    console.log("✅ Push token registered for customer:", customerId);

    // Refresh handler
    messaging().onTokenRefresh(async (newToken) => {
      console.log("🔄 FCM token refreshed:", newToken);
      await AsyncStorage.setItem("fcmToken", newToken);
      await axios.post(`${API_URL}/api/v1/customer/push-tokens/register`, {
        customerId,
        token: newToken,
        platform: Platform.OS,
        deviceId,
      });
    });

    return fcmToken;

  } catch (err) {
    console.error("❌ registerCustomerPushToken error:", err);
    return null;
  }
}

export async function unregisterCustomerPushToken() {
  const token = await AsyncStorage.getItem("fcmToken");
  if (!token) return;

  try {
    await axios.post(`${BASE_URL}/api/v1/customer/push-tokens/unregister`, {
      token,
    });
    console.log("✅ Push token unregistered");
  } catch (err) {
    console.error("❌ Unregister error:", err);
  } finally {
    await AsyncStorage.removeItem("fcmToken");
  }
}