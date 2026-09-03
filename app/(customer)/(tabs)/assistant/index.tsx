import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "../../../../context/ChatContext";
import { useTheme } from "../../../../context/ThemeContext";
import DrydashLogo48 from "@/assets/images/Drydash_logo_48x48.svg";
import {
  Animated,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SupportIndex() {
  const { theme, isDark } = useTheme();
  const styles = makeStyles(theme);
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(20)).current;
  const [search, setSearch] = useState("");
  const { unreadCount } = useChat();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 340, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      router.back(); return true;
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Support</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* hero text */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>

            {/* LEFT: title + subtitle */}
            <Animated.View style={{ opacity: fade, transform: [{ translateY: slideY }], flex: 1, paddingRight: 12 }}>
              <Text style={styles.heroTitle}>{"How can we\nhelp you\ntoday?"}</Text>
              <Text style={styles.heroSub}>
                Whether it's a delivery update or service inquiry, our DryDash concierge is ready to assist.
              </Text>
            </Animated.View>

            {/* RIGHT: logo */}
            <Animated.View style={{ opacity: fade, transform: [{ translateY: slideY }] }}>
              <DrydashLogo48
                width={70}
                height={70}
              />
            </Animated.View>

          </View>

          {/* search bar */}
          {/* <Animated.View style={[styles.searchWrapper, { opacity: fade }]}>
            <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search your issue..."
              placeholderTextColor={theme.textSecondary}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </Animated.View> */}

          {/* action buttons */}
          <Animated.View style={styles.actionRow}>
            {/* Chat with Us */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push("/(customer)/(assistant)/chat")}
              style={styles.chatBtnOuter}
            >
              <LinearGradient
                colors={theme.isDark ? [theme.border, theme.card] : [theme.background, theme.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.chatBtn}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.isDark ? theme.background : theme.text} />
                <Text style={styles.chatBtnText}>Chat with Us</Text>
                {unreadCount > 0 && (
                  <View style={styles.chatBadge}>
                    <Text style={styles.chatBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Call Support */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.callBtn}
              onPress={() => router.push("/(customer)/(assistant)/call-requested")}
            >
              <Ionicons name="call-outline" size={17} color={theme.text} />
              <Text style={styles.callBtnText}>Call Support</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* quick link */}
          <Animated.View style={[styles.pricingLink, { opacity: fade }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.pricingBtn}
              onPress={() => router.push("/(customer)/(assistant)/chat?topic=pricing")}
            >
              <Ionicons name="pricetag-outline" size={15} color={theme.textSecondary} />
              <Text style={styles.pricingText}>Know about pricing</Text>
              <Ionicons name="chevron-forward" size={13} color={theme.textSecondary} />
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (theme: any) => StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.background },

  header: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.primary,
  },

  scroll: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 80,
    gap: 20,
  },

  heroTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: theme.text,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },

  heroSub: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 21,
    fontWeight: "500",
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.inputBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    fontWeight: "500",
  },

  chatBtnOuter: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: theme.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  chatBtn: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderColor: theme.border
  },
  chatBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.isDark ? theme.background : theme.text,
  },
  chatBadge: {
    backgroundColor: '#fff',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    marginLeft: 4,
  },
  chatBadgeText: {
    color: theme.primary,
    fontSize: 10,
    fontWeight: "900",
    includeFontPadding: false,
    textAlign: "center",
  },

  callBtn: {
    height: 56  ,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: 11,
    paddingHorizontal: 16
  },
  callBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.text,
  },

  pricingLink: {
    marginTop: 6,
    alignItems: "center",
  },
  pricingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  pricingText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.textSecondary,
  },
  logoDD: {
    width: 140,
    height: 70,
    alignSelf: "center",
    marginTop: 0,
  }
});