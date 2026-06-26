import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../../context/ThemeContext";
import { useChat } from "../../../context/ChatContext";

const TAB_BAR_HEIGHT = 62;

type TabIconProps = {
  focused: boolean;
  iconFocused: any;
  iconOutline: any;
  label: string;
  badgeCount?: number;
};

function TabIcon({ focused, iconFocused, iconOutline, label, badgeCount }: TabIconProps) {
  const { colors, isDark, theme } = useTheme();
  const styles = makeStyles(theme, isDark);  

  const activeColor = colors.primary;
  const inactiveColor = isDark ? "#4B7269" : theme.textSecondary;
  const labelActive = colors.primary;
  const labelInactive = isDark ? theme.textSecondary : theme.textSecondary;
  const barBg = isDark ? theme.background : theme.text;

  return (
    <View style={styles.tabContent}>
      <View style={styles.iconWrapper}>
        <Ionicons
          name={focused ? iconFocused : iconOutline}
          size={19}
          color={focused ? activeColor : inactiveColor}
        />
        {badgeCount && badgeCount > 0 ? (
          <View style={[styles.badge, { borderColor: barBg }]}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, { color: focused ? labelActive : labelInactive }]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors, theme, isDark } = useTheme();   // ✅ added 'colors'
  const styles = makeStyles(theme, isDark);
  
  const insets = useSafeAreaInsets();
  const { unreadCount } = useChat();

  const bottomOffset = Math.max(insets.bottom, 10);  // (optional, currently unused)
  const barBg = isDark ? theme.background : theme.text;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: TAB_BAR_HEIGHT + insets.bottom, // include safe area
            backgroundColor: colors.background,
            borderTopWidth: isDark ? 0 : 1,
            borderTopColor: colors.border,
            elevation: 10,
            shadowColor: theme.background,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: isDark ? 0.1 : 0.05,
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
                badgeCount={unreadCount}
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

const makeStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  root: {
    flex: 1,
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    right: -10,
    top: -5,
    backgroundColor: theme.error,
    borderRadius: 7.5,
    minWidth: 15,
    height: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    // borderWidth: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: "900",
    includeFontPadding: false,
    textAlign: "center",
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
});