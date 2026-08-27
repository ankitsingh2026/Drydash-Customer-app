import { AuthUser } from "@/features/auth/auth.types";
import {
  registerCustomerPushToken,
  unregisterCustomerPushToken,
} from "../lib/notifications/pushNotifications";
import { referralApi } from "@/features/auth/referral.api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

/* ---------------- TYPES ---------------- */

type Tokens = {
  access: {
    token: string;
    expires?: string;
  };
  refresh: {
    token: string;
    expires?: string;
  };
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  walletInitialized: boolean;

  saveTokens: (tokens: Tokens) => Promise<void>;
  setAuthUser: (user: AuthUser) => Promise<void>;
  initializeWallet: (referralCode?: string, targetCustomerId?: string) => Promise<void>;
  logout: () => Promise<void>;
};

/* ---------------- CONTEXT ---------------- */

export const AuthContext = createContext<AuthContextType | null>(null);

/* ---------------- PROVIDER ---------------- */

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletInitialized, setWalletInitialized] = useState(false);

  /* Restore auth state on app start */
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  useEffect(() => {
    const syncPushToken = async () => {
      const customerId = user?.user?.id ?? user?.id;
      if (!customerId) return;

      try {
        await registerCustomerPushToken(String(customerId));
      } catch (error) {
        console.log("Push token registration failed:", error);
      }
    };

    syncPushToken();
  }, [user]);

  /* Save tokens after OTP verification */
  const saveTokens = async (tokens: Tokens) => {
    await AsyncStorage.multiSet([
      ["accessToken", tokens.access.token],
      ["refreshToken", tokens.refresh.token],
    ]);
  };

  /* Initialize wallet and referral code for new/existing customer */
  const initializeWallet = async (referralCode?: string, targetCustomerId?: string) => {
    const customerId = targetCustomerId ?? user?.user?.id ?? user?.id;
    if (!customerId) {
      console.log("No customer ID found for wallet initialization");
      return;
    }

    // Check if already initialized
    const alreadyInitialized = await AsyncStorage.getItem(`wallet_init_${customerId}`);
    if (alreadyInitialized && !referralCode) {
      setWalletInitialized(true);
      return;
    }

    try {
      console.log("Initializing wallet and referral for customer:", customerId, "Referral Code:", referralCode);
      const res = await referralApi.initializeCustomer({ appCustomerId: customerId.toString(), referralCode });
      console.log("Wallet & Referral init API response:", res);
      await AsyncStorage.setItem(`wallet_init_${customerId}`, "true");
      setWalletInitialized(true);
      console.log("Wallet and referral initialized successfully");
    } catch (error) {
      console.error("Failed to initialize wallet:", error);
      // Don't throw - don't block app usage if wallet init fails
    }
  };

  /* Set / update logged-in user */
  const setAuthUser = async (user: AuthUser) => {
    await AsyncStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  /* Logout & clear storage */
  const logout = async () => {
    try {
      await unregisterCustomerPushToken();
    } catch (error) {
      console.log("Push token unregister failed:", error);
    }

    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        walletInitialized,
        saveTokens,
        setAuthUser,
        initializeWallet,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ---------------- HOOK ---------------- */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("AuthContext not found");
  }
  return ctx;
};

export const useAuthContext = useAuth;
