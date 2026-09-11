/**
 * AppHeader — Globally themed screen header bar.
 *
 * All color values come from the Redux theme store via useAppTheme().
 * NEVER hardcode hex values here.
 *
 * Usage:
 *   // Logo header (home style)
 *   <AppHeader showLogo />
 *
 *   // Title header (inner screens)
 *   <AppHeader title="My Cart" showBack onBackPress={navigation.goBack} />
 *
 *   // With right actions
 *   <AppHeader title="Products" rightActions={<BagIcon />} />
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  centerContent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showLogo = false,
  showBack = false,
  onBackPress,
  leftActions,
  rightActions,
  centerContent,
  style,
}) => {
  const theme = useAppTheme();
  const { colors, fontFamily, appName } = theme;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        style,
      ]}>
      {/* Left slot */}
      <View style={styles.side}>
        {showBack && (
          <TouchableOpacity
            onPress={onBackPress}
            activeOpacity={0.7}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text
              style={[styles.backArrow, { color: colors.primary }]}>
              ‹
            </Text>
          </TouchableOpacity>
        )}
        {leftActions}
      </View>

      {/* Center content */}
      <View style={styles.center}>
        {centerContent ?? (showLogo ? (
          <Text
            style={[
              styles.logoText,
              { color: colors.primary, fontFamily: fontFamily.heading },
            ]}>
            {appName}
          </Text>
        ) : title ? (
          <Text
            style={[
              styles.title,
              { color: colors.text, fontFamily: fontFamily.bold },
            ]}
            numberOfLines={1}>
            {title}
          </Text>
        ) : null)}
      </View>

      {/* Right slot */}
      <View style={[styles.side, styles.rightSide]}>{rightActions}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  side: {
    width: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSide: {
    justifyContent: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
  },
  backBtn: {
    marginRight: 4,
  },
  backArrow: {
    fontSize: 36,
    lineHeight: 40,
    marginTop: -2,
  },
});

export default AppHeader;
