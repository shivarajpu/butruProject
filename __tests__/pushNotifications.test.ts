/**
 * Push notifications — FCM + Notifee.
 *
 * These cover the decisions that are expensive to get wrong and invisible when
 * they break:
 *
 *   • which Android channel a message lands in (the wrong one means the user
 *     never sees it, because a muted channel is silent),
 *   • that a data-only message and a message with a `notification` block both
 *     produce a notification,
 *   • that a tap follows the link the server attached, and that an unknown
 *     link falls back instead of throwing,
 *   • that a build with no Firebase config degrades to "push is off" rather
 *     than crashing the app on launch.
 */

const mockGet = jest.fn<Promise<unknown>, [string]>();
const mockPost = jest.fn<Promise<unknown>, [string, unknown]>();
const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
let mockNavigationReady = true;

jest.mock('../src/api/apiService', () => ({
  apiService: {
    get: (endpoint: string) => mockGet(endpoint),
    post: (endpoint: string, body: unknown) => mockPost(endpoint, body),
  },
}));

jest.mock('../src/store', () => ({
  store: { dispatch: mockDispatch, getState: jest.fn(() => ({})) },
}));

jest.mock('../src/navigation/rootNavigation', () => ({
  navigationRef: {
    isReady: () => mockNavigationReady,
    navigate: (...args: unknown[]) => mockNavigate(...args),
  },
}));

/**
 * Loads the push service (and the native modules it drives) in a fresh module
 * registry, so each test starts with the module-level guards — the channel
 * cache, the "already initialised" flag, the cached token — reset.
 */
function loadPush() {
  const loaded: Record<string, any> = {};
  jest.isolateModules(() => {
    loaded.push = require('../src/services/push');
    loaded.firebaseApp = require('@react-native-firebase/app');
    loaded.messaging = require('@react-native-firebase/messaging');
    loaded.notifee = require('@notifee/react-native');
  });
  return loaded;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGet.mockReset();
  mockPost.mockReset();
  mockNavigationReady = true;
});

describe('buildNotification', () => {
  it('turns a data-only message into a notification', () => {
    const { push } = loadPush();

    const notification = push.buildNotification({
      data: { title: 'Order shipped', body: 'Your order is on its way', type: 'order' },
      messageId: 'm1',
      sentTime: 1_700_000_000_000,
    });

    expect(notification?.title).toBe('Order shipped');
    expect(notification?.body).toBe('Your order is on its way');
    expect(notification?.android?.channelId).toBe(push.CHANNEL_ORDERS);
  });

  it('routes an offer to the promotions channel and anything else to the default', () => {
    const { push } = loadPush();

    const offer = push.buildNotification({ data: { title: 'a', type: 'coupon' } });
    const other = push.buildNotification({ data: { title: 'a', type: 'something-else' } });

    expect(offer?.android?.channelId).toBe(push.CHANNEL_PROMOTIONS);
    expect(other?.android?.channelId).toBe(push.CHANNEL_DEFAULT);
  });

  it('falls back to the notification block when the message has no data payload', () => {
    const { push } = loadPush();

    const notification = push.buildNotification({
      notification: { title: 'From the console', body: 'A hand-typed test' },
    });

    expect(notification?.title).toBe('From the console');
    expect(notification?.body).toBe('A hand-typed test');
  });

  it('returns nothing for a message with neither title nor body', () => {
    const { push } = loadPush();

    expect(push.buildNotification({ data: {} })).toBeNull();
    expect(push.buildNotification(undefined)).toBeNull();
  });

  it('shows the banner in the foreground on iOS, without the sound', () => {
    const { push } = loadPush();

    const notification = push.buildNotification({ data: { title: 'a', body: 'b' } });

    expect(notification?.ios?.foregroundPresentationOptions).toEqual({
      alert: true,
      badge: true,
      banner: true,
      list: true,
      sound: false,
    });
  });

  it('always gives the notification a unique string id', () => {
    const { push } = loadPush();

    // Notifee throws "invalid notification ID, expected a unique string
    // value" for an undefined id, which silently ate every console test
    // message in the foreground.
    const withoutAnyId = push.buildNotification({
      notification: { title: 'From the console', body: 'A hand-typed test' },
    });
    expect(typeof withoutAnyId?.id).toBe('string');
    expect(withoutAnyId?.id?.length).toBeGreaterThan(0);

    const withMessageId = push.buildNotification({
      notification: { title: 'a', body: 'b' },
      messageId: 'm-42',
    });
    expect(withMessageId?.id).toBe('m-42');

    const withNotificationId = push.buildNotification({
      data: { title: 'a', body: 'b', notificationId: 'server-1' },
      messageId: 'm-42',
    });
    expect(withNotificationId?.id).toBe('server-1');

    // Two messages without any id must not collide, or the second one would
    // replace the first instead of adding to the tray.
    const first = push.buildNotification({ data: { title: 'a', body: 'b' } });
    const second = push.buildNotification({ data: { title: 'a', body: 'b' } });
    expect(first?.id).not.toBe(second?.id);
  });
});

