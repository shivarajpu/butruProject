/**
 * AppInput — Globally themed text input component.
 *
 * All color values come from the Redux theme store via useAppTheme().
 * NEVER hardcode hex values here.
 *
 * Usage:
 *   <AppInput
 *     placeholder="Search products..."
 *     value={query}
 *     onChangeText={setQuery}
 *   />
 *
 *   <AppInput
 *     label="Phone Number"
 *     placeholder="Enter phone"
 *     keyboardType="phone-pad"
 *     error={errors.phone}
 *   />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  containerStyle,
  inputContainerStyle,
  leftIcon,
  rightIcon,
  ...textInputProps
}) => {
  const theme = useAppTheme();
  const { colors, fontFamily } = theme;
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.borderFocus
    : colors.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: colors.textSecondary, fontFamily: fontFamily.medium },
          ]}>
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            backgroundColor: colors.surface,
          },
          inputContainerStyle,
        ]}>
        {leftIcon ? (
          <View style={styles.iconSlot}>{leftIcon}</View>
        ) : null}

        <TextInput
          {...textInputProps}
          onFocus={e => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              color: colors.text,
              fontFamily: fontFamily.regular,
            },
            textInputProps.style,
          ]}
        />

        {rightIcon ? (
          <View style={styles.iconSlot}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text
          style={[
            styles.errorText,
            { color: colors.error, fontFamily: fontFamily.regular },
          ]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  iconSlot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  errorText: {
    fontSize: 11,
    marginTop: 4,
  },
});

export default AppInput;
