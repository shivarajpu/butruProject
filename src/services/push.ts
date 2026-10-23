/**
 * Push notifications — Firebase Cloud Messaging + Notifee.
 *
 * ── The split of responsibilities ───────────────────────────────────────────
 *   RNFirebase messaging  → receives the FCM message (foreground + background)
 *   Notifee               → draws the notification and reports taps
 *
 * The server sends **data-only** messages so the app controls channels,
 * styling and artwork, and Notifee owns taps on those notifications.
 *
 * iOS also displays an APNs alert (`notification` payload) itself when the app
 * is backgrounded or quit. Taps on those system notifications never reach
 * Notifee, so they are handled through RNFirebase's
 * `onNotificationOpenedApp` / `getInitialNotification` as well.
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
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  setBackgroundMessageHandler,
  type Messaging,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { navigationRef } from '../navigation/rootNavigation';
import { parseDeepLink } from '../navigation/deepLink';
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
    console.log('[push] permission status', settings.authorizationStatus);
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
    console.log('[push] hasNotificationPermission', settings.authorizationStatus);
    return (
      settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
      settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
    );
  } catch (e) {
    console.log(
      '[push] hasNotificationPermission err',
      e instanceof Error ? e.message : String(e),
    );
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
      // FCM data is string-only, but a nested object is JSON-encoded so
      // `readNotificationMetadata` can still parse the routing block.
      flat[key] =
        typeof value === 'object' ? JSON.stringify(value) : String(value);
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
    // FCM data-only payloads carry the routing block (`metadata`) and the
    // ctaUrl as flat strings; spread them so a tapped foreground push lands on
    // the same screen as the feed item served by the API.
    ...data,
    id: data.notificationId ?? message?.messageId ?? `push_${Date.now()}`,
    title: data.title ?? payload?.title ?? '',
    message: data.body ?? payload?.body ?? '',
    type: data.type ?? 'update',
    image: data.image ?? data.imageUrl ?? payload?.image,
    link: data.link ?? data.ctaUrl,
    isRead: false,
    createdAt: message?.sentTime ?? Date.now(),
  });
};

/** Handles a message that arrived while the app was in the foreground. */
export const handleForegroundMessage = async (
  message: RemoteMessage | undefined,
): Promise<void> => {
  console.log('[push] foreground message received', JSON.stringify(message?.data ?? {}));
  const notification = buildNotification(message);
  if (!notification) {
    console.warn('[push] foreground message produced no notification');
    return;
  }

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
  console.log('[push] background message received', JSON.stringify(message?.data ?? {}));
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

const pickText = (source: Record<string, unknown>, keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
};

const pickNumber = (source: Record<string, unknown>, keys: string[]): number | undefined => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
};

/**
 * Reads `metadata` from notification data. FCM data-only messages can only
 * carry strings, so a nested object may arrive JSON-encoded.
 */
const readNotificationMetadata = (
  data: Record<string, unknown>,
): Record<string, unknown> => {
  const raw = data.metadata;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string' && raw.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Not JSON — fall through to the flat data map.
    }
  }
  return data;
};

const PENDING_NOTIFICATION_KEY = '@butru/pending-notification-target';

/**
 * Keeps the tapped payload around until the app is actually in the foreground.
 *
 * A background/headless JS runtime can receive the press event without a
 * mounted navigator, and it is not the same runtime the user then sees. Writing
 * the target to storage lets the foreground app pick it up on mount or on the
 * next `active` app-state change instead of dropping the tap.
 */
const savePendingNotification = async (
  data?: Record<string, unknown>,
): Promise<void> => {
  if (!data || Object.keys(data).length === 0) return;
  try {
    await AsyncStorage.setItem(PENDING_NOTIFICATION_KEY, JSON.stringify(data));
    console.log('[push] saved pending notification', JSON.stringify(data));
  } catch (error) {
    console.warn('[push] could not persist the notification tap', error);
  }
};

const openWhenReady = (params: {
  screen: keyof RootStackParamList;
  params?: Record<string, unknown>;
}): void => {
  console.log('[push] openWhenReady', params.screen, JSON.stringify(params.params));
  pendingNavigation = params;
  flushPendingNavigation();
};

/**
 * Routes a notification by its `metadata.screen` hint.
 *
 * Returns `true` when the hint was understood. The destination filters are
 * passed as route params so the target screen can narrow its own list:
 *
 *   home            → Home
 *   cart            → CartScreen filtered by productId
 *   wishlist        → Wishlist tab filtered by productId
 *   order_details   → MyOrders (details) filtered by orderId/orderNumber
 *   track_shipment  → MyOrders (track) filtered by orderId/orderNumber/trackingNumber
 *   add_review      → MyOrders (details + review form) filtered by productId/orderNumber
 *   product_details → ProductDetails with optional newPrice/oldPrice
 */
