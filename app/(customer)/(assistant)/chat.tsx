import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    BackHandler,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/* ─── palette ─── */
const C = {
  bg: "#021410",
  card: "#0B1E1A",
  cardInner: "#0D2420",
  border: "#1A3330",
  primary: "#2FE6A6",
  primaryDim: "#1A9E74",
  text: "#E6FFF7",
  subText: "#6B8F84",
  muted: "#3A5E55",
  userBubble: "#2FE6A6",
  botBubble: "#0D1F1C",
};

/* ─── types ─── */
type Message = {
  id: string;
  type: "text" | "pricing_card" | "date_label";
  text?: string;
  sender?: "user" | "bot";
  time?: string;
  isTyping?: boolean;
};

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─── pricing card ─── */
function PricingCard({ onCatalog, onSpecialist }: { onCatalog: () => void; onSpecialist: () => void }) {
  return (
    <View style={styles.pricingCard}>
      <Text style={styles.pricingIntro}>
        Welcome back! Here's a quick overview of our standard rates:
      </Text>

      <View style={styles.priceList}>
        {[
          { label: "LAUNDRY",   price: "₹50",  unit: "/kg" },
          { label: "DRY CLEAN", price: "₹100", unit: "/item" },
          { label: "SHOE SPA",  price: "₹200", unit: "/pair" },
        ].map((item, i) => (
          <View
            key={item.label}
            style={[styles.priceRow, i < 2 && { borderBottomWidth: 1, borderColor: "#1A3330" }]}
          >
            <Text style={styles.priceLabel}>{item.label}</Text>
            <View style={styles.priceRight}>
              <Text style={styles.priceValue}>{item.price}</Text>
              <Text style={styles.priceUnit}>{item.unit}</Text>
            </View>
          </View>
        ))}

        {/* doorstep */}
        <View style={[styles.priceRow, { marginTop: 4 }]}>
          <Text style={styles.priceLabel}>DOORSTEP</Text>
          <View style={[styles.customQuoteBadge]}>
            <Text style={styles.customQuoteText}>Custom Quote</Text>
          </View>
        </View>
      </View>

      <Text style={styles.pricingFooter}>
        Would you like to see the full catalog or talk to a specialist?
      </Text>

      <View style={styles.pricingActions}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onCatalog}
          style={styles.catalogBtnOuter}
        >
          <LinearGradient
            colors={[C.primary, C.primaryDim]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.catalogBtn}
          >
            <Ionicons name="book-outline" size={14} color="#021410" />
            <Text style={styles.catalogBtnText}>Full Catalog</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onSpecialist}
          style={styles.specialistBtn}
        >
          <Ionicons name="person-outline" size={14} color={C.text} />
          <Text style={styles.specialistBtnText}>Talk to Specialist</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── typing indicator ─── */
function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(500),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      <View style={styles.botAvatar}>
        <Text style={{ fontSize: 12 }}>✨</Text>
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: dot,
                  transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.typingLabel}>SPARK IS TYPING</Text>
      </View>
    </View>
  );
}

