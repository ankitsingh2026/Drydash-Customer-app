import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { shadows } from '@/theme/shadows';
import { radius } from '@/theme/radius';

export type ThemedCardProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  hasShadow?: boolean;
  hasBorder?: boolean;
};

export function ThemedCard({
  style,
  lightColor,
  darkColor,
  hasShadow = true,
  hasBorder = true,
  ...otherProps
}: ThemedCardProps) {
  const { colors, isDark } = useTheme();

  const backgroundColor = isDark ? (darkColor ?? colors.card) : (lightColor ?? colors.card);
  const borderColor = colors.border;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor },
        hasBorder && { borderColor, borderWidth: 1 },
        hasShadow && shadows.sm,
        style,
      ]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: 12,
  },
});
export default ThemedCard;
