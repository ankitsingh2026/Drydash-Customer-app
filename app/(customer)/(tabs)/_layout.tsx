import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import NotificationsTopSheet from "../../../components/layout/NotificationsTopSheet";
import { TabBar } from "../../../components/layout/TabBar";

export default function TabsLayout() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <TabBar
        onOpenNotifications={() => setOpen(true)}
        onWalletPress={() => router.push("/(customer)/wallet")}
      />


      {/* TABS */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#0B1F1A",
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom,
            paddingTop: 6,
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: "#34F5C5",
          tabBarInactiveTintColor: "#94a3b8",
          tabBarLabelStyle: {
            fontSize: 11,
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
                size={24}
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
                size={24}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="chat/index"
          options={{
            title: "Chat",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "chatbubble" : "chatbubble-outline"}
                size={24}
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
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>

      {/* NOTIFICATION SLIDER */}
      <NotificationsTopSheet
        visible={open}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
