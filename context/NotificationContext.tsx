// context/NotificationContext.tsx
import React, { createContext, useContext, useState } from "react";

export type NotificationItem = {
  id: string;
  title: string;
  subtitle?: string;
  unread?: boolean;
};

type Ctx = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
};

const NotificationContext = createContext<Ctx | null>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: "1", title: "Pickup Scheduled", subtitle: "Today • 4–6 PM", unread: true },
    { id: "2", title: "Order Delivered", subtitle: "Order #2479 completed", unread: true },
    { id: "3", title: "Wallet Credited", subtitle: "₹200 added to wallet" },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () =>
    setNotifications(n => n.map(i => ({ ...i, unread: false })));

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be inside provider");
  return ctx;
};
