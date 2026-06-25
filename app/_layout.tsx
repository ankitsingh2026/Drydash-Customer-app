import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";

import { AddressProvider } from "@/context/AddressContext";
import { setupInterceptors } from "../lib/api/interceptors";
import { SlotSocketProvider } from "../context/SlotSocketContext";
import { AlertProvider } from "@/components/Customalert";
import messaging from "@react-native-firebase/messaging";


setupInterceptors();

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("[FCM] Background message received:", remoteMessage);
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
    <AlertProvider>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <AddressProvider>
              <CartProvider>
                <SlotSocketProvider>
                  <StatusBar style="light" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: "#0B1F1A" },
                    }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(customer)" />
                  </Stack>
                </SlotSocketProvider>
              </CartProvider>
            </AddressProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
      </AlertProvider>
    </SafeAreaProvider>
  );
}
