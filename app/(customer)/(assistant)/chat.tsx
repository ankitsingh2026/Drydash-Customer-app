// SupportChat.tsx
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
  Alert,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getOrCreateRoom,
  fetchMessages,
  sendMessage,
  getBotReply,
  uploadChatImage,
  markCustomerMessagesAsRead,
} from "../../../features/chat/chat.api";
import {
  connectChatSocket,
  disconnectChatSocket,
  joinChatRoom,
  sendMessageViaSocket,
  onReceiveMessage,
  offReceiveMessage,
  sendTyping,
  sendStopTyping,
  onUserTyping,
  offUserTyping,
} from "../../../features/chat/chat.socket";
import { Message as ApiMessage } from "../../../features/chat/chat.types";
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "../../../context/ThemeContext";
import { useChat } from "@/context/ChatContext";
/* ─── palette (unchanged) ─── */
// const C = {
//   bg: "#021410",
//   card: "#0B1E1A",
//   cardInner: "#0D2420",
//   border: "#1A3330",
//   primary: "#2FE6A6",
//   primaryDim: "#1A9E74",
//   text: "#E6FFF7",
//   subText: "#6B8F84",
//   muted: "#3A5E55",
//   userBubble: "#2FE6A6",
//   botBubble: "#0D1F1C",
// };

