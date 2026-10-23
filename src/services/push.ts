/**
 * Push notifications — Firebase Cloud Messaging + Notifee.
 *
 * ── The split of responsibilities ───────────────────────────────────────────
 *   RNFirebase messaging  → receives the FCM message (foreground + background)
 *   Notifee               → draws the notification and reports taps
 *
 * The server sends **data-only** messages so the app controls channels,
 * styling and artwork. That is also why the tap handling lives in Notifee and
 * not in RNFirebase: once Notifee is in the picture, RNFirebase's
 * `onNotificationOpenedApp` / `getInitialNotification` never fire — Notifee
 * consumes the press event.
 *
 * ── Why permission is requested through Notifee ─────────────────────────────
 * RNFirebase's `requestPermission` is deprecated (and a no-op on Android ≤ 32).
 * Notifee covers both platforms in one call: iOS shows the system prompt,
 * Android 13+ grants `POST_NOTIFICATIONS`.
 *
 * ── Nothing here is allowed to throw ────────────────────────────────────────
 * Push is an enhancement. A missing Firebase config, a denied permission or a
 * dead backend must never break login, the storefront or checkout, so every
 * public function swallows its errors and reports success as a boolean.
 */

import { Linking, Platform } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  AuthorizationStatus,
  EventType,
  type Event,
  type Notification,
  type NotificationAndroid,
} from '@notifee/react-native';
import { getApp, getUtils } from '@react-native-firebase/app';
import {
  deleteToken,
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  setBackgroundMessageHandler,
  type Messaging,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { navigationRef } from '../navigation/rootNavigation';
import { isExternalLink, resolveLink, type WidgetAction } from '../storefront/links';
import { store } from '../store';
import { receivePushNotification } from '../store/slices/notificationSlice';
import {
  normalizeNotification,
  registerDeviceToken as postDeviceToken,
  unregisterDeviceToken as postDeviceTokenRemoval,
  type AppNotification,
} from '../api/notifications';
import type { RootStackParamList } from '../navigation/types';

// ── channels ───────────────────────────────────────────────────────────────

export const CHANNEL_DEFAULT = 'butru-default';
export const CHANNEL_PROMOTIONS = 'butru-promotions';
export const CHANNEL_ORDERS = 'butru-orders';

/** Notification channels are created once per app start. */
let channelsReady: Promise<void> | null = null;

export const ensureNotificationChannels = (): Promise<void> => {
  if (channelsReady) return channelsReady;

  channelsReady = notifee
    .createChannel({
      id: CHANNEL_DEFAULT,
      name: 'General updates',
      description: 'Order updates and news from the store',
      importance: AndroidImportance.DEFAULT,
    })
    .then(() =>
      notifee.createChannel({
        id: CHANNEL_PROMOTIONS,
        name: 'Offers and coupons',
        description: 'Sales, discounts and coupon codes',
        importance: AndroidImportance.HIGH,
      }),
    )
    .then(() =>
      notifee.createChannel({
        id: CHANNEL_ORDERS,
        name: 'Order updates',
        description: 'Shipment and delivery updates for your orders',
        importance: AndroidImportance.HIGH,
      }),
    )
    .then(() => undefined)
    .catch(error => {
      console.warn('[push] could not create notification channels', error);
    });

  return channelsReady;
};

// ── permissions ────────────────────────────────────────────────────────────

/**
 * Asks for notification permission.
 *
 * Returns true when notifications may be shown. On Android ≤ 12 no runtime
 * permission exists, so this always succeeds there.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const settings = await notifee.requestPermission({
      alert: true,
      badge: true,
      sound: true,
    });
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (error) {
    console.warn('[push] permission request failed', error);
    return false;
  }
};

/** True when notifications are already allowed. */
export const hasNotificationPermission = async (): Promise<boolean> => {
  try {
    const settings = await notifee.getNotificationSettings();
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
};

// ── messaging instance ─────────────────────────────────────────────────────

/**
 * The FCM messaging instance.
 *
 * `getApp()` returns the default app, which the native SDKs create from
 * `google-services.json` / `GoogleService-Info.plist` at launch — so there is
 * no JS-side `initializeApp()` call, and none is exported any more in
 * RNFirebase v27. It throws when Firebase is not configured for this build,
 * which is exactly the signal that push is unavailable.
 */
export const getMessagingInstance = (): Messaging => {
  getApp();
  return getMessaging();
};

let missingFirebaseWarned = false;

/**
 * Turns "No Firebase App '[DEFAULT]' has been created" into something the
 * reader can act on. The raw RNFirebase error says what broke but not where
 * the missing file belongs, and this is the single most common reason push
 * does not work in a fresh build.
 */
const warnIfFirebaseIsMissing = (error: unknown): void => {
  if (missingFirebaseWarned) return;

  const message = error instanceof Error ? error.message : String(error);
  if (!/No Firebase App|default app|not initialized/i.test(message)) return;

  missingFirebaseWarned = true;

  console.warn(
    '[push] This build has no Firebase config, so push is disabled.\n' +
      '  Android: put google-services.json in clients/firebase/<client>/android/\n' +
      '  iOS:     put GoogleService-Info.plist in clients/firebase/<client>/ios/\n' +
      '  Then set firebase.enabled = true for the client in clients/clients.json,\n' +
      '  run npm run clients:sync -- --client <client>, and rebuild the app.',
  );
};

// ── token ──────────────────────────────────────────────────────────────────

let currentToken: string | null = null;

/**
 * Prints the FCM token so it can be copied into the Firebase console
 * (Messaging → New campaign → "Test" tab) to send a notification to this one
 * device.
 *
 * Dev builds only: the token is a device-scoped routing id that is already
 * sent to the backend, but it still has no business in a production log.
 */
const logDeviceToken = (token: string): void => {
  if (!__DEV__) return;

  console.log(`[push] FCM token: ${token}`);
  console.log('[push] copy it into the Firebase console to send a test push');
  (globalThis as Record<string, unknown>).__FCM_TOKEN__ = token;
};

export const getDeviceToken = async (): Promise<string | null> => {
  try {
    const messaging = getMessagingInstance();
    if (Platform.OS === 'ios') {
      try {
        await registerDeviceForRemoteMessages(messaging);
      } catch {}
    }
    const token = await getToken(messaging);
    currentToken = token;
    logDeviceToken(token);
    return token;
  } catch (error) {
    warnIfFirebaseIsMissing(error);
    console.warn('[push] could not read the FCM token', error);
    return null;
  }
};

export const getCachedToken = (): string | null => currentToken;

/**
 * The FCM token for an auth request body.
 *
 * Login and register send the device token along with the credentials, so the
 * backend can bind this device to the account the moment the session starts
 * instead of waiting for the separate device-token registration call.
 *
 * The token is read fresh on every call — FCM rotates it, and the cached copy
 * may belong to a previous user of this device.
 *
 * Returns `undefined` when push is unavailable for this build (no Firebase
 * config, no permission), so the key is left out of the JSON body instead of
 * being sent as an empty value. Auth must never depend on push.
 */
export const getAuthFcmToken = async (): Promise<string | undefined> => {
  const token = await getDeviceToken();
  return token || undefined;
};

const getAppVersion = (): string => {
  try {
    return getUtils().appVersion ?? '';
  } catch {
    return '';
  }
};

/**
 * Registers the device token with the backend so the server can push to it.
 *
 * Returns false when there is no token, no permission, or the endpoint is not
 * live yet — none of which should surface as an error to the user.
 */
export const registerDeviceToken = async (): Promise<boolean> => {
  try {
    const allowed = await hasNotificationPermission();
    if (!allowed) return false;

    const token = await getDeviceToken();
    if (!token) return false;

    await postDeviceToken({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      osVersion: String(Platform.Version),
      appVersion: getAppVersion(),
    });

    return true;
  } catch (error) {
    console.warn('[push] device token registration skipped', error);
    return false;
  }
};

/** Removes the device token from the backend (called on logout). */
export const unregisterDeviceToken = async (): Promise<boolean> => {
  try {
    const token = currentToken ?? (await getDeviceToken());
    if (!token) return false;

    await postDeviceTokenRemoval(token);

    currentToken = null;
    return true;
  } catch (error) {
    console.warn('[push] device token unregistration skipped', error);
    return false;
  }
};

// ── building the notification ──────────────────────────────────────────────

/** Pulls the flat `data` map out of an FCM message. */
const readData = (message: RemoteMessage | undefined): Record<string, string> => {
  const data = message?.data ?? {};
  const flat: Record<string, string> = {};

  Object.keys(data).forEach(key => {
    const value = data[key];
    if (typeof value === 'string') {
      flat[key] = value;
    } else if (value !== undefined && value !== null) {
      flat[key] = String(value);
    }
  });

  return flat;
};

/**
 * The id Notifee uses to identify a notification.
 *
 * Notifee refuses an empty or non-unique id ("invalid notification ID,
 * expected a unique string value"), and the server may not send one — a
 * hand-written test message from the Firebase console carries none at all. So
 * the id falls back to the FCM message id and then to a generated one.
 *
 * A stable id is what makes a repeated delivery replace the old notification
 * instead of stacking a second copy on top of it.
 */
const notificationId = (
  message: RemoteMessage | undefined,
  data: Record<string, string>,
): string => {
  const candidates = [data.notificationId, message?.messageId];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return `push_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

/**
 * Builds the notification for an FCM message.
 *
 * Data-only messages carry everything in `data`; messages with a `notification`
 * block (e.g. a hand-written test in the Firebase console) carry a title and
 * body there instead, so both are merged.
 */
export const buildNotification = (message: RemoteMessage | undefined): Notification | null => {
  const data = readData(message);
  const payload = message?.notification;

  const title = data.title ?? payload?.title ?? '';
  const body = data.body ?? payload?.body ?? '';

  if (!title && !body && !data.type) return null;

  const category = (data.type ?? '').toLowerCase();
  const channelId =
    category === 'offer' || category === 'coupon' || category === 'promotion'
      ? CHANNEL_PROMOTIONS
      : category === 'order' || category === 'shipping' || category === 'delivered'
        ? CHANNEL_ORDERS
        : CHANNEL_DEFAULT;

  const image = data.image ?? payload?.image;

  const android: NotificationAndroid = {
    channelId,
    smallIcon: 'ic_stat_notification',
    pressAction: { id: 'default', launchActivity: 'default' },
    importance: AndroidImportance.HIGH,
  };

  if (image) {
    android.style = {
      type: AndroidStyle.BIGPICTURE,
      picture: image,
    };
    android.largeIcon = image;
  } else if (body) {
    android.style = {
      type: AndroidStyle.BIGTEXT,
      text: body,
    };
  }

  return {
    id: notificationId(message, data),
    title,
    body,
    data: { ...data },
    android,
    ios: {
      sound: 'default',
      // Notifee shows a heads-up banner in the foreground by default, but with
      // the sound on. The banner stays, the sound goes — the user is looking
      // at the app already.
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        banner: true,
        list: true,
        sound: false,
      },
    },
  };
};

/** Shows a notification through Notifee. */
export const displayNotification = async (notification: Notification): Promise<void> => {
  try {
    await ensureNotificationChannels();
    await notifee.displayNotification(notification);
  } catch (error) {
    console.warn('[push] could not display the notification', error);
  }
};

// ── receiving ──────────────────────────────────────────────────────────────

/** Converts an FCM message into the app's own notification shape. */
const toAppNotification = (message: RemoteMessage | undefined): AppNotification | null => {
  const data = readData(message);
  const payload = message?.notification;

  return normalizeNotification({
    id: data.notificationId ?? message?.messageId ?? `push_${Date.now()}`,
    title: data.title ?? payload?.title ?? '',
    message: data.body ?? payload?.body ?? '',
    type: data.type ?? 'update',
    image: data.image ?? payload?.image,
    link: data.link,
    isRead: false,
    createdAt: message?.sentTime ?? Date.now(),
  });
};

/** Handles a message that arrived while the app was in the foreground. */
export const handleForegroundMessage = async (
  message: RemoteMessage | undefined,
): Promise<void> => {
  const notification = buildNotification(message);
  if (!notification) return;

  await displayNotification(notification);

  const appNotification = toAppNotification(message);
  if (appNotification) {
    store.dispatch(receivePushNotification(appNotification));
  }
};

/**
 * Handles a message that arrived while the app was backgrounded or quit.
 *
 * Registered in `index.js` so it is available before React Native mounts.
 */
export const handleBackgroundMessage = async (
  message: RemoteMessage | undefined,
): Promise<void> => {
  // On Android, a message that carries an FCM `notification` block is
  // displayed by the Firebase SDK itself while the app is in the background —
  // displaying it again here would put two copies in the tray. iOS never
  // auto-displays, so there the handler is the only thing that draws it.
  // Data-only messages are never displayed by the SDK, so those are ours on
  // both platforms.
  if (Platform.OS === 'android' && message?.notification) return;

  const notification = buildNotification(message);
  if (!notification) return;

  await displayNotification(notification);

  // The Redux store is not mounted in a headless task, so the feed is not
  // updated here — the screen reloads it when the app comes to the foreground.
};

// ── tap routing ────────────────────────────────────────────────────────────

/** A navigation that should happen once the navigator is ready. */
let pendingNavigation: {
  screen: keyof RootStackParamList;
  params?: Record<string, unknown>;
} | null = null;

/**
 * Opens whatever a notification points at.
 *
 * Uses the same link resolver as the storefront widgets, so a notification
 * linking to `/orders` lands on the orders screen and one linking to
 * `/collections` lands on the catalogue — no screen-specific string matching.
 */
export const navigateFromNotification = (data?: Record<string, unknown>): void => {
  const rawLink = data?.link;
  const link = typeof rawLink === 'string' ? rawLink.trim() : '';

  if (!link) {
    // No deep link — open the notification centre itself.
    openWhenReady({ screen: 'Notification' });
    return;
  }

  if (isExternalLink(link)) {
    Linking.openURL(link).catch(error => {
      console.warn('[push] could not open the external link', error);
    });
    return;
  }

  const action: WidgetAction = resolveLink(link);
  openActionWhenReady(action);
};

const openWhenReady = (params: {
  screen: keyof RootStackParamList;
  params?: Record<string, unknown>;
}): void => {
  pendingNavigation = params;
  flushPendingNavigation();
};

/**
 * The routes a notification link may open.
 *
 * A link is server-controlled text, so it can name a route that does not
 * exist. Checking against this list turns that into a harmless fallback
 * (the notification centre) instead of a navigation crash.
 */
const ROOT_SCREENS = [
  'Login',
  'SignUp',
  'Home',
  'ProductDetails',
  'CartScreen',
  'MyOrders',
  'Notification',
  'HelpSupport',
  'Policy',
  'PaymentMethods',
] as const satisfies readonly (keyof RootStackParamList)[];

const asRootScreen = (screen: string): keyof RootStackParamList | null =>
  (ROOT_SCREENS as readonly string[]).includes(screen)
    ? (screen as keyof RootStackParamList)
    : null;

/** Runs a resolved link action against the root stack. */
const openActionWhenReady = (action: WidgetAction): void => {
  switch (action.type) {
    case 'stack': {
      const screen = asRootScreen(action.screen);
      if (!screen) {
        openWhenReady({ screen: 'Notification' });
        return;
      }
      openWhenReady({ screen, params: action.params });
      return;
    }
    case 'tab':
      openWhenReady({ screen: 'Home', params: { screen: action.screen, params: action.params } });
      return;
    case 'category':
      openWhenReady({
        screen: 'Home',
        params: { screen: 'HomeTab', params: { category: action.category } },
      });
      return;
    case 'collection':
      openWhenReady({
        screen: 'Home',
        params: { screen: 'CategoryTab', params: { collectionId: action.collectionId } },
      });
      return;
    case 'none':
    default:
      openWhenReady({ screen: 'Notification' });
  }
};

/**
 * Performs the navigation that was requested before the navigator was ready.
 *
 * Called from `NavigationContainer.onReady`, because a notification tap can
 * arrive while the app is still starting (the notification centre is opened
 * from a cold start) — and `navigationRef` is only usable once the container
 * has mounted.
 */
export const flushPendingNavigation = (): void => {
  if (!pendingNavigation) return;
  if (!navigationRef.isReady()) return;

  const target = pendingNavigation;
  pendingNavigation = null;

  try {
    navigationRef.navigate(
      target.screen as keyof RootStackParamList,
      target.params as never,
    );
  } catch (error) {
    console.warn('[push] could not navigate from the notification', error);
  }
};

/** Handles a notification tap while the app is open. */
export const handleNotificationPress = (event: Event): void => {
  if (event.type !== EventType.PRESS) return;
  const data = event.detail.notification?.data as Record<string, unknown> | undefined;
  navigateFromNotification(data);
};

/** Handles the notification that opened the app (cold start / from the tray). */
export const handleInitialNotification = async (): Promise<void> => {
  try {
    const initial = await notifee.getInitialNotification();
    if (!initial) return;
    const data = initial.notification?.data as Record<string, unknown> | undefined;
    navigateFromNotification(data);
  } catch (error) {
    console.warn('[push] could not read the initial notification', error);
  }
};

// ── init ───────────────────────────────────────────────────────────────────

let foregroundUnsubscribe: (() => void) | null = null;
let tokenRefreshUnsubscribe: (() => void) | null = null;
let foregroundEventUnsubscribe: (() => void) | null = null;
let initialised = false;

/**
 * Starts the push stack: channels, permission, token registration and the
 * foreground listeners.
 *
 * Safe to call more than once — only the first call wires anything up.
 */
export const initPushNotifications = async (): Promise<void> => {
  if (initialised) return;
  initialised = true;

  try {
    await ensureNotificationChannels();
    await requestNotificationPermission();

    // Read the token even when the permission was refused: the token is what
    // identifies this device in the Firebase console, and it is the only way to
    // send a notification to a single device before the backend is live.
    await getDeviceToken();
    await registerDeviceToken();

    const messaging = getMessagingInstance();

    foregroundUnsubscribe = onMessage(messaging, message => {
      handleForegroundMessage(message).catch(error => {
        console.warn('[push] foreground message handling failed', error);
      });
    });

    tokenRefreshUnsubscribe = onTokenRefresh(messaging, token => {
      currentToken = token;
      logDeviceToken(token);
      registerDeviceToken().catch(error => {
        console.warn('[push] token refresh registration failed', error);
      });
    });

    foregroundEventUnsubscribe = notifee.onForegroundEvent(handleNotificationPress);
  } catch (error) {
    warnIfFirebaseIsMissing(error);
    console.warn('[push] push notifications are unavailable for this build', error);
  }
};

/** Tears the listeners down (used by tests and on logout). */
export const stopPushNotifications = (): void => {
  foregroundUnsubscribe?.();
  foregroundUnsubscribe = null;
  tokenRefreshUnsubscribe?.();
  tokenRefreshUnsubscribe = null;
  foregroundEventUnsubscribe?.();
  foregroundEventUnsubscribe = null;
  initialised = false;
};

/** Removes the FCM token from this device entirely (logout / account switch). */
export const deleteDeviceToken = async (): Promise<void> => {
  try {
    const messaging = getMessagingInstance();
    await deleteToken(messaging);
    currentToken = null;
  } catch (error) {
    console.warn('[push] could not delete the FCM token', error);
  }
};

// ── background registration ────────────────────────────────────────────────

/**
 * Registers the background message handler.
 *
 * Called from `index.js` before the app component is registered, because a
 * data-only message only wakes a backgrounded/quit app when the handler is
 * already in place. It is a no-op when Firebase is not configured for this
 * build, so the app still starts normally without a Firebase config.
 */
export const registerBackgroundMessageHandler = (): void => {
  try {
    const messaging = getMessagingInstance();

    setBackgroundMessageHandler(messaging, async message => {
      await handleBackgroundMessage(message);
    });

    // Android action presses (a button on the notification itself) arrive
    // while the app is backgrounded, so they need their own background hook.
    notifee.onBackgroundEvent(async event => {
      if (event.type !== EventType.PRESS && event.type !== EventType.ACTION_PRESS) return;
      const data = event.detail.notification?.data as Record<string, unknown> | undefined;
      navigateFromNotification(data);
    });
  } catch (error) {
    console.warn('[push] background message handling is unavailable for this build', error);
  }
};
