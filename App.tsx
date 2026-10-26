/**
 * App Root
 *
 * Redux <Provider> wraps the entire tree so every component can access
 * the global theme via useAppTheme() and dispatch theme actions.
 */

import React, { useEffect } from 'react';
import { AppState, StatusBar, View, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider, useDispatch, useSelector } from 'react-redux';
import Geolocation from '@react-native-community/geolocation';
import { getMessaging, getInitialNotification } from '@react-native-firebase/messaging';

import { store, type RootState, type AppDispatch } from './src/store';
import { loadAuthState, hydrate as hydrateAuth } from './src/store/slices/authSlice';
import { loadCartState, hydrate as hydrateCart } from './src/store/slices/cartSlice';
import {
  clearNotifications,
  loadNotificationState,
  hydrate as hydrateNotifications,
  loadUnreadCount,
} from './src/store/slices/notificationSlice';
import { useStorefront } from './src/storefront/useStorefront';
import { useAppTheme } from './src/theme/useAppTheme';
import { readableOn } from './src/storefront/bridge';
import { navigationRef } from './src/navigation/rootNavigation';
import {
  disablePushNotifications,
  flushPendingNavigation,
  handleInitialNotification,
  initDeepLinking,
  initPushNotifications,
  navigateFromNotification,
  restorePendingNotification,
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

  // Push notifications belong to a session.
  //
  // Start the stack only after login. On logout, unregister + DELETE the FCM
  // token before the session is torn down; keeping the token alive would let
  // the server keep delivering the previous account's pushes to this device.
  useEffect(() => {
    if (!isHydrated) return;

    if (isLoggedIn) {
      console.log('[push] app initPushNotifications');
      initPushNotifications()
        .then(() => console.log('[push] initPushNotifications done'))
        .catch(e => console.log('[push] initPushNotifications err', e?.message));
      dispatch(loadUnreadCount());
    } else {
      disablePushNotifications().catch(() => undefined);
      dispatch(clearNotifications());
    }
  }, [dispatch, isHydrated, isLoggedIn]);

  // Pushes delivered while the app is backgrounded/quit never reach the Redux
  // store (the JS runtime is suspended or headless). Refresh the badge as soon
  // as the app is visible again so the bell reflects the new unread item
  // without waiting for the notification screen to load.
  useEffect(() => {
    if (!isLoggedIn) return;

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') dispatch(loadUnreadCount());
    });

    return () => appStateSubscription.remove();
  }, [dispatch, isLoggedIn]);

  // A notification tap can open the app from a cold start, before the
  // navigator exists. The pending navigation is replayed once the container
  // is ready (see `onReady` below).
  useEffect(() => {
    console.log('[App] handleInitialNotification');
    handleInitialNotification().catch(e =>
      console.log('[App] handleInitialNotification err', e?.message),
    );

    // A tap handled in a background/headless JS runtime is persisted instead of
    // navigated (there is no visible navigator there). Replay it once the real
    // app is running, and again whenever it returns to the foreground.
    restorePendingNotification(true).catch(() => undefined);
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') restorePendingNotification(true).catch(() => undefined);
    });

    // RNFirebase fallback: if Notifee did not hand us the notification that
    // launched the app, ask Firebase directly. On iOS a quit-state tap on a
    // system (APNs) notification is reported here with the original `data`.
    try {
      getInitialNotification(getMessaging())
        .then(message => {
          console.log('[App] firebase getInitialNotification', !!message);
          if (message?.data) {
            navigateFromNotification(message.data as Record<string, unknown>);
          }
        })
        .catch(e =>
          console.log('[App] firebase getInitialNotification err', e?.message),
        );
    } catch (e) {
      console.log(
        '[App] firebase getInitialNotification threw',
        e instanceof Error ? e.message : String(e),
      );
    }

    return () => appStateSubscription.remove();
  }, []);

  // URL deep links (`butru://orders/track/<id>` and storefront links) work in
  // every app state: `getInitialURL` covers a cold start, the event listener
  // covers the app already running in the foreground or background.
  useEffect(() => initDeepLinking(), []);

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