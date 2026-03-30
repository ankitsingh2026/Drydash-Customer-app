import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../../../context/ThemeContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  text: string;
  sender: "user" | "support";
  time: string;
};

type QuickReply = {
  id: string;
  label: string;
  icon: string;
  answer: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = "#10B981";
const GOLD_LIGHT = "#001714";
const GREEN = "#10B981";

const SERVICES: { icon: string; label: string; color: string }[] = [
  { icon: "shirt-outline", label: "Laundry", color: "#6366F1" },
  { icon: "footsteps-outline", label: "Shoe Spa", color: "#EC4899" },
  { icon: "water-outline", label: "Dry Clean", color: "#0EA5E9" },
  { icon: "car-outline", label: "Car Clean", color: "#F59E0B" },
];

const QUICK_REPLIES: QuickReply[] = [
  {
    id: "q1",
    label: "🕐 Working Hours",
    icon: "time-outline",
    answer:
      "We operate 24 hours a day, 7 days a week — including holidays! You can place an order any time and we'll be there. 🌙✨",
  },
  {
    id: "q2",
    label: "👕 Laundry Services",
    icon: "shirt-outline",
    answer:
      "Our laundry service covers wash, dry, and fold for everyday clothes, bedding, and linens. We use premium detergents and handle each item with care. 🧺",
  },
  {
    id: "q3",
    label: "👟 Shoe Spa",
    icon: "footsteps-outline",
    answer:
      "Luxe Shoe Spa deep-cleans, deodorizes, and restores sneakers, leather shoes, heels, and boots. We bring your kicks back to life! 👟✨",
  },
  {
    id: "q4",
    label: "🧥 Dry Cleaning",
    icon: "water-outline",
    answer:
      "Our dry cleaning is perfect for suits, sarees, delicate fabrics, and formal wear. We use solvent-based cleaning to protect your finest garments. 👔",
  },
  {
    id: "q5",
    label: "🚗 Car Cleaning",
    icon: "car-outline",
    answer:
      "Luxe Car Clean offers interior vacuuming, exterior wash, dashboard polish, and full detailing packages. We come to you! 🚘✨",
  },
  {
    id: "q6",
    label: "📦 Track Order",
    icon: "location-outline",
    answer:
      "You can track your order in real-time from the Orders tab. Tap any active order to see live status updates and estimated delivery time. 📍",
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    text: "Welcome to Luxe Laundry! 👋",
    sender: "support",
    time: now(),
  },
  {
    id: "2",
    text: "We're available 24/7 for all your cleaning needs — laundry, shoe spa, dry cleaning & car cleaning. How can we help you today?",
    sender: "support",
    time: now(),
  },
];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Animated Bubble ──────────────────────────────────────────────────────────

function AnimatedBubble({
  item,
  theme,
  index,
}: {
  item: Message;
  theme: any;
  index: number;
}) {
  const isUser = item.sender === "user";
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 30 : -30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.messageWrapper,
        isUser ? styles.alignRight : styles.alignLeft,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={styles.avatarDot}>
          <Text style={{ fontSize: 10 }}>✨</Text>
        </View>
      )}
      <SafeAreaView style={{ maxWidth: "78%" }}>
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: GOLD, borderBottomRightRadius: 4 }
              : {
                  backgroundColor: theme.card,
                  borderBottomLeftRadius: 4,
                  borderWidth: 1,
                  borderColor: "#2a2a3a",
                },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? "#111" : theme.text },
            ]}
          >
            {item.text}
          </Text>
        </View>
        <Text
          style={[styles.time, { alignSelf: isUser ? "flex-end" : "flex-start" }]}
        >
          {item.time}
        </Text>
      </SafeAreaView>
    </Animated.View>
  );
}

// ─── Service Badge ────────────────────────────────────────────────────────────

