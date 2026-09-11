/**
 * AppButton — Globally themed button component.
 *
 * All color values come from the Redux theme store via useAppTheme().
 * NEVER hardcode hex values here.
 *
 * Usage:
 *   <AppButton label="Add to Cart" onPress={handlePress} />
 *   <AppButton label="Cancel" variant="outline" onPress={handlePress} />
 *   <AppButton label="Skip" variant="ghost" onPress={handlePress} />
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label?: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const SIZE_MAP: Record<Size, { paddingVertical: number; fontSize: number; borderRadius: number }> = {
  sm: { paddingVertical: 6, fontSize: 12, borderRadius: 6 },
  md: { paddingVertical: 10, fontSize: 14, borderRadius: 8 },
  lg: { paddingVertical: 14, fontSize: 16, borderRadius: 10 },
};

const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
}) => {
  const theme = useAppTheme();
  const { colors, fontFamily } = theme;
  const sz = SIZE_MAP[size];

  const containerStyle: ViewStyle = {
    paddingVertical: sz.paddingVertical,
    paddingHorizontal: sz.paddingVertical * 2.2,
    borderRadius: sz.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...(fullWidth && { width: '100%' }),
    opacity: disabled ? 0.5 : 1,
    ...(variant === 'primary' && { backgroundColor: colors.primary }),
    ...(variant === 'outline' && {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.primary,
    }),
    ...(variant === 'ghost' && { backgroundColor: 'transparent' }),
  };

  const labelStyle: TextStyle = {
    fontFamily: fontFamily.bold,
    fontSize: sz.fontSize,
    ...(variant === 'primary' && { color: colors.textOnPrimary }),
    ...(variant === 'outline' && { color: colors.primary }),
    ...(variant === 'ghost' && { color: colors.primary }),
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[containerStyle, style]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.textOnPrimary : colors.primary}
        />
      ) : (
        <>
          {leftIcon}
          {children ?? <Text style={[labelStyle, textStyle]}>{label}</Text>}
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

export default AppButton;
