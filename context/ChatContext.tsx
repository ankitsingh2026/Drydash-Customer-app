import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Audio } from "expo-av";
import {
  connectChatSocket,
  disconnectChatSocket,
  joinChatRoom,
  sendMessageViaSocket,
  onReceiveMessage,
  offReceiveMessage,
  onUserTyping,
  offUserTyping,
} from "../features/chat/chat.socket";
import { getOrCreateRoom, fetchMessages, markCustomerMessagesAsRead } from "../features/chat/chat.api";

export interface ChatMessage {
  id: string;
  type: string;
  senderType: string;
  text: string;
  time: string;
}

interface ChatContextType {
  messages: ChatMessage[];
  unreadCount: number;
  roomId: string | null;
  customerId: string | null;
  isChatActive: boolean;
  setIsChatActive: (active: boolean) => void;
  otherTyping: boolean;
  sendMessage: (text: string) => void;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  loadChatData: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isChatActive, setIsChatActive] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [latestMessage, setLatestMessage] = useState<ChatMessage | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  const seenMessageIds = useRef<Set<string>>(new Set());
  const typingTimeoutRef = useRef<any>(null);
  const isChatActiveRef = useRef(false);

  // Sync ref with live state to avoid stale closures in socket listeners
  useEffect(() => {
    isChatActiveRef.current = isChatActive;
  }, [isChatActive]);

  const rawPhone = user?.user?.phone ?? user?.phone;
  const customerId = rawPhone ? "91" + rawPhone : null;

  const playIncomingSound = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/sounds/chat_incoming.mp3")
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log("Error playing chat sound:", error);
    }
  }, []);

  const loadChatData = useCallback(async () => {
    if (!customerId) return;
    try {
      const room = await getOrCreateRoom(customerId, undefined, "global");
      setRoomId(room._id);
      setUnreadCount(room.unreadCustomerCount || 0);

      const prevMessages = await fetchMessages(room._id);
      const formatted = prevMessages.map((m: any) => ({
        id: m._id,
        type: "text",
        senderType: m.senderType,
        text: m.message,
        time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : now(),
      }));
      setMessages(formatted);

      // Connect socket & join room
      connectChatSocket();
      joinChatRoom(room._id);

      // Clear listener if any
      offReceiveMessage();
      offUserTyping();

      // Listen for incoming messages
      onReceiveMessage((newMsg: any) => {
        if (newMsg.roomId !== room._id) return;

        const msgId = newMsg._id;
        if (seenMessageIds.current.has(msgId)) return;
        seenMessageIds.current.add(msgId);

        const formattedMsg = {
          id: newMsg._id,
          type: "text",
          senderType: newMsg.senderType,
          text: newMsg.message,
          time: newMsg.createdAt ? new Date(newMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : now(),
        };

        setMessages((prev) => [...prev, formattedMsg]);

        // Show banner and increment count if chat screen is not active and message is from admin/bot
        if (newMsg.senderType !== "customer") {
          const isActive = isChatActiveRef.current;
          setUnreadCount((c) => {
            return isActive ? 0 : c + 1;
          });

          playIncomingSound();

          if (!isActive) {
            setLatestMessage(formattedMsg);
            setShowBanner(true);
          } else {
            markCustomerMessagesAsRead(room._id).catch((err) =>
              console.error("Error marking live message as read:", err)
            );
          }
        }
      });

      // Typing indicators
      onUserTyping(({ userId }) => {
        if (userId !== customerId) {
          setOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 2000);
        }
      });

    } catch (error) {
      console.error("Error setting up chat context:", error);
    }
  }, [customerId, playIncomingSound]);

  useEffect(() => {
    if (customerId) {
      loadChatData();
    } else {
      disconnectChatSocket();
      setRoomId(null);
      setMessages([]);
      setUnreadCount(0);
    }

    return () => {
      offReceiveMessage();
      offUserTyping();
      disconnectChatSocket();
    };
  }, [customerId]);

  // Keep seenMessageIds clear when room changes
  useEffect(() => {
    seenMessageIds.current.clear();
  }, [roomId]);

  // If user enters chat screen, clear unread count and hide banner
  useEffect(() => {
    if (isChatActive && roomId) {
      setUnreadCount(0);
      setShowBanner(false);
      markCustomerMessagesAsRead(roomId).catch((err) =>
        console.error("Error marking messages as read on screen load:", err)
      );
    }
  }, [isChatActive, roomId]);

  const sendMessage = useCallback((text: string) => {
    if (!roomId || !customerId) return;
    sendMessageViaSocket(roomId, "customer", customerId, text);
  }, [roomId, customerId]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        unreadCount,
        roomId,
        customerId,
        isChatActive,
        setIsChatActive,
        otherTyping,
        sendMessage,
        setUnreadCount,
        loadChatData,
      }}
    >
      {children}
      {showBanner && latestMessage && (
        <InAppNotificationBanner
          message={latestMessage}
          onDismiss={() => setShowBanner(false)}
        />
      )}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
};

// --- In-App Notification Banner Component ---
const InAppNotificationBanner = ({ message, onDismiss }: { message: ChatMessage; onDismiss: () => void }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    // Slide down
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();

    // Auto dismiss after 4.5 seconds
    const timer = setTimeout(() => {
      dismiss();
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  const handlePress = () => {
    dismiss();
    router.push("/(customer)/(assistant)/chat");
  };

  return (
    <Animated.View
      style={[
        bannerStyles.container,
        {
          transform: [{ translateY }],
          top: Math.max(insets.top, 10),
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={bannerStyles.content}>
        <View style={bannerStyles.iconContainer}>
          <LinearGradient
            colors={["#2FE6A6", "#1A9E74"]}
            style={bannerStyles.iconGradient}
          >
            <Ionicons name="sparkles" size={18} color="#021410" />
          </LinearGradient>
        </View>

        <View style={bannerStyles.textContainer}>
          <Text style={bannerStyles.title} numberOfLines={1}>
            DryDash Support
          </Text>
          <Text style={bannerStyles.message} numberOfLines={2}>
            {message.text}
          </Text>
        </View>

        <TouchableOpacity onPress={dismiss} style={bannerStyles.closeBtn}>
          <Ionicons name="close" size={18} color="#6B8F84" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const bannerStyles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 16,
    backgroundColor: "#0B1E1A",
    borderWidth: 1,
    borderColor: "#1A3330",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E6FFF7",
  },
  message: {
    fontSize: 13,
    color: "#6B8F84",
    lineHeight: 18,
  },
  closeBtn: {
    padding: 4,
  },
});
