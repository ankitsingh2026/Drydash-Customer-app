import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/useTheme';

export type ThemedIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  lightColor?: string;
  darkColor?: string;
  style?: any;
};

export function ThemedIcon({
  name,
  size = 24,
  lightColor,
  darkColor,
  style,
}: ThemedIconProps) {
  const { colors, isDark } = useTheme();

  const color = isDark ? (darkColor ?? colors.icon) : (lightColor ?? colors.icon);

  return <Ionicons name={name} size={size} color={color} style={style} />;
}
export default ThemedIcon;
