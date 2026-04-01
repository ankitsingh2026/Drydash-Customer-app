import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";

const ACTIVE_BG = "#33F0A2";
const DARK_BAR = "#071F19";
const INACTIVE_ICON = "#4B7269";
const LABEL_ACTIVE = "#33F0A2";
const LABEL_INACTIVE = "#7FA99E";

const TAB_BAR_HEIGHT = 62;

type TabIconProps = {
  focused: boolean;
  iconFocused: any;
  iconOutline: any;
  label: string;
};

function TabIcon({ focused, iconFocused, iconOutline, label }: TabIconProps) {
  return (
    <View style={styles.tabContent}>
      <Ionicons
        name={focused ? iconFocused : iconOutline}
        size={19}
        color={focused ? ACTIVE_BG : INACTIVE_ICON}
      />
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const bottomOffset = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: TAB_BAR_HEIGHT + insets.bottom, // include safe area
            backgroundColor: DARK_BAR,
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8, // safe area fix
            paddingTop: 6,
          },
          tabBarItemStyle: {
            height: TAB_BAR_HEIGHT,
            justifyContent: "center",
            alignItems: "center",
          },
          tabBarIconStyle: {
            width: "100%",
            height: "100%",
          },
        }}
      >
        <Tabs.Screen
          name="home/index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconFocused="home" iconOutline="home-outline" label="HOME" />
            ),
          }}
        />

        <Tabs.Screen
          name="orders/index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconFocused="receipt" iconOutline="receipt-outline" label="ORDERS" />
            ),
          }}
        />

        <Tabs.Screen
          name="assistant/index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon
                focused={focused}
                iconFocused="sparkles"
                iconOutline="sparkles-outline"
                label="ASSISTANT"
              />
            ),
          }}
        />

        <Tabs.Screen
          name="profile/index"
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} iconFocused="person" iconOutline="person-outline" label="ME" />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: LABEL_INACTIVE,
    includeFontPadding: false,
  },
  labelActive: {
    color: LABEL_ACTIVE,
  },
});