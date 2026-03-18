import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NotificationsTopSheet from "@/components/layout/NotificationsTopSheet";
import { useTheme } from "../../../context/ThemeContext";

export default function TabsLayout() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background }, 
      ]}
    >
      {/* TOP BAR */}
     

      {/* TABS */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.card,
            height: 58 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 3,
            borderTopWidth: 1,
            borderTopColor: theme.border,
          },
          tabBarActiveTintColor: theme.primary, 
          tabBarInactiveTintColor: isDark ? "#94a3b8" : "#94a3b8",
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={20}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="orders/index"
          options={{
            title: "Orders",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "receipt" : "receipt-outline"}
                size={20}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile/index"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={20}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* NOTIFICATIOn */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
