import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

/* ─── palette ─── */
const C = {
  bg: "#021410",
  card: "#0B1E1A",
  border: "#1A3330",
  primary: "#2FE6A6",
  primaryDim: "#1A9E74",
  text: "#E6FFF7",
  subText: "#6B8F84",
  muted: "#3A5E55",
  inputBg: "#0D1F1C",
};

export default function SupportIndex() {
  const fade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(20)).current;
  const [search, setSearch] = useState("");

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
              <Image
                source={require("../../../../assets/images/logo/dd_logo.png")}
                style={styles.logoDD}
                resizeMode="contain"
              />
            </Animated.View>

          </View>

          {/* search bar */}
          <Animated.View style={[styles.searchWrapper, { opacity: fade }]}>
            <Ionicons name="search-outline" size={18} color={C.subText} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search your issue..."
              placeholderTextColor={C.subText}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </Animated.View>

          {/* action buttons */}
         <Animated.View style={styles.actionRow}>
            {/* Chat with Us */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push("/(customer)/(assistant)/chat")}
              style={styles.chatBtnOuter}
            >
              <LinearGradient
                colors={[C.primary, C.primaryDim]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.chatBtn}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#021410" />
                <Text style={styles.chatBtnText}>Chat with Us</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Call Support */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.callBtn}
              onPress={() => router.push("/(customer)/(assistant)/call-requested")}
            >
              <Ionicons name="call-outline" size={17} color={C.text} />
              <Text style={styles.callBtnText}>Call Support</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* quick link */}
          <Animated.View style={[styles.pricingLink, { opacity: fade }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.pricingBtn}
              onPress={() => router.push("/(assistant)/chat?topic=pricing")}
            >
              <Ionicons name="pricetag-outline" size={15} color={C.subText} />
              <Text style={styles.pricingText}>Know about pricing</Text>
              <Ionicons name="chevron-forward" size={13} color={C.subText} />
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.primary,
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
    color: C.text,
    lineHeight: 40,
    letterSpacing: -0.5,
    marginBottom: 12,
  },

  heroSub: {
    fontSize: 14,
    color: C.subText,
    lineHeight: 21,
    fontWeight: "500",
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
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
    color: C.text,
    fontWeight: "500",
  },

  chatBtnOuter: {
  flex: 1,
  maxWidth: 170,
  borderRadius: 16,
  overflow: "hidden",

  shadowColor: C.primary,
  shadowOpacity: 0.25,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 5,
},
  chatBtn: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  chatBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#021410",
  },

callBtn: {
  flex: 1,
  maxWidth: 170,
  height: 52,

  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,

  backgroundColor: C.card,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: C.border,
},
  callBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
  },

  pricingLink: {
    marginTop: 6,
    alignItems: "center",
  },
  pricingBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  pricingText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.subText,
  },
  logoDD: {
    width: 140,
    height: 70,
    alignSelf: "center",
    marginTop: 0,
  }
});