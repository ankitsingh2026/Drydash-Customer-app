import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ChatProvider } from "@/context/ChatContext";
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

import { useTheme } from "../theme/useTheme";

function RootLayoutNav() {
  const { colors, isDark } = useTheme();
  
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>                        
        <AlertProvider>                          
          <AuthProvider>
            <NotificationProvider>
              <ChatProvider>
                <AddressProvider>
                  <CartProvider>
                    <SlotSocketProvider>
                      <RootLayoutNav />
                    </SlotSocketProvider>
                  </CartProvider>
                </AddressProvider>
              </ChatProvider>
            </NotificationProvider>
          </AuthProvider>
        </AlertProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
