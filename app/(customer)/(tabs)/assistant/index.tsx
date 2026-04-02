import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useTheme } from "../../../../context/ThemeContext";

/* ─── Palette — matches Home.tsx exactly ─── */
const ACCENT  = "#00C896";
const SURFACE = "#0D1F1C";
const BG      = "#001714";
const BORDER  = "#1A3330";
const MUTED   = "#6B7280";
const WHITE   = "#FFFFFF";

/* ─── Types ─── */
type Message = { id: string; text: string; sender: "user" | "support"; time: string };

type FAQ = { id: string; q: string; a: string; icon: string };

/* ─── Data ─── */
const FAQS: FAQ[] = [
  {
    id: "f1",
    q: "What are your working hours?",
    a: "We operate 24 hours a day, 7 days a week — including holidays! You can place an order any time and we'll be right there. 🌙",
    icon: "time-outline",
  },
  {
    id: "f2",
    q: "What does laundry service include?",
    a: "Our laundry covers wash, dry, and fold for everyday clothes, bedding, and linens using premium detergents. 🧺",
    icon: "shirt-outline",
  },
  {
    id: "f3",
    q: "How does Shoe Spa work?",
    a: "We deep-clean, deodorize, and restore sneakers, leather shoes, heels, and boots — and bring your kicks back to life! 👟",
    icon: "footsteps-outline",
  },
  {
    id: "f4",
    q: "What fabrics do you dry clean?",
    a: "Suits, sarees, delicate fabrics, and formal wear. We use solvent-based cleaning to protect your finest garments. 👔",
    icon: "water-outline",
  },
  {
    id: "f5",
    q: "How do I track my order?",
    a: "Go to the Orders tab and tap any active order for real-time status, live map, and estimated delivery time. 📍",
    icon: "location-outline",
  },
  {
    id: "f6",
    q: "Can I reschedule a pickup?",
    a: "Yes! Open the Orders tab, find your scheduled pickup, and tap Reschedule to pick a new date and time. 📅",
    icon: "calendar-outline",
  },
];

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const INITIAL: Message[] = [
  { id: "1", text: "Hey! 👋 Welcome to Luxe Support.", sender: "support", time: now() },
  { id: "2", text: "Browse the FAQs below or type your question. We're available 24/7.", sender: "support", time: now() },
];

/* ─── Chat bubble ─── */
function Bubble({ item }: { item: Message }) {
  const isUser = item.sender === "user";
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(isUser ? 20 : -20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.msgRow,
        isUser ? styles.msgRight : styles.msgLeft,
        { opacity: fade, transform: [{ translateX: slide }] },
      ]}
    >
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={{ fontSize: 11 }}>✨</Text>
        </View>
      )}
      <View style={{ maxWidth: "76%" }}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleSupport]}>
          <Text style={[styles.bubbleText, { color: isUser ? "#071A17" : WHITE }]}>
            {item.text}
          </Text>
        </View>
        <Text style={[styles.msgTime, { alignSelf: isUser ? "flex-end" : "flex-start" }]}>
          {item.time}
        </Text>
      </View>
    </Animated.View>
  );
}