const openNotificationScreen = (
  screen: string,
  meta: Record<string, unknown>,
): boolean => {
  // Normalize: handle camelCase (productDetails), spaces, hyphens
  let normalized = screen.trim().toLowerCase();
  normalized = normalized.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
  normalized = normalized.replace(/[\s-]+/g, '_');
  // Map common variants
  const aliases: Record<string, string> = {
    productdetails: 'product_details',
    productdetail: 'product_details',
    product_details_screen: 'product_details',
    product: 'product_details',
    orderdetails: 'order_details',
    orderdetail: 'order_details',
    orders: 'order_details',
    myorders: 'order_details',
    trackshipment: 'track_shipment',
    trackorder: 'track_shipment',
    tracking: 'track_shipment',
    track_shipment_screen: 'track_shipment',
    addreview: 'add_review',
    add_review_screen: 'add_review',
    wishlisttab: 'wishlist',
    cartscreen: 'cart',
  };
  if (aliases[normalized]) normalized = aliases[normalized];
  const productId =
    pickText(meta, ['productId', 'product_id', 'productID', 'product']) ||
    pickText(meta as any, ['id']);
  const orderId = pickText(meta, ['orderId', 'order_id', 'orderID']);
  const orderNumber = pickText(meta, ['orderNumber', 'order_number', 'orderNo']);
  const trackingNumber = pickText(meta, [
    'trackingNumber',
    'tracking_number',
    'awb',
    'trackingId',
    'tracking_no',
  ]);

  switch (normalized) {
    case 'home':
      openWhenReady({ screen: 'Home' });
      return true;

    case 'cart':
      openWhenReady({
        screen: 'CartScreen',
        params: productId ? { filterProductId: productId } : undefined,
      });
      return true;

    case 'wishlist':
      openWhenReady({
        screen: 'Home',
        params: {
          screen: 'WishlistTab',
          params: {
            filterProductId: productId,
            navNonce: Date.now(),
          },
        },
      });
      return true;

    case 'order_details':
    case 'order_detail':
    case 'orders':
    case 'order_detail_screen':
      openWhenReady({
        screen: 'MyOrders',
        params: {
          view: 'details',
          orderId,
          orderNumber,
          productId,
        },
      });
      return true;

    case 'track_shipment':
    case 'track_order':
    case 'tracking':
    case 'track_shipment_details':
      openWhenReady({
        screen: 'MyOrders',
        params: {
          view: 'track',
          orderId,
          orderNumber,
          trackingNumber,
          productId,
        },
      });
      return true;

    case 'add_review':
      openWhenReady({
        screen: 'MyOrders',
        params: {
          view: 'details',
          openReview: true,
          orderId,
          orderNumber,
          productId,
        },
      });
      return true;

    case 'product_details':
    case 'product_detail':
    case 'product': {
      if (!productId) return false;

      const newPrice = pickNumber(meta, ['newPrice', 'new_price']);
      const oldPrice = pickNumber(meta, ['oldPrice', 'old_price', 'mrp']);

      openWhenReady({
        screen: 'ProductDetails',
        params: {
          product: { id: productId, _id: productId },
          productId,
          priceOverride: { newPrice, oldPrice },
        },
      });
      return true;
    }

    default:
      return false;
  }
};

/**
 * Opens whatever a notification points at.
 *
 * The backend puts a `metadata.screen` hint on every event, so that is checked
 * first and routed with its filter keys. Notifications without a hint (or with
 * a screen the app does not know) fall back to the same link resolver as the
 * storefront widgets.
 */
export const navigateFromNotification = (data?: Record<string, unknown>): void => {
  console.log('[push] navigateFromNotification data:', JSON.stringify(data));
  const flat = data ?? {};
  const meta = readNotificationMetadata(flat);
  console.log('[push] navigateFromNotification meta:', JSON.stringify(meta));

  const screen =
    pickText(meta, ['screen']) ??
    pickText(flat, ['screen', 'notificationType']);

  if (screen && openNotificationScreen(screen, meta)) {
    return;
  }

  const rawLink = meta.link ?? flat.link ?? meta.ctaUrl ?? flat.ctaUrl ?? meta.deepLink ?? meta.url;
  const link = typeof rawLink === 'string' ? rawLink.trim() : '';

  if (!link) {
    // No deep link — open the notification centre itself.
    openWhenReady({ screen: 'Notification' });
    return;
  }

  // A notification `ctaUrl` such as `/Orders/Track/<id>` (or the same URL on
  // the storefront) carries a destination the generic link resolver does not
  // know. Parse it into metadata first, then reuse the metadata router.
  const deep = parseDeepLink(link);
  if (deep?.screen) {
    navigateFromNotification(deep);
    return;
  }

  if (isExternalLink(link)) {
    const internal = parseDeepLink(link);
    if (internal?.screen) {
      navigateFromNotification(internal);
      return;
    }
    Linking.openURL(link).catch(error => {
      console.warn('[push] could not open the external link', error);
    });
    return;
  }

  const action: WidgetAction = resolveLink(link);
  openActionWhenReady(action);
};

