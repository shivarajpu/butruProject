import React from 'react';
import { View, StyleSheet } from 'react-native';
import MainTabNavigator from '../navigation/MainTabNavigator';

/**
 * HomeScreen acts as the main container after login.
 * It renders the bottom tab navigator (Home, Category, Wishlist, Account).
 */
const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <MainTabNavigator />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEDDE5",
  },
});

export default HomeScreen;
