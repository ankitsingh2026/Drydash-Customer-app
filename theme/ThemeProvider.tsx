import React, { createContext, useState, useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkTheme } from "./darkTheme";
import { lightTheme } from "./lightTheme";

type ThemeMode = "light" | "dark";

export interface ThemeContextProps {
  colors: typeof darkTheme.colors;
  theme: typeof darkTheme.colors; // compatibility alias!
  isDark: boolean;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextProps | null>(null);

const THEME_STORAGE_KEY = "user_theme_mode";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  
  // Set default state based on system scheme
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    (systemScheme === "light" ? "light" : "dark") as ThemeMode
  );

  useEffect(() => {
    // Load theme from storage on mount
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === "light" || savedTheme === "dark") {
          setThemeModeState(savedTheme);
        } else if (systemScheme === "light" || systemScheme === "dark") {
          setThemeModeState(systemScheme);
        }
      } catch (e) {
        console.error("Failed to load theme from storage", e);
      }
    };
    loadTheme();
  }, [systemScheme]);

  const toggleTheme = async () => {
    const nextMode = themeMode === "light" ? "dark" : "light";
    setThemeModeState(nextMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (e) {
      console.error("Failed to save theme to storage", e);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.error("Failed to save theme to storage", e);
    }
  };

  const activeTheme = useMemo(() => {
    return themeMode === "dark" ? darkTheme : lightTheme;
  }, [themeMode]);

  const contextValue = useMemo(() => {
    return {
      colors: activeTheme.colors,
      theme: activeTheme.colors, // compatibility alias!
      isDark: activeTheme.isDark,
      themeMode,
      toggleTheme,
      setThemeMode,
    };
  }, [activeTheme, themeMode]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