/**
 * Opens the destination encoded in an app URL.
 *
 * Called for `butru://…` links and storefront links, whether they arrive on a
 * cold start (`Linking.getInitialURL`) or while the app is already running
 * (`Linking` `url` event). Navigation is queued until the navigator is ready,
 * so a link that launches the app is not lost to the startup sequence.
 */
export const navigateFromDeepLink = (url?: string | null): void => {
  const deep = parseDeepLink(url);
  if (!deep) return;

  navigateFromNotification(deep);
};

/** Wires URL-based deep linking for the lifetime of the app. */
export const initDeepLinking = (): (() => void) => {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    navigateFromDeepLink(url);
  });

  Linking.getInitialURL()
    .then(url => {
      if (url) navigateFromDeepLink(url);
    })
    .catch(error => {
      console.warn('[deeplink] could not read the initial URL', error);
    });

  return () => subscription.remove();
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
  console.log('[push] flushPendingNavigation', !!pendingNavigation, navigationRef.isReady());
  if (!pendingNavigation) return;
  if (!navigationRef.isReady()) return;

  const target = pendingNavigation;
  pendingNavigation = null;
  console.log('[push] flushing nav to', target.screen, JSON.stringify(target.params));

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

/**
 * Replays a tap that a background/headless runtime could not navigate to.
 *
 * Called on app mount and whenever the app becomes active again, so both a
 * cold start and a background tap end up on the notification's screen.
 */
export const restorePendingNotification = async (
  silent = false,
): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_NOTIFICATION_KEY);
    if (!raw) return;
    await AsyncStorage.removeItem(PENDING_NOTIFICATION_KEY);
    const data = JSON.parse(raw) as Record<string, unknown>;
    console.log('[push] restoring pending notification', JSON.stringify(data));
    navigateFromNotification(data);
  } catch (error) {
    if (!silent) console.warn('[push] could not restore the notification tap', error);
  }
};

/** Handles the notification that opened the app (cold start / from the tray). */
export const handleInitialNotification = async (): Promise<void> => {
  try {
    console.log('[push] handleInitialNotification');
    const initial = await notifee.getInitialNotification();
    console.log('[push] getInitialNotification result', !!initial);
    if (!initial) return;
    const data = initial.notification?.data as Record<string, unknown> | undefined;
    console.log('[push] initial notification data', JSON.stringify(data));
    navigateFromNotification(data);
  } catch (error) {
    console.warn('[push] could not read the initial notification', error);
  }
};

// ── init ───────────────────────────────────────────────────────────────────

let foregroundUnsubscribe: (() => void) | null = null;
let tokenRefreshUnsubscribe: (() => void) | null = null;
let foregroundEventUnsubscribe: (() => void) | null = null;
let notificationOpenedUnsubscribe: (() => void) | null = null;
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
      console.log('[push] onMessage fired', message?.messageId);
      handleForegroundMessage(message).catch(error => {
        console.warn('[push] foreground message handling failed', error);
      });
    });

    // iOS: an APNs alert shown by the system while the app is backgrounded is
    // not a Notifee notification, so a tap on it never reaches
    // `notifee.onForegroundEvent`. Firebase reports that tap here.
    notificationOpenedUnsubscribe = onNotificationOpenedApp(messaging, message => {
      console.log('[push] onNotificationOpenedApp', message?.messageId, JSON.stringify(message?.data ?? {}));
      if (message?.data) navigateFromNotification(message.data as Record<string, unknown>);
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
  notificationOpenedUnsubscribe?.();
  notificationOpenedUnsubscribe = null;
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
      console.log('[push] setBackgroundMessageHandler fired', message?.messageId);
      await handleBackgroundMessage(message);
    });

    // Android action presses (a button on the notification itself) arrive
    // while the app is backgrounded, so they need their own background hook.
    notifee.onBackgroundEvent(async event => {
      console.log('[push] notifee background event', event.type);
      if (event.type !== EventType.PRESS && event.type !== EventType.ACTION_PRESS) return;
      const data = event.detail.notification?.data as Record<string, unknown> | undefined;
      await savePendingNotification(data);
    });
  } catch (error) {
    console.warn('[push] background message handling is unavailable for this build', error);
  }
};
