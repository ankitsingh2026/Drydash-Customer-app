// context/NotificationContext.tsx

import axios from "axios";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuthContext } from "./AuthContext";
import { BASE_URL } from "@/lib/api/client";
import messaging from "@react-native-firebase/messaging";
import { router } from "expo-router";


type NotificationData = {
  pickupId?: string;
  orderId?: string;
  screen?: string;
  extra?: Record<string, unknown>;
  [key: string]: unknown;
};

export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  unread: boolean;
  time: string;
  kind?: string;
  data?: NotificationData;
  createdAt?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  paymentUpdate: any;
  setPaymentUpdate: React.Dispatch<React.SetStateAction<any>>;
  cancelledData: any,
  setCancelledData: React.Dispatch<React.SetStateAction<any>>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

function formatTimeAgo(dateValue?: string | Date | null) {
  if (!dateValue) return "Just now";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Just now";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

function normalizeNotification(n: any): NotificationItem {
  return {
    id: String(n?._id ?? n?.id ?? ""),
    title: n?.title ?? "Notification",
    subtitle: n?.message ?? "",
    unread: n?.isRead === false,
    time: formatTimeAgo(n?.createdAt),
    kind: n?.type,
    data: n?.data ?? {},
    createdAt: n?.createdAt,
  };
}

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuthContext();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [paymentUpdate, setPaymentUpdate] = useState<any>(null);
  const [cancelledData, setCancelledData] = useState({});

  const customerId = user?.user?.id ?? user?.id;
  const socketRef = useRef<Socket | null>(null);

  const upsertNotification = useCallback((item: NotificationItem) => {
    setNotifications((prev) => {
      const exists = prev.some((n) => n.id === item.id);
      if (exists) {
        return prev.map((n) => (n.id === item.id ? { ...n, ...item } : n));
      }
      return [item, ...prev].slice(0, 50);
    });
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!customerId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await axios.get(
        `${BASE_URL}/api/v1/customer/notifications/${customerId}`,
      );

      const data = Array.isArray(res.data?.data) ? res.data.data : [];

      const mapped = data.map(normalizeNotification);

      setNotifications(mapped);
      setUnreadCount(
        Number(
          res.data?.unreadCount ??
            res.data?.total ??
            mapped.filter((n: any) => n.unread).length,
        ),
      );
    } catch (err) {
      console.log("fetchNotifications error", err);
    }
  }, [customerId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          time: formatTimeAgo(n.createdAt),
        })),
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!customerId) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    refreshNotifications();

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(BASE_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinCustomer", { customerId });
      refreshNotifications();
    });


    socket.on("webhook_trigger", (data) => {
      console.log("Received payment update:", data);
      setPaymentUpdate(data);
    });

    socket.on("CUSTOMER_NOTIFICATION", (payload: any) => {
      const item = normalizeNotification(payload?.notification);

      upsertNotification({
        ...item,
        unread: true,
        time: "Just now",
      });

      if (typeof payload?.unreadCount === "number") {
        setUnreadCount(payload.unreadCount);
      }
    });

    socket.on("CUSTOMER_NOTIFICATION_READ", ({ id, unreadCount }) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
      );
      setUnreadCount(unreadCount);
    });

    socket.on("CUSTOMER_NOTIFICATION_READ_ALL", ({ unreadCount }) => {
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount(unreadCount);
    });


    //for canceeled pickup update
    socket.on("pickupCancelled", (data) => {
      console.log("Socket error:", data);
      setCancelledData(data)
    });

    socket.on("connect_error", (err) => {
      console.log("Socket error:", err.message);
    });

    // Helper to route notification clicks
    const handleNotificationNavigation = (remoteMessage: any) => {
      if (!remoteMessage?.data) return;
      const { type, roomId, orderId } = remoteMessage.data;

      if (type === "chat" || roomId) {
        router.push("/(customer)/(assistant)/chat");
      } else if (type === "payment_success" || orderId) {
        if (orderId) {
          router.push(`/(customer)/orders/${orderId}`);
        } else {
          router.push("/(customer)/(tabs)/orders");
        }
      }
    };

    // Handle foreground FCM messages
    const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      console.log("FCM foreground notification received:", remoteMessage);
      refreshNotifications();
    });

    // Handle notification click when the app is in the background
    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log("Notification caused app to open from background state:", remoteMessage);
      handleNotificationNavigation(remoteMessage);
    });

    // Check if app was opened from a quit state by a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log("Notification caused app to open from quit state:", remoteMessage);
          setTimeout(() => {
            handleNotificationNavigation(remoteMessage);
          }, 1000);
        }
      });

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      unsubscribeOnMessage();
      unsubscribeNotificationOpened();
    };
  }, [customerId, refreshNotifications, upsertNotification]);

  const markRead = async (id: string) => {
    if (!customerId) return;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await axios.patch(`${BASE_URL}/api/v1/customer/notifications/read/${id}`, {
        customerId,
      });
    } catch (err) {
      console.log("markRead error", err);
      refreshNotifications(); // rollback safety
    }
  };

  const markAllRead = async () => {
    if (!customerId) return;

    // optimistic
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setUnreadCount(0);

    try {
      await axios.patch(
        `${BASE_URL}/api/v1/customer/notifications/read-all/${customerId}`,
      );
    } catch (err) {
      console.log("markAllRead error", err);
      refreshNotifications(); // rollback
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        refreshNotifications,
        paymentUpdate,
        setPaymentUpdate,
        cancelledData,
        setCancelledData
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be inside provider");
  return ctx;
};
