import React from 'react';
import { TouchableOpacity, Text, StyleSheet, type TouchableOpacityProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export type ThemedButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: 'primary' | 'outline' | 'text';
  lightColor?: string;
  darkColor?: string;
  titleStyle?: any;
};

export function ThemedButton({
  title,
  variant = 'primary',
  lightColor,
  darkColor,
  style,
  titleStyle,
  ...rest
}: ThemedButtonProps) {
  const { theme, isDark } = useTheme();

  // Determine background and text color based on variant
  let backgroundColor = 'transparent';
  let borderColor = 'transparent';
  let textColor = theme.text;

  if (variant === 'primary') {
    backgroundColor = isDark ? (darkColor ?? theme.primary) : (lightColor ?? theme.primary);
    textColor = theme.background;
  } else if (variant === 'outline') {
    borderColor = theme.primary;
    textColor = theme.primary;
  } else if (variant === 'text') {
    textColor = theme.primary;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, borderColor, borderWidth: variant === 'outline' ? 1 : 0 },
        style,
      ]}
      activeOpacity={0.8}
      {...rest}
    >
      <Text style={[styles.text, { color: textColor }, titleStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ThemedButton;
