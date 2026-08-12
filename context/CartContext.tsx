// app/context/CartContext.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  image?: any; // require(...) or uri
  qty: number;
  meta?: any;
  type?: string;
};

type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  getQty: (id: string) => number;
  total: () => number;
  decreaseQty: (id: string) => void;
  isHydrated: boolean;
};

const CartContext = createContext<CartCtx | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { user } = useAuth();

  const userId = user?.user?.id ?? user?.id ?? "guest";
  const storageKey = `@drydash_cart_${userId}`;

  // 1. Load cart from local device storage on app startup / user switch
  useEffect(() => {
    let isMounted = true;
    const loadPersistedCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(storageKey);
        if (storedCart && isMounted) {
          const parsed: CartItem[] = JSON.parse(storedCart);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        } else if (isMounted) {
          setItems([]);
        }
      } catch (err) {
        console.log("Error loading persisted cart from AsyncStorage:", err);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    loadPersistedCart();

    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  // Helper to update React memory state + sync to AsyncStorage
  const persistAndSetItems = (updater: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const nextItems = updater(prev);
      AsyncStorage.setItem(storageKey, JSON.stringify(nextItems)).catch((err) => {
        console.log("Error saving cart to AsyncStorage:", err);
      });
      return nextItems;
    });
  };

  const addItem = (item: Omit<CartItem, "qty">, qty = 1) => {
    persistAndSetItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + qty } : p));
      }
      return [...prev, { ...item, qty }];
    });
  };

  const removeItem = (id: string) => {
    persistAndSetItems((prev) => prev.filter((p) => p.id !== id));
  };

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) return removeItem(id);
    persistAndSetItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty } : p)));
  };

  const decreaseQty = (id: string) => {
    persistAndSetItems((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, qty: p.qty - 1 } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const getQty = (id: string) => items.find((i) => i.id === id)?.qty ?? 0;

  const clear = () => {
    setItems([]);
    AsyncStorage.removeItem(storageKey).catch((err) => {
      console.log("Error clearing cart in AsyncStorage:", err);
    });
  };

  const total = () => items.reduce((s, it) => s + it.price * it.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        setQty,
        clear,
        getQty,
        total,
        decreaseQty,
        isHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