function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function buildChatColors(theme: any, isDark: boolean) {
  return {
    bg: theme.background,
    card: theme.card,
    cardInner: theme.inputBackground,
    border: theme.border,
    primary: theme.primary,
    primaryDim: isDark ? theme.card : theme.background,
    text: theme.text,
    subText: theme.textSecondary,
    muted: theme.textSecondary,
    userBubble: theme.primary,
    botBubble: isDark ? theme.background : theme.card,
  };
}
/* ─── PricingCard (exactly as in your original) ─── */
function PricingCard({ onCatalog, onSpecialist }: { onCatalog: () => void; onSpecialist: () => void }) {
   const { theme, isDark } = useTheme();
  const C = buildChatColors(theme, isDark);
  const styles = makeChatStyles(C);
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

/* ─── TypingIndicator (unchanged) ─── */
function TypingIndicator() {
  const { theme, isDark } = useTheme();
  const C = buildChatColors(theme, isDark);
  const styles = makeChatStyles(C);
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

/* ─── Bubble (updated to accept real message objects) ─── */
// function Bubble({
//   msg,
//   onCatalog,
//   onSpecialist,
// }: {
//   msg: any; // local message object with type, text, senderType, time
//   onCatalog: () => void;
//   onSpecialist: () => void;
// }) {
//   const fade  = useRef(new Animated.Value(0)).current;
//   const slide = useRef(new Animated.Value(msg.senderType === "customer" ? 16 : -16)).current;

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fade,  { toValue: 1, duration: 260, useNativeDriver: true }),
//       Animated.spring(slide, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }),
//     ]).start();
//   }, []);

//   if (msg.type === "date_label") {
//     return (
//       <View style={styles.dateLabelRow}>
//         <Text style={styles.dateLabel}>{msg.text}</Text>
//       </View>
//     );
//   }

//   const isUser = msg.senderType === "customer";

//   return (
//     <Animated.View
//       style={[
//         styles.msgRow,
//         isUser ? styles.msgRight : styles.msgLeft,
//         { opacity: fade, transform: [{ translateX: slide }] },
//       ]}
//     >
//       {!isUser && (
//         <View style={styles.botAvatar}>
//           <Text style={{ fontSize: 12 }}>✨</Text>
//         </View>
//       )}

//       <View style={{ maxWidth: "78%", gap: 4 }}>
//         {!isUser && msg.type === "text" && (
//           <Text style={styles.botName}>DryDash</Text>
//         )}

//         {msg.type === "text" ? (
//           <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
//             <Text style={[styles.bubbleText, { color: isUser ? "#021410" : C.text }]}>
//               {msg.text}
//             </Text>
//           </View>
//         ) : (
//           <View style={styles.botCardWrapper}>
//             <Text style={styles.botName}>DryDash</Text>
//             <PricingCard onCatalog={onCatalog} onSpecialist={onSpecialist} />
//           </View>
//         )}

//         {msg.time && (
//           <Text style={[styles.msgTime, { alignSelf: isUser ? "flex-end" : "flex-start" }]}>
//             {msg.time}
//           </Text>
//         )}
//       </View>
//     </Animated.View>
//   );
// }

function Bubble({
  msg,
  onCatalog,
  onSpecialist,
  onPressImage, // new prop
}: {
  msg: any;
  onCatalog: () => void;
  onSpecialist: () => void;
  onPressImage: (url: string) => void; // new
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(msg.senderType === "customer" ? 16 : -16)).current;
  const { theme, isDark } = useTheme();
  const C = buildChatColors(theme, isDark);
  const styles = makeChatStyles(C);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(slide, { toValue: 0, friction: 9, tension: 70, useNativeDriver: true }),
    ]).start();
  }, []);

  // Date label
  if (msg.type === "date_label") {
    return (
      <View style={styles.dateLabelRow}>
        <Text style={styles.dateLabel}>{msg.text}</Text>
      </View>
    );
  }

  const isUser = msg.senderType === "customer";

  console.log('this is the msg==>>',msg.type)

  // Determine content to render inside the bubble
  let content: React.ReactNode;
  if (msg.type === "text") {
    content = (
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, { color: isUser ? "#021410" : C.text }]}>
          {msg.text}
        </Text>
      </View>
    );
  } else if (msg.type === "image") {
    content = (
      <View style={[styles.bubble,styles.bubbleBot,{ padding: 4, overflow: "hidden" }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPressImage(msg.fileUrl)}
      >
        <Image
          source={{ uri: msg.fileUrl }}
          style={{
            width: 220,
            height: 220,
            borderRadius: 12,
            resizeMode: "cover",
             backgroundColor: C.cardInner, // placeholder color
          }}
          // Optional: add loading/error handling
          onError={() => console.warn("Image load error", msg.fileUrl)}
        />
        {msg.text ? (
          <Text
            style={[
              styles.bubbleText,
              {
                color: isUser ? "#021410" : C.text,
                paddingHorizontal: 8,
                paddingVertical: 4,
                marginTop: 2,
              },
            ]}
          >
            {msg.text}
          </Text>
        ) : null}
        </TouchableOpacity>
      </View>
    );
  } else {
    // Fallback (e.g., pricing card) – you can keep your existing logic
    content = (
      <View style={styles.botCardWrapper}>
        <Text style={styles.botName}>DryDash</Text>
        <PricingCard onCatalog={onCatalog} onSpecialist={onSpecialist} />
      </View>
    );
  }

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

        {content}

        {msg.time && (
          <Text style={[styles.msgTime, { alignSelf: isUser ? "flex-end" : "flex-start" }]}>
            {msg.time}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
   const { setUnreadCount, setIsChatActive } = useChat();

  const { user } = useAuth();

  const auth_id = user?.user?.id ? user?.user?.id : user?.id;
  const appCustomerId = String(auth_id);
 
 useEffect(() => {
    setIsChatActive(true);
    return () => setIsChatActive(false);
  }, []);

  useEffect(() => {
    if (!roomId) return;

    // Mark all messages as read for this room
    markCustomerMessagesAsRead(roomId)
      .then(() => {
        setUnreadCount(0);                     // clear the badge
      })
      .catch((err) => console.error("Mark read failed:", err));

  }, [roomId]);



  // preview image in the chat list 
  
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);


  const seenMessageIds = useRef<Set<string>>(new Set());

  console.log("this is the messages array =>>>", messages);

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // 🔁 REPLACE THIS with your actual customer ID retrieval (AsyncStorage, Redux, etc.)
  useEffect(() => {
    const fetchCustomerId = async () => {
      // Example: const phone = await AsyncStorage.getItem('userPhone');
      const phone = "91" + (user?.user?.phone ?? user?.phone ?? "");
      setCustomerId(phone);
    };
    fetchCustomerId();
  }, []);

  // Initialize chat room and socket
  useEffect(() => {
    if (!customerId) return;

    const initChat = async () => {
      try {
        const room = await getOrCreateRoom(customerId,appCustomerId, undefined, 'global');
        setRoomId(room._id);

        const prevMessages = await fetchMessages(room._id);
        const formatted = prevMessages.map((m: any) => ({
          id: m._id,
          type: m.messageType,
          senderType: m.senderType,
          text: m.message,
          time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : now(),
          delivered : m.delivered,
          fileUrl: m.fileUrl,
          isDeleted:m.isDeleted,
          isRead:m.isRead,
          readAt:m.readAt,
        }));
        setMessages(formatted);

        connectChatSocket();
        joinChatRoom(room._id);

// onReceiveMessage((newMsg: any) => {
//   if (newMsg.roomId !== room._id) return;

//   const msgId = newMsg._id;
//   // Skip if we already have this message ID
//   if (seenMessageIds.current.has(msgId)) return;
//   seenMessageIds.current.add(msgId);

//   // Also skip if it's the message we just sent (optimistic already shown)
//   // But the ID check is enough; the optimistic message does not have a real _id yet.
//   // However, after API replaces the optimistic, the real _id will be added,
//   // and the socket will try to add it again – this is caught by the ID set.

//   console.log("this is the new message",newMsg)
  
//   setMessages((prev) => [
//     ...prev,
//     {
//       id: newMsg._id,
//       type: newMsg.messageType,
//       senderType: newMsg.senderType,
//       text: newMsg.message,
//       time: newMsg.createdAt ? new Date(newMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : now(),
//       delivered : newMsg.delivered,
//       fileUrl: newMsg.fileUrl,
//       isDeleted:newMsg.isDeleted,
//       isRead:newMsg.isRead,
//       readAt:newMsg.readAt,
//     },
//   ]);
//   setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
// });



        // Typing indicator from admin
  

  onReceiveMessage((newMsg: any) => {
  if (newMsg.roomId !== room._id) return;
  const msgId = newMsg._id;
  if (seenMessageIds.current.has(msgId)) return;
  seenMessageIds.current.add(msgId);

  setMessages((prev) => {
    // Check if there's an optimistic image message to replace
    const optimisticIndex = prev.findIndex(
      (m) =>
        m.id.startsWith('temp-img-') &&
        m.senderType === newMsg.senderType &&
        m.type === 'image' &&
        // Approximate time match (within 5 seconds) to avoid replacing wrong message
        Math.abs(
          new Date(m.time).getTime() -
          new Date(newMsg.createdAt).getTime()
        ) < 5000
    );

    if (optimisticIndex !== -1) {
      // Replace the optimistic with the real message
      const updated = [...prev];
      updated[optimisticIndex] = {
        id: newMsg._id,
        type: newMsg.messageType,        // 'image'
        senderType: newMsg.senderType,
        text: newMsg.message || '',
        fileUrl: newMsg.fileUrl || null,
        time: newMsg.createdAt
          ? new Date(newMsg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : now(),
        delivered: newMsg.delivered ?? true,
      };
      return updated;
    }

    // No optimistic found – add normally (for text messages or image from other device)
    return [
      ...prev,
      {
        id: newMsg._id,
        type: newMsg.messageType,
        senderType: newMsg.senderType,
        text: newMsg.message || '',
        fileUrl: newMsg.fileUrl || null,
        time: newMsg.createdAt
          ? new Date(newMsg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : now(),
        delivered: newMsg.delivered ?? true,
      },
    ];
  });

  setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
});
        
        onUserTyping(({ userId }) => {
          if (userId !== customerId) {
            setOtherTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 2000);
          }
        });

        // Optional: stop typing event
        // const socket = (await import('../../../features/chat/chat.socket')).default; // hack to get raw socket? simpler: just use a ref
        // Actually we don't have direct socket access, but we can add a listener via the socket instance if needed.
        // For simplicity, the timeout handles it.
      } catch (error) {
        console.error('Chat init error', error);
        Alert.alert('Error', 'Could not load chat. Please try again.');
      }
    };

    initChat();

    return () => {
      offReceiveMessage();
      offUserTyping();
      disconnectChatSocket();
    };
  }, [customerId]);

  // Auto-send pricing topic
  useEffect(() => {
    if (params.topic === "pricing" && roomId && customerId) {
      setTimeout(() => {
        sendUserMessage("I want to know about pricing.");
      }, 500);
    }
  }, [params.topic, roomId, customerId]);

  // ----- Image Upload Functions -----
const requestPermissions = async (): Promise<boolean> => {
  const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
  const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
    Alert.alert('Permission needed', 'Please allow access to camera and gallery.');
    return false;
  }
  return true;
};

const uploadImageToServer = async (asset: any): Promise<string> => {
  const formData = new FormData();
  formData.append('image', {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || 'photo.jpg',
  } as any);

  //upload image api call
  const url = await uploadChatImage(formData)

  return url
};

const uploadImage = async (asset: any, caption = '') => {
  if (!roomId || !customerId) return;
  setUploading(true);

  // Optimistic message (local URI)
  const tempId = `temp-img-${Date.now()}`;
  const optimisticMsg = {
    id: tempId,
    type: 'image',
    senderType: 'customer',
    text: caption,
    fileUrl: asset.uri,
    time: now(),
    delivered: false,
  };
  setMessages((prev) => [...prev]);
  setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);

  try {
    const fileUrl = await uploadImageToServer(asset);
    // Send via socket – same as admin panel

    console.log("this is the fileUrl------------------->>>>>>>>>>>>>>>>>>>>>>",fileUrl)
    sendMessageViaSocket(roomId, 'customer', customerId, caption, 'image', fileUrl);
  } catch (error) {
    console.error('Image upload error', error);
    Alert.alert('Error', 'Failed to upload image.');
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
  } finally {
    setUploading(false);
  }
};

const pickImage = () => {
  launchImageLibrary(
    {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    },
    (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to pick image');
        return;
      }
      const asset = response.assets?.[0];
      if (asset) {
        // The asset object contains: uri, type, fileName, fileSize, etc.
        uploadImage(asset);
      }
    }
  );
};

