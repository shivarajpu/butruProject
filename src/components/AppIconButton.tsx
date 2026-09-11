import React, { type ReactNode } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

type AppIconButtonProps = {
  icon: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
};

const AppIconButton = ({
  icon,
  onPress,
  accessibilityLabel,
  size = 40,
  style,
  disabled = false,
}: AppIconButtonProps) => {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.7}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default AppIconButton;
