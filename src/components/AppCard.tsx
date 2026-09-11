/**
 * AppCard — Globally themed card/surface container.
 *
 * All color values come from the Redux theme store via useAppTheme().
 * NEVER hardcode hex values here.
 *
 * Usage:
 *   <AppCard>
 *     <Text>Your content here</Text>
 *   </AppCard>
 *
 *   <AppCard elevated style={{ marginBottom: 12 }}>
 *     <Text>Elevated card</Text>
 *   </AppCard>
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Add platform shadow/elevation. Default: true */
  elevated?: boolean;
  /** Override border radius. Default: 12 */
  borderRadius?: number;
  onPress?: () => void;
  disabled?: boolean;
}

const AppCard: React.FC<AppCardProps> = ({
  children,
  style,
  elevated = true,
  borderRadius = 12,
  onPress,
  disabled = false,
}) => {
  const theme = useAppTheme();
  const { colors } = theme;

  const cardStyle = [
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius,
          ...(elevated && {
            shadowColor: colors.text,
            elevation: 3,
          }),
        },
        style,
      ];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={onPress}
        style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    // iOS shadow defaults (color overridden dynamically above)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    overflow: 'hidden',
  },
});

export default AppCard;