const takePhoto = () => {
  launchCamera(
    {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
      saveToPhotos: true, // optional
    },
    (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
        return;
      }
      if (response.errorCode) {
        Alert.alert('Error', response.errorMessage || 'Failed to take photo');
        return;
      }
      const asset = response.assets?.[0];
      if (asset) {
        uploadImage(asset);
      }
    }
  );
};

const sendUserMessage = async (text: string) => {
  if (!roomId || !customerId) return;

  const tempId = `temp-${Date.now()}-${Math.random()}`;
  const userMsg = {
    id: tempId,
    type: 'text',
    senderType: 'customer',
    text,
    time: now(),
  };
  // setMessages((prev) => [...prev, userMsg]); 
  flatRef.current?.scrollToEnd({ animated: true });

  try {
    // const savedMsg = await sendMessage(roomId, 'customer', customerId, text);
    console.log("i am called hereee-----------------------------------------------------------")
    sendMessageViaSocket(roomId, 'customer', customerId, text);

    // Replace optimistic message with real one
    // setMessages((prev) =>
    //   prev.map((m) =>
    //     m.id === tempId ? { ...m, id: savedMsg._id, _id: savedMsg._id } : m
    //   )
    // );
    // Add the real ID to seen set so socket won't add it again
    // seenMessageIds.current.add(savedMsg._id);
  } catch (err) {
    console.error('Send failed', err);
    Alert.alert('Error', 'Message could not be sent.');
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
    return;
  }

  // Bot reply (unchanged)
  // setBotTyping(true);
  // try {
  //   const botMsg = await getBotReply(roomId, text);
  //   setBotTyping(false);
  //   // Bot messages have their own unique ID; add to set as well
  //   seenMessageIds.current.add(botMsg._id);
  //   setMessages((prev) => [
  //     ...prev,
  //     {
  //       id: botMsg._id,
  //       type: 'text',
  //       senderType: 'bot',
  //       text: botMsg.message,
  //       time: botMsg.createdAt ? new Date(botMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : now(),
  //     },
  //   ]);
  // } catch (error) {
  //   setBotTyping(false);
  //   console.error('Bot reply error', error);
  // }
};

