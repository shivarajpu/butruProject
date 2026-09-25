/**
 * App Root
 *
 * Redux <Provider> wraps the entire tree so every component can access
 * the global theme via useAppTheme() and dispatch theme actions.
 */

import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { store, type RootState, type AppDispatch } from './src/store';
import { loadAuthState, hydrate as hydrateAuth } from './src/store/slices/authSlice';
import { loadCartState, hydrate as hydrateCart } from './src/store/slices/cartSlice';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/auth/LoginScreen';
import OtpScreen from './src/auth/otpScreen';
import OtpVarify from './src/auth/OtpVarify';
import SignUpScreen from './src/auth/sigupScreen';
import ForgotPasswordScreen from './src/auth/ForgotPasswordScreen';
import HomeScreen from './src/home/HomeScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import CartScreen from './src/screens/CartScreen';
import MyOrdersScreen from './src/screens/MyOrdersScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import PolicyScreen from './src/screens/PolicyScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import type { RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Inner component so it can read from the Redux store
function AppNavigator() {
  const mode = useSelector((state: RootState) => state.theme.mode);
  const isHydrated = useSelector((state: RootState) => state.auth.isHydrated);
  const dispatch = useDispatch<AppDispatch>();

  // Restore the saved session from storage when the app starts.
  useEffect(() => {
    loadAuthState().then(saved => {
      dispatch(hydrateAuth(saved));
    });
    loadCartState().then(saved => {
      dispatch(hydrateCart(saved));
    });
  }, [dispatch]);

  // Wait until the persisted session has been read before deciding which
  // screen to show, so a logged-in user never sees the Login flash.
  if (!isHydrated) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
          <Stack.Screen name="OtpVarify" component={OtpVarify} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
          <Stack.Screen name="CartScreen" component={CartScreen} />
          <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
          <Stack.Screen name="Notification" component={NotificationScreen} />
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="Policy" component={PolicyScreen} />
          <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: 'rgba(177, 43, 91, 1)',
  },
});

export default App;