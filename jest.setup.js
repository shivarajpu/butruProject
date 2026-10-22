/**
 * `@react-native-community/geolocation` throws on import when its native module
 * is not linked, which is the case in Jest. Any suite that transitively reaches
 * `AddAddressModal` therefore failed to even mount. The stub keeps the
 * platform-level behaviour of the real module and lets each test drive the
 * outcome it needs.
 */

jest.mock('@react-native-community/geolocation', () => {
  const module = {
    __esModule: true,
    default: {
      getCurrentPosition: jest.fn((_success, error) =>
        error?.({ code: 2, message: 'Location unavailable in tests' }),
      ),
      watchPosition: jest.fn(() => 0),
      clearWatch: jest.fn(),
      requestAuthorization: jest.fn(),
    },
  };

  return module;
});

jest.mock('react-native-html-to-pdf', () => ({
  __esModule: true,
  generatePDF: jest.fn(async () => ({
    filePath: '/tmp/invoice.pdf',
    numberOfPages: 1,
  })),
}));

jest.mock('react-native-blob-util', () => {
  const actionViewIntent = jest.fn(async () => true);
  const openDocument = jest.fn(async () => undefined);

  return {
    __esModule: true,
    default: {
      ios: { openDocument },
      android: { actionViewIntent },
    },
  };
});

/**
 * Push notifications — Notifee, Firebase App and Firebase Messaging.
 *
 * All three are native modules, so importing them in Jest fails at import time
 * ("Cannot read property 'getConstants' of undefined"). `App.tsx` imports the
 * push service, which imports all three, so without these mocks every suite
 * that renders the app cannot even mount.
 *
 * The stubs keep the shape of the real API and record what was asked of them,
 * so a test can assert on the calls — the mocks are not just "do nothing".
 */

jest.mock('@notifee/react-native', () => {
  const notifee = {
    createChannel: jest.fn(async channel => channel.id),
    displayNotification: jest.fn(async (notification, _id) => notification.id ?? 'notifee-id'),
    requestPermission: jest.fn(async () => ({ authorizationStatus: 1 })),
    getNotificationSettings: jest.fn(async () => ({ authorizationStatus: 1 })),
    getInitialNotification: jest.fn(async () => null),
    onForegroundEvent: jest.fn(() => jest.fn()),
    onBackgroundEvent: jest.fn(() => jest.fn()),
    cancelNotification: jest.fn(async () => undefined),
  };

  return {
    __esModule: true,
    default: notifee,
    // The real enum values, so a test that asserts on `importance` compares
    // against the same numbers the device would use.
    AndroidImportance: { MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4, MAX: 5 },
    AndroidStyle: { BIGPICTURE: 0, BIGTEXT: 1, INBOX: 2, MESSAGING: 3 },
    AndroidVisibility: { SECRET: -1, PRIVATE: 0, PUBLIC: 1 },
    AuthorizationStatus: {
      NOT_DETERMINED: -1,
      DENIED: 0,
      AUTHORIZED: 1,
      PROVISIONAL: 2,
    },
    EventType: { UNKNOWN: -1, DISMISSED: 0, PRESS: 1, ACTION_PRESS: 2, DELIVERED: 3 },
    TriggerType: { TIMESTAMP: 0, INTERVAL: 1 },
  };
});

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  // The default app exists unless a test makes it throw, which is how the
  // "Firebase is not configured for this build" path is exercised.
  getApp: jest.fn(() => ({ name: '[DEFAULT]', options: {} })),
  getApps: jest.fn(() => [{ name: '[DEFAULT]', options: {} }]),
  getUtils: jest.fn(() => ({ appVersion: '1.0.0' })),
  initializeApp: jest.fn(async () => ({ name: '[DEFAULT]', options: {} })),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  __esModule: true,
  getMessaging: jest.fn(() => ({ app: { name: '[DEFAULT]' } })),
  getToken: jest.fn(async () => 'test-fcm-token'),
  deleteToken: jest.fn(async () => undefined),
  onMessage: jest.fn(() => jest.fn()),
  onTokenRefresh: jest.fn(() => jest.fn()),
  setBackgroundMessageHandler: jest.fn(),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(async () => null),
  firebase: jest.fn(),
}));
