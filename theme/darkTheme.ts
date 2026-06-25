import { colors } from "./colors";

export const darkTheme = {
  isDark: true,
  colors: {
    ...colors,
    background: "#001714",
    gradient: ["#052420", "#003826"] as [string, string, ...string[]],
    card: "#102B25",
    text: "#C9E9E2",
    subText: "#22EBAB",
    textSecondary: "#7BA79A",
    border: "#1E3A34",
    ordergradient: ["#001A17", "#00332B", "#004D3F"] as [string, string, string],
    gray: "#fff",
    newcard: ["#052420", "#003826"] as [string, string],
    lightborder: "#2b8773",
    
    // UI specific element colors
    inputBackground: "#102B25",
    placeholderText: "#7BA79A",
    icon: "#2FE6A6",
    tabBarBackground: "#071F19",
    headerBackground: "#001714",
    modalBackground: "#102B25",
    statusBar: "light" as "light" | "dark",
    tabColor: "#007558",
    backdrop: "rgba(0, 0, 0, 0.5)",
  },
};
