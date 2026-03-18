import React, { createContext, useContext } from "react";
import { DarkTheme } from "../constants/colors";

type ThemeType = typeof DarkTheme;

interface ThemeContextProps {
  theme: ThemeType;
}

const ThemeContext = createContext<ThemeContextProps | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeContext.Provider value={{ theme: DarkTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
};