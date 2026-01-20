import { registerApi } from "@/features/auth/auth.api";
import { AuthUser, RegisterPayload } from "@/features/auth/auth.types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
      setLoading(false);
    };
    loadUser();
  }, []);

  const register = async (payload: RegisterPayload) => {
    const res = await registerApi(payload);

    await AsyncStorage.multiSet([
      ["accessToken", res.accessToken],
      ["refreshToken", res.refreshToken],
    ]);

    setUser(res.user);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext not found");
  return ctx;
};
