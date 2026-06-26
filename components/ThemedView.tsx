import React from 'react';
import { View, type ViewProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'background' | 'card';
};

export function ThemedView({ style, lightColor, darkColor, variant = 'background', ...otherProps }: ThemedViewProps) {
  const { colors, isDark } = useTheme();

  // Custom overrides take precedence
  const backgroundColor = isDark
    ? (darkColor ?? (variant === 'card' ? colors.card : colors.background))
    : (lightColor ?? (variant === 'card' ? colors.card : colors.background));

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
export default ThemedView;
