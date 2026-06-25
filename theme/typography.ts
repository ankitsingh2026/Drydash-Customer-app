import { Platform } from "react-native";

export const typography = {
  fonts: Platform.select({
    ios: {
      sans: "System",
      serif: "Georgia",
      mono: "Courier New",
    },
    default: {
      sans: "normal",
      serif: "serif",
      mono: "monospace",
    },
  }),
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
    extraBold: "800" as const,
  },
};
