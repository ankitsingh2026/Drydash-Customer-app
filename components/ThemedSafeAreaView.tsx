import React from 'react';
import { SafeAreaView, type ViewProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';

export type ThemedSafeAreaViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedSafeAreaView({ style, lightColor, darkColor, ...otherProps }: ThemedSafeAreaViewProps) {
  const { colors, isDark } = useTheme();

  const backgroundColor = isDark ? (darkColor ?? colors.background) : (lightColor ?? colors.background);

  return <SafeAreaView style={[{ backgroundColor, flex: 1 }, style]} {...otherProps} />;
}
export default ThemedSafeAreaView;