/* ─── bubble ─── */
function Bubble({
  msg,
  onCatalog,
  onSpecialist,
}: {
  msg: Message;
  onCatalog: () => void;
  onSpecialist: () => void;
}) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(msg.sender === "user" ? 16 : -16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }),
    ]).start();
  }, []);

  if (msg.type === "date_label") {
    return (
      <View style={styles.dateLabelRow}>
        <Text style={styles.dateLabel}>{msg.text}</Text>
      </View>
    );
  }

  const isUser = msg.sender === "user";

  return (
    <Animated.View
      style={[
        styles.msgRow,
        isUser ? styles.msgRight : styles.msgLeft,
        { opacity: fade, transform: [{ translateX: slide }] },
      ]}
    >
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={{ fontSize: 12 }}>✨</Text>
        </View>
      )}

      <View style={{ maxWidth: "78%", gap: 4 }}>
        {!isUser && msg.type === "text" && (
          <Text style={styles.botName}>DryDash</Text>
        )}

        {msg.type === "text" ? (
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
            <Text style={[styles.bubbleText, { color: isUser ? "#021410" : C.text }]}>
              {msg.text}
            </Text>
          </View>
        ) : (
          <View style={styles.botCardWrapper}>
            <Text style={styles.botName}>DryDash</Text>
            <PricingCard onCatalog={onCatalog} onSpecialist={onSpecialist} />
          </View>
        )}

        {msg.time && (
          <Text style={[styles.msgTime, { alignSelf: isUser ? "flex-end" : "flex-start" }]}>
            {msg.time}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

/* ─── main ─── */
export default function SupportChat() {
  const params = useLocalSearchParams<{ topic?: string }>();
  const flatRef = useRef<FlatList<Message> | null>(null);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    { id: "d1", type: "date_label", text: "TODAY" },
  ]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { router.back(); return true; });
    return () => sub.remove();
  }, []);

  const scrollBottom = () =>
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

  const pushMsg = (msg: Message) => {
    setMessages((p) => [...p, msg]);
    scrollBottom();
  };

  /* auto-trigger pricing topic if came from landing */
  useEffect(() => {
    if (params.topic === "pricing") {
      setTimeout(() => {
        pushMsg({ id: "u1", type: "text", sender: "user", text: "I want to know about pricing.", time: now() });
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          pushMsg({ id: "b1", type: "pricing_card", sender: "bot", time: now() });
        }, 1400);
      }, 500);
    }
  }, []);

  const send = (text?: string) => {
    const content = text ?? input;
    if (!content.trim()) return;
    setInput("");
    Keyboard.dismiss();

    const userMsg: Message = {
      id: Date.now().toString(),
      type: "text",
      sender: "user",
      text: content,
      time: now(),
    };
    pushMsg(userMsg);

    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      pushMsg({
        id: (Date.now() + 1).toString(),
        type: "text",
        sender: "bot",
        text: "Thanks for reaching out! Our team will get back to you shortly. 🙏",
        time: now(),
      });
    }, 1200);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Support Chat</Text>
            <View style={styles.onlineRow}>
              <Animated.View style={[styles.onlineDot, { transform: [{ scale: pulse }] }]} />
              <Text style={styles.onlineText}>ONLINE</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.headerBtn}>
            <Ionicons name="ellipsis-vertical" size={20} color={C.subText} />
          </TouchableOpacity>
        </View>

        {/* messages */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 70}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <FlatList
                ref={(r) => (flatRef.current = r)}
                data={messages}
                keyExtractor={(m) => m.id}
                renderItem={({ item }) => (
                  <Bubble
                    msg={item}
                    onCatalog={() => send("Show me the full catalog")}
                    onSpecialist={() => send("I want to talk to a specialist")}
                  />
                )}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={scrollBottom}
              />

              {typing && <TypingIndicator />}

              {/* input */}
              <View style={styles.inputRow}>
                <TouchableOpacity style={styles.attachBtn}>
                  <Ionicons name="add-circle-outline" size={24} color={C.subText} />
                </TouchableOpacity>

                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Type your message..."
                  placeholderTextColor={C.subText}
                  style={styles.input}
                  returnKeyType="send"
                  onSubmitEditing={() => send()}
                  onFocus={scrollBottom}
                />

                <TouchableOpacity
                  onPress={() => send()}
                  style={styles.sendBtnOuter}
                >
                  <LinearGradient
                    colors={[C.primary, C.primaryDim]}
                    style={styles.sendBtn}
                  >
                    <Ionicons name="send" size={15} color="#021410" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  headerBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "flex-start", paddingLeft: 4, gap: 1 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: C.text },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: C.primary,
    shadowColor: C.primary, shadowOpacity: 1, shadowRadius: 4,
  },
  onlineText: { fontSize: 10, fontWeight: "700", color: C.primary, letterSpacing: 0.8 },

  chatContent: { paddingHorizontal: 14, paddingVertical: 12, gap: 4 },

  dateLabelRow: { alignItems: "center", marginVertical: 10 },
  dateLabel: { fontSize: 11, fontWeight: "700", color: C.subText, letterSpacing: 1 },

  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 10 },
  msgLeft:  { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end", flexDirection: "row-reverse" },

  botAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
    marginBottom: 18,
  },
  botName: { fontSize: 12, fontWeight: "700", color: C.primary, marginBottom: 3 },

  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleUser: { backgroundColor: C.userBubble, borderBottomRightRadius: 4 },
  bubbleBot:  {
    backgroundColor: C.botBubble, borderWidth: 1,
    borderColor: C.border, borderBottomLeftRadius: 4,
  },
  bubbleText: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  msgTime: { fontSize: 10, color: C.subText, marginTop: 2 },

  botCardWrapper: { gap: 4 },

  /* pricing card */
  pricingCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 12,
    maxWidth: 280,
  },
  pricingIntro: { fontSize: 13, color: C.text, fontWeight: "500", lineHeight: 19 },
  priceList: {
    backgroundColor: C.cardInner,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  priceLabel: { fontSize: 10, fontWeight: "800", color: C.subText, letterSpacing: 0.8 },
  priceRight: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  priceValue: { fontSize: 18, fontWeight: "900", color: C.primary },
  priceUnit:  { fontSize: 11, fontWeight: "600", color: C.subText },
  customQuoteBadge: {
    backgroundColor: C.primary + "20",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.primary + "40",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  customQuoteText: { fontSize: 13, fontWeight: "800", color: C.primary },

  pricingFooter: { fontSize: 13, color: C.subText, lineHeight: 18 },
  pricingActions: { gap: 8 },
  catalogBtnOuter: { borderRadius: 10, overflow: "hidden" },
  catalogBtn: {
    height: 40, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 7,
  },
  catalogBtnText: { fontSize: 13, fontWeight: "800", color: "#021410" },
  specialistBtn: {
    height: 40, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 7,
    backgroundColor: C.card, borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
  },
  specialistBtnText: { fontSize: 13, fontWeight: "700", color: C.text },

  /* typing */
  typingRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  typingBubble: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  typingDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: C.primary,
  },
  typingLabel: {
    fontSize: 9, fontWeight: "700", color: C.subText, letterSpacing: 1,
  },

  /* input */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  attachBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  input: {
    flex: 1, height: 46,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    borderRadius: 23,
    borderWidth: 1, borderColor: C.border,
    color: C.text, fontSize: 14, fontWeight: "500",
  },
  sendBtnOuter: { borderRadius: 22, overflow: "hidden" },
  sendBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});