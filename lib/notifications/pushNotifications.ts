import { Platform, PermissionsAndroid } from "react-native";
import messaging from "@react-native-firebase/messaging";
import DeviceInfo from "react-native-device-info";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../api/client";


async function requestPermission() {
  if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) return false;
  }

  if (Platform.OS === "ios") {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) return false;
  }

  return true;
}

export async function registerCustomerPushToken(customerId: string) {
  const allowed = await requestPermission();
  if (!allowed) return null;

  await messaging().registerDeviceForRemoteMessages();
  const token = await messaging().getToken();
  const deviceId = await DeviceInfo.getUniqueId();

  await AsyncStorage.setItem("fcmToken", token);

  await axios.post(`${BASE_URL}/api/v1/customer/push-tokens/register`, {
    customerId,
    token,
    platform: Platform.OS,
    deviceId,
  });

  // Set up token refresh listener to keep backend in sync
  messaging().onTokenRefresh(async (newToken) => {
    try {
      await AsyncStorage.setItem("fcmToken", newToken);
      await axios.post(`${BASE_URL}/api/v1/customer/push-tokens/register`, {
        customerId,
        token: newToken,
        platform: Platform.OS,
        deviceId,
      });
      console.log("FCM push token auto-refreshed and saved to backend");
    } catch (err) {
      console.log("FCM push token auto-refresh failed:", err);
    }
  });

  return token;
}

export async function unregisterCustomerPushToken() {
  const token = await AsyncStorage.getItem("fcmToken");
  if (!token) return;

  try {
    await axios.post(`${BASE_URL}/api/v1/customer/push-tokens/unregister`, {
      token,
    });
  } finally {
    await AsyncStorage.removeItem("fcmToken");
  }
}