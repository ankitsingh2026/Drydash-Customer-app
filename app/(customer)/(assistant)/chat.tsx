// SupportChat.tsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
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
  View,
  Alert,
  Image,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchCamera, launchImageLibrary } from "react-native-image-picker";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "../../../context/ThemeContext";
import { useChat } from "@/context/ChatContext";
import {
  getOrCreateRoom,
  fetchMessages,
  sendMessage,
  uploadChatImage,
  markCustomerMessagesAsRead,
} from "../../../features/chat/chat.api";
import {
  connectChatSocket,
  joinChatRoom,
  sendMessageViaSocket,
  onReceiveMessage,
  offReceiveMessage,
  sendTyping,
  sendStopTyping,
  onUserTyping,
  offUserTyping,
  onUserStoppedTyping,
  offUserStoppedTyping,
} from "../../../features/chat/chat.socket";

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildChatColors(theme: any, isDark: boolean) {
  return {
    bg: theme.background,
    card: theme.card,
    cardInner: isDark ? "#0A201B" : "#F0FAF7",
    border: theme.border,
    primary: theme.primary,
    primaryDim: isDark ? "#14483E" : "#C4F1E4",
    text: theme.text,
    subText: theme.textSecondary,
    muted: isDark ? "#486B62" : "#8AA79F",
    userBubble: theme.primary,
    userBubbleText: "#021410",
    botBubble: isDark ? theme.card : "#FFFFFF",
    botBubbleText: theme.text,
    bubbleBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    datePillBg: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)",
  };
}

/* ─── PricingCard ─── */
function PricingCard({ onCatalog, onSpecialist }: { onCatalog: () => void; onSpecialist: () => void }) {
  const { theme, isDark } = useTheme();
  const C = buildChatColors(theme, isDark);
  const styles = makeChatStyles(C);

  return (
    <View style={styles.pricingCard}>
      <Text style={styles.pricingIntro}>
        Welcome to DryDash Support! Here is a quick snapshot of our standard pricing:
      </Text>

      <View style={styles.priceList}>
        {[
          { label: "LAUNDRY", price: "₹50", unit: "/kg" },
          { label: "DRY CLEAN", price: "₹100", unit: "/item" },
          { label: "SHOE SPA", price: "₹200", unit: "/pair" },
        ].map((item, i) => (
          <View
            key={item.label}
            style={[styles.priceRow, i < 2 && { borderBottomWidth: 1, borderColor: C.border }]}
          >
            <Text style={styles.priceLabel}>{item.label}</Text>
            <View style={styles.priceRight}>
              <Text style={styles.priceValue}>{item.price}</Text>
              <Text style={styles.priceUnit}>{item.unit}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.priceRow, { marginTop: 2 }]}>
          <Text style={styles.priceLabel}>DOORSTEP</Text>
          <View style={styles.customQuoteBadge}>
            <Text style={styles.customQuoteText}>Express Pickup</Text>
          </View>
        </View>
      </View>

      <Text style={styles.pricingFooter}>
        Need a customized package or wish to speak with our support specialist?
      </Text>

      <View style={styles.pricingActions}>
        <TouchableOpacity activeOpacity={0.85} onPress={onCatalog} style={styles.catalogBtnOuter}>
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

        <TouchableOpacity activeOpacity={0.85} onPress={onSpecialist} style={styles.specialistBtn}>
          <Ionicons name="person-outline" size={14} color={C.text} />
          <Text style={styles.specialistBtnText}>Talk to Specialist</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── TypingIndicator ─── */
function TypingIndicator({ label = "SUPPORT AGENT IS TYPING", icon = "✨" }: { label?: string; icon?: string }) {
  const { theme, isDark } = useTheme();
  const C = buildChatColors(theme, isDark);
  const styles = makeChatStyles(C);
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
          Animated.delay(400),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.typingRow}>
      <View style={styles.botAvatar}>
        <Text style={{ fontSize: 12 }}>{icon}</Text>
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                  transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.typingLabel}>{label}</Text>
      </View>
    </View>
  );
}

