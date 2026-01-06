import { Bell, X } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";

const { height, width } = Dimensions.get("window");

const CARD_HEIGHT = height * 0.45;
const CARD_WIDTH = width - 32;
const DISMISS_THRESHOLD = 100;
const FLING_VELOCITY = 0.8;

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Pickup Scheduled",
    message: "Your pickup is scheduled today at 4:00 PM",
  },
  {
    id: 2,
    title: "Order Completed",
    message: "Order #2479 has been delivered successfully",
  },
];

export function NotificationsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  const panY = useRef(new Animated.Value(0)).current;
  const combinedTranslateY = Animated.add(translateY, panY);

  // PanResponder: create once
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,

      onPanResponderGrant: () => {
        panY.setValue(0);
      },

      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },

      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > FLING_VELOCITY) {
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 0,
              duration: 180,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 120,
              duration: 180,
              useNativeDriver: true,
            }),
            Animated.timing(panY, {
              toValue: height,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 0.96,
              duration: 180,
              useNativeDriver: true,
            }),
          ]).start(() => {
            panY.setValue(0);
            translateY.setValue(30);
            scale.setValue(0.95);
            onClose();
          });
        } else {
          Animated.spring(panY, {
            toValue: 0,
            friction: 7,
            useNativeDriver: true,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        Animated.spring(panY, {
          toValue: 0,
          friction: 7,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 30,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.95,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start(() => panY.setValue(0));
    }
  }, [visible, panY, opacity, translateY, scale]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Backdrop closes on press */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Card - DO NOT attach panHandlers here */}
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            bottom: insets.bottom + 20,
            opacity,
            transform: [{ translateY: combinedTranslateY }, { scale }],
          },
        ]}
      >
        {/* DRAG ZONE: attach panHandlers ONLY to this single View */}
        {/* DRAG AREA */}
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View
            style={[
              styles.handle,
              { backgroundColor: theme.border || "rgba(0,0,0,0.15)" },
            ]}
          />
        </View>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text || "#0f172a" }]}>
            Notifications
          </Text>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={[
              styles.closeBtn,
              { backgroundColor: theme.border || "rgba(0,0,0,0.06)" },
            ]}
          >
            <X size={18} color={theme.subText} />
          </TouchableOpacity>
        </View>


        {/* Content: list remains normal (touches not intercepted) */}
        <ScrollView
          style={{ marginTop: 8 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {NOTIFICATIONS.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.item,
                { backgroundColor: pressed ? theme.border : "transparent" },
              ]}
              android_ripple={{ color: theme.border || "rgba(0,0,0,0.06)" }}
            >
              {/* Text block contains title row (icon + title) then message below */}
              <View style={styles.textBlock}>
                <View style={styles.titleRow}>
                  <Bell size={18} color={theme.primary} style={styles.iconInline} />
                  <Text
                    numberOfLines={1}
                    style={[styles.itemTitle, { color: theme.text }]}
                  >
                    {item.title}
                  </Text>
                </View>

                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={[styles.itemText, { color: theme.subText }]}
                >
                  {item.message}
                </Text>
              </View>
            </Pressable>
          ))}


          {NOTIFICATIONS.length === 0 && (
            <Text style={[styles.empty, { color: theme.subText }]}>
              No notifications yet
            </Text>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    padding: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  title: { fontSize: 18, fontWeight: "800" },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 6,
    paddingBottom: 4,
  },

  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    opacity: 0.9,
  },

  item: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: "flex-start", // top-align the block so title sits at top
  },

  textBlock: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-start",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center", // ensures icon and title are vertically centered with each other
  },

  iconInline: {
    marginRight: 10, // spacing between icon and title
  },

  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },

  itemText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
    marginBottom: 8,
    marginLeft: 30,
    color: "#64748b",
  },
});