const openImagePreview = (url: string) => {
  setPreviewImageUrl(url);
};
const closeImagePreview = () => {
  setPreviewImageUrl(null);
};



  const handleInputChange = (text: string) => {
    setInput(text);
    if (!roomId || !customerId) return;
    if (text.trim().length > 0) {
      sendTyping(roomId, customerId, 'Customer');
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendStopTyping(roomId);
      }, 1000);
    } else {
      sendStopTyping(roomId);
    }
  };

  const send = (text?: string) => {
    const content = text ?? input;
    if (!content.trim()) return;
    setInput("");
    // Keyboard.dismiss(); // Keeping keyboard open on send
    sendUserMessage(content);
  };

  const scrollBottom = () =>
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

  const renderItem = ({ item }: { item: any }) => {
   console.log("this is the valuee of item",item)
   return  <Bubble
      msg={item}
      onCatalog={() => send("Show me the full catalog")}
      onSpecialist={() => send("I want to talk to a specialist")}
      onPressImage={openImagePreview} 
    />
  }

  useEffect(() => {
  seenMessageIds.current.clear();
}, [roomId]);

  return (
    <KeyboardAvoidingView style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
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

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        >
          <View style={{ flex: 1 }}>
            <FlatList
              ref={(r) => (flatRef.current = r)}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onContentSizeChange={scrollBottom}
              onLayout={scrollBottom}
            />

            {/* Image Preview Modal */}
<Modal
  visible={!!previewImageUrl}
  transparent={true}
  animationType="fade"
  onRequestClose={closeImagePreview}
>
  <View style={styles.modalOverlay}>
    <TouchableOpacity
      style={styles.modalCloseButton}
      onPress={closeImagePreview}
    >
      <Ionicons name="close-circle" size={40} color="#fff" />
    </TouchableOpacity>
    {previewImageUrl && (
      <Image
        source={{ uri: previewImageUrl }}
        style={styles.fullScreenImage}
        resizeMode="contain"
      />
    )}
  </View>
</Modal>

            {botTyping && <TypingIndicator />}
            {otherTyping && (
              <View style={styles.otherTypingContainer}>
                <Text style={styles.otherTypingText}>Admin is typing...</Text>
              </View>
            )}

            {/* Input row */}
            <View style={styles.inputRow}>
              <TouchableOpacity
  style={styles.attachBtn}
  onPress={() => {
    Alert.alert(
      'Add Image',
      'Choose image from gallery.',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  }}
  disabled={uploading}
>
  <Ionicons
    name={uploading ? "sync-outline" : "add-circle-outline"}
    size={24}
    color={uploading ? C.primary : C.subText}
  />
</TouchableOpacity>
              <TextInput
                value={input}
                onChangeText={handleInputChange}
                placeholder="Type your message..."
                placeholderTextColor={C.subText}
                style={styles.input}
                returnKeyType="send"
                onSubmitEditing={() => send()}
                onFocus={scrollBottom}
              />
              <TouchableOpacity onPress={() => send()} style={styles.sendBtnOuter}>
                <LinearGradient
                  colors={[C.primary, C.primaryDim]}
                  style={styles.sendBtn}
                >
                  <Ionicons name="send" size={15} color="#021410" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/* ─── Styles (exactly as in your original file) ─── */
const makeChatStyles = (C: ReturnType<typeof buildChatColors>) => StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  headerBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, alignItems: "flex-start", paddingLeft: 4, gap: 1 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: C.text },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary, shadowColor: C.primary, shadowOpacity: 1, shadowRadius: 4 },
  onlineText: { fontSize: 10, fontWeight: "700", color: C.primary, letterSpacing: 0.8 },
  chatContent: { paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  dateLabelRow: { alignItems: "center", marginVertical: 10 },
  dateLabel: { fontSize: 11, fontWeight: "700", color: C.subText, letterSpacing: 1 },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginBottom: 10 },
  msgLeft: { alignSelf: "flex-start" },
  msgRight: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  botAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  botName: { fontSize: 12, fontWeight: "700", color: C.primary, marginBottom: 3 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleUser: { backgroundColor: C.userBubble, borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: C.botBubble, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  msgTime: { fontSize: 10, color: C.subText, marginTop: 2 },
  botCardWrapper: { gap: 4 },
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
  priceList: { backgroundColor: C.cardInner, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10 },
  priceLabel: { fontSize: 10, fontWeight: "800", color: C.subText, letterSpacing: 0.8 },
  priceRight: { flexDirection: "row", alignItems: "baseline", gap: 2 },
  priceValue: { fontSize: 18, fontWeight: "900", color: C.primary },
  priceUnit: { fontSize: 11, fontWeight: "600", color: C.subText },
  customQuoteBadge: { backgroundColor: C.primary + "20", borderRadius: 8, borderWidth: 1, borderColor: C.primary + "40", paddingHorizontal: 10, paddingVertical: 5 },
  customQuoteText: { fontSize: 13, fontWeight: "800", color: C.primary },
  pricingFooter: { fontSize: 13, color: C.subText, lineHeight: 18 },
  pricingActions: { gap: 8 },
  catalogBtnOuter: { borderRadius: 10, overflow: "hidden" },
  catalogBtn: { height: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  catalogBtnText: { fontSize: 13, fontWeight: "800", color: C.text },
  specialistBtn: { height: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border },
  specialistBtnText: { fontSize: 13, fontWeight: "700", color: C.text },
  typingRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 14, marginBottom: 10 },
  typingBubble: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  typingDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.primary },
  typingLabel: { fontSize: 9, fontWeight: "700", color: C.subText, letterSpacing: 1 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  attachBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, height: 46, paddingHorizontal: 14, backgroundColor: C.card, borderRadius: 23, borderWidth: 1, borderColor: C.border, color: C.text, fontSize: 14, fontWeight: "500" },
  sendBtnOuter: { borderRadius: 22, overflow: "hidden" },
  sendBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  otherTypingContainer: { paddingHorizontal: 14, marginBottom: 5 },
  otherTypingText: { fontSize: 12, color: C.subText, fontStyle: "italic" },
  modalOverlay: {
  flex: 1,
  backgroundColor: C.bg,
  justifyContent: "center",
  alignItems: "center",
},
modalCloseButton: {
  position: "absolute",
  top: 40,
  right: 20,
  zIndex: 10,
},
fullScreenImage: {
  width: "100%",
  height: "100%",
},
});