/* ─── Message Bubble ─── */
const Bubble = React.memo(function Bubble({
  msg,
  onCatalog,
  onSpecialist,
  onPressImage,
}: {
  msg: any;
  onCatalog: () => void;
  onSpecialist: () => void;
  onPressImage: (url: string) => void;
}) {
  const { theme, isDark } = useTheme();
  const C = buildChatColors(theme, isDark);
  const styles = makeChatStyles(C);

  // Date label separator
  if (msg.type === "date_label") {
    return (
      <View style={styles.dateLabelRow}>
        <View style={styles.dateLabelPill}>
          <Text style={styles.dateLabel}>{msg.text}</Text>
        </View>
      </View>
    );
  }

  const isUser = msg.senderType === "customer";
  const isImage = msg.type === "image" && (msg.fileUrl || msg.imageUrl);
  const imageUrl = msg.fileUrl || msg.imageUrl;
  const isPending = msg.id && String(msg.id).startsWith("temp-");
  const isRead = !!msg.isRead;
  const isDelivered = msg.delivered !== false;

  let content: React.ReactNode;

  if (isImage) {
    content = (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot, { padding: 4, overflow: "hidden" }]}>
        <TouchableOpacity activeOpacity={0.9} onPress={() => onPressImage(imageUrl)}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.bubbleImage}
            resizeMode="cover"
          />
          {msg.text ? (
            <Text
              style={[
                styles.bubbleText,
                {
                  color: isUser ? C.userBubbleText : C.botBubbleText,
                  paddingHorizontal: 8,
                  paddingTop: 6,
                  paddingBottom: 2,
                },
              ]}
            >
              {msg.text}
            </Text>
          ) : null}
        </TouchableOpacity>
      </View>
    );
  } else if (msg.type === "pricing_card") {
    content = (
      <View style={styles.botCardWrapper}>
        <PricingCard onCatalog={onCatalog} onSpecialist={onSpecialist} />
      </View>
    );
  } else {
    // Standard text message
    content = (
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleBot,
          !isUser && styles.bubbleBotBorder,
        ]}
      >
        <Text style={[styles.bubbleText, { color: isUser ? C.userBubbleText : C.botBubbleText }]}>
          {msg.text}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.msgRow, isUser ? styles.msgRight : styles.msgLeft]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Ionicons name="sparkles" size={13} color={C.primary} />
        </View>
      )}

      <View style={{ maxWidth: "78%", gap: 3 }}>
        {!isUser && msg.type !== "pricing_card" && (
          <Text style={styles.botName}>DryDash Support</Text>
        )}

        {content}

        <View style={[styles.metaRow, isUser ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" }]}>
          {msg.time && <Text style={styles.msgTime}>{msg.time}</Text>}

          {isUser && (
            <View style={styles.tickContainer}>
              {isPending ? (
                <Ionicons name="time-outline" size={11} color="rgba(0,0,0,0.4)" />
              ) : isRead ? (
                <Ionicons name="checkmark-done" size={13} color="#021410" />
              ) : isDelivered ? (
                <Ionicons name="checkmark-done" size={13} color="rgba(0,0,0,0.5)" />
              ) : (
                <Ionicons name="checkmark" size={13} color="rgba(0,0,0,0.5)" />
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

/* ─── Main Component ─── */
export default function SupportChat() {
  const { theme, isDark } = useTheme();
  const C = buildChatColors(theme, isDark);
  const styles = makeChatStyles(C);
  const params = useLocalSearchParams<{ topic?: string }>();
  const flatRef = useRef<FlatList<any>>(null);

  const [input, setInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [appCustomerId, setAppCustomerId] = useState<string>("");
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(true);

  // Scroll tracking state
  const isAtBottomRef = useRef(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [newMessagesWhileScrolled, setNewMessagesWhileScrolled] = useState(0);

  const seenMessageIds = useRef<Set<string>>(new Set());
  const typingTimeoutRef = useRef<any>(null);
  const { setUnreadCount, setIsChatActive } = useChat();
  const { user } = useAuth();

  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e?.endCoordinates?.height || 0;
      setKeyboardOffset(height);
      if (isAtBottomRef.current) {
        setTimeout(() => flatRef.current?.scrollToOffset({ offset: 0, animated: true }), 40);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const pulse = useRef(new Animated.Value(1)).current;

  // Header pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Set chat active state
  useEffect(() => {
    setIsChatActive(true);
    return () => setIsChatActive(false);
  }, []);

  // Mark messages read when room loads
  useEffect(() => {
    if (!roomId) return;
    markCustomerMessagesAsRead(roomId)
      .then(() => setUnreadCount(0))
      .catch((err) => console.error("Mark read failed:", err));
  }, [roomId]);

  // Phone normalization
  const normalizePhone = (raw?: string | null): string | null => {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, "");
    if (digits.length === 10) return "91" + digits;
    if (digits.length === 11 && digits.startsWith("0")) return "91" + digits.slice(1);
    if (digits.length === 12 && digits.startsWith("91")) return digits;
    if (digits.length > 10) return "91" + digits.slice(-10);
    return digits || null;
  };

  // Resolve user info
  useEffect(() => {
    const resolveUser = async () => {
      let p = normalizePhone(user?.user?.phone ?? user?.phone);
      let aId = user?.user?.id ?? user?.id ?? (user as any)?._id;

      if (!p || !aId) {
        try {
          const stored = await AsyncStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (!p) p = normalizePhone(parsed?.user?.phone ?? parsed?.phone);
            if (!aId) aId = parsed?.user?.id ?? parsed?.id ?? parsed?._id;
          }
        } catch (e) {
          console.log("Chat: error reading stored user", e);
        }
      }

      if (p) setCustomerId(p);
      if (aId) setAppCustomerId(String(aId));
    };

    resolveUser();
  }, [user]);

  // Initialize chat room and socket
  useEffect(() => {
    if (!customerId || !appCustomerId) return;

    let isMounted = true;
    let handleReceiveMessage: ((newMsg: any) => void) | null = null;
    let handleUserTyping: ((data: { userId: string; userName: string }) => void) | null = null;
    let handleUserStoppedTyping: (() => void) | null = null;

    const initChat = async () => {
      try {
        setIsLoadingChat(true);
        const room = await getOrCreateRoom(customerId, appCustomerId, undefined, "global");
        if (!isMounted) return;
        setRoomId(room._id);

        const prevMessages = await fetchMessages(room._id);
        if (!isMounted) return;

        const formatted = prevMessages.map((m: any) => ({
          id: m._id,
          type: m.messageType || "text",
          senderType: m.senderType,
          text: m.message || "",
          createdAt: m.createdAt,
          time: m.createdAt
            ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : now(),
          delivered: m.delivered !== false,
          fileUrl: m.fileUrl,
          imageUrl: m.imageUrl,
          isDeleted: m.isDeleted,
          isRead: m.isRead,
          readAt: m.readAt,
        }));

        setMessages(formatted);

        connectChatSocket();
        joinChatRoom(room._id);

        handleReceiveMessage = (newMsg: any) => {
          if (newMsg.roomId !== room._id) return;
          const msgId = newMsg._id;
          if (seenMessageIds.current.has(msgId)) return;
          seenMessageIds.current.add(msgId);

          setMessages((prev) => {
            // Check if there is an optimistic message to replace
            const optimisticIndex = prev.findIndex((m) => {
              if (newMsg.messageType === "image") {
                return (
                  m.id &&
                  String(m.id).startsWith("temp-img-") &&
                  m.senderType === newMsg.senderType
                );
              }
              return (
                m.id &&
                String(m.id).startsWith("temp-") &&
                !String(m.id).startsWith("temp-img-") &&
                m.senderType === newMsg.senderType &&
                m.text === newMsg.message
              );
            });

            if (optimisticIndex !== -1) {
              const updated = [...prev];
              updated[optimisticIndex] = {
                id: newMsg._id,
                type: newMsg.messageType || "text",
                senderType: newMsg.senderType,
                text: newMsg.message || "",
                fileUrl: newMsg.fileUrl || newMsg.imageUrl || null,
                imageUrl: newMsg.imageUrl || newMsg.fileUrl || null,
                time: newMsg.createdAt
                  ? new Date(newMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : now(),
                delivered: true,
                isRead: newMsg.isRead || false,
              };
              return updated;
            }

            return [
              ...prev,
              {
                id: newMsg._id,
                type: newMsg.messageType || "text",
                senderType: newMsg.senderType,
                text: newMsg.message || "",
                fileUrl: newMsg.fileUrl || newMsg.imageUrl || null,
                imageUrl: newMsg.imageUrl || newMsg.fileUrl || null,
                time: newMsg.createdAt
                  ? new Date(newMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : now(),
                delivered: true,
                isRead: newMsg.isRead || false,
              },
            ];
          });

          // Intelligent scroll behavior on incoming message
          if (isAtBottomRef.current) {
            setTimeout(() => flatRef.current?.scrollToOffset({ offset: 0, animated: true }), 40);
          } else {
            setNewMessagesWhileScrolled((c) => c + 1);
          }
        };

        handleUserTyping = ({ userId }) => {
          if (userId !== customerId) {
            setOtherTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 2500);
          }
        };

        handleUserStoppedTyping = () => {
          setOtherTyping(false);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
          }
        };

        onReceiveMessage(handleReceiveMessage);
        onUserTyping(handleUserTyping);
        onUserStoppedTyping(handleUserStoppedTyping);
      } catch (error) {
        console.error("Chat init error", error);
        Alert.alert("Connection Issue", "Could not connect to live chat. Please try again.");
      } finally {
        if (isMounted) setIsLoadingChat(false);
      }
    };

    initChat();

    return () => {
      isMounted = false;
      if (handleReceiveMessage) offReceiveMessage(handleReceiveMessage);
      if (handleUserTyping) offUserTyping(handleUserTyping);
      if (handleUserStoppedTyping) offUserStoppedTyping(handleUserStoppedTyping);
    };
  }, [customerId, appCustomerId]);

  // Auto-send topic if navigated with params
  useEffect(() => {
    if (params.topic === "pricing" && roomId && customerId) {
      setTimeout(() => {
        sendUserMessage("I want to know about pricing and available services.");
      }, 600);
    }
  }, [params.topic, roomId, customerId]);

  // Group messages by date
  const messagesWithDateLabels = useMemo(() => {
    const formatDateLabel = (d: Date) => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (d.toDateString() === today.toDateString()) return "Today";
      if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
      return d.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    };

    let lastLabel: string | null = null;
    const out: any[] = [];

    for (const m of messages) {
      const createdAt = m.createdAt ? new Date(m.createdAt) : null;
      if (createdAt && !isNaN(createdAt.getTime())) {
        const label = formatDateLabel(createdAt);
        if (label !== lastLabel) {
          lastLabel = label;
          out.push({
            id: `date-${label}-${m.id || Math.random()}`,
            type: "date_label",
            senderType: "system",
            text: label,
          });
        }
      }
      out.push(m);
    }

    return out;
  }, [messages]);

  // Inverted FlatList data: index 0 is at the bottom (newest message)
  const invertedData = useMemo(() => {
    return messagesWithDateLabels.slice().reverse();
  }, [messagesWithDateLabels]);

  // Scroll position tracker for inverted list (offset.y = 0 is at the bottom)
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const isClose = y <= 40;
    isAtBottomRef.current = isClose;

    if (isClose) {
      setShowScrollBottomBtn(false);
      setNewMessagesWhileScrolled(0);
    } else if (y > 100) {
      setShowScrollBottomBtn(true);
    } else {
      setShowScrollBottomBtn(false);
    }
  };

  const scrollToBottom = () => {
    flatRef.current?.scrollToOffset({ offset: 0, animated: true });
    setShowScrollBottomBtn(false);
    setNewMessagesWhileScrolled(0);
    isAtBottomRef.current = true;
  };

  // Sending message logic
  const sendUserMessage = async (text: string) => {
    if (!roomId || !customerId) {
      Alert.alert("Connecting", "Chat is still initializing. Please wait a moment.");
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const userMsg = {
      id: tempId,
      type: "text",
      senderType: "customer",
      text,
      time: now(),
      delivered: false,
      isRead: false,
    };

    // 1. Optimistically display user message
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(() => {
      flatRef.current?.scrollToOffset({ offset: 0, animated: true });
      setShowScrollBottomBtn(false);
      setNewMessagesWhileScrolled(0);
    }, 40);

    try {
      // 2. Emit via socket
      const sentViaSocket = sendMessageViaSocket(roomId, "customer", customerId, text);

      if (!sentViaSocket) {
        // Fallback to HTTP API if socket is temporarily disconnected
        console.log("Socket not connected, using HTTP API fallback");
        const savedMsg = await sendMessage(roomId, "customer", customerId, text);
        if (savedMsg?._id) {
          seenMessageIds.current.add(savedMsg._id);
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: savedMsg._id, delivered: true } : m))
          );
        }
      }
    } catch (err) {
      console.error("Send failed", err);
      Alert.alert("Error", "Message could not be sent. Please check your connection.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const send = (text?: string) => {
    const content = text ?? input;
    if (!content.trim()) return;
    setInput("");
    sendStopTyping(roomId || "");
    sendUserMessage(content.trim());
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    if (!roomId || !customerId) return;
    if (text.trim().length > 0) {
      sendTyping(roomId, customerId, "Customer");
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping(roomId);
      }, 1200);
    } else {
      sendStopTyping(roomId);
    }
  };

  // Image handling
  const uploadImage = async (asset: any) => {
    if (!roomId || !customerId) return;

    setUploading(true);
    const tempId = `temp-img-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      type: "image",
      senderType: "customer",
      text: "",
      fileUrl: asset.uri,
      imageUrl: asset.uri,
      time: now(),
      delivered: false,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => flatRef.current?.scrollToOffset({ offset: 0, animated: true }), 40);

    try {
      const formData = new FormData();
      formData.append("image", {
        uri: asset.uri,
        name: asset.fileName || "upload.jpg",
        type: asset.type || "image/jpeg",
      } as any);

      const fileUrl = await uploadChatImage(formData);

      if (fileUrl) {
        seenMessageIds.current.add(tempId);
        sendMessageViaSocket(
          roomId,
          "customer",
          customerId,
          "",
          "image",
          fileUrl
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? { ...m, fileUrl, imageUrl: fileUrl, delivered: true }
              : m
          )
        );
      }
    } catch (err) {
      console.error("Image upload failed", err);
      Alert.alert("Upload Failed", "Could not send image. Please try again.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setUploading(false);
    }
  };

  const pickImage = () => {
    launchImageLibrary({ mediaType: "photo", quality: 0.8 }, (response) => {
      if (response.assets?.[0]) uploadImage(response.assets[0]);
    });
  };

  const takePhoto = () => {
    launchCamera({ mediaType: "photo", quality: 0.8 }, (response) => {
      if (response.assets?.[0]) uploadImage(response.assets[0]);
    });
  };

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <Bubble
        msg={item}
        onCatalog={() => send("Please show me the complete price catalog.")}
        onSpecialist={() => send("I would like to speak with a customer care specialist.")}
        onPressImage={(url) => setPreviewImageUrl(url)}
      />
    ),
    [roomId, customerId]
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Modern Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>

          <View style={styles.headerAvatarContainer}>
            <LinearGradient
              colors={isDark ? ["#164E43", "#0B2620"] : [C.primary, C.primaryDim]}
              style={styles.headerAvatar}
            >
              <Ionicons name="sparkles" size={16} color={isDark ? C.primary : "#021410"} />
            </LinearGradient>
            <Animated.View style={[styles.onlineDotBadge, { transform: [{ scale: pulse }] }]} />
          </View>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              DryDash Support
            </Text>
            <View style={styles.onlineStatusRow}>
              <Text style={styles.onlineSubtitle}>
                {otherTyping ? "Typing..." : "Online • Typically replies instantly"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerActionBtn}
            activeOpacity={0.7}
            onPress={() => router.push("/(customer)/(assistant)/call-requested")}
          >
            <Ionicons name="call-outline" size={19} color={C.primary} />
          </TouchableOpacity>
        </View>

        {/* Chat Body */}
        <View style={{ flex: 1, position: "relative" }}>
          {isLoadingChat ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={styles.loadingText}>Connecting to support...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconCircle}>
                <Ionicons name="chatbubbles-outline" size={32} color={C.primary} />
              </View>
              <Text style={styles.emptyStateTitle}>Welcome to DryDash Support</Text>
              <Text style={styles.emptyStateDesc}>
                Our team is here to assist you with pickups, billing, orders, or laundry care.
              </Text>
              <View style={styles.quickChipsRow}>
                <TouchableOpacity
                  style={styles.chipBtn}
                  activeOpacity={0.75}
                  onPress={() => send("Check status of my latest order")}
                >
                  <Text style={styles.chipText}>📦 Order status</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chipBtn}
                  activeOpacity={0.75}
                  onPress={() => send("What are your current pricing rates?")}
                >
                  <Text style={styles.chipText}>🏷️ Pricing</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chipBtn}
                  activeOpacity={0.75}
                  onPress={() => send("When can I schedule a laundry pickup?")}
                >
                  <Text style={styles.chipText}>🚚 Schedule pickup</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              inverted
              data={invertedData}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              initialNumToRender={15}
              maxToRenderPerBatch={15}
              windowSize={11}
            />
          )}

          {/* Floating Scroll-to-Bottom Button */}
          {showScrollBottomBtn && (
            <TouchableOpacity
              style={styles.floatingScrollBtn}
              activeOpacity={0.85}
              onPress={scrollToBottom}
            >
              <Ionicons name="chevron-down" size={20} color="#021410" />
              {newMessagesWhileScrolled > 0 && (
                <View style={styles.floatingBadge}>
                  <Text style={styles.floatingBadgeText}>{newMessagesWhileScrolled}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Typing Indicators */}
          {otherTyping && <TypingIndicator label="ADMIN IS TYPING" icon="👤" />}
          {botTyping && <TypingIndicator label="AI ASSISTANT IS TYPING" icon="✨" />}

          {/* Modern Input Bar */}
          <View
            style={[
              styles.inputContainer,
              Platform.OS === "android" && keyboardOffset > 0 ? { marginBottom: keyboardOffset } : null,
            ]}
          >
            <View style={styles.inputPill}>
              <TouchableOpacity
                style={styles.attachBtn}
                onPress={() => {
                  Alert.alert("Send Image", "Choose source", [
                    { text: "Camera", onPress: takePhoto },
                    { text: "Photo Gallery", onPress: pickImage },
                    { text: "Cancel", style: "cancel" },
                  ]);
                }}
                disabled={uploading}
                activeOpacity={0.7}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <Ionicons name="attach" size={22} color={C.subText} />
                )}
              </TouchableOpacity>

              <TextInput
                value={input}
                onChangeText={handleInputChange}
                onFocus={() => {
                  if (isAtBottomRef.current) {
                    setTimeout(() => flatRef.current?.scrollToOffset({ offset: 0, animated: true }), 40);
                  }
                }}
                placeholder="Type a message..."
                placeholderTextColor={C.muted}
                style={styles.textInput}
                multiline
                returnKeyType="default"
              />

              <TouchableOpacity
                onPress={() => send()}
                disabled={!input.trim()}
                style={[
                  styles.sendBtn,
                  input.trim().length > 0 ? styles.sendBtnActive : styles.sendBtnInactive,
                ]}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    input.trim().length > 0
                      ? [C.primary, C.primaryDim]
                      : isDark
                      ? ["#223832", "#1B2F2A"]
                      : ["#E2ECE8", "#D5DFDC"]
                  }
                  style={styles.sendGradient}
                >
                  <Ionicons
                    name="send"
                    size={15}
                    color={input.trim().length > 0 ? "#021410" : C.muted}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Full-Screen Image Preview Modal */}
        <Modal
          visible={!!previewImageUrl}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPreviewImageUrl(null)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setPreviewImageUrl(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={36} color="#FFFFFF" />
            </TouchableOpacity>
            {previewImageUrl && (
              <Image source={{ uri: previewImageUrl }} style={styles.fullScreenImage} resizeMode="contain" />
            )}
          </View>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/* ─── Styles ─── */
const makeChatStyles = (C: ReturnType<typeof buildChatColors>) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    header: {
      height: 60,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bg,
    },
    headerBackBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    headerAvatarContainer: {
      position: "relative",
      marginLeft: 4,
      marginRight: 10,
    },
    headerAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    onlineDotBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: "#10B981",
      borderWidth: 2,
      borderColor: C.bg,
    },
    headerCenter: {
      flex: 1,
      justifyContent: "center",
      gap: 1,
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: C.text,
    },
    onlineStatusRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    onlineSubtitle: {
      fontSize: 11,
      fontWeight: "500",
      color: C.subText,
    },
    headerActionBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: C.cardInner,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: C.border,
    },
    centerLoading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    loadingText: {
      fontSize: 13,
      color: C.subText,
      fontWeight: "500",
    },
    chatContent: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 24,
      flexGrow: 1,
    },
    dateLabelRow: {
      alignItems: "center",
      marginVertical: 14,
    },
    dateLabelPill: {
      backgroundColor: C.datePillBg,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    dateLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: C.subText,
      letterSpacing: 0.4,
    },
    msgRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      marginBottom: 10,
    },
    msgLeft: {
      alignSelf: "flex-start",
    },
    msgRight: {
      alignSelf: "flex-end",
      flexDirection: "row-reverse",
    },
    botAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },
    botName: {
      fontSize: 11,
      fontWeight: "600",
      color: C.subText,
      marginBottom: 2,
      marginLeft: 2,
    },
    bubble: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      maxWidth: "100%",
    },
    bubbleUser: {
      backgroundColor: C.userBubble,
      borderBottomRightRadius: 4,
    },
    bubbleBot: {
      backgroundColor: C.botBubble,
      borderBottomLeftRadius: 4,
    },
    bubbleBotBorder: {
      borderWidth: 1,
      borderColor: C.bubbleBorder,
    },
    bubbleText: {
      fontSize: 14.5,
      fontWeight: "500",
      lineHeight: 21,
    },
    bubbleImage: {
      width: 220,
      height: 200,
      borderRadius: 14,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 2,
    },
    msgTime: {
      fontSize: 10,
      color: C.subText,
      fontWeight: "500",
    },
    tickContainer: {
      marginLeft: 2,
    },
    pricingCard: {
      backgroundColor: C.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.border,
      padding: 14,
      gap: 10,
      maxWidth: 290,
    },
    pricingIntro: {
      fontSize: 13,
      color: C.text,
      fontWeight: "500",
      lineHeight: 18,
    },
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
      paddingVertical: 9,
    },
    priceLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: C.subText,
      letterSpacing: 0.8,
    },
    priceRight: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 2,
    },
    priceValue: {
      fontSize: 16,
      fontWeight: "800",
      color: C.primary,
    },
    priceUnit: {
      fontSize: 11,
      fontWeight: "600",
      color: C.subText,
    },
    customQuoteBadge: {
      backgroundColor: C.primary + "20",
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    customQuoteText: {
      fontSize: 11,
      fontWeight: "700",
      color: C.primary,
    },
    pricingFooter: {
      fontSize: 12,
      color: C.subText,
      lineHeight: 17,
    },
    pricingActions: {
      gap: 8,
    },
    catalogBtnOuter: {
      borderRadius: 10,
      overflow: "hidden",
    },
    catalogBtn: {
      height: 38,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    catalogBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#021410",
    },
    specialistBtn: {
      height: 38,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: C.cardInner,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: C.border,
    },
    specialistBtnText: {
      fontSize: 13,
      fontWeight: "600",
      color: C.text,
    },
    botCardWrapper: {
      gap: 4,
    },
    emptyStateContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingTop: 40,
    },
    emptyStateIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: C.cardInner,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    emptyStateTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: C.text,
      marginBottom: 6,
      textAlign: "center",
    },
    emptyStateDesc: {
      fontSize: 13,
      color: C.subText,
      textAlign: "center",
      lineHeight: 19,
      marginBottom: 20,
    },
    quickChipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "center",
    },
    chipBtn: {
      backgroundColor: C.cardInner,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "600",
      color: C.text,
    },
    floatingScrollBtn: {
      position: "absolute",
      right: 18,
      bottom: 74,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 6,
      zIndex: 20,
    },
    floatingBadge: {
      position: "absolute",
      top: -6,
      right: -4,
      backgroundColor: "#EF4444",
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      borderWidth: 1.5,
      borderColor: C.bg,
    },
    floatingBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    typingRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      paddingHorizontal: 14,
      marginBottom: 8,
    },
    typingBubble: {
      backgroundColor: C.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
      borderBottomLeftRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 4,
    },
    typingDots: {
      flexDirection: "row",
      gap: 4,
      alignItems: "center",
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: C.primary,
    },
    typingLabel: {
      fontSize: 9,
      fontWeight: "700",
      color: C.subText,
      letterSpacing: 0.8,
    },
    inputContainer: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: C.bg,
      borderTopWidth: 1,
      borderColor: C.border,
    },
    inputPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: C.cardInner,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      minHeight: 46,
      gap: 6,
    },
    attachBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    textInput: {
      flex: 1,
      color: C.text,
      fontSize: 14,
      fontWeight: "500",
      paddingVertical: Platform.OS === "ios" ? 8 : 4,
      paddingHorizontal: 4,
      maxHeight: 90,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: "hidden",
    },
    sendBtnActive: {
      opacity: 1,
    },
    sendBtnInactive: {
      opacity: 0.6,
    },
    sendGradient: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.92)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalCloseButton: {
      position: "absolute",
      top: 48,
      right: 20,
      zIndex: 20,
    },
    fullScreenImage: {
      width: "92%",
      height: "82%",
    },
  });