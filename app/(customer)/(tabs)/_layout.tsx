import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "../../../context/ThemeContext";

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const activeGreen = "#33F0A2";
  const darkBar = "#071F19";
  const inactive = "#6B8A82";
  const labelColor = "#C7D6D0";

  return (
    <View style={[styles.container, { backgroundColor: "#031612" }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: darkBar,
              height: 74 + insets.bottom,
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ],
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabItem, focused && { backgroundColor: activeGreen }]}>
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={18}
                  color={focused ? "#062019" : inactive}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: focused ? "#062019" : labelColor },
                    !focused && { opacity: 0.72 },
                  ]}
                >
                  HOME
                </Text>
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="orders/index"
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabItem, focused && { backgroundColor: activeGreen }]}>
                <Ionicons
                  name={focused ? "receipt" : "receipt-outline"}
                  size={18}
                  color={focused ? "#062019" : inactive}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: focused ? "#062019" : labelColor },
                    !focused && { opacity: 0.72 },
                  ]}
                >
                  ORDERS
                </Text>
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="profile/index"
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[styles.tabItem, focused && { backgroundColor: activeGreen }]}>
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={18}
                  color={focused ? "#062019" : inactive}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: focused ? "#062019" : labelColor },
                    !focused && { opacity: 0.72 },
                  ]}
                >
                  PROFILE
                </Text>
              </View>
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  tabBar: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 0,
    borderTopWidth: 0,
    borderRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 10,
    elevation: 14,
    shadowColor: "#000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },

  tabItem: {
    minWidth: 72,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 2,
  },

  tabLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  fabWrap: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 50,
  },

  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#33F0A2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#33F0A2",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});