describe('ensureNotificationChannels', () => {
  it('creates the three channels the app uses', async () => {
    const { push, notifee } = loadPush();

    await push.ensureNotificationChannels();

    const ids = notifee.default.createChannel.mock.calls.map((call: any[]) => call[0].id);
    expect(ids).toEqual([
      push.CHANNEL_DEFAULT,
      push.CHANNEL_PROMOTIONS,
      push.CHANNEL_ORDERS,
    ]);
  });
});

describe('navigateFromNotification', () => {
  it('opens an internal link on the matching screen', () => {
    const { push } = loadPush();

    push.navigateFromNotification({ link: '/orders' });

    expect(mockNavigate).toHaveBeenCalledWith('MyOrders', undefined);
  });

  it('routes metadata.screen to the cart with its product filter', () => {
    const { push } = loadPush();

    push.navigateFromNotification({
      metadata: { screen: 'cart', productId: 'product-1' },
    });

    expect(mockNavigate).toHaveBeenCalledWith('CartScreen', {
      filterProductId: 'product-1',
    });
  });

  it('routes order_details to MyOrders with the order filters', () => {
    const { push } = loadPush();

    push.navigateFromNotification({
      metadata: {
        screen: 'order_details',
        orderId: 'order-1',
        orderNumber: 'ORD-1',
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith('MyOrders', {
      view: 'details',
      orderId: 'order-1',
      orderNumber: 'ORD-1',
      productId: undefined,
    });
  });

  it('routes product_details with the notified prices', () => {
    const { push } = loadPush();

    push.navigateFromNotification({
      metadata: {
        screen: 'product_details',
        productId: 'product-1',
        newPrice: 499,
        oldPrice: 799,
      },
    });

    expect(mockNavigate).toHaveBeenCalledWith('ProductDetails', {
      product: { id: 'product-1', _id: 'product-1' },
      productId: 'product-1',
      priceOverride: { newPrice: 499, oldPrice: 799 },
    });
  });

  it('follows an order-tracking CTA when there is no metadata screen', () => {
    const { push } = loadPush();

    push.navigateFromNotification({ link: '/Orders/Track/order-1' });

    expect(mockNavigate).toHaveBeenCalledWith('MyOrders', {
      view: 'track',
      orderId: 'order-1',
      orderNumber: undefined,
      trackingNumber: 'order-1',
      productId: undefined,
    });
  });

  it('opens an external link outside the app instead of pushing a screen', () => {
    const { push } = loadPush();
    const openURL = jest.spyOn(require('react-native').Linking, 'openURL').mockResolvedValue(true);

    push.navigateFromNotification({ link: 'https://butru.in/sale' });

    expect(openURL).toHaveBeenCalledWith('https://butru.in/sale');
    expect(mockNavigate).not.toHaveBeenCalled();
    openURL.mockRestore();
  });

  it('opens a bare slug as a catalogue filter rather than a screen', () => {
    const { push } = loadPush();

    push.navigateFromNotification({ link: '/new-arrivals' });

    expect(mockNavigate).toHaveBeenCalledWith('Home', {
      screen: 'HomeTab',
      params: { category: 'New Arrivals' },
    });
  });

  it('holds the navigation until the navigator is ready', () => {
    const { push } = loadPush();
    mockNavigationReady = false;

    push.navigateFromNotification({ link: '/orders' });
    expect(mockNavigate).not.toHaveBeenCalled();

    mockNavigationReady = true;
    push.flushPendingNavigation();
    expect(mockNavigate).toHaveBeenCalledWith('MyOrders', undefined);
  });
});

describe('initPushNotifications', () => {
  it('registers the device token with the backend', async () => {
    const { push } = loadPush();
    mockPost.mockResolvedValue({ success: true, data: { token: 'test-fcm-token' } });

    await push.initPushNotifications();

    expect(mockPost).toHaveBeenCalledWith(
      '/api/notifications/device-token/register',
      expect.objectContaining({ token: 'test-fcm-token' }),
    );
  });

  it('wires the foreground and token-refresh listeners', async () => {
    const { push, messaging, notifee } = loadPush();
    mockPost.mockResolvedValue({ success: true });

    await push.initPushNotifications();

    expect(messaging.onMessage).toHaveBeenCalled();
    expect(messaging.onTokenRefresh).toHaveBeenCalled();
    expect(notifee.default.onForegroundEvent).toHaveBeenCalled();
  });

  it('does nothing when Firebase is not configured for this build', async () => {
    const { push, firebaseApp } = loadPush();
    firebaseApp.getApp.mockImplementation(() => {
      throw new Error("No Firebase App '[DEFAULT]' has been created");
    });

    await expect(push.initPushNotifications()).resolves.toBeUndefined();
    expect(mockPost).not.toHaveBeenCalled();
  });
});

describe('getAuthFcmToken', () => {
  it('returns the FCM token of this device for the auth payload', async () => {
    const { push, messaging } = loadPush();

    await expect(push.getAuthFcmToken()).resolves.toBe('test-fcm-token');
    expect(messaging.getToken).toHaveBeenCalled();
  });

  it('reads the token again on every call, because FCM rotates it', async () => {
    const { push, messaging } = loadPush();

    await push.getAuthFcmToken();
    messaging.getToken.mockResolvedValueOnce('rotated-fcm-token');
    await expect(push.getAuthFcmToken()).resolves.toBe('rotated-fcm-token');
  });

  it('returns undefined when Firebase is not configured, so the key is left out', async () => {
    const { push, firebaseApp } = loadPush();
    firebaseApp.getApp.mockImplementation(() => {
      throw new Error("No Firebase App '[DEFAULT]' has been created");
    });

    await expect(push.getAuthFcmToken()).resolves.toBeUndefined();
  });
});

describe('registerBackgroundMessageHandler', () => {
  it('registers the handler so a backgrounded app is woken up', () => {
    const { push, messaging } = loadPush();

    push.registerBackgroundMessageHandler();

    expect(messaging.setBackgroundMessageHandler).toHaveBeenCalled();
  });

  it('is a no-op when Firebase is not configured', () => {
    const { push, firebaseApp, messaging } = loadPush();
    firebaseApp.getApp.mockImplementation(() => {
      throw new Error('no firebase');
    });

    push.registerBackgroundMessageHandler();

    expect(messaging.setBackgroundMessageHandler).not.toHaveBeenCalled();
  });
});

describe('handleBackgroundMessage', () => {
  it('shows the notification through Notifee', async () => {
    const { push, notifee } = loadPush();

    await push.handleBackgroundMessage({
      data: { title: 'Delivered', body: 'Your parcel arrived' },
    });

    expect(notifee.default.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Delivered' }),
    );
  });

  it('does not draw a second copy on Android when the SDK already showed it', async () => {
    const { Platform } = require('react-native');
    const { push, notifee } = loadPush();

    // The Firebase SDK displays a message that carries a `notification` block
    // by itself while the app is in the background.
    jest.replaceProperty(Platform, 'OS', 'android');
    await push.handleBackgroundMessage({
      notification: { title: 'From the console', body: 'A hand-typed test' },
    });

    expect(notifee.default.displayNotification).not.toHaveBeenCalled();
  });

  it('draws it on iOS, where the SDK never displays anything by itself', async () => {
    const { Platform } = require('react-native');
    const { push, notifee } = loadPush();

    jest.replaceProperty(Platform, 'OS', 'ios');
    await push.handleBackgroundMessage({
      notification: { title: 'From the console', body: 'A hand-typed test' },
    });

    expect(notifee.default.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'From the console' }),
    );
  });
});
