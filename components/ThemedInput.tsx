import React from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import { radius } from '@/theme/radius';

export type ThemedInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
  borderColor?: string;
};

export function ThemedInput({
  style,
  lightColor,
  darkColor,
  borderColor,
  ...rest
}: ThemedInputProps) {
  const { colors, isDark } = useTheme();

  const backgroundColor = isDark ? (darkColor ?? colors.inputBackground) : (lightColor ?? colors.inputBackground);
  const activeBorderColor = borderColor ?? colors.border;
  const textColor = colors.text;
  const placeholderTextColor = colors.placeholderText;

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor,
          borderColor: activeBorderColor,
          color: textColor,
        },
        style,
      ]}
      placeholderTextColor={placeholderTextColor}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
export default ThemedInput;
