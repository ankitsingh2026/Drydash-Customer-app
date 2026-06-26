import React from 'react';
import { ScrollView, type ScrollViewProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export type ThemedScrollViewProps = ScrollViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedScrollView({ style, lightColor, darkColor, ...otherProps }: ThemedScrollViewProps) {
  const { colors, isDark } = useTheme();

  const backgroundColor = isDark ? (darkColor ?? colors.background) : (lightColor ?? colors.background);

  return <ScrollView style={[{ backgroundColor }, style]} {...otherProps} />;
}
export default ThemedScrollView;
