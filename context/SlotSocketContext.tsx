import React, { createContext, useContext, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = "https://test.drydash.in"; 

// Context type: exposes a subscribe function
const SlotSocketContext = createContext<{ onSlotUpdate: (cb: () => void) => () => void }>({
  onSlotUpdate: () => () => {},
});

export const SlotSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const listeners = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    const socket: Socket = io(API_URL, { transports: ["websocket", "polling"] });

    socket.on("slot_updated", () => {
      listeners.current.forEach(cb => cb());
    });
    console.log("Connected to slot socket!");

    return () => {
      socket.disconnect();
    };
  }, []);

  // Subscribe to slot updates
  const onSlotUpdate = (cb: () => void) => {
    listeners.current.add(cb);
    return () => listeners.current.delete(cb);
  };

  return (
    <SlotSocketContext.Provider value={{ onSlotUpdate }}>
      {children}
    </SlotSocketContext.Provider>
  );
};

export const useSlotSocket = () => useContext(SlotSocketContext);
