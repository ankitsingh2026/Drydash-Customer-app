import { BASE_URL } from "@/lib/api/client";
import React, { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";

type SocketContextType = {
  onSlotUpdate: (cb: () => void) => () => void;
  onWalletUpdate: (cb: (data: any) => void) => () => void;
  onReferralUpdate: (cb: (data: any) => void) => () => void;
};

const SlotSocketContext = createContext<SocketContextType>({
  onSlotUpdate: () => () => {},
  onWalletUpdate: () => () => {},
  onReferralUpdate: () => () => {},
});

export const SlotSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const slotListeners = useRef<Set<() => void>>(new Set());
  const walletListeners = useRef<Set<(data: any) => void>>(new Set());
  const referralListeners = useRef<Set<(data: any) => void>>(new Set());

  const appCustomerId = user?.id ? String(user.id) : "";

  useEffect(() => {
    const socket: Socket = io(BASE_URL, { transports: ["websocket", "polling"] });

    socket.on("connect", () => {
      if (appCustomerId) {
        console.log(`🔌 Socket connected, joining customer room: customer:${appCustomerId}`);
        socket.emit("joinCustomer", { customerId: appCustomerId });
      }
    });

    socket.on("slot_updated", () => {
      slotListeners.current.forEach(cb => cb());
    });

    socket.on("wallet_balance_update", (data) => {
      console.log("💳 Real-time wallet_balance_update received:", data);
      walletListeners.current.forEach(cb => cb(data));
    });

    socket.on("referral_status_update", (data) => {
      console.log("🤝 Real-time referral_status_update received:", data);
      referralListeners.current.forEach(cb => cb(data));
    });

    socket.on("referral_reward_earned", (data) => {
      console.log("🎁 Real-time referral_reward_earned received:", data);
      referralListeners.current.forEach(cb => cb(data));
    });

    return () => {
      socket.disconnect();
    };
  }, [appCustomerId]);

  const onSlotUpdate = (cb: () => void) => {
    slotListeners.current.add(cb);
    return () => { slotListeners.current.delete(cb); };
  };

  const onWalletUpdate = (cb: (data: any) => void) => {
    walletListeners.current.add(cb);
    return () => { walletListeners.current.delete(cb); };
  };

  const onReferralUpdate = (cb: (data: any) => void) => {
    referralListeners.current.add(cb);
    return () => { referralListeners.current.delete(cb); };
  };

  return (
    <SlotSocketContext.Provider value={{ onSlotUpdate, onWalletUpdate, onReferralUpdate }}>
      {children}
    </SlotSocketContext.Provider>
  );
};

export const useSlotSocket = () => useContext(SlotSocketContext);
