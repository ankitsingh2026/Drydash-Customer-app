import React, { createContext, useContext, useState } from "react";
import { Appearance } from "react-native";
import { DarkTheme } from "../constants/colors";

type ThemeType = typeof DarkTheme;

interface ThemeContextProps {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemTheme = Appearance.getColorScheme();
  const [isDark, setIsDark] = useState(systemTheme !== "dark");

  const toggleTheme = () => setIsDark((prev) => !prev);

  const theme = isDark ? DarkTheme : DarkTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};
