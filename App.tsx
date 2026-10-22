/**
 * App Root
 *
 * Redux <Provider> wraps the entire tree so every component can access
 * the global theme via useAppTheme() and dispatch theme actions.
 */

import React, { useEffect } from 'react';
import { StatusBar, View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider, useDispatch, useSelector } from 'react-redux';
import Geolocation from '@react-native-community/geolocation';

import { store, type RootState, type AppDispatch } from './src/store';
import { loadAuthState, hydrate as hydrateAuth } from './src/store/slices/authSlice';
import { loadCartState, hydrate as hydrateCart } from './src/store/slices/cartSlice';
import {
  loadNotificationState,
  hydrate as hydrateNotifications,
  loadUnreadCount,
} from './src/store/slices/notificationSlice';
import { useStorefront } from './src/storefront/useStorefront';
import { useAppTheme } from './src/theme/useAppTheme';
import { readableOn } from './src/storefront/bridge';
import { navigationRef } from './src/navigation/rootNavigation';
import {
  flushPendingNavigation,
  handleInitialNotification,
  initPushNotifications,
  registerDeviceToken,
  unregisterDeviceToken,
} from './src/services/push';
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
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const { colors } = useAppTheme();
  const dispatch = useDispatch<AppDispatch>();

  // Mounted above the hydration gate on purpose: the tenant config has to be in
  // flight before the first paint, otherwise the pre-hydration splash below can
  // only ever show the compiled-in default brand colour.
  useStorefront();

  // Restore the saved session from storage when the app starts.
  useEffect(() => {
    loadAuthState().then(saved => {
      dispatch(hydrateAuth(saved));
    });
    loadCartState().then(saved => {
      dispatch(hydrateCart(saved));
    });
    loadNotificationState().then(saved => {
      dispatch(hydrateNotifications(saved));
    });
  }, [dispatch]);

  // Push notifications.
  //
  // `initPushNotifications` asks for the notification permission, creates the
  // Android channels and registers the FCM token with the backend. It is a
  // no-op when Firebase is not configured for this build, so it is safe to
  // call unconditionally.
  useEffect(() => {
    initPushNotifications().catch(() => undefined);
  }, []);

  // The token belongs to whoever is signed in. Register it once the session is
  // known, and drop it again on logout so the next user of this device does
  // not inherit the previous account's pushes.
  useEffect(() => {
    if (!isHydrated) return;

    if (isLoggedIn) {
      registerDeviceToken().catch(() => undefined);
      dispatch(loadUnreadCount());
    } else {
      unregisterDeviceToken().catch(() => undefined);
    }
  }, [dispatch, isHydrated, isLoggedIn]);

  // A notification tap can open the app from a cold start, before the
  // navigator exists. The pending navigation is replayed once the container
  // is ready (see `onReady` below).
  useEffect(() => {
    handleInitialNotification().catch(() => undefined);
  }, []);

  // Android-only: point the geolocation module at the Play Services fused
  // provider. Its default raw-LocationManager path turns a high-accuracy
  // request into a GPS-only request, so on a real phone indoors "Use Current
  // Location" failed with POSITION_UNAVAILABLE even though a Wi-Fi/cell fix
  // existed. The fused provider blends GPS, Wi-Fi and cell and falls back
  // gracefully. Set once, before any screen can request a position.
  useEffect(() => {
    if (Platform.OS === 'android') {
      Geolocation.setRNConfiguration({
        locationProvider: 'playServices',
        skipPermissionRequests: false,
      });
    }
  }, []);

  // Wait until the persisted session has been read before deciding which
  // screen to show, so a logged-in user never sees the Login flash. The
  // background is `colors.primary`, so once the storefront config lands this
  // blank screen is already the merchant's colour.
  if (!isHydrated) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: colors.primary }]}>
        <StatusBar barStyle={readableOn(colors.primary) === '#101010' ? 'dark-content' : 'light-content'} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      {/* `ref` is what makes `navigationRef` usable. Without it the ref is
          never attached to the container, `isReady()` stays false and every
          imperative navigation (401 logout reset, notification taps) is a
          silent no-op. */}
      <NavigationContainer
        ref={navigationRef}
        onReady={flushPendingNavigation}>
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
  },
});

export default App;