/* ─── FAQ Accordion item ─── */
function FAQItem({ faq, onAsk }: { faq: FAQ; onAsk: (faq: FAQ) => void }) {
  const [open, setOpen] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.timing(heightAnim, { toValue, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(rotateAnim, { toValue, duration: 260, useNativeDriver: true }),
    ]).start();
    setOpen(!open);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const maxH   = heightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 140] });

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqHeader} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.faqIconWrap}>
          <Ionicons name={faq.icon as any} size={15} color={ACCENT} />
        </View>
        <Text style={styles.faqQ} numberOfLines={2}>{faq.q}</Text>
        <Animated.View style={{ transform: [{ rotate }], marginLeft: 4 }}>
          <Ionicons name="chevron-down" size={15} color={MUTED} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={{ maxHeight: maxH, overflow: "hidden" }}>
        <View style={styles.faqBody}>
          <Text style={styles.faqA}>{faq.a}</Text>
          <TouchableOpacity
            style={styles.askBtn}
            activeOpacity={0.8}
            onPress={() => { onAsk(faq); setOpen(false); heightAnim.setValue(0); rotateAnim.setValue(0); }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={ACCENT} />
            <Text style={styles.askBtnText}>Ask in chat</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

/* ─── Call Request Card ─── */
function CallCard() {
  const [requested, setRequested] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 100, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start(() => setRequested(true));
  };

  return (
    <View style={styles.callCard}>
      <View style={styles.callIconRing}>
        <Ionicons name={requested ? "checkmark-circle" : "call"} size={22} color={requested ? ACCENT : "#fff"} />
      </View>
      <Text style={styles.callTitle}>{requested ? "Call Requested!" : "Talk to Us"}</Text>
      <Text style={styles.callSub}>
        {requested
          ? "We'll call you within 5 mins."
          : "Prefer a call? We'll ring you in under 5 mins."}
      </Text>
      {!requested && (
        <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
          <TouchableOpacity style={styles.callBtn} onPress={press} activeOpacity={0.85}>
            <Ionicons name="call-outline" size={14} color="#071A17" />
            <Text style={styles.callBtnText}>Request Call</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
      {requested && (
        <View style={styles.callRequested}>
          <View style={styles.callDot} />
          <Text style={styles.callRequestedText}>Agent connecting…</Text>
        </View>
      )}
    </View>
  );
}

/* ─── Main ─── */
export default function Assistant() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<"faq" | "chat">("faq");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(INITIAL);
  const flatRef = useRef<FlatList<Message> | null>(null);

  /* pulse for online dot */
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 850, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 850, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scrollToBottom = () =>
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 60);

  const push = (msg: Message) => {
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
  };

  const send = (text?: string) => {
    const content = text ?? message;
    if (!content.trim()) return;
    setMessage("");
    push({ id: Date.now().toString(), text: content, sender: "user", time: now() });
    setTimeout(() => {
      push({
        id: (Date.now() + 1).toString(),
        text: "Thanks for reaching out! Our team will respond shortly. 🙏",
        sender: "support",
        time: now(),
      });
    }, 900);
  };

  const askFAQ = (faq: FAQ) => {
    setTab("chat");
    setTimeout(() => {
      push({ id: Date.now().toString(), text: faq.q, sender: "user", time: now() });
      setTimeout(() => {
        push({ id: (Date.now() + 1).toString(), text: faq.a, sender: "support", time: now() });
      }, 700);
    }, 200);
  };

  return (
    <View style={styles.root}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Assistant</Text>
          <View style={styles.onlineRow}>
            <Animated.View style={[styles.onlineDot, { transform: [{ scale: pulse }] }]} />
            <Text style={styles.onlineText}>Online </Text>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "faq"  && styles.tabBtnActive]}
            onPress={() => setTab("faq")}
            activeOpacity={0.8}
          >
            <Ionicons name="help-circle-outline" size={14} color={tab === "faq" ? "#071A17" : MUTED} />
            <Text style={[styles.tabBtnText, tab === "faq" && styles.tabBtnTextActive]}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "chat" && styles.tabBtnActive]}
            onPress={() => setTab("chat")}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={14} color={tab === "chat" ? "#071A17" : MUTED} />
            <Text style={[styles.tabBtnText, tab === "chat" && styles.tabBtnTextActive]}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── FAQ TAB ── */}
      {tab === "faq" && (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.faqScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top two-column strip */}
          <View style={styles.topStrip}>
            {/* Left: quick stat */}
            <View style={styles.stripLeft}>
              <Text style={styles.stripNum}>6</Text>
              <Text style={styles.stripLabel}>Common{"\n"}Questions</Text>
            </View>
            <View style={styles.stripDivider} />
            {/* Right: call card */}
            <View style={{ flex: 1 }}>
              <CallCard />
            </View>
          </View>

          {/* FAQ list */}
          <Text style={styles.sectionLabel}>FREQUENTLY ASKED</Text>
          {FAQS.map(faq => (
            <FAQItem key={faq.id} faq={faq} onAsk={askFAQ} />
          ))}

          {/* Bottom CTA */}
          <TouchableOpacity style={styles.chatCTA} onPress={() => setTab("chat")} activeOpacity={0.85}>
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={ACCENT} />
            <Text style={styles.chatCTAText}>Can't find your answer? Chat with us</Text>
            <Ionicons name="arrow-forward" size={14} color={ACCENT} />
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* ── CHAT TAB ── */}
      {tab === "chat" && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 70}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <FlatList
                ref={r => (flatRef.current = r)}
                data={messages}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <Bubble item={item} />}
                contentContainerStyle={styles.chatContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={scrollToBottom}
              />

              {/* Input */}
              <View style={styles.inputRow}>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Ask us anything…"
                  placeholderTextColor={MUTED}
                  style={styles.input}
                  returnKeyType="send"
                  onSubmitEditing={() => send()}
                  onFocus={scrollToBottom}
                />
                <TouchableOpacity
                  style={styles.sendBtn}
                  onPress={() => send()}
                  activeOpacity={0.8}
                >
                  <Ionicons name="send" size={16} color="#071A17" />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BG,
  },
  headerLeft: { gap: 3 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: WHITE, letterSpacing: -0.4 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  onlineDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: ACCENT,
    shadowColor: ACCENT, shadowOpacity: 1, shadowRadius: 5, elevation: 3,
  },
  onlineText: { fontSize: 12, color: ACCENT, fontWeight: "600" },

  /* Tab switcher */
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: SURFACE,
    borderRadius: 22,
    padding: 3,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 19,
  },
  tabBtnActive: { backgroundColor: ACCENT },
  tabBtnText: { fontSize: 12, fontWeight: "700", color: MUTED },
  tabBtnTextActive: { color: "#071A17" },

  /* FAQ scroll */
  faqScroll: { paddingHorizontal: 16, paddingTop: 16 },

  /* Top strip */
  topStrip: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
    alignItems: "stretch",
  },
  stripLeft: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 72,
    gap: 4,
  },
  stripNum: { fontSize: 28, fontWeight: "900", color: ACCENT },
  stripLabel: { fontSize: 11, color: MUTED, fontWeight: "600", textAlign: "center", lineHeight: 15 },
  stripDivider: { width: 1, backgroundColor: BORDER },

  /* Call card */
  callCard: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    gap: 6,
    alignItems: "flex-start",
  },
  callIconRing: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ACCENT + "22",
    borderWidth: 1, borderColor: ACCENT + "50",
    alignItems: "center", justifyContent: "center",
  },
  callTitle: { fontSize: 14, fontWeight: "800", color: WHITE },
  callSub: { fontSize: 11, color: MUTED, lineHeight: 15 },
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: ACCENT,
    borderRadius: 9,
    paddingVertical: 9,
    marginTop: 2,
    width: "100%",
  },
  callBtnText: { fontSize: 12, fontWeight: "800", color: "#071A17" },
  callRequested: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 2 },
  callDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: ACCENT,
    shadowColor: ACCENT, shadowOpacity: 1, shadowRadius: 5,
  },
  callRequestedText: { fontSize: 12, color: ACCENT, fontWeight: "600" },

  /* Section label */
  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: MUTED,
    marginBottom: 10,
  },

  /* FAQ item */
  faqItem: {
    backgroundColor: SURFACE,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 8,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 13,
  },
  faqIconWrap: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: ACCENT + "18",
    borderWidth: 1, borderColor: ACCENT + "30",
    alignItems: "center", justifyContent: "center",
  },
  faqQ: { flex: 1, fontSize: 13, fontWeight: "700", color: WHITE, lineHeight: 18 },
  faqBody: { paddingHorizontal: 13, paddingBottom: 13, paddingTop: 2, gap: 10 },
  faqA: { fontSize: 13, color: MUTED, lineHeight: 19, fontWeight: "500" },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: ACCENT + "14",
    borderWidth: 1,
    borderColor: ACCENT + "35",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 9,
  },
  askBtnText: { fontSize: 12, color: ACCENT, fontWeight: "700" },

  /* Bottom CTA */
  chatCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
    padding: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: ACCENT + "35",
    backgroundColor: ACCENT + "0D",
  },
  chatCTAText: { flex: 1, fontSize: 13, color: ACCENT, fontWeight: "700" },

  /* Chat */
  chatContent: { padding: 16, paddingBottom: 12 },
  msgRow: { marginBottom: 12, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  msgLeft:  { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    alignItems: "center", justifyContent: "center",
    marginBottom: 18,
  },
  bubble: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16 },
  bubbleUser:    { backgroundColor: ACCENT, borderBottomRightRadius: 4 },
  bubbleSupport: { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  msgTime: { fontSize: 10, color: MUTED, marginTop: 3 },

  /* Input */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: BG,
  },
  input: {
    flex: 1, height: 44,
    paddingHorizontal: 14, fontSize: 14,
    backgroundColor: SURFACE,
    borderRadius: 22,
    borderWidth: 1, borderColor: BORDER,
    color: WHITE,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: "center", justifyContent: "center",
  },
});