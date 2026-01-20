import { AuthUser } from "@/features/auth/auth.types";
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

  saveTokens: (tokens: Tokens) => Promise<void>;
  setAuthUser: (user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
};

/* ---------------- CONTEXT ---------------- */

export const AuthContext = createContext<AuthContextType | null>(null);

/* ---------------- PROVIDER ---------------- */

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  /* Save tokens after OTP verification */
  const saveTokens = async (tokens: Tokens) => {
    await AsyncStorage.multiSet([
      ["accessToken", tokens.access.token],
      ["refreshToken", tokens.refresh.token],
    ]);
  };

  /* Set / update logged-in user */
  const setAuthUser = async (user: AuthUser) => {
    await AsyncStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  /* Logout & clear storage */
  const logout = async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        saveTokens,
        setAuthUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ---------------- HOOK ---------------- */

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("AuthContext not found");
  }
  return ctx;
};