function ServiceBadge({
  icon,
  label,
  color,
  delay,
}: {
  icon: string;
  label: string;
  color: string;
  delay: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.serviceBadge,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View style={[styles.serviceIcon, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={16} color={color} />
      </View>
      <Text style={styles.serviceLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Chat() {
  const { theme } = useTheme();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [quickRepliesVisible, setQuickRepliesVisible] = useState(true);
  const flatRef = useRef<FlatList<Message> | null>(null);

  // Header pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 60);
  };

  const pushMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
  };

  const sendMessage = (text?: string) => {
    const content = text ?? message;
    if (!content.trim()) return;
    setMessage("");

    pushMessage({
      id: Date.now().toString(),
      text: content,
      sender: "user",
      time: now(),
    });

    setQuickRepliesVisible(false);
  };

  const handleQuickReply = (qr: QuickReply) => {
    pushMessage({
      id: Date.now().toString(),
      text: qr.label,
      sender: "user",
      time: now(),
    });
    setQuickRepliesVisible(false);

    setTimeout(() => {
      pushMessage({
        id: (Date.now() + 1).toString(),
        text: qr.answer,
        sender: "support",
        time: now(),
      });
    }, 700);
  };

  const behavior = Platform.OS === "ios" ? "padding" : "height";
  const keyboardVerticalOffset = Platform.OS === "ios" ? 90 : 80;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={behavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* ── HEADER ── */}
            <View style={[styles.header, { backgroundColor: theme.background }]}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={[styles.headerTitle, { color: "#fff" }]}>
                    Luxe Support
                  </Text>
                  <View style={styles.statusRow}>
                    <Animated.View
                      style={[
                        styles.onlineDot,
                        { transform: [{ scale: pulseAnim }] },
                      ]}
                    />
                    <Text style={styles.statusText}>Online · 24/7 Support</Text>
                  </View>
                </View>

              </View>
            </View>

            {/* ── MESSAGES ── */}
            <FlatList
              ref={(r) => (flatRef.current = r)}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <AnimatedBubble item={item} theme={theme} index={index} />
              )}
              contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={scrollToBottom}
              ListFooterComponent={
                quickRepliesVisible ? (
                  <View style={styles.quickSection}>
                    <Text style={styles.quickLabel}>
                      ✦ What can we help you with?
                    </Text>
                    <View style={styles.quickGrid}>
                      {QUICK_REPLIES.map((qr) => (
                        <TouchableOpacity
                          key={qr.id}
                          style={styles.quickChip}
                          onPress={() => handleQuickReply(qr)}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.quickChipText}>{qr.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : null
              }
            />

            {/* ── INPUT ── */}
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: theme.card,
                  borderTopColor: "#1f2937",
                },
              ]}
            >
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Ask us anything..."
                placeholderTextColor="#4B5563"
                style={[styles.input, { color: theme.text }]}
                returnKeyType="send"
                onSubmitEditing={() => sendMessage()}
                onFocus={scrollToBottom}
              />
              <TouchableOpacity
                onPress={() => sendMessage()}
                activeOpacity={0.8}
                style={[styles.sendBtn, { backgroundColor: GOLD }]}
              >
                <Ionicons name="send" size={18} color="#111" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#1f2937",
  },
  headerTop: { gap: 10 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: GREEN,
    fontWeight: "600",
  },

  /* Service badges */
  serviceRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  serviceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#111827",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  serviceIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceLabel: {
    fontSize: 11,
    color: "#CBD5E1",
    fontWeight: "600",
  },

  /* Messages */
  messageWrapper: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  alignLeft: { alignSelf: "flex-start" },
  alignRight: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  avatarDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1f2937",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  time: {
    fontSize: 10,
    color: "#4B5563",
    marginTop: 4,
  },

  /* Quick replies */
  quickSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  quickLabel: {
    fontSize: 11,
    color: "GOLD",
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#003826",
    borderWidth: 1,
    borderColor: GOLD + "55",
  },
  quickChipText: {
    color: "#DEE5FF",
    fontSize: 13,
    fontWeight: "600",
  },

  /* Input */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    fontSize: 14,
    backgroundColor: "#111827",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});