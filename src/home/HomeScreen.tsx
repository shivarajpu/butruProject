import React from 'react';
import { View, StyleSheet } from 'react-native';
import MainTabNavigator from '../navigation/MainTabNavigator';
import { useAppTheme } from '../theme/useAppTheme';

/**
 * HomeScreen acts as the main container after login.
 * It renders the bottom tab navigator (Home, Category, Wishlist, Account).
 */
const HomeScreen = () => {
  // Redux theme store se dynamic colors read kar rahe hain
  const theme = useAppTheme();
  const { colors } = theme;

  return (
    <View style={[styles.container, { backgroundColor: colors.background , }]}>
      <MainTabNavigator />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HomeScreen;