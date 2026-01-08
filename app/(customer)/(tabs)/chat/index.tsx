import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
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
import { useTheme } from "../../../../context/ThemeContext";

type Message = {
  id: string;
  text: string;
  sender: "user" | "support";
  time: string;
};

export default function Chat() {
  const { theme } = useTheme();
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hi 👋 Welcome to Luxe Laundry support!",
      sender: "support",
      time: "10:20 AM",
    },
    {
      id: "2",
      text: "How can we help you today?",
      sender: "support",
      time: "10:20 AM",
    },
    {
      id: "3",
      text: "I want to track my order",
      sender: "user",
      time: "10:22 AM",
    },
  ]);

  const flatRef = useRef<FlatList<Message> | null>(null);

const sendMessage = () => {
  if (!message.trim()) return;

  const newMsg: Message = {
    id: Date.now().toString(),
    text: message,
    sender: "user",
    time: "Now",
  };

  setMessages((prev) => [...prev, newMsg]);
  setMessage("");

  setTimeout(() => {
    flatRef.current?.scrollToEnd({ animated: true });
  }, 50);
};


  const renderItem = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";

    return (
      <View
        style={[
          styles.messageWrapper,
          isUser ? styles.alignRight : styles.alignLeft,
        ]}
      >
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isUser ? theme.primary : theme.card,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isUser ? "#000" : theme.text },
            ]}
          >
            {item.text}
          </Text>
        </View>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    );
  };

  // Choose behavior per platform (Android: 'height' often works better)
  const behavior = Platform.OS === "ios" ? "padding" : "height";
  // Adjust offset depending on header size (tweak if needed)
  const keyboardVerticalOffset = Platform.OS === "ios" ? 90 : 80;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={behavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled
      >
        {/* Dismiss keyboard when tapping outside */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: theme.background }]}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Support Chat
              </Text>
              <View style={styles.status}>
                <View style={styles.onlineDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>

            {/* FlatList inverted so newest message is at bottom and keyboard pushes it up */}
            <FlatList
              ref={(r) => (flatRef.current = r)}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() =>
                flatRef.current?.scrollToEnd({ animated: true })
              }
            />


            {/* INPUT */}
            <View style={[styles.inputRow, { backgroundColor: theme.card }]}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type your message..."
                placeholderTextColor="#94a3b8"
                style={[styles.input, { color: theme.text }]}
                onFocus={() =>
                  // scroll to bottom when input focused (inverted list => offset 0)
                  setTimeout(() => flatRef.current?.scrollToOffset({ offset: 0, animated: true }), 50)
                }
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />

              <TouchableOpacity
                onPress={sendMessage}
                activeOpacity={0.8}
                style={[styles.sendBtn, { backgroundColor: theme.primary }]}
              >
                <Ionicons name="send" size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* HEADER */
  header: {
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#1f2937",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
  },

  /* MESSAGE */
  messageWrapper: {
    marginBottom: 14,
    maxWidth: "80%",
  },
  alignLeft: {
    alignSelf: "flex-start",
  },
  alignRight: {
    alignSelf: "flex-end",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 14,
    fontWeight: "500",
  },
  time: {
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 4,
    alignSelf: "flex-end",
  },

  /* INPUT */
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#1f2937",
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
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
