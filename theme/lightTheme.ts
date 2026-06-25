import { colors } from "./colors";

export const lightTheme = {
  isDark: false,
  colors: {
    ...colors,
    background: "#F4F9F7",
    gradient: ["#E6F4F0", "#D3EBE4"] as [string, string, ...string[]],
    card: "#FFFFFF",
    text: "#0A251E",
    subText: "#00A374",
    textSecondary: "#5A736E",
    border: "#E0EDEA",
    ordergradient: ["#E6F4F0", "#D3EBE4", "#C0E2D8"] as [string, string, string],
    gray: "#1E3A34",
    newcard: ["#E6F4F0", "#D3EBE4"] as [string, string],
    lightborder: "#8ABFAF",
    
    // UI specific element colors
    inputBackground: "#E6F4F0",
    placeholderText: "#7BA79A",
    icon: "#00A374",
    tabBarBackground: "#FFFFFF",
    headerBackground: "#FFFFFF",
    modalBackground: "#FFFFFF",
    statusBar: "dark" as "light" | "dark",
    tabColor: "#E6E7E8",
    backdrop: "rgba(0, 0, 0, 0.5)"
  },